export class ProviderSettingsController {
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
        notificationService
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

        this.stepsCallback = { 2: this.initProviderWidget };
        this.providerWidget = {};

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        this.id = this.globalService.getParameterByName("id");
        this.step = 1;

        this.running = "get-provider-settings";
        this.awaitAction = {
            title: "Loading Provider Settings",
            subtitle: "Just a moment for loading provider settings...",
        };

        this.apiService
            .get("Studio", "GetProvider", {
                providerID: this.id,
            })
            .then((data) => {
                this.provider = data;

                this.onFocusModule();

                delete this.running;
                delete this.awaitAction;
            });

        this.setForm();
    }

    onFocusModule() {
        this.$rootScope.explorerExpandedItems.push('providers');
        this.$rootScope.explorerExpandedItems.push(this.provider.ProviderID);
        this.$rootScope.explorerCurrentItem = 'provider-settings-' + this.provider.ProviderID;
    }

    setForm() {
        this.providerForm = this.validationService.init({
                Title: {
                    id: "txtProviderTitle",
                    required: true,
                },
                ProviderComponent: {
                    id: "txtProviderComponent",
                    required: true,
                },
                BusinessControllerClass: {
                    id: "txtBusinessControllerClass",
                    required: true,
                },
            },
            true,
            this.$scope,
            "$.provider"
        );
    }

    onStepClick(step) {
        if (step == this.step) return;

        this.step = step;

        if (typeof this.stepsCallback[step] == "function") {
            this.hideStepPreloader = false;

            const $this = this;
            this.stepsCallback[step].apply(this).then(() => {
                $this.hideStepPreloader = true;
            });
        }

        var newUrl = this.globalService.replaceUrlParam("st", step);
        this.globalService.pushState(newUrl);
    }

    initProviderWidget() {
        const defer = this.$q.defer();

        const providerComponent = `<${this.provider.ProviderComponent} controller="$"></${this.provider.ProviderComponent}>`;

        this.$timeout(() => {
            $("#providerWidget").html(this.$compile(providerComponent)(this.$scope));
        });

        defer.resolve();

        return defer.promise;
    }

    onSaveProviderClick() {
        this.providerForm.validated = true;
        this.providerForm.validator(this.provider);

        if (this.providerForm.valid) {
            this.running = "save-provider";
            this.awaitAction = {
                title: "Saving Provider",
                subtitle: "Just a moment for saving the provider...",
            };

            this.currentTabKey = this.$rootScope.currentTab.key;

            this.apiService.post("Studio", "SaveProvider", this.provider).then((data) => {
                    this.notifyService.success(
                        "Action updated has been successfully"
                    );

                    this.$scope.$emit("onUpdateCurrentTab", {
                        id: this.provider.ProviderID,
                        title: this.provider.ProviderName,
                        key: this.currentTabKey,
                    });

                    delete this.awaitAction;
                    delete this.running;
                },
                (error) => {
                    if (this.isNewAction) delete this.provider.ProviderID;

                    this.awaitAction.isError = true;
                    this.awaitAction.subtitle = error.statusText;
                    this.awaitAction.desc =
                        this.globalService.getErrorHtmlFormat(error);

                    this.notifyService.error(error.data.Message);

                    delete this.running;
                }
            );
        }
    }

    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }
}