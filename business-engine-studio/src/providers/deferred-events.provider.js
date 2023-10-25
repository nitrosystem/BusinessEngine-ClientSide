export class DeferredEvent {
  $get($q) {
    /**
     *  @param type String - 'broadcast' | 'emit'
     *  @param $scope Scope
     *  @param eventName String - name of the event
     */
    return function $deferredEvent(type, $scope, eventName) {
      var task = {
        queue: [],
        promise: $q.when(),
        /**
         * Promise will be executed after all previous promisses passed
         */
        wait: function () {
          return this.queuePromise(
            this.promise.then.apply(this.promise, arguments)
          );
        },
        /**
         * Promise will be executed immediately
         */
        queuePromise: function queuePromise(promise) {
          if (promise === this.promise) {
            throw new Error("Can't wait for own promise");
          }
          // Execute promise
          promise = $q.when(promise);
          // Add the promise result to the queue
          this.promise = this.promise.then(function () {
            return promise;
          });
          return this.promise;
        },
      };
      var args = Array.prototype.slice.call(arguments, 3);
      var emitArgs = [eventName, task].concat(args);
      var event = $scope["$" + type].apply($scope, emitArgs);
      return task.promise
        .then(function (result) {
          return $q.all({ queue: task.queue, result: result });
        })
        .then(
          function (data) {
            var failed = data.queue.some(function (val) {
              return val === false;
            });
            return failed ? $q.reject(data.result) : data.result;
          },
          function (error) {
            return $q.reject(error);
          }
        );
    };
  }
}

export class DeferredEmit {
  $get($deferredEvent) {
    return function $deferredEmit($scope, eventName) {
      return $deferredEvent.apply(
        this,
        ["emit", $scope, eventName].concat(
          Array.prototype.slice.call(arguments, 2)
        )
      );
    };
  }
}

export class DeferredBroadcast {
  $get($deferredEvent) {
    return function $deferredBroadcast($scope, eventName) {
      return $deferredEvent.apply(
        this,
        ["broadcast", $scope, eventName].concat(
          Array.prototype.slice.call(arguments, 2)
        )
      );
    };
  }
}
