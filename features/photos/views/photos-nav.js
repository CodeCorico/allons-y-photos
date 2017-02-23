(function() {
  'use strict';

  window.Ractive.controllerInjection('photos-nav', [
    '$PhotosService', '$Layout', '$component', '$data', '$done',
  function photosNavController(
    $PhotosService, $Layout, $component, $data, $done
  ) {
    var PhotosNav = $component({
      data: $.extend(true, {
        photosLength: 0,
        videosLength: 0,
        moments: [],
        isMomentSelected: false
      }, $data)
    });

    function _closeOnNotDesktop() {
      $Layout.closeOnNotDesktop('group-photos-nav');
    }

    function _dates(args, deferred) {
      if (!args || !args.value) {
        return;
      }

      if (!deferred) {
        return setTimeout(function() {
          if (!PhotosNav) {
            return;
          }

          _dates(args, true);
        });
      }

      var thisYear = new Date().getFullYear(),
          months = [],
          i = -1,
          lastMonth = null,
          lastDay = null;

      args.value.forEach(function(date, index) {
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

      if (args.value.length) {
        _dateAnchor({
          value: args.value[0]
        });
      }
    }

    $PhotosService.onSafe('photosNavController.datesConfigChanged', _dates);

    function _moments(args) {
      PhotosNav.set('moments', args.value);
    }

    $PhotosService.onSafe('photosNavController.momentsConfigChanged', _moments);

    function _dateAnchor(args) {
      PhotosNav.set('dateSelectedId', window.moment(args.value.date).format('MMMM YYYY D'));
    }

    $PhotosService.onSafe('photosNavController.dateAnchorConfigChanged', _dateAnchor);

    function _lengths(args) {
      PhotosNav.set('photosLength', args.value.photosLength);
      PhotosNav.set('videosLength', args.value.videosLength);
    }

    $PhotosService.onSafe('photosNavController.lengthsConfigChanged', _lengths);

    function _momentSelected(args) {
      var moments = PhotosNav.get('moments');

      args.value = args.value || '';

      for (var i = 0; i < moments.length; i++) {
        if (moments[i].title == args.value) {
          PhotosNav.set('moments.' + i + '.selected', true);
        }
        else if (moments[i].selected) {
          PhotosNav.set('moments.' + i + '.selected', false);
        }
      }
    }

    $PhotosService.onSafe('photosNavController.momentSelectedConfigChanged', _momentSelected);

    PhotosNav.on('toAnchor', function(event) {
      _closeOnNotDesktop();

      $PhotosService.config('anchor', event.context.index);
    });

    $PhotosService.onSafe('photosNavController.teardown', function() {
      PhotosNav.teardown();
      PhotosNav = null;
    });

    PhotosNav.on('selectMoment', function(event) {
      if (event.context.selected) {
        return;
      }

      _closeOnNotDesktop();

      $PhotosService.config('momentSelected', event.context.title);
    });

    PhotosNav.on('teardown', function() {
      setTimeout(function() {
        $PhotosService.offNamespace('photosNavController');
      });
    });

    PhotosNav.require().then(function() {
      if ($PhotosService.config('dates')) {
        _dates({
          value: $PhotosService.config('dates')
        });
      }

      if ($PhotosService.config('moments')) {
        _moments({
          value: $PhotosService.config('moments')
        });
      }

      if ($PhotosService.config('dateAnchor')) {
        _dateAnchor({
          value: $PhotosService.config('dateAnchor')
        });
      }

      if ($PhotosService.config('lengths')) {
        _lengths({
          value: $PhotosService.config('lengths')
        });
      }

      if ($PhotosService.config('momentSelected')) {
        _momentSelected({
          value: $PhotosService.config('momentSelected')
        });
      }

      $done();
    });
  }]);

})();
