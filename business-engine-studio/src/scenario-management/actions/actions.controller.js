import swal from "sweetalert";

export class ActionsController {
    constructor($scope, $rootScope, globalService, apiService, studioService, notificationService) {
        "ngInject";

        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.globalService = globalService;
        this.apiService = apiService;
        this.studioService = studioService;
        this.notifyService = notificationService;

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        this.running = "get-actions";
        this.awaitAction = {
            title: "Loading Actions",
            subtitle: "Just a moment for loading actions...",
        };

        this.parentID = this.globalService.getParameterByName("parent");
        this.isFieldActions = this.globalService.getParameterByName("type") == "field";

        const serviceName = this.isFieldActions ? "GetFieldActions" : "GetActions";

        this.apiService
            .get("Studio", serviceName, { parentID: this.parentID })
            .then((data) => {
                this.allActions = data.Actions;
                this.module = data.Module;

                var moduleActions = _.filter(this.allActions, (a) => { return !a.FieldID });
                this.moduleActions = this.populateActions(moduleActions);

                var items = {};
                var groups = _.groupBy(_.filter(this.allActions, (a) => { return a.FieldID }), 'FieldName');
                for (var key in groups) {
                    items[key] = this.populateActions(groups[key]);
                }
                this.fieldActions = items;

                this.onFocusModule();

                delete this.running;
                delete this.awaitAction;
            });
    }

    onFocusModule() {
        const items = this.studioService.createSidebarExplorerPath(this.module.ModuleID, "Module");
        this.$rootScope.explorerExpandedItems.push(...items);
        this.$rootScope.explorerExpandedItems.push(this.module.ModuleType.toLowerCase() + '-modules');

        this.$rootScope.explorerCurrentItem = this.module.ModuleID;
    }

    populateActions(actions) {
        var result = [];

        const findChildActions = (parent) => {
            parent.Childs = [];
            let childActions = _.filter(actions, (a) => { return a.ParentID == parent.ActionID; });
            let index = 0;
            _.forEach(_.sortBy(childActions, ["ViewOrder"]), (action) => {
                if (index == 0) action.IsFirst = true;
                if (index == childActions.length - 1) action.IsLast = true;

                parent.Childs.push(action);

                index++;

                findChildActions(action);
            });
        }

        let parentActions = _.filter(actions, (a) => { return !a.ParentID; });
        let index = 0;
        _.forEach(_.sortBy(parentActions, ["ViewOrder"]), (action) => {
            if (index == 0) action.IsFirst = true;
            if (index == parentActions.length - 1) action.IsLast = true;

            result.push(action);

            index++;

            findChildActions(action);
        });

        return result;
    }

    onTableModeClick() {
        this.displayMode = 'table';
    }

    onBoxModeClick() {
        this.displayMode = 'box';
    }

    onAddActionClick() {
        var subParams = {};
        if (this.isFieldActions) subParams.type = "field";

        this.$scope.$emit("onGotoPage", {
            page: "create-action",
            parentID: this.parentID,
            subParams: subParams,
        });
    }

    onEditActionClick(id, title, fieldID) {
        var subParams = {};
        if (fieldID) subParams.type = "field";

        this.$scope.$emit("onGotoPage", {
            page: "create-action",
            parentID: fieldID || this.module.ModuleID,
            id: id,
            title: title,
            subParams: subParams,
        });
    }

    onEditServiceClick(serviceID) {
        this.$scope.$emit("onGotoPage", {
            page: 'create-service',
            id: serviceID
        });
    }

    onDeleteActionClick(id, index) {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary action!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "get-actions";
                this.awaitAction = {
                    title: "Remove Action",
                    subtitle: "Just a moment for removing action...",
                };

                this.apiService.post("Studio", "DeleteAction", { ID: id }).then(
                    (data) => {
                        this.allActions.splice(index, 1);

                        this.notifyService.success("Action deleted has been successfully");

                        delete this.awaitAction;
                        delete this.running;
                    },
                    (error) => {
                        this.awaitAction.isError = true;
                        this.awaitAction.subtitle = error.statusText;
                        this.awaitAction.desc =
                            this.globalService.getErrorHtmlFormat(error);

                        this.notifyService.error(error.data.Message);

                        delete this.running;
                    }
                );
            }
        });
    }

    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }
}