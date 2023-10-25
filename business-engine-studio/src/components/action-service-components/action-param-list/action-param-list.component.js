import template from "./action-param-list.html";

class ActionParamListController {
    constructor($scope, globalService) {
        "ngInject";

        this.globalService = globalService;

        $scope.$watch("$.params", (newVal, oldVal) => {
            if (this.param && oldVal && newVal != oldVal) delete this.param;
            _.forEach((newVal || []), (c) => (delete c.IsEdited));
        });

        $scope.$watch("$.actionId", (newVal, oldVal) => {
            if (newVal != oldVal) {
                this.reinitParams();
            }
        });
    }

    $onInit() {
        if (this.actionId) this.reinitParams();
    }

    reinitParams() {
        _.map(this.params, (p) => (p.IsEdited = false));
        delete this.param;

        this.onRefreshActionParamsClick();
    }

    onRefreshActionParamsClick() {
        this.params = this.params || [];

        _.filter(this.actions, (a) => {
            return a.ActionID == this.actionId;
        }).map((action) => {
            this.globalService.bindParams(this.params, action.Params);
        });
    }

    onAddParamClick() {
        if (this.param) {
            this.param.IsEdited = false;
            this.params[this.params.indexOf(this.param)] = _.clone(this.param);

            delete this.param;
        }

        this.params = this.params || [];
        this.params.push({
            IsNew: true,
            IsEdited: true,
            IsCustomParam: true,
            OrderID: this.params.length + 1,
        });

        this.param = this.params[this.params.length - 1];
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

const ActionParamListComponent = {
    bindings: {
        params: "<",
        actionId: "<",
        actions: "<",
        datasource: "@",
        variables: "<",
        fields: "<",
        viewModels: "<",
        actionParams: "<",
    },
    controller: ActionParamListController,
    controllerAs: "$",
    templateUrl: template,
    transclude: true,
};

export default ActionParamListComponent;