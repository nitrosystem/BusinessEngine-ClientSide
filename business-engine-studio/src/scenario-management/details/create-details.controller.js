import { GlobalSettings } from "../../../../common/configs/global.settings";

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
            },
            true,
            this.$scope,
            "$.detailsModule"
        );
    }

    onSaveDetailsClick() {
        this.form.validated = true;
        this.form.validator(this.detailsModule);
        if (this.form.valid) {
            this.detailsModule.DnnModuleID =
                this.globalService.getParameterByName("d") ||
                this.detailsModule.DnnModuleID;

            this.running = "save-details";
            this.awaitAction = {
                title: "Saving Details",
                subtitle: "Just a moment for saving the details...",
            };

            this.currentTabKey = this.$rootScope.currentTab.key;

            this.apiService.post("Studio", "SaveDetailsModule", this.detailsModule).then((data) => {
                    this.detailsModule.ModuleID = data;

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