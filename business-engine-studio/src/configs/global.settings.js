import $ from "jquery";

export class GlobalSettings {
    static scenarioName = window.bEngineGlobalSettings.scenarioName;
    static portalID = window.bEngineGlobalSettings.portalID;
    static portalAliasID = window.bEngineGlobalSettings.portalAliasID;
    static dnnModuleID = window.bEngineGlobalSettings.dnnModuleID;
    static moduleID = window.bEngineGlobalSettings.moduleID;
    static moduleType = window.bEngineGlobalSettings.moduleType;
    static scenarioID = window.bEngineGlobalSettings.scenarioID;
    static siteRoot = window.bEngineGlobalSettings.siteRoot;
    static apiBaseUrl = window.bEngineGlobalSettings.apiBaseUrl;
    static modulePath = window.bEngineGlobalSettings.modulePath;
    static userID = window.bEngineGlobalSettings.userID;
    static version = window.bEngineGlobalSettings.version;
    static debugMode = window.bEngineGlobalSettings.debugMode;

    static apiHeaders = {
        ScenarioID: this.scenarioID,
        Requestverificationtoken: $('[name="__RequestVerificationToken"]').val()
    };
}