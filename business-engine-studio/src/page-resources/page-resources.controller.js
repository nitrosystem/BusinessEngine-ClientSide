import swal from "sweetalert";
import { GlobalSettings } from "../configs/global.settings";

export class PageResourcesController {
    constructor($scope, $timeout, studioService, Upload, globalService, apiService, notificationService) {
        "ngInject";

        this.$scope = $scope;
        this.$timeout = $timeout;
        this.uploadService = Upload;
        this.globalService = globalService;
        this.apiService = apiService;
        this.notifyService = notificationService;

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        $scope.$emit('onChangeActivityBar', { name: 'page-resources' })

        this.onPageLoad();
    }

    onPageLoad() {
        this.running = "get-pages";
        this.awaitAction = {
            title: "Loading Pages",
            subtitle: "Just a moment for loading pages...",
        };

        this.apiService.get("Studio", "GetPages").then((data) => {
            this.pages = data;

            delete this.running;
            delete this.awaitAction;
        });
    }

    onFocusModule() {
        this.$scope.$emit('onChangeActivityBar', { name: 'page-resources' })
    }

    onPageItemClick(page) {
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
        this.running = "set-resourcestatus";
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

    onEditPageResourceClick(id, title) {
        var subParams = {};
        if (this.isFieldPageResources) subParams.type = "field";

        this.$scope.$emit("onGotoPage", {
            page: "create-pageResource",
            parentID: this.parentID,
            id: id,
            title: title,
            subParams: subParams,
        });
    }

    onDeletePageResourceClick(id, index) {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary pageResource!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "get-pageResources";
                this.awaitAction = {
                    title: "Remove PageResource",
                    subtitle: "Just a moment for removing pageResource...",
                };

                this.apiService.post("Studio", "DeletePageResource", { ID: id }).then(
                    (data) => {
                        this.pageResources.splice(index, 1);

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

    disposeWorkingMode() {
        this.$scope.$emit("onHideRightWidget");

        this.$timeout(() => {
            delete this.workingMode;
        }, 200);
    }


    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }

    onInstallPageResourceClick() {
        this.workingMode = "install-pageResource";
        this.$scope.$emit("onShowRightWidget");

        this.step = 1;
    }

    onUploadPageResourcePackage($files, $file, $newFiles, $duplicateFiles, $invalidFiles, $event) {
        if ($file) {
            this.running = "upload-pageResource";
            this.awaitAction = {
                title: "Uploading PageResources",
                subtitle: "Just a moment for uploading pageResource...",
            };

            this.uploadService.upload({
                url: window.bEngineGlobalSettings.apiBaseUrl + 'BusinessEngine/API/Studio/UploadPageResourcePackage',
                headers: GlobalSettings.apiHeaders,
                data: { files: $file },
            }).then((data) => {
                this.pageResource = JSON.parse(data.data.PageResourceJson);
                this.pageResourceInstallDto = {
                    PageResourceUnzipedPath: data.data.PageResourceUnzipedPath,
                    ManifestFilePath: data.data.ManifestFilePath
                };

                this.step = 2;

                delete this.running;
                delete this.awaitAction;
            }, (error) => {
                if (error.status == 401) location.reload(); // if user is logoff then refresh page for redirect to login page

                delete this.running;
                delete this.awaitAction;
            }, (evt) => {
                //var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                //file.Progress = progressPercentage;
            });
        }
    }

    onNextInstallPageResourceStepClick() {
        this.step = 3;

        this.running = "install-pageResources";
        this.awaitAction = {
            title: "Install PageResource",
            subtitle: "Just a moment for installing pageResource...",
        };

        this.apiService.post("Studio", "InstallPageResource", null, {
            pageResourceUnzipedPath: this.pageResourceInstallDto.PageResourceUnzipedPath,
            manifestFilePath: this.pageResourceInstallDto.ManifestFilePath,
        }).then((data) => {
                this.step = 4;
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

    onDoneInstallPageResourceClick() {
        location.reload();
    }

    onCancelInstallPageResourceClick() {
        this.disposeWorkingMode();
    }
}