import { GlobalSettings } from "../../../configs/global.settings";

export class moduleBuilderService {
    constructor($filter, $q, $compile, $timeout, $deferredBroadcast, globalService, apiService, notificationService) {
        this.$filter = $filter;
        this.$q = $q;
        this.$compile = $compile;
        this.$timeout = $timeout;
        this.$deferredBroadcast = $deferredBroadcast;
        this.globalService = globalService;
        this.apiService = apiService;
        this.notifyService = notificationService;

        this.fieldLayoutTemplate;
        this.fieldsTemplate = {};
        this.fieldsScripts = {};
    }

    rebuildScenarioModules(scenarioID, $scope) {
        this.apiService.get("Studio", "GetScenarioModulesAndFields", { scenarioID: scenarioID })
            .then((data) => {
                var fieldTypes = data.FieldTypes;

                const populateModules = (index) => {
                    if (index < data.Modules.length) {
                        var m = data.Modules[index];

                        if (m.Skin) {
                            angular.forEach(m.Fields, (f) => {
                                f.FieldTypeObject = {};
                                _.filter(fieldTypes, (ft) => { return ft.FieldType == f.FieldType }).map((fieldType) => {
                                    f.FieldTypeObject = fieldType;
                                });

                                f.Settings = f.Settings || {};
                                this.globalService.parseJsonItems(f.Settings);
                            });

                            this.renderModule(m, m.Fields, $scope).then((moduleTemplate) => {
                                this.awaitAction = {
                                    title: "Save Rendered Module",
                                    subtitle: "Just a moment for save rendered module...",
                                };

                                this.apiService.post("Studio", "SaveRenderedModule", {
                                    ModuleID: m.ModuleID,
                                    ParentID: m.ParentID,
                                    ModuleTemplate: moduleTemplate,
                                    IsRenderScriptsAndStyles: true,
                                }).then((data) => {
                                    populateModules(index + 1);

                                    this.notifyService.success(
                                        "Rendered module save has been successfully"
                                    );

                                    delete this.awaitAction;
                                }, (error) => {
                                    populateModules(index + 1);

                                    this.awaitAction.isError = true;
                                    this.awaitAction.subtitle = error.statusText;
                                    this.awaitAction.desc =
                                        this.globalService.getErrorHtmlFormat(error);

                                    this.notifyService.error(error.data.Message);
                                });
                            });
                        } else
                            populateModules(index + 1);
                    }
                }

                populateModules(0);
            });
    }

    renderModuleTemplate(module, fields, $scope) {
        const $defer = this.$q.defer();

        if (!module.Skin || !module.Template) {
            this.notifyService.notify(`
                the First step is selecting skin and template for creating your module,
                you must be select skin and template and theme for the module
            `);

            $defer.reject({ errorType: 'skin', msg: 'no any Skin set for the Module.' });

            return;
        }

        this.module = module;
        this.fields = fields;
        this.$scope = $scope;
        this.progressIndex = 0;
        this.progressValue = (20 / this.fields.length);
        if (this.progressValue < 0) this.progressValue *= -1;

        this.$form = $(`<div>${module.LayoutTemplate}</div>`);

        _.map(this.fields, (f) => (f.AddedToPane = false));

        var panes = [];
        $(`<div>${module.LayoutTemplate}</div>`)
            .find("*[data-pane]").each((index, element) => {
                const paneName = $(element).data("pane");
                panes.push(paneName);
            });

        for (var pane in _.groupBy(this.fields, "PaneName")) {
            if (panes.indexOf(pane) == -1) panes.push(pane);
        }

        this.buffer = [];
        _.forEach(panes, (p) => {
            this.buffer.push({ PaneName: p });
        });

        this.processBuffer($defer).then((data) => {
            $defer.resolve(data);
        });

        return $defer.promise;
    }

