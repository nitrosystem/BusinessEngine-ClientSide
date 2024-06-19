export class DashboardController {
    constructor($scope, $timeout, $compile, globalService, apiService) {
        this.$scope = $scope;
        this.$timeout = $timeout;
        this.$compile = $compile;
        this.globalService = globalService;
        this.apiService = apiService;

        this.$scope.userID = window.bEngineGlobalSettings.userID;
        this.$scope.userDisplayName = window.bEngineGlobalSettings.userDisplayName;
        this.$scope.userPhoto = `/DnnImageHandler.ashx?mode=profilepic&userId=${window.bEngineGlobalSettings.userID}&h=48&w=48`;
        //this.$scope.userRoles = window.bEngineGlobalSettings.userRoles;

        $scope.$on("onGotoDashboardPage", (e, args) => {
            if (args.pageName && !args.pageID) {
                const page = this.getPageByPageName(args.pageName);
                args.pageID = (page || {}).PageID;
            }

            this.gotoDashboardPage(args.pageID, args.params, args.isUpdatePageParams);
        });

        window.addEventListener("popstate", (event) => {
            var pageName = this.globalService.getParameterByName("page");
            if (pageName) {
                const params = this.globalService.getUrlParams(document.URL, true);
                var paramList = [];
                for (const param in params) {
                    if (param == "d" || param == "page") continue;

                    const paramValue = this.globalService.getParameterByName(param);
                    if (paramValue) paramList.push(`${param}=${paramValue}`);
                }

                const urlParams = paramList.join("&");
                const page = this.getPageByPageName(pageName);
                this.gotoDashboardPage(page.PageID, urlParams, false);
            }
        }, false);
    }

    onInitModule(moduleID, moduleName, connectionID, now) {
        this.module = { moduleID: moduleID, moduleName: moduleName };
        this.$scope.connectionID = connectionID;
        this.dateNow = this.$scope.dateNow = now;

        this.onPageLoad();
    }

    onPageLoad() {
        this.apiHeader = { ModuleID: this.module.moduleID };

        this.apiService.get("Module", "GetDashboardData", {}, this.apiHeader).then((data) => {
            this.baseUrl = data.BaseUrl;
            this.$scope.pages = data.Pages;
            this.$scope.pageList = { name: 'abc' };

            this.$timeout(() => {
                this.$scope.loadedDashboard = true;
            });

            if (data.Dashboard.DashboardType == 1) this.paramChar = "&";
            else if (data.Dashboard.DashboardType == 2) this.paramChar = "?";

            const pageName = this.globalService.getParameterByName("page");
            const page = this.getPageByPageName(pageName);
            if (page) {
                this.$timeout(() => {
                    this.gotoDashboardPage(page.PageID);
                }, 1000);
            }
        }, (error) => {
            console.error(error);
        });
    }

    gotoDashboardPage(pageID, params, isUpdatePageParams) {
        this.$scope.currentPageID = pageID;
        const page = this.$scope.currentPage = this.getPageByPageID(pageID);
        const moduleID = page.Module ? page.Module.ModuleID : null;
        const moduleName = page.Module ? page.Module.ModuleName : null;
        const paramsQuery = params ? "&" + params : "";

        if (isUpdatePageParams) {
            const url = this.baseUrl + this.paramChar + "page=" + page.PageName + paramsQuery;
            this.globalService.pushState(url);
        }

        if (moduleID && moduleName) {
            const template = this.getAngularModuleTemplate(moduleID, moduleName);
            $("#dashboardPageModule").html(this.$compile(template)(this.$scope));
        }
    }

    getPageByPageID(pageID) {
        var result;

        const findNestedPage = (pages) => {
            _.forEach(pages, (p) => {
                if (p.PageID == pageID) result = p;
                else return findNestedPage(p.Pages);
            });
        };

        findNestedPage(this.$scope.pages);

        return result;
    }

    getPageByPageName(pageName) {
        var result;

        const findNestedPage = (pages) => {
            _.forEach(pages, (p) => {
                if (p.PageName == pageName) result = p;
                else return findNestedPage(p.Pages || []);
            });
        };

        findNestedPage(this.$scope.pages);

        return result;
    }

    getAngularModuleTemplate(moduleID, moduleName) {
        const result = `
        <div id="pnlBusinessEngine${moduleID}" data-module="${moduleID}" ng-controller="moduleController as $"
          ng-init="$.onInitModule(-1,'${moduleID}', '${moduleName}','${this.$scope.connectionID}')">
        </div>`;

        return result;
    }
}