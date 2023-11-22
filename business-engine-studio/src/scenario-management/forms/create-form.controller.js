import { GlobalSettings } from "../../../../common/configs/global.settings";

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
            },
            true,
            this.$scope,
            "$.formModule"
        );
    }

    onSaveFormClick() {
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