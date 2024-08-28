import swal from "sweetalert";
import { GlobalSettings } from "../configs/global.settings";

export class ExtensionsController {
    constructor($scope, $rootScope, $timeout, Upload, studioService, globalService, apiService, notificationService) {
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
            name: 'extensions',
            title: 'Extensions',
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
        this.$scope.$emit('onChangeActivityBar', { name: 'extensions' })
    }

    onInstallAvailableExtension(item, $index) {
        this.running = "install-available-extensions";
        this.awaitAction = {
            title: `Unzip & Ready ${item.extensionFile}`,
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
            this.extInstalingStep = 2;

            this.availableExtensions.splice($index, 1);

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

    onInstallExtensionClick() {
        this.workingMode = "install-extension";
        this.$scope.$emit("onShowRightWidget");

        this.extInstalingStep = 1;
    }

    onUploadExtensionPackage($files, $file, $newFiles, $duplicateFiles, $invalidFiles, $event) {
        if ($file) {
            this.running = "upload-extension";
            this.awaitAction = {
                title: "Uploading Extensions",
                subtitle: "Just a moment for uploading extension...",
                showProgress: true
            };

            this.apiService.upload('BusinessEngine/API/Studio/UploadExtensionPackage', $file).then((data) => {
                this.extension = data;
                this.extInstalingStep = 2;

                delete this.running;
                delete this.awaitAction;
            }, (error) => {
                if (error.status == 401) this.$rootScope.$broadcast('onUnauthorized401', { error: error }); // if user is logoff then refresh page for redirect to login page

                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                delete this.running;
            }, (evt) => {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                $('.progress-bar').css('width', progressPercentage + '%')
            });
        }
    }

    onInstallExtensionStepClick() {
        this.extInstalingStep = 3;

        this.running = "install-extensions";
        this.awaitAction = {
            title: "Install Extension",
            subtitle: "Just a moment for installing extension...",
            showProgress: true,
        };

        var monitoringFileID = this.globalService.generateGuid();
        this.monitoringFile = `/Portals/${GlobalSettings.portalID}-System/BusinessEngine/MonitoringProgress/Monitoring_${monitoringFileID}.txt`;
        this.progressValueFile = `/Portals/${GlobalSettings.portalID}-System/BusinessEngine/MonitoringProgress/ProgressValue_${monitoringFileID}.txt`;

        this.monitorProgress();

        this.apiService.post("Studio", "InstallExtension", null, {
            installTemporaryItemID: this.extension.InstallTemporaryItemID,
            monitoringFileID: monitoringFileID
        }).then((data) => {
            this.extInstalingStep = 4;

            delete this.awaitAction;
            delete this.running;
        }, (error) => {
            if (error.status == 401) this.$rootScope.$broadcast('onUnauthorized401', { error: error }); // if user is logoff then refresh page for redirect to login page

            this.awaitAction.isError = true;
            this.awaitAction.subtitle = error.statusText;
            this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

            this.notifyService.error(error.data.Message);

            $('.progress-log').append(error.data.Message + '\n');

            clearInterval(this.monitoringTimer);
            this.monitoringTimer = 0;

            delete this.running;
        });
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

                this.apiService.post("Studio", "DeleteExtension", { ID: id }).then((data) => {
                    this.extensions.splice($index, 1);

                    this.notifyService.success("Extension deleted has been successfully");

                    this.$rootScope.refreshSidebarExplorerItems();

                    delete this.awaitAction;
                    delete this.running;
                }, (error) => {
                    if (error.status == 401) this.$rootScope.$broadcast('onUnauthorized401', { error: error }); // if user is logoff then refresh page for redirect to login page

                    this.awaitAction.isError = true;
                    this.awaitAction.subtitle = error.statusText;
                    this.awaitAction.desc =                        this.globalService.getErrorHtmlFormat(error);

                    this.notifyService.error(error.data.Message);

                    delete this.running;
                });
            }
        });
    }

    disposeWorkingMode() {
        location.reload();
    }

    onCloseWindow() {
        location.reload();
    }

    monitorProgress() {
        var index = 1;
        var monitoringFileStatus;
        var progressValueFileStatus;

        const getMonitoringFiles = () => {
            fetch(this.monitoringFile + '?ver=' + index++).then((stream) => {
                monitoringFileStatus = stream.status;
                return stream.text();
            }).then((content) => {
                if (monitoringFileStatus == 200) $('.progress-log').append(content + '\n');
            });

            fetch(this.progressValueFile + '?ver=' + index++).then((stream) => {
                progressValueFileStatus = stream.status;
                return stream.text();
            }).then((content) => {
                if (progressValueFileStatus == 200) {
                    $('.progress-bar').css('width', content + '%');
                    this.progressValue = content;

                    if (parseInt(content) == 100) {
                        clearInterval(this.monitoringTimer);
                        this.monitoringTimer = 0;
                    }
                }
            });
        }

        this.monitoringTimer = setInterval(getMonitoringFiles, 1000);
    }
}