    processBuffer($defer) {
        if (!this.buffer.length) {
            this.completed().then((data) => {
                $defer.resolve(data);
            });
        } else {
            const currentPane = this.buffer[0];
            const $pane = this.$form.find(
                '*[data-pane="' + currentPane.PaneName + '"]'
            );

            if ($pane.length) {
                const paneFields = _.orderBy(
                    _.filter(this.fields, (f) => {
                        return f.PaneName == currentPane.PaneName && !f.AddedToPane;
                    }), ["ViewOrder"], ["desc"]
                );

                this.parsePaneFields($pane, paneFields).then(() => {
                    this.buffer.shift();
                    this.processBuffer($defer);
                });
            } else {
                currentPane.tryForFindPane = currentPane.tryForFindPane || 0;
                if (currentPane.tryForFindPane < 10) {
                    currentPane.tryForFindPane++;

                    this.buffer.push(_.clone(currentPane));
                }

                this.buffer.shift();
                this.processBuffer($defer);
            }
        }

        return $defer.promise;
    }

    parsePaneFields($pane, fields) {
        const $defer = this.$q.defer();

        this.parseField($defer, $pane, fields, fields.length).then(() =>
            $defer.resolve()
        );

        return $defer.promise;
    }

    parseField($defer, $pane, fields, index) {
        if (index <= 0) {
            $defer.resolve();
        } else {
            this.$timeout(() => {
                var field = fields[index - 1];

                $('.progress-bar').css('width', (this.progressValue * this.progressIndex++).toString() + '%');
                $('.await-action-subtitle').text(`Loading ${field.Template} template for ${field.FieldName} field...`);

                this.getFieldUI(field, this.$scope).then(($fieldItem) => {
                    if (field.FieldTypeObject.IsContent) {
                        if (field.ShowConditions && field.ShowConditions.length) {
                            $fieldItem.find("*[data-field-content]").append(field.Settings.Content);
                        }
                        else {
                            $fieldItem = $(field.Settings.Content);
                        }
                    }

                    $pane.append($fieldItem);

                    field.AddedToPane = true;

                    this.parseField($defer, $pane, fields, index - 1);
                });

            })
        }

        return $defer.promise;
    }

    completed() {
        const $defer = this.$q.defer();

        $defer.resolve(this.$form.html());

        return $defer.promise;
    }

    getFieldUI(field, $scope) {
        const $defer = this.$q.defer();

        this.getBoardFieldItem(field).then((fieldLayoutTemplate) => {
            $defer.resolve($(fieldLayoutTemplate));
        });

        return $defer.promise;
    }

