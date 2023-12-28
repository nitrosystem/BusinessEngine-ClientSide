import swal from "sweetalert";
import { GlobalSettings } from "../../configs/global.settings";

export class ServicesController {
    constructor(
        $scope,
        $rootScope,
        studioService,
        globalService,
        apiService,
        notificationService
    ) {
        "ngInject";

        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.globalService = globalService;
        this.apiService = apiService;
        this.notifyService = notificationService;

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        this.running = "get-services";
        this.awaitAction = {
            title: "Loading Services",
            subtitle: "Just a moment for loading services...",
        };

        this.apiService.get("Studio", "GetServices").then((data) => {
            data.Services.forEach(s => {
                s.ServiceTypeIcon = (s.ServiceTypeIcon || '').replace('[EXTPATH]', GlobalSettings.modulePath + "extensions");
            });
            this.services = data.Services;

            this.serviceTypes = data.ServiceTypes;

            this.serviceTypesForFilters = _.uniqBy(this.serviceTypes, (st) => {
                return st.ServiceType;
            });

            this.onFocusModule();

            delete this.running;
            delete this.awaitAction;
        });
    }

    onFocusModule() {
        this.$rootScope.explorerExpandedItems.push(...["services"]);
        this.$rootScope.explorerCurrentItem = "services";
    }

    onTableModeClick() {
        this.displayMode = 'table';
    }

    onBoxModeClick() {
        this.displayMode = 'box';
    }

    onServiceNameChange($event) {
        if ($event.key == 'Enter')
            this.filterItems();
    }

    filterItems() {
        if (!this.servicesBackup)
            this.servicesBackup = _.cloneDeep(this.services);
        else
            this.services = _.cloneDeep(this.servicesBackup);

        this.services = _.filter(this.services, (s) => {
            return (!this.filter.ServiceName || s.ServiceName.indexOf(this.filter.ServiceName) >= 0) &&
                (!this.filter.ServiceType || s.ServiceType == this.filter.ServiceType) &&
                (!this.filter.ServiceSubtype || s.ServiceSubtype == this.filter.ServiceSubtype)
        });
    }

    onClearFilterClick() {
        if (this.servicesBackup) this.services = _.cloneDeep(this.servicesBackup);
        this.filter = {};
    }

    onAddServiceClick() {
        this.$scope.$emit("onGotoPage", { page: "create-service" });
    }

    onEditServiceClick(id, title) {
        this.$scope.$emit("onGotoPage", {
            page: "create-service",
            id: id,
            title: title,
        });
    }

    onDeleteServiceClick(id, index) {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary service!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "get-services";
                this.awaitAction = {
                    title: "Remove Service",
                    subtitle: "Just a moment for removing service...",
                };

                this.apiService.post("Studio", "DeleteService", { ID: id }).then(
                    (data) => {
                        this.services.splice(index, 1);

                        this.notifyService.success("Service deleted has been successfully");

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
        });
    }
}