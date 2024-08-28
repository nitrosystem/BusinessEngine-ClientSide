import swal from "sweetalert";

export class DefinedListsController {
    constructor(
        $scope,
        $rootScope,
        studioService,
        globalService,
        apiService,
        notificationService
    ) {
        "ngInject";

        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.globalService = globalService;
        this.apiService = apiService;
        this.notifyService = notificationService;
        this.filter = {};

        $scope.$watch('$.filter', (oldVal, newVal) => {
            if (oldVal != newVal && newVal) {
                if (!this.definedListsBackup)
                    this.definedListsBackup = angular.copy(this.definedLists);
                else
                    this.definedLists = angular.copy(this.definedListsBackup);

                this.definedLists = _.filter(this.definedLists, (e) => {
                    return (!this.filter.DefinedListName || e.DefinedListName.indexOf(this.filter.DefinedListName) >= 0) &&
                        (!this.filter.DefinedListType || e.DefinedListType == this.filter.DefinedListType) &&
                        (!this.filter.IsReadonly || e.IsReadonly)
                })
            }
        }, true);

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        this.running = "get-defined-lists";
        this.awaitAction = {
            title: "Loading DefinedLists",
            subtitle: "Just a moment for loading definedLists...",
        };

        this.apiService.get("Studio", "GetDefinedLists").then((data) => {
            this.definedLists = data;

            var listItems = 0;
            _.forEach((this.definedLists), (e) => { listItems += (e.Items ?? []).length; });
            this.definedListItemsCount = listItems;

            this.onFocusModule();

            delete this.running;
            delete this.awaitAction;
        }, (error) => {
            if (error.status == 401) this.$rootScope.$broadcast('onUnauthorized401', { error: error }); // if user is logoff then refresh page for redirect to login page

            this.awaitAction.isError = true;
            this.awaitAction.subtitle = error.statusText;
            this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

            delete this.running;
        });
    }

    onFocusModule() {
        this.$rootScope.explorerExpandedItems.push(...["definedLists"]);
        this.$rootScope.explorerCurrentItem = "definedLists";
    }

    onAddDefinedListClick() {
        this.$scope.$emit("onGotoPage", { page: "create-defined-list" });
    }

    onEditDefinedListClick(id, title) {
        this.$scope.$emit("onGotoPage", {
            page: "create-defined-list",
            id: id,
            title: title,
        });
    }

    onDeleteDefinedListClick(id, index) {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary definedList!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "get-defined-lists";
                this.awaitAction = {
                    title: "Remove DefinedList",
                    subtitle: "Just a moment for removing definedList...",
                };

                this.apiService.post("Studio", "DeleteDefinedList", { ID: id }).then((data) => {
                    this.definedLists.splice(index, 1);

                    this.notifyService.success("DefinedList deleted has been successfully");

                    this.$rootScope.refreshSidebarExplorerItems();

                    delete this.awaitAction;
                    delete this.running;
                }, (error) => {
                    if (error.status == 401) this.$rootScope.$broadcast('onUnauthorized401', { error: error }); // if user is logoff then refresh page for redirect to login page

                    this.awaitAction.isError = true;
                    this.awaitAction.subtitle = error.statusText;
                    this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                    delete this.running;
                });
            }
        });
    }

    onTableModeClick() {
        this.displayMode = 'table';
    }

    onBoxModeClick() {
        this.displayMode = 'box';
    }
}