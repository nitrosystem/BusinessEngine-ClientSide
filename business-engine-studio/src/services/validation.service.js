import $ from "jquery";

export class ValidationService {
    constructor($rootScope) {
        //Verification flag, when it is true, it means that the verification plan is passed, and when it is false, it means that the verification failed
        this.valid = false;
        //Verification prompt, if the verification fails, the default value is the prompt message of the first field, which is convenient for mobile terminal Toast to verify the interactive scheme
        this.tip = "";
        //Initial flag, true means that the scheme has never been validated, that is, the validator method has never been called
        this.pristine = true;
        //Error prompt set, all the fields that failed validation and the corresponding prompt information will be added to this object
        this.error = {};
    }

    /**
     * Internal default validation rules
     * @static
     */
    static ruleType = {
        number: /^(-?\d+)(.\d+)?$/,
        email: /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
        url: /^(\w+:\/\/)?\w+(\.\w+)+.*$/,
        name: /^[\u4E00-\u9FA5]+(·| |.)?[\u4e00-\u9fa5]+$/,
        phone: /^1[0-9]{10}$/,
        bank: /^[0-9]{16,19}$/,
        guid: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
        postcode: /^[0-9]{6}$/,
        password: /(?!^[0-9]{6,12}$)(?!^[a-z]{6,12}$)(?!^[A-Z]{6,12}$)^[0-9A-Za-z]{6,12}$/,
        idcard: (value) => {
            if (!/^\d{17}([0-9]|X|x)$/.test(value)) return false;
            const Wi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2, 1]; // Weighting factor;
            const valideCode = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2]; // ID verification place value, 10 represents X;
            const a_idCard = value.split(""); // Get the ID array
            let code = a_idCard.pop();
            if (code.toLowerCase() === "x") code = 10; // Replace the verification code whose last digit is x with 10 to facilitate subsequent operations
            const sum = a_idCard.reduce(
                (pre, current, key) => pre + Wi[key] * current,
                0
            ); // Weighted sum
            return parseInt(code, 10) === valideCode[sum % 11];
        },
    };

    /**
     * Extend the default validation rules, the default validation rules cannot be overwritten
     * @static
     * @function
     * @param {Object} ruleObj - Customize extended validation rules
     */
    static addRule(ruleObj) {
        ValidationService.ruleType = {...ruleObj, ...ValidationService.ruleType };
    }

    /**
     * Extend the default validation rules, the default validation rules cannot be overwritten
     * @function
     * @param {Object} scheme - Verification plan
     * @param {String|Function|Array} scheme[].rule - Validation rules
     * @param {Number} scheme[].id=html element id
     * @param {Boolean} scheme[].required=true - Is it required, the default is true
     * @param {String} scheme[].nullTip=The data cannot be empty-an empty prompt when the verification is empty
     * @param {String} scheme[].errorTip=Please fill in the correct information-an error message when the verification fails
     * @param {Boolean} watchModel - Verification plan
     * @param {Object} $scope - Verification plan
     * @param {String} modelName - Verification plan
     *
     */
    init(scheme = {}, watchModel, $scope, modelName, focusOnElement = true) {
        var form = new ValidationService();
        form.scheme = scheme;
        form.focusOnElement = focusOnElement;
        form.$scope = $scope;

        if (watchModel) {
            $scope.$watch(
                modelName,
                function(newVal, oldVal) {
                    if (form.validated && newVal !== oldVal) form.validator(newVal, true);
                },
                true
            );
        }

        return form;
    }

    /**
     * The main verification method is to verify the current calling field, if it fails, set the corresponding prompt message
     * @function
     * @param {String|Function|Array} rule - Current validation rules
     * @param {String} key - The currently validated field name
     * @param {Object} values - All key-value objects that receive verification (used for custom methods to complete the more complex verification logic)
     * @returns {Boolean} - Returns the result of the current verification. True means verification passed, false means verification failed
     */
    check(rule, key, values) {
        const type = Object.prototype.toString.call(rule);
        if (type === "[object Array]") {
            return rule.every((item) => this.check(item, key, values));
        }
        const ruleType = ValidationService.ruleType[rule] || rule;
        const _check = (ruleType.test && ruleType.test.bind(ruleType)) || ruleType;
        if (typeof _check !== "function") {
            throw new TypeError(`${_check} not in default rules and custom rules`);
        }
        const flag = _check(_.get(values, key), values, key);
        //Error prompt can be the string returned by the method, initialization definition or default
        if (typeof flag === "string") {
            _.set(this.error, key, flag);
        } else if (!flag) {
            _.set(
                this.error,
                key,
                this.scheme[key].errorTip || "Please fill in the correct information"
            );
        }
        return flag === true;
    }

    /**
     * Receive key-value objects that need to be verified, and then verify in turn with a more defined scheme
     * @function
     * @param {Object} values - The field value that needs to be verified will be matched with the previously defined verification plan for corresponding verification
     * @returns {Object} error - Return the prompt message of the corresponding field that failed the verification according to the verification plan
     */
    validator = (values, disableFocus) => {
        const { scheme } = this;
        this.pristine = false;
        this.tip = "";
        this.error = {};

        var firstElementID = "";
        Object.keys(scheme).forEach((key) => {
            const { rule, nullTip = "Data cannot be empty", required } = scheme[key];
            //When the value is not empty, verify that the value satisfies the rules, otherwise if required is true, a non-empty prompt will be performed
            const value = _.get(values, key);
            if ((value !== void 0 && value !== null) || typeof rule == "function") {
                rule !== void 0 && this.check(rule, key, values);
            } else {
                required && _.set(this.error, key, nullTip);
            }

            if (_.get(this.error, key) && !firstElementID && scheme[key].id)
                firstElementID = scheme[key].id;
        });

        const _error = Object.values(this.error);

        this.valid = !(_error.length > 0) || (([this.tip] = _error) && false);

        if (!disableFocus && this.focusOnElement && !this.valid && firstElementID) {
            if ($("#" + firstElementID).is(":hidden")) {
                $("#" + firstElementID).addClass("b-hide-elem");
                $("#" + firstElementID).focus();
                setTimeout(() => {
                    $("#" + firstElementID).removeClass("b-hide-elem");
                });
            } else $("#" + firstElementID).focus();
        }

        this.validated = true;

        return this.error;
    };
}