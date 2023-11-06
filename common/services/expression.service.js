import { GlobalSettings } from "../configs/global.settings";

export class ExpressionService {
    constructor($filter, globalService) {
        this.$filter = $filter;
        this.globalService = globalService;
    }

    checkConditions(conditions, $scope, ignoreVariables) {
        if (!conditions || !conditions.length) return true;

        var andResult = true;

        var groups = _.groupBy(conditions, "GroupName");
        for (var key in groups) {
            var orResult = false;
            _.forEach(groups[key], (c) => {
                const leftValue = this.parseExpression(
                    c.LeftExpression,
                    $scope,
                    "",
                    ignoreVariables
                );
                const rightValue = this.parseExpression(
                    c.RightExpression,
                    $scope,
                    "",
                    ignoreVariables
                );

                const compareResult = this.compareValues(
                    leftValue,
                    rightValue,
                    c.EvalType
                );

                if (!orResult && compareResult) orResult = true;
            });
            if (!orResult) {
                andResult = false;
                break;
            }
        }

        return andResult;
    }

    parseExpression(expression, $scope, expressionParsingType, ignoreVariables, parsedProperties, moreThanOneParse) {
        if (typeof expression != "string") return expression;

        var foundExpression = false;

        if (typeof expression == "string") {
            /*------------------------------------*/
            /* Parse Page Params  */
            /*------------------------------------*/
            matches = expression.match(/_PageParam.(\w+)/gim);
            _.forEach(matches, (m) => {
                const match = /^_PageParam.(\w+)$/gim.exec(m);
                const propertyPath = match[0];
                const paramName = match[1];
                const value = this.globalService.getParameterByName(paramName) || "";

                expression = expression.replace(propertyPath, value);

                foundExpression = true;
            });

            /*------------------------------------*/
            /* Parse Current UserID  */
            /*------------------------------------*/
            matches = expression.match(/^_CurrentUser.(\w+)$/gim);
            _.forEach(matches, (m) => {
                const match = /^_CurrentUser.(\w+)$/gim.exec(m);
                const propertyPath = match[0];
                const userInfoItem = match[1];
                const value = userInfoItem == "UserID" ? GlobalSettings.userID : "";

                expression = expression.replace(propertyPath, value);

                foundExpression = true;
            });
        }

        /*------------------------------------*/
        /* Parse Module Variables  */
        /*------------------------------------*/
        parsedProperties = parsedProperties || [];
        const variables = $scope.variables;
        var matches = expression.match(/(\w+)([\.\[].[^*+%\-\/\s()]*)?/gm);
        _.forEach(matches, (m) => {
            const match = /(\w+)([\.|\[]([^{},='"\-\&]+))?/gm.exec(m);
            const propertyPath = match[0];
            const variableName = match[1];

            if (parsedProperties.indexOf(propertyPath) >= 0) return; // ignore parsed variables or properies

            if (
                (ignoreVariables &&
                    (_.has($scope, variableName) || _.get($scope, variableName))) ||
                _.filter(variables, (v) => {
                    return v.VariableName == variableName;
                }).length
            ) {
                var value = _.get($scope, propertyPath);
                if (!expressionParsingType && (value === null || value === undefined))
                    value = "";

                if (typeof value == "object" && expression == propertyPath)
                    expression = value;
                else {
                    //const searchRegExp = new RegExp(propertyPath, "g"); // Throws SyntaxError
                    expression = expression.replace(propertyPath, value);
                }
                foundExpression = expression != propertyPath;

                parsedProperties.push(propertyPath);
            }
        });

        if ( /*!foundExpression && */ expressionParsingType == "get-value") {
            try {
                expression = eval(expression);
            } catch (e) {
                console.warn(e);
            }
        }

        return !moreThanOneParse ? expression :
            (foundExpression ?
                this.parseExpression(expression, $scope, expressionParsingType, ignoreVariables, parsedProperties, moreThanOneParse) : expression);
    }

    setVariableValue(expression, $scope, value) {
        const variables = $scope.variables;
        var matches = expression.match(/^(\w+)?\.?(.[^{}:\$,]+)?$/gim);
        _.forEach(matches, (m) => {
            const match = /^(\w+)?\.?(.[^{}:\$,]+)?$/gim.exec(m);
            const propertyPath = match[0];
            const variableName = match[1];

            if (
                _.filter(variables, (v) => {
                    return v.VariableName == variableName;
                }).length
            ) {
                _.set($scope, propertyPath, value);
            }
        });
    }

    compareValues(leftValue, rightValue, evalType) {
        var result = false;
        switch (evalType) {
            case "=":
                result = _.isEqual(leftValue, rightValue);
                break;
            case "!=":
                result = !_.isEqual(leftValue, rightValue);
                break;
            case "in":
                if (!_.isArray(rightValue)) result = _.isEqual(leftValue, rightValue);
                else result = _.some(rightValue, leftValue);
                break;
            case "not in":
                if (!_.isArray(rightValue)) result = !_.isEqual(leftValue, rightValue);
                else result = !_.some(rightValue, leftValue);
                break;
            case "like":
                result = _.includes(rightValue, leftValue);
                break;
            case "not like":
                result = !_.includes(rightValue, leftValue);
                break;
            case ">":
                if (moment(leftValue).isValid() && moment(rightValue).isValid())
                    result = moment(leftValue) > moment(rightValue);
                if (!isNaN(leftValue) && !isNaN(rightValue))
                    result = +leftValue > +rightValue;
                else result = leftValue > rightValue;
                break;
            case ">=":
                if (moment(leftValue).isValid() && moment(rightValue).isValid())
                    result = moment(leftValue) >= moment(rightValue);
                if (!isNaN(leftValue) && !isNaN(rightValue))
                    result = +leftValue >= +rightValue;
                else result = leftValue >= rightValue;
                break;
            case "<":
                if (moment(leftValue).isValid() && moment(rightValue).isValid())
                    result = moment(leftValue) < moment(rightValue);
                if (!isNaN(leftValue) && !isNaN(rightValue))
                    result = +leftValue < +rightValue;
                else result = leftValue < rightValue;
                break;
            case "<=":
                if (moment(leftValue).isValid() && moment(rightValue).isValid())
                    result = moment(leftValue) <= moment(rightValue);
                if (!isNaN(leftValue) && !isNaN(rightValue))
                    result = +leftValue <= +rightValue;
                else result = leftValue <= rightValue;
                break;
            case "isfilled":
                result = !_.isEmpty(leftValue);
                break;
            case "isnull":
                result = _.isEmpty(leftValue);
                break;
        }

        return result;
    }
}