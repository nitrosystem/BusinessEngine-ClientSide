import editPageWidget from "./create-page.html";

export class DashboardPagesController {
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

        this.$rootScope = $rootScope;
        this.$compile = $compile;
        this.$scope = $scope;
        this.$timeout = $timeout;
        this.$q = $q;
        this.globalService = globalService;
        this.apiService = apiService;
        this.validationService = validationService;
        this.notifyService = notificationService;
        this.$deferredBroadcast = $deferredBroadcast;

        this.editPageWidget = editPageWidget;

        $scope.$on("onSaveDashboardPage", (e, args) => {
            this.pages = args.pages;
            // const parentPage = args.page.ParentID ?
            //     this.getPageByPageID(args.page.ParentID).Pages :
            //     this.pages;
            // if (args.isNew) parentPage.push(_.clone(args.page));
            // else {
            //     if (this.page.ParentID != args.page.ParentID) {
            //         const oldParentPage = this.page.ParentID ?
            //             this.getPageByPageID(this.page.ParentID).Pages :
            //             this.pages;
            //         oldParentPage.splice(this.pageIndex, 1);
            //         parentPage.push(_.clone(args.page));
            //     } else parentPage[this.pageIndex] = _.clone(args.page);
            // }
        });

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        this.dashboardID = this.globalService.getParameterByName("parent");

        this.running = "get-dashboard-pages";
        this.awaitAction = {
            title: "Loading Dashboard Pages",
            subtitle: "Just a moment for loading dashboard pages...",
        };

        this.apiService
            .get("Studio", "GetDashboardPages", {
                dashboardID: this.dashboardID,
            })
            .then((data) => {
                this.dashboard = data.Dashboard;
                this.pages = data.Pages;
                this.roles = data.Roles;

                this.populatePages(this.pages);
                this.onFocusModule();

                delete this.running;
                delete this.awaitAction;
            });

