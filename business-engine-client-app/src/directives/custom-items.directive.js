export function DashboardLinkDirective($compile, expressionService) {
    return {
        restrict: "EA",
        replace: true,
        link: (scope, element, attrs) => {
            element.on("click", ($event) => {
                const pageName = attrs.page;

                var paramList = [];
                var params = (attrs.params || "").split("&");
                _.forEach(params, (p) => {
                    var parsedParam = expressionService.parseExpression(
                        p,
                        scope,
                        "",
                        true
                    );
                    paramList.push(parsedParam);
                });
                const pageParams = paramList.join("&");

                scope.$emit("onGotoDashboardPage", {
                    pageName: pageName,
                    params: pageParams,
                    isUpdatePageParams: true,
                });

                $event.preventDefault();
                if ($event) $event.stopPropagation();
            });
        },
    };
}

export function BindText(expressionService) {
    return {
        restrict: "A",
        replace: true,
        link: (scope, element, attrs) => {
            if (!attrs.bindText) return;

            function parseValue() {
                var content = expressionService.parseExpression(attrs.bindText, scope, "", true) || "";

                if (attrs.digistsNumber == "true") {
                    const number = _.toNumber(content);
                    content = number.toLocaleString();
                }

                element.html(content);
            }

            parseValue();

            const matches = attrs.bindText.match(/(\w+)(\.([^{},=\-\+]+))?$/gm);
            _.forEach(matches, function(m) {
                const match = /(\w+)(\.([^{},=\-\+"]+))?/gm.exec(m);
                const property = match[0];
                scope.$watch(
                    property,
                    function(newVal, oldVal) {
                        if (newVal != oldVal) {
                            parseValue();
                        }
                    },
                    true
                );
            });

            element.removeAttr("bind-text");
        },
        replace: true,
    };
}

export function BindDate(expressionService) {
    return {
        restrict: "A",
        replace: true,
        link: (scope, element, attrs) => {
            if (!attrs.bindDate) return;

            function parseValue() {
                const content = expressionService.parseExpression(attrs.bindDate, scope, "", true) || "";

                var value = "";

                if (attrs.relative == "true")
                    value = moment(content).fromNow();
                else {
                    const format = attrs.format || "MM/DD/YYYY";
                    var dt = moment(content);
                    value = dt.isValid() ? dt.format(format) : "";
                }

                element.html(value);
            }

            parseValue();

            const matches = attrs.bindDate.match(/(\w+)(\.([^{},=\-\+]+))?$/gm);
            _.forEach(matches, function(m) {
                const match = /(\w+)(\.([^{},=\-\+"]+))?/gm.exec(m);
                const property = match[0];
                scope.$watch(property, function(newVal, oldVal) {
                    if (newVal != oldVal) {
                        parseValue();
                    }
                });
            });

            element.removeAttr("bind-date");
        },
        replace: true,
    };
}

export function BindImage($filter, expressionService) {
    return {
        restrict: "A",
        replace: true,
        link: function(scope, element, attrs) {
            if (!attrs.bindImage) return;

            function parseValue() {
                var value =
                    expressionService.parseExpression(attrs.bindImage, scope, "", true) ||
                    "";

                var content = "";

                if (value && typeof value == "object") {
                    if (value instanceof Array && value.length) {
                        if (!isNaN(attrs.imageIndex) &&
                            value.length >= parseInt(attrs.imageIndex)
                        )
                            value = value[attrs.imageIndex - 1];
                        else {
                            value = _.orderBy(value, ["IsMain"], ["asc"])[0];
                        }
                    }

                    if (
                        attrs.showThumbnail &&
                        value.Thumbnails &&
                        value.Thumbnails.length
                    )
                        content = !isNaN(attrs.showThumbnail) &&
                        value.Thumbnails.length >= parseInt(attrs.showThumbnail) ?
                        value.Thumbnails[attrs.showThumbnail - 1] :
                        value.Thumbnails[0];
                    else content = value.FilePath;
                } else if (value && typeof value == "string") content = value;
                else if (attrs.noImage) content = attrs.noImage;

                if (content) element.attr("src", content);
            }

            parseValue();

            const matches = attrs.bindImage.match(/(\w+)(\.([^{},=\-\+]+))?$/gm);
            _.forEach(matches, function(m) {
                const match = /(\w+)(\.([^{},=\-\+"]+))?/gm.exec(m);
                const property = match[0];
                scope.$watch(
                    property,
                    function(newVal, oldVal) {
                        if (newVal != oldVal) {
                            parseValue();
                        }
                    },
                    true
                );
            });

            element.removeAttr("bind-image");
        },
        replace: true,
    };
}

export function bindUrl($filter, expressionService) {
    return {
        restrict: "A",
        replace: true,
        link: function(scope, element, attrs) {
            if (!attrs.bindUrl) return;

            function parseValue() {
                var value =
                    expressionService.parseExpression(attrs.bindUrl, scope, "", true) ||
                    "";

                var contents = "";

                if (value && typeof value == "string") {
                    contents = value;
                }

                element.attr("href", contents);
            }

            parseValue();

            const matches = attrs.bindUrl.match(/(\w+)(\.([^{},=\-\+]+))?$/gm);
            _.forEach(matches, function(m) {
                const match = /(\w+)(\.([^{},=\-\+"]+))?/gm.exec(m);
                const property = match[0];
                scope.$watch(
                    property,
                    function(newVal, oldVal) {
                        if (newVal != oldVal) {
                            parseValue();
                        }
                    },
                    true
                );
            });

            element.removeAttr("bind-url");
        },
        replace: true,
    };
}

export function FocusDirective($timeout, $parse) {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            var exprs = attrs.bFocus;
            var item1 = exprs.split('==')[0];
            var item2 = exprs.split('==')[1];
            // var t = scope.$eval(item1);
            item1 = $parse(item1)(scope);
            if (_.isEqual(item1, item2)) {
                $timeout(function() {
                    element[0].focus();
                });
            }
        },
    };
}