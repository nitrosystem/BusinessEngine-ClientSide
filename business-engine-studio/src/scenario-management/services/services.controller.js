import swal from "sweetalert";

export class ServicesController {
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

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        this.running = "get-services";
        this.awaitAction = {
            title: "Loading Services",
            subtitle: "Just a moment for loading services...",
        };

        this.apiService.get("Studio", "GetServices").then((data) => {
            this.services = data.Services;

            this.onFocusModule();

            delete this.running;
            delete this.awaitAction;
        });
    }

    onFocusModule() {
        this.$rootScope.explorerExpandedItems.push(...["services"]);
        this.$rootScope.explorerCurrentItem = "services";
    }

    onAddServiceClick() {
        this.$scope.$emit("onGotoPage", { page: "create-service" });
    }

    onEditServiceClick(id, title) {
        this.$scope.$emit("onGotoPage", {
            page: "create-service",
            id: id,
            title: title,
        });
    }

    onDeleteServiceClick(id, index) {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary service!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "get-services";
                this.awaitAction = {
                    title: "Remove Service",
                    subtitle: "Just a moment for removing service...",
                };

                this.apiService.post("Studio", "DeleteService", { ID: id }).then(
                    (data) => {
                        this.services.splice(index, 1);

                        this.notifyService.success("Service deleted has been successfully");

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
}