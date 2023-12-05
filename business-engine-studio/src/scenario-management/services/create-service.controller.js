import { GlobalSettings } from "../../configs/global.settings";

export class CreateServiceController {
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
        this.$compile = $compile;
        this.$timeout = $timeout;
        this.$q = $q;
        this.globalService = globalService;
        this.apiService = apiService;
        this.validationService = validationService;
        this.notifyService = notificationService;
        this.$deferredBroadcast = $deferredBroadcast;

        this.stepsCallback = { 3: this.initServiceBuilder };
        this.serviceBuilder = {};

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        const id = this.globalService.getParameterByName("id");

        this.stepsValid = 1;

        var step = this.globalService.getParameterByName("st");
        this.step = step && id ? parseInt(step) : 1;

        this.running = "get-service";
        this.awaitAction = {
            title: "Loading Service",
            subtitle: "Just a moment for loading service...",
        };

        this.apiService.get("Studio", "GetService", { serviceID: id || null }).then(
            (data) => {

                this.scenarios = data.Scenarios;
                this.databases = data.Databases;
                this.roles = data.Roles;
                this.service = data.Service;

                data.ServiceTypes.forEach(st => {
                    st.Icon = (st.Icon || '').replace('[EXTPATH]', GlobalSettings.modulePath + "extensions");
                });
                this.serviceTypes = data.ServiceTypes;

                if (!this.service) {
                    this.isNewService = true;
                    this.service = {
                        ScenarioID: GlobalSettings.scenarioID,
                        IsEnabled: true,
                        Settings: {},
                    };
                    this.step = 1;
                } else {
                    if (!step) this.step = 3;

                    this.stepsValid = 3;

                    _.filter(this.serviceTypes, (st) => {
                        return st.ServiceSubtype == this.service.ServiceSubtype;
                    }).map((serviceType) => {
                        this.serviceType = serviceType;
                    });

                    this.gotoStep(this.step);

                    this.$scope.$emit("onUpdateCurrentTab", {
                        id: this.service.ServiceID,
                        title: this.service.ServiceName,
                    });
                }

                this.setForm();

                this.onFocusModule();

                delete this.running;
                delete this.awaitAction;

                this.$timeout(() => {
                    this.hideStepPreloader = true;
                }, 100);
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

    onFocusModule() {
        this.$rootScope.explorerExpandedItems.push(
            ...["services", "create-service"]
        );
        this.$rootScope.explorerCurrentItem = !this.service || !this.service.ServiceID ?
            "create-service" :
            this.service.ServiceID;
    }

    setForm() {
        this.form = this.validationService.init({
                ScenarioID: {
                    id: "drpScenarioID" +
                        (this.service.ServiceID ? this.service.ServiceID : ""),
                    rule: (value) => {
                        if (this.step > 1 && !value) return false;

                        return true;
                    },
                    required: true,
                },
                ServiceType: {
                    required: true,
                },
                ServiceSubtype: {
                    required: true,
                },
                ServiceName: {
                    id: "txtServiceName" +
                        (this.service.ServiceID ? this.service.ServiceID : ""),
                    rule: (value) => {
                        if (this.step > 1 && !value) return false;

                        return true;
                    },
                    required: true,
                },
            },
            true,
            this.$scope,
            "$.service"
        );
    }

    gotoStep(step) {
        if (this.step < step && this.step < 4) {
            // goto next step
            this.form.validated = true;
            this.form.validator(this.service);

            if (this.form.valid) {
                this.step = step;

                this.form.validated = false;

                this.stepsValid = this.step;
            }
        } else if (this.step > step && this.step > 1) {
            // goto prev step
            this.step = step;
        }

        if (this.step == step) {
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
    }

    onStepClick(step) {
        if (!this.running && this.stepsValid >= step) this.gotoStep(step);
    }

    onPrevStepClick() {
        this.gotoStep(this.step - 1);
    }

    onNextStepClick() {
        this.gotoStep(this.step + 1);
    }

    onSelectServiceSubtypeClick(serviceType) {
        this.service.ServiceType = serviceType.ServiceType;
        this.service.ServiceSubtype = serviceType.ServiceSubtype;
        this.service.HasResult = serviceType.HasResult;
        this.service.ResultType = serviceType.ResultType;

        this.serviceType = serviceType;

        if (this.stepsValid == 1) {
            this.stepsValid = 2;
            this.gotoStep(2);
        }

        delete this.isServiceLoaded;
    }

    initServiceBuilder() {
        const defer = this.$q.defer();

        if (!this.isServiceLoaded) {
            this.running = "get-service-builder";

            this.apiService
                .get("Studio", "GetServiceDependencies", {
                    scenarioID: this.service.ScenarioID,
                    serviceSubtype: this.service.ServiceSubtype,
                })
                .then(
                    (data) => {
                        this.entities = data.Entities;
                        this.viewModels = data.ViewModels;

                        const serviceComponent = `<${this.serviceType.ServiceComponent} service="$.service" scenarios="$.scenarios" entities="$.entities" view-models="$.viewModels"></${this.serviceType.ServiceComponent}>`;

                        $("#pnlServiceBuilder" + (this.service.ServiceID ? this.service.ServiceID : "")).html(this.$compile(serviceComponent)(this.$scope));

                        this.isServiceLoaded = true;

                        delete this.running;

                        defer.resolve();
                    },
                    (error) => {
                        delete this.running;

                        defer.reject();
                    }
                );
        } else defer.resolve();

        return defer.promise;
    }

    onSaveServiceClick() {
        this.form.validated = true;
        this.form.validator(this.service);
        if (this.form.valid) {
            this.$deferredBroadcast(this.$scope, "onValidateService").then(
                (isValid) => {
                    if (isValid) {
                        this.running = "save-service";
                        this.awaitAction = {
                            title: "Saving Service",
                            subtitle: "Just a moment for saving the service...",
                        };

                        this.currentTabKey = this.$rootScope.currentTab.key;

                        this.apiService.post("Studio", "SaveService", this.service).then((data) => {
                                this.service.ServiceID = data.ServiceID;
                                this.service.LastModifiedOnDate = data.LastModifiedOnDate;
                                this.service.LastModifiedByUserID = data.LastModifiedByUserID;
                                this.service.CreatedOnDate = data.CreatedOnDate;
                                this.service.CreatedByUserID = data.CreatedByUserID;

                                this.submitApi().then(() => {
                                        this.notifyService.success(
                                            "Service updated has been successfully"
                                        );

                                        this.$scope.$emit("onUpdateCurrentTab", {
                                            id: this.service.ServiceID,
                                            title: this.service.ServiceName,
                                            key: this.currentTabKey,
                                        });

                                        this.$rootScope.refreshSidebarExplorerItems();

                                        delete this.awaitAction;
                                        delete this.running;
                                    },
                                    (error) => {
                                        if (this.isNewService) delete this.service.ServiceID;

                                        this.awaitAction.isError = true;
                                        this.awaitAction.subtitle = error.statusText;
                                        this.awaitAction.desc =
                                            this.globalService.getErrorHtmlFormat(error);

                                        this.notifyService.error(error.data.Message);

                                        delete this.running;
                                    }
                                );
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
                }
            );
        }
    }

    submitApi() {
        const defer = this.$q.defer();

        if (this.serviceType.SubmitApi) {
            return this.$deferredBroadcast(this.$scope, "onSaveService", {
                isNewService: this.isNewService,
            });
        } else defer.resolve();

        return defer.promise;
    }

    onCancelServiceClick() {
        $("#wnCreateService").modal("hide");

        delete this.service;

        this.$scope.serviceForm.$submitted = false;

        location.reload();
    }

    onDeleteServiceClick() {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary service!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "get-services";
                this.awaitAction = {
                    title: "Remove Service",
                    subtitle: "Just a moment for removing service...",
                };

                this.apiService.post("Studio", "DeleteService", { ID: this.service.ServiceID }).then(
                    (data) => {
                        this.notifyService.success("Service deleted has been successfully");

                        this.onCloseWindow();

                        this.$rootScope.refreshSidebarExplorerItems();

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
        });
    }

    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }
}

// this.$ocLazyLoad
//   .load([
//     "/DesktopModules/ClientTest/dist/basic.bundle.js" +
//       "?ver" +
//       GlobalSettings.version,
//   ])
//   .then(function () {
//     var polo = new window["Person1"]("negar", "arya");
//     polo.person1("zahra");
//   });

// async raiseServiceBuilder() {
//   await import(
//     `../../../../basic-components/b-services/${this.serviceType.ESModule}`
//   ).then((module) => {
//     $$controllerProvider.register(
//       this.serviceType.Controller,
//       module[this.serviceType.ControllerClass]
//     );
//     this.$scope.$apply();
//   });
// }

// var uu = eval(Temp1);
// this.apiService.post("Studio", "Temp12", {
//   Data: uu.toString(),
// });