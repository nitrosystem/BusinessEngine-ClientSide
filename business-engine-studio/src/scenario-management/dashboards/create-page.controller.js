export class CreateDashboardPageController {
    constructor(
        $scope,
        $rootScope,
        studioService,
        $compile,
        $timeout,
        $q,
        globalService,
        apiService,
        validationService,
        notificationService,
        $deferredBroadcast
    ) {
        "ngInject";

        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.studioService = studioService;
        this.$compile = $compile;
        this.$timeout = $timeout;
        this.$q = $q;
        this.globalService = globalService;
        this.apiService = apiService;
        this.validationService = validationService;
        this.notifyService = notificationService;
        this.$deferredBroadcast = $deferredBroadcast;

        $scope.$on("onEditDashboardPage", (e, args) => {
            this.page = {
                ...args.page,
                ... { IncludeModule: !!args.page.Module },
            };
            this.allPages = args.allPages;
            this.roles = args.roles;
            this.pagesController = args.pagesController;

            this.setForm();
        });

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        const id = this.globalService.getParameterByName("id");
        const moduleID = this.globalService.getParameterByName("parent");

        this.moduleType = this.globalService.getParameterByName("m");
        if (this.moduleType == "dashboard-pages") return;

        this.running = "get-page";
        this.awaitAction = {
            title: "Loading Dashboard Page",
            subtitle: "Just a moment for loading dashboard page...",
        };

        this.apiService
            .get("Studio", "GetDashboardPage", {
                moduleID: moduleID,
                pageID: id,
            })
            .then(
                (data) => {
                    this.dashboard = data.Dashboard;
                    this.page = {
                        ...data.Page || {},
                        ... { IncludeModule: data.Page && !!data.Page.Module },
                    };
                    this.pages = data.Pages;
                    this.roles = data.Roles;

                    this.populatePages(this.pages);
                    this.onFocusModule();

                    delete this.running;
                    delete this.awaitAction;
                },
                (error) => {
                    this.awaitAction.isError = true;
                    this.awaitAction.subtitle = error.statusText;
                    this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                    this.notifyService.error(error.data.Message);

                    delete this.running;
                }
            );

        this.setForm();
    }

    onFocusModule() {
        if (this.page.PageID) {
            const items = this.studioService.createSidebarExplorerPath(this.page.PageID, "Page");
            this.$rootScope.explorerExpandedItems.push(...items);
        } else
            this.$rootScope.explorerExpandedItems.push(...["dashboards", this.dashboard.ModuleID, "pages-" + this.dashboard.ModuleID]);

        this.$rootScope.explorerCurrentItem = !this.page || !this.page.PageID ? "create-dashboard-page-" + this.dashboard.ModuleID : this.page.PageID;
    }

    setForm() {
        this.form = this.validationService.init({
                PageType: {
                    id: "drpPageType",
                    required: true,
                },
                PageName: {
                    id: "txtPageName",
                    required: true,
                },
                Title: {
                    id: "txtPageTitle",
                    required: true,
                },
            },
            true,
            this.$scope,
            "$.page"
        );

        this.moduleForm = this.validationService.init({
                ModuleType: {
                    id: "drpModuleType",
                    required: true,
                },
                ModuleName: {
                    id: "txtModuleName",
                    required: true,
                },
                ModuleTitle: {
                    id: "txtModuleTitle",
                    required: true,
                },
            },
            true,
            this.$scope,
            "$.page.Module"
        );
    }

    onAddPageDataProperty() {
        this.page.Settings = this.page.Settings || {};

        this.page.Settings[`Data${Object.keys(this.page.Settings).length + 1}`] = "";
    }

    onPageDataBlur(key, value, $index) {
        var oldKey = Object.keys(this.page.Settings)[$index];
        delete this.page.Settings[oldKey];

        this.page.Settings[key] = value;
    }

    onDeletePageDataProperty(key) {
        delete this.page.Settings[key];
    }

    onSavePageClick() {
        this.form.validated = true;
        this.form.validator(this.page);
        if (this.form.valid) {
            this.running = "save-page";
            this.awaitAction = {
                title: "Saving Page",
                subtitle: "Just a moment for saving the dashboard page...",
            };

            this.apiService.post("Studio", "SaveDashboardPage", this.page).then(
                (data) => {
                    this.notifyService.success(
                        "Dashboard page updated has been successfully"
                    );

                    // const isNewItem = !this.page.PageID;
                    // this.page = {...data.Page, ... { IncludeModule: !!data.Module } };

                    this.pages = data.Pages;

                    if (this.moduleType == "dashboard-pages") {
                        this.$scope.$emit("onSaveDashboardPage", {
                            pages: this.pages
                        });

                        this.$scope.$emit("onHideRightWidget");

                        this.$timeout(() => {
                            delete this.pagesController.workingMode;
                            delete this.pagesController.page;
                        }, 200);
                    }

                    //this.populatePages(this.pages);
                    this.$scope.$emit("onUpdateExplorerItems");

                    delete this.awaitAction;
                    delete this.running;
                },
                (error) => {
                    this.awaitAction.isError = true;
                    this.awaitAction.subtitle = error.statusText;
                    this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                    this.notifyService.error(error.data.Message);

                    delete this.running;
                }
            );
        }
    }

    onCancelPageClick() {
        this.$scope.$emit("onHideRightWidget");

        this.$timeout(() => {
            if (this.moduleType == "dashboard-pages") {
                delete this.pagesController.workingMode;
                delete this.pagesController.page;
            }
        }, 200);
    }

    onSaveModuleClick() {
        this.page.Module = this.page.Module || {};
        this.page.Module.DashboardID = this.page.DashboardID;
        this.page.Module.PageID = this.page.PageID;

        this.moduleForm.validated = true;
        this.moduleForm.validator(this.page.Module);
        if (this.moduleForm.valid) {
            this.running = "save-module";
            this.awaitAction = {
                title: "Saving Module",
                subtitle: "Just a moment for saving the dashboard page module...",
            };

            this.apiService
                .post("Studio", "SaveDashboardPageModule", this.page.Module)
                .then(
                    (data) => {
                        this.page.Module = data;

                        this.notifyService.success(
                            "Dashboard page module updated has been successfully"
                        );

                        delete this.awaitAction;
                        delete this.running;
                    },
                    (error) => {
                        this.awaitAction.isError = true;
                        this.awaitAction.subtitle = error.statusText;
                        this.awaitAction.desc =
                            this.globalService.getErrorHtmlFormat(error);

                        this.notifyService.error(error.data.Message);

                        delete this.running;
                    }
                );
        }
    }

    onDeleteModuleClick() {
        if (confirm("Are you sure delete this module?")) {
            this.running = "delete-page-module";
            this.awaitAction = {
                title: "Deleting Page Module",
                subtitle: "Just a moment for deleting page module...",
            };

            this.apiService
                .post("Studio", "DeleteDashboardPageModule", {
                    ID: this.page.Module.ModuleID,
                })
                .then(
                    (data) => {
                        delete this.page.Module;

                        this.notifyService.success("Dashboard page module deleted has been successfully");

                        this.$rootScope.refreshSidebarExplorerItems();

                        delete this.awaitAction;
                        delete this.running;
                    },
                    (error) => {
                        this.awaitAction.isError = true;
                        this.awaitAction.subtitle = error.statusText;
                        this.awaitAction.desc =
                            this.globalService.getErrorHtmlFormat(error);

                        this.notifyService.error(error.data.Message);

                        delete this.running;
                    }
                );
        }
    }

    onGotoModuleBuilderClick() {
        this.$scope.$emit("onGotoPage", {
            page: "module-builder",
            id: this.page.Module.ModuleID,
            title: this.page.Module.ModuleTitle,
        });
    }

    populatePages(pages) {
        var allPages = [{ PageID: null, LevelTitle: "None" }];

        _.forEach(pages, function(c) {
            c.ParentID = 0;
            runner(c, 0);
        });

        this.allPages = allPages;

        function runner(page, level) {
            var preTitle = "";
            for (var i = 0; i < level; i++) {
                preTitle += "...";
            }
            page.LevelTitle = preTitle + page.Title;
            page.Level = level;

            allPages.push(page);

            _.forEach(page.Pages, function(c) {
                c.ParentID = page.PageID;
                runner(c, level + 1);
            });
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

        findNestedPage(this.pages);

        return result;
    }

    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }
}