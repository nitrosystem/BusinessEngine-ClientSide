import { GlobalSettings } from "./configs/global.settings";
import { activityBarItems } from "./configs/activity-bar.config";

import createScenarioTemplate from "./scenario-management/scenarios/create-scenario.html";
import entitiesTemplate from "./scenario-management/entities/entities.html";
import createEntityTemplate from "./scenario-management/entities/create-entity.html";
import viewModelsTemplate from "./scenario-management/view-models/view-models.html";
import createViewModelTemplate from "./scenario-management/view-models/create-view-model.html";
import servicesTemplate from "./scenario-management/services/services.html";
import createServiceTemplate from "./scenario-management/services/create-service.html";
import createDashboardTemplate from "./scenario-management/dashboards/create-dashboard.html";
import dashboardPagesTemplate from "./scenario-management/dashboards/pages.html";
import createDashboardPageTemplate from "./scenario-management/dashboards/create-page.html";
import actionsTemplate from "./scenario-management/actions/actions.html";
import createFormTemplate from "./scenario-management/forms/create-form.html";
import createListTemplate from "./scenario-management/lists/create-list.html";
import createDetailsTemplate from "./scenario-management/details/create-details.html";
import createActionTemplate from "./scenario-management/actions/create-action.html";
import moduleBuilderTemplate from "./scenario-management/module-builder/module-builder.html";
import definedListsTemplate from "./scenario-management/defined-lists/defined-lists.html";
import providerSettingsTemplate from "./scenario-management/providers/provider-settings.html";
import extensionsTemplate from "./extensions/extensions.html";
import pageResourcesTemplate from "./page-resources/page-resources.html";
import librariesTemplate from "./libraries/libraries.html";

export class StudioController {
    constructor($scope, $rootScope, $timeout, $q, $compile, globalService, apiService, eventService) {
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$timeout = $timeout;
        this.$q = $q;
        this.$compile = $compile;
        this.globalService = globalService;
        this.apiService = apiService;
        this.eventService = eventService

        // this.eventService.register('keydown', (e) => {
        //     debugger
        // });

        $scope.$on("onGotoPage", (e, args) => {
            const subParamsUrl = args.subParams ? this.globalService.getUrlQueryFromObject(args.subParams) : "";

            this.createOrGotoTab(
                args.page,
                args.parentID,
                args.id,
                args.title,
                subParamsUrl,
                args.activityBar,
            );
        });

        $scope.$on("onUnauthorized401", (e, args) => {
            location.reload();
        });

        $scope.$on("onUpdateCurrentTab", (e, args) => {
            if (args && args.id == this.$rootScope.currentTab.id)
                this.updateCurrentTab(args.id, args.title);
            else
                this.updateTabInfo(args.id, args.title, args.key);

            this.setTabsContentHeight();
        });

        $scope.$on("onChangeActivityBar", (e, args) => {
            if (args) this.onActivityBarItemClick(args.name, args.title, args.disableActivityBarCallback);
        });

        $scope.$on("onShowRightWidget", (e, args) => {
            if (args && args.controller) args.controller.currentFieldFocused = false;

            $("body").addClass("overflow-hidden");

            this.$timeout(() => {
                $(".b-right-widget").addClass("visible");
            });
        });

        $scope.$on("onHideRightWidget", (e, args) => {
            $("body").removeClass("overflow-hidden");

            $(".b-right-widget").removeClass("visible");
        });

        $scope.$on("onUpdateExplorerItems", (e, args) => {
            this.onGetStudioOptions();
        });

        $scope.$on("onCloseModule", (e, args) => {
            this.onCloseTabClick(this.$rootScope.currentTab.key)
        });

        this.activityBarItems = activityBarItems;
        this.onActivityBarItemClick("explorer");
        this.$rootScope.explorerExpandedItems = [];

        this.onPageLoad();
    }

