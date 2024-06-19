export class EntitiesController {
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
                if (!this.entitiesBackup)
                    this.entitiesBackup = angular.copy(this.entities);
                else
                    this.entities = angular.copy(this.entitiesBackup);

                this.entities = _.filter(this.entities, (e) => {
                    return (!this.filter.EntityName || e.EntityName.indexOf(this.filter.EntityName) >= 0) &&
                        (!this.filter.EntityType || e.EntityType == this.filter.EntityType) &&
                        (!this.filter.IsReadonly || e.IsReadonly)
                })
            }
        }, true);

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        this.running = "get-entities";
        this.awaitAction = {
            title: "Loading Entities",
            subtitle: "Just a moment for loading entities...",
        };

        this.apiService.get("Studio", "GetEntities").then(
            (data) => {
                this.entities = data.Entities;

                var columns = 0;
                _.forEach((this.entities), (e) => { columns += (e.Columns || []).length; });
                this.entitiesColumnsCount = columns;

                this.onFocusModule();

                delete this.running;
                delete this.awaitAction;
            },
            (error) => {
                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                this.notifyService.error(error.data.Message);

                delete this.running;
            }
        );
    }

    onFocusModule() {
        this.$rootScope.explorerExpandedItems.push(...["entities"]);
        this.$rootScope.explorerCurrentItem = "entities";
    }

    onAddEntityClick() {
        this.$scope.$emit("onGotoPage", { page: "create-entity" });
    }

    onEditEntityClick(id, title) {
        this.$scope.$emit("onGotoPage", {
            page: "create-entity",
            id: id,
            title: title,
        });
    }

    onDeleteEntityClick(id, index) {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary entity!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "get-entities";
                this.awaitAction = {
                    title: "Remove Entity",
                    subtitle: "Just a moment for removing entity...",
                };

                this.apiService.post("Studio", "DeleteEntity", { ID: id }).then(
                    (data) => {
                        this.entities.splice(index, 1);

                        this.notifyService.success("Entity deleted has been successfully");

                        this.$rootScope.refreshSidebarExplorerItems();

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

    onTableModeClick() {
        this.displayMode = 'table';
    }

    onBoxModeClick() {
        this.displayMode = 'box';
    }
}