import template from "./select-action.component.html";

class SelectActionController {
    constructor($scope, $timeout, globalService) {
        "ngInject";

        this.$scope = $scope;
        this.$timeout = $timeout;
        this.globalService = globalService;

        $scope.$watch("$.model.Params", (newVal, oldVal) => {
            if (this.param && oldVal && newVal != oldVal) delete this.param;
            _.forEach((newVal || []), (c) => (delete c.IsEdited));
        });
    }

    $onInit() {
        this.action = this.action || {};
        this.model = this.model || {};
    }

    onActionChange() {
        this.populateActionParams();
    }

    onRefreshActionParamsClick() {
        this.populateActionParams();
    }

    populateActionParams() {
        this.model.Params = this.model.Params || [];

        _.filter(this.actions, (a) => {
            return a.ActionID == this.model.ActionID;
        }).map((action) => {
            this.globalService.bindParams(
                this.model.Params,
                action.Params || this.getServiceParams(action.ServiceID)
            );
        });

        _.forEach(this.model.Params, (p) => (p.IsEdited = false));
    }

    getServiceParams(serviceID) {
        var result = [];

        _.filter(this.services, (s) => {
            return s.ServiceID == serviceID;
        }).map((service) => {
            _.forEach(service.Params, (sp) => {
                result.push({ ParamName: sp.ParamName });
            });
        });

        return result;
    }

    onRowItemClick(param, $index) {
        if (this.param) {
            this.param.IsEdited = false;
            this.model.Params[this.model.Params.indexOf(this.param)] = _.clone(
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
        this.model.Params[this.model.Params.indexOf(this.param)] = _.clone(
            this.param
        );

        delete this.param;
    }

    onDeleteItemClick($index, $event) {
        this.model.Params.splice($index, 1);

        $event.stopPropagation();
    }
}

const SelectActionComponent = {
    require: {
        ngModel: "^ngModel",
    },
    bindings: {
        model: "=ngModel",
        action: "<",
        actions: "<",
        services: "<",
        datasource: "@",
        variables: "<",
        fields: "<",
        viewModels: "<",
    },
    controller: SelectActionController,
    controllerAs: "$",
    templateUrl: template,
};

export default SelectActionComponent;