    onPageLoad() {
        this.returnUrl = this.globalService.getParameterByName("return-url");
        console.log(this.returnUrl);

        this.onGetStudioOptions().then((data) => {
            if (!GlobalSettings.scenarioName) {
                if (this.scenarios.length)
                    this.$timeout(() => window["wnSelectScenario"].show());
                else {
                    this.$rootScope.tabs = [];
                    this.createOrGotoTab("create-scenario");
                }

                return;
            }

            const currentTabs = this.globalService.getJsonString(
                sessionStorage.getItem(
                    "bEngineCurrentTabs_" + GlobalSettings.scenarioName
                ) || "[]"
            );
            currentTabs.forEach((tab) => delete tab.isLoaded);
            this.$rootScope.tabs = currentTabs;

            const moduleType = this.globalService.getParameterByName("m");
            const parentID = this.globalService.getParameterByName("parent");
            const id = this.globalService.getParameterByName("id");
            const subParams = this.getSubParams();

            if (moduleType)
                this.createOrGotoTab(moduleType, parentID, id, "", subParams);
            else if (!moduleType && this.$rootScope.tabs.length)
                this.onTabClick(this.$rootScope.tabs[0]);
        });
    }

    onGetStudioOptions() {
        const defer = this.$q.defer();

        this.running = "get-studio-options";
        this.awaitAction = {
            title: "Loading Studio Options",
            subtitle: "Just a moment for loading studio options...",
        };

        this.apiService.get("Studio", "GetStudioOptions").then((data) => {
            this.scenarios = data.Scenarios;
            this.$rootScope.scenario = data.Scenario;
            this.$rootScope.groups = data.Groups || [];
            this.$rootScope.explorerItems = data.ExplorerItems;

            delete this.running;
            delete this.awaitAction;

            defer.resolve(data);
        });

        return defer.promise;
    }

    createOrGotoTab(moduleType, parentID, id, title, subParamsUrl, activityBar, disableActivityBarCallback) {
        var tab = _.find(this.$rootScope.tabs, (tab) => {
            return (
                tab.moduleType == moduleType && tab.parentID == parentID && tab.id == id
            );
        });

        if (tab) {
            this.$rootScope.currentTab = tab;
        } else {
            const module = this.getModuleContent(moduleType);

            if (!module.content) {
                this.onTabClick(this.$rootScope.tabs[0]);
                return;
            }

            tab = {
                key: this.getTabKey(),
                moduleType: moduleType,
                parentID: parentID,
                id: id,
                title: title ? title : module.title,
                icon: module.icon,
                content: module.content,
                subParamsUrl: subParamsUrl,
                isLoaded: true,
                isNewItem: !id,
            };

            this.$rootScope.tabs.push(tab);
            sessionStorage.setItem("bEngineCurrentTabs_" + GlobalSettings.scenarioName, JSON.stringify(this.$rootScope.tabs));

            this.$rootScope.currentTab = tab;
        }

        let url = this.getBaseUrl(tab.moduleType, id);
        if (tab.parentID) url += "&parent=" + tab.parentID;
        if (tab.id) url += "&id=" + tab.id;
        if (tab.subParamsUrl) url += "&" + tab.subParamsUrl;
        this.globalService.pushState(url);

        this.$rootScope.currentTab.isLoaded = true;
        this.onActivityBarItemClick(activityBar ? activityBar : "explorer", '', this.globalService.getParameterByName('disableActivityBarCallback', subParamsUrl));
        this.$rootScope.$broadcast(`onTab--${tab.key}Selected`);

        this.setTabsContentHeight();
    }

    getTabKey() {
        while (true) {
            const key = "tab--" + Math.floor(Math.random() * 1000).toString();
            if (_.filter(this.$rootScope.tabs, (t) => t.key == key).length == 0)
                return key;
        }
    }

    updateCurrentTab(id, title) {
        if (this.$rootScope.currentTab) {
            var tab = this.$rootScope.tabs[this.$rootScope.tabs.indexOf(this.$rootScope.currentTab)];
            tab.id = id;
            tab.title = title;
            tab.isNewItem = false;

            sessionStorage.setItem(
                "bEngineCurrentTabs_" + GlobalSettings.scenarioName,
                JSON.stringify(this.$rootScope.tabs)
            );

            const url = this.globalService.replaceUrlParam("id", tab.id);
            this.globalService.pushState(url);
        }
    }

