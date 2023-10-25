export class CreateActionController {
    constructor(
        $scope,
        $rootScope,
        $compile,
        $timeout,
        $q,
        globalService,
        apiService,
        studioService,
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
        this.studioService = studioService;
        this.validationService = validationService;
        this.notifyService = notificationService;
        this.$deferredBroadcast = $deferredBroadcast;

        this.stepsCallback = { 4: this.initActionBuilder };
        this.actionBuilder = {};

        $scope.serverSideFilter = (item) => {
            return !item.Scope || item.Scope == (this.action.IsServerSide ? 2 : 1);
        };

        $scope.$on("onSyncActionParamsWithServiceParams", (e, args) => {
            const service = args.service || {};
            const action = args.action || {};

            action.Params = action.Params || [];
            _.forEach(service.Params, (sp) => {
                if (!_.filter(action.Params, (ap) => {
                        return ap.ParamName == sp.ParamName;
                    }).length)
                    action.Params.push({ ParamName: sp.ParamName });
            });
        });

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        const id = this.globalService.getParameterByName("id");

        this.stepsValid = 1;
        this.events = [];

        var step = this.globalService.getParameterByName("st");
        this.step = step && id ? parseInt(step) : 1;

        this.running = "get-action";
        this.awaitAction = {
            title: "Loading Action",
            subtitle: "Just a moment for loading action...",
        };

        const parentID = this.globalService.getParameterByName("parent");
        const isFieldActions = this.globalService.getParameterByName("type") == "field";

        this.apiService
            .get("Studio", "GetAction", { isFieldActions, parentID, id })
            .then(
                (data) => {
                    this.module = data.Module;
                    this.fields = data.Fields;
                    this.services = data.Services;
                    this.viewModels = data.ViewModels;
                    this.variables = data.Variables;
                    this.paymentMethods = data.PaymentMethods;
                    this.paymentGateways = data.PaymentGateways;
                    this.actionTypes = data.ActionTypes;
                    this.actions = data.Actions;
                    this.moduleActions = data.AllActions;
                    this.action = data.Action;

                    this.events.push(...data.CustomEvents);
                    if (isFieldActions) {
                        this.events.push(...[
                            { Text: "On Action Completed", Value: "OnActionCompleted" },
                            { Text: "On Field Value Change", Value: "OnFieldValueChange" },
                            { Text: "On Field Custom Event", Value: "OnCustomEvent" },
                        ]);
                    } else {
                        this.events.push(...[
                            { Text: "On Page Init", Value: "OnPageInit" },
                            { Text: "On Page Load", Value: "OnPageLoad" },
                            { Text: "On Action Completed", Value: "OnActionCompleted" },
                            { Text: "On Payment Completed", Value: "OnPaymentCompleted" },
                            { Text: "On Custom Event", Value: "OnCustomEvent" },
                        ]);
                    }

                    if (!this.action) {
                        this.isNewAction = true;
                        this.action = {
                            ModuleID: this.module.ModuleID,
                            FieldID: isFieldActions ? parentID : null,
                            Options: {},
                        };
                        this.step = 1;
                    } else {
                        if (!step) this.step = 4;

                        this.stepsValid = 6;

                        _.filter(this.actionTypes, (st) => {
                            return st.ActionType == this.action.ActionType;
                        }).map((actionType) => {
                            this.actionType = actionType;
                        });

                        this.gotoStep(this.step);

                        this.$scope.$emit("onUpdateCurrentTab", {
                            id: this.action.ActionID,
                            title: this.action.ActionName,
                        });
                    }

                    this.onFocusModule();
                    this.setForm();

                    delete this.running;
                    delete this.awaitAction;

                    this.$timeout(() => {
                        this.hideStepPreloader = true;
                    }, 100);
                }, (error) => {
                    if (this.isNewAction) delete this.action.ActionID;

                    this.awaitAction.isError = true;
                    this.awaitAction.subtitle = error.statusText;
                    this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                    this.notifyService.error(error.data.Message);

                    delete this.running;
                }
            );
    }

    onFocusModule() {
        if (this.module) {
            const items = this.studioService.createSidebarExplorerPath(this.module.ModuleID, "Module");
            this.$rootScope.explorerExpandedItems.push(...items);
            this.$rootScope.explorerExpandedItems.push(this.module.ModuleType.toLowerCase() + '-modules');

            this.$rootScope.explorerCurrentItem = this.module.ModuleID;
        }
    }

    setForm() {
        this.form = this.validationService.init({
                ActionType: {
                    required: true,
                },
                ActionName: {
                    id: "txtActionName" +
                        (this.action.ActionID ? this.action.ActionID : ""),
                    rule: (value) => {
                        if (this.step > 1 && !value) return false;

                        return true;
                    },
                    required: true,
                },
                Event: {
                    id: "drpEvent" + (this.action.ActionID ? this.action.ActionID : ""),
                    rule: (value) => {
                        if (this.step > 1 && !value) return false;

                        return true;
                    },
                    required: true,
                },
                ParentID: {
                    id: "drpParentID" + (this.action.ActionID ? this.action.ActionID : ""),
                    rule: (value) => {
                        if (this.step > 1 && this.action.Event == "OnActionCompleted" && !value)
                            return false;

                        return true;
                    },
                    required: true,
                },
                ParentResultStatus: {
                    id: "drpParentResultStatus" + (this.action.ActionID ? this.action.ActionID : ""),
                    rule: (value) => {
                        if (this.step > 1 && this.action.Event == "OnActionCompleted" && (value == undefined || value == null))
                            return false;

                        return true;
                    },
                    required: true,
                },
                PaymentMethodID: {
                    id: "drpPaymentMethodID" + (this.action.ActionID ? this.action.ActionID : ""),
                    rule: (value) => {
                        if (this.step > 1 && this.action.Event == "OnPaymentCompleted" && !value)
                            return false;

                        return true;
                    },
                    required: true,
                },
                PaymentResultStatus: {
                    id: "drpPaymentResultStatus" + (this.action.ActionID ? this.action.ActionID : ""),
                    rule: (value) => {
                        if (this.step > 1 && this.action.Event == "OnPaymentCompleted" && (value == undefined || value == null))
                            return false;

                        return true;
                    },
                    required: true,
                }
            },
            true,
            this.$scope,
            "$.action"
        );
    }

    gotoStep(step) {
        if (this.step < step && this.step < 6) {
            // goto next step
            this.form.validated = true;
            this.form.validator(this.action);

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
        var inc = 1;

        if (this.step == 4 && !this.action.HasPreScript) inc = 2;
        if (this.step == 6 && !this.action.HasPostScript) inc = 2;

        this.gotoStep(this.step - inc);
    }

    onNextStepClick() {
        var inc = 1;

        if (this.step == 2 && !this.action.HasPreScript) inc = 2;
        if (this.step == 4 && !this.action.HasPostScript) inc = 2;

        this.gotoStep(this.step + inc);
    }

    onSelectActionTypeClick(actionType) {
        this.action.ActionType = actionType.ActionType;
        this.action.ActionType = actionType.ActionType;
        this.action.HasResult = actionType.HasResult;
        this.action.ResultType = actionType.ResultType;

        this.actionType = actionType;

        if (this.stepsValid == 1) {
            this.gotoStep(2);
            this.stepsValid = 2;
        }

        delete this.isActionLoaded;
    }

    onAddActionParamClick(name) {
        var source = $parse(name)($scope);

        source.push({});
    }

    onDeleteActionParamClick(name, $index) {
        var source = $parse(name)($scope);

        source.splice($index, 1);
    }

    onShowVariablesClick() {
        this.$scope.$broadcast("onLoadVariablesWindow");

        $("#wnVariables").modal("show");
    }

    onAddActionParamClick() {
        $scope.action.Params = $scope.action.Params || [];

        $scope.action.Params.push({});
    }

    initActionBuilder() {
        const defer = this.$q.defer();

        const actionComponent = `<${this.actionType.ActionComponent} controller="$" action="$.action" scenarios="$.scenarios" services="$.services" actions="$.actions" module-actions="$.moduleActions" variables="$.variables" data-view-models="$.viewModels" data-fields="$.fields" ${this.actionType.ComponentSubParams}></${this.actionType.ActionComponent}>`;

        this.$timeout(() => {
            $("#pnlActionBuilder" + (this.action.ActionID ? this.action.ActionID : "")).html(this.$compile(actionComponent)(this.$scope));
        });

        this.isActionLoaded = true;

        defer.resolve();

        return defer.promise;
    }

    onSaveActionClick() {
        this.form.validated = true;
        this.form.validator(this.action);
        if (this.form.valid) {
            this.$deferredBroadcast(this.$scope, "onValidateAction").then(
                (IsNotValid) => {
                    if (!IsNotValid) {
                        this.running = "save-action";
                        this.awaitAction = {
                            title: "Saving Action",
                            subtitle: "Just a moment for saving the action...",
                        };

                        this.currentTabKey = this.$rootScope.currentTab.key;

                        this.apiService.post("Studio", "SaveAction", this.action).then((data) => {
                                this.action = data;

                                this.$deferredBroadcast(this.$scope, "onSaveAction", { isNewAction: this.isNewAction, }).then(() => {
                                        this.notifyService.success(
                                            "Action updated has been successfully"
                                        );

                                        this.$scope.$emit("onUpdateCurrentTab", {
                                            id: this.action.ActionID,
                                            title: this.action.ActionName,
                                            key: this.currentTabKey,
                                        });

                                        delete this.awaitAction;
                                        delete this.running;
                                    },
                                    (error) => {
                                        if (this.isNewAction) delete this.action.ActionID;

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

    onCancelActionClick() {
        $("#wnCreateAction").modal("hide");

        delete this.action;

        this.$scope.actionForm.$submitted = false;

        location.reload();
    }

    onDeleteActionClick() {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary action!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "get-actions";
                this.awaitAction = {
                    title: "Remove Action",
                    subtitle: "Just a moment for removing action...",
                };

                this.apiService.post("Studio", "DeleteAction", { ID: this.action.ActionID }).then(
                    (data) => {
                        this.notifyService.success("Action deleted has been successfully");

                        this.onCloseWindow();

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

// async raiseActionBuilder() {
//   await import(
//     `../../../../basic-components/b-actions/${this.actionType.ESModule}`
//   ).then((module) => {
//     $$controllerProvider.register(
//       this.actionType.Controller,
//       module[this.actionType.ControllerClass]
//     );
//     this.$scope.$apply();
//   });
// }

// fetch("field-base-layout.html")
//   .then((stream) => stream.text())
//   .then((text) => {
//   });