export class CreateScenarioController {
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
        moduleRenderService,
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
        this.moduleRenderService = moduleRenderService;
        this.$deferredBroadcast = $deferredBroadcast;

        this.onPageLoad();
    }

    onPageLoad() {
        this.scenario = _.clone(this.$rootScope.scenario);

        this.setForm();
    }

    setForm() {
        this.form = this.validationService.init({
                ScenarioName: {
                    id: "txtScenarioName",
                    required: true,
                },
                ScenarioTitle: {
                    id: "txtScenarioTitle",
                    required: true,
                },
                DatabaseObjectPrefix: {
                    id: "txtDatabaseObjectPrefix",
                    required: true,
                },
            },
            true,
            this.$scope,
            "$.scenario"
        );
    }

    onSaveScenarioClick() {
        this.form.validated = true;
        this.form.validator(this.scenario);
        if (this.form.valid) {
            this.running = "save-scenario";
            this.awaitAction = {
                title: "Saving Scenario",
                subtitle: "Just a moment for saving the scenario...",
            };

            this.apiService.post("Studio", "SaveScenario", this.scenario).then((data) => {
                    const isNewScenario = !this.scenario.ScenarioID;

                    this.scenario = data;
                    this.$rootScope.scenario = _.clone(this.scenario);

                    this.notifyService.success("Scenario updated has been successfully");

                    if (isNewScenario) {
                        const url = this.globalService.replaceUrlParam("s", this.scenario.ScenarioName);

                        this.globalService.pushState(url);

                        this.$timeout(() => location.reload());
                    }

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

    onCancelScenarioClick() {}

    onRenderScenarioModulesClick() {
        this.running = "render-all-modules";
        this.awaitAction = {
            title: "Rendering All Modules",
            subtitle: "Just a moment for rendering the scenario all modules...",
        };
        this.moduleRenderService.rebuildScenarioModules(this.scenario.ScenarioID, this.$scope);
    }
}