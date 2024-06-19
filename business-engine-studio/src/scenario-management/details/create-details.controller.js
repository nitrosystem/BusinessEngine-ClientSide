import { GlobalSettings } from "../../configs/global.settings";

export class CreateDetailsController {
    constructor(
        $scope,
        $rootScope,
        studioService,
        $compile,
        $timeout,
        $q,
        globalService,
        apiService,
        validationService,
        notificationService,
        $deferredBroadcast
    ) {
        "ngInject";

        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.studioService = studioService;
        this.$compile = $compile;
        this.$timeout = $timeout;
        this.$q = $q;
        this.globalService = globalService;
        this.apiService = apiService;
        this.validationService = validationService;
        this.notifyService = notificationService;
        this.$deferredBroadcast = $deferredBroadcast;

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        const id = this.globalService.getParameterByName("id");

        var step = this.globalService.getParameterByName("st");
        this.step = step && id ? parseInt(step) : 1;

        this.running = "get-details";
        this.awaitAction = {
            title: "Loading Details",
            subtitle: "Just a moment for loading details...",
        };

        this.apiService
            .get("Studio", "GetDetailsModuleSettings", { moduleID: id || null })
            .then((data) => {
                this.scenarios = data.Scenarios;
                this.roles = data.Roles;
                this.detailsModule = data.Details;
                this.viewModels = data.ViewModels;

                if (!this.detailsModule) {
                    this.detailsModule = {
                        ScenarioID: GlobalSettings.scenarioID,
                    };
                }

                this.oldModuleName = this.detailsModule.ModuleName;

                this.onFocusModule();

                delete this.running;
                delete this.awaitAction;

                this.$timeout(() => {
                    this.hideStepPreloader = true;
                }, 100);
            });

        this.setDetails();
    }

    onFocusModule() {
        this.$rootScope.explorerExpandedItems.push('details-modules');
        this.$rootScope.explorerExpandedItems.push(this.detailsModule.ModuleID);
        this.$rootScope.explorerCurrentItem = 'module-settings-' + this.detailsModule.ModuleID;
    }

    setDetails() {
        this.form = this.validationService.init({
                ScenarioID: {
                    id: "drpScenarioID",
                    required: true,
                },
                ModuleName: {
                    id: "txtModuleName",
                    required: true,
                },
                ModuleTitle: {
                    id: "txtModuleTitle",
                    required: true,
                },
                ModuleBuilderType: {
                    id: "drpModuleBuilderType",
                    required: true,
                }
            },
            true,
            this.$scope,
            "$.detailsModule"
        );
    }

    validateModuleName() {
        var $defer = this.$q.defer();

        if (this.oldModuleName == this.detailsModule.ModuleName) {
            $defer.resolve();
            return $defer.promise;
        }

        if (_.isEmpty(this.detailsModule.ModuleName)) {
            this.moduleNameIsValid = false;
            this.moduleNameIsEmpty = true;
            this.moduleNameIsValidPattern = true;

            $defer.reject();
        } else if (/^[a-zA-Z][a-zA-Z_.0-9-]+$/gim.test(this.detailsModule.ModuleName) == false) {
            this.moduleNameIsValid = false;
            this.moduleNameIsValidPattern = false;

            $defer.reject();
        } else {
            this.running = "check-module-name";
            this.awaitAction = {
                title: "Checking Module Name",
                subtitle: "Just a moment for checking name of the module...",
            };

            this.apiService.post("Studio", "CheckModuleName", {
                ScenarioID: this.detailsModule.ScenarioID,
                ModuleID: this.detailsModule.ModuleID,
                OldModuleName: this.oldModuleName,
                NewModuleName: this.detailsModule.ModuleName
            }).then((data) => {
                this.moduleNameIsValidPattern = true;
                this.moduleNameIsValid = data.IsValid;
                this.moduleNameIsExists = data.IsExists;

                if (data.IsValid)
                    $defer.resolve();
                else
                    $defer.reject();

                delete this.awaitAction;
                delete this.running;
            }, (error) => {
                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                $defer.reject();

                delete this.running;
            });
        }

        return $defer.promise;
    }

    onSaveDetailsClick() {
        this.validateModuleName().then(() => {
            this.form.validated = true;
            this.form.validator(this.detailsModule);
            if (this.form.valid) {
                this.detailsModule.DnnModuleID = this.globalService.getParameterByName("d") || this.detailsModule.DnnModuleID;

                this.running = "save-details";
                this.awaitAction = {
                    title: "Saving Details",
                    subtitle: "Just a moment for saving the details...",
                };

                this.currentTabKey = this.$rootScope.currentTab.key;

                this.apiService.post("Studio", "SaveDetailsModule", this.detailsModule).then((data) => {
                        this.detailsModule.ModuleID = data;

                        if (this.oldModuleName != this.detailsModule.ModuleName) this.importantNoteForChangeModuleName = true;

                        this.oldModuleName = this.detailsModule.ModuleName;

                        this.notifyService.success("Details updated has been successfully");

                        this.$scope.$emit("onUpdateCurrentTab", {
                            id: this.detailsModule.ModuleID,
                            title: this.detailsModule.ModuleName,
                            key: this.currentTabKey,
                        });

                        this.$rootScope.refreshSidebarExplorerItems();

                        delete this.awaitAction;
                        delete this.running;
                    },
                    (error) => {
                        this.awaitAction.isError = true;
                        this.awaitAction.subtitle = error.statusText;
                        this.awaitAction.desc =
                            this.globalService.getErrorHtmlDetailsat(error);

                        this.notifyService.error(error.data.Message);

                        delete this.running;
                    }
                );
            }
        });
    }

    onGotoModuleBuilderClick() {
        this.$scope.$emit("onGotoPage", {
            page: "module-builder",
            id: this.detailsModule.ModuleID,
            title: this.detailsModule.ModuleTitle,
        });
    }

    onCancelDetailsClick() {
        this.onCloseWindow();
    }

    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }
}