    updateTabInfo(id, title, key) {
        _.filter(this.$rootScope.tabs, (t) => { return t.key == key }).map((tab) => {
            tab.id = id;
            tab.title = title;
            tab.isNewItem = false;
        });
    }

    onTabClick(tab) {
        if (this.$rootScope.currentTab != tab)
            this.createOrGotoTab(
                tab.moduleType,
                tab.parentID,
                tab.id,
                tab.title,
                tab.subParamsUrl
            );
    }

    onCloseTabClick(tabKey, $event) {
        const tab = _.find(this.$rootScope.tabs, (t) => {
            return t.key == tabKey;
        });
        const $index = this.$rootScope.tabs.indexOf(tab);
        const closedCurrentTab =
            this.$rootScope.tabs.indexOf(this.$rootScope.currentTab) == $index;

        this.$rootScope.tabs.splice($index, 1);

        if (closedCurrentTab && this.$rootScope.tabs.length && $index > 0)
            this.onTabClick(this.$rootScope.tabs[$index - 1]);
        else if (closedCurrentTab && this.$rootScope.tabs.length && $index == 0)
            this.onTabClick(this.$rootScope.tabs[0]);

        if (!this.$rootScope.tabs.length)
            this.onActivityBarItemClick("explorer");

        sessionStorage.setItem(
            "bEngineCurrentTabs_" + GlobalSettings.scenarioName,
            JSON.stringify(this.$rootScope.tabs)
        );

        this.setTabsContentHeight();

        if ($event) $event.stopPropagation();
    }

    onCloseAllTabsClick() {
        sessionStorage.removeItem(
            "bEngineCurrentTabs_" + GlobalSettings.scenarioName
        );

        this.$rootScope.tabs = [];
        delete this.$rootScope.currentTab;
    }

    onActivityBarItemClick(name, title, disableActivityBarCallback) {
        if (this.$rootScope.currentActivityBar == name) return;

        _.filter(this.activityBarItems, (i) => { return i.name == name; }).map((i) => {
            if (!i.sidebarPaneDisabled) this.$rootScope.currentActivityBar = name;

            if (title) i.title = title;

            if (i.callback && !disableActivityBarCallback) this[i.callback].apply(this, i);
        });
    }

    onGotoExtensions() {
        this.$scope.$emit("onGotoPage", { page: "extensions", activityBar: "extensions" });
    }

    onGotoPageResources() {
        this.$scope.$emit("onGotoPage", { page: "page-resources", activityBar: "page-resources" });
    }

    onGotoLibraries() {
        this.$scope.$emit("onGotoPage", { page: "libraries", activityBar: "libraries" });
    }

    onSelectScenarioClick() {
        _.filter(this.scenarios, (s) => {
            return s.ScenarioID == this.scenarioID;
        }).map((s) => {
            const url = this.globalService.replaceUrlParam("s", s.ScenarioName);
            this.globalService.pushState(url);

            this.$timeout(() => location.reload());
        });
    }

    onAddScenarioClick() {
        this.$rootScope.tabs = this.$rootScope.tabs || [];

        window["wnSelectScenario"].hide();

        this.createOrGotoTab("create-scenario");
    }

    setTabsContentHeight() {
        setTimeout(() => {
            $('#workspaceTabsContent').css('margin-top', $('#workspaceTabs').height().toString() + 'px');
        });
    }

