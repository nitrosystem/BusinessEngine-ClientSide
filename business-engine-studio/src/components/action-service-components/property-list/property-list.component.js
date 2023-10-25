import template from "./property-list.component.html";

class PropertyListController {
    constructor($scope, $timeout) {
        "ngInject";

        this.$scope = $scope;
        this.$timeout = $timeout;

        this.evalTypes = [{ Text: "=", Value: "=" }];

        $scope.$watch("$.properties", (newVal, oldVal) => {
            if (this.property && oldVal && newVal != oldVal) delete this.property;
            _.forEach((newVal || []), (c) => (delete c.IsEdited));
        });
    }

    $onInit() {
        this.properties = this.properties || [];
    }

    onAddPropertyClick() {
        if (this.property) {
            this.property.IsEdited = false;
            this.properties[this.properties.indexOf(this.property)] = _.clone(
                this.property
            );

            delete this.property;
        }

        this.properties = this.properties || [];
        this.properties.push({
            IsNew: true,
            IsEdited: true,
            EvalType: "=",
            GroupName: "Group" + this.properties.length + 1,
            OrderID: this.properties.length + 1,
        });

        this.property = this.properties[this.properties.length - 1];

        this.$timeout(() => {
            this.$scope.$broadcast("onEditProperty");
        }, 500);
    }

    onRowItemClick(property, $index) {
        if (this.property) {
            this.property.IsEdited = false;
            this.properties[this.properties.indexOf(this.property)] = _.clone(
                this.property
            );

            delete this.property;
        }

        this.property = property;
        this.property.IsNew = false;
        this.property.IsEdited = true;
        this.property.OrderID = $index + 1;
    }

    onDoneClick() {
        this.property.IsEdited = false;
        this.properties[this.properties.indexOf(this.property)] = _.clone(
            this.property
        );

        delete this.property;
    }

    onDeleteItemClick($index, $event) {
        this.properties.splice($index, 1);

        $event.stopPropagation();
    }
}

const PropertyListComponent = {
    require: {
        ngModel: "^ngModel",
    },
    bindings: {
        properties: "=ngModel",
        datasource: "@",
        variables: "<",
        fields: "<",
        viewModels: "<",
        actionProperties: "<",
    },
    controller: PropertyListController,
    controllerAs: "$",
    templateUrl: template,
    transclude: true,
};

export default PropertyListComponent;