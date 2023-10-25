import { monacoDefaultOptions } from "../configs/monac-editor.config";

var bMonacoEditorBuffer = [];
var completionItemProvider;

export function MonacoEditor($rootScope, $filter, $timeout) {
    return {
        restrict: "A",
        replace: true,
        require: "?ngModel",
        priority: 10,
        scope: {
            datasource: "=",
            variables: "=",
            viewModels: "=",
            fields: "=",
            serviceResult: "="
        },
        link: function(scope, element, attrs, ngModel) {
            var language = attrs.language;
            if (!language) return;

            // Register a new language
            if (
                $filter("filter")(monaco.languages.getLanguages(), function(l) {
                    return l.id == language;
                }).length == 0
            ) {
                monaco.languages.register({ id: language });
            }

            if (attrs.height) element.css("min-height", attrs.height);

            var options = monacoDefaultOptions[language] || {};
            options = angular.extend(options, {
                language: language,
                automaticLayout: true,
                theme: "vs-dark",
            });

            var monacoEditor = monaco.editor.create(element[0], options);

            ngModel.$render = function() {
                if (monacoEditor) {
                    var safeViewValue = ngModel.$viewValue || "";
                    monacoEditor.setValue(safeViewValue);
                }
            };

            scope.$on(attrs.bCustomFocus, (e, args) => {
                monacoEditor.focus();
            });

            // set code in one line after value change
            var isChanged = false;
            monacoEditor.onDidChangeModelContent(function(e) {
                var newValue = monacoEditor.getValue();
                if (newValue !== ngModel.$viewValue) {
                    scope.$evalAsync(function() {
                        ngModel.$setViewValue(newValue);
                    });
                }

                if (attrs.oneLine == "true") {
                    // set editor in one line
                    let lineCount = monacoEditor.getModel().getLineCount();
                    if (newValue && !isChanged && lineCount > 1) {
                        monacoEditor.setValue(newValue.replace(/[\r\n]+/g, " "));

                        isChanged = true;
                        $timeout(function() {
                            isChanged = false;
                        });
                    }
                }
            });

            showAutocompletion(getItems(scope.datasource));

            if (bMonacoEditorBuffer.indexOf(language) >= 0) return;

            bMonacoEditorBuffer.push(language);

            function showAutocompletion(obj) {
                // Helper function to return the monaco completion item type of a thing
                function getType(thing, isMember) {
                    isMember =
                        isMember == undefined ?
                        typeof isMember == "boolean" ?
                        isMember :
                        false :
                        false; // Give isMember a default value of false

                    switch ((typeof thing).toLowerCase()) {
                        case "object":
                            return monaco.languages.CompletionItemKind.Class;

                        case "function":
                            return isMember ?
                                monaco.languages.CompletionItemKind.Method :
                                monaco.languages.CompletionItemKind.Function;

                        default:
                            return isMember ?
                                monaco.languages.CompletionItemKind.Property :
                                monaco.languages.CompletionItemKind.Variable;
                    }
                }

                if (!!completionItemProvider) completionItemProvider.dispose();

                // Register object that will return autocomplete items
                completionItemProvider =
                    monaco.languages.registerCompletionItemProvider(language, {
                        // Run this function when the period or open parenthesis is typed (and anything after a space)
                        triggerCharacters: [".", "("],

                        // Function to generate autocompletion results
                        provideCompletionItems: function(model, position, token) {
                            // Split everything the user has typed on the current line up at each space, and only look at the last word
                            var last_chars = model.getValueInRange({
                                startLineNumber: position.lineNumber,
                                startColumn: 0,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column,
                            });
                            var words = last_chars
                                .replace("\t", "")
                                .replace(/(\[(\w+)\])/g, ".0")
                                .split(" ");
                            var active_typing = words[words.length - 1]; // What the user is currently typing (everything after the last space)

                            // If the last character typed is a period then we need to look at member objects of the obj object
                            var is_member =
                                active_typing.charAt(active_typing.length - 1) == ".";

                            // Array of autocompletion results
                            var result = [];

                            // Used for generic handling between member and non-member objects
                            var last_token = obj;
                            var prefix = "";

                            if (is_member) {
                                // Is a member, get a list of all members, and the prefix
                                var parents = active_typing
                                    .substring(0, active_typing.length - 1)
                                    .split(".");
                                last_token = obj[parents[0]];
                                prefix = parents[0];

                                if (last_token) {
                                    // Loop through all the parents the current one will have (to generate prefix)
                                    for (var i = 1; i < parents.length; i++) {
                                        if (last_token.hasOwnProperty(parents[i])) {
                                            prefix += "." + parents[i];
                                            last_token = last_token[parents[i]];
                                        } else {
                                            // Not valid
                                            return result;
                                        }
                                    }
                                }

                                prefix += ".";
                            }

                            // Get all the child properties of the last token
                            for (var prop in last_token) {
                                // Do not show properites that begin with "__"
                                if (last_token.hasOwnProperty(prop) && !prop.startsWith("__")) {
                                    // Get the detail type (try-catch) incase object does not have prototype
                                    var details = "";
                                    try {
                                        details = last_token[prop].__proto__.constructor.name;
                                    } catch (e) {
                                        details = typeof last_token[prop];
                                    }

                                    var insertText = prop;
                                    if (last_token instanceof Array && !isNaN(parseInt(prop))) {
                                        continue;
                                        //in ro felan natonestam...
                                        //insertText = '[' + prop + ']';
                                    }

                                    // Create completion object
                                    var to_push = {
                                        label: prop,
                                        kind: monaco.languages.CompletionItemKind.Variable,
                                        detail: details,
                                        insertText: insertText,
                                        documentation: "...",
                                    };

                                    // Change insertText and documentation for functions
                                    if (to_push.detail.toLowerCase() == "function") {
                                        to_push.insertText += "(";
                                        to_push.documentation = last_token[prop]
                                            .toString()
                                            .split("{")[0]; // Show function prototype in the documentation popup
                                    }

                                    // Add to final results
                                    result.push(to_push);
                                }
                            }

                            return {
                                suggestions: result,
                            };
                        },
                    });
            }

            function getItems(dataSource) {
                if (!dataSource) return {};

                var result = {};

                if (dataSource.indexOf("variables") >= 0 && scope.variables) {
                    _.forEach(scope.variables, function(varb) {
                        if (varb.VariableType == "viewModel" && scope.viewModels) {
                            result[varb.VariableName] = {};
                            $filter("filter")(scope.viewModels, function(vm) {
                                return vm.ViewModelID == varb.ViewModelID;
                            }).map(function(vm) {
                                _.forEach(vm.Properties, function(prop) {
                                    result[varb.VariableName][prop.PropertyName] = "";
                                });
                            });
                        } else if (
                            varb.VariableType == "listOfViewModel" &&
                            scope.viewModels
                        ) {
                            result[varb.VariableName] = [];
                            $filter("filter")(scope.viewModels, function(vm) {
                                return vm.ViewModelID == varb.ViewModelID;
                            }).map(function(vm) {
                                var obj = {};
                                _.forEach(vm.Properties, function(prop) {
                                    obj[prop.PropertyName] = "";
                                });
                                result[varb.VariableName].push(obj);
                            });
                        } else result[varb.VariableName] = "";
                    });
                }

                if (dataSource.indexOf("fields") >= 0 && scope.fields && scope.fields.length) {
                    result.Field = {};
                    result.Form = {};
                    _.forEach(scope.fields, function(field) {
                        result.Field[field.FieldName] = field;

                        result.Form[field.FieldName] = "";
                    });
                }

                if (dataSource.indexOf("actionParams") >= 0 && scope.actionParams && scope.actionParams.length) {
                    result.ActionParms = {};

                    _.forEach(scope.actionParams, function(param) {
                        result.ActionParms[param.ParamName] = "";
                    });
                }

                if (scope.serviceResult) {
                    result._ServiceResult = {
                        Data: {},
                        DataRow: {},
                        DataList: [],
                        TotalCount: 0
                    };
                }

                result._PageParam = {};

                if (language == "javascript") {
                    var moduleController = {};
                    moduleController.callAction = function(actionName, params, ignoreChildActions) {};

                    return {
                        $scope: result,
                        moduleController: moduleController,
                        action: {},
                        _ActionParam: {}
                    };
                } else
                    return result;
            }
        },
    };
}