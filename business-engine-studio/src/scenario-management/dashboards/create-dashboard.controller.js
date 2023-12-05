import { GlobalSettings } from "../../configs/global.settings";

export class CreateDashboardController {
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

        this.$rootScope = $rootScope;
        this.$compile = $compile;
        this.$scope = $scope;
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

        this.running = "get-dashboard";
        this.awaitAction = {
            title: "Loading Dashboard",
            subtitle: "Just a moment for loading dashboard...",
        };

        this.apiService
            .get("Studio", "GetDashboardSettings", { moduleID: id || null })
            .then(
                (data) => {
                    this.scenarios = data.Scenarios;
                    this.roles = data.Roles;
                    this.dashboard = data.Dashboard;

                    if (!this.dashboard) {
                        this.dashboard = {
                            ScenarioID: GlobalSettings.scenarioID,
                        };
                    }

                    this.onFocusModule();

                    delete this.running;
                    delete this.awaitAction;

                    this.$timeout(() => {
                        this.hideStepPreloader = true;
                    }, 100);
                },
                (error) => {
                    if (this.isNewAction) delete this.action.ActionID;

                    this.awaitAction.isError = true;
                    this.awaitAction.subtitle = error.statusText;
                    this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                    this.notifyService.error(error.data.Message);

                    delete this.running;
                }
            );

        this.setForm();
    }

    onFocusModule() {
        this.$rootScope.explorerExpandedItems.push(...["dashboards", (this.dashboard || {}).ModuleID]);
        this.$rootScope.explorerCurrentItem = !this.dashboard || !this.dashboard.ModuleID ? "create-dashboard" : "d-" + this.dashboard.ModuleID;
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
                DashboardType: {
                    id: "drpDashboardType",
                    required: true,
                },
                UniqueName: {
                    id: "txtUniqueName",
                    required: true,
                },
            },
            true,
            this.$scope,
            "$.dashboard"
        );

        this.moduleForm = this.validationService.init({
                ModuleType: {
                    id: "drpModuleType",
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
            "$.currentPage.Module"
        );
    }

    onSaveDashboardClick() {
        this.form.validated = true;
        this.form.validator(this.dashboard);
        if (this.form.valid) {
            this.dashboard.DnnModuleID =
                this.globalService.getParameterByName("d") ||
                this.dashboard.DnnModuleID;

            this.running = "save-dashboard";
            this.awaitAction = {
                title: "Saving Dashboard",
                subtitle: "Just a moment for saving the dashboard...",
            };

            this.currentTabKey = this.$rootScope.currentTab.key;

            this.apiService.post("Studio", "SaveDashboard", this.dashboard).then((data) => {
                    this.dashboard.ModuleID = data.ModuleID;

                    this.notifyService.success("Dashboard updated has been successfully");

                    this.$scope.$emit("onUpdateCurrentTab", {
                        id: this.dashboard.ModuleID,
                        title: this.dashboard.ModuleName,
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

    onCancelDashboardClick() {
        this.onCloseWindow();
    }

    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }
}