import angular from "angular";
import "angular-filter/dist/angular-filter";
import "angular-dragdrop/src/angular-dragdrop";
import "ng-file-upload/dist/ng-file-upload";
import "./directives/chosen.directive";
//Configs
import { config as appConfig } from "./configs/app.config";

//Services
import { GlobalService } from "./services/global.service";
import { ApiService } from "./services/api.service";
import { ValidationService } from "./services/validation.service";
import { moduleDesignerService } from "./scenario-management/module-builder/services/module-designer.service";
import { moduleBuilderService } from "./scenario-management/module-builder/services/module-builder.service";
//Factories
import { NotificationService } from "./services/notification.service";
import { EventService } from "./services/event.service";
import { StudioService } from "./services/studio.service";

// Directives
import {
    StudioDirective,
    CustomDateDirective,
    CustomResizeableDirective,
    CustomTooltipDirective,
    CustomPopoverDirective,
    CustomModalDirective,
    CustomFocusDirective,
    CustomSidebarDirective,
    EsckeyDirective,
    NotFieldTypeDirective,
} from "./directives/custom.directive";
import { MonacoEditor } from "./directives/monaco-editor.directive";

// Components
import SidebarExplorerComponent from "./components/studio-components/sidebar-explorer/sidebar-explorer.component";
import ContentWidgetComponent from "./components/studio-components/content-widget/content-widget.component";
import RightWidgetComponent from "./components/studio-components/right-widget/right-widget.component";
import ServiceParamListComponent from "./components/action-service-components/service-param-list/service-param-list.component";
import ActionParamListComponent from "./components/action-service-components/action-param-list/action-param-list.component";
import ConditionListComponent from "./components/action-service-components/condition-list/condition-list.component";
import PropertyListComponent from "./components/action-service-components/property-list/property-list.component";
import SelectServiceComponent from "./components/action-service-components/select-service/select-service.component";
import SelectActionComponent from "./components/action-service-components/select-action/select-action.component";

//Controllers
import { StudioController } from "./studio.controller";
import { CreateScenarioController } from "./scenario-management/scenarios/create-scenario.controller";
import { PageResourcesController } from "./page-resources/page-resources.controller";
import { ExtensionsController } from "./extensions/extensions.controller";
import { EntitiesController } from "./scenario-management/entities/entities.controller";
import { CreateEntityController } from "./scenario-management/entities/create-entity.controller";
import { ViewModelsController } from "./scenario-management/view-models/view-models.controller";
import { CreateViewModelController } from "./scenario-management/view-models/create-view-model.controller";
import { ServicesController } from "./scenario-management/services/services.controller";
import { CreateServiceController } from "./scenario-management/services/create-service.controller";
import { DashboardPagesController } from "./scenario-management/dashboards/pages.controllers";
import { CreateDashboardController } from "./scenario-management/dashboards/create-dashboard.controller";
import { CreateDashboardPageController } from "./scenario-management/dashboards/create-page.controller";
import { CreateFormController } from "./scenario-management/forms/create-form.controller";
import { CreateListController } from "./scenario-management/lists/create-list.controller";
import { CreateDetailsController } from "./scenario-management/details/create-details.controller";
import { ActionsController } from "./scenario-management/actions/actions.controller";
import { CreateActionController } from "./scenario-management/actions/create-action.controller";
import { ModuleBuilderController } from "./scenario-management/module-builder/module-builder.controller";
import { ProviderSettingsController } from "./scenario-management/providers/provider-settings.controllers";
import { LibrariesController } from "./libraries/libraries.controller";
import { DefinedListsController } from "./scenario-management/defined-lists/defined-lists.controller";

//providers
import { DeferredBroadcast, DeferredEmit, DeferredEvent, } from "./providers/deferred-events.provider";

const app = angular
    .module("BusinessEngineStudioApp", [require("angular-sanitize"), "angular.filter", "localytics.directives", "ngDragDrop", "ngFileUpload"])
    .config(appConfig)
    .provider("$deferredEvent", DeferredEvent)
    .provider("$deferredEmit", DeferredEmit)
    .provider("$deferredBroadcast", DeferredBroadcast)

    .service("globalService", GlobalService)
    .service("apiService", ApiService)
    .service("validationService", ValidationService)
    .service("moduleDesignerService", moduleDesignerService)
    .service("moduleBuilderService", moduleBuilderService)

    .factory("notificationService", NotificationService)
    .factory("eventService", EventService)
    .factory("studioService", StudioService)

    .directive("studio", StudioDirective)
    .directive("bCustomDate", CustomDateDirective)
    .directive("bCustomResizeable", CustomResizeableDirective)
    .directive("bCustomTooltip", CustomTooltipDirective)
    .directive("bCustomPopover", CustomPopoverDirective)
    .directive("bCustomModal", CustomModalDirective)
    .directive("bCustomFocus", CustomFocusDirective)
    .directive("bCustomSidebar", CustomSidebarDirective)
    .directive("bEscKey", EsckeyDirective)
    .directive("bNotFieldType", NotFieldTypeDirective)
    .directive("monacoEditor", MonacoEditor)

    .component("bSidebarExplorer", SidebarExplorerComponent)
    .component("bContentWidget", ContentWidgetComponent)
    .component("bRightWidget", RightWidgetComponent)
    .component("bServiceParamList", ServiceParamListComponent)
    .component("bActionParamList", ActionParamListComponent)
    .component("bConditionList", ConditionListComponent)
    .component("bPropertyList", PropertyListComponent)
    .component("bSelectService", SelectServiceComponent)
    .component("bSelectAction", SelectActionComponent)

    .controller("studioController", StudioController)
    .controller("createScenarioController", CreateScenarioController)
    .controller("pageResourcesController", PageResourcesController)
    .controller("librariesController", LibrariesController)
    .controller("extensionsController", ExtensionsController)
    .controller("entitiesController", EntitiesController)
    .controller("createEntityController", CreateEntityController)
    .controller("viewModelsController", ViewModelsController)
    .controller("createViewModelController", CreateViewModelController)
    .controller("servicesController", ServicesController)
    .controller("createServiceController", CreateServiceController)
    .controller("createDashboardController", CreateDashboardController)
    .controller("dashboardPagesController", DashboardPagesController)
    .controller("createDashboardPageController", CreateDashboardPageController)
    .controller("createFormController", CreateFormController)
    .controller("createListController", CreateListController)
    .controller("createDetailsController", CreateDetailsController)
    .controller("actionsController", ActionsController)
    .controller("createActionController", CreateActionController)
    .controller("moduleBuilderController", ModuleBuilderController)
    .controller("providerSettingsController", ProviderSettingsController)
    .controller("definedListsController", DefinedListsController);

window["app"] = app;

export { app };