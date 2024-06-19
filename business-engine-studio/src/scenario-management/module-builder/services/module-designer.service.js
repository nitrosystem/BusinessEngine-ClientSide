export class moduleDesignerService {
    constructor(
        $filter,
        $q,
        $compile,
        $timeout,
        apiService,
        notificationService
    ) {
        this.$filter = $filter;
        this.$q = $q;
        this.$compile = $compile;
        this.$timeout = $timeout;
        this.apiService = apiService;
        this.notifyService = notificationService;

        this.fieldLayoutTemplate;
        this.fieldsTemplate = {};
        this.fieldsScripts = {};
    }

    renderDesignForm(module, fields, $scope, actions) {
        const $defer = this.$q.defer();

        if (!module.Skin || !module.Template) {
            this.notifyService.notify(`
                the First step for creating your module,
                you must be select skin and template and theme for the module
            `);

            $defer.reject({ errorType: 'skin', msg: 'no any Skin set for the Module.' });

            return $defer.promise;
        }

        this.module = module;
        this.fields = fields;
        this.$scope = $scope;
        this.actions = actions;

        this.$board = $("<div></div>");

        _.forEach(this.fields, (f) => {
            f.AddedToPane = false;
        });

        this.panes = [];
        $(`<div>${module.LayoutTemplate}</div>`)
            .find("*[data-pane]")
            .each((index, element) => {
                var paneName = $(element).data("pane");
                var paneTitle = $(element).data("pane-title");
                this.panes.push({ paneName: paneName, paneTitle: paneTitle });

                this.$board.append(this.getBoardPane(paneName, paneTitle));
            });

        //This section removed. because when panes of fields not in layout template panes then them panes are not usable
        _.forEach(this.fields, (field) => {
            if (_.filter(this.panes, (p) => { return p.paneName == field.PaneName; }).length == 0)
                this.panes.push({
                    paneName: field.PaneName,
                    paneTitle: field.PaneName,
                    parentID: field.ParentID,
                });
        });

        this.buffer = [];
        _.forEach(this.panes, (p) => {
            this.buffer.push({ PaneName: p.paneName });
        });

        this.processBuffer($defer).then((data) => { $defer.resolve(data); });

        return $defer.promise;
    }

    processBuffer($defer) {
        if (!this.buffer.length) {
            this.completed().then((data) => { $defer.resolve(data); });
        } else {
            const currentPane = this.buffer[0];
            const $pane = this.$board.find('*[data-pane="' + currentPane.PaneName + '"]');

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
                } else {
                    if (!this.$board.find('*[data-pane="ContentPane"]').length)
                        this.$board.append(
                            this.getBoardPane("ContentPane", "Content Pane")
                        );

                    var findPane = _.filter(this.panes, (p) => {
                        return p.paneName == "ContentPane";
                    });

                    if (!findPane.length)
                        this.panes.push({
                            paneName: "ContentPane",
                            paneTitle: "Content Pane",
                        });

                    _.filter(this.fields, (f) => {
                        return f.PaneName == currentPane.PaneName;
                    }).map((f) => {
                        f.PaneName = "ContentPane";
                    });

                    this.buffer.push({ PaneName: "ContentPane" });
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
            var field = fields[index - 1];

            this.getFieldUI(field, this.$scope).then(($fieldItem) => {
                $pane.append($fieldItem);

                field.AddedToPane = true;

                this.parseField($defer, $pane, fields, index - 1);
            });
        }

        return $defer.promise;
    }

    completed() {
        const $defer = this.$q.defer();

        $defer.resolve({ $board: this.$board, panes: this.panes });

        return $defer.promise;
    }

    getFieldUI(field, $scope) {
        const $defer = this.$q.defer();

        const fieldTemplate = field.FieldTypeObject ? this.getBoardFieldItem(field) : this.getBoardEmptyField(field);
        const $fieldItem = this.$compile(fieldTemplate)($scope);
        this.$timeout(() => {
            if (!field.IsGroup) {
                $defer.resolve($fieldItem);
            } else {
                $($fieldItem)
                    .find("*[data-pane]")
                    .each((index, element) => {
                        const $pane = this.getBoardPane(
                            $(element).data("pane"),
                            $(element).data("pane-title"),
                            field.FieldID,
                            field.FieldName
                        );

                        $(element).replaceWith($pane);
                    });

                this.$timeout(() => $defer.resolve($fieldItem));
            }
        });

        return $defer.promise;
    }

    getBoardPane(paneName, paneTitle, fieldID, fieldName) {
        fieldName = fieldName || "";

        var _layout = `
          <div class="b-group board-pane"> 
            <div class="group-header" data-bs-toggle="collapse" data-bs-target="#grpPane${paneName}">
              <h3 class="group-label">
                  <span class="group-icon">
                      <i class="codicon codicon-server-process"></i>
                  </span>
                  ${paneTitle}
              </h3>
              <span class="group-collapse">
                  <i class="codicon codicon-chevron-up"></i>
              </span>
            </div>
            <div id="grpPane${paneName}" class="group-content collapse show">
              <div class="pane-body sortable-row" data-pane="${paneName}" data-parent-id="${fieldID}"></div> 
              <div class="pane pane-footer" field-drop="${paneName}" data-pane-title="${fieldName} ${paneTitle}" data-parent-id="${fieldID}"></div> 
            </div> 
          </div>`;

        return $(_layout);
    }

    getBoardFieldItem(field) {
        const result = `
      <div b-field="${field.FieldID}" >
        <div class="field-drag-panel" data-drop="true" jqyoui-droppable="{onOver:'$.onFieldDragOver()',onOut:'$.onFieldDragOut()',onDrop:'$.onFieldDrop($.field.${field.FieldName}.PaneName,$.field.${field.FieldName}.ParentID,$.field.${field.FieldName}.FieldID)'}"></div>
        <div data-field="${field.FieldName}" class="b-field-item" ng-class="{'active':$.currentField.FieldID=='${field.FieldID}','server-waiting':$.running=='refresh-field' || $.running=='save-field'}" ng-click="$.onFieldItemClick($event,'${field.FieldID}')" tabindex="-1" ng-blur="$.onFieldItemBlur($event)">
          <div class="d-flex field-toolbar" ng-if="$.currentField.FieldID=='${field.FieldID}'">
            <div class="progress opacity-100" ng-if="$.running=='refresh-field' || $.running=='save-field'" role="progressbar" aria-label="{{$.awaitAction.subtitle}}" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
              <p class="await-action-subtitle position-absolute w-100 text-center p-3 lh-1">({{$.awaitAction.subtitle}})</p>
              <div class="progress-bar"></div>
            </div>          
            <div class="col">
              <ul class="toolbar-items">
                <li class="toolbar-item">
                  <a class="field-settings-item" ng-click="$.onFieldSettingsClick($event)" role="button">
                    <i class="codicon codicon-gear"></i>
                  </a>
                </li>
                <li class="toolbar-item">
                  <a class="field-move handle" ng-click="$.onFieldSettingsClick($event)" role="button">
                    <i class="codicon codicon-move"></i>
                  </a>
                </li>
                <li class="toolbar-item">
                  <a class="field-settings-item" role="button" title="shift key + 🠅 arrow" b-custom-tooltip data-bs-placement="top" ng-click="$.onFieldSwap($event,'up')" role="button">
                    <i class="codicon codicon-arrow-up"></i>
                  </a>
                </li>
                <li class="toolbar-item">
                  <a class="field-settings-item" title="shift key + 🠛 arrow" b-custom-tooltip data-bs-placement="top" ng-click="$.onFieldSwap($event,'down')" role="button">
                    <i class="codicon codicon-arrow-down"></i>
                  </a>
                </li>
                <li class="toolbar-item">
                  <a class="field-settings-item" role="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                    <i class="codicon codicon-references"></i>
                  </a>
                  <ul class="dropdown-menu">
                    <li ng-repeat="pane in $.panes">
                      <a class="dropdown-item" href="#" ng-click="$.onFieldChangePaneClick(pane,$event)" ng-disabled="pane.paneName=='${field.PaneName}'">{{pane.paneTitle}}</a>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
            <div class="col">
              <ul class="toolbar-items d-flex justify-content-end">
               <li class="toolbar-item">
                  <button type="button" class="field-settings-item" ng-click="$.onRefreshFieldClick($event,'${field.FieldID}')" role="button">
                    <i class="codicon codicon-refresh"></i>
                  </button>
                </li>
               <li class="toolbar-item">
                  <button type="button" class="field-settings-item" ng-click="$.buildModule()" role="button">
                    <i class="codicon codicon-play"></i>
                  </button>
                </li>
                <li class="toolbar-item">
                  <button type="button" class="field-settings-item" ng-click="$.onSaveFieldClick($event)" role="button">
                    <i class="codicon codicon-save"></i>
                  </button>
                </li>
                <li class="toolbar-item">
                  <button type="button" class="field-settings-item" ng-click="$.onCancelEditFieldClick($event)" role="button">
                    <i class="codicon codicon-circle-slash"></i>
                  </button>
                </li>
                <li class="toolbar-item">
                  <button type="button" class="field-actions-item" ng-click="$.onShowFieldActionsClick($event)" role="button">
                    <i class="codicon codicon-github-action"></i>
                  </button>
                </li>
                <li class="toolbar-item">
                  <button type="button" class="field-settings-item" ng-click="$.onDeleteFieldClick($event)" role="button">
                    <i class="codicon codicon-trash"></i>
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div class="field-save-panel" ng-class="{'show':$.field.${field.FieldName}.isShowSavePanel,'shake':$.field.${field.FieldName}.shakeField}">
              <h5 class="mb-3">Save Field</h3>
              <p class="mb-3">For continue, you must first save this field</p>
              <div class="mb-2 d-flex justify-content-end mt-auto">
                  <button type="button" class="b-btn btn-submit me-2" ng-click="$.onSaveFieldClick($event)">
                    <i class="codicon codicon-save"></i>
                    Save
                  </button>
                  <button type="button" class="b-btn btn-cancel" ng-click="$.onCancelEditFieldClick($event)">
                    <i class="codicon codicon-circle-slash"></i>
                    Cancel
                  </button>
              </div>
          </div>      
          <div class="field-body">
            <div class="d-flex">
              <div class="col-6">
                <input type="text" ng-if="!$.field.${field.FieldName}.Settings.IsHideFieldText" class="b-input form-control b-input-edit text-start" b-custom-focus="onFocusField_${field.FieldName}"
                    ng-model="$.field.${field.FieldName}.FieldText" placeholder="Enter field name" autocomplete="off" />
              </div>
              <div class="col-3">
                <input type="text" class="b-input form-control b-input-edit text-start"
                    ng-model="$.field.${field.FieldName}.FieldName" placeholder="Enter field text" autocomplete="off" />
              </div>
              <div class="col-3">
                <span ng-if="$.currentField.FieldID!='${field.FieldID}'" class="d-flex justify-content-end mt-1 text-white-50">{{$.field.${field.FieldName}.FieldType}}</span>   
                <select ng-if="$.currentField.FieldID=='${field.FieldID}'"ng-model="$.field.${field.FieldName}.FieldType" class="b-input form-select"
                        ng-options="ft.FieldType as ft.Title for ft in $.fieldTypes" ng-change="$.onFieldTypeChange($event,'${field.FieldID}')"
                        placeholder-text-single="'Select field Type'">
                </select>
              </div>
            </div>
            <${field.FieldTypeObject.FieldComponent} field="$.field.${field.FieldName}" module-builder-controller="$" fields="$.fields" actions="$.actions" all-actions="$.allActions"></${field.FieldTypeObject.FieldComponent}>
            <div class="b-field mt-3" ng-if="$.field.${field.FieldName}.Actions && $.field.${field.FieldName}.Actions.length">
              <label class="form-label">Field Actions</label>
              <div ng-repeat="action in $.field.${field.FieldName}.Actions" role="button" ng-click="$.onEditFieldActionClick(action)">
                <div class="b-notify notify mb-3">
                    <i class="codicon codicon-github-action icon-sm"></i>
                    <div class="text">
                        <span class="subtext">{{action.ActionName}}</span>
                    </div>
                </div>
              </div>
            </div>            
            <div ng-if="$.field.${field.FieldName}.IsSelective">
              <div class="b-field mt-3" ng-if="$.field.${field.FieldName}.DataSource">
                <label class="form-label">Data Source</label>
                <div role="button" ng-click="$.onEditFieldDataSourceClick($event,'${field.FieldID}')">
                  <div class="b-notify notify mb-3">
                      <i class="codicon codicon-combine icon-sm"></i>
                      <div class="text">
                        <span class="subtext">
                            Type :
                            <label ng-if="$.field.${field.FieldName}.DataSource.Type==0">Standard(Static items)</label>
                            <label ng-if="$.field.${field.FieldName}.DataSource.Type==1">Use Defined List</label>
                            <label ng-if="$.field.${field.FieldName}.DataSource.Type==2">Data Source Service </label>
                        </span>
                      </div>
                  </div>
                </div>
              </div>
              <div class="b-field mt-3" ng-if="!$.field.${field.FieldName}.DataSource">
                <button type="button" class="b-btn btn-action" ng-click="$.onEditFieldDataSourceClick($event,'${field.FieldID}')">
                    <i class="codicon codicon-plus"></i>
                    Set Data Source
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
    `;
        return result;
    }

    getBoardEmptyField(field) {
        const result = `
    <div b-field="${field.FieldID}">
      <div class="field-drag-panel" data-drop="true" jqyoui-droppable="{onOver:'$.onFieldDragOver()',onOut:'$.onFieldDragOut()',onDrop:'$.onFieldDrop($.field.${field.FieldName}.PaneName,$.field.${field.FieldName}.ParentID,$.field.${field.FieldName}.FieldID)'}"></div>
      <div data-field="${field.FieldName}" class="b-field-item" ng-class="{'active':$.currentField.FieldID=='${field.FieldID}','server-waiting':$.running=='refresh-field' || $.running=='save-field'}" ng-click="$.onFieldItemClick($event,'${field.FieldID}')">
        <div class="d-flex field-toolbar" ng-if="$.currentField.FieldID=='${field.FieldID}'">
          <div class="progress opacity-100" ng-if="$.running=='refresh-field' || $.running=='save-field'" role="progressbar" aria-label="{{$.awaitAction.subtitle}}" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
            <p class="await-action-subtitle position-absolute w-100 text-center p-3 lh-1">({{$.awaitAction.subtitle}})</p>
            <div class="progress-bar"></div>
          </div>          
          <div class="col">
            <ul class="toolbar-items">
              <li class="toolbar-item">
                <a class="field-settings-item" ng-click="$.onFieldSettingsClick($event)" role="button">
                  <i class="codicon codicon-gear"></i>
                </a>
              </li>
              <li class="toolbar-item">
                <a class="field-move handle" ng-click="$.onFieldSettingsClick($event)" role="button">
                  <i class="codicon codicon-move"></i>
                </a>
              </li>
              <li class="toolbar-item">
                <a class="field-settings-item" title="shift key + 🠅 arrow" b-custom-tooltip data-bs-placement="top" ng-click="$.onFieldSwap($event,'up')" role="button">
                  <i class="codicon codicon-arrow-up"></i>
                </a>
              </li>
              <li class="toolbar-item">
                <a class="field-settings-item" title="shift key + 🠛 arrow" b-custom-tooltip data-bs-placement="top" ng-click="$.onFieldSwap($event,'down')" role="button">
                  <i class="codicon codicon-arrow-down"></i>
                </a>
              </li>
              <li class="toolbar-item">
                <a class="field-settings-item" role="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                  <i class="codicon codicon-references"></i>
                </a>
                <ul class="dropdown-menu">
                  <li ng-repeat="pane in $.panes">
                    <a class="dropdown-item" href="#" ng-click="$.onFieldChangePaneClick(pane,$event)" ng-disabled="pane.paneName=='${field.PaneName}'">{{pane.paneTitle}}</a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
          <div class="col">
            <ul class="toolbar-items d-flex justify-content-end">
             <li class="toolbar-item">
                <button type="button" class="field-settings-item" ng-click="$.onRefreshFieldClick($event,'${field.FieldID}')" role="button">
                  <i class="codicon codicon-refresh"></i>
                </button>
              </li>
             <li class="toolbar-item">
                <button type="button" class="field-settings-item" ng-click="$.onBuildModuleClick(false)" role="button">
                  <i class="codicon codicon-play"></i>
                </button>
              </li>
              <li class="toolbar-item">
                <button type="button" class="field-settings-item" ng-click="$.onSaveFieldClick($event)" role="button">
                  <i class="codicon codicon-save"></i>
                </button>
              </li>
              <li class="toolbar-item">
                <button type="button" class="field-settings-item" ng-click="$.onCancelEditFieldClick($event)" role="button">
                  <i class="codicon codicon-circle-slash"></i>
                </button>
              </li>
              <li class="toolbar-item">
                <button type="button" class="field-actions-item" ng-click="$.onShowFieldActionsClick($event)" role="button">
                  <i class="codicon codicon-github-action"></i>
                </button>
              </li>
              <li class="toolbar-item">
                <button type="button" class="field-settings-item" ng-click="$.onDeleteFieldClick($event)" role="button">
                  <i class="codicon codicon-trash"></i>
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div class="field-save-panel" ng-class="{'show':$.field.${field.FieldName}.isShowSavePanel,'shake':$.field.${field.FieldName}.shakeField}">
          <h5 class="mb-3">Save Field</h3>
          <p class="mb-3">For continue, you must first save this field</p>
          <div class="mb-2 d-flex justify-content-end mt-auto">
            <button type="button" class="b-btn btn-submit me-2" ng-click="$.onSaveFieldClick($event)">
              <i class="codicon codicon-save"></i>
              Save
            </button>
            <button type="button" class="b-btn btn-cancel" ng-click="$.onCancelEditFieldClick($event)">
              <i class="codicon codicon-circle-slash"></i>
              Cancel
            </button>
          </div>
        </div>      
        <div class="field-body">
          <div class="d-flex">
            <div class="col-6">
              <input type="text" ng-if="!$.field.${field.FieldName}.Settings.IsHideFieldText" class="b-input form-control b-input-edit text-start" b-custom-focus="onFocusField_${field.FieldName}"
                  ng-model="$.field.${field.FieldName}.FieldText" placeholder="Enter field name" autocomplete="off" />
            </div>
            <div class="col-3">
              <input type="text" class="b-input form-control b-input-edit text-start"
                  ng-model="$.field.${field.FieldName}.FieldName" placeholder="Enter field text" autocomplete="off" />
            </div>
            <div class="col-3">
              <span ng-if="$.currentField.FieldID!='${field.FieldID}'" class="d-flex justify-content-end mt-1 text-white-50">{{$.field.${field.FieldName}.FieldType}}</span>   
              <select ng-if="$.currentField.FieldID=='${field.FieldID}'"ng-model="$.field.${field.FieldName}.FieldType" class="b-input form-select"
                ng-options="ft.FieldType as ft.Title for ft in $.fieldTypes" ng-change="$.onFieldTypeChange($event,'${field.FieldID}')"
                placeholder-text-single="'Select field Type'">
              </select>
            </div>
          </div>
          <div class="b-field mt-3" ng-if="$.field.${field.FieldName}.Actions && $.field.${field.FieldName}.Actions.length">
            <label class="form-label">Field Actions</label>
            <div ng-repeat="action in $.field.${field.FieldName}.Actions" role="button" ng-click="$.onEditFieldActionClick(action)">
              <div class="b-notify notify mb-3">
                  <i class="codicon codicon-github-action icon-sm"></i>
                  <div class="text">
                      <span class="subtext">
                          {{action.ActionName}}
                      </span>
                  </div>
              </div>
            </div>
          </div>            
          <div class="b-field mt-3" ng-if="$.field.${field.FieldName}.DataSource">
            <label class="form-label">Data Source</label>
            <div role="button" ng-click="$.onEditFieldDataSourceClick($event,'${field.FieldID}')">
              <div class="b-notify notify mb-3">
                  <i class="codicon codicon-combine icon-sm"></i>
                  <div class="text">
                      <span class="subtext">
                          Type :
                          <label ng-if="$.field.${field.FieldName}.DataSource.Type==0">Standard(Static items)</label>
                          <label ng-if="$.field.${field.FieldName}.DataSource.Type==1">Use Defined List</label>
                          <label ng-if="$.field.${field.FieldName}.DataSource.Type==2">Data Source Service </label>
                      </span>
                  </div>
              </div>
            </div>
          </div>
          <div class="b-field mt-3" ng-if="$.field.${field.FieldName}.IsSelective && !$.field.${field.FieldName}.DataSource">
              <button type="button" class="b-btn btn-action" ng-click="$.onEditFieldDataSourceClick($event,'${field.FieldID}')">
                  <i class="codicon codicon-plus"></i>
                  Set Data Source
              </button>
          </div>
        </div>
      </div>
  </div>
  `;

        return result;
    }
}