    getBaseUrl(moduleType, id) {
        moduleType = moduleType ? moduleType : GlobalSettings.moduleType;

        var baseUrl =
            GlobalSettings.siteRoot +
            "DesktopModules/BusinessEngine/Studio.aspx?s={s}&p={p}&a={a}&m={m}{d}";
        baseUrl = baseUrl.replace("{s}", GlobalSettings.scenarioName);
        baseUrl = baseUrl.replace("{p}", GlobalSettings.portalID);
        baseUrl = baseUrl.replace("{a}", GlobalSettings.portalAliasID);
        baseUrl = baseUrl.replace("{m}", moduleType);
        baseUrl = baseUrl.replace(
            "{d}",
            GlobalSettings.dnnModuleID && !id && !GlobalSettings.moduleID ?
                "&d=" + GlobalSettings.dnnModuleID :
                ""
        );

        return baseUrl;
    }

    getSubParams() {
        var result = [];

        const params = this.globalService.getUrlParams(document.URL, true);
        for (const param in params) {
            if (
                param == "module" ||
                param == "field" ||
                param == "page" ||
                param == "type" ||
                param == "st" ||
                param == "dashboard" ||
                param == "mode" ||
                param == "disableactivitybarcallback" ||
                param == "return-url"
            ) {
                const paramValue = this.globalService.getParameterByName(param);
                if (paramValue) result.push(`${param}=${paramValue}`);
            }
        }

        return result.join("&");
    }

    getModuleContent(moduleType) {
        var result = {};

        switch (moduleType) {
            case "create-scenario":
                result.title = "New Scenario";
                result.icon = "archive";
                result.content = createScenarioTemplate;
                break;
            case "entities":
                result.title = "Entities";
                result.icon = "combine";
                result.content = entitiesTemplate;
                break;
            case "create-entity":
                result.title = "New Entity";
                result.icon = "table";
                result.content = createEntityTemplate;
                break;
            case "view-models":
                result.title = "View Models";
                result.icon = "references";
                result.content = viewModelsTemplate;
                break;
            case "create-view-model":
                result.title = "New View Model";
                result.icon = "table";
                result.content = createViewModelTemplate;
                break;
            case "services":
                result.title = "Services";
                result.icon = "versions";
                result.content = servicesTemplate;
                break;
            case "create-service":
                result.title = "New Service";
                result.icon = "table";
                result.content = createServiceTemplate;
                break;
            case "create-dashboard":
                result.title = "New Dashboard";
                result.icon = "layout-sidebar-left";
                result.content = createDashboardTemplate;
                break;
            case "dashboard-pages":
                result.title = "Dashboard Pages";
                result.icon = "layout-sidebar-left";
                result.content = dashboardPagesTemplate;
                break;
            case "create-dashboard-page":
                result.title = "Edit Page";
                result.icon = "copy";
                result.content = createDashboardPageTemplate;
                break;
            case "create-form":
                result.title = "Create Form";
                result.content = createFormTemplate;
                result.icon = "window";
                break;
            case "create-list":
                result.title = "Create List";
                result.content = createListTemplate;
                result.icon = "window";
                break;
            case "create-details":
                result.title = "Create Details";
                result.content = createDetailsTemplate;
                result.icon = "window";
                break;
            case "actions":
                result.title = "Actions";
                result.icon = "github-action";
                result.content = actionsTemplate;
                break;
            case "create-action":
                result.title = "New Action";
                result.icon = "symbol-event";
                result.content = createActionTemplate;
                break;
            case "module-builder":
                result.title = "Module Builder";
                result.content = moduleBuilderTemplate;
                result.icon = "preview";
                break;
            case "provider-settings":
                result.title = "Provider Settings";
                result.content = providerSettingsTemplate;
                result.icon = "window";
                break;
            case "defined-lists":
                result.title = "Defined Lists";
                result.content = definedListsTemplate;
                result.icon = "list-ordered";
                break;
            case "extensions":
                result.title = "Extensions";
                result.icon = "extensions";
                result.content = extensionsTemplate;
                break;
            case "page-resources":
                result.title = "Page Resources";
                result.icon = "multiple-windows";
                result.content = pageResourcesTemplate;
                break;
            case "libraries":
                result.title = "Libraries";
                result.icon = "library";
                result.content = librariesTemplate;
                break;
        }

        return result;
    }
}