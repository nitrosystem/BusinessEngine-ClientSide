import { GlobalSettings } from "../../configs/global.settings";

export class CreateViewModelController {
    constructor(
        $scope,
        $rootScope,
        studioService,
        $timeout,
        globalService,
        apiService,
        validationService,
        notificationService
    ) {
        "ngInject";

        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$timeout = $timeout;
        this.globalService = globalService;
        this.apiService = apiService;
        this.validationService = validationService;
        this.notifyService = notificationService;

        this.propertyTypes = [{
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

        studioService.setFocusModuleDelegate(this, this.onFocusModule);

        this.onPageLoad();
    }

    onPageLoad() {
        const id = this.globalService.getParameterByName("id");

        this.running = "get-viewModel";
        this.awaitAction = {
            title: "Loading ViewModel",
            subtitle: "Just a moment for loading view model...",
        };

        this.apiService
            .get("Studio", "GetViewModel", { viewModelID: id || null })
            .then(
                (data) => {
                    this.viewModel = data.ViewModel;
                    this.scenarios = data.Scenarios;
                    this.viewModels = data.ViewModels;

                    if (!this.viewModel) {
                        this.viewModel = {
                            ScenarioID: GlobalSettings.scenarioID,
                        };

                        this.onScenarioChange();
                    } else {
                        this.$scope.$emit("onUpdateCurrentTab", {
                            id: this.viewModel.ViewModelID,
                            title: this.viewModel.ViewModelName,
                        });
                    }

                    this.onFocusModule();

                    delete this.running;
                    delete this.awaitAction;
                },
                (error) => {
                    this.awaitAction.isError = true;
                    this.awaitAction.subtitle = error.statusText;
                    this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                    this.notifyService.error(error.data.Message);

                    delete this.running;
                }
            );

        this.setForm();
    }

    onFocusModule() {
        this.$rootScope.explorerExpandedItems.push(
            ...["view-models", "create-view-model"]
        );
        this.$rootScope.explorerCurrentItem = !this.viewModel || !this.viewModel.ViewModelID ?
            "create-view-model" :
            this.viewModel.ViewModelID;
    }

    setForm() {
        this.form = this.validationService.init({
                ScenarioID: {
                    rule: "guid",
                    id: "drpScenarioID",
                    required: true,
                },
                ViewModelName: {
                    id: "txtViewModelName",
                    required: true,
                },
                Properties: {
                    rule: (value) => {
                        if (value && value.length >= 1) return true;

                        return "View Model must have properties";
                    },
                    required: true,
                },
            },
            true,
            this.$scope,
            "$.viewModel"
        );

        this.propertyForm = this.validationService.init({
            PropertyName: {
                id: "txtPropertyName",
                required: true,
            },
            PropertyType: {
                id: "drpPropertyType",
                required: true,
            },
            PropertyTypeID: {
                rule: (value) => {
                    if (
                        (this.property.PropertyType == "viewModel" ||
                            this.property.PropertyType == "listOfViewModel") &&
                        !value
                    ) {
                        return "Select a view model for property type";
                    } else return true;
                },
                id: "drpPropertyTypeID",
            },
        });
    }

    onScenarioChange() {
        this.apiService
            .get("Studio", "GetViewModels", { scenarioID: this.viewModel.ScenarioID })
            .then((data) => {
                this.viewModels = data.ViewModels;
            });
    }

    /*------------------------------------
           ViewModel Property
          ------------------------------------*/
    onAddPropertyClick() {
        if (this.property) return;

        this.viewModel.Properties = this.viewModel.Properties || [];

        const propertyIndex = this.viewModel.Properties.length;
        const property = {
            IsEdited: true,
            IsNew: true,
            AllowNulls: true,
            ViewOrder: propertyIndex + 1,
        };

        this.viewModel.Properties.push(property);

        this.property = _.clone(property);

        this.propertyIndex = propertyIndex;

        this.focusPropertyForm();
    }

    onRowItemClick(property, index) {
        if (this.property) return;

        property.IsEdited = true;

        this.property = _.clone(property);
        this.property.IsNew = false;

        this.propertyIndex = index;

        this.focusPropertyForm();
    }

    focusPropertyForm() {
        this.$timeout(() => {
            this.$scope.$broadcast("onEditProperty");
        });
    }

    onPropertySwapClick(index, swappedIndex) {
        const properties = this.viewModel.Properties;

        if (swappedIndex > -1 && swappedIndex < properties.length) {
            [properties[index], properties[swappedIndex]] = [
                properties[swappedIndex],
                properties[index],
            ];

            properties.map(
                (c) => (c.ViewOrder = this.viewModel.Properties.indexOf(c) + 1)
            );
        }
    }

    onSavePropertyClick() {
        this.propertyForm.validated = true;
        this.propertyForm.validator(this.property);
        if (this.propertyForm.valid) {
            this.property.IsEdited = false;
            this.viewModel.Properties[this.propertyIndex] = _.clone(this.property);

            delete this.property;
            delete this.propertyIndex;
        }
    }

    onCancelPropertyClick() {
        if (this.property.IsNew)
            this.viewModel.Properties.splice(this.propertyIndex, 1);
        else this.viewModel.Properties[this.propertyIndex].IsEdited = false;

        delete this.property;
        delete this.propertyIndex;
    }

    onSaveViewModelClick() {
        this.form.validated = true;
        this.form.validator(this.viewModel);

        if (this.form.valid) {
            this.running = "save-viewModel";
            this.awaitAction = {
                title: "Creating ViewModel",
                subtitle: "Just a moment for creating viewModel...",
            };

            this.currentTabKey = this.$rootScope.currentTab.key;

            this.apiService.post("Studio", "SaveViewModel", this.viewModel).then((data) => {
                    this.viewModel = data;

                    this.notifyService.success("ViewModel updated has been successfully");

                    this.$scope.$emit("onUpdateCurrentTab", {
                        id: this.viewModel.ViewModelID,
                        title: this.viewModel.ViewModelName,
                        key: this.currentTabKey,
                    });

                    this.$rootScope.refreshSidebarExplorerItems();

                    delete this.awaitAction;
                    delete this.running;
                },
                (error) => {
                    this.awaitAction.isError = true;
                    this.awaitAction.subtitle = error.statusText;
                    this.awaitAction.desc = this.globalService.getErrorHtmlFormat(error);

                    if (error.data.HResult == "-2146232060")
                        this.notifyService.error(
                            `ViewModel name must be unique.${this.viewModel.ViewModelName} is already in the scenario viewModels`
                        );
                    else if (error.data.HResult == "-2146233088")
                        this.notifyService.error(
                            `Table name must be unique.${this.viewModel.TableName} is already in the database`
                        );
                    else this.notifyService.error(error.data.Message);

                    delete this.running;
                }
            );
        }
    }

    onDeleteViewModelClick() {
        swal({
            title: "Are you sure?",
            text: "Once deleted, you will not be able to recover this imaginary view model!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                this.running = "get-viewModels";
                this.awaitAction = {
                    title: "Remove ViewModel",
                    subtitle: "Just a moment for removing viewModel...",
                };

                this.apiService.post("Studio", "DeleteViewModel", { ID: this.viewModel.ViewModelID }).then(
                    (data) => {
                        this.notifyService.success(
                            "ViewModel deleted has been successfully"
                        );

                        this.onCloseWindow();

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

    onCloseWindow() {
        this.$scope.$emit('onCloseModule');
    }

}