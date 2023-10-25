export function FieldDirective($timeout) {
    return {
        restrict: "A",
        link: (scope, element, attrs) => {
            $timeout(() => {
                try {
                    const field = scope.Field[attrs.field];
                    const fieldFunction = eval(`${field.FieldType}Controller`);
                    const fieldController = new fieldFunction(
                        field,
                        scope,
                        scope.moduleController,
                        element
                    );
                    if (typeof eval("fieldController.init") == "function") {
                        fieldController.init();
                        field.Inited = true;
                    }
                } catch (e) {
                    console.log(`Execption: ${e.message}`)
                }
            });
        },
        replace: true,
    };
}