        this.setForm();
    }

    onFocusModule() {
        this.$rootScope.explorerExpandedItems.push(...["dashboards", this.dashboard.ModuleID, "pages-" + this.dashboard.ModuleID]);
        this.$rootScope.explorerCurrentItem = "pages-" + this.dashboard.ModuleID;
    }

    setForm() {
        this.pageForm = this.validationService.init({
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
            "$.currentPage.Module"
        );
    }

    onAddPageClick(parentID) {
        delete this.awaitAction;
        delete this.running;

        this.workingMode = "edit-page";
        this.$scope.$emit("onShowRightWidget");

        this.page = {
            DashboardID: this.dashboardID,
            ParentID: parentID,
            PageType: 0,
            IsVisible: true,
            InheritPermissionFromDashboard: true,
        };

        this.$timeout(() =>
            this.$scope.$broadcast("onEditDashboardPage", {
                page: this.page,
                allPages: this.allPages,
                roles: this.roles,
                pagesController: this,
            })
        );
    }

    onEditPageClick(page, $index) {
        this.workingMode = "edit-page";
        this.$scope.$emit("onShowRightWidget");

        this.page = _.clone(page);
        this.pageIndex = $index;

        this.$timeout(() =>
            this.$scope.$broadcast("onEditDashboardPage", {
                page: this.page,
                allPages: this.allPages,
                roles: this.roles,
                pagesController: this,
            })
        );
    }

    onUpPageClick(page, $index) {
        const $page = $(`li[data-page-id="${page.PageID}"]`);
        const parentID = $page.parent().data("page-id");
        const parentPage = _.sortBy(
            parentID ? this.getPageByPageID(parentID).Pages : this.pages, ["ViewOrder"]
        );
        const preViewOrder = parentPage[$index - 1].ViewOrder;

        parentPage[$index - 1].ViewOrder = parentPage[$index].ViewOrder;
        parentPage[$index].ViewOrder = preViewOrder;

        var sortedPageIDs = [];
        _.forEach(_.sortBy(parentPage, ["ViewOrder"]), (p) =>
            sortedPageIDs.push(p.PageID)
        );

        const sortedPages = {
            DashboardID: this.dashboardID,
            SortedPageIDs: sortedPageIDs,
        };

        this.sortPages(sortedPages);
    }

    onDownPageClick(page, $index) {
        const $page = $(`li[data-page-id="${page.PageID}"]`);
        const parentID = $page.parent().data("page-id");
        const parentPage = _.sortBy(
            parentID ? this.getPageByPageID(parentID).Pages : this.pages, ["ViewOrder"]
        );
        const nextViewOrder = parentPage[$index + 1].ViewOrder;

        parentPage[$index + 1].ViewOrder = parentPage[$index].ViewOrder;
        parentPage[$index].ViewOrder = nextViewOrder;

        var sortedPageIDs = [];
        _.forEach(_.sortBy(parentPage, ["ViewOrder"]), (p) =>
            sortedPageIDs.push(p.PageID)
        );

        const sortedPages = {
            DashboardID: this.dashboardID,
            SortedPageIDs: sortedPageIDs,
        };

        this.sortPages(sortedPages);
    }

    onLeftPageClick(page) {
        const $page = $(`li[data-page-id="${page.PageID}"]`);
        const parentID = $page.parent().data("page-id");
        const $parent = $(`li[data-page-id="${parentID}"]`);
        const parentPage = this.getPageByPageID(parentID);
        parentPage.Pages.splice(parentPage.Pages.indexOf(page), 1);
        const newParentID = $parent.parent().attr("data-page-id");
        const newParent = newParentID ?
            this.getPageByPageID(newParentID).Pages :
            this.pages;

        _.filter(newParent, (p) => {
            return p.ViewOrder > parentPage.ViewOrder;
        }).map((p) => p.ViewOrder++);

        page.ViewOrder = parentPage.ViewOrder + 1;
        page.IsChild = !!newParentID;
        newParent.push(page);

        var movedPage = {
            PageID: page.PageID,
            ParentID: newParentID,
            ViewOrder: page.ViewOrder,
        };
        var sortedPageIDs = [];
        _.forEach(newParent, (p) => sortedPageIDs.push(p.PageID));

        const sortedPages = {
            DashboardID: this.dashboardID,
            MovedPage: movedPage,
            SortedPageIDs: sortedPageIDs,
        };

        this.sortPages(sortedPages);
    }

    onRightPageClick(page) {
        const $page = $(`li[data-page-id="${page.PageID}"]`);
        const parentID = $page.parent().data("page-id");
        const parentPage = parentID ?
            this.getPageByPageID(parentID).Pages :
            this.pages;
        parentPage.splice(parentPage.indexOf(page), 1);

        const newParentID = $page.prev().data("page-id");
        const newParent = this.getPageByPageID(newParentID);
        page.IsChild = true;
        newParent.Pages.push(page);

        var movedPage = {
            PageID: page.PageID,
            ParentID: newParentID,
            ViewOrder: newParent.Pages.length - 1,
        };

        const sortedPages = {
            DashboardID: this.dashboardID,
            MovedPage: movedPage,
        };

        this.sortPages(sortedPages);
    }

    onPageSwapClick(index, swappedIndex) {
        const pages = this.dashboard.Pages;

        if (swappedIndex > -1 && swappedIndex < pages.length) {
            [pages[index], pages[swappedIndex]] = [pages[swappedIndex], pages[index]];

            pages.map((c) => (c.ViewOrder = this.page.Pages.indexOf(c) + 1));
        }

        var swapedPages = _.filter(pages, (c) => {
            return c.PageID, c.ViewOrder != pages.indexOf(c) + 1;
        }).map((i) => _.pick(i, "PageID", "ViewOrder"));

        this.running = "swap-pages";

        this.awaitAction = {
            title: "Swaping Pages",
            subtitle: "Just a moment for swap page pages...",
        };

        this.apiService.post("Studio", "SortPages", swapedPages).then(() => {
            delete this.running;
        });
    }

    onDeletePageClick(page) {
        swal({
            title: "Are you sure from delete this page?",
            text: "Once deleted, you will not be able to recover this imaginary page!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "delete-dashboard-page";
                this.awaitAction = {
                    title: "Deleting Dashboard page",
                    subtitle: "Just a moment for deleting dashboard page...",
                };

                this.apiService.post("Studio", "DeleteDashboardPage", page).then((data) => {
                        this.notifyService.success(
                            "Dashboard page deleted has been successfully"
                        );

                        this.pages = data;

                        this.$rootScope.refreshSidebarExplorerItems();

                        // const $page = $(`li[data-page-id="${pageID}"]`);
                        // const parentID = $page.parent().data("page-id");
                        // const parentPage = parentID ?
                        //     this.getPageByPageID(parentID).Pages :
                        //     this.pages;
                        // parentPage.splice($index, 1);

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
        });
    }

    sortPages(sortedPages) {
        this.apiService.post("Studio", "SortDashboardPages", sortedPages).then(
            (data) => {
                this.notifyService.success("Sorted pages has been successfully");

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

    isLastPage(page) {
        const $page = $(`li[data-page-id="${page.PageID}"]`);
        const parentID = $page.parent().data("page-id");
        const parentPage = _.sortBy(
            parentID ? this.getPageByPageID(parentID).Pages : this.pages, ["ViewOrder"]
        );

        return parentPage.indexOf(page) == parentPage.length - 1 ? true : false;
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