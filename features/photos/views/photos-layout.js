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
            formatDate: function(date) {
              if (!date) {
                return '';
              }

              date = date.split('T');

              return 'Generated the ' + date[0] + ' at ' + date[1].substr(0, 5);
            }
          }, $data)
        }),
        _$el = {
          window: $(window),
          scrolls: $($(PhotosLayout.el).find('.pl-scrolls')[0]),
          container: $(PhotosLayout.el).find('.photos-layout-container')
        };

    function _contextOpened() {
      setTimeout(_defineView, 600);
    }

    function _defineView() {
      var datesCache = PhotosLayout.get('datesCache'),
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

      datesCache.forEach(function(date) {
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
      var datesCache = PhotosLayout.get('datesCache'),
          viewHeight = PhotosLayout.get('viewHeight'),
          containerHeight = PhotosLayout.get('containerHeight'),
          scrollTop = _$el.scrolls.scrollTop(),
          spaceHeight = PhotosLayout.get('spaceHeight'),
          top = Math.max(spaceHeight, scrollTop - (viewHeight * 2)),
          bottom = Math.min(containerHeight, scrollTop + (viewHeight * 2)),
          start = null,
          stop = datesCache.length;

      for (var i = 0; i < datesCache.length; i++) {
        if (start !== null) {
          if (bottom < datesCache[i].top) {
            stop = i;

            break;
          }
        }
        else if (top >= datesCache[i].top && top <= datesCache[i].bottom) {
          start = i;
        }

        if (scrollTop >= datesCache[i].top && scrollTop <= datesCache[i].bottom) {
          $PhotosService.dateAnchor(datesCache[i]);
        }
      }

      if (start === null) {
        return;
      }

      PhotosLayout.set('contentTop', datesCache[start].top - spaceHeight);
      PhotosLayout.set('dates', datesCache.slice(start, stop));
    }

    function _toAnchor(args) {
      var top = PhotosLayout.get('datesCache.' + args.index + '.top');

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

    $RealTimeService.realtimeComponent('photosLayoutController', {
      name: 'photos',
      update: function(event, args) {
        if (!args || !args.photos) {
          return;
        }

        var activeYear = new Date().getFullYear(),
            datesCache = [],
            i = -1,
            lastTime = null;

        $PhotosService.photos(args.photos);

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
        });

        PhotosLayout.set('datesCache', datesCache);

        $PhotosService.dates(datesCache);

        _defineView();
      }
    }, 'photos');

    $PhotosService.onSafe('photosLayoutController.toAnchor', _toAnchor);

    $PhotosService.onSafe('photosLayoutController.teardown', function() {
      PhotosLayout.teardown();
      PhotosLayout = null;
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

    PhotosLayout.require().then($done);
  }]);

})();
