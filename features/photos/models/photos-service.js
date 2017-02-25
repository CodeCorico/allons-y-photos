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

      this.addFilter = function(name, type) {
        var filters = _this.config('filters') || [];

        filters.push({
          type: type,
          name: name
        });

        _this.fire('addFilter', {
          name: name,
          type: type
        });

        _this.config('filters', filters);
      };

      this.removeFilter = function(name, type) {
        var filters = _this.config('filters') || [];

        for (var i = 0; i < filters.length; i++) {
          if (filters[i].name == name && filters[i].type == type) {
            filters.splice(i, 1);

            break;
          }
        }

        _this.fire('removeFilter', {
          name: name,
          type: type
        });

        _this.config('filters', filters);
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
