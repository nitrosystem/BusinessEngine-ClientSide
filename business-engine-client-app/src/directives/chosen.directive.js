import angular from "angular";
import "chosen-js/chosen.jquery";

(function (angular) {
  var AngularChosen = angular.module("localytics.directives", []);

  function chosen($timeout, $parse, $rootScope) {
    var EVENTS, scope, linker, watchCollection;

    /*
     * List of events and the alias used for binding with angularJS
     */
    EVENTS = [
      {
        onChange: "change",
      },
      {
        onReady: "chosen:ready",
      },
      {
        onMaxSelected: "chosen:maxselected",
      },
      {
        onShowDropdown: "chosen:showing_dropdown",
      },
      {
        onHideDropdown: "chosen:hiding_dropdown",
      },
      {
        onNoResult: "chosen:no_results",
      },
    ];

    /*
     * Items to be added in the scope of the directive
     */
    scope = {
      options: "=", // the options array
      ngModel: "=", // the model to bind to,,
      ngDisabled: "=",
    };

    /*
     * initialize the list of items
     * to watch to trigger the chosen:updated event
     */
    watchCollection = [];
    Object.keys(scope).forEach(function (scopeName) {
      watchCollection.push(scopeName);
    });

    /*
     * Add the list of event handler of the chosen
     * in the scope.
     */
    EVENTS.forEach(function (event) {
      var eventNameAlias = Object.keys(event)[0];
      scope[eventNameAlias] = "=";
    });

    /* Linker for the directive */
    linker = function ($scope, iElm, iAttr, ctrls) {
      var maxSelection = parseInt(iAttr.maxSelection, 10),
        searchThreshold = parseInt(iAttr.searchThreshold, 10);

      if (isNaN(maxSelection) || maxSelection === Infinity) {
        maxSelection = undefined;
      }

      if (isNaN(searchThreshold) || searchThreshold === Infinity) {
        searchThreshold = undefined;
      }

      var ngSelect = ctrls[0];
      var ngModel = ctrls[1];

      var allowSingleDeselect =
        $(iElm).attr("allow-single-deselect") !== undefined ? true : false;
      var noResultsText =
        $(iElm).attr("no-results-text") !== undefined
          ? iAttr.noResultsText
          : "No results found.";
      var disableSearch =
        $(iElm).attr("disable-search") !== undefined
          ? JSON.parse(iAttr.disableSearch)
          : false;
      var placeholderTextSingle = iAttr.placeholderTextSingle;
      var placeholderTextMultiple = iAttr.placeholderTextMultiple;
      var displayDisabledOptions =
        $(iElm).attr("display-disabled-options") !== undefined
          ? JSON.parse(iAttr.displayDisabledOptions)
          : true;
      var displaySelectedOptions =
        $(iElm).attr("display-selected-options") !== undefined
          ? JSON.parse(iAttr.displaySelectedOptions)
          : true;

      $timeout(function () {
        $(iElm).chosen({
          width: "100%",
          max_selected_options: maxSelection,
          disable_search_threshold: searchThreshold,
          search_contains: true,
          allow_single_deselect: allowSingleDeselect,
          no_results_text: noResultsText,
          disable_search: disableSearch,
          placeholder_text_single: placeholderTextSingle,
          placeholder_text_multiple: placeholderTextMultiple,
          display_disabled_options: displayDisabledOptions,
          display_selected_options: displaySelectedOptions,
          inherit_select_classes: true,
        });

        $(iElm).on("change", function () {
          var val = ngSelect.readValue();
          ngModel.$setViewValue(val);

          $(iElm).trigger("chosen:updated");
        });

        $scope.$watchGroup(watchCollection, function (newVal, oldVal) {
          $timeout(function () {
            $(iElm).trigger("chosen:updated");
          }, 100);
        });
      });
    };

    // return the directive
    return {
      name: "chosen",
      scope: scope,
      restrict: "A",
      require: ["select", "?ngModel"],
      link: linker,
    };
  }
  AngularChosen.directive("chosen", [
    "$timeout",
    "$parse",
    "$rootScope",
    chosen,
  ]);
})(angular);
