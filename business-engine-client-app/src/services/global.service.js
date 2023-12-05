export class GlobalService {
    constructor($window, $timeout, $filter, $q) {
        this.$window = $window;
        this.$timeout = $timeout;
        this.$filter = $filter;
        this.$q = $q;
    }

    getUrlParams(url, disableFriendlyParams) {
        var params = {};
        var parser = document.createElement("a");
        parser.href = url;
        var query = parser.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            if (vars[i]) {
                var pair = vars[i].split("=");
                params[pair[0].toLowerCase()] = decodeURIComponent(pair[1]);
            }
        }

        if (!disableFriendlyParams) {
            //parse friendly params
            var friendlyParams = location.pathname.toLowerCase().split("/");
            var index = friendlyParams.length - 2;
            while (index >= 0) {
                if (friendlyParams[index] && friendlyParams.length >= index + 2)
                    params[friendlyParams[index].toLowerCase()] = decodeURIComponent(
                        friendlyParams[index + 1]
                    );

                index = index - 2;
            }
        }

        return params;
    }

    getParameterByName(name, url) {
        const urlParams = new URLSearchParams(window.location.search);
        const _result = urlParams.get(name);
        if (_result) return _result;

        url = url ? url.toLowerCase() : document.URL.toLowerCase();

        const _url = decodeURIComponent(url);
        const _name = name.toLowerCase().replace(/[\[\]]/g, "\\$&");

        const regex = new RegExp("[?&]" + _name + "(=([^&#]*)|&|#|$)");
        const results = regex.exec(_url);

        if (!results) {
            //parse friendly params
            const friendlyParams = location.pathname
                .toLowerCase()
                .replace(/=/g, "/")
                .split("/");
            if (
                friendlyParams.indexOf(_name) >= 0 &&
                friendlyParams.length >= friendlyParams.indexOf(_name) + 2
            )
                return friendlyParams[friendlyParams.indexOf(_name) + 1];
            else return null;
        } else if (!results[2]) {
            return "";
        } else {
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }
    }

    replaceUrlParam(paramName, paramValue, url) {
        let _url = url ? url : document.URL;

        if (paramValue == null) paramValue = "";

        var pattern = new RegExp("\\b(" + paramName + "=).*?(&|#|$)");
        if (_url.search(pattern) >= 0) {
            return _url.replace(pattern, "$1" + paramValue + "$2");
        }

        _url = _url.replace(/[?#]$/, "");
        return (
            _url + (_url.indexOf("?") > 0 ? "&" : "?") + paramName + "=" + paramValue
        );
    }

    pushState(url, title, data) {
        const _title = title ? title : document.title;
        const _data = data ? data : "";
        ("");

        this.$window.history.pushState({ pageTitle: _title }, _data, url);
    }

    parseJsonItems(items) {
        if (!items) return items;

        if (typeof items == "object" && items instanceof Array == false) {
            for (key in items) {
                var value = items[key];
                if (value && value instanceof Array) this.parseJsonItems();
                else if (
                    typeof key == "string" &&
                    typeof value == "string" &&
                    value &&
                    /^[\],:{}\s]*$/.test(
                        value
                        .toLowerCase()
                        .replace(/\\["\\\/bfnrtu]/g, "@")
                        .replace(
                            /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
                            "]"
                        )
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, "")
                    )
                ) {
                    try {
                        items[key] = JSON.parse(value);
                        if (
                            typeof items[key] == "object" &&
                            items[key] instanceof Array == false
                        )
                            this.parseJsonItems(items[key]);
                        else if (
                            typeof items[key] == "object" &&
                            items[key] instanceof Array == true
                        )
                            this.parseJsonItems(items[key]);
                    } catch (e) {
                        items[key] = value;
                        console.log(e);
                    }
                }
            }
        } else if (items instanceof Array) {
            _.forEach(items, (item) => {
                if (typeof item == "object" && item instanceof Array == false)
                    this.parseJsonItems(item);
                if (typeof item == "object" && item instanceof Array == true)
                    this.parseJsonItems(item);
            });
        }
    }

    isJsonString(str) {
        if (!str) return false;
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    getJsonString(str) {
        try {
            var result = JSON.parse(str);
            return result;
        } catch (e) {
            return str;
        }
    }

    bindParams(params, source) {
        _.remove(params, (p) => {
            return (!p.IsCustomParam &&
                _.filter(source, (sp) => {
                    return sp.ParamName == p.ParamName;
                }).length == 0
            );
        });

        _.forEach(_.sortBy(source, ["ViewOrder"]), (sp) => {
            if (
                _.filter(params, (p) => {
                    return sp.ParamName == p.ParamName;
                }).length == 0
            )
                params.push({
                    ParamName: sp.ParamName,
                    ParamValue: sp.ParamValue,
                    IsCustomParam: sp.IsCustomParam,
                    ViewOrder: sp.ViewOrder
                });
        });
    }

    generateGuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            var r = (Math.random() * 16) | 0,
                v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    getErrorHtmlFormat(error) {
        const html = `
        <table class="table table-bordered text-light error-table">
            <tbody>
                <tr>
                    <td class="w-50">Status Code</td>
                    <td>${error.status}</td>
                </tr>
                <tr>
                    <td>Status Text</td>
                    <td>${error.statusText}</td>
                </tr>
                <tr>
                    <td>Error Message</td>
                    <td>${error.data.Message}</td>
                </tr>
                <tr>
                    <td>HResult</td>
                    <td>${error.data.HResult}</td>
                </tr>
                <tr>
                    <td>Exception Method</td>
                    <td>${error.data.ExceptionMethod}</td>
                </tr>
                <tr>
                    <td>Source</td>
                    <td>${error.data.Source}</td>
                </tr>
                <tr>
                    <td>Stack Trace String</td>
                    <td>${error.StackTraceString}</td>
                </tr>
                <tr>
                    <td>Class Name</td>
                    <td>${error.data.ClassName}</td>
                </tr>
            </tbody>
        </table>`;
        return html;
    }

    checkSqlTypes(type) {
        const _type = type ? type.toString().toLowerCase() : "";
        if (!_type.match(/^([a-z]+)(\((\d+(,\d+)?|max)\))?$/)) return false;

        const match = /^([a-z]+)(\((\d+(,\d+)?|max)\))?$/.exec(_type);
        const sqlType = match[1];
        const length = match[3];
        const length2 = match[4];

        switch (sqlType) {
            case "int":
            case "bigit":
            case "smallint":
            case "tinyint":
            case "bit":
            case "float":
            case "real":
            case "money":
            case "smallmoney":
            case "date":
            case "datetime":
            case "smalldatetime":
            case "timestamp":
            case "geography":
            case "geometry":
            case "hierarchyid":
            case "image":
            case "text":
            case "ntext":
            case "sql_variant":
            case "uniqueidentifier":
            case "xml":
                if (!length) return true;
                break;
            case "binary":
            case "varbinary":
            case "char":
            case "datetime2":
            case "datetimeoffset":
            case "varchar":
            case "nvarchar":
            case "time":
                if (length && !length2) return true;
                break;
            case "decimal":
            case "numeric":
                if (length && length2) return true;
                break;
        }
    }

    getUrlQueryFromObject(paramsObject) {
        var params = [];
        _.forEach(paramsObject, (value, key) => {
            params.push(key + "=" + value);
        });

        return params.join("&");
    }

    getParamsFromSqlQuery(query) {
        if (!query) return [];

        var result = [];

        _.forEach(query.match(/@\w+/gim), (paramName) => {
            if (
                this.$filter("filter")(result, (i) => {
                    return i.ParamName == paramName;
                }).length == 0
            )
                result.push({ ParamName: paramName });
        });

        return result;
    }

    previewImage(file) {
        var defer = this.$q.defer();

        var reader = new FileReader();
        reader.onload = (e) => {
            defer.resolve(e.target.result);
        };
        reader.readAsDataURL(file);

        return defer.promise;
    }

    parseJsonItems(items) {
        if (!items) return items;

        if (typeof items == "object" && items instanceof Array == false) {
            for (var key in items) {
                var value = items[key];
                if (value && value instanceof Array) this.parseJsonItems();
                else if (
                    typeof key == "string" &&
                    typeof value == "string" &&
                    value &&
                    /^[\],:{}\s]*$/.test(
                        value
                        .toLowerCase()
                        .replace(/\\["\\\/bfnrtu]/g, "@")
                        .replace(
                            /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
                            "]"
                        )
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, "")
                    )
                ) {
                    try {
                        items[key] = JSON.parse(value);
                        if (
                            typeof items[key] == "object" &&
                            items[key] instanceof Array == false
                        )
                            this.parseJsonItems(items[key]);
                        else if (
                            typeof items[key] == "object" &&
                            items[key] instanceof Array == true
                        )
                            this.parseJsonItems(items[key]);
                    } catch (e) {
                        items[key] = value;
                        console.log(e);
                    }
                }
            }
        } else if (items instanceof Array) {
            _.forEach(items, (item) => {
                if (typeof item == "object" && item instanceof Array == false)
                    this.parseJsonItems(item);
                if (typeof item == "object" && item instanceof Array == true)
                    this.parseJsonItems(item);
            });
        }
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}