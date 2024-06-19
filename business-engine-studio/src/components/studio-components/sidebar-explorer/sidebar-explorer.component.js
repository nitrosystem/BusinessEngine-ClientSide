import template from "./sidebar-explorer.component.html";

class SidebarExplorerController {
    constructor($scope, $rootScope, $timeout, $q, globalService, validationService, apiService, notificationService) {
        "ngInject";

        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$timeout = $timeout;
        this.globalService = globalService;
        this.validationService = validationService;
        this.apiService = apiService;
        this.notifyService = notificationService;

        $rootScope.refreshSidebarExplorerItems = () => {
            const defer = $q.defer();

            this.running = "refresh-sidebar-explorer-items";
            this.awaitAction = {
                title: "Refresh Sidebar Explorer Items",
                subtitle: "Just a moment for refresh sidebar explorer items...",
            };

            this.apiService.get("Studio", "RefreshSidebarExplorerItems").then((data) => {
                this.$rootScope.explorerItems = data;

                delete this.running;
                delete this.awaitAction;

                defer.resolve(data);
            });

            return defer.promise;
        }
    }

    $onInit() {
        this.setExplorerItems();

        this.setGroupForm();

        this.$scope.$watch("$.$rootScope.explorerItems", (newVal, oldVal) => {
            if (newVal != oldVal) this.setExplorerItems();
        }, true);

        this.$rootScope.$watch("explorerCurrentItem", (newVal, oldVal) => {
            setTimeout(() => {
                const explorerElement = document.getElementById(newVal);
                if (newVal != oldVal && explorerElement) {
                    const rect = explorerElement.getBoundingClientRect();
                    $("#bExplorer").animate({ scrollTop: rect.top + $("#bExplorer").scrollTop() - 100 }, 600);
                }
            });
        }, true);
    }

    setGroupForm() {
        this.groupForm = this.validationService.init({
                GroupType: {
                    id: "drpGroupType",
                    required: true,
                },
                GroupName: {
                    id: "txtGroupName",
                    required: true,
                },
            },
            true,
            this.$scope,
            "$.group"
        );
    }

    processGroups() {
        _.each(this.$rootScope.groups, (group) => {
            group.Items = [];
            group.Items.push(...(_.filter(this.$rootScope.explorerItems, (e) => { return e.Type == group.ObjectType && e.GroupID == group.GroupID; })));
        });
    }

    setExplorerItems() {
        const items = this.$rootScope.explorerItems || [];

        this.entities = _.filter(items, function(i) {
            return i.Type == "Entity";
        });
        this.entities = _.orderBy(this.entities, ["Title"], ["asc"]);

        this.viewModels = _.filter(items, function(i) {
            return i.Type == "ViewModel";
        });
        this.viewModels = _.orderBy(this.viewModels, ["Title"], ["asc"]);

        this.services = _.filter(items, function(i) {
            return i.Type == "Service";
        });
        this.services = _.orderBy(this.services, ["Title"], ["asc"]);

        this.providers = _.filter(items, function(i) {
            return i.Type == "Provider";
        });
        //this.paymentMethods = _.orderBy(this.paymentMethods, ["Title"], ["asc"]);

        this.paymentMethods = _.filter(items, function(i) {
            return i.Type == "PaymentMethod";
        });
        this.paymentMethods = _.orderBy(this.paymentMethods, ["Title"], ["asc"]);

        this.dashboards = _.filter(items, function(i) {
            return i.Type == "Dashboard";
        });
        _.map(this.dashboards, (d) => {
            const allPages = _.filter(items, (i) => {
                return i.Type == "DashboardPage";
            });
            const pageModules = _.filter(items, (i) => {
                return (
                    i.DashboardPageParentID &&
                    (i.Type == "FormModule" || i.Type == "ListModule")
                );
            });
            this.dashboards = _.orderBy(this.dashboards, ["Title"], ["asc"]);

            d.Pages = [];
            this.setDashboardPages(
                d.ParentID,
                null,
                d.Pages,
                allPages,
                pageModules,
                1
            );
        });

        this.formModules = _.filter(items, function(i) {
            return i.Type == "FormModule" && !i.ParentID;
        });
        this.formModules = _.orderBy(this.formModules, ["Title"], ["asc"]);

        this.listModules = _.filter(items, function(i) {
            return i.Type == "ListModule" && !i.ParentID;
        });
        this.listModules = _.orderBy(this.listModules, ["Title"], ["asc"]);

        this.detailsModules = _.filter(items, function(i) {
            return i.Type == "DetailsModule" && !i.ParentID;
        });
        this.detailsModules = _.orderBy(this.detailsModules, ["Title"], ["asc"]);

        this.processGroups();
    }

    setDashboardPages(dashboardID, parentID, pages, items, pageModules, level) {
        _.filter(items, (p) => {
            return p.ParentID == dashboardID && p.DashboardPageParentID == parentID;
        }).map((p) => {
            p.level = level;
            pages.push(p);

            p.Pages = [];
            this.setDashboardPages(
                dashboardID,
                p.ItemID,
                p.Pages,
                items,
                pageModules,
                level++
            );

            _.filter(pageModules, (m) => {
                return m.DashboardPageParentID == p.ItemID;
            }).map((m) => (p.Module = m));
        });
    }

    onItemClick($event, moduleType, parentID, itemID, title, subParams) {
        moduleType = this.modifyModuleType(moduleType);

        this.$scope.$emit("onGotoPage", {
            page: moduleType,
            parentID: parentID,
            id: itemID,
            title: title,
            subParams: subParams,
        });

        $event.stopPropagation();
    }

