import { GlobalSettings } from "../../../../common/configs/global.settings";

export class CreateListController {
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
            title: "Loading List",
            subtitle: "Just a moment for loading form...",
        };

        this.apiService
            .get("Studio", "GetListModuleSettings", { moduleID: id || null })
            .then((data) => {
                this.scenarios = data.Scenarios;
                this.roles = data.Roles;
                this.listModule = data.List;
                this.viewModels = data.ViewModels;

                if (!this.listModule) {
                    this.listModule = {
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
        this.$rootScope.explorerExpandedItems.push('list-modules');
        this.$rootScope.explorerExpandedItems.push(this.listModule.ModuleID);
        this.$rootScope.explorerCurrentItem = 'module-settings-' + this.listModule.ModuleID;
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
            "$.listModule"
        );
    }

    onSaveListClick() {
        this.form.validated = true;
        this.form.validator(this.listModule);
        if (this.form.valid) {
            this.listModule.DnnModuleID =
                this.globalService.getParameterByName("d") ||
                this.listModule.DnnModuleID;

            this.running = "save-form";
            this.awaitAction = {
                title: "Saving List",
                subtitle: "Just a moment for saving the form...",
            };

            this.currentTabKey = this.$rootScope.currentTab.key;

            this.apiService.post("Studio", "SaveListModule", this.listModule).then(
                (data) => {
                    this.listModule.ModuleID = data;

                    this.notifyService.success("List updated has been successfully");

                    this.$scope.$emit("onUpdateCurrentTab", {
                        id: this.listModule.ModuleID,
                        title: this.listModule.ModuleName,
                        key: this.currentTabKey,
                    });

                    this.$rootScope.refreshSidebarExplorerItems();

                    delete this.awaitAction;
                    delete this.running;
                },
                (error) => {
                    this.awaitAction.isError = true;
                    this.awaitAction.subtitle = error.statusText;
                    this.awaitAction.desc = this.globalService.getErrorHtmlListat(error);

                    this.notifyService.error(error.data.Message);

                    delete this.running;
                }
            );
        }
    }

    onGotoModuleBuilderClick() {
        this.$scope.$emit("onGotoPage", {
            page: "module-builder",
            id: this.listModule.ModuleID,
            title: this.listModule.ModuleTitle,
        });
    }

    onCancelListClick() {
        this.onCloseWindow();
    }

    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }

}