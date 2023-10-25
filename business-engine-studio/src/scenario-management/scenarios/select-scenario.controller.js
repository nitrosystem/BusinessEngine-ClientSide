export class SelectScenarioController {
    constructor(
        $rootScope,
        $compile,
        $scope,
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

        this.onPageLoad();
    }

    onPageLoad() {
        this.running = "get-scenarios";
        this.awaitAction = {
            title: "Loading Scenarios",
            subtitle: "Just a moment for loading scenarios...",
        };

        this.apiService.get("Studio", "GetScenarios").then((data) => {
            this.scenarios = data;

            delete this.running;
            delete this.awaitAction;
        });

        this.setForm();
    }

    setForm() {
        this.form = this.validationService.init({
            ScenarioID: {
                id: "drpScenarioID",
                required: true,
            },
        });
    }

    onSelectScenarioClick() {
        this.form.validated = true;
        this.form.validator(this.scenario);
        if (this.form.valid) {
            this.running = "save-scenario";
            this.awaitAction = {
                title: "Saving Scenario",
                subtitle: "Just a moment for saving the scenario...",
            };

            this.currentTabKey = this.$rootScope.currentTab.key;

            this.apiService.post("Studio", "SaveScenario", this.scenario).then(
                (data) => {
                    this.scenario.ScenarioID = data;

                    this.notifyService.success("Scenario updated has been successfully");

                    this.$scope.$emit("onUpdateCurrentTab", {
                        id: this.scenario.ScenarioID,
                        title: this.scenario.ScenarioName,
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
                        this.globalService.getErrorHtmlScenarioat(error);

                    this.notifyService.error(error.data.Message);

                    delete this.running;
                }
            );
        }
    }

    onCancelClick() {
        window["wnSelectScenario"].hide();
    }
}