    getBoardFieldItem(field) {
        const $defer = this.$q.defer();

        if (!field.FieldTypeObject) {
            console.log(field);
            $defer.resolve("<div></div>");
            return;
        }

        const fieldTemplate = _.find(field.FieldTypeObject.Templates || [], (t) => { return t.TemplateName == field.Template; });
        const fieldTemplatePath = fieldTemplate ? (fieldTemplate.TemplatePath || "").replace("[EXTPATH]", GlobalSettings.modulePath + "extensions") : "";

        if (fieldTemplatePath) {
            var layout = field.Settings.IsCustomFieldLayout && field.Settings.CustomFieldLayoutModified && field.Settings.CustomFieldLayout
                ? field.Settings.CustomFieldLayout : this.getDefaultFieldLayoutTemplate(field);

            fetch(fieldTemplatePath + "?ver=" + GlobalSettings.version).then((stream) => {
                if (stream.status >= 400) throw new Error("Bad response from server");
                return stream.text();
            }).then((fieldHtml) => {
                fieldHtml = fieldHtml || "";

                /* 
                    This part of the current service is finding the items according to the regular expressions
                    in the field template code and replacing it with the correct value.
                */
                var matches = fieldHtml.match(/\[\[(.[^\[\]\{\}]+)\]\]/gm);
                _.forEach(matches, (m) => {
                    const match = /\[\[(.[^\[\]\{\}]+)\]\]/gm.exec(m);
                    const value = _.get(field, match[1]) ?? '';
                    fieldHtml = fieldHtml.replace(match[0], value);
                });

                if (field.ShowConditions && field.ShowConditions.length) {
                    layout = layout.replace(/\[FIELD-DISPLAY-EXPRESSION\]/g, `ng-if="Field.${field.FieldName}.IsShow"`);
                } else {
                    layout = layout.replace(/\[FIELD-DISPLAY-EXPRESSION\]/g, "");
                }

                /*
                    Parse field label regular expressions 
                */
                var fieldLableRegexResult = /\#FIELDTEXT([\s\S]*)\#ENDFIELDTEXT/gm.exec(layout);
                if (fieldLableRegexResult && fieldLableRegexResult.length >= 2)
                    layout = layout.replace(fieldLableRegexResult[0], field.Settings.IsHideFieldText ? "" : fieldLableRegexResult[1]);

                layout = layout.replace(/\[FIELD-TEXT\]/g, field.FieldText);
                layout = layout.replace(/\[FIELD-COMPONENT\]/g, fieldHtml);
                layout = layout.replace(/\[FIELD-SUBTEXT\]/g, field.Settings.Subtext ? `<span class="${field.Settings.SubtextCssClass || ''}">${field.Settings.Subtext}</span>` : '');
                layout = layout.replace(/\[FIELD-REQUIRED-MESSAGE\]/g, field.IsRequired && field.Settings.RequiredMessage ? `<p ng-show="[FIELD].Validated && ([FIELD].Value==null || [FIELD].Value==undefined || [FIELD].Value=='') && [FIELD].RequiredError" class="b-invlid-message ${field.Settings.RequiredMessageCssClass || ''}">${field.Settings.RequiredMessage}</p>` : '');
                layout = layout.replace(/\[FIELD-VALIDATION-MESSAGE\]/g, field.Settings.ValidationPattern && field.Settings.ValidationMessage ? `<p ng-show="[FIELD].Value!=undefined && [FIELD].Value!=null && [FIELD].Value!='' && [FIELD].IsPatternValidate && ![FIELD].IsValid" class="b-invlid-message ${field.Settings.ValidationMessageCssClass || ''}">${field.Settings.ValidationMessage}</p>` : '');

                this.parseFieldPanes(field, layout).then((data) => {
                    if (data && data.type == 0) {
                        layout = data.html;
                    } else if (data && data.type == 1) {
                        layout = layout.replace(/\[FIELDPANES(,attrs=(.[^\]]+))?\]/gm, data.html);
                    }
                    layout = layout.replace(/\[FIELD\]/g, "Field." + field.FieldName);
                    layout = layout.replace(/\[FIELDID\]/g, field.FieldID);
                    layout = layout.replace(/\[FIELDNAME\]/g, field.FieldName);
                    layout = layout.replace(/\[\[(.[^\[\]\{\}]+)\]\]/gm, field.FieldName);
                    layout = layout.replace(/\[FIELD-CLASSES\]/g, field.Settings && field.Settings.CssClass ? field.Settings.CssClass : "");

                    $defer.resolve(layout);
                });
            }).catch((err) => {
                $defer.resolve("");
            });
        } else {
            $defer.resolve("");
        }

        return $defer.promise;
    }

    parseFieldPanes(field, layout) {
        const $defer = this.$q.defer();

        var matches = layout.match(/\[FIELDPANES(,attrs=(.[^\]]+))?\]/gm);
        if (matches && matches.length) {
            _.forEach(matches, (m) => {
                const match = /^\[FIELDPANES(,attrs=(.[^\]]+))?\]$/gm.exec(m);

                this.$deferredBroadcast(this.$scope, `onGet${field.FieldType}FieldPanes`, { field: field, attrs: match[2], layout }).then((data) => {
                    $defer.resolve({ html: data.html, type: data.type != undefined ? data.type : 1 });
                });
            });
        }
        else {
            $defer.resolve({ type: 2 });
        }

        return $defer.promise;
    }

    getDefaultFieldLayoutTemplate(field) {
        const result =
            `<div data-field="${field.FieldName}" [FIELD-DISPLAY-EXPRESSION] class="${field.Settings.CssClass || ''}">
    #FIELDTEXT
        <label class="${field.Settings.FieldTextCssClass || ''}">[FIELD-TEXT]</label>
    #ENDFIELDTEXT
    [FIELD-COMPONENT]
    [FIELD-REQUIRED-MESSAGE]
    [FIELD-VALIDATION-MESSAGE]
    [FIELD-SUBTEXT]
</div>`;

        return result;
    }
}