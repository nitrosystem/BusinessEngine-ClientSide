import { GlobalSettings } from "../../configs/global.settings";

import moduleVariablesWidget from "./module-variables.html";
import moduleSkinWidget from "./module-skin.html";
import moduleLayoutTemplateWidget from "./module-layout-template.html";
import moduleCustomResourcesWidgets from "./module-custom-resources-widget.html";
import moduleCustomLibrariesWidget from "./module-custom-libraries-widget.html";
import fieldEditWidget from "./field/field-edit.html";
import fieldTemplateWidget from "./field/field-template.html";
import fieldSettingsWidget from "./field/field-settings.html";
import fieldShowConditionsWidget from "./field/field-show-conditions.html";
import fieldConditionalValuesWidget from "./field/field-conditional-values.html";
import fieldDataSourceWidget from "./field/field-data-source.html";

export class ModuleBuilderController {
    constructor(
        $scope,
        $rootScope,
        studioService,
        $timeout,
        $compile,
        $filter,
        $q,
        globalService,
        apiService,
        validationService,
        notificationService,
        moduleDesignerService,
        moduleBuilderService
    ) {
        "ngInject";

        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.studioService = studioService;
        this.$timeout = $timeout;
        this.$compile = $compile;
        this.$filter = $filter;
        this.$q = $q;
        this.globalService = globalService;
        this.apiService = apiService;
        this.validationService = validationService;
        this.notifyService = notificationService;
        this.moduleDesignerService = moduleDesignerService;
        this.moduleBuilderService = moduleBuilderService;

        this.variableScopes = [
            { Text: "Global", Value: 0 },
            { Text: "Client Side", Value: 1 },
            { Text: "Server Side", Value: 2 },
        ];

        this.variableTypes = [{
            Value: "string",
            Text: "String",
            Type: 0,
        },
        {
            Value: "bool",
            Text: "Boolean",
            Type: 0,
        },
        {
            Value: "byte",
            Text: "Byte",
            Type: 0,
        },
        {
            Value: "char",
            Text: "Char",
            Type: 0,
        },
        {
            Value: "datetime",
            Text: "Date Time",
            Type: 0,
        },
        {
            Value: "decimal",
            Text: "Decimal",
            Type: 0,
        },
        {
            Value: "double",
            Text: "Double",
            Type: 0,
        },
        {
            Value: "short",
            Text: "Short",
            Type: 0,
        },
        {
            Value: "int",
            Text: "Int",
            Type: 0,
        },
        {
            Value: "long",
            Text: "Long",
            Type: 0,
        },
        {
            Value: "sbyte",
            Text: "Sbyte",
            Type: 0,
        },
        {
            Value: "float",
            Text: "Float",
            Type: 0,
        },
        {
            Value: "ushort",
            Text: "Ushort",
            Type: 0,
        },
        {
            Value: "uint",
            Text: "Uint",
            Type: 0,
        },
        {
            Value: "ulong",
            Text: "Ulong",
            Type: 0,
        },
        {
            Value: "datetime",
            Text: "Date Time",
            Type: 0,
        },
        {
            Value: "timespan",
            Text: "Time Span",
            Type: 0,
        },
        {
            Value: "guid",
            Text: "Guid",
            Type: 0,
        },
        {
            Value: "imageUrl",
            Text: "Image Url",
            Type: 0,
        },
        {
            Value: "imageFile",
            Text: "Image File",
            Type: 0,
        },
        {
            Value: "file",
            Text: "File",
            Type: 0,
        },
        {
            Value: "customObject",
            Text: "Custom Object",
        },
        {
            Value: "customList",
            Text: "Custom List",
        },
        {
            Value: "viewModel",
            Text: "View Model",
        },
        {
            Value: "listOfViewModel",
            Text: "List Of View Model",
        },
        ];

        $scope.$on("onShowFieldDataSource", (e, args) => {
            this.onShowFieldDataSourceClick(args.field);
        });

        this.moduleVariablesWidget = moduleVariablesWidget;
        this.moduleSkinWidget = moduleSkinWidget;
        this.moduleLayoutTemplateWidget = moduleLayoutTemplateWidget;
        this.moduleCustomResourcesWidget = moduleCustomResourcesWidgets;
        this.moduleCustomLibrariesWidget = moduleCustomLibrariesWidget;
        this.fieldEditWidget = fieldEditWidget;
        this.fieldTemplateWidget = fieldTemplateWidget;
        this.fieldSettingsWidget = fieldSettingsWidget;
        this.fieldShowConditionsWidget = fieldShowConditionsWidget;
        this.fieldConditionalValuesWidget = fieldConditionalValuesWidget;
        this.fieldDataSourceWidget = fieldDataSourceWidget;

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        if (!window.isDefindeCtrl_sEvent) {
            document.addEventListener("keydown", (e) => {
                if (this.module.ModuleBuilderType == "HtmlEditor") {
                    {
                        if (e.key == 'F6') {
                            var tabNumber = $('button[data-bs-toggle="tab"].active').data('tab');
                            tabNumber = tabNumber >= 1 && tabNumber < 3 ? tabNumber + 1 : 1;
                            $(`button[data-tab=${tabNumber}]`).tab('show');
                            e.preventDefault();
                        }
                    }
                } else if (this.module.ModuleBuilderType == 'FormDesigner') {
                    if ((e.key == 's' && e.ctrlKey) || e.key === "F7") {
                        if (this.currentField) this.saveCurrentField()
                        e.preventDefault();
                    }
                }
                if ((e.key == 'ArrowDown' || e.key == 'ArrowUp') && e.ctrlKey && this.currentField && this.currentFieldFocused) {
                    const $field = this.getFieldElementByFieldID(this.currentField.FieldID);
                    const $target = e.key == 'ArrowUp' ? $field.previousElementSibling : $field.nextElementSibling;
                    if ($target && $target.attributes['b-field']) {
                        const fieldID = $target.attributes['b-field'].value;
                        this.onFieldItemClick(e, fieldID);
                        if (!$scope.$$phase) $scope.$apply();
                    }
                    e.preventDefault();
                }
                if ((e.key == 'ArrowDown' || e.key == 'ArrowUp') && e.shiftKey && this.currentField && this.currentFieldFocused) {
                    this.onFieldSwap(e, e.key.replace('ArrowDown', 'down').replace('ArrowUp', 'up'));

                    if (!$scope.$$phase) $scope.$apply();

                    e.preventDefault();
                }

            }, false);

            window.isDefindeCtrl_sEvent = true;
        }

        this.onPageLoad();
    }

