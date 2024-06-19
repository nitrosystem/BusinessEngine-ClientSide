import swal from "sweetalert";
import { GlobalSettings } from "../configs/global.settings";

export class ExtensionsController {
    constructor($scope, $timeout, Upload, studioService, globalService, apiService, notificationService) {
        "ngInject";

        this.$scope = $scope;
        this.$timeout = $timeout;
        this.uploadService = Upload;
        this.globalService = globalService;
        this.apiService = apiService;
        this.notifyService = notificationService;

        this.stepsCallback = { 3: this.monitoringInstall };
        this.serviceBuilder = {};

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        $scope.$emit('onChangeActivityBar', {
            name: 'extensions',
            title: "Extensions",
            disableActivityBarCallback: true
        });

        this.onPageLoad();
    }

    onPageLoad() {
        this.running = "get-extensions";
        this.awaitAction = {
            title: "Loading Extensions",
            subtitle: "Just a moment for loading extensions...",
        };

        this.apiService.get("Studio", "GetExtensions").then((data) => {
            this.extensions = data.Extensions;
            this.availableExtensions = data.AvailableExtensions;

            delete this.running;
            delete this.awaitAction;
        });
    }

    onFocusModule() {
        this.$scope.$emit('onChangeActivityBar', { name: 'extensions' })
    }

    onInstallAvailableExtension(item, $index) {
        this.running = "install-available-extensions";
        this.awaitAction = {
            title: `Uzip & Ready ${item.extensionFile}`,
            subtitle: `Just a moment for unzip ${item.extensionName} file and ready to install...`,
            extIndex: $index
        };

        this.apiService.post("Studio", "InstallAvailableExtensions", item).then((data) => {
                this.extension = JSON.parse(data.ExtensionJson);
                this.extensionInstallDto = {
                    ExtensionUnzipedPath: data.ExtensionUnzipedPath,
                    ManifestFilePath: data.ManifestFilePath
                };

                this.workingMode = "install-extension";
                this.$scope.$emit("onShowRightWidget");
                this.step = 2;

                this.availableExtensions.splice($index, 1)

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

    onInstallExtensionClick() {
        this.workingMode = "install-extension";
        this.$scope.$emit("onShowRightWidget");

        this.step = 1;
    }

    onUploadExtensionPackage($files, $file, $newFiles, $duplicateFiles, $invalidFiles, $event) {
        if ($file) {
            this.running = "upload-extension";
            this.awaitAction = {
                title: "Uploading Extensions",
                subtitle: "Just a moment for uploading extension...",
            };

            this.uploadService.upload({
                url: window.bEngineGlobalSettings.apiBaseUrl + 'BusinessEngine/API/Studio/UploadExtensionPackage',
                headers: GlobalSettings.apiHeaders,
                data: { files: $file },
            }).then((data) => {
                this.extension = JSON.parse(data.data.ExtensionJson);
                this.extensionInstallDto = {
                    ExtensionUnzipedPath: data.data.ExtensionUnzipedPath,
                    ManifestFilePath: data.data.ManifestFilePath
                };

                this.monitoringFilePath = data.data.MonitoringFilePath;
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

    onInstallExtensionStepClick() {
        this.step = 3;
        this.stepsCallback[this.step].apply(this);

        this.running = "install-extensions";
        this.awaitAction = {
            title: "Install Extension",
            subtitle: "Just a moment for installing extension...",
        };

        this.apiService.post("Studio", "InstallExtension", null, {
            extensionUnzipedPath: this.extensionInstallDto.ExtensionUnzipedPath,
            manifestFilePath: this.extensionInstallDto.ManifestFilePath,
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

    onDoneInstallExtensionClick() {
        location.reload();
    }

    onCancelInstallExtensionClick() {
        location.reload();
    }

    onDeleteExtensionClick(id, $index) {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary extension!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "remove-extension";
                this.awaitAction = {
                    title: "Remove Extension",
                    subtitle: "Just a moment for removing the extension...",
                };

                this.apiService.post("Studio", "DeleteExtension", { ID: id }).then(
                    (data) => {
                        this.extensions.splice($index, 1);

                        this.notifyService.success("Extension deleted has been successfully");

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
        location.reload();
    }

    onCloseWindow() {
        location.reload();
    }

    monitoringInstall() {
        var index = 1;
        this.monitoringTimer = setInterval(() => {
            fetch(this.monitoringFilePath + '?ver=' + index++).then((stream) => { return stream.text(); })
                .then((content) => {
                    $('.monitor-install-extension').text(content);
                })
                .catch((err) => {
                    console.log(err)
                });

            $(".monitor-install-extension").animate({ scrollTop: $('.monitor-install-extension').prop("scrollHeight") }, 400);

        }, 500);
    }
}