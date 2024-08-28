import { GlobalSettings } from "../configs/global.settings";

export class ApiService {
    constructor($rootScope, $http, $q, $templateCache, Upload, notificationService) {
        this.$rootScope = $rootScope;
        this.$http = $http;
        this.$q = $q;
        this.$templateCache = $templateCache;
        this.uploadService = Upload;
        this.notifyService = notificationService;
    }

    get(controller, methodName, params, customHeaders) {
        return this.getApi('BusinessEngine', controller, methodName, params, customHeaders);
    }

    getApi(module, controller, methodName, params, customHeaders) {
        const defer = this.$q.defer();

        const url = GlobalSettings.apiBaseUrl + module + '/API/' + controller + "/" + methodName;

        var headers = customHeaders ?? GlobalSettings.apiHeaders;
        headers = { ...headers, ... { Requestverificationtoken: $('[name="__RequestVerificationToken"]').val() } };

        this.$http({
            method: "GET",
            url: url,
            headers: headers,
            params: params,
        }).then((data) => {
            defer.resolve((data ?? {}).data);
        }, (error) => {
            defer.reject(error);

            this.notifyService.error(((error ?? {}).data || {}).Message);
            console.error(error);
        });

        return defer.promise;
    }

    post(controller, methodName, data, params, customHeaders) {
        return this.postApi('BusinessEngine', controller, methodName, data, params, customHeaders);
    }

    postApi(module, controller, methodName, data, params, customHeaders) {
        const defer = this.$q.defer();

        const url = GlobalSettings.apiBaseUrl + module + '/API/' + controller + "/" + methodName;

        var headers = customHeaders ?? GlobalSettings.apiHeaders;
        headers = { ...headers, ... { Requestverificationtoken: $('[name="__RequestVerificationToken"]').val() } };

        this.$http({
            method: "POST",
            url: url,
            headers: headers,
            data: data,
            params: params,
        }).then((data) => {
            defer.resolve((data ?? {}).data);
        }, (error) => {
            defer.reject(error);

            this.notifyService.error(((error ?? {}).data || {}).Message);
            console.error(error);
        });

        return defer.promise;
    }

    upload(apiUrl, file, customHeaders) {
        const defer = this.$q.defer();

        var headers = customHeaders ?? GlobalSettings.apiHeaders;
        headers = { ...headers, ... { Requestverificationtoken: $('[name="__RequestVerificationToken"]').val() } };

        this.uploadService.upload({
            url: window.bEngineGlobalSettings.apiBaseUrl + apiUrl,
            headers: headers || GlobalSettings.apiHeaders,
            data: { files: file },
        }).then((data) => {
            defer.resolve(data.data);
        }, (error) => {
            if (error.status == 401) location.reload(); // if user is logoff then refresh page for redirect to login page

            defer.reject(error);

            this.notifyService.error(((error ?? {}).data || {}).Message);
            console.error(error);
        }, (evt) => {
            defer.notify(evt);
        });

        return defer.promise;
    }

    uploadFile(file) {
        const defer = this.$q.defer();

        var formdata = new FormData();
        angular.forEach([file], function (value, key) {
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
        }, (error) => {
            if (error.status == 401) location.reload(); // if user is logoff then refresh page for redirect to login page

            defer.reject(error)
        })

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

    loadScript(FILE_URL, type = "text/javascript") {
        const scriptEle = document.createElement("script");
        scriptEle.type = type;
        scriptEle.src = FILE_URL;

        scriptEle.addEventListener("load", (ev) => {
            //resolve({ status: true });
        });

        document.body.appendChild(scriptEle);
    }
}