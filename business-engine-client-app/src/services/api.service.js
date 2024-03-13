import { GlobalSettings } from "../configs/global.settings";

export class ApiService {
    constructor($http, $q, $templateCache, $rootScope, Upload) {
        this.$http = $http;
        this.uploadService = Upload;
        this.$q = $q;
        this.$templateCache = $templateCache;
        this.$rootScope = $rootScope;
    }

    get(controller, methodName, params, customHeaders) {
        return this.getApi(
            "BusinessEngine",
            controller,
            methodName,
            params,
            customHeaders
        );
    }

    getApi(module, controller, methodName, params, customHeaders) {
        const defer = this.$q.defer();

        const url =
            GlobalSettings.apiBaseUrl +
            module +
            "/API/" +
            controller +
            "/" +
            methodName;

        var headers = customHeaders ? customHeaders : GlobalSettings.apiHeaders;
        headers = {...headers, ... { Requestverificationtoken: $('[name="__RequestVerificationToken"]').val() } }

        this.$http({
            method: "GET",
            url: url,
            headers: headers,
            params: params,
        }).then(
            (data) => {
                defer.resolve(data.data);
            },
            (error) => {
                if (error.status == 401) this.$rootScope.$broadcast('onUnauthorized401', { error: error }); // if user is logoff then refresh page for redirect to login page
                defer.reject(error);
            }
        );

        return defer.promise;
    }

    post(controller, methodName, data, params, customHeaders) {
        return this.postApi(
            "BusinessEngine",
            controller,
            methodName,
            data,
            params,
            customHeaders
        );
    }

    postApi(module, controller, methodName, data, params, customHeaders) {
        const defer = this.$q.defer();

        const url =
            GlobalSettings.apiBaseUrl +
            module +
            "/API/" +
            controller +
            "/" +
            methodName;

        var headers = customHeaders ? customHeaders : GlobalSettings.apiHeaders;
        headers = {...headers, ... { Requestverificationtoken: $('[name="__RequestVerificationToken"]').val() } }

        this.$http({
            method: "POST",
            url: url,
            headers: headers,
            data: data,
            params: params,
        }).then(
            (data) => {
                defer.resolve(data.data);
            },
            (error) => {
                if (error.status == 401) this.$rootScope.$broadcast('onUnauthorized401', { error: error }); // if user is logoff then refresh page for redirect to login page
                defer.reject(error);
            }
        );

        return defer.promise;
    }

    uploadFile(file) {
        const defer = this.$q.defer();

        var formdata = new FormData();
        angular.forEach([file], function(value, key) {
            formdata.append(key, value);
        });

        this.$http({
            url: "/DesktopModules/BusinessEngine/API/Common/UploadImage",
            method: 'POST',
            data: formdata,
            headers: {
                'Content-Type': undefined
            }
        }).then((data) => {
            defer.resolve(data);
        });

        return defer.promise;
    }

    uploadImage(params) {
        const defer = this.$q.defer();

        var file = params.file;

        this.uploadService.upload({
            url: "/DesktopModules/BusinessEngine/API/Common/UploadImage",
            headers: {
                ScenarioID: GlobalSettings.scenarioID,
                Requestverificationtoken: $('[name="__RequestVerificationToken"]').val()
            },
            data: params,
        }).then(function(data) {
            defer.resolve(data.data);
        }, function(error) {
            defer.reject(error);
        }, function(evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            file.Progress = progressPercentage;
        });

        return defer.promise;
    }

    getContent(url, isCache) {
        const defer = this.$q.defer();
        const cache = isCache ? { cache: this.$templateCache } : {};

        this.$http.get(url, cache).then(
            (content) => {
                defer.resolve(content.data);
            },
            (error) => {
                defer.reject(error);
            }
        );

        return defer.promise;
    }

    async getAsync(controller, methodName, data) {
        const url = GlobalSettings.apiBaseUrl + controller + '/' + methodName;
        var headers = GlobalSettings.apiHeaders;

        const ajaxPromise = await new Promise((resolve, reject) => {
            this._$http({
                method: 'GET',
                url: url,
                headers: headers,
                params: data
            }).then((data) => {
                resolve(data.data);
            }, (error) => {
                reject(error);
            });
        });

        return ajaxPromise;
    }

    loadScript(FILE_URL, async = true, type = "text/javascript") {
        return new Promise((resolve, reject) => {
            try {
                const scriptEle = document.createElement("script");
                scriptEle.type = type;
                scriptEle.async = async;
                scriptEle.src = FILE_URL;

                scriptEle.addEventListener("load", (ev) => {
                    resolve({ status: true });
                });

                scriptEle.addEventListener("error", (ev) => {
                    reject({
                        status: false,
                        message: `Failed to load the script ${FILE_URL}`
                    });
                });

                document.body.appendChild(scriptEle);
            } catch (error) {
                reject(error);
            }
        });
    }
}