    onPageLoad() {
        const id = this.globalService.getParameterByName("id");

        var monitoringFileID = this.globalService.generateGuid();
        this.monitoringFile = `/Portals/${GlobalSettings.portalID}-System/BusinessEngine/MonitoringProgress/Monitoring_${id}_${monitoringFileID}.txt`;
        this.progressValueFile = `/Portals/${GlobalSettings.portalID}-System/BusinessEngine/MonitoringProgress/ProgressValue_${id}_${monitoringFileID}.txt`;

        this.running = "get-module-builder";
        this.awaitAction = {
            title: "Get Module Builder Data",
            subtitle: "Just a moment for loading module builder data...",
            showProgress: true
        };

        this.monitoringProgress();

        this.apiService.get("Studio", "GetModuleBuilder", { moduleID: (id || null), monitoringFileID: monitoringFileID }).then((data) => {
            this.module = data.Module;
            this.skins = data.Skins;
            this.fields = data.Fields;
            this.actions = data.Actions;
            this.services = data.Services;
            this.viewModels = data.ViewModels;
            this.variables = data.Variables;
            this.roles = data.Roles;
            this.libraries = data.Libraries;
            this.customResources = data.CustomResources;
            this.customLibraries = data.CustomLibraries;
            this.field = {};

            data.FieldTypes.forEach(ft => {
                ft.Icon = (ft.Icon || '').replace('[EXTPATH]', GlobalSettings.modulePath + "extensions");

                _.forEach(ft.Templates, (t) => { return t.TemplateImage = (t.TemplateImage || '').replace('[EXTPATH]', GlobalSettings.modulePath + "extensions"); })
                _.forEach(ft.Themes, (t) => { return t.ThemeImage = (t.ThemeImage || '').replace('[EXTPATH]', GlobalSettings.modulePath + "extensions"); })
            });
            this.fieldTypes = data.FieldTypes;

            /*-----------------------------------------------------------------------
                the First step for creating your module,
                you must be select skin and template and theme for the module
            --------------------------------------------------------------------*/
            if (this.module.ModuleBuilderType == "FormDesigner" && !this.module.Skin) {
                this.onShowModuleSkinClick();

                this.notifyService.notify(`
                            the First step for creating your module,
                            you must be select skin and template and theme for the module
                        `);
            }

            if (this.module.Wrapper == "Dashboard") {
                _.filter(this.$rootScope.explorerItems, (item) => {
                    return (
                        item.ItemID == this.module.ModuleID &&
                        item.DashboardPageParentID
                    );
                }).map((item) => {
                    const pageID = item.DashboardPageParentID;

                    this.$rootScope.explorerExpandedItems = [
                        { name: "dashboards" },
                        { name: "dashboard", id: this.module.ParentID },
                        { name: "pages", id: this.module.ParentID },
                        { name: "page", id: pageID },
                        { name: "module", id: this.module.ModuleID },
                    ];
                });
            }

            _.forEach(this.fields, (field) => {
                field.FieldTypeObject = _.find(this.fieldTypes, (ft) => {
                    return ft.FieldType == field.FieldType;
                });

                this.globalService.parseJsonItems(field.Settings);

                this.field[field.FieldName] = field;
            });

            this.$scope.$emit("onUpdateCurrentTab", {
                id: this.module.ModuleID,
                title: this.module.ModuleName,
            });

            // this.apiService
            //     .get("Studio", "GetModuleViewLinkUrl", {
            //         moduleID: this.module.ModuleID,
            //         parentID: this.module.ParentID,
            //         moduleWrapper: this.module.Wrapper,
            //     })
            //     .then((data) => (this.moduleViewLinkUrl = data));

            if (this.module.Settings && this.module.ModuleBuilderType == "HtmlEditor" && !this.module.CustomJs)
                this.module.CustomJs = `function ${this.globalService.capitalizeFirstLetter(this.module.ModuleName.replace(/-/g, ''))}Controller(moduleController,$scope) /* Please don't rename function name */ \n{\n\tthis.onPageLoad = function()\n\t{\n\t\tmoduleController.callActionsByEvent('module','OnPageLoad').then((data) => {\t\n\t\t\t//...\n\t\t});\n\t}\n}`;

            this.onFocusModule();

            this.$timeout(() => {
                this.renderDesignForm();
            });

            delete this.currentField;
            delete this.running;

            this.$timeout(() => { delete this.awaitAction; }, 1000);

            clearInterval(this.monitoringTimer);
            this.monitoringTimer = 0;
        },
            (error) => {
                if (this.isNewAction) delete this.action.ActionID;

                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                this.notifyService.error(error.data.Message);

                delete this.running;

                clearInterval(this.monitoringTimer);
                this.monitoringTimer = 0;
            }
        );

        this.$scope.$emit("onChangeActivityBar", {
            name: "builder",
            title: "Module Builder",
        });

        this.onSidebarTabClick('toolbox');

        this.setForm();
    }

