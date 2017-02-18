module.exports = function() {
  'use strict';

  DependencyInjection.service('$PhotosService', [
    '$AbstractService',
  function($AbstractService) {

    return new (function $PhotosService() {

      $AbstractService.call(this);

      var _this = this,
          _dates = null,
          _photos = null,
          _dateAnchor = null;

      this.dates = function(dates) {
        if (typeof dates != 'undefined') {
          _dates = dates;

          _this.fire('dates', {
            dates: _dates
          });

          return _this;
        }

        return _dates;
      };

      this.photos = function(photos) {
        if (typeof photos != 'undefined') {
          _photos = photos;

          _this.fire('photos', {
            photos: _photos
          });

          return _this;
        }

        return _photos;
      };

      this.dateAnchor = function(date) {
        if (typeof date != 'undefined') {
          _dateAnchor = date;

          _this.fire('datesAnchor', {
            date: _dateAnchor
          });

          return _this;
        }

        return _dateAnchor;
      };

      this.toAnchor = function(index) {
        _this.fire('toAnchor', {
          index: index
        });
      };

      this.onSafe('$WebMetricsService.teardown', function() {
        _dates = null;
        _dateAnchor = null;
        _photos = null;
      });

    })();

  }]);

};
