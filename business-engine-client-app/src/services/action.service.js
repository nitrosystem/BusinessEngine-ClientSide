export class ActionService {
    constructor(
        $timeout,
        $q,
        $compile,
        $window,
        globalService,
        apiService,
        expressionService
    ) {
        this.$timeout = $timeout;
        this.$q = $q;
        this.$compile = $compile;
        this.$window = $window;
        this.globalService = globalService;
        this.apiService = apiService;
        this.expressionService = expressionService;
    }

    callActions(actions, moduleID, fieldID, eventName, $scope) {
        const defer = this.$q.defer();

        var buffer = this.createBuffer([], actions, moduleID, fieldID, eventName);

        this.callActionFromBuffer(buffer, defer, $scope).then((data) => {
            defer.resolve(data);
        }, (error) => {
            defer.resolve(error);
        });

        return defer.promise;
    }

    callActionByName(actionName, params, actions, $scope, ignoreChildActions) {
        const defer = this.$q.defer();

        const action = _.find(actions, (a) => {
            return a.ActionName == actionName;
        });

        action.Params = action.Params || [];

        if (typeof params == "object") {
            _.forOwn(params, (value, key) => {
                var param = _.find(action.Params, (p) => {
                    return p.ParamName == key;
                });
                if (param) param.ParamValue = value;
                else action.Params.push({ ParamName: key, ParamValue: value });
            });
        }

        const actionID = action.ActionID;

        var node = {
            Action: action,
            CompletedActions: [],
            SuccessActions: [],
            ErrorActions: [],
        };

        if (!ignoreChildActions) {
            var completedActions = this.getChildActions([], actions, actionID, 0);
            if (completedActions.length) node.CompletedActions = completedActions;
            var successActions = this.getChildActions([], actions, actionID, 1);
            if (successActions.length) node.SuccessActions = successActions;
            var errorActions = this.getChildActions([], actions, actionID, 2);
            if (errorActions.length) node.ErrorActions = errorActions;
        }

        this.callActionFromBuffer([node], defer, $scope).then((data) => {
            defer.resolve(data);
        }, (error) => {
            defer.reject(error);
        });

        return defer.promise;
    }

    createBuffer(buffer, moduleActions, moduleID, fieldID, eventName) {
        const actions = _.filter(moduleActions, (action) => {
            return (
                action.ModuleID == moduleID &&
                (!fieldID || action.FieldID == fieldID) &&
                action.Event == eventName
            );
        });

        _.forEach(actions, (action) => {
            var node = {
                Action: action,
                CompletedActions: [],
                SuccessActions: [],
                ErrorActions: [],
            };

            this.getChildActions(node.CompletedActions, moduleActions, action.ActionID, 0);
            this.getChildActions(node.SuccessActions, moduleActions, action.ActionID, 1);
            this.getChildActions(node.ErrorActions, moduleActions, action.ActionID, 2);

            buffer.push(node);
        });

        return buffer;
    }

    createBufferByRootAction(moduleActions, action) {
        var buffer = [];

        var node = {
            Action: action,
            CompletedActions: [],
            SuccessActions: [],
            ErrorActions: [],
        };

        this.getChildActions(node.CompletedActions, moduleActions, action.ActionID, 0);
        this.getChildActions(node.SuccessActions, moduleActions, action.ActionID, 1);
        this.getChildActions(node.ErrorActions, moduleActions, action.ActionID, 2);

        buffer.push(node);

        return buffer;
    }

    getChildActions(buffer, moduleActions, parentID, parentResultStatus) {
        const actions = _.filter(moduleActions, (action) => {
            return (
                action.Event == "OnActionCompleted" &&
                action.ParentID == parentID &&
                action.ParentResultStatus == parentResultStatus
            );
        });

        _.forEach(actions, (action) => {
            var node = {
                Action: action,
                CompletedActions: [],
                SuccessActions: [],
                ErrorActions: [],
            };

            this.getChildActions(
                node.CompletedActions,
                moduleActions,
                action.ActionID,
                0
            );
            this.getChildActions(node.SuccessActions, moduleActions, action.ActionID, 1);
            this.getChildActions(node.ErrorActions, moduleActions, action.ActionID, 2);

            buffer.push(node);
        });

        return buffer;
    }

    callActionFromBuffer(buffer, defer, $scope) {
        if (!buffer || !buffer.length) {
            defer.resolve();
            return defer.promise;
        }

        var node = buffer[0];
        var action = node.Action;

        this.callAction(action, $scope).then((data) => {
                    if (data && data.invalidConditions) {
                        defer.resolve();
                        return defer.promise;
                    }
                    if (node.SuccessActions.length)
                        this.callActionFromBuffer(node.SuccessActions, defer, $scope);
                    else
                        defer.resolve(data);
                },
                (error) => {
                    if (node.ErrorActions.length)
                        this.callActionFromBuffer(node.ErrorActions, defer, $scope);
                    else
                        defer.reject(error);
                }
            )
            .finally((data) => {
                if (node.CompletedActions.length)
                    this.callActionFromBuffer(node.CompletedActions, defer, $scope);
                else
                    defer.resolve(data);

                buffer.shift();
                this.callActionFromBuffer(buffer, defer, $scope);
            });

        return defer.promise;
    }

    callAction(action, $scope) {
        const defer = this.$q.defer();

        action.Form = $scope.Form;
        action.Field - $scope.Field;
        action.PageUrl = document.URL;

        var actionMethod = action.IsServerSide ? this.callServerAction : this.callClientAction;

        var params = _.cloneDeep(action.Params);
        if (!action.DisableConditionForPreScript) {
            //proccess action conditions
            const isValid = this.expressionService.checkConditions(action.Conditions, $scope);
            if (isValid) {
                //run pre script after applying the conditions 
                this.runPrescript(action, params, $scope).then((data) => {
                    if (!action.IsServerSide) {
                        //proccess and set the action params for example one row in the condition list is "_CurrentUser:UserID > 0"
                        this.proccessActionParams(params, $scope);
                    }

                    // call the action with filled the action params
                    actionMethod.apply(this, [$scope, action, params]).then((data) => {
                            //run post script after performed the action
                            this.runPostscript(action, params, $scope).then(() => {
                                defer.resolve(data);
                            });
                        },
                        (error) => {
                            defer.reject(error);
                        }
                    );
                });
            } else {
                defer.resolve({ invalidConditions: true });
            }
        } else {
            this.runPrescript(action, params, $scope).then((data) => {
                if (!action.IsServerSide) {
                    this.proccessActionParams(params, $scope);
                }

                const isValid = this.expressionService.checkConditions(action.Conditions, $scope);
                if (isValid) {
                    actionMethod.apply(this, [$scope, action, params]).then((data) => {
                        this.runPostscript(action, params, $scope).then(() => {
                            defer.resolve(data);
                        });
                    }, (error) => {
                        this.setActionResults(action, error, $scope);
                        defer.reject(error);
                    });
                } else {
                    defer.resolve({ invalidConditions: true });
                }
            });
        }

        return defer.promise;
    }

    callClientAction($scope, action, params) {
        const defer = this.$q.defer();

        try {
            const actionFunction = eval(`${action.ActionType}ActionController`);
            const actionController = new actionFunction(this, $scope);
            if (typeof eval("actionController.execute") == "function") {
                actionController.execute(action, params, defer).then((data) => {
                    //after running the action and now fill variables with the action results 
                    this.setActionResults(action, data, $scope);

                    defer.resolve(data);
                }, (error) => {
                    this.setActionResults(action, error, $scope);
                    defer.reject(error.data);
                })
            } else {
                throw new Error('');
            }
        } catch (error) {
            console.error('the action controller not found!.');

            defer.reject({ error: 'the action controller not found!.' });
        }

        return defer.promise;
    }

    callServerAction($scope, action) {
        const defer = this.$q.defer();

        this.apiService.post("Module", "CallAction", {
            ActionID: action.ActionID,
            ModuleID: action.ModuleID,
            ConnectionID: $scope.connectionID,
            Form: $scope.Form,
            Field: $scope.Field,
            PageUrl: document.URL,
        }).then((data) => {
                if (data) {
                    this.globalService.parseJsonItems(data);

                    this.assignScopeData(data, $scope);
                }

                defer.resolve(data);
            },
            (error) => {
                defer.reject(error.data);
            }
        );

        return defer.promise;
    }

    assignScopeData(serverObjects, $scope) {
        _.forOwn(serverObjects, (value, key) => {
            if (key == 'Field') {
                //این قسمت باید بازنویسی شود و با فعال کردن کدهای زیر آبجکت فیلد دچار مشکل می شود
                // _.forOwn(value, (fieldData, fieldName) => {
                //     $scope.Field[fieldName] = {...$scope.Field[fieldName], ...fieldData };
                //     _.filter($scope.moduleController.fields, (f) => { return f.FieldName == fieldName }).map((f) => {
                //         $scope.moduleController.fields[$scope.moduleController.fields.indexOf(f)] = $scope.Field[fieldName]
                //     });
                // });
            } else {
                if ($scope[key])
                    value && typeof value == 'object' ? $scope[key] = {...$scope[key], ...value } : value;
                else
                    $scope[key] = value;
            }
        });
    }

    proccessActionParams(actionParams, $scope) {
        _.forEach(actionParams, (item) => {
            item.ParamValue = this.expressionService.parseExpression(
                item.ParamValue,
                $scope
            );
        });
    }

    setActionResults(action, data, $scope) {
        _.forEach(action.Results, (item) => {
            const value = this.processActionResultsToken(
                item.RightExpression,
                data,
                $scope,
                item.ExpressionParsingType
            );

            this.expressionService.setVariableValue(
                item.LeftExpression,
                $scope,
                value
            );
        });
    }

    processActionResultsToken(expression, data, $scope, expressionParsingType) {
        var result;

        const match = /(?:_ServiceResult)\.?(.[^{}:\$,]+)?$/.exec(expression);
        if (match) {
            if (expression == match[0] && !match[1]) result = data;
            else result = _.get(data, match[1]);
        } else result = this.expressionService.parseExpression(expression, $scope, expressionParsingType);

        return result;
    }

    runPrescript(action, params, $scope) {
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

    runPostscript(action, params, $scope) {
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