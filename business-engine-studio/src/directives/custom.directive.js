import moment from "moment";
import $ from "jquery";
import * as bootstrap from 'bootstrap';

import studioTemplate from "../studio.html";

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
                var content = moment(value).fromNow();
                element.text(content);
            } else {
                const format = attrs.format || "MM/DD/YYYY";
                var dt = moment(value);
                var content = dt.isValid() ? dt.format(format) : "";
                element.text(content);
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

export function NotFieldTypeDirective () {
    return {
        template:
            `
            <div class="b-notify notify-warning mb-2">
                <i class="codicon codicon-search-stop b-icon-2"></i>
                <p class="text mb-0"> 
                    Field type 
                    <b>"{{field.FieldType}}"</b>
                    not found in installed extensions and components!.
                </p>
            </div>
            `,
        restrict: 'E',
        replace: true,
        scope: {
            field: "="
        },
        link: function(scope, element, attrs) {
        }
    };
}