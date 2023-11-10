import "./styles/global.css"

import * as _ from 'lodash';

import angular from "angular";
import "angular-filter/dist/angular-filter";
import "ng-file-upload/dist/ng-file-upload-shim";
import "ng-file-upload/dist/ng-file-upload";


//Configs
import { config as appConfig } from "./configs/app.config";

//Providers
import {
    DeferredBroadcast,
    DeferredEmit,
    DeferredEvent,
} from "./providers/deferred-events.provider";

//Services
import { GlobalService } from "../../common/services/global.service";
import { ApiService } from "../../common/services/api.service";
import { ExpressionService } from "../../common/services/expression.service";
import { ActionService } from "./services/action.service";

//Directives
import { bShow, bFor, bClick } from "./directives/angular-extended.directive";
import {
    BindDate,
    BindImage,
    BindText,
    bindUrl,
    DashboardLinkDirective,
    FocusDirective,
} from "./directives/custom-items.directive";
import { FieldDirective } from "./directives/field.directive";

//Controllers
import { ModuleController } from "./controllers/module.controllers";
import { DashboardController } from "./controllers/dashboard.controller";

const app = angular
    .module("BusinessEngineClientApp", [
        require("angular-sanitize"),
        "angular.filter",
        "ngFileUpload"
    ])
    .config(appConfig)
    .provider("$deferredEvent", DeferredEvent)
    .provider("$deferredEmit", DeferredEmit)
    .provider("$deferredBroadcast", DeferredBroadcast)
    .service("globalService", GlobalService)
    .service("apiService", ApiService)
    .service("expressionService", ExpressionService)
    .service("actionService", ActionService)
    .directive("bShow", bShow)
    .directive("bFor", bFor)
    .directive("bClick", bClick)
    .directive("bFocus", FocusDirective)
    .directive("bindText", BindText)
    .directive("bindDate", BindDate)
    .directive("bindImage", BindImage)
    .directive("bindUrl", bindUrl)
    .directive("field", FieldDirective)
    .directive("bDashboardLink", DashboardLinkDirective)
    .controller("moduleController", ModuleController)
    .controller("dashboardController", DashboardController);

window.bEngineApp = app;