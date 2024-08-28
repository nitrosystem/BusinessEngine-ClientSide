export class EventService {
    constructor($timeout, globalService) {
        "ngInject";

        this.$timeout = $timeout;
        this.globalService = globalService;
        this.registeredPublicEvents = [];
        this.methods = [];
    }

    register(eventType, callback, conditions, scope, logging, useCapture) {
        let keeper = scope ?? this;
        let lastEventType = eventType;
        let raised = false;

        if (!_.includes(keeper.registeredPublicEvents, eventType)) {
            document.addEventListener(eventType, ($event) => {
                if (lastEventType != eventType || !raised) {
                    this.raiseEvent($event, eventType, logging);

                    raised = true;
                    this.$timeout(() => { raised = false; });
                }

            }, useCapture || false);

            keeper.registeredPublicEvents.push(eventType);
        }

        this.methods.push({
            eventType: eventType,
            callback: callback,
            conditions: conditions
        });
    }

    register_Jquery($handler, eventType, callback, conditions, scope, logging) {
        let keeper = scope ?? this;

        if (!_.includes(keeper.registeredPublicEvents, eventType)) {
            $handler.bind(eventType, ($event) => {
                this.raiseEvent($event, callback, conditions, logging)
            });

            keeper.registeredPublicEvents.push(eventType);
        }
    }

    raiseEvent($event, eventType, logging) {
        _.filter(this.methods, (m) => { return m.eventType == eventType && this.parseConditions(m.conditions) }).map((method) => {
            try {
                let _this = this;
                method.callback.apply(_this, [$event]);
            } catch (error) {
                if (logging) console.error(error);
            }
        })
    }

    parseConditions(conditions) {
        let result = true;

        (conditions ?? []).forEach(condition => {
            if (!this.checkCondition(condition)) result = false;
        });

        return result;
    }

    checkCondition(condition) {
        if (condition.isPageParam) {
            var left = this.globalService.getParameterByName(condition.l);
            var right = condition.r;
        }
        else {
            left = _.get(condition._, condition.l);
            right = condition.r;
        }

        return _.isEqual(left, right);
    }
}
