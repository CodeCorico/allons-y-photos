(function() {
  'use strict';

  window.Ractive.controllerInjection('photos-viewer', [
    '$PhotosService', '$component', '$data', '$done',
  function photosViewerController(
    $PhotosService, $component, $data, $done
  ) {
    var PhotosViewer = $component({
          data: $.extend(true, {
            scrollLeft: 0,
            move: false
          }, $data)
        }),
        _scroll = {
          enabled: true
        },
        _index = null,
        _photosLength = null,
        _lastDate = null,
        _displayDateTimeout = null,
        _$video = null,
        _$el = {
          window: $(window),
          viewer: $(PhotosViewer.el)
        };

    function _keyup(event) {
      if (!PhotosViewer.get('display')) {
        return;
      }

      if (event.altKey || event.metaKey || event.shiftKey || event.ctrlKey) {
        return;
      }

      // right
      if (event.which == '39') {
        _move('right');
      }

      // left
      else if (event.which == '37') {
        _move('left');
      }

      // esc
      else if (event.which == '27') {
        window.location.hash = '';
      }
    }

    function _move(direction) {
      PhotosViewer.set('move', true);

      var updateViewAfter = true;

      if (direction == 'left') {
        _index--;
        PhotosViewer.set('scrollLeft', _$el.window.width());
      }
      else if (direction == 'right') {
        _index++;
        PhotosViewer.set('scrollLeft', -_$el.window.width());
      }
      else {
        updateViewAfter = false;

        PhotosViewer.set('scrollLeft', 0);
      }

      setTimeout(function() {
        if (!PhotosViewer) {
          return;
        }

        PhotosViewer.set('move', false);

        setTimeout(function() {
          if (!PhotosViewer) {
            return;
          }

          PhotosViewer.set('scrollLeft', 0);

          if (updateViewAfter) {
            _view();
          }
        });
      }, 350);
    }

    function _scrolling(event) {
      event.preventDefault();
      event.stopPropagation();

      if (PhotosViewer.get('move')) {
        return;
      }

      var eventType = (
            event.type == 'touchstart' || event.type == 'mousedown' ? 'start' : (
            event.type == 'touchend' || event.type == 'mouseup' ? 'end' : (
            event.type == 'touchmove' || event.type == 'mousemove' ? 'move' : false
          ))),
          touch = event.type.substr(0, 'touch'.length) == 'touch' ? (
            event.changedTouches && event.changedTouches.length ? event.changedTouches[0] : false
          ) : event;

      if (!touch) {
        return;
      }

      if (eventType == 'start') {
        _scroll.startX = touch.clientX;
      }
      else if (typeof _scroll.startX != 'undefined') {
        _scroll.x = touch.clientX;

        var scrollLeft = _scroll.x - _scroll.startX;

        PhotosViewer.set('scrollLeft', scrollLeft);

        if (eventType == 'end') {
          delete _scroll.startX;

          if (scrollLeft === 0 && _$video) {
            _$video.click();

            return;
          }

          var direction = 'center';

          if (Math.abs(scrollLeft) > _$el.window.width() / 5) {
            if (scrollLeft > 0 && _index > 0) {
              direction = 'left';
            }
            else if (scrollLeft < 0 && _index < _photosLength - 1) {
              direction = 'right';
            }
          }

          _move(direction);
        }
      }
    }

    function _fromHash() {
      _index = window.location.hash.replace('#', '');
      _index = _index ? parseInt(_index, 10) : false;

      _photosLength = $PhotosService.photos().length;

      _view();
    }

    function _view() {
      var photos = $PhotosService.photos(),
          preload = false;

      if (!PhotosViewer.get('display')) {
        preload = true;
      }

      _videoPause();

      if (_$video) {
        _$video.off('play', _videoPlay);
        _$video.off('pause', _videoPause);

        if (_$video[0]) {
          _$video[0].pause();
        }

        _$video = null;
      }

      if (!_index && _index !== 0) {
        PhotosViewer.set('closing', true);

        setTimeout(function() {
          if (!PhotosViewer) {
            return;
          }

          _scroll = {
            enabled: true
          };
          _index = null;
          _lastDate = null;

          PhotosViewer.set('photos', []);
          PhotosViewer.set('display', false);
          PhotosViewer.set('closing', false);
        }, 350);

        return;
      }

      PhotosViewer.set('closing', false);
      PhotosViewer.set('display', true);

      var activeYear = new Date().getFullYear(),
          year = new Date(photos[_index].shotTime).getFullYear(),
          date = window.moment(photos[_index].shotTime).format('D MMMM' + (year != activeYear ? ' YYYY' : ''));

      if (preload) {
        PhotosViewer.set('preloading', true);
      }
      else {
        if (date != _lastDate) {
          PhotosViewer.set('date', date);
          PhotosViewer.set('displayDate', true);

          clearTimeout(_displayDateTimeout);

          _displayDateTimeout = setTimeout(function() {
            if (!PhotosViewer) {
              return;
            }

            PhotosViewer.set('displayDate', false);
          }, 3350);
        }
      }

      _lastDate = date;

      PhotosViewer.set('photos', [
        _index === 0 ? null : photos[_index - 1],
        photos[_index],
        _index === photos.length - 1 ? null : photos[_index + 1]
      ]);

      if (photos[_index].isVideo) {
        _$video = _$el.viewer.find('.photos-viewer-photo:nth-child(2) video');

        _$video.on('play', _videoPlay);
        _$video.on('pause', _videoPause);
      }

      if (preload) {
        var img = new Image();
        img.onload = function() {
          setTimeout(function() {
            if (!PhotosViewer) {
              return;
            }

            PhotosViewer.set('preloading', false);
          }, 10);
        };
        img.src = photos[_index].thumbnail;
      }
    }

    $PhotosService.onSafe('photosViewerController.view', _fromHash);

    $PhotosService.onSafe('photosViewerController.teardown', function() {
      PhotosViewer.teardown();
      PhotosViewer = null;
    });

    function _videoPlay() {
      PhotosViewer.set('playing', true);
    }

    function _videoPause() {
      PhotosViewer.set('playing', false);
    }

    PhotosViewer.on('play', function(event) {
      var video = $(event.node).parent().find('video')[0];

      if (video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2) {
        video.pause();
      }
      else {
        video.play();
      }
    });

    PhotosViewer.on('teardown', function() {
      _$el.window.off('hashchange', _fromHash);
      _$el.window.off('keyup', _keyup);

      setTimeout(function() {
        $PhotosService.offNamespace('photosViewerController');
      });
    });

    _$el.window.on('hashchange', _fromHash);
    _$el.window.on('keyup', _keyup);

    PhotosViewer.el.addEventListener('touchstart', _scrolling, false);
    PhotosViewer.el.addEventListener('touchend', _scrolling, false);
    PhotosViewer.el.addEventListener('touchmove', _scrolling, false);
    PhotosViewer.el.addEventListener('mousedown', _scrolling, false);
    PhotosViewer.el.addEventListener('mouseup', _scrolling, false);
    PhotosViewer.el.addEventListener('mousemove', _scrolling, false);

    PhotosViewer.require().then(function() {
      if (window.location.hash) {
        if ($PhotosService.photos()) {
          _fromHash();
        }
        else {
          $PhotosService.on('photosViewerControllerTemp.photos', function() {
            setTimeout(function() {
              $PhotosService.offNamespace('photosViewerControllerTemp');
            });

            _fromHash();
          });
        }
      }

      $done();
    });
  }]);

})();