    onFocusModule() {
        const items = this.studioService.createSidebarExplorerPath(this.module.ModuleID, "Module");
        this.$rootScope.explorerExpandedItems.push(...items);
        this.$rootScope.explorerExpandedItems.push(this.module.ModuleType.toLowerCase() + '-modules');

        this.$rootScope.explorerCurrentItem = !this.module || !this.module.ModuleID ? "module-builder" : this.module.ModuleID;

        this.onSidebarTabClick('toolbox');
        this.$rootScope.currentActivityBar = "builder";
    }

    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }

    setForm() {
        this.form = this.validationService.init({
            FieldName: {
                id: "txtFieldName",
                required: true,
            },
            FieldText: {
                rule: (value) => {
                    if (!this.currentField.Settings.IsHideFieldText && !value)
                        return false;

                    return true;
                },
                id: "txtFieldText",
                required: true,
            },
            FieldType: {
                id: "drpFieldType",
                required: true,
            },
            Template: {
                rule: (value) => {
                    if (!value && this.currentField.InheritTemplate)
                        return true;
                    else if (value)
                        return true;
                },
                required: true,
            },
        },
            true,
            this.$scope,
            "$.currentField"
        );

        this.moduleSkinForm = this.validationService.init({
            Skin: {
                id: "inpModuleSkin",
                required: true,
            },
            Template: {
                id: "inpModuleTemplate",
                required: true,
            },
            FieldsDefaultTemplate: {
                id: "txtFieldsTemplate",
                rule: (value) => {
                    if (!value && this.module.EnableFieldsDefaultTemplate)
                        return false;
                    else
                        return true;
                },
                required: true,
            },
            FieldsDefaultTheme: {
                id: "txtFieldsTheme",
                rule: (value) => {
                    if (!value && this.module.EnableFieldsDefaultTheme)
                        return false;
                    else
                        return true;
                },
                required: true,
            }
        },
            true,
            this.$scope,
            "$.module"
        );
    }

    /*------------------------------------*/
    /* Build Module & Render Design Module Methods  */
    /*------------------------------------*/
    buildModule() {
        if (!this.module.ModuleBuilderType) {
            alert('the ModuleBuilderType field of the module fields has not set.you must be set the field value.');
            this.onModuleSettingsClick();

            return;
        }

        this.running = "building-module";
        this.awaitAction = {
            title: "Building Module...",
            subtitleColor: '#fff',
            showProgress: true
        };

        const renderTemplateFunc = (type) => {
            const $defer = this.$q.defer();

            if (type == 'HtmlEditor') {
                $defer.resolve();
            } else if (type == 'FormDesigner') {
                this.moduleBuilderService.renderModuleTemplate(this.module, this.fields, this.$scope).then((moduleTemplate) => {
                    $defer.resolve(moduleTemplate);
                },
                    (error) => {
                        if (error && error.errorType == 'skin') this.$timeout(() => this.onShowModuleSkinClick(), 1000);

                        $defer.reject(error);
                    });
            }

            return $defer.promise;
        };

        renderTemplateFunc(this.module.ModuleBuilderType).then((moduleTemplate) => {
            (this.awaitAction ?? {}).subtitle = "Connect to server for building module..."

            var monitoringFileID = this.globalService.generateGuid();
            this.monitoringFile = `/Portals/${GlobalSettings.portalID}-System/BusinessEngine/MonitoringProgress/Monitoring_${this.module.ModuleID}_${monitoringFileID}.txt`;
            this.progressValueFile = `/Portals/${GlobalSettings.portalID}-System/BusinessEngine/MonitoringProgress/ProgressValue_${this.module.ModuleID}_${monitoringFileID}.txt`;

            this.monitoringProgress();

            this.apiService.post("Studio", "BuildModule", {
                ModuleID: this.module.ModuleID,
                ParentID: this.module.ParentID,
                ModuleBuilderType: this.module.ModuleBuilderType,
                ModuleTemplate: moduleTemplate,
                CustomHtml: this.module.CustomHtml,
                CustomJs: this.module.CustomJs,
                CustomCss: this.module.CustomCss,
                MonitoringFileID: monitoringFileID
            }).then((data) => {
                this.notifyService.success(
                    "Build module has been successfully!. ;)"
                );

                delete this.awaitAction;
                delete this.running;
            }, (error) => {
                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                this.notifyService.error(error.data.Message);

                delete this.running;

                clearInterval(this.monitoringTimer);
                this.monitoringTimer = 0;
            });
        });
    }

    renderDesignForm() {
        const $defer = this.$q.defer();

        this.moduleDesignerService.renderDesignForm(this.module, this.fields, this.$scope, this.actions).then((data) => {
            $("#board" + this.module.ModuleID).html(data.$board);

            this.panes = data.panes;

            this.setFieldsSortingUi();
            this.setFieldsDragingUi();

            $defer.resolve();
        }, (error) => {
            if (error && error.errorType == 'skin') this.$timeout(() => this.onShowModuleSkinClick(), 1000);
        });

        return $defer.promise;
    }

    onClearCache() {
        this.running = "clear-cache";
        this.awaitAction = {
            title: "Clear Cache",
            subtitle: "Just a moment for clear cache and add host version...",
        };

        this.apiService.post("Studio", "ClearCacheAndAddCmsVersion").then((data) => {
            this.notifyService.success("Dnn cache and adding host version has been successfully");

            delete this.awaitAction;
            delete this.running;

            if (confirm("Do you want to refresh the page?")) location.reload();
        }, (error) => {
            $defer.reject(error);

            this.awaitAction.isError = true;
            this.awaitAction.subtitle = error.statusText;
            this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

            this.notifyService.error(error.data.Message);

            delete this.running;
        });
    }

    setFieldsSortingUi() {
        $(".sortable-row").sortable({
            tolerance: 'pointer',
            helper: 'clone',
            appendTo: document.body,
            connectWith: ".sortable-row",
            handle: ".handle",
            start: ($event, ui) => {
                //$(".pane.pane-footer").css("opacity", ".1");
                ui.item.find(".field-body").addClass("dragable");
            },
            stop: ($event, ui) => {
                $(".pane.pane-footer").css("opacity", "1");
                ui.item.find(".field-body").removeClass("dragable");

                this.$scope.$apply(() => {
                    const paneName = $(ui.item[0].parentElement).data("pane");
                    const parentID = $(ui.item[0].parentElement).data("parent-id") || null;

                    this.currentField.PaneName = paneName;
                    this.currentField.ParentID = parentID;

                    this.saveCurrentField().then(() => this.sortPaneFields(paneName));
                });
            },
        });
    }

    setFieldsDragingUi() {
        $("#board" + this.module.ModuleID)
            .find("*[field-drop]")
            .droppable({
                greedy: true,
                accept: '*[data-drag="true"]',
                drop: ($event, ui) => {
                    var args = [$event, ui];
                    this.$scope.$apply(() => {
                        this.onFieldDrop.apply(this, args);
                    });
                },
                over: this.onFieldDragOver,
                out: this.onFieldDragOut,
            });
    }

    onGotoModuleResourcesClick() {
        this.$scope.$emit("onGotoPage", {
            page: "page-resources",
            id: this.module.ModuleID,
            activityBar: 'page-resources',
            subParams: {
                mode: 'module-resources',
                disableActivityBarCallback: true,
            }
        });
    }

    onShowActionsClick() {
        this.$scope.$emit("onGotoPage", {
            page: "actions",
            parentID: this.module.ModuleID,
            subParams: { type: "module" },
        });
    }

    /*------------------------------------*/
    /* Module Variables Methods  */
    /*------------------------------------*/
    onShowVariablesClick() {
        this.workingMode = "module-variables";
        this.$scope.$emit("onShowRightWidget", { controller: this });
    }

    onReloadVariablesClick() {
        this.running = "reloading-module-variables";
        this.awaitAction = {
            title: "Reloading Variables",
            subtitle: "Just a moment for reloading the module variables...",
        };

        this.apiService
            .get("Studio", "GetModuleVariables", {
                moduleID: this.module.ModuleID,
            })
            .then(
                (data) => {
                    this.variables = data;

                    this.notifyService.success(
                        "Module variables loaded has been successfully"
                    );

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

    onAddVariableClick() {
        if (this.variable) return;

        this.variables = this.variables || [];
        this.variables.push({
            IsNew: true,
            IsEdited: true,
            OrderID: this.variables.length + 1,
        });

        this.variable = _.clone(this.variables[this.variables.length - 1]);

        this.$timeout(() => {
            this.$scope.$broadcast("onEditVariable");
        }, 500);
    }

    onEditVariableClick(variable, $index) {
        if (this.variable) return;

        variable.IsEdited = true;

        this.variable = _.clone(variable);
        this.variable.OrderID = $index + 1;
        this.variable.IsNew = false;
    }

    onDeleteVariableClick($index) {
        if (confirm("Are you sure delete this variable!?"))
            this.variables.splice($index, 1);
    }

    onSaveVariableClick() {
        this.variable.IsEdited = false;

        this.variables[this.variable.OrderID - 1] = _.clone(this.variable);

        delete this.variable;
    }

    onCancelVariableClick() {
        if (this.variable.IsNew)
            this.variables.splice(this.variable.OrderID - 1, 1);
        else this.variables[this.variable.OrderID - 1].IsEdited = false;

        delete this.variable;
    }

    onSaveVariablesClick() {
        this.running = "save-module-variables";
        this.awaitAction = {
            title: "Saving Variables",
            subtitle: "Just a moment for saving the module variables...",
        };

        this.apiService
            .post("Studio", "SaveModuleVariables", this.variables, {
                moduleID: this.module.ModuleID,
            })
            .then(
                (data) => {
                    this.variables = data;

                    this.notifyService.success(
                        "Module variables updated has been successfully"
                    );

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

    onCancelVariablesClick() {
        this.disposeWorkingMode();
    }

    /*------------------------------------*/
    /* Appearance Methods  */
    /*------------------------------------*/
    onShowModuleSkinClick() {
        this.workingMode = "module-theme";
        this.$scope.$emit("onShowRightWidget", { controller: this });
    }

    onReloadSkinsClick() {
        this.running = "reloading-module-skins";
        this.awaitAction = {
            title: "Reloading Skins",
            subtitle: "Just a moment for reloading the module skins...",
        };

        this.apiService.get("Studio", "GetModuleSkins", { moduleID: this.module.ModuleID }).then((data) => {
            this.skins = data.Skins;
            this.module.SkinObject = data.CurrentSkin;

            this.notifyService.success(
                "Module Skins loaded has been successfully"
            );

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

    onSelectSkinClick(skin) {
        if (!this.module.SkinObject || this.module.Skin != skin.SkinName) {
            this.moduleSkinBackup = this.module.Skin;
            this.moduleSkinObjectBackup = this.module.SkinObject;
            this.isSkinChanged = true;
            this.module.Skin = skin.SkinName;
            this.module.Template = null;

            this.running = "loading-skin-items";
            this.awaitAction = {
                title: "Loading Skin Items",
                subtitle: "Just a moment for loading the module skin items...",
            };

            this.apiService.get("Studio", "GetModuleSkin", {
                moduleID: this.module.ModuleID,
                skinName: skin.SkinName,
            }).then((data) => {
                this.module.SkinObject = data;

                delete this.awaitAction;
                delete this.running;
            }, (error) => {
                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                this.notifyService.error(error.data.Message);

                delete this.running;
            });
        }
    }

    onSelectSkinTemplateClick(template) {
        if (this.module.Template != template.TemplateName) this.isSkinChanged = true;

        this.moduleTemplateBackup = this.module.Template;
        this.module.Template = template.TemplateName;
    }

    onSaveSkinClick() {
        this.moduleSkinForm.validated = true;
        this.moduleSkinForm.validator(this.module);
        if (this.moduleSkinForm.valid) {
            if (this.isSkinChanged)
                swal({
                    title: "Important note?",
                    text: "after apply change the skin or template, the layout of the module will change, and will losted the Panes then you must sort the fields based on the new layout.",
                    icon: "warning",
                    buttons: true,
                    dangerMode: true,
                }).then((confirm) => {
                    if (confirm) {
                        this.saveSkin().then((data) => {
                            this.module.LayoutTemplate = data.layoutTemplateHtml;
                            this.module.LayoutCss = data.layoutTemplateCss;

                            this.renderDesignForm();
                            this.buildModule();
                            this.disposeWorkingMode();
                        });
                    }
                });
            else
                this.disposeWorkingMode();
        }
    }

    saveSkin() {
        const $defer = this.$q.defer();

        this.running = "save-skin";
        this.awaitAction = {
            title: "Saving Module Skin",
            subtitle: "Just a moment for saving the module skin...",
        };

        this.apiService.post("Studio", "SaveModuleSkin", {
            ModuleID: this.module.ModuleID,
            Skin: this.module.Skin,
            Template: this.module.Template,
            Theme: this.module.Theme,
            EnableFieldsDefaultTemplate: this.module.EnableFieldsDefaultTemplate,
            EnableFieldsDefaultTheme: this.module.EnableFieldsDefaultTheme,
            FieldsDefaultTemplate: this.module.FieldsDefaultTemplate,
            FieldsDefaultTheme: this.module.FieldsDefaultTheme,
            LayoutTemplate: this.module.LayoutTemplate,
            LayoutCss: this.module.LayoutCss
        }).then(
            (data) => {
                $defer.resolve(data);

                this.notifyService.success("Module skin updated has been successfully");

                delete this.awaitAction;
                delete this.running;
            },
            (error) => {
                $defer.reject(error);

                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                this.notifyService.error(error.data.Message);

                delete this.running;
            }
        );

        return $defer.promise;
    }

    onCancelSkinClick() {
        if (this.moduleSkinBackup) {
            this.module.Skin = this.moduleSkinBackup;
            this.module.SkinObject = this.moduleSkinObjectBackup;
        }
        if (this.moduleTemplateBackup) this.module.Template = this.moduleTemplateBackup;

        this.disposeWorkingMode();
    }

    onShowLayoutTemplateClick() {
        if (this.module.ModuleBuilderType == "FormDesigner" && (!this.module.Skin || !this.module.Template)) {
            this.notifyService.notify(`
                the First step for creating your module,
                you must be select skin and template and theme for the module
            `);

            this.$timeout(() => this.onShowModuleSkinClick(), 1000);

            return;
        }

        this.workingMode = "module-edit-layout-template";
        this.$scope.$emit("onShowRightWidget", { controller: this });
    }

    onSaveLayoutTemplateClick() {
        this.running = "save-layout-template";
        this.awaitAction = {
            title: "Saving Module Layout Template",
            subtitle: "Just a moment for saving the module layout template...",
        };

        this.apiService.post("Studio", "SaveModuleLayoutTemplate", {
            ModuleID: this.module.ModuleID,
            LayoutTemplate: this.module.LayoutTemplate,
            LayoutCss: this.module.LayoutCss
        }).then(
            (data) => {
                this.disposeWorkingMode();
                this.buildModule();
                this.renderDesignForm();

                this.notifyService.success("Module layout template updated has been successfully");

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

    onCancelLayoutTemplateClick() {
        this.disposeWorkingMode();
    }

    onSelectFieldTemplate(template) {
        this.currentField.Template = template.TemplateName;
        this.currentField.IsSkinTemplate = template.IsSkinTemplate;
    }

    onSelectFieldTheme(theme) {
        this.currentField.Theme = theme.ThemeName;
        this.currentField.IsSkinTheme = theme.IsSkinTheme;
        this.currentField.ThemeCssClass = theme.ThemeCssClass
    }

    onModuleSettingsClick() {
        this.$scope.$emit("onGotoPage", {
            page: "create-" + this.module.ModuleType.toLowerCase(),
            id: this.module.ModuleID,
        });
    }

    onSaveTemplateWidgetClick($event) {
        this.onSaveFieldClick($event);
    }

    /*------------------------------------*/
    /*  Field Methods */
    /*------------------------------------*/
    onRefreshFieldClick($event, fieldID) {
        const $defer = this.$q.defer();

        this.running = "refresh-field";
        this.awaitAction = {
            title: "Refresh Field",
            subtitle: "Just a moment for refresh the field...",
        };

        this.apiService.get("Studio", "GetModuleField", { fieldID: fieldID }).then((data) => {
            $defer.resolve();

            this.notifyService.success("Field refreshed has been successfully");

            var field = this.getFieldByID(fieldID);
            this.fields[this.fields.indexOf(field)] = data;
            this.field[field.FieldName] = data;
            this.currentField = field;

            delete this.awaitAction;
            delete this.running;

        },
            (error) => {
                $defer.resolve();

                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                this.notifyService.error(error.data.Message);

                delete this.running;
            }
        );

        return $defer.promise;
    }

    onFieldItemClick($event, fieldID) {
        if (
            this.currentField &&
            this.currentField.FieldID != fieldID &&
            this.isEditedCurrentField
        ) {
            this.currentField.shakeField = true;
            this.currentField.isShowSavePanel = true;

            this.$scope.$broadcast("onFocusField_" + this.currentFieldBackup.FieldName);
        } else {
            const field = this.getFieldByID(fieldID);

            this.currentFieldBackup = _.clone(field);
            this.currentField = field;
            this.field[this.currentField.FieldName] = this.currentField;

            this.$scope.$broadcast("onBindFieldSettings_" + this.currentField.FieldName);

            if (this.currentSidebarTab != 'actions') {
                this.onSidebarTabClick("field-settings");
            }

            this.fieldActionsFilter = this.currentField.FieldID;
        }

        this.currentFieldFocused = true;

        if ($event) $event.stopPropagation();
    }

    onFieldTypeChange($event, fieldID) {
        swal({
            title: "Are you sure change field type?",
            text: "Some settings may be lost after the field type is changed",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((agree) => {
            if (agree) {
                this.saveCurrentField().then(() => {
                    this.onRefreshFieldClick($event, fieldID).then(() => {
                        this.currentField.FieldTypeObject = _.find(this.fieldTypes, (ft) => {
                            return ft.FieldType == this.currentField.FieldType;
                        });
                        console.log(this.currentField)
                    });
                })
            }
        });
    }

    onCancelEditFieldClick($event) {
        const field = this.getFieldByID(this.currentField.FieldID);

        this.field[this.currentFieldBackup.FieldName] = this.fields[
            this.fields.indexOf(field)
        ] = _.clone(this.currentFieldBackup);

        this.removeCurrentField(true);

        if ($event) $event.stopPropagation();
    }

    addField(paneName, parentID, fieldType, beforeFieldID) {
        const suggestFieldName = fieldType.FieldType + (_.filter(this.fields, (f) => { return f.FieldType == fieldType.FieldType; }).length + 1);
        const defaultSettings = JSON.parse(fieldType.DefaultSettings || "{}");

        this.currentField = {
            moduleID: this.module.ModuleID,
            ParentID: parentID,
            PaneName: paneName,
            FieldType: fieldType.FieldType,
            FieldName: suggestFieldName,
            IsRequired: false,
            IsShow: true,
            IsEnabled: true,
            IsGroup: fieldType.IsGroup,
            IsValuable: fieldType.IsValuable,
            IsSelective: fieldType.IsSelective,
            IsJsonValue: fieldType.IsJsonValue,
            InheritTemplate: this.module.EnableFieldsDefaultTemplate,
            InheritTheme: this.module.EnableFieldsDefaultTheme,
            DataSource: {},
            Settings: defaultSettings,
            FieldTypeObject: fieldType,
        };

        this.beforeFieldID = beforeFieldID;

        this.checkInheritTemplateAndTheme(this.currentField);

        this.workingMode = "field-edit";
        this.$scope.$emit("onShowRightWidget", { controller: this });

        this.fieldTypeOptions = `<b-${this.currentField.FieldType.toLowerCase()}-options data-field="$.currentField"></b-${this.currentField.FieldType.toLowerCase()}-options>`;
        this.$timeout(() => {
            $('#pnlFieldTypeOptions').append(this.$compile(this.fieldTypeOptions)(this.$scope));
        }, 500);
    }

    onSaveFieldClick($event, isNewField) {
        this.form.validated = true;
        this.form.validator(this.currentField);
        if (this.form.valid) {
            if (isNewField) {
                this.saveCurrentField().then((field) => {
                    field.FieldTypeObject = _.find(this.fieldTypes, (ft) => {
                        return ft.FieldType == field.FieldType;
                    });

                    this.fields.push(field);
                    this.field[field.FieldName] = field;
                    this.currentField = field;
                    this.currentFieldBackup = _.clone(field);

                    this.moduleDesignerService.getFieldUI(this.currentField, this.$scope).then(($fieldItem) => {
                        const $field = this.$compile($fieldItem)(this.$scope);

                        if (this.beforeFieldID) {
                            $($field).insertBefore(
                                $("#board" + this.module.ModuleID).find('*[b-field="' + this.beforeFieldID + '"]')
                            );
                        } else {
                            const $boardPane = $("#board" + this.module.ModuleID).find('*[data-pane="' + this.currentField.PaneName + '"]');
                            $boardPane.append($field);
                        }

                        this.sortPaneFields(this.currentField.PaneName);

                        if (field.IsGroup) this.renderDesignForm();

                        this.buildModule();

                        this.$timeout(() => {
                            this.disposeWorkingMode();
                            this.onFieldSettingsClick();
                        });
                    });
                });
            } else this.saveCurrentField();

            if ($event) $event.stopPropagation();
        }
    }

    saveCurrentField() {
        const $defer = this.$q.defer();

        delete this.currentField.Value;

        this.checkInheritTemplateAndTheme(this.currentField);

        this.running = "save-field";
        this.awaitAction = {
            title: "Saving Field",
            subtitle: "Just a moment for saving the field...",
            showProgress: true
        };

        var monitoringFileID = this.globalService.generateGuid();
        this.monitoringFile = `/Portals/${GlobalSettings.portalID}-System/BusinessEngine/MonitoringProgress/Monitoring_${this.module.ModuleID}_${monitoringFileID}.txt`;
        this.progressValueFile = `/Portals/${GlobalSettings.portalID}-System/BusinessEngine/MonitoringProgress/ProgressValue_${this.module.ModuleID}_${monitoringFileID}.txt`;

        this.monitoringProgress();

        this.apiService.post("Studio", "SaveModuleField", this.currentField, { monitoringFileID: monitoringFileID }).then((field) => {
            this.notifyService.success(this.currentField.FieldName + " Field updated has been successfully");

            delete this.awaitAction;
            delete this.running;
            delete this.currentField.isShowSavePanel;
            delete this.isEditedCurrentField;

            this.disposeWorkingMode();

            $defer.resolve(field);

            clearInterval(this.monitoringTimer);
            this.monitoringTimer = 0;
        }, (error) => {
            this.awaitAction.isError = true;
            this.awaitAction.subtitle = error.statusText;
            this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

            this.notifyService.error(error.data.Message);

            delete this.running;

            clearInterval(this.monitoringTimer);
            this.monitoringTimer = 0;
        });

        return $defer.promise;
    }

    checkInheritTemplateAndTheme(field) {
        let fieldType = field.FieldTypeObject;

        if (field.InheritTemplate) {
            if (_.filter(fieldType.Templates, (t) => { return t.TemplateName == this.module.FieldsDefaultTemplate }).length == 0) {
                this.showProblemForInheritTemplate = true;
                delete field.Template;

                this.$timeout(() => {
                    field.InheritTemplate = false
                }, 600)

            } else field.Template = this.module.FieldsDefaultTemplate;
        } else {
            _.filter(field.FieldTypeObject.Templates || [], (t) => { return t.TemplateName == field.Template; }).map((t) => {
                field.IsSkinTemplate = t.IsSkinTemplate;
            });
        }

        if (field.InheritTheme) {
            if (_.filter(fieldType.Themes, (t) => { return (t.TemplateName && t.TemplateName == field.Template && t.ThemeName == this.module.FieldsDefaultTheme) || (!t.TemplateName && t.ThemeName == this.module.FieldsDefaultTheme) }).length == 0) {
                this.showProblemForInheritTheme = true;
                delete field.Theme;
                delete field.ThemeCssClass;

                this.$timeout(() => {
                    field.InheritTheme = false
                }, 600)
            } else field.Theme = this.module.FieldsDefaultTheme;
        } else {
            _.filter(field.FieldTypeObject.Themes || [], (t) => { return (t.TemplateName && t.TemplateName == field.Template && t.ThemeName == field.Theme) || (!t.TemplateName && t.ThemeName == field.Theme); }).map((t) => {
                field.IsSkinTheme = t.IsSkinTemplate;
                field.ThemeCssClass = t.ThemeCssClass;
            });
        }
    }

    onCancelFieldClick() {
        this.disposeWorkingMode();
    }

    onDeleteFieldClick($event) {
        if (confirm("Are you sure delete this field!?")) {
            var fieldID = this.currentField.FieldID;

            this.running = "delete-field";
            this.awaitAction = {
                title: "Deletin Field",
                subtitle: "Just a moment for removing the field...",
            };

            this.apiService.post("Studio", "DeleteModuleField", { ID: fieldID }).then((data) => {
                this.notifyService.success("Field deleted has been successfully");

                _.filter(this.fields, (field) => {
                    return field.FieldID == fieldID;
                }).map((field) => {
                    this.fields.splice(this.fields.indexOf(field), 1);

                    $("#board" + this.module.ModuleID)
                        .find('*[b-field="' + field.FieldID + '"]')
                        .remove();

                    this.buildModule();

                    delete this.field[field.FieldName];
                    delete this.awaitAction;
                    delete this.running;
                });

                this.removeCurrentField(true);

                this.onRebuildFormClick(true);
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

    getPaneElementByPaneName(paneName) {
        const $pane = $(`*[data-pane="${paneName}"]`);

        return $pane;
    }

    getPaneFieldsByIndex(paneName) {
        const $pane = this.getPaneElementByPaneName(paneName);

        var sortedFields = [];
        $pane.find("div[b-field]").each((index, element) => {
            const fieldID = $(element).attr("b-field");

            var field = this.getFieldByID(fieldID);
            field.ViewOrder = index;

            sortedFields.push({ FieldID: field.FieldID, ViewOrder: field.ViewOrder });
        });

        return sortedFields;
    }

    sortPaneFields(paneName) {
        const sortedFields = this.getPaneFieldsByIndex(paneName);

        this.running = "sort-fields";
        this.awaitAction = {
            title: "Sort Fields",
            subtitle: "Just a moment for sorting the fields...",
        };

        this.apiService.post("Studio", "SortModuleFields", sortedFields).then(
            (data) => {
                this.notifyService.success("the fields sort has been successfully");

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

    removeCurrentField(changeTab) {
        delete this.currentField.isShowSavePanel;
        delete this.currentField.shakeField;

        delete this.currentField;
        delete this.currentFieldBackup;
        delete this.isEditedCurrentField;

        this.onSidebarTabClick("toolbox");

        return true;
    }

    getFieldByID(fieldID) {
        var result = _.find(this.fields, (field) => { return field.FieldID == fieldID; });
        return result;
    }

    getFieldByName(fieldName) {
        var result;

        _.filter(this.fields, (field) => {
            return field.FieldName == fieldName;
        }).map((field) => (result = field));

        return result;
    }


    onFieldSettingsClick($event) {
        this.$scope.$broadcast("onBindFieldSettings_" + this.currentField.FieldName);

        this.onSidebarTabClick("field-settings");
        this.$rootScope.currentActivityBar = "builder";
    }

    onFieldItemBlur($event) {
        if ($event.target.contains($event.relatedTarget)) return;

        this.currentFieldFocused = false;

        if ($event) $event.stopPropagation();
    }

    getFieldElementByFieldID(fieldID) {
        return $(`div[b-field="${fieldID}"]`)[0];
    }

    onFieldSwap($event, actionType) {
        const $field = this.getFieldElementByFieldID(this.currentField.FieldID);
        const $target = actionType == 'up' ? $field.previousElementSibling : $field.nextElementSibling;
        if ($target && $target.attributes['b-field']) {
            if (actionType == 'up') $field.after($target);
            else if (actionType == 'down') $field.before($target);
            this.sortPaneFields(this.currentField.PaneName);
        }

        if ($event) $event.stopPropagation();
    }

    onFieldChangePaneClick(pane, $event) {
        if (this.currentField.PaneName != pane.paneName) {
            const $pane = $(`div[data-pane="${pane.paneName}"]`);
            const $field = this.getFieldElementByFieldID(this.currentField.FieldID);

            if ($pane.find($field).length == 0) $pane.append($field);

            this.currentField.PaneName = pane.paneName;
            this.currentField.ParentID = pane.parentID;

            this.scrollToFieldSection(this.currentField.FieldID)

            this.saveCurrentField().then(() => this.sortPaneFields(pane.paneName));
        }
    }

    scrollToFieldSection(fieldID) {
        this.$timeout(() => {
            const $field = this.getFieldElementByFieldID(fieldID);
            $([document.documentElement, document.body]).animate({
                scrollTop: $field.offset().top - 100
            }, 500);

            $('ul.dropdown-menu.show').removeClass('show');
        }, 1000);
    }

    /*------------------------------------*/
    /* Field Datasource Methods  */
    /*------------------------------------*/
    onShowFieldDataSourceClick($event, fieldID) {
        if (!this.currentField) this.onFieldItemClick($event, fieldID);

        this.workingMode = "field-data-source";
        this.$scope.$emit("onShowRightWidget", { controller: this });

        this.fieldDataSourceBackup = _.clone(this.currentField.DataSource || {});

        this.onFieldDataSourceTypeChange();

        delete this.running;
        delete this.awaitAction;

        if ($event) $event.stopPropagation();
    }

    onFieldDataSourceTypeChange() {
        if (
            this.currentField.DataSource &&
            this.currentField.DataSource.Type == 0 &&
            this.currentField.DataSource.ListID
        ) {
            this.running = "get-field-data-source";
            this.awaitAction = {
                title: "Loading Field Data Source",
                subtitle: "Just a moment for loading the field data source...",
            };

            this.apiService
                .get("Studio", "GetDefinedListByFieldID", {
                    fieldID: this.currentField.FieldID,
                })
                .then(
                    (data) => {
                        this.definedList = data;

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
        } else if (this.currentField.DataSource && this.currentField.DataSource.Type == 1) {
            if (this.definedLists) {
                this.onDefinedListChange();
                return;
            }

            this.running = "get-defined-lists";
            this.awaitAction = {
                title: "Loading Defined Lists",
                subtitle: "Just a moment for loading the defined lists...",
            };

            this.apiService
                .get("Studio", "GetDefinedLists", {
                    fieldID: this.currentField.FieldID,
                })
                .then(
                    (data) => {
                        this.definedLists = data;

                        this.onDefinedListChange();

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

    onFieldDataSourceServiceChange() {
        const service = _.find(this.services, (s) => {
            return s.ServiceID == this.currentField.DataSource.ServiceID;
        });

        this.currentField.DataSource.ServiceParams = _.clone(
            service.Params
        );
    }

    onCreateFieldDataSourceClick() {
        this.definedList = {
            ScenarioID: this.module.ScenarioID,
            ListType: "FieldOptions",
            ListName: this.currentField.FieldName + "_Options",
            FieldID: this.currentField.FieldID,
        };

        this.running = "create-field-data-source";
        this.awaitAction = {
            title: "Creating Field Data Source",
            subtitle: "Just a moment for creating the field data source...",
        };

        this.apiService.post("Studio", "CreateDefinedList", this.definedList).then((data) => {
            this.notifyService.success(
                "Field data source created has been successfully"
            );

            this.definedList.ListID = data;
            this.definedList.Items = [{}];
            this.currentField.DataSource = this.currentField.DataSource || {};
            this.currentField.DataSource.ListID = data;

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

    onSaveFieldDataSourceClick($event) {
        if (this.currentField.DataSource && (this.currentField.DataSource.Type == 0 || this.currentField.DataSource.Type == 1) && this.currentField.DataSource.ListID) {
            this.currentField.DataSource.TextField = "Text";
            this.currentField.DataSource.ValueField = "Value";

            this.saveDefinedList($event)
        } else if (this.currentField.DataSource && this.currentField.DataSource.Type == 2) {
            this.onSaveFieldClick($event);
        }
    }

    saveDefinedList($event) {
        this.running = "save-field-data-source";
        this.awaitAction = {
            title: "Saving Field Data Source",
            subtitle: "Just a moment for saving the field data source...",
        };
        this.apiService.post("Studio", "SaveDefinedList", this.definedList).then(
            (data) => {
                this.notifyService.success(
                    "Field data source saved has been successfully"
                );

                this.currentField.DataSource.Items = _.cloneDeep(this.definedList.Items);

                this.onSaveFieldClick($event);

                this.disposeWorkingMode();

                delete this.definedList;
                delete this.awaitAction;
                delete this.running;
            },
            (error) => {
                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                this.notifyService.error(error.data.Message);

                delete this.definedList;
                delete this.running;
            }
        );
    }

    onDefinedListChange() {
        this.definedList = this.definedList || {};
        this.definedList = _.find(this.definedLists, (i) => { return i.ListID == this.currentField.DataSource.ListID });
    }

    onRefreshDataSource() {
        this.running = "refresh-data-source";
        this.awaitAction = {
            title: "Refresh Data Source",
            subtitle: "Just a moment for refresh the data source...",
        };

        this.apiService.get("Studio", "GetServices").then((data) => {
            this.notifyService.success("Data Source refreshed has been successfully");

            this.services = data.Services;

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

    onCancelFieldDataSourceClick() {
        if (this.fieldDataSourceBackup) {
            this.currentField.DataSource = _.cloneDeep(this.fieldDataSourceBackup);

            delete this.fieldDataSourceBackup;
        }

        this.onCancelFieldClick();
    }

    onEditFieldDataSourceClick($event, fieldID) {
        this.onShowFieldDataSourceClick($event, fieldID);
    }

    /*------------------------------------*/
    /* Actions & Conditions Methods  */
    /*------------------------------------*/
    onShowFieldActionsClick($event) {
        this.fieldActionsFilter = this.currentField.FieldID;

        this.onSidebarTabClick('actions');
        this.$rootScope.currentActivityBar = "builder";


        if ($event) $event.stopPropagation();
    }

    onShowConditionsClick() {
        this.workingMode = "field-show-conditions";
        this.$scope.$emit("onShowRightWidget", { controller: this });
    }

    onShowConditionalValuesClick() {
        this.workingMode = "field-conditional-values";
        this.$scope.$emit("onShowRightWidget", { controller: this });
    }

    onAddFieldConditionalValueClick() {
        this.currentField.FieldValues = this.currentField.FieldValues || [];
        this.currentField.FieldValues.push({ Conditions: [] });
    }

    onAddActionClick(type, parentID) {
        this.$scope.$emit("onGotoPage", {
            page: "create-action",
            parentID: parentID,
            subParams: { type: type },
        });
    }

    onEditActionClick(action) {
        var subParams = {};
        if (action.FieldID) subParams.type = "field";

        this.$scope.$emit("onGotoPage", {
            page: "create-action",
            parentID: action.FieldID || action.ModuleID,
            id: action.ActionID,
            title: action.ActionName,
            subParams: subParams,
        });
    }

    onEditFieldActionClick(action) {
        this.$scope.$emit("onGotoPage", {
            page: "create-action",
            parentID: action.FieldID,
            id: action.ActionID,
            title: action.ActionName,
            subParams: { type: 'field' },
        });
    }

    onGotoActionsPageClick() {
        var subParams = {};
        if (this.fieldActionsFilter) subParams.type = "field";
        var parentID = this.fieldActionsFilter ? this.currentField.FieldID : undefined;
        var title = this.fieldActionsFilter ? this.currentField.FieldName + ' Actions' : this.module.ModuleName + ' Actions';

        this.$scope.$emit("onGotoPage", {
            page: "actions",
            parentID: parentID,
            title: title,
            subParams: subParams,
        });
    }

    onRemoveActionsFilterClick() {
        delete this.fieldActionsFilter;
    }

    onShowFieldTemplateClick() {
        this.checkInheritTemplateAndTheme(this.currentField);
        this.currentFieldBackup = _.clone(this.currentField);

        this.workingMode = "field-template";
        this.$scope.$emit("onShowRightWidget", { controller: this });
    }

    onCancelFieldTemplateClick() {
        this.currentField = _.clone(this.currentFieldBackup);
        this.field[this.currentField.FieldName] = this.currentField;

        this.disposeWorkingMode();
    }

    /*------------------------------------*/
    /* Custom Resources Methods  */
    /*------------------------------------*/
    onShowCustomResourcesClick() {
        this.workingMode = "module-custom-resources";
        this.$scope.$emit("onShowRightWidget", { controller: this });
    }

    onAddCustomResourceClick() {
        this.customResources = this.customResources || [];
        this.customResources.push({ ModuleID: this.module.ModuleID });
    }

    onSaveCustomResourcesClick() {
        this.running = "save-custom-resources";
        this.awaitAction = {
            title: "Saving Custom Resources",
            subtitle: "Just a moment for saving the custom resources...",
        };

        //in besorate movaghat hazf shod be in khater ke faghat dar module valed emkan custom resource vojod darad
        //const moduleID = this.module.ParentID ? this.module.ParentID : this.module.ModuleID;

        this.apiService.post("Studio", "SaveCustomResources", this.customResources, { moduleID: this.module.ModuleID }).then((data) => {
            this.notifyService.success("Module custom resources updated has been successfully");

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

    onDeleteCustomResourceClick($index) {
        this.customResources.splice($index, 1);
    }

    onCancelCustomResourcesClick() {
        this.disposeWorkingMode();
    }

    /*------------------------------------*/
    /* Custom Libraries Methods  */
    /*------------------------------------*/
    onShowCustomLibrariesClick() {
        this.workingMode = "module-custom-libraries";
        this.$scope.$emit("onShowRightWidget", { controller: this });
    }

    onAddCustomLibraryClick() {
        this.customLibraries = this.customLibraries || [];
        this.customLibraries.push({ ModuleID: this.module.ModuleID });
    }

    onCustomLibraryChange(library) {
        let lb = _.find(this.libraries, (l) => { return l.LibraryID == library.LibraryID });
        library.LibraryName = lb.LibraryName;
        library.Version = lb.Version;
        library.LocalPath = lb.LocalPath;

        this.running = "load-library-resources";
        this.awaitAction = {
            title: "Loading Library Resources",
            subtitle: "Just a moment for loading the library resources...",
        };

        this.apiService.get("Studio", "GetLibraryResources", { libraryID: library.LibraryID }).then((data) => {
            this.libraryResources = data;

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

    onSaveCustomLibrariesClick() {
        this.running = "save-custom-libraries";
        this.awaitAction = {
            title: "Saving Custom Libraries",
            subtitle: "Just a moment for saving the custom libraries...",
        };

        this.apiService.post("Studio", "SaveCustomLibraries", this.customLibraries, { moduleID: this.module.ModuleID }).then((data) => {
            this.notifyService.success("Module custom libraries updated has been successfully");

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

    onDeleteCustomLibraryClick($index) {
        this.customLibraries.splice($index, 1);
    }

    onCancelCustomLibrariesClick() {
        this.disposeWorkingMode();
    }

    /*------------------------------------*/
    /* Common Methods */
    /*------------------------------------*/
    disposeWorkingMode() {
        this.$scope.$emit("onHideRightWidget");

        this.$timeout(() => {
            delete this.workingMode;
        }, 200);
    }

    onSidebarTabClick(tab) {
        this.currentSidebarTab = tab;
    }

    onExpressionParsingTypeChange(item, type) {
        item.ExpressionParsingType = type;
    }

    monitoringProgress() {
        var index = 1;
        var monitoringFileStatus;
        var progressValueFileStatus;

        const getMonitoringFiles = () => {
            fetch(this.monitoringFile + '?ver=' + index++).then((stream) => {
                monitoringFileStatus = stream.status;
                return stream.text();
            }).then((content) => {
                if (monitoringFileStatus == 200) $('.await-action-subtitle').text(content);
            });

            fetch(this.progressValueFile + '?ver=' + index++).then((stream) => {
                progressValueFileStatus = stream.status;
                return stream.text();
            }).then((content) => {
                if (progressValueFileStatus == 200) {
                    $('.progress-bar').css('width', content + '%');
                    this.progressValue = content;

                    if (parseInt(content) == 100) {
                        clearInterval(this.monitoringTimer);
                        this.monitoringTimer = 0;
                    }
                }
            });
        }

        this.monitoringTimer = setInterval(getMonitoringFiles, 1000);
    }

    /*------------------------------------*/
    /*  Drag & Drop Methods */
    /*------------------------------------*/
    onFieldDragOver($event, ui) {
        $($event.target).addClass("drag");
    }

    onFieldDragOut($event, ui) {
        $($event.target).removeClass("drag");
    }

    onFieldDrop($event, ui, paneName, parentID, beforeFieldID) {
        const $element = $($event.target);
        $element.removeClass("drag");

        paneName = paneName ? paneName : $element.attr("field-drop");

        parentID = parentID ? parentID : $element.attr("data-parent-id");

        const fieldTypeName = $(ui.draggable[0]).data("field-type");

        _.filter(this.fieldTypes, (fieldType) => {
            return fieldType.FieldType == fieldTypeName;
        }).map((fieldType) => {
            this.addField(paneName, parentID, fieldType, beforeFieldID);
        });
    }

    onStopDrag($event, ui, $index) {
        $($event.target).css("top", 0);
        $($event.target).css("left", 0);
    }
}