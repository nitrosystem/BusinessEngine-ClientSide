export class ActionService {
    constructor(
        $timeout,
        $q,
        $compile,
        $window,
        globalService,
        apiService,
        expressionService,
        basicActionService
    ) {
        this.$timeout = $timeout;
        this.$q = $q;
        this.$compile = $compile;
        this.$window = $window;
        this.globalService = globalService;
        this.apiService = apiService;
        this.expressionService = expressionService;
        this.basicActionService = basicActionService;
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
                this.basicActionService.RunPrescript(action, params, $scope).then((data) => {
                    if (!action.IsServerSide) {
                        //proccess and set the action params for example one row in the condition list is "_CurrentUser:UserID > 0"
                        this.proccessActionParams(params, $scope);
                    }

                    // call the action with filled the action params
                    actionMethod.apply(this, [$scope, action, params]).then((data) => {
                            //run post script after performed the action
                            this.basicActionService.RunPostscript(action, params, $scope).then(() => {
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
            this.basicActionService.RunPrescript(action, params, $scope).then((data) => {
                if (!action.IsServerSide) {
                    this.proccessActionParams(params, $scope);
                }

                const isValid = this.expressionService.checkConditions(action.Conditions, $scope);
                if (isValid) {
                    actionMethod.apply(this, [$scope, action, params]).then((data) => {
                        this.basicActionService.RunPostscript(action, params, $scope).then(() => {
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

        this.basicActionService[action.ActionType](action, params, $scope).then((data) => {
            //after running the action and now fill variables with the action results 
            this.setActionResults(action, data, $scope);

            defer.resolve(data);
        }, (error) => {
            this.setActionResults(action, error, $scope);
            defer.reject(error.data);
        })

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
                $scope
            );

            this.expressionService.setVariableValue(
                item.LeftExpression,
                $scope,
                value
            );
        });
    }

    processActionResultsToken(expression, data, $scope) {
        var result;

        if (!data) return data;

        const match = /(?:_ServiceResult)\.?(.[^{}:\$,]+)?$/.exec(expression);
        if (match) {
            if (expression == match[0] && !match[1]) result = data;
            else result = _.get(data, match[1]);
        } else result = this.expressionService.parseExpression(expression, $scope);

        return result;
    }
}