import template from "./quick-input.component.html";

class QuickInputController {
  constructor($filter, $scope, $element, apiService, globalService) {
    "ngInject";

    $($element[0]).appendTo($("#quick-input"));

    this.$scope = $scope;
  }

  $onInit() {}
}

const QuickInputComponent = {
  bindings: {
    items: "<",
    itemTitle: "@",
    itemSubtitle: "@",
    itemIcon: "@",
    searchPlaceholder: "@",
  },
  controller: QuickInputController,
  controllerAs: "$",
  templateUrl: template,
};

export default QuickInputComponent;
