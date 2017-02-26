'use strict';

module.exports = function($allonsy, $glob, $done) {

  var path = require('path'),
      fs = require('fs-extra'),
      async = require('async'),
      ffmpeg = require('fluent-ffmpeg'),

      INDEXER_PATH = path.resolve(process.env.INDEXER_PATH),
      destDir = path.resolve('media/photos');

  require(path.resolve(__dirname, 'models/indexer-exif-service-back.js'))();

  var ExifService = DependencyInjection.injector.controller.get('ExifService');

  $allonsy.on('message', function(args) {
    if (args.event == 'call(indexer/start)') {
      _index();
    }
  });

  function _elaspedTime(startDate) {
    var endDate = new Date(),
        time = Math.max(1, (endDate.getTime() - startDate.getTime()) / 1000),
        hours   = Math.floor(time / 3600),
        minutes = Math.floor((time - (hours * 3600)) / 60),
        seconds = Math.floor(time - (hours * 3600) - (minutes * 60));

    return ((hours ? hours + 'h' : '') + (minutes ? ' ' + minutes + 'min' : '') + (seconds ? ' ' + seconds + 's' : '')).trim();
  }

  function _workingOutput(startDate, count, added, updated, total, done) {
    $allonsy.outputInfo('[' + (done ? 'done' : 'working') + ':indexer]► [' +
      startDate.getDate() + '/' + (startDate.getMonth() + 1) + '/' + startDate.getFullYear() + ' ' +
      startDate.getHours() + ':' + startDate.getMinutes() +
    '] ' + count + (total ? '/' + total : '') + ' (' + added + ' added, ' + updated + ' updated) photos/videos indexed (' + (done ? 'in ' : '') + _elaspedTime(startDate) + ')');
  }

  function _exif(file, callback) {
    ExifService.scan(file, function(tags) {
      callback(tags);
    });
  }

  function _savePhoto(photoModel, photo, photosIndexes, callback) {
    photoModel.sourceModifiedAt = photo.sourceModifiedAt;
    photoModel.shotDate = photo.shotDate;
    photoModel.shotTime = photo.shotTime;
    photoModel.url = photo.url;
    photoModel.cover = photo.cover;
    photoModel.thumbnail = photo.thumbnail;
    photoModel.isVideo = photo.isVideo || false;
    photoModel.updatedAt = new Date();

    _updatePhotosIndexes(photoModel, photosIndexes);

    photoModel.save(callback);
  }

  function _updatePhotosIndexes(photoModel, photosIndexes) {
    photosIndexes.total++;
    photosIndexes.dates[photoModel.shotTime] = photosIndexes.dates[photoModel.shotTime] || 0;
    photosIndexes.dates[photoModel.shotTime]++;
  }

  function _err(err) {
    $allonsy.outputWarning('allons-y-photos', 'indexer:' + err.message, {
      error: err
    });
  }

  function _index() {
    var PhotoModel = DependencyInjection.injector.controller.get('PhotoModel'),
        EntityModel = DependencyInjection.injector.controller.get('EntityModel'),
        photosThumbsFactory = DependencyInjection.injector.controller.get('photosThumbsFactory'),
        startDate = new Date(),
        count = 0,
        added = 0,
        updated = 0,
        photosIndexes = {
          dates: {},
          total: 0
        };

    _workingOutput(startDate, count, added, updated, '');

    var extensions = ['jpeg', 'jpg', 'gif', 'png', 'mp4'],
        files = $glob
          .sync(path.join(INDEXER_PATH, '/**/*.@(' + extensions.join('|') + '|' + extensions.map(function(ext) {
            return ext.toUpperCase();
          }).join('|') + ')'))
          .reverse();

    _workingOutput(startDate, count, added, updated, files.length);

    fs.ensureDirSync(destDir);

    async.eachSeries(files, function(file, nextFile) {
      file = path.resolve(file);

      _workingOutput(startDate, count, added, updated, files.length);
      count++;

      var stat = fs.statSync(file);

      if (!stat || !stat.mtime) {
        return nextFile();
      }

      var photo = {
        source: file,
        sourceModifiedAt: stat.mtime.getTime()
      };

      PhotoModel
        .findOrCreate({
          source: photo.source
        })
        .exec(function(err, photoModel) {
          if (err || !photoModel) {
            return nextFile();
          }

          if (photoModel.url && photoModel.sourceModifiedAt && photoModel.sourceModifiedAt == photo.sourceModifiedAt) {
            _updatePhotosIndexes(photoModel, photosIndexes);

            return nextFile();
          }

          if (photoModel.url) {
            updated++;
          }
          else {
            added++;
          }

          _exif(file, function(exif) {
            var dateDir = exif && exif['Create Date'] || exif['Media Create Date'] || null;

            if (dateDir) {
              dateDir = dateDir.split(' ')[0].replace(/:/g, '');
            }
            else {
              dateDir = stat.atime.toISOString().split('T')[0].replace(/-/g, '');

              if (!dateDir) {
                return nextFile();
              }
            }

            fs.ensureDirSync(path.join(destDir, dateDir));

            photo.url = '/photo/' + dateDir + '/' + path.basename(file),
            photo.shotDate = new Date(Date.UTC(dateDir.substr(0, 4), parseInt(dateDir.substr(4, 2), 10) - 1, dateDir.substr(6, 2)));
            photo.shotTime = photo.shotDate.getTime();

            if (path.extname(file).toLowerCase() == '.mp4') {
              photo.isVideo = true;
              photo.cover = path.basename(file).replace('.mp4', '-400x400.png');

              ffmpeg(file)
                .on('error', function() {
                  nextFile();
                })
                .on('end', function() {
                  photo.cover = '/media/photos/' + dateDir + '/' + photo.cover;
                  photo.thumbnail = photo.cover;

                  _savePhoto(photoModel, photo, photosIndexes, nextFile);
                })
                .screenshots({
                  count: 1,
                  size: '400x?',
                  folder: path.join(destDir, dateDir),
                  filename: photo.cover
                });

              return;
            }

            photosThumbsFactory(photo, dateDir, function() {
              _savePhoto(photoModel, photo, photosIndexes, nextFile);
            });

          });
        });
    }, function() {
      _workingOutput(startDate, count, added, updated, files.length);

      ExifService.stop();

      EntityModel
        .findOrCreate({
          entityType: 'photosIndexes'
        })
        .exec(function(err, photosIndexesModel) {
          if (err || !photosIndexesModel) {
            _err(err || new Error('no photosIndexes found'));

            return _workingOutput(startDate, files.length, added, updated, files.length, true);
          }

          photosIndexesModel.dates = photosIndexes.dates;
          photosIndexesModel.total = photosIndexes.total;

          photosIndexesModel.save(function() {
            _workingOutput(startDate, files.length, added, updated, files.length, true);
          });
        });
    });
  }

  function _infiniteLoop() {
    setTimeout(_infiniteLoop, 3600 * 1000 * 10);
  }

  $allonsy.requireInFeatures('models/realtime-service');
  $allonsy.requireInFeatures('models/models-database-service-back');
  $allonsy.requireInFeatures('models/models-abstract-service');
  $allonsy.requireInFeatures('models/i18n-service');

  require(path.resolve(__dirname, '../photos/models/photos-thumbs-factory-back.js'))();

  var $DatabaseService = DependencyInjection.injector.controller.get('$DatabaseService');

  $DatabaseService.initModels(false, function() {
    _index();

    _infiniteLoop();

    $done();
  });

};
