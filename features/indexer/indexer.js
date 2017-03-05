'use strict';

module.exports = function($allonsy, $glob, $done) {

  var path = require('path'),
      fs = require('fs-extra'),
      async = require('async'),
      ffmpeg = require('fluent-ffmpeg'),

      INDEXER_PATH = path.resolve(process.env.INDEXER_PATH),
      INDEXER_CONVERT_MOV = process.env.INDEXER_CONVERT_MOV && process.env.INDEXER_CONVERT_MOV == 'true',
      destDir = path.resolve('media/photos'),
      logFilePath = path.resolve('indexer.log');

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

  function _workingOutput(startDate, count, added, updated, total, done, converting) {
    var day = startDate.getDate(),
        months = startDate.getMonth() + 1,
        hours = startDate.getHours(),
        minutes = startDate.getMinutes();

    day = day > 9 ? day : '0' + day;
    months = months > 9 ? months : '0' + months;
    hours = hours > 9 ? hours : '0' + hours;
    minutes = minutes > 9 ? minutes : '0' + minutes;

    $allonsy.outputInfo('[' + (done ? 'done' : 'working') + ':indexer]► [' +
      day + '/' + months + '/' + startDate.getFullYear() + ' ' + hours + ':' + minutes +
    '] Indexer: ' + count + (total ? '/' + total : '') + ' (+' + added + ', ~' + updated + ') ' +
    (converting || converting === 0 ? '(Converting ' + converting + '%) ' : '') +
    '(' + (done ? 'in ' : '') + _elaspedTime(startDate) + ')');
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

  function _log(logFileOptions, text) {
    if (!logFileOptions.append) {
      logFileOptions.append = true;

      fs.writeFileSync(logFilePath, text);
    }
    else {
      fs.appendFileSync(logFilePath, '\n' + text);
    }
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
        },
        logFileOptions = {};

    _workingOutput(startDate, count, added, updated, '');

    var extensions = ['jpeg', 'jpg', 'gif', 'png', 'mp4'];

    if (INDEXER_CONVERT_MOV) {
      extensions.push('mov');
    }

    var files = $glob
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

      var stat = fs.statSync(file),
          ext = path.extname(file).toLowerCase(),
          isVideo = ext == '.mp4' || ext == '.mov',
          fileName = path.basename(file);

      if (ext == '.mov' && fs.existsSync(file.replace('.mov', '.mp4'))) {
        return nextFile();
      }

      async.waterfall([function(nextFunc) {
        if (!isVideo || ext != '.mov') {
          return nextFunc();
        }

        var newFile = file.replace('.mov', '.mp4');

        _workingOutput(startDate, count, added, updated, files.length, null, 0);

        ffmpeg(file)
          .videoCodec('libx264')
          .output(newFile)
          .on('error', function() {
            _log(logFileOptions, 'can\'t convert the .mov format (with ffmpeg) for: ' + file);

            nextFile();
          })
          .on('progress', function(progress) {
            _workingOutput(startDate, count, added, updated, files.length, null,
              progress.percent || progress.percent === 0 ? Math.max(0, Math.min(100, Math.round(progress.percent))) : 100
            );
          })
          .on('end', function() {
            file = newFile;
            fileName = path.basename(file);
            ext = '.mp4';

            nextFunc();
          })
          .run();

      }, function() {
        if (!stat || !stat.mtime) {
          _log(logFileOptions, 'no stat found for: ' + file);

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
              _log(logFileOptions, 'no photo model created for: ' + photo.source);

              return nextFile();
            }

            if (photoModel.url && photoModel.sourceModifiedAt && photoModel.sourceModifiedAt == photo.sourceModifiedAt) {
              _updatePhotosIndexes(photoModel, photosIndexes);

              if (!photoModel.cover) {
                _log(logFileOptions, 'photo not updated but with empty cover: ' + photo.source || photoModel.url);
              }

              return nextFile();
            }

            if (photoModel.url) {
              updated++;
            }
            else {
              added++;
            }

            _exif(file, function(exif) {
              var dateDir =
                    exif && exif['Create Date'] && exif['Create Date'] != '0000:00:00 00:00:00' ? exif['Create Date'] : (
                    exif && exif['Media Create Date'] && exif['Media Create Date'] != '0000:00:00 00:00:00' ? exif['Media Create Date'] :
                    null
                  );

              if (dateDir) {
                dateDir = dateDir.split(' ')[0].replace(/:/g, '');
              }
              else {
                if (isVideo && fileName.length > 11 && fileName.substr(0, 3) == 'WP_') {
                  var dateTemp = fileName.substr(3, 8);

                  if (parseInt(dateTemp, 10) == dateTemp) {
                    dateDir = dateTemp;
                  }
                }

                if (!dateDir) {
                  _log(logFileOptions, 'no "Create Date" found for: ' + photo.source);

                  dateDir = stat.atime.toISOString().split('T')[0].replace(/-/g, '');
                }

                if (!dateDir) {
                  _log(logFileOptions, 'no final date found for: ' + photo.source);

                  return nextFile();
                }
              }

              fs.ensureDirSync(path.join(destDir, dateDir));

              photo.url = '/photo/' + dateDir + '/' + fileName,
              photo.shotDate = new Date(Date.UTC(dateDir.substr(0, 4), parseInt(dateDir.substr(4, 2), 10) - 1, dateDir.substr(6, 2)));
              photo.shotTime = photo.shotDate.getTime();

              if (isVideo) {
                photo.isVideo = true;
                photo.cover = fileName.replace('.mp4', '-400x400.png');

                ffmpeg(file)
                  .on('error', function() {
                    _log(logFileOptions, 'can\'t generate a thumbnail (with ffmpeg) for: ' + photo.source);

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
      }]);
    }, function() {
      _workingOutput(startDate, count, added, updated, files.length);

      ExifService.stop();

      EntityModel
        .findOrCreate({
          entityType: 'photosIndexes'
        })
        .exec(function(err, photosIndexesModel) {
          if (err || !photosIndexesModel) {
            _log(logFileOptions, err && err.message || 'no photosIndexes found');

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
