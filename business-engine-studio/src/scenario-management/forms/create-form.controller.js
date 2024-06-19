import { GlobalSettings } from "../../configs/global.settings";

export class CreateFormController {
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

        this.running = "get-form";
        this.awaitAction = {
            title: "Loading Form",
            subtitle: "Just a moment for loading form...",
        };

        this.apiService
            .get("Studio", "GetFormModuleSettings", { moduleID: id || null })
            .then((data) => {
                this.scenarios = data.Scenarios;
                this.roles = data.Roles;
                this.formModule = data.Form;
                this.viewModels = data.ViewModels;

                if (!this.formModule) {
                    this.formModule = {
                        ScenarioID: GlobalSettings.scenarioID,
                    };
                }

                this.oldModuleName = this.formModule.ModuleName;

                this.onFocusModule();

                delete this.running;
                delete this.awaitAction;

                this.$timeout(() => {
                    this.hideStepPreloader = true;
                }, 100);
            });

        this.setForm();
    }

    onFocusModule() {
        this.$rootScope.explorerExpandedItems.push('form-modules');
        this.$rootScope.explorerExpandedItems.push(this.formModule.ModuleID);
        this.$rootScope.explorerCurrentItem = 'module-settings-' + this.formModule.ModuleID;
    }

    setForm() {
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
            "$.formModule"
        );
    }

    validateModuleName() {
        var $defer = this.$q.defer();

        if (this.oldModuleName == this.formModule.ModuleName) {
            $defer.resolve();
            return $defer.promise;
        }

        if (_.isEmpty(this.formModule.ModuleName)) {
            this.moduleNameIsValid = false;
            this.moduleNameIsEmpty = true;
            this.moduleNameIsValidPattern = true;

            $defer.reject();
        } else if (/^[a-zA-Z][a-zA-Z_.0-9-]+$/gim.test(this.formModule.ModuleName) == false) {
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
                ScenarioID: this.formModule.ScenarioID,
                ModuleID: this.formModule.ModuleID,
                OldModuleName: this.oldModuleName,
                NewModuleName: this.formModule.ModuleName
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

    onSaveFormClick() {
        this.validateModuleName().then(() => {
            this.form.validated = true;
            this.form.validator(this.formModule);
            if (this.form.valid) {
                this.formModule.DnnModuleID =
                    this.globalService.getParameterByName("d") ||
                    this.formModule.DnnModuleID;

                this.running = "save-form";
                this.awaitAction = {
                    title: "Saving Form",
                    subtitle: "Just a moment for saving the form...",
                };

                this.currentTabKey = this.$rootScope.currentTab.key;

                this.apiService.post("Studio", "SaveFormModule", this.formModule).then((data) => {
                        this.formModule.ModuleID = data;

                        if (this.oldModuleName != this.formModule.ModuleName) this.importantNoteForChangeModuleName = true;

                        this.oldModuleName = this.formModule.ModuleName;

                        this.notifyService.success("Form updated has been successfully");

                        this.$scope.$emit("onUpdateCurrentTab", {
                            id: this.formModule.ModuleID,
                            title: this.formModule.ModuleName,
                            key: this.currentTabKey,
                        });

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

    onGotoModuleBuilderClick() {
        this.$scope.$emit("onGotoPage", {
            page: "module-builder",
            id: this.formModule.ModuleID,
            title: this.formModule.ModuleTitle,
        });
    }

    onCancelFormClick() {
        this.onCloseWindow();
    }

    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }
}