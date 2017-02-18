module.exports = function() {
  'use strict';

  DependencyInjection.factory('photosThumbsFactory', function($allonsy) {

    $allonsy.requireInFeatures('models/thumbnails-factory-back');

    var path = require('path'),
        thumbnailsFactory = DependencyInjection.injector.factory.get('thumbnailsFactory');

    return function groupsThumbsFactory(photo, dateDir, callback) {
      var destPath = path.resolve('./media/photos', dateDir),
          SIZES = [{
            name: 'cover',
            width: 400,
            height: 400,
            path: destPath
          }, {
            name: 'thumbnail',
            maxWidth: 1980,
            maxHeight: 1980,
            path: destPath
          }];

      if (!photo || !photo.source) {
        if (photo) {
          for (var i = 0; i < SIZES.length; i++) {
            photo[SIZES[i].name] = null;
          }
        }

        return callback();
      }

      thumbnailsFactory([{
        path: path.dirname(photo.source),
        file: path.basename(photo.source),
        sizes: SIZES
      }], {
        overwrite: true,
        resizeGif: true
      }, function(err, files) {
        if (err || !files || !files.length || files[0].sizes < SIZES.length) {
          $allonsy.logWarning('allons-y-photos', 'photos:photos-thumbs-error', {
            error: err || 'no files',
            id: photo.id,
            source: photo.source
          });

          return callback();
        }

        var sizes = files[0].sizes;

        for (var i = 0; i < SIZES.length; i++) {
          if (sizes[i].err || !sizes[i].result) {
            $allonsy.logWarning('allons-y-photos', 'photos:photos-thumbs-error', {
              error: sizes[i].err || 'no result',
              id: photo.id,
              source: photo.source,
              size: SIZES[i].name
            });
          }

          photo[SIZES[i].name] = sizes[i].err || !sizes[i].result ? null : '/media/photos/' + dateDir + '/' + sizes[i].result;
        }

        callback();
      });
    };
  });
};