    modifyModuleType(moduleType) {
        switch (moduleType) {
            case 'Entity':
                return 'create-entity';
            case 'ViewModel':
                return 'create-view-model';
            case 'Service':
                return 'create-service';
            default:
                return moduleType;
        }
    }

    onRefreshItemsClick() {
        this.$rootScope.refreshSidebarExplorerItems();
    }

    collapseItems($event, ...items) {
        $event.stopPropagation();

        this.$rootScope.explorerExpandedItems = _.pull(
            this.$rootScope.explorerExpandedItems,
            items.join(",")
        );
    }

    isExpanded(...items) {
        return (
            _.filter(items, (i) =>
                _.includes(this.$rootScope.explorerExpandedItems, i)
            ).length > 0
        );
    }

    isExpandedGroup(group) {
        if (_.find(group.Items, (i) => { return this.$rootScope.currentTab && i.ItemID == this.$rootScope.currentTab.id }))
            return true;
        else
            return false;
    }

    onAddGroupClick() {
        this.group = { ScenarioID: this.$rootScope.scenario.ScenarioID, GroupType: 'SidebarExplorer' };
        window["wnEditGroup"].show();
    }

    onCollapseAllItemsClick() {
        $('.list-explorer>ul ul.collapse').removeClass('show');
        $('.list-explorer>ul li.exp-item > a.exp-label').addClass('collapsed');
    }

    onSaveGroupClick() {
        this.groupForm.validated = true;
        this.groupForm.validator(this.group);
        if (this.groupForm.valid) {
            this.running = "save-group";
            this.awaitAction = {
                title: "Creating Group",
                subtitle: "Just a moment for creating sidebar explorer group...",
            };

            this.apiService.post("Studio", "SaveGroup", this.group).then((data) => {
                const isNew = !this.group.GroupID;
                if (isNew) {
                    this.group.GroupID = data;
                    this.$rootScope.groups.push(this.group);
                } else {
                    _.filter(this.$rootScope.groups, (g) => { return g.GroupID == this.group.GroupID }).map((group) => {
                        this.$rootScope.groups[this.$rootScope.groups.indexOf(group)] = this.group;
                    });
                }

                window["wnEditGroup"].hide();

                $(`#exp${this.group.ObjectType}Items`).addClass('show');

                setTimeout(() => {
                    var $ul = $(`#expGroupItems_${this.group.GroupID}`);
                    $ul.addClass('show');

                    $('#bExplorer').animate({ scrollTop: $ul.offset().top - 50 }, 2000);
                });

                delete this.running;
                delete this.awaitAction;
            }, (error) => {
                this.notifyService.error(error.data.Message);

                delete this.running;
            });
        }
    }

    onDrag($event, ui) {
        $($event.target).addClass("drag");
    }

    onStopDrag($event) {
        $($event.target).removeClass("drag");
    }

    onItemDragOver($event, ui) {
        $($event.target).addClass("drag-over");
    }

    onItemDragOut($event, ui) {
        $($event.target).removeClass("drag-over");
    }

    onItemDrop($event, ui, group) {
        const $element = $($event.target);
        $element.removeClass("drag-over");

        const itemID = ui.draggable.data('item');

        const itemType = ui.draggable.data('type');
        const destType = $element.data('type');

        if (itemType != destType) {
            ui.draggable.css("top", 0);
            ui.draggable.css("left", 0);

            return false;
        }

        _.filter(this.$rootScope.explorerItems, (i) => { return i.ItemID == itemID && (!group || group.ObjectType == itemType) }).map((item) => {
            item.ItemType = destType;

            if (!group) {
                item.GroupID = null;
            } else {
                item.GroupID = group.GroupID;

                group.Items = group.Items || [];
                group.Items.push(item);

                $(`#expGroupItems_${group.GroupID}`).addClass('show');
            }

            this.running = "update-item-group";
            this.awaitAction = {
                title: "Updating Item Group",
                subtitle: "Just a moment for updating sidebar explorer item group...",
            };
            this.apiService.post("Studio", "UpdateItemGroup", item).then((data) => {
                this.notifyService.success("Item group updated has been successfully");

                delete this.running;
                delete this.awaitAction;
            }, (error) => {
                this.notifyService.error(error.data.Message);

                delete this.running;
            });
        });
    }

    onDeleteGroupClick(group) {
        if ((group.Items || []).length)
            this.notifyService.error("It is not possible to delete this group. First, delete the items inside the group");
        else
        if (confirm('Are you sure for deleting this group?')) {
            this.running = "delete-group";
            this.awaitAction = {
                title: "Removing Group",
                subtitle: "Just a moment for removing group...",
            };
            this.apiService.post("Studio", "DeleteGroup", { ID: group.GroupID }).then((data) => {
                this.$rootScope.groups.splice(this.$rootScope.groups.indexOf(group), 1);

                this.notifyService.success("group deleted has been successfully");

                delete this.running;
                delete this.awaitAction;
            }, (error) => {
                this.notifyService.error(error.data.Message);

                delete this.running;
            });
        }
    }

    onEditGroupClick(group) {
        this.group = _.clone(group);
        window["wnEditGroup"].show();
    }
}

const SidebarExplorerComponent = {
    bindings: {
        tabs: "=",
        currentItem: "=",
        currentItemId: "=",
    },
    controller: SidebarExplorerController,
    controllerAs: "$",
    templateUrl: template,
};

export default SidebarExplorerComponent;