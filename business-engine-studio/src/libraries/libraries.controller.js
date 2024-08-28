import swal from "sweetalert";
import { GlobalSettings } from "../configs/global.settings";

export class LibrariesController {
    constructor($scope, $timeout, Upload, studioService, globalService, apiService, notificationService) {
        "ngInject";

        this.$scope = $scope;
        this.$timeout = $timeout;
        this.uploadService = Upload;
        this.globalService = globalService;
        this.apiService = apiService;
        this.notifyService = notificationService;

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.$scope.$emit("onChangeActivityBar", {
            name: "libraries",
            title: "Libraries",
            disableActivityBarCallback: true
        });

        this.onPageLoad();
    }

    onPageLoad() {
        this.running = "get-libraries";
        this.awaitAction = {
            title: "Loading Libraries",
            subtitle: "Just a moment for loading libraries...",
        };

        this.apiService.get("Studio", "GetLibraries").then((data) => {
            this.libraries = data;
            this.topLibraries = data;

            delete this.running;
            delete this.awaitAction;
        });
    }

    onFocusModule() {
        this.$scope.$emit('onChangeActivityBar', { name: 'libraries' })
    }

    onAddLibraryClick() {
        var subParams = {};
        if (this.isFieldLibraries) subParams.type = "field";

        this.$scope.$emit("onGotoPage", {
            page: "create-library",
            parentID: this.parentID,
            subParams: subParams,
        });
    }

    onEditLibraryClick(id, title) {
        var subParams = {};
        if (this.isFieldLibraries) subParams.type = "field";

        this.$scope.$emit("onGotoPage", {
            page: "create-library",
            parentID: this.parentID,
            id: id,
            title: title,
            subParams: subParams,
        });
    }

    onDeleteLibraryClick(id, index) {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary library!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "get-libraries";
                this.awaitAction = {
                    title: "Remove Library",
                    subtitle: "Just a moment for removing library...",
                };

                this.apiService.post("Studio", "DeleteLibrary", { ID: id }).then((data) => {
                    this.libraries.splice(index, 1);

                    this.notifyService.success("Library deleted has been successfully");

                    this.$rootScope.refreshSidebarExplorerItems();

                    delete this.awaitAction;
                    delete this.running;
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

    onInstallLibraryClick() {
        this.workingMode = "install-library";
        this.$scope.$emit("onShowRightWidget");

        this.step = 1;
    }

    onUploadLibraryPackage($files, $file, $newFiles, $duplicateFiles, $invalidFiles, $event) {
        if ($file) {
            this.running = "upload-library";
            this.awaitAction = {
                title: "Uploading Libraries",
                subtitle: "Just a moment for uploading library...",
            };

            this.uploadService.upload({
                url: window.bEngineGlobalSettings.apiBaseUrl + 'BusinessEngine/API/Studio/UploadLibraryPackage',
                headers: GlobalSettings.apiHeaders,
                data: { files: $file },
            }).then((data) => {
                this.library = JSON.parse(data.data.LibraryJson);
                this.libraryInstallDto = {
                    LibraryUnzipedPath: data.data.LibraryUnzipedPath,
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

    onNextInstallLibraryStepClick() {
        this.step = 3;

        this.running = "install-libraries";
        this.awaitAction = {
            title: "Install Library",
            subtitle: "Just a moment for installing library...",
        };

        this.apiService.post("Studio", "InstallLibrary", null, {
            libraryUnzipedPath: this.libraryInstallDto.LibraryUnzipedPath,
            manifestFilePath: this.libraryInstallDto.ManifestFilePath,
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

    onDoneInstallLibraryClick() {
        location.reload();
    }

    onCancelInstallLibraryClick() {
        this.disposeWorkingMode();
    }
}