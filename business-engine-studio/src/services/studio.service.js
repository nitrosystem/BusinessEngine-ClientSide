export class StudioService {
    constructor($rootScope, globalService) {
        "ngInject";

        this.$rootScope = $rootScope;
        this.globalService = globalService;
    }

    getCurrentTab() {
        const moduleType = this.globalService.getParameterByName("m");
        const parentID = this.globalService.getParameterByName("parent");
        const id = this.globalService.getParameterByName("id");

        return this.getTab(moduleType, parentID, id);
    }

    getTab(moduleType, parentID, id) {
        const tab = _.find(this.$rootScope.tabs, (tab) => {
            return (
                tab.moduleType == moduleType && tab.parentID == parentID && tab.id == id
            );
        });

        return tab;
    }

    setFocusModuleDelegate(controller, callback) {
        const tab = this.getCurrentTab();
        this.$rootScope.$on(`onTab--${tab.key}Selected`, (e, args) => {
            callback.apply(controller);

            const $elem = $(`#bExplorer [data-items*='${tab.moduleType}']`);
            if ($elem.length) {
                $elem.addClass("show");
                $elem.prev().removeClass("collapsed");
            }
        });
    }

    createSidebarExplorerPath(itemID, type) {
        var result = [itemID];
        const findPages = (id) => {
            const item = _.find(this.$rootScope.explorerItems, (i) => {
                return i.ItemID == id;
            });
            if (item) {
                result.push(item.ItemID);

                if (item.ParentID && !item.DashboardPageParentID) {
                    const dashboard = _.find(this.$rootScope.explorerItems, (i) => {
                        return i.Type == "Dashboard" && i.ParentID == item.ParentID;
                    });
                    result.push(dashboard.ItemID);
                    result.push("dashboards");
                    if (type == "Page" || type == "Module")
                        result.push("pages-" + dashboard.ItemID);
                }

                findPages(item.DashboardPageParentID);
            }
        };

        _.filter(this.$rootScope.explorerItems, (i) => {
            return i.ItemID == itemID;
        }).map((item) => {
            if (!item.ParentID) {
                result.push(itemID);
            } else {
                findPages(itemID);
            }
        });

        console.log(result);
        return result;
    }
}