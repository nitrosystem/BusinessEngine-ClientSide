import template from "./select-service.component.html";

class SelectServiceController {
    constructor($scope, $timeout, globalService, apiService) {
        "ngInject";

        this.$scope = $scope;
        this.$timeout = $timeout;
        this.globalService = globalService;
        this.apiService = apiService;

        $scope.$watch("$.action.Params", (newVal, oldVal) => {
            if (this.param && oldVal && newVal != oldVal) delete this.param;
            _.forEach((newVal || []), (c) => (delete c.IsEdited));
        });
    }

    $onInit() {
        this.action = this.action || {};

        if (this.serviceType)
            this.services = _.filter(this.services || [], (s) => {
                return s.ServiceSubtype == this.serviceType;
            });

        this.populateServiceParams();
    }

    onServiceChange() {
        this.populateServiceParams();
    }

    onRefreshServiceParamsClick() {
        this.controller.running = "get-service-params";
        this.controller.awaitAction = {
            title: "Loading Service Params",
            subtitle: "Just a moment for loading service params...",
        };

        this.apiService.get("Studio", "GetServiceParams", { serviceID: this.action.ServiceID }).then((data) => {
            _.filter(this.services, (s) => {
                return s.ServiceID == this.action.ServiceID;
            }).map((service) => {
                service.Params = data;
            });

            this.populateServiceParams();

            delete this.controller.running;
            delete this.controller.awaitAction;
        });
    }

    populateServiceParams() {
        this.action.Params = this.action.Params || [];

        _.filter(this.services, (s) => {
            return s.ServiceID == this.action.ServiceID;
        }).map((service) => {
            this.globalService.bindParams(this.action.Params, service.Params);
        });

        _.forEach(this.action.Params, (p) => (p.IsEdited = false));
    }

    onAddServiceClick() {
        this.$scope.$emit("onGotoPage", { page: "create-service" });
    }

    onRowItemClick(param, $index) {
        if (this.param) {
            this.param.IsEdited = false;
            this.action.Params[this.action.Params.indexOf(this.param)] = _.clone(
                this.param
            );

            delete this.param;
        }

        this.param = param;
        this.param.IsNew = false;
        this.param.IsEdited = true;
        this.param.OrderID = $index + 1;

        this.$timeout(() => {
            this.$scope.$broadcast("onEditParam");
        }, 500);
    }

    onDoneClick() {
        this.param.IsEdited = false;
        this.action.Params[this.action.Params.indexOf(this.param)] = _.clone(
            this.param
        );

        delete this.param;
    }

    onDeleteItemClick($index, $event) {
        this.action.Params.splice($index, 1);

        $event.stopPropagation();
    }
}

const SelectServiceComponent = {
    bindings: {
        controller: "<",
        action: "<",
        services: "<",
        serviceType: "@",
        datasource: "@",
        variables: "<",
        fields: "<",
        viewModels: "<",
        actionParams: "<",
    },
    controller: SelectServiceController,
    controllerAs: "$",
    templateUrl: template,
};

export default SelectServiceComponent;