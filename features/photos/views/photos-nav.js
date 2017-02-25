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
        videosLength: 0
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

      _filters('moments');
    }

    $PhotosService.onSafe('photosNavController.momentsConfigChanged', _moments);

    function _people(args) {
      PhotosNav.set('people', args.value);

      _filters('people');
    }

    $PhotosService.onSafe('photosNavController.peopleConfigChanged', _people);

    function _dateAnchor(args) {
      PhotosNav.set('dateSelectedId', window.moment(args.value.date).format('MMMM YYYY D'));
    }

    $PhotosService.onSafe('photosNavController.dateAnchorConfigChanged', _dateAnchor);

    function _lengths(args) {
      PhotosNav.set('photosLength', args.value.photosLength);
      PhotosNav.set('videosLength', args.value.videosLength);
    }

    $PhotosService.onSafe('photosNavController.lengthsConfigChanged', _lengths);

    function _filters(type) {
      var filters = $PhotosService.config('filters'),
          types = type ? [type] : ['moments', 'people'];

      if (!filters || !filters.length) {
        return;
      }

      types.forEach(function(type) {
        var list = PhotosNav.get(type);

        for (var i = 0; i < list.length; i++) {
          var selected = false;

          for (var j = 0; j < filters.length; j++) {
            if (filters[j].type == type && filters[j].name == list[i].name) {
              selected = true;

              break;
            }
          }

          PhotosNav.set(type + '.' + i + '.selected', selected);
        }
      });

    }

    function _addRemoveFilterSelected(args, add) {
      var list = PhotosNav.get(args.type);

      for (var i = 0; i < list.length; i++) {
        if (list[i].name == args.name) {
          PhotosNav.set(args.type + '.' + i + '.selected', add);

          break;
        }
      }
    }

    function _addFilterSelected(args) {
      _addRemoveFilterSelected(args, true);
    }

    function _removeFilterSelected(args) {
      _addRemoveFilterSelected(args, false);
    }

    $PhotosService.onSafe('photosNavController.addFilter', _addFilterSelected);
    $PhotosService.onSafe('photosNavController.removeFilter', _removeFilterSelected);

    function _avatarChanged(args) {
      var list = PhotosNav.get('people'),
          avatar = args.name + '.jpg?t=' + new Date().getTime();

      for (var i = 0; i < list.length; i++) {
        if (list[i].name == args.name) {
          PhotosNav.set('people.' + i + '.avatar', avatar);

          break;
        }
      }
    }

    $PhotosService.onSafe('photosNavController.avatarChanged', _avatarChanged);

    PhotosNav.on('toAnchor', function(event) {
      _closeOnNotDesktop();

      $PhotosService.config('anchor', event.context.index);
    });

    $PhotosService.onSafe('photosNavController.teardown', function() {
      PhotosNav.teardown();
      PhotosNav = null;
    });

    PhotosNav.on('selectMoment', function(event) {
      _closeOnNotDesktop();

      $PhotosService[event.context.selected ? 'removeFilter' : 'addFilter'](event.context.name, 'moments');
    });

    PhotosNav.on('selectPerson', function(event) {
      _closeOnNotDesktop();

      $PhotosService[event.context.selected ? 'removeFilter' : 'addFilter'](event.context.name, 'people');
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

      if ($PhotosService.config('people')) {
        _people({
          value: $PhotosService.config('people')
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

      $done();
    });
  }]);

})();
