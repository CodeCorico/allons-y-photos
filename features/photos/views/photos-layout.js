(function() {
  'use strict';

  window.Ractive.controllerInjection('photos-layout', [
    '$PhotosService', '$RealTimeService', '$socket', '$Layout', '$component', '$data', '$done',
  function photosLayoutController(
    $PhotosService, $RealTimeService, $socket, $Layout, $component, $data, $done
  ) {
    var PhotosLayout = $component({
          data: $.extend(true, {
            contentTop: 0,
            containerHeight: 300,
            selectionModeActivated: false,

            momentAddFocus: function(event, value, component) {
              PhotosLayout.get('momentAddChange')(event, value, component);
            },

            momentAddChange: function(event, value, component) {
              PhotosLayout.set('momentAddName', value);

              if (!value) {
                return component.clear();
              }

              value = value.toLowerCase();

              var moments = $PhotosService.config('moments'),
                  search = new RegExp('(' + value + ')', 'i'),
                  list = [];

              moments.forEach(function(moment) {
                if (!moment.title || moment.title.toLowerCase() == value) {
                  return;
                }

                if (search.test(moment.title)) {
                  list.push({
                    display: moment.title,
                    value: moment.title
                  });
                }
              });

              component.set('list', list);
            }
          }, $data)
        }),
        _selects = {},
        _$el = {
          window: $(window),
          scrolls: $($(PhotosLayout.el).find('.pl-scrolls')[0]),
          container: $(PhotosLayout.el).find('.photos-layout-container')
        };

    function _contextOpened() {
      setTimeout(_defineView, 600);
    }

    function _defineView() {
      var datesSelection = PhotosLayout.get('datesSelection'),
          $content = _$el.container.find('.photos-layout-content'),
          $space = $content.find('.photos-layout-content-space'),
          $titleTemplate = $('<h2 />')
            .css('visibility', 'hidden'),
          $photoTemplate = $('<div />')
            .attr('class', 'photos-layout-photo')
            .css('visibility', 'hidden');

      $content.append($titleTemplate);
      $content.append($photoTemplate);

      var titleHeight = $titleTemplate.outerHeight(true),
          photoWidth = $photoTemplate.outerWidth(true),
          photoHeight = $photoTemplate.outerHeight(true),
          spaceHeight = $space.outerHeight(true),
          containerHeight = spaceHeight,
          maxPhotoLine = Math.floor(_$el.container.outerWidth() / photoWidth);

      $titleTemplate.remove();
      $titleTemplate = null;
      $photoTemplate.remove();
      $photoTemplate = null;

      datesSelection.forEach(function(date) {
        date.top = containerHeight;
        containerHeight += titleHeight + (Math.ceil(date.photos.length / maxPhotoLine) * photoHeight);
        date.bottom = containerHeight;
      });

      PhotosLayout.set('spaceHeight', spaceHeight);
      PhotosLayout.set('containerHeight', containerHeight);
      PhotosLayout.set('viewHeight', _$el.scrolls.outerHeight());

      _updateView();
    }

    function _updateView() {
      var datesSelection = PhotosLayout.get('datesSelection'),
          viewHeight = PhotosLayout.get('viewHeight'),
          containerHeight = PhotosLayout.get('containerHeight'),
          scrollTop = _$el.scrolls.scrollTop(),
          spaceHeight = PhotosLayout.get('spaceHeight'),
          top = Math.max(spaceHeight, scrollTop - (viewHeight * 2)),
          bottom = Math.min(containerHeight, scrollTop + (viewHeight * 2)),
          start = null,
          stop = datesSelection.length;

      for (var i = 0; i < datesSelection.length; i++) {
        if (start !== null) {
          if (bottom < datesSelection[i].top) {
            stop = i;

            break;
          }
        }
        else if (top >= datesSelection[i].top && top <= datesSelection[i].bottom) {
          start = i;
        }

        if (scrollTop >= datesSelection[i].top && scrollTop <= datesSelection[i].bottom) {
          $PhotosService.config('dateAnchor', datesSelection[i]);
        }
      }

      if (start === null) {
        return;
      }

      PhotosLayout.set('contentTop', datesSelection[start].top - spaceHeight);
      PhotosLayout.set('dates', datesSelection.slice(start, stop));
    }

    function _anchor(args) {
      var top = PhotosLayout.get('datesSelection.' + args.value + '.top');

      _$el.scrolls
        .stop()
        .animate({
          scrollTop: top
        }, 150, function() {
          if (_$el.scrolls.scrollTop() != top) {
            _$el.scrolls.scrollTop(top + 1);
          }
        });
    }

    $PhotosService.onSafe('photosLayoutController.anchorConfigChanged', _anchor);

    function _selectionMode(args) {
      PhotosLayout.set('selectionModeActivated', args.value);

      if (!args.value) {
        Object.keys(_selects).forEach(function(keypath) {
          PhotosLayout.set(keypath + '.selected', false);
        });

        _selects = {};

        var button = $PhotosService.config('selectButton');

        if (button) {
          button.set('notificationsCount', 0);
        }

        PhotosLayout.set('displayMomentBar', false);

        setTimeout(function() {
          if (!PhotosLayout) {
            return;
          }

          PhotosLayout.findChild('name', 'pl-autocomplete').clear();
        }, 550);
      }
    }

    $PhotosService.onSafe('photosLayoutController.selectionModeActivatedConfigChanged', _selectionMode);

    function _momentSelected(args) {
      var datesCache = PhotosLayout.get('datesCache'),
          momentSelected = PhotosLayout.get('momentSelected'),
          dates = [];

      if (args.value === momentSelected) {
        return;
      }

      PhotosLayout.set('toMoment', true);

      setTimeout(function() {
        if (!PhotosLayout) {
          return;
        }

        PhotosLayout.set('toMoment', false);
      }, 550);

      PhotosLayout.set('momentSelected', args.value);

      if ($PhotosService.config('selectionModeActivated')) {
        $PhotosService.config('selectionModeActivated', false);
      }

      if (!args.value) {
        PhotosLayout.set('datesSelection', datesCache);
        $PhotosService.config('dates', datesCache);
      }
      else {
        datesCache.forEach(function(date) {
          var photos = [];

          date.photos.forEach(function(photo) {
            if (!photo.moments || !photo.moments.length) {
              return;
            }

            if (photo.moments.indexOf(args.value) > -1) {
              photos.push(photo);
            }
          });

          if (photos.length) {
            dates.push({
              date: date.date,
              dateTitle: date.dateTitle,
              photos: photos
            });
          }
        });

        PhotosLayout.set('datesSelection', dates);
        $PhotosService.config('dates', dates);
      }

      _$el.scrolls.scrollTop(0);

      _defineView();
      _updateView();
    }

    $PhotosService.onSafe('photosLayoutController.momentSelectedConfigChanged', _momentSelected);

    $PhotosService.onSafe('photosLayoutController.teardown', function() {
      PhotosLayout.teardown();
      PhotosLayout = null;
    });

    PhotosLayout.on('select', function(event) {
      if (!PhotosLayout.get('selectionModeActivated')) {
        return;
      }

      event.original.preventDefault();
      event.original.stopPropagation();

      var value = !PhotosLayout.get(event.keypath + '.selected');

      PhotosLayout.set(event.keypath + '.selected', value);

      if (value) {
        _selects[event.keypath] = true;
      }
      else {
        delete _selects[event.keypath];
      }

      var selectsLength = Object.keys(_selects).length,
          button = $PhotosService.config('selectButton');

      if (button) {
        button.set('notificationsCount', selectsLength);
      }

      PhotosLayout.set('displayMomentBar', !!selectsLength);
    });

    PhotosLayout.on('addMoment', function() {
      var momentAddName = (PhotosLayout.get('momentAddName') || '').trim();

      if (!momentAddName) {
        return;
      }

      var photos = Object.keys(_selects).map(function(keypath) {
        return PhotosLayout.get(keypath + '.url');
      });

      if (!photos.length) {
        return;
      }

      $socket.emit('update(photos/moment)', {
        name: momentAddName,
        photos: photos
      });
    });

    PhotosLayout.on('removeMoment', function() {
      var momentSelected = (PhotosLayout.get('momentSelected') || '').trim();

      if (!momentSelected) {
        return;
      }

      var photos = Object.keys(_selects).map(function(keypath) {
        return PhotosLayout.get(keypath + '.url');
      });

      if (!photos.length) {
        return;
      }

      $socket.emit('delete(photos/moment)', {
        name: momentSelected,
        photos: photos
      });
    });

    PhotosLayout.on('teardown', function() {
      $RealTimeService.unregisterComponent('photosLayoutController');
      _$el.window.off('resize', _defineView);
      $Layout.off('leftContextOpened', _contextOpened);
      $Layout.off('rightContextOpened', _contextOpened);

      setTimeout(function() {
        $PhotosService.offNamespace('photosLayoutController');
      });
    });

    _$el.scrolls.scroll(_updateView);
    _$el.window.resize(_defineView);

    $Layout.on('leftContextOpened', _contextOpened);
    $Layout.on('rightContextOpened', _contextOpened);

    $RealTimeService.realtimeComponent('photosLayoutController', {
      name: 'photos',
      update: function(event, args) {
        if (!args || !args.photos) {
          return;
        }

        var activeYear = new Date().getFullYear(),
            datesCache = [],
            momentsCache = {},
            moments = [{
              title: '',
              selected: true
            }],
            i = -1,
            lastTime = null;

        $PhotosService.config('lengths', {
          photosLength: args.photosLength,
          videosLength: args.videosLength
        });
        $PhotosService.config('photos', args.photos);

        args.photos.forEach(function(photo, index) {
          if (photo.shotTime != lastTime) {
            lastTime = photo.shotTime;
            i++;

            var year = new Date(photo.shotTime).getFullYear();

            datesCache[i] = {
              date: lastTime,
              dateTitle: window.moment(lastTime).format('D MMMM' + (year != activeYear ? ' YYYY' : '')),
              photos: []
            };
          }

          photo.index = index;

          datesCache[i].photos.push(photo);

          if (!photo.moments || !photo.moments.length) {
            return;
          }

          photo.moments.forEach(function(moment) {
            if (typeof momentsCache[moment] == 'undefined') {
              moments.push({
                title: moment,
                count: 0,
                selected: false
              });
              momentsCache[moment] = moments.length - 1;
            }

            moments[momentsCache[moment]].count++;
          });
        });

        moments.sort(function(a, b) {
          if (a.title < b.title) {
            return -1;
          }
          if (a.title > b.title) {
            return 1;
          }

          return 0;
        });

        PhotosLayout.set('datesCache', datesCache);
        PhotosLayout.set('datesSelection', datesCache);

        $PhotosService.config('dates', datesCache);
        $PhotosService.config('moments', moments);

        _defineView();

        if (args.momentUpdated) {
          var momentExists = Object.keys(momentsCache).indexOf(args.momentUpdated) > -1;

          if (PhotosLayout.get('momentSelected') == args.momentUpdated) {
            PhotosLayout.set('momentSelected', null);

            $PhotosService.config('momentSelected', momentExists ? args.momentUpdated : '');
          }
          else if (args.isOrigin) {
            $PhotosService.config('momentSelected', momentExists ? args.momentUpdated : '');
          }
        }
      }
    }, 'photos');

    PhotosLayout.require().then($done);
  }]);

})();
