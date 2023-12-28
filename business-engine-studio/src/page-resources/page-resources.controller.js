import swal from "sweetalert";
import { GlobalSettings } from "../configs/global.settings";

export class PageResourcesController {
    constructor($scope, $rootScope, $timeout, studioService, Upload, globalService, apiService, notificationService) {
        "ngInject";

        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$timeout = $timeout;
        this.uploadService = Upload;
        this.globalService = globalService;
        this.apiService = apiService;
        this.notifyService = notificationService;

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        $scope.$emit('onChangeActivityBar', {
            name: 'page-resources',
            title: "Page Resources",
            disableActivityBarCallback: true
        })

        this.onPageLoad();
    }

    onPageLoad() {
        const id = this.globalService.getParameterByName("id");
        const mode = this.globalService.getParameterByName("mode");
        if (mode == 'module-resources' && id) {
            this.running = "get-module-resources";
            this.awaitAction = {
                title: "Loading module resources",
                subtitle: "Just a moment for loading the module resources...",
            };

            this.apiService.get("Studio", "GetModuleResources", { moduleID: id }).then((data) => {
                    this.page = { Resources: data }

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
        } else {
            this.running = "get-pages";
            this.awaitAction = {
                title: "Loading Pages",
                subtitle: "Just a moment for loading pages...",
            };

            this.apiService.get("Studio", "GetPages").then((data) => {
                    this.pages = data;

                    delete this.running;
                    delete this.awaitAction;
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
    }

    onFocusModule() {
        this.$scope.$emit('onChangeActivityBar', { name: 'page-resources' })
    }

    onPageItemClick(page) {
        if (this.page == page) return;

        this.page = page;

        this.running = "get-page-resources";
        this.awaitAction = {
            title: "Loading Page Resources",
            subtitle: "Just a moment for loading page resources...",
        };

        this.apiService.get("Studio", "GetPageResources", { cmsPageID: this.page.TabID }).then((data) => {
            this.page.Resources = data;

            delete this.running;
            delete this.awaitAction;
        });
    }

    setResourceStatus(resourceID, isActive) {
        this.running = "set-resource-status";
        this.awaitAction = {
            title: "Disable/Enable Loading Resource",
            subtitle: "Just a moment for change resource loading status...",
        };

        this.apiService.post("Studio", "SetResourceStatus", { ResourceID: resourceID, IsActvive: isActive }).then((data) => {
                this.notifyService.success(
                    "Resource change status has been successfully"
                );

                delete this.running;
                delete this.awaitAction;
            },
            (error) => {
                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc =
                    this.globalService.getErrorHtmlFormat(error);

                this.notifyService.error(error.data.Message);

                delete this.running;
            });
    }

    onDeletePageResourceClick(module, item) {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary pageResource!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "remove-page-resources";
                this.awaitAction = {
                    title: "Remove PageResource",
                    subtitle: "Just a moment for removing pageResource...",
                };

                this.apiService.post("Studio", "DeletePageResource", { ID: item.ResourceID }).then(
                    (data) => {
                        module.splice(module.indexOf(item), 1);

                        this.notifyService.success("PageResource deleted has been successfully");

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

    onGotoModuleBuilderClick(module) {
        this.$scope.$emit("onGotoPage", {
            page: "module-builder",
            id: module[0].ModuleID,
        })
    }

    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }
}