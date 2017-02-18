(function() {
  'use strict';

  window.Ractive.controllerInjection('photos-nav', [
    '$PhotosService', '$component', '$data', '$done',
  function photosNavController(
    $PhotosService, $component, $data, $done
  ) {
    var PhotosNav = $component({
      data: $data
    });

    function _dates(args) {
      if (!args || !args.dates) {
        return;
      }

      var thisYear = new Date().getFullYear(),
          months = [],
          i = -1,
          lastMonth = null,
          lastDay = null;

      args.dates.forEach(function(date, index) {
        var dateId = window.moment(date.date).format('MMMM YYYY D'),
            date = dateId.split(' ');

        date[1] = date[1] == thisYear ? '' : date[1];
        date[0] = (date[0] + ' ' + date[1]).trim();

        if (lastMonth != date[0]) {
          lastMonth = date[0];
          lastDay = null;
          i++;

          months[i] = {
            title: lastMonth,
            days: []
          };
        }

        if (lastDay != date[2]) {
          lastDay = date[2];
          months[i].days.push({
            day: lastDay,
            id: dateId,
            index: index
          });
        }
      });

      PhotosNav.set('months', months);
    }

    function _dateAnchor(args) {
      PhotosNav.set('dateSelectedId', window.moment(args.date.date).format('MMMM YYYY D'));
    }

    $PhotosService.onSafe('photosNavController.dates', _dates);
    $PhotosService.onSafe('photosNavController.datesAnchor', _dateAnchor);

    PhotosNav.on('toAnchor', function(event) {
      $PhotosService.toAnchor(event.context.index);
    });

    $PhotosService.onSafe('photosNavController.teardown', function() {
      PhotosNav.teardown();
      PhotosNav = null;
    });

    PhotosNav.on('teardown', function() {
      setTimeout(function() {
        $PhotosService.offNamespace('photosNavController');
      });
    });

    PhotosNav.require().then(function() {
      if ($PhotosService.dates()) {
        _dates({
          dates: $PhotosService.dates()
        });
      }

      if ($PhotosService.dateAnchor()) {
        _dateAnchor({
          date: $PhotosService.dateAnchor()
        });
      }

      $done();
    });
  }]);

})();
