import moduleVariablesWidget from "./module-variables.html";
import moduleSkinWidget from "./module-skin.html";
import moduleLayoutTemplateWidget from "./module-layout-template.html";
import moduleCustomResourceWidget from "./module-custom-resource-widget.html";
import fieldEditWidget from "./field/field-edit.html";
import fieldSettingsWidget from "./field/field-settings.html";
import fieldShowConditionsWidget from "./field/field-show-conditions.html";
import fieldConditionalValuesWidget from "./field/field-conditional-values.html";
import fieldDataSourceWidget from "./field/field-data-source.html";
import { GlobalSettings } from "../../../../common/configs/global.settings";

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
        moduleBuilderService,
        moduleRenderService
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
        this.moduleBuilderService = moduleBuilderService;
        this.moduleRenderService = moduleRenderService;

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

        $scope.fieldTypeFilter = (item) => {
            return true;
        };

        // $scope.$watch(
        //   "$.currentField",
        //   (newVal, oldVal) => {
        //     if (this.ignoreWatchField) return; //Skip

        //     if (newVal != oldVal) this.isEditedCurrentField = true;
        //   },
        //   true
        // );

        $scope.$on("onShowFieldDataSource", (e, args) => {
            this.onShowFieldDataSourceClick(args.field);
        });

        this.moduleVariablesWidget = moduleVariablesWidget;
        this.moduleSkinWidget = moduleSkinWidget;
        this.moduleLayoutTemplateWidget = moduleLayoutTemplateWidget;
        this.moduleCustomResourceWidget = moduleCustomResourceWidget;
        this.fieldEditWidget = fieldEditWidget;
        this.fieldSettingsWidget = fieldSettingsWidget;
        this.fieldShowConditionsWidget = fieldShowConditionsWidget;
        this.fieldConditionalValuesWidget = fieldConditionalValuesWidget;
        this.fieldDataSourceWidget = fieldDataSourceWidget;

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        if (!window.isDefindeCtrl_sEvent) {
            document.addEventListener("keydown", (e) => {
                if (e.key == 'F6' && this.module.ModuleBuilderType == "HtmlEditor") {
                    var tabNumber = $('button[data-bs-toggle="tab"].active').data('tab');
                    tabNumber = tabNumber >= 1 && tabNumber < 3 ? tabNumber + 1 : 1;
                    $(`button[data-tab=${tabNumber}]`).tab('show');
                    e.preventDefault();
                } else if ((e.key === 's' && e.ctrlKey) || e.key === "F7") {
                    this.currentField ? this.saveCurrentField() : this.saveModule();
                    e.preventDefault();
                }
            }, false);

            window.isDefindeCtrl_sEvent = true;
        }

        this.onPageLoad();
    }

    onPageLoad() {
        const id = this.globalService.getParameterByName("id");

        this.running = "get-module-fields";
        this.awaitAction = {
            title: "Get Module Fields",
            subtitle: "Just a moment for loading module fields...",
        };

        this.apiService
            .get("Studio", "GetModuleBuilder", { moduleID: id || null })
            .then(
                (data) => {
                    this.module = data.Module;
                    this.skins = data.Skins;
                    this.fields = data.Fields;
                    this.actions = data.Actions;
                    this.services = data.Services;
                    this.viewModels = data.ViewModels;
                    this.variables = data.Variables;
                    this.roles = data.Roles;
                    this.customResources = data.CustomResources;
                    this.field = {};

                    data.FieldTypes.forEach(ft => {
                        ft.Icon = (ft.Icon || '').replace('[EXTPATH]', GlobalSettings.modulePath + "extensions");
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

                    this.reBuildModule();

                    this.$scope.$emit("onUpdateCurrentTab", {
                        id: this.module.ModuleID,
                        title: this.module.ModuleName,
                    });

                    this.apiService
                        .get("Studio", "GetModuleViewLinkUrl", {
                            moduleID: this.module.ModuleID,
                            parentID: this.module.ParentID,
                            moduleWrapper: this.module.Wrapper,
                        })
                        .then((data) => (this.moduleViewLinkUrl = data));

                    if (this.module.Settings && this.module.ModuleBuilderType == "HtmlEditor" && !this.module.CustomJs)
                        this.module.CustomJs = `function ${this.globalService.capitalizeFirstLetter(this.module.ModuleName.replace(/-/g,''))}Controller(moduleController,$scope) /* Please don't rename function name */ \n{\n\tthis.onPageLoad = function()\n\t{\n\t\tmoduleController.callActionsByEvent('module','OnPageLoad').then((data) => {\t\n\t\t\t//...\n\t\t});\n\t}\n}`;

                    this.onFocusModule();

                    delete this.awaitAction;
                    delete this.running;
                },
                (error) => {
                    if (this.isNewAction) delete this.action.ActionID;

                    this.awaitAction.isError = true;
                    this.awaitAction.subtitle = error.statusText;
                    this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                    this.notifyService.error(error.data.Message);

                    delete this.running;
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
                    id: "drpTemplate",
                    required: true,
                },
            },
            true,
            this.$scope,
            "$.currentField"
        );
    }

    /*------------------------------------*/
    /* Build Module Methods  */
    /*------------------------------------*/
    onRenderModuleClick(isRenderScriptsAndStyles) {
        if (!this.module.Skin || !this.module.Template) {
            this.notifyService.notify(`
                the First step for creating your module,
                you must be select skin and template and theme for the module
            `);

            this.$timeout(() => this.onShowModuleSkinClick(), 1000);

            return;
        }

        this.moduleRenderService
            .renderModule(this.module, this.fields, this.$scope)
            .then((moduleTemplate) => {
                this.running = "save-rendered-module";
                this.awaitAction = {
                    title: "Save Rendered Module",
                    subtitle: "Just a moment for save rendered module...",
                };

                this.apiService
                    .post("Studio", "SaveRenderedModule", {
                        ModuleID: this.module.ModuleID,
                        ParentID: this.module.ParentID,
                        ModuleTemplate: moduleTemplate,
                        IsRenderScriptsAndStyles: isRenderScriptsAndStyles,
                    })
                    .then(
                        (data) => {
                            this.notifyService.success(
                                "Rendered module save has been successfully"
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
            });
    }

    onRebuildModuleClick() {
        if (!this.module.Skin || !this.module.Template) {
            this.notifyService.notify(`
                the First step for creating your module,
                you must be select skin and template and theme for the module
            `);

            this.$timeout(() => this.onShowModuleSkinClick(), 1000);

            return;
        }


        this.reBuildModule();
    }

    reBuildModule() {
        if (!this.module.Skin || !this.module.Template) {
            this.notifyService.notify(`
                the First step for creating your module,
                you must be select skin and template and theme for the module
            `);

            this.$timeout(() => this.onShowModuleSkinClick(), 1000);

            return;
        }

        const defer = this.$q.defer();

        this.moduleBuilderService
            .rebuildModule(this.module, this.fields, this.$scope, this.actions)
            .then((data) => {
                $("#board" + this.module.ModuleID).html(data.$board);

                this.panes = data.panes;

                this.setFieldsSortingUi();
                this.setFieldsDragingUi();

                defer.resolve();
            });

        return defer.promise;
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
                    const parentID =
                        $(ui.item[0].parentElement).data("parent-id") || null;

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

    saveModule() {
        const defer = this.$q.defer();

        this.running = "save-module";
        this.awaitAction = {
            title: "Saving Module",
            subtitle: "Just a moment for saving the module...",
        };

        this.apiService.post("Studio", "SaveModuleBasicInfo", this.module).then(
            (data) => {
                defer.resolve();

                this.notifyService.success("Module updated has been successfully");

                if (this.module.ModuleBuilderType != "HtmlEditor") {
                    this.reBuildModule(this.module, this.fields, this.$scope).then(() => {
                        this.onRenderModuleClick(true);
                    });
                }

                delete this.awaitAction;
                delete this.running;
            },
            (error) => {
                defer.reject(error);

                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                this.notifyService.error(error.data.Message);

                delete this.running;
            }
        );

        return defer.promise;
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
        this.$scope.$emit("onShowRightWidget");
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
        this.$scope.$emit("onShowRightWidget");
    }

    onReloadSkinsClick() {
        this.running = "reloading-module-skins";
        this.awaitAction = {
            title: "Reloading Skins",
            subtitle: "Just a moment for reloading the module skins...",
        };

        this.apiService.get("Studio", "GetModuleSkins").then((data) => {
                this.skins = data;

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
        if (this.module.Skin != skin.SkinName || !this.module.ModuleSkin) {
            this.module.Skin = skin.SkinName;
            this.module.Template = null;
            this.module.Theme = null;

            this.apiService
                .get("Studio", "GetModuleSkin", { skinName: skin.SkinName })
                .then((data) => {
                    this.module.ModuleSkin = data;
                });
        }
    }

    onSelectSkinTemplateClick(template) {
        if (this.module.Template != template.TemplateName)
            this.moduleLayoutTemplateMustBeUpdate = true;

        this.module.Template = template.TemplateName;
    }

    onSaveSkinClick() {
        if (!this.module.Skin || !this.module.Template) {
            this.notifyService.error('You must be select skin and template for continue the module builder');
            return;
        }

        if (this.moduleLayoutTemplateMustBeUpdate && confirm('Do you want to replace the new module template(html/css) with old template?(this action can remove the custom (html/css) in layout template)')) {
            const template = _.find(
                this.module.ModuleSkin[this.module.ModuleType + "Templates"],
                (t) => {
                    return t.TemplateName == this.module.Template;
                }
            );

            this.running = "get-template-content";
            this.awaitAction = {
                title: "Loading Template",
                subtitle: "Just a moment for loading the template content...",
            };

            this.apiService
                .get("Studio", "GetModuleSkinTemplateContents", {
                    layoutTemplatePath: template.LayoutTemplatePath,
                    layoutCssPath: template.LayoutCssPath,
                })
                .then(
                    (data) => {
                        this.module.LayoutTemplate = data.LayoutTemplate;

                        delete this.awaitAction;
                        delete this.running;

                        this.saveModule().then(() => {
                            this.disposeWorkingMode();
                        });
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
        } else {
            this.saveModule().then(() => {
                this.disposeWorkingMode();
            });
        }
    }

    onCancelSkinClick() {
        this.disposeWorkingMode();
    }

    onShowLayoutTemplateClick() {
        if (!this.module.Skin || !this.module.Template) {
            this.notifyService.notify(`
                the First step for creating your module,
                you must be select skin and template and theme for the module
            `);

            this.$timeout(() => this.onShowModuleSkinClick(), 1000);

            return;
        }

        this.workingMode = "module-edit-layout-template";
        this.$scope.$emit("onShowRightWidget");
    }

    onSaveLayoutTemplateClick() {
        this.saveModule().then(() => {
            this.disposeWorkingMode();
        });
    }

    onCancelLayoutTemplateClick() {
        this.disposeWorkingMode();
    }

    onSelectFieldTemplate(template) {
        this.currentField.Template = template;
    }

    onSelectFieldTheme(theme) {
        this.currentField.Theme = theme;
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
        this.$scope.$emit("onShowRightWidget");
    }

    onShowConditionalValuesClick() {
        this.workingMode = "field-conditional-values";
        this.$scope.$emit("onShowRightWidget");
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

    /*------------------------------------*/
    /* Field Datasource Methods  */
    /*------------------------------------*/
    onShowFieldDataSourceClick($event, fieldID) {
        if (!this.currentField) this.onFieldItemClick($event, fieldID);

        this.workingMode = "field-data-source";
        this.$scope.$emit("onShowRightWidget");

        this.fieldDataSourceBackup = _.clone(this.currentField.Settings.DataSource || {});

        this.onFieldDataSourceTypeChange();

        if ($event) $event.stopPropagation();
    }

    onFieldDataSourceTypeChange() {
        if (
            this.currentField.Settings.DataSource &&
            this.currentField.Settings.DataSource.Type == 0 &&
            this.currentField.Settings.DataSource.ListID
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
                        this.awaitAction.desc =
                            this.globalService.getErrorHtmlFormat(error);

                        this.notifyService.error(error.data.Message);

                        delete this.running;
                    }
                );
        }
    }

    onFieldDataSourceServiceChange() {
        const service = _.find(this.services, (s) => {
            return s.ServiceID == this.currentField.Settings.DataSource.ServiceID;
        });

        this.currentField.Settings.DataSource.ServiceParams = _.clone(
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

        this.apiService.post("Studio", "CreateDefinedList", this.definedList).then(
            (data) => {
                this.notifyService.success(
                    "Field data source created has been successfully"
                );

                this.definedList.ListID = data;
                this.definedList.Items = [{}];
                this.currentField.Settings.DataSource =
                    this.currentField.Settings.DataSource || {};
                this.currentField.Settings.DataSource.ListID = this.definedList.ListID;

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
        if (
            this.currentField.Settings.DataSource &&
            this.currentField.Settings.DataSource.Type == 0 &&
            this.currentField.Settings.DataSource.ListID
        ) {
            this.currentField.Settings.DataSource.TextField = "Text";
            this.currentField.Settings.DataSource.ValueField = "Value";

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

                    this.onSaveFieldClick($event);

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
        } else this.onSaveFieldClick($event);
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
            this.currentField.Settings.DataSource = _.clone(
                this.fieldDataSourceBackup
            );

            delete this.fieldDataSourceBackup;
        }

        this.onCancelFieldClick();
    }

    onEditFieldDataSourceClick($event, fieldID) {

        this.onShowFieldDataSourceClick($event, fieldID);
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

    /*------------------------------------*/
    /*  Field Methods */
    /*------------------------------------*/
    onRefreshFieldClick($event, fieldID) {
        this.running = "refresh-field";
        this.awaitAction = {
            title: "Refresh Field",
            subtitle: "Just a moment for refresh the field...",
        };

        this.apiService.get("Studio", "GetModuleField", { fieldID: fieldID }).then((data) => {
                this.notifyService.success("Field refreshed has been successfully");

                var field = this.getFieldByID(fieldID);
                this.fields[this.fields.indexOf(field)] = data;
                this.field[field.FieldName] = data;

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
            const field = _.find(this.fields, (field) => {
                return field.FieldID == fieldID;
            });

            this.currentFieldBackup = _.clone(field);
            this.currentField = field;
            this.field[this.currentField.FieldName] = this.currentField;
            //this.ignoreWatchField = true;

            this.$scope.$broadcast("onBindFieldSettings_" + this.currentField.FieldName);

            if (this.currentSidebarTab != 'actions') {
                this.onSidebarTabClick("field-settings");
            }

            this.fieldActionsFilter = this.currentField.FieldID;

            // this.$timeout(() => {
            //   delete this.ignoreWatchField;
            // });
        }

        if ($event) $event.stopPropagation();
    }

    onCancelEditFieldClick($event) {
        const field = _.find(this.fields, (field) => {
            return field.FieldID == this.currentField.FieldID;
        });

        this.field[this.currentFieldBackup.FieldName] = this.fields[
            this.fields.indexOf(field)
        ] = _.clone(this.currentFieldBackup);

        this.removeCurrentField(true);

        if ($event) $event.stopPropagation();
    }

    addField(paneName, parentID, fieldType, beforeFieldID) {
        const suggestFieldName =
            fieldType.FieldType +
            (_.filter(this.fields, (f) => {
                    return f.FieldType == fieldType.FieldType;
                }).length +
                1);

        const defaultSettings = JSON.parse(fieldType.DefaultSettings || "{}");

        this.currentField = {
            moduleID: this.module.ModuleID,
            ParentID: parentID,
            PaneName: paneName,
            FieldType: fieldType.FieldType,
            FieldName: suggestFieldName,
            FieldText: fieldType.FieldText ? fieldType.FieldText : "Enter your text",
            IsRequired: false,
            IsShow: true,
            IsEnabled: true,
            IsGroup: fieldType.IsGroup,
            IsValuable: fieldType.IsValuable,
            IsSelective: fieldType.IsSelective,
            IsJsonValue: fieldType.IsJsonValue,
            Options: [],
            Settings: defaultSettings,
            FieldTypeObject: fieldType,
        };

        this.beforeFieldID = beforeFieldID;

        this.workingMode = "field-edit";
        this.$scope.$emit("onShowRightWidget");
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

                    this.moduleBuilderService
                        .getFieldUI(this.currentField, this.$scope)
                        .then(($fieldItem) => {
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

                            if (field.IsGroup) this.reBuildModule();

                            const firstFieldOfFieldType =
                                _.filter(this.fields, (f) => {
                                    return f.FieldType == field.FieldType;
                                }).length == 1;

                            this.onRenderModuleClick(firstFieldOfFieldType);

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
        const defer = this.$q.defer();

        delete this.currentField.Value;

        this.running = "save-field";
        this.awaitAction = {
            title: "Saving Field",
            subtitle: "Just a moment for saving the field...",
        };
        // this.ignoreWatchField = true;

        this.apiService.post("Studio", "SaveModuleField", this.currentField).then(
            (field) => {
                this.notifyService.success("Field updated has been successfully");

                delete this.awaitAction;
                delete this.running;
                delete this.currentField.isShowSavePanel;
                delete this.isEditedCurrentField;

                this.disposeWorkingMode();

                // this.$timeout(() => {
                //   delete this.ignoreWatchField;
                // });

                defer.resolve(field);
            },
            (error) => {
                this.awaitAction.isError = true;
                this.awaitAction.subtitle = error.statusText;
                this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                this.notifyService.error(error.data.Message);

                delete this.running;
            }
        );

        return defer.promise;
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

                        this.onRenderModuleClick();

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

    getPaneFieldsByIndex(paneName) {
        const $pane = $(`*[data-pane="${paneName}"]`);

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
        var result;

        _.filter(this.fields, (field) => { return field.FieldID == fieldID; }).map((field) => (result = field));

        return result;
    }

    getFieldByName(fieldName) {
        var result;

        _.filter(this.fields, (field) => {
            return field.FieldName == fieldName;
        }).map((field) => (result = field));

        return result;
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

    /*------------------------------------*/
    /* Current Field Toolbar Item Events */
    /*------------------------------------*/
    onFieldSettingsClick($event) {
        this.$scope.$broadcast("onBindFieldSettings_" + this.currentField.FieldName);

        this.onSidebarTabClick("field-settings");
        this.$rootScope.currentActivityBar = "builder";
    }

    onFieldChangePaneClick(pane, $event) {
        if (this.currentField.PaneName != pane.paneName) {
            this.currentField.PaneName = pane.paneName;
            this.currentField.ParentID = pane.parentID;

            this.saveCurrentField().then(() => this.sortPaneFields(pane.paneName));
        }
    }

    /*------------------------------------*/
    /* Custom Resources Methods  */
    /*------------------------------------*/
    onShowCustomResourceClick() {
        this.workingMode = "module-custom-resources";
        this.$scope.$emit("onShowRightWidget");
    }

    onAddCustomResourceClick() {
        this.customResources = this.customResources || [];
        this.customResources.push({});
    }


    onSaveCustomResourcesClick() {
        this.running = "save-custom-resources";
        this.awaitAction = {
            title: "Saving Custom Resources",
            subtitle: "Just a moment for saving the custom resources...",
        };

        const moduleID = this.module.ParentID ? this.module.ParentID : this.module.ModuleID;

        this.apiService.post("Studio", "SaveCustomResources",
            this.customResources, { moduleID: moduleID }).then(
            (data) => {
                this.notifyService.success("Module custom resources updated has been successfully");

                delete this.awaitAction;
                delete this.running;
            },
            (error) => {
                defer.reject(error);

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
}

// onDragOverField($event, ui) {
//   $($event.target).addClass("drag");
// }

// onDragOutField($event, ui) {
//   $($event.target).removeClass("drag");
// }

// onDropField($event, ui, beforeField) {
//   $($event.target).removeClass("drag");

//   var isNewField = false;
//   var fieldType;
//   var movedField;

//   if ($(ui.draggable[0]).data("new-field")) {
//     isNewField = true;
//     fieldType = $(ui.draggable[0]).data("fieldtype");
//   } else
//     movedField = this.getFieldByName($(ui.draggable[0]).data("move-field"));

//   var viewOrder = beforeField.ViewOrder;

//   this.sortFields(
//     beforeField.PaneName,
//     beforeField.ViewOrder,
//     movedField ? movedField.FieldName : ""
//   );

//   if (isNewField) {
//     var fieldTypeObject = _.filter(this.fieldTypes, (ft) => {
//       return ft.FieldType == fieldType;
//     })[0];

//     this.addField(
//       beforeField.PaneName,
//       beforeField.ParentID,
//       fieldTypeObject,
//       viewOrder,
//       beforeField
//     );
//   } else {
//     this.currentField = movedField;
//     if (this.currentField.FieldID == beforeField.ParentID) return;
//     this.currentField.PaneName = beforeField.PaneName;
//     this.currentField.ParentID = beforeField.ParentID;
//     this.currentField.ViewOrder = viewOrder;

//     this.moveField("", this.currentField, beforeField);

//     this.onSaveFieldClick();
//   }

//   this.dragOnField = false;
// }

// updateFieldInPane(field, fieldName) {
//   if (field.IsGroup) {
//     this.onRebuildFormClick();
//   } else {
//     const $fieldInBoardPane = $("#board").find(
//       '*[data-field="' + fieldName + '"]'
//     );

//     this.moduleBuilderService
//       .getFieldUI($scope.module, field, $scope)
//       .then(($ui) => {
//         const $field = this.$compile($ui.$forAdmin)(this.$scope);

//         $fieldInBoardPane.replaceWith($field);

//         // this.moduleBuilderService.saveModuleTemplates(
//         //   $scope.module,
//         //   $scope.fields,
//         //   $adminTemplate,
//         //   $userTemplate
//         // );
//       });
//   }
// }

// moveField(paneName, field, beforeField) {
//   if (field.IsGroup) {
//     $scope.onRebuildFormClick();
//   } else {
//     var $fieldInBoardPane = $("#board").find(
//       '*[data-field="' + field.FieldName + '"]'
//     );

//     if (beforeField) {
//       $fieldInBoardPane.insertBefore(
//         $("#board").find(
//           '*[data-field="' + beforeField.FieldName + '"]'
//         )
//       );
//     } else {
//       var $boardPane = $("#board").find(
//         '*[data-pane="' + paneName + '"]'
//       );
//       var $adminPane = $adminTemplate.find('*[data-pane="' + paneName + '"]');
//       var $pane = $userTemplate.find('*[data-pane="' + paneName + '"]');

//       $fieldInBoardPane.appendTo($boardPane);
//     }

//     //moduleBuilderService.saveModuleTemplates($scope.module, $scope.fields, $adminTemplate, $userTemplate);
//   }
// }

// onRebuildFormClick(module, fields) {
//     $scope.waiting = true;

//     moduleBuilderService
//       .rebuildModule($scope.module, $scope.fields, $scope)
//       .then((data) => {
//         delete $scope.waiting;

//         $adminTemplate = data.$adminTemplate;
//         $userTemplate = data.$userTemplate;

//         $("#board").html("");
//         $("#board").append($compile($adminTemplate.html())($scope));

//         $timeout(() => {
//           $("#board").find("*[field-drop]").droppable({
//             greedy: true,
//             accept: '*[data-drag="true"]',
//             drop: this.onDropPane,
//             over: this.onDragOverPane,
//             out: this.onDragOutPane,
//           });
//         });
//       });
//   }

// onRebuildFormClick(module, fields) {
//   $scope.waiting = true;

//   moduleBuilderService
//     .rebuildModule($scope.module, $scope.fields, $scope)
//     .then((data) => {
//       delete $scope.waiting;

//       $adminTemplate = data.$adminTemplate;
//       $userTemplate = data.$userTemplate;

//       $("#board").html("");
//       $("#board").append($compile($adminTemplate.html())($scope));

//       $timeout(() => {
//         $("#board").find("*[field-drop]").droppable({
//           greedy: true,
//           accept: '*[data-drag="true"]',
//           drop: this.onDropPane,
//           over: this.onDragOverPane,
//           out: this.onDragOutPane,
//         });
//       });
//     });
// }