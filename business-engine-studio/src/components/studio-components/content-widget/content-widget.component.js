import template from "./content-widget.component.html";

class ContentWidgetController {
    constructor($rootScope) {
        "ngInject";

        this.$rootScope = $rootScope;
    }

    $onInit() {}

    onReloadClick() {
        this.module[this.reloadMethod]();
    }

    onCloseClick() {
        this.module[this.closeMethod]();
    }

    onToggleAdvancedSearch() {
        var $advancedSearchBox = $('.advanced-search-box');
        if ($advancedSearchBox.length) {
            $advancedSearchBox.toggleClass('show');
        }
    }

    onExtraIcon1Click() {
        this.module[this.extraIcon1Method]();
    }

    onExtraIcon2Click() {
        this.module[this.extraIcon2Method]();
    }
}

const ContentWidgetComponent = {
    bindings: {
        title: "@",
        subtitle: "@",
        icon: "@",
        moduleType: "@",
        reloadMethod: "@",
        closeMethod: "@",
        awaitAction: "<",
        hideToolbar: "=",
        module: "<",
        extraIcon1: "@",
        extraIcon1Title: "@",
        extraIcon1Method: "@",
        extraIcon2: "@",
        extraIcon2Title: "@",
        extraIcon2Method: "@"
    },
    controller: ContentWidgetController,
    controllerAs: "$",
    templateUrl: template,
    transclude: true,
};

export default ContentWidgetComponent;