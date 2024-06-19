import template from "./condition-list.component.html";

class ConditionListController {
    constructor($scope, $timeout) {
        "ngInject";

        this.$scope = $scope;
        this.$timeout = $timeout;

        this.evalTypes = [
            { Text: "=", Value: "=" },
            { Text: "!=", Value: "!=" },
            { Text: ">", Value: ">" },
            { Text: ">", Value: ">=" },
            { Text: "<", Value: "<" },
            { Text: "<=", Value: "<=" },
            { Text: "In", Value: "in" },
            { Text: "Not In", Value: "not in" },
            { Text: "Containts", Value: "like" },
            { Text: "Not Containts", Value: "not like" },
            { Text: "Starts With", Value: "=:" },
            { Text: "Ends With", Value: ":=" },
            { Text: "Is Filled", Value: "isfilled" },
            { Text: "Is Null", Value: "isnull" },
            { Text: "Date Is Equal", Value: "date=" },
            { Text: "Time Is Equal", Value: "time=" },
            { Text: "Range", Value: "<=>" },
            { Text: "Is Error", Value: "iserror" },
            { Text: "Is Completed", Value: "iscompleted" },
        ];

        $scope.$watch("$.conditions", (newVal, oldVal) => {
            if (this.condition && oldVal && newVal != oldVal) delete this.condition;
            if (!this.isEditingForm) _.forEach((newVal || []), (c) => (delete c.IsEdited));
        });
    }

    $onInit() {
        this.conditions = this.conditions || [];
        _.map(this.conditions, (c) => (c.IsEdited = false));

        delete this.condition;

        this.$timeout(() => {
            this.isEditingForm = true;
        });
    }

    onAddConditionClick() {
        if (this.condition) {
            this.condition.IsEdited = false;
            this.conditions[this.conditions.indexOf(this.condition)] = _.clone(
                this.condition
            );

            delete this.condition;
        }

        this.conditions = this.conditions || [];
        this.conditions.push({
            IsNew: true,
            IsEdited: true,
            EvalType: "=",
            GroupName: "Group" + this.conditions.length + 1,
            ViewOrder: this.conditions.length + 1,
        });

        this.condition = this.conditions[this.conditions.length - 1];

        this.$timeout(() => {
            this.$scope.$broadcast("onEditCondition");
        }, 500);
    }

    onRowItemClick(condition, $index) {
        if (this.condition) {
            this.condition.IsEdited = false;
            this.conditions[this.conditions.indexOf(this.condition)] = _.clone(
                this.condition
            );

            delete this.condition;
        }

        this.condition = condition;
        this.condition.IsNew = false;
        this.condition.IsEdited = true;
        this.condition.ViewOrder = $index + 1;
    }

    onDoneClick() {
        this.condition.IsEdited = false;
        this.conditions[this.conditions.indexOf(this.condition)] = _.clone(
            this.condition
        );

        delete this.condition;
        delete this.isEditingForm;
    }

    onDeleteItemClick($index, $event) {
        this.conditions.splice($index, 1);

        $event.stopPropagation();
    }
}

const ConditionListComponent = {
    require: {
        ngModel: "^ngModel",
    },
    bindings: {
        conditions: "=ngModel",
        datasource: "@",
        variables: "<",
        fields: "<",
        viewModels: "<",
        actionConditions: "<",
    },
    controller: ConditionListController,
    controllerAs: "$",
    templateUrl: template,
    transclude: true,
};

export default ConditionListComponent;