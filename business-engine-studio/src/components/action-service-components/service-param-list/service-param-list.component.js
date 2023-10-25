import template from "./service-param-list.html";

class ServiceParamListController {
    constructor($scope, $timeout, globalService, apiService) {
        ("ngInject");

        this.$scope = $scope;
        this.$timeout = $timeout;
        this.globalService = globalService;
        this.apiService = apiService;

        $scope.$watch("$.params", (newVal, oldVal) => {
            if (this.param && oldVal && newVal != oldVal) delete this.param;
            _.forEach((newVal || []), (c) => (delete c.IsEdited));
        });

        $scope.$watch("$.serviceId", (newVal, oldVal) => {
            if (newVal != oldVal) {
                this.reinitParams();
            }
        });
    }

    $onInit() {
        this.params = this.params || [];
        _.map(this.params, (p) => (p.IsEdited = false));
    }

    reinitParams() {
        _.map(this.params, (p) => (p.IsEdited = false));
        delete this.param;

        this.populateServiceParams();
    }

    onRefreshServiceParamsClick() {
        this.controller.running = "get-service-params";
        this.controller.awaitAction = {
            title: "Loading Service Params",
            subtitle: "Just a moment for loading service params...",
        };

        this.apiService.get("Studio", "GetServiceParams", { serviceID: this.serviceId }).then((data) => {
            _.filter(this.services, (s) => {
                return s.ServiceID == this.serviceId;
            }).map((service) => {
                service.Params = data;
            });

            this.populateServiceParams();

            delete this.controller.running;
            delete this.controller.awaitAction;
        });
    }

    populateServiceParams() {
        this.params = this.params || [];

        _.filter(this.services, (s) => {
            return s.ServiceID == this.serviceId;
        }).map((service) => {
            this.globalService.bindParams(this.params, service.Params);
        });
    }

    onRowItemClick(param, $index) {
        if (this.param) {
            this.param.IsEdited = false;
            this.params[this.params.indexOf(this.param)] = _.clone(this.param);

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
        this.params[this.params.indexOf(this.param)] = _.clone(this.param);

        delete this.param;
    }

    onDeleteItemClick($index, $event) {
        this.params.splice($index, 1);

        $event.stopPropagation();
    }
}

const ServiceParamListComponent = {
    bindings: {
        controller: "<",
        params: "<",
        serviceId: "<",
        services: "<",
        datasource: "@",
        variables: "<",
        fields: "<",
        viewModels: "<",
        actionParams: "<",
    },
    controller: ServiceParamListController,
    controllerAs: "$",
    templateUrl: template,
    transclude: true,
};

export default ServiceParamListComponent;