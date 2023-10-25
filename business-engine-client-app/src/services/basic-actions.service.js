export class BasicActionsService {
    constructor($http, $q, globalService, apiService, expressionService) {
        this.$http = $http;
        this.$q = $q;
        this.globalService = globalService;
        this.apiService = apiService;
        this.expressionService = expressionService;
    }

    SetVariable(action, params, $scope) {
        const defer = this.$q.defer();

        defer.resolve($scope);

        return defer.promise;
    }

    GetDataSource(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.Settings && typeof action.Settings == "object")
            action.Settings = JSON.stringify(action.Settings);

        const postData = {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ParentID: action.ParentID,
            ServiceID: action.ServiceID,
            FieldID: action.FieldID,
            ConnectionID: $scope.connectionID,
            PageUrl: document.URL,
            Settings: action.Settings,
            Params: params,
        };

        this.apiService
            .postApi(
                "BusinessEngineBasicActions",
                "Service",
                "CallDataSourceAction",
                postData
            )
            .then(
                (data) => {
                    if (data) {
                        this.globalService.parseJsonItems(data.DataRow);
                        this.globalService.parseJsonItems(data.DataList);
                    }

                    defer.resolve(data);
                },
                (error) => {
                    defer.reject(error.data);
                }
            );

        return defer.promise;
    }

    SubmitEntity(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.Settings && typeof action.Settings == "object")
            action.Settings = JSON.stringify(action.Settings);

        const postData = {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ParentID: action.ParentID,
            ServiceID: action.ServiceID,
            FieldID: action.FieldID,
            ConnectionID: $scope.connectionID,
            PageUrl: document.URL,
            Settings: action.Settings,
            Params: params,
        };

        try {
            this.apiService
                .postApi(
                    "BusinessEngineBasicActions",
                    "Service",
                    "CallSubmitEntityAction",
                    postData
                )
                .then((data) => {
                    defer.resolve(data);
                });
        } catch (error) {}

        return defer.promise;
    }

    CustomQuery(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.Settings && typeof action.Settings == "object")
            action.Settings = JSON.stringify(action.Settings);

        const postData = {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ParentID: action.ParentID,
            ServiceID: action.ServiceID,
            FieldID: action.FieldID,
            ConnectionID: $scope.connectionID,
            PageUrl: document.URL,
            Settings: action.Settings,
            Params: params,
        };

        try {
            this.apiService
                .postApi(
                    "BusinessEngineBasicActions",
                    "Service",
                    "CallCustomQueryAction",
                    postData
                )
                .then((data) => {
                    if (data) {
                        this.globalService.parseJsonItems(data.DataRow);
                        this.globalService.parseJsonItems(data.DataList);
                    }

                    defer.resolve(data);
                });
        } catch (error) {}

        return defer.promise;
    }

    RunService(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.Settings && typeof action.Settings == "object")
            action.Settings = JSON.stringify(action.Settings);

        const postData = {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ParentID: action.ParentID,
            ServiceID: action.ServiceID,
            FieldID: action.FieldID,
            ConnectionID: $scope.connectionID,
            PageUrl: document.URL,
            Settings: action.Settings,
            Params: params,
        };

        try {
            this.apiService
                .postApi("BusinessEngine", "Service", "RunService", postData)
                .then((data) => {
                    defer.resolve(data);
                });
        } catch (error) {}

        return defer.promise;
    }

    UpdateFieldDataSource(action, params, $scope) {
        const defer = this.$q.defer();

        try {
            this.apiService
                .post("Module", "GetFieldDataSource", {
                    ModuleID: action.ModuleID,
                    ConnectionID: $scope.connectionID,
                    FieldID: action.Settings.FieldID,
                    PageIndex: this.expressionService.parseExpression(
                        action.Settings.PageIndex,
                        $scope
                    ),
                    PageSize: this.expressionService.parseExpression(
                        action.Settings.PageSize,
                        $scope
                    ),
                    Form: $scope.Form,
                    PageUrl: document.URL,
                })
                .then((data) => {
                    $scope.Field[data.FieldName].DataSource = data.DataSource;

                    defer.resolve(data);
                });
        } catch (error) {}

        return defer.promise;
    }

    CallAction(action, params, $scope) {
        const defer = this.$q.defer();
        const moduleController = $scope.moduleController;

        _.filter(moduleController.actions, (a) => {
            return a.ActionID == action.Settings.ActionID;
        }).map((a) => {
            return moduleController.actionService.callClientAction(
                a,
                $scope,
                action.Settings.Params
            );
        });

        return defer.promise;
    }

    SendSms(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.Settings && typeof action.Settings == "object")
            action.Settings = JSON.stringify(action.Settings);

        const postData = {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ParentID: action.ParentID,
            ServiceID: action.ServiceID,
            FieldID: action.FieldID,
            ConnectionID: $scope.connectionID,
            PageUrl: document.URL,
            Settings: action.Settings,
            Params: params,
        };

        try {
            this.apiService
                .postApi("BusinessEngineBasicActions", "Service", "SendSms", postData)
                .then((data) => {
                    defer.resolve(data);
                });
        } catch (error) {}

        return defer.promise;
    }

    SendEmail(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.Settings && typeof action.Settings == "object")
            action.Settings = JSON.stringify(action.Settings);

        const postData = {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ParentID: action.ParentID,
            ServiceID: action.ServiceID,
            FieldID: action.FieldID,
            ConnectionID: $scope.connectionID,
            PageUrl: document.URL,
            Settings: action.Settings,
            Params: params,
        };

        try {
            this.apiService
                .postApi("BusinessEngineBasicActions", "Service", "SendEmail", postData)
                .then((data) => {
                    defer.resolve(data);
                });
        } catch (error) {}

        return defer.promise;
    }


    WebserviceRestful(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.Settings && typeof action.Settings == "object")
            action.Settings = JSON.stringify(action.Settings);

        const postData = {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ParentID: action.ParentID,
            ServiceID: action.ServiceID,
            FieldID: action.FieldID,
            ConnectionID: $scope.connectionID,
            PageUrl: document.URL,
            Settings: action.Settings,
            Params: params,
        };

        try {
            this.apiService
                .postApi("BusinessEngineBasicActions", "Service", "CallRestfulWebservice", postData)
                .then((data) => {
                    defer.resolve(data);
                });
        } catch (error) {}

        return defer.promise;
    }

    LoginUser(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.Settings && typeof action.Settings == "object")
            action.Settings = JSON.stringify(action.Settings);

        const postData = {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ParentID: action.ParentID,
            ServiceID: action.ServiceID,
            FieldID: action.FieldID,
            ConnectionID: $scope.connectionID,
            PageUrl: document.URL,
            Settings: action.Settings,
            Params: params,
        };

        this.apiService
            .postApi("BusinessEngineBasicActions", "Service", "LoginUser", postData)
            .then(
                (data) => {
                    defer.resolve(data);
                },
                (error) => {
                    defer.reject(error.data);
                }
            );

        return defer.promise;
    }

    RegisterUser(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.Settings && typeof action.Settings == "object")
            action.Settings = JSON.stringify(action.Settings);

        const postData = {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ParentID: action.ParentID,
            ServiceID: action.ServiceID,
            FieldID: action.FieldID,
            ConnectionID: $scope.connectionID,
            PageUrl: document.URL,
            Settings: action.Settings,
            Params: params,
        };

        this.apiService
            .postApi(
                "BusinessEngineBasicActions",
                "Service",
                "RegisterUser",
                postData
            )
            .then(
                (data) => {
                    defer.resolve(data);
                },
                (error) => {
                    defer.reject(error);
                }
            );

        return defer.promise;
    }

    ApproveUser(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.Settings && typeof action.Settings == "object")
            action.Settings = JSON.stringify(action.Settings);

        const postData = {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ParentID: action.ParentID,
            ServiceID: action.ServiceID,
            FieldID: action.FieldID,
            ConnectionID: $scope.connectionID,
            PageUrl: document.URL,
            Settings: action.Settings,
            Params: params,
        };

        try {
            this.apiService
                .postApi(
                    "BusinessEngineBasicActions",
                    "Service",
                    "ApproveUser",
                    postData
                )
                .then((data) => {
                    defer.resolve(data);
                });
        } catch (error) {}

        return defer.promise;
    }

    ResetPassword(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.Settings && typeof action.Settings == "object")
            action.Settings = JSON.stringify(action.Settings);

        const postData = {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ParentID: action.ParentID,
            ServiceID: action.ServiceID,
            FieldID: action.FieldID,
            ConnectionID: $scope.connectionID,
            PageUrl: document.URL,
            Settings: action.Settings,
            Params: params,
        };

        try {
            this.apiService
                .postApi(
                    "BusinessEngineBasicActions",
                    "Service",
                    "ResetPassword",
                    postData
                )
                .then((data) => {
                    defer.resolve(data);
                });
        } catch (error) {}

        return defer.promise;
    }

    RunJavascript(action, params, $scope) {
        return this.runScript($scope, action, params, action.Settings.Code, "");
    }

    RunPrescript(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.HasPreScript)
            return this.runScript(
                $scope,
                action,
                params,
                action.PreScript,
                "Prescript_"
            );
        else defer.resolve();

        return defer.promise;
    }

    RunPostscript(action, params, $scope) {
        const defer = this.$q.defer();

        if (action.HasPostScript)
            return this.runScript(
                $scope,
                action,
                params,
                action.PostScript,
                "Postscript_"
            );
        else defer.resolve();

        return defer.promise;
    }

    runScript($scope, action, params, actionScript, type) {
        const defer = this.$q.defer();
        const actionName = type + action.ActionName;

        actionScript = actionScript || '';

        var scriptStr = `function ${actionName}ControllerAction($scope, moduleController,action,_ActionParam) { 
            const defer = moduleController.$q.defer(); 
            
            try { 
                ${actionScript}

                //{SCRIPT-DONE} 
            } catch (e) { 
                defer.resolve(0,e); 
            } 

            return defer.promise; 
        }`;

        if (actionScript.indexOf("//{SCRIPT-DONE}") >= 0)
            scriptStr = scriptStr.replace("//{SCRIPT-DONE}", "");
        scriptStr = scriptStr.replace("//{SCRIPT-DONE}", "defer.resolve()");

        var newScript = document.createElement("script");
        newScript.innerHTML = scriptStr;
        $("body").append(newScript);

        var actionParam = {};
        _.map(action.Params, (param) => {
            var filledParam = _.find(params, (p) => {
                return p.ParamName == param.ParamName;
            });
            actionParam[param.ParamName] = !filledParam ?
                filledParam.ParamValue :
                param.ParamValue;
        });

        const actionFunction = eval(`${actionName}ControllerAction`);
        new actionFunction(
            $scope,
            $scope.moduleController,
            action,
            actionParam
        ).then((data) => {
            defer.resolve();
        });

        return defer.promise;
    }
}