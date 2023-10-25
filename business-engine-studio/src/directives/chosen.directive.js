import angular from "angular";
import "chosen-js/chosen.jquery";

var chosenModule,
    indexOf = [].indexOf ||
    function(item) {
        for (var i = 0, l = this.length; i < l; i++) {
            if (i in this && this[i] === item) return i;
        }
        return -1;
    };

angular.module("localytics.directives", []);

chosenModule = angular.module("localytics.directives");

chosenModule.provider("chosen", function() {
    var options;
    options = {};
    return {
        setOption: function(newOpts) {
            angular.extend(options, newOpts);
        },
        $get: function() {
            return options;
        },
    };
});

chosenModule.directive("chosen", [
    "chosen",
    "$timeout",
    "$parse",
    function(config, $timeout, $parse) {
        var CHOSEN_OPTION_WHITELIST, NG_OPTIONS_REGEXP, isEmpty, snakeCase;
        NG_OPTIONS_REGEXP =
            /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/;
        CHOSEN_OPTION_WHITELIST = [
            "allowSingleDeselect",
            "disableSearch",
            "disableSearchThreshold",
            "enableSplitWordSearch",
            "inheritSelectClasses",
            "maxSelectedOptions",
            "noResultsText",
            "placeholderTextMultiple",
            "placeholderTextSingle",
            "searchContains",
            "groupSearch",
            "singleBackstrokeDelete",
            "width",
            "displayDisabledOptions",
            "displaySelectedOptions",
            "includeGroupLabelInSelected",
            "maxShownResults",
            "caseSensitiveSearch",
            "hideResultsOnSelect",
            "rtl",
        ];
        snakeCase = function(input) {
            return input.replace(/[A-Z]/g, function($1) {
                return "_" + $1.toLowerCase();
            });
        };
        isEmpty = function(value) {
            var key;
            if (angular.isArray(value)) {
                return value.length === 0;
            } else if (angular.isObject(value)) {
                for (key in value) {
                    if (value.hasOwnProperty(key)) {
                        return false;
                    }
                }
            }
            return true;
        };
        return {
            restrict: "A",
            require: ["select", "?ngModel"],
            priority: 1,
            link: function(scope, element, attr, ctrls) {
                var $render,
                    chosen,
                    directiveOptions,
                    disableIfEmpty,
                    empty,
                    initIfNotInitialized,
                    match,
                    ngModel,
                    ngSelect,
                    options,
                    startLoading,
                    stopLoading,
                    timer,
                    trackBy,
                    valuesExpr,
                    viewWatch;

                scope.$on("onFocusElement", (e, args) => {
                    if (args.elementID == attr.id) {
                        element.trigger("chosen:activate");

                        $("html, body").animate({
                            scrollTop: $(element).offset().top,
                        });
                    }
                });

                scope.disabledValuesHistory = scope.disabledValuesHistory ?
                    scope.disabledValuesHistory : [];
                element = $(element);
                element.addClass("localytics-chosen");
                ngSelect = ctrls[0];
                ngModel = ctrls[1];
                match = attr.ngOptions && attr.ngOptions.match(NG_OPTIONS_REGEXP);
                valuesExpr = match && $parse(match[7]);
                trackBy = match && match[8];
                directiveOptions = scope.$eval(attr.chosen) || {};
                options = _.clone(config);
                angular.extend(options, directiveOptions);
                _.forEach(attr, function(value, key) {
                    if (indexOf.call(CHOSEN_OPTION_WHITELIST, key) >= 0) {
                        return attr.$observe(key, function(value) {
                            var prefix;
                            prefix = String(element.attr(attr.$attr[key])).slice(0, 2);
                            options[snakeCase(key)] =
                                prefix === "{{" ? value : scope.$eval(value);
                            return disableIfEmpty();
                        });
                    }
                });
                options.inheritSelectClasses = true;
                options.inherit_select_classes = true;
                startLoading = function() {
                    return element
                        .addClass("loading")
                        .attr("disabled", true)
                        .trigger("chosen:updated");
                };
                stopLoading = function() {
                    element.removeClass("loading");
                    if (angular.isDefined(attr.disabled)) {
                        element.attr("disabled", attr.disabled);
                    } else {
                        element.attr("disabled", false);
                    }
                    return element.trigger("chosen:updated");
                };
                chosen = null;
                empty = false;
                initIfNotInitialized = function() {
                    if (!chosen) {
                        return scope.$evalAsync(function() {
                            if (!chosen) {
                                return (chosen = element.chosen(options).data("chosen"));
                            }
                        });
                    }
                };
                disableIfEmpty = function() {
                    if (chosen && empty) {
                        element.attr("disabled", true);
                    }
                    return element.trigger("chosen:updated");
                };
                if (ngModel) {
                    $render = ngModel.$render;
                    ngModel.$render = function() {
                        var isPrimitive, nextValue, previousValue, valueChanged;
                        initIfNotInitialized();
                        try {
                            previousValue = ngSelect.readValue();
                        } catch (error) {}
                        $render();
                        try {
                            nextValue = ngSelect.readValue();
                        } catch (error) {}
                        isPrimitive = !trackBy && !attr.multiple;
                        valueChanged = isPrimitive ?
                            previousValue !== nextValue :
                            !angular.equals(previousValue, nextValue);
                        if (valueChanged) {
                            return element.trigger("chosen:updated");
                        }
                    };
                    element.on("chosen:hiding_dropdown", function() {
                        return scope.$applyAsync(function() {
                            return ngModel.$setTouched();
                        });
                    });
                    element.on("change", function() {
                        var val = ngSelect.readValue();
                        ngModel.$setViewValue(val);
                    });
                    if (attr.multiple) {
                        viewWatch = function() {
                            return ngModel.$viewValue;
                        };
                        scope.$watch(viewWatch, ngModel.$render, true);
                    }
                } else {
                    initIfNotInitialized();
                }
                attr.$observe("disabled", function() {
                    return element.trigger("chosen:updated");
                });
                if (attr.ngOptions && ngModel) {
                    timer = null;
                    scope.$watchCollection(valuesExpr, function(newVal, oldVal) {
                        return (timer = $timeout(function() {
                            if (angular.isUndefined(newVal)) {
                                return startLoading();
                            } else {
                                empty = isEmpty(newVal);
                                stopLoading();
                                return disableIfEmpty();
                            }
                        }));
                    });
                    return scope.$on("$destroy", function(event) {
                        if (timer != null) {
                            return $timeout.cancel(timer);
                        }
                    });
                }
            },
        };
    },
]);




