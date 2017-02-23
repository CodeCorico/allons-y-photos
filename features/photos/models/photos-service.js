module.exports = function() {
  'use strict';

  DependencyInjection.service('$PhotosService', [
    '$AbstractService',
  function($AbstractService) {

    return new (function $PhotosService() {

      $AbstractService.call(this);

      var _this = this;

      this.toggleSelectionMode = function() {
        _this.config('selectionModeActivated', !_this.config('selectionModeActivated'));
      };

      this.onSafe('$WebMetricsService.teardown', function() {
        var config = _this.config();

        Object.keys(config).forEach(function(key) {
          delete config[key];
        });
      });

    })();

  }]);

};
