import angular from "angular";
import "angular-filter/dist/angular-filter";
import "angular-dragdrop/src/angular-dragdrop";
import * as _ from 'lodash';

import "chosen-js/chosen.jquery";
import "angular-chosen-localytics/dist/angular-chosen";
import "ng-file-upload/dist/ng-file-upload";

//Configs
import { config as appConfig } from "./configs/app.config";

//Services
import { GlobalService } from "../../common/services/global.service";
import { ApiService } from "../../common/services/api.service";
import { ValidationService } from "../../common/services/validation.service";
import { NotificationService } from "./services/notification.service";
import { StudioService } from "./services/studio.service";
import { moduleBuilderService } from "./scenario-management/module-builder/module-builder.service";
import { moduleRenderService } from "./scenario-management/module-builder/module-render.service";

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

import {
    DeferredBroadcast,
    DeferredEmit,
    DeferredEvent,
} from "./providers/deferred-events.provider";

const app = angular
    .module("BusinessEngineStudioApp", [
        require("angular-sanitize"),
        "localytics.directives",
        "angular.filter",
        "ngDragDrop", "ngFileUpload"
    ])
    .config(appConfig)
    .provider("$deferredEvent", DeferredEvent)
    .provider("$deferredEmit", DeferredEmit)
    .provider("$deferredBroadcast", DeferredBroadcast)
    .service("globalService", GlobalService)
    .service("apiService", ApiService)
    .service("validationService", ValidationService)
    .service("moduleBuilderService", moduleBuilderService)
    .service("moduleRenderService", moduleRenderService)
    .factory("notificationService", NotificationService)
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
    .controller("providerSettingsController", ProviderSettingsController);

window["app"] = app;

export { app };