// import angular from "angular";
// import "chosen-js/chosen.jquery";

// (function (angular) {
//   var AngularChosen = angular.module("localytics.directives", []);

//   function chosen($timeout, $parse, $rootScope) {
//     var EVENTS, scope, linker, watchCollection;

//     /*
//      * List of events and the alias used for binding with angularJS
//      */
//     EVENTS = [
//       {
//         onChange: "change",
//       },
//       {
//         onReady: "chosen:ready",
//       },
//       {
//         onMaxSelected: "chosen:maxselected",
//       },
//       {
//         onShowDropdown: "chosen:showing_dropdown",
//       },
//       {
//         onHideDropdown: "chosen:hiding_dropdown",
//       },
//       {
//         onNoResult: "chosen:no_results",
//       },
//     ];

//     /*
//      * Items to be added in the scope of the directive
//      */
//     scope = {
//       options: "=", // the options array
//       ngModel: "=", // the model to bind to,,
//       ngDisabled: "=",
//     };

//     /*
//      * initialize the list of items
//      * to watch to trigger the chosen:updated event
//      */
//     watchCollection = [];
//     Object.keys(scope).forEach(function (scopeName) {
//       watchCollection.push(scopeName);
//     });

//     /*
//      * Add the list of event handler of the chosen
//      * in the scope.
//      */
//     EVENTS.forEach(function (event) {
//       var eventNameAlias = Object.keys(event)[0];
//       scope[eventNameAlias] = "=";
//     });

//     /* Linker for the directive */
//     linker = function ($scope, iElm, iAttr, ctrls) {
//       var maxSelection = parseInt(iAttr.maxSelection, 10),
//         searchThreshold = parseInt(iAttr.searchThreshold, 10);

//       if (isNaN(maxSelection) || maxSelection === Infinity) {
//         maxSelection = undefined;
//       }

//       if (isNaN(searchThreshold) || searchThreshold === Infinity) {
//         searchThreshold = undefined;
//       }

//       var ngSelect = ctrls[0];
//       var ngModel = ctrls[1];

//       var allowSingleDeselect =
//         $(iElm).attr("allow-single-deselect") !== undefined ? true : false;
//       var noResultsText =
//         $(iElm).attr("no-results-text") !== undefined
//           ? iAttr.noResultsText
//           : "No results found.";
//       var disableSearch =
//         $(iElm).attr("disable-search") !== undefined
//           ? JSON.parse(iAttr.disableSearch)
//           : false;
//       var placeholderTextSingle = iAttr.placeholderTextSingle;
//       var placeholderTextMultiple = iAttr.placeholderTextMultiple;
//       var displayDisabledOptions =
//         $(iElm).attr("display-disabled-options") !== undefined
//           ? JSON.parse(iAttr.displayDisabledOptions)
//           : true;
//       var displaySelectedOptions =
//         $(iElm).attr("display-selected-options") !== undefined
//           ? JSON.parse(iAttr.displaySelectedOptions)
//           : true;

//       $timeout(function () {
//         $(iElm).chosen({
//           width: "100%",
//           max_selected_options: maxSelection,
//           disable_search_threshold: searchThreshold,
//           search_contains: true,
//           allow_single_deselect: allowSingleDeselect,
//           no_results_text: noResultsText,
//           disable_search: disableSearch,
//           placeholder_text_single: placeholderTextSingle,
//           placeholder_text_multiple: placeholderTextMultiple,
//           display_disabled_options: displayDisabledOptions,
//           display_selected_options: displaySelectedOptions,
//           inherit_select_classes: true,
//         });

//         $(iElm).on("change", function () {
//           var val = ngSelect.readValue();
//           ngModel.$setViewValue(val);

//           $(iElm).trigger("chosen:updated");
//         });

//         $scope.$watchGroup(
//           watchCollection,
//           function (newVal, oldVal) {
//             $timeout(function () {
//               $(iElm).trigger("chosen:updated");
//             }, 100);
//           },
//           true
//         );
//       });
//     };

//     // return the directive
//     return {
//       name: "chosen",
//       scope: scope,
//       restrict: "A",
//       require: ["select", "?ngModel"],
//       link: linker,
//     };
//   }
//   AngularChosen.directive("chosen", [
//     "$timeout",
//     "$parse",
//     "$rootScope",
//     chosen,
//   ]);
// })(angular);