(function() {
  'use strict';

  window.Ractive.controllerInjection('photos-layout', [
    '$PhotosService', '$RealTimeService', '$BodyDataService', '$socket', '$Layout', '$component', '$data', '$done',
  function photosLayoutController(
    $PhotosService, $RealTimeService, $BodyDataService, $socket, $Layout, $component, $data, $done
  ) {
    var _user = $BodyDataService.data('user') || null,
        PhotosLayout = $component({
          data: $.extend(true, {
            contentTop: 0,
            containerHeight: 300,
            selectionModeActivated: false,
            canAdministrateMoments: _user && _user.permissionsPublic && _user.permissionsPublic.indexOf('photos-moments') > -1,
            canAdministratePeople: _user && _user.permissionsPublic && _user.permissionsPublic.indexOf('photos-people') > -1,

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
                if (!moment.name || moment.name.toLowerCase() == value) {
                  return;
                }

                if (search.test(moment.name)) {
                  list.push({
                    display: moment.name,
                    value: moment.name
                  });
                }
              });

              component.set('list', list);
            },

            peopleAddFocus: function(event, value, component) {
              PhotosLayout.get('peopleAddChange')(event, value, component);
            },

            peopleAddChange: function(event, value, component) {
              PhotosLayout.set('peopleAddName', value);

              if (!value) {
                return component.clear();
              }

              value = value.toLowerCase();

              var people = $PhotosService.config('people'),
                  search = new RegExp('(' + value + ')', 'i'),
                  list = [];

              people.forEach(function(person) {
                if (!person.name || person.name.toLowerCase() == value) {
                  return;
                }

                if (search.test(person.name)) {
                  list.push({
                    display: person.name,
                    value: person.name
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

      var lastTotalPhotos = 0;

      datesSelection.forEach(function(date) {
        var photosLength = date.photos.length,
            modulo = 0;

        if (date.isPart) {
          modulo = lastTotalPhotos % maxPhotoLine;

          if (modulo > 0) {
            containerHeight -= photoHeight;
            photosLength -= maxPhotoLine - modulo;
          }

          lastTotalPhotos += date.photos.length;
        }
        else {
          lastTotalPhotos = date.photos.length;
        }

        date.top = containerHeight;
        containerHeight +=
          (date.isPart ? (modulo > 0 ? photoHeight : 0) : titleHeight) +
          (Math.ceil(photosLength / maxPhotoLine) * photoHeight);
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

      if (!datesSelection || !datesSelection.length) {
        PhotosLayout.set('contentTop', 0);
        PhotosLayout.set('dates', []);

        return;
      }

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

    function _clearSelection() {
      var dates = PhotosLayout.get('dates');

      Object.keys(_selects).forEach(function(index) {
        for (var i = 0; i < dates.length; i++) {
          for (var j = 0; j < dates[i].photos.length; j++) {
            if (dates[i].photos[j].index == index) {
              return PhotosLayout.set('dates.' + i + '.photos.' + j + '.selected', false);
            }
          }
        }
      });

      _selects = {};

      var button = $PhotosService.config('selectButton');

      if (button) {
        button.set('notificationsCount', 0);
      }
    }

    function _clearAutocompletes() {
      PhotosLayout.findChild('el-name', 'photos-layout-people').clear();
      PhotosLayout.findChild('el-name', 'photos-layout-moments').clear();
    }

    function _selectionMode(args) {
      PhotosLayout.set('selectionModeActivated', args.value);

      if (!args.value) {
        _clearSelection();

        PhotosLayout.set('displaySelectionBar', false);
        PhotosLayout.set('selectionUnique', false);

        setTimeout(function() {
          if (!PhotosLayout) {
            return;
          }

          _clearAutocompletes();
        }, 550);
      }
    }

    $PhotosService.onSafe('photosLayoutController.selectionModeActivatedConfigChanged', _selectionMode);

    function _filters(args, refreshOnly) {
      var filters = args.value || [],
          datesCache = PhotosLayout.get('datesCache'),
          dates = [];

      PhotosLayout.set('toMoment', true);

      setTimeout(function() {
        if (!PhotosLayout) {
          return;
        }

        PhotosLayout.set('toMoment', false);
      }, 550);

      PhotosLayout.set('personSelected', args.value);

      if ($PhotosService.config('selectionModeActivated')) {
        if (refreshOnly) {
          _clearSelection();
          _clearAutocompletes();
        }
        else {
          $PhotosService.config('selectionModeActivated', false);
        }
      }

      var hasMomentFiltered = false;

      if (!filters.length) {
        PhotosLayout.set('datesSelection', datesCache);
        $PhotosService.config('dates', datesCache);
      }
      else {
        datesCache.forEach(function(date) {
          var photos = [];

          date.photos.forEach(function(photo) {
            var inMoment = false,
                hasMoment = false;

            for (var i = 0; i < filters.length; i++) {
              if (filters[i].type == 'moments') {
                hasMoment = true;
                hasMomentFiltered = true;
              }

              if (
                filters[i].type == 'people' &&
                (!photo[filters[i].type] || !photo[filters[i].type].length || photo[filters[i].type].indexOf(filters[i].name) < 0)
              ) {
                return;
              }
              else if (
                filters[i].type == 'moments' &&
                (photo[filters[i].type] && photo[filters[i].type].length && photo[filters[i].type].indexOf(filters[i].name) > -1)
              ) {
                inMoment = true;
              }
            }

            if (!hasMoment || inMoment) {
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

      PhotosLayout.set('hasMomentFiltered', hasMomentFiltered);

      if (!refreshOnly) {
        _$el.scrolls.scrollTop(0);
      }

      _defineView();

      if (refreshOnly) {
        setTimeout(function() {
          if (!PhotosLayout) {
            return;
          }

          _updateView();
        });
      }
      else {
        _updateView();
      }
    }

    $PhotosService.onSafe('photosLayoutController.filtersConfigChanged', _filters);

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

      var value = !PhotosLayout.get(event.keypath + '.selected'),
          index = PhotosLayout.get(event.keypath).index;

      PhotosLayout.set(event.keypath + '.selected', value);

      if (value) {
        _selects[index] = true;
      }
      else {
        delete _selects[index];
      }

      var selectsKeys = Object.keys(_selects),
          button = $PhotosService.config('selectButton');

      if (button) {
        button.set('notificationsCount', selectsKeys.length);
      }

      PhotosLayout.set('displaySelectionBar', !!selectsKeys.length);
      PhotosLayout.set('selectionUnique',
        selectsKeys.length === 1 && $PhotosService.config('photos')[selectsKeys[0]].cover.indexOf('.jpg') > -1
      );

      var selectionWithPeople = false;

      if (selectsKeys.length) {
        for (var i = 0; i < selectsKeys.length; i++) {
          var photo = $PhotosService.config('photos')[selectsKeys[i]];

          if (photo.people && photo.people.length) {
            selectionWithPeople = true;

            break;
          }
        }
      }

      PhotosLayout.set('selectionWithPeople', selectionWithPeople);
    });

    function _addType(type, method) {
      method = method || type;

      var addName = (PhotosLayout.get(type + 'AddName') || '').trim();

      if (!addName) {
        return;
      }

      var photos = Object.keys(_selects).map(function(index) {
        return $PhotosService.config('photos')[index].url;
      });

      if (!photos.length) {
        return;
      }

      $socket.emit('update(photos/' + method + ')', {
        name: addName,
        photos: photos
      });
    }

    PhotosLayout.on('addMoment', function() {
      _addType('moment');
    });

    PhotosLayout.on('addPeople', function() {
      _addType('people');
    });

    PhotosLayout.on('removeMoment', function() {
      var filters = $PhotosService.config('filters'),
          filtersSelected = [];

      filters.forEach(function(filter) {
        if (filter.type == 'moments') {
          filtersSelected.push(filter.name);
        }
      });

      if (!filtersSelected.length) {
        return;
      }

      var photos = Object.keys(_selects).map(function(index) {
        return $PhotosService.config('photos')[index].url;
      });

      if (!photos.length) {
        return;
      }

      $socket.emit('delete(photos/moment)', {
        names: filtersSelected,
        photos: photos
      });
    });

    PhotosLayout.on('removePeople', function() {
      var photos = Object.keys(_selects).map(function(index) {
        return $PhotosService.config('photos')[index].url;
      });

      if (!photos.length) {
        return;
      }

      $socket.emit('delete(photos/people)', {
        photos: photos
      });
    });

    PhotosLayout.on('defineAvatar', function() {
      $socket.once('read(photos/avatar)', function(args) {
        $PhotosService.fire('avatarChanged', args);
      });

      _addType('people', 'avatar');
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
            moments = [],
            peopleCache = {},
            people = [],
            i = -1,
            lastTime = null;

        $PhotosService.config('lengths', {
          photosLength: args.photosLength,
          videosLength: args.videosLength
        });
        $PhotosService.config('photos', args.photos);

        args.photos.forEach(function(photo, index) {
          if (photo.shotTime != lastTime || (i > -1 && datesCache[i].photos.length > 24)) {
            var isPart = photo.shotTime == lastTime;

            lastTime = photo.shotTime;
            i++;

            var year = new Date(photo.shotTime).getFullYear();

            if (isPart) {
              console.log('isPart', window.moment(lastTime).format('D MMMM' + (year != activeYear ? ' YYYY' : '')));
            }

            datesCache[i] = {
              date: lastTime,
              dateTitle: window.moment(lastTime).format('D MMMM' + (year != activeYear ? ' YYYY' : '')),
              isPart: isPart,
              photos: []
            };
          }

          photo.index = index;

          datesCache[i].photos.push(photo);

          if (photo.moments && photo.moments.length) {
            photo.moments.forEach(function(moment) {
              if (typeof momentsCache[moment] == 'undefined') {
                moments.push({
                  name: moment,
                  count: 0,
                  selected: false
                });
                momentsCache[moment] = moments.length - 1;
              }

              moments[momentsCache[moment]].count++;
            });
          }

          if (photo.people && photo.people.length) {
            photo.people.forEach(function(person) {
              if (typeof peopleCache[person] == 'undefined') {
                people.push({
                  name: person,
                  count: 0,
                  selected: false
                });
                peopleCache[person] = people.length - 1;
              }

              people[peopleCache[person]].count++;
            });
          }
        });

        moments.sort(function(a, b) {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }

          return 0;
        });

        people.sort(function(a, b) {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }

          return 0;
        });

        PhotosLayout.set('datesCache', datesCache);
        $PhotosService.config('moments', moments);
        $PhotosService.config('people', people);

        _filters({
          value: $PhotosService.config('filters')
        }, args.addOnly);
      }
    }, 'photos');

    PhotosLayout.require().then($done);
  }]);

})();
