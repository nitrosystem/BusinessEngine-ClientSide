export class NotificationService {
  constructor($rootScope, $compile, $sce, $timeout) {
    "ngInject";

    this.$rootScope = $rootScope;
    this.$compile = $compile;
    this.$sce = $sce;
    this.$timeout = $timeout;

    this.options = {
      delay: 5000,
    };

    this.template = `
    <div class="notification-item">
        <div class="b-notification-toast">
            <div class="notify-container">
                <div class="notify-icon">
                    <i class="codicon codicon-{{icon}}"></i>
                </div>
                <div class="notify-text-wrapper">
                    <p ng-if="notify.title" class="notify-title" ng-bind-html="notify.title"></p>
                    <p class="notify-text" ng-bind-html="text"></p>
                    <span ng-if="notify.subtext" class="notify-subtext" ng-bind-html="notify.subtext"></p>
                </div>
                <span class="notify-close" ng-click="notify.isActive=false">
                    <i class="codicon codicon-close"></i>
                </span>
                <div class="notify-actions"></div>
            </div>
            <div class="notify-progress-bar" ng-class="{'is-started':notify.isVisible}"></div>
        </div>
    </div>
    `;
  }

  subscribe($scope, options, callback) {
    this.options = { ...this.options, ...options };

    this.$scope = $scope ? $scope : this.$rootScope;

    if (callback) {
      var handler = this.$rootScope.$on("notifying-service-event", callback);
      this.$scope.$on("$destroy", handler);
    }
  }

  notify(message, icon, code) {
    this.message = message;
    this.icon = icon;
    this.code = code;

    if (code) this.$rootScope.$emit("notifying-service-event", this);

    const notify = {
      icon: this.icon,
      text: this.message,
    };

    var scope = this.$rootScope.$new();
    scope.text = this.$sce.trustAsHtml(this.message);
    scope.icon = this.icon;
    var $notificationElement = this.$compile(this.template)(scope);
    $("#bNotifications").append($notificationElement);

    this.$timeout(() => {
      $notificationElement.addClass("is-visible");
    }, 500);

    this.$timeout(() => {
      $notificationElement.removeClass("is-visible");

      this.$timeout(() => {
        $notificationElement.remove();
      }, 1000);
    }, this.options.delay);
  }

  success(message) {
    this.notify(message, "check-all");
  }

  error(message) {
    this.notify(message, "warning");
  }
}
