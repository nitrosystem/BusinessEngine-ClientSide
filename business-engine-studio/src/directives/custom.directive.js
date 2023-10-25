import studioTemplate from "../studio.html";
import Choices from "choices.js";
import "choices.js/public/assets/styles/choices.min.css";
import moment from "moment";

export function StudioDirective() {
    return {
        restrict: "E",
        templateUrl: studioTemplate,
        link: function(scope, element, attrs) {},
        replace: true,
    };
}

export function CustomDateDirective() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            var value = attrs.bCustomDate;
            if (attrs.relative == "true") {
                value = moment(value).fromNow();
                element.text(value);
            }
        },
        replace: true,
    };
}

export function CustomResizeableDirective() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            $(element[0]).resizable({
                minWidth: parseFloat(getComputedStyle(document.documentElement).fontSize) * 15,
                maxWidth: parseFloat(getComputedStyle(document.documentElement).fontSize) * 45,
                handles: "e",
                start: (event, ui) => {
                    $(ui).addClass("start-dragged");
                },
                stop: (event, ui) => {
                    $(ui).removeClass("start-dragged");
                },
            });
        },
    };
}

export function CustomTooltipDirective($timeout) {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            $timeout(() => {
                new bootstrap.Tooltip(element[0]);
            });
        },
    };
}

export function CustomPopoverDirective($timeout) {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            $timeout(() => {
                new bootstrap.Popover(element[0], {
                    html: true,
                    sanitize: false,
                    customClass: "b-popover-dark",
                });
            }, 500);
        },
    };
}

export function CustomModalDirective() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            if (attrs.id) window[attrs.id] = new bootstrap.Modal(element[0]);
        },
    };
}

export function CustomFocusDirective($timeout) {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            scope.$on(attrs.bCustomFocus, function(e) {
                $timeout(function() {
                    element[0].focus();
                });
            });
        },
    };
}

export function CustomSidebarDirective($timeout, $rootScope) {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            element.addClass("sidebar");

            $rootScope.$watch("currentActivityBar", (newVal, oldVal) => {
                if (newVal != oldVal) {
                    if (newVal == attrs.bCustomSidebar) $(element).show();
                    else $(element).hide();
                }
            });
        },
    };
}

export function CustomSelectDirective($timeout, $rootScope) {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            const choices = new Choices(element[0], {
                silent: true,
                items: [{
                        value: "Value 1",
                        label: "Label 1",
                        id: 1,
                    },
                    {
                        value: "Value 2",
                        label: "Label 2",
                        id: 2,
                        customProperties: {
                            random: "I am a custom property",
                        },
                    },
                ],
                choices: [{
                        value: "Value 1",
                        label: "Label 1",
                        id: 1,
                    },
                    {
                        value: "Value 2",
                        label: "Label 2",
                        id: 2,
                        customProperties: {
                            random: "I am a custom property",
                        },
                    },
                ],
                renderChoiceLimit: -1,
                maxItemCount: -1,
                addItems: true,
                addItemFilter: null,
                removeItems: true,
                removeItemButton: false,
                editItems: false,
                allowHTML: true,
                duplicateItemsAllowed: true,
                delimiter: ",",
                paste: true,
                searchEnabled: true,
                searchChoices: true,
                searchFloor: 1,
                searchResultLimit: 4,
                searchFields: ["label", "value"],
                position: "auto",
                resetScrollPosition: true,
                shouldSort: true,
                shouldSortItems: false,
                sorter: () => {},
                placeholder: true,
                placeholderValue: null,
                searchPlaceholderValue: null,
                prependValue: null,
                appendValue: null,
                renderSelectedChoices: "auto",
                loadingText: "Loading...",
                noResultsText: "No results found",
                noChoicesText: "No choices to choose from",
                itemSelectText: "Press to select",
                addItemText: (value) => {
                    return `Press Enter to add <b>"${value}"</b>`;
                },
                maxItemText: (maxItemCount) => {
                    return `Only ${maxItemCount} values can be added`;
                },
                valueComparer: (value1, value2) => {
                    return value1 === value2;
                },
                classNames: {
                    containerOuter: "b-input form-control",
                    containerInner: "",
                    input: "b-input",
                    inputCloned: "choices__input--cloned",
                    list: "choices__list",
                    listItems: "choices__list--multiple",
                    listSingle: "choices__list--single",
                    listDropdown: "choices__list--dropdown",
                    item: "choices__item",
                    itemSelectable: "choices__item--selectable",
                    itemDisabled: "choices__item--disabled",
                    itemChoice: "choices__item--choice",
                    placeholder: "choices__placeholder",
                    group: "choices__group",
                    groupHeading: "choices__heading",
                    button: "choices__button",
                    activeState: "is-active",
                    focusState: "is-focused",
                    openState: "is-open",
                    disabledState: "is-disabled",
                    highlightedState: "is-highlighted",
                    selectedState: "is-selected",
                    flippedState: "is-flipped",
                    loadingState: "is-loading",
                    noResults: "has-no-results",
                    noChoices: "has-no-choices",
                },
                // Choices uses the great Fuse library for searching. You
                // can find more options here: https://fusejs.io/api/options.html
                fuseOptions: {
                    includeScore: true,
                },
                labelId: "",
                callbackOnInit: null,
                callbackOnCreateTemplates: null,
            });

            // new Choices(element, {
            //   allowHTML: true,
            //   placeholderValue: "This is a placeholder set in the config",
            //   searchPlaceholderValue: "This is a search placeholder",
            // });

            $timeout(() => {
                new Choices("[data-trigger]");
            }, 1000);
        },
    };
}

export function EsckeyDirective() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            element.bind('keydown keyup keypress', function(event) {
                if (event.which === 27) { // 27 = esc key
                    scope.$apply(function() {
                        scope.$eval(attrs.bEscKey);
                    });

                    event.preventDefault();
                }
            });
            scope.$on('$destroy', function() {
                element.unbind('keydown keypress')
            });
        },
    };
}