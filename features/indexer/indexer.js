'use strict';

module.exports = function($allonsy, $glob, $done) {

  var path = require('path'),
      fs = require('fs-extra'),
      async = require('async'),
      chokidar = require('chokidar'),
      ffmpeg = require('fluent-ffmpeg'),

      INDEXER_PATH = path.resolve(process.env.INDEXER_PATH),
      INDEXER_VIDEOS = !process.env.INDEXER_VIDEOS || process.env.INDEXER_VIDEOS == 'true',
      INDEXER_VIDEOS_COMPRESS = process.env.INDEXER_VIDEOS_COMPRESS && process.env.INDEXER_VIDEOS_COMPRESS == 'true',
      INDEXER_CONVERT_MOV = process.env.INDEXER_CONVERT_MOV && process.env.INDEXER_CONVERT_MOV == 'true',
      INDEXER_RECEIVER = process.env.INDEXER_RECEIVER ? path.join(process.env.INDEXER_RECEIVER, '*.@(jpeg|jpg|gif|png|mp4|mov)') : null,
      destDir = path.resolve('media/photos'),
      logFilePath = path.resolve('indexer.log'),
      _activityTimeout = null,
      _indexInProgress = false,
      _restart = false;

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

  function _workingOutput(startDate, count, added, updated, total, done, more) {
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
    (more || '') +
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
    photoModel.videoCache = photo.videoCache;
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

  function _indexDone() {
    _indexInProgress = false;

    if (_restart) {
      async.setImmediate(_index);
    }
  }

  function _extractDate(exif) {
    return exif && exif['Create Date'] && exif['Create Date'] != '0000:00:00 00:00:00' ? exif['Create Date'] : (
      exif && exif['Media Create Date'] && exif['Media Create Date'] != '0000:00:00 00:00:00' ? exif['Media Create Date'] :
      null
    );
  }

  function _moveNewPhotos(logFileOptions, useFunc, callback) {
    if (!INDEXER_RECEIVER) {
      return callback();
    }

    var files = $glob.sync(INDEXER_RECEIVER);

    if (!files || !files.length) {
      return callback();
    }

    useFunc();

    async.eachSeries(files, function(file, _nextFile) {
      file = path.resolve(file);

      function nextFile() {
        async.setImmediate(_nextFile);
      }

      _exif(file, function(exif) {
        var dateDir = _extractDate(exif);

        if (!dateDir) {
          _log(logFileOptions, 'can\'t move the photo from the watched path: ' + file);

          return nextFile();
        }

        dateDir = 'Photos ' + dateDir.split(' ')[0].replace(/:/g, '.');

        var destDir = path.join(INDEXER_PATH, dateDir);

        fs.ensureDirSync(destDir);

        fs.moveSync(file, path.join(destDir, path.basename(file)), {
          overwrite: true
        });

        nextFile();
      });

    }, function() {
      async.setImmediate(callback);
    });
  }

  function _index() {
    if (_indexInProgress) {
      _restart = true;

      return;
    }

    _indexInProgress = true;

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

    _moveNewPhotos(logFileOptions, function() {
      _workingOutput(startDate, count, added, updated, '', null, '(Moving new photos) ');
    }, function() {
      var extensions = ['jpeg', 'jpg', 'gif', 'png'];

      if (INDEXER_VIDEOS) {
        extensions.push('mp4');

        if (INDEXER_CONVERT_MOV) {
          extensions.push('mov');
        }
      }

      var files = $glob
            .sync(path.join(INDEXER_PATH, '/**/*.@(' + extensions.join('|') + '|' + extensions.map(function(ext) {
              return ext.toUpperCase();
            }).join('|') + ')'))
            .reverse(),
          photosRef = {},
          filesRef = {};

      _restart = false;

      _workingOutput(startDate, count, added, updated, files.length);

      fs.ensureDirSync(destDir);

      PhotoModel
        .find()
        .exec(function(err, photos) {
          if (err || !photos) {
            _log(logFileOptions, 'can\'t retrive the photos from the database');

            _workingOutput(startDate, files.length, added, updated, files.length, true);

            return _indexDone();
          }

          photos.forEach(function(photo) {
            photosRef[photo.source] = photo;
          });

          async.eachSeries(files, function(file, _nextFile) {
            file = path.resolve(file);

            function nextFile() {
              async.setImmediate(_nextFile);
            }

            _workingOutput(startDate, count, added, updated, files.length);
            count++;

            var stat = fs.statSync(file),
                ext = path.extname(file).toLowerCase(),
                isVideo = ext == '.mp4' || ext == '.mov',
                fileName = path.basename(file),
                dateDir = null,
                photo = null,
                photoModel = null,
                videoOnError = false,
                destPath = null,
                isVideoHorizontal = false;

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
                    '(Converting ' + (
                      progress.percent || progress.percent === 0 ? Math.max(0, Math.min(100, Math.round(progress.percent))) : 100
                    ) + '%) '
                  );
                })
                .on('end', function() {
                  file = newFile;
                  fileName = path.basename(file);
                  ext = '.mp4';

                  nextFunc();
                })
                .run();

            }, function(nextFunc) {
              if (!stat || !stat.mtime) {
                _log(logFileOptions, 'no stat found for: ' + file);

                return nextFile();
              }

              filesRef[file] = file;

              photo = {
                source: file,
                sourceModifiedAt: stat.mtime.getTime()
              };
              photoModel = photosRef[photo.source];

              if (photoModel && photoModel.sourceModifiedAt && photoModel.sourceModifiedAt == photo.sourceModifiedAt) {
                _updatePhotosIndexes(photoModel, photosIndexes);

                if (!photoModel.cover) {
                  _log(logFileOptions, 'photo not updated but with empty cover: ' + photo.source || photoModel.url);
                }

                return nextFile();
              }

              if (photoModel) {
                return nextFunc();
              }

              PhotoModel
                .create({
                  source: photo.source
                })
                .exec(function(err, model) {
                  if (err || !model) {
                    _log(logFileOptions, 'no photo model created for: ' + photo.source);

                    return nextFile();
                  }

                  photoModel = model;

                  nextFunc();
                });
            }, function(nextFunc) {
              if (photoModel.url) {
                updated++;
              }
              else {
                added++;
              }

              _exif(file, function(exif) {
                dateDir = _extractDate(exif);

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

                if (!isVideo) {
                  photosThumbsFactory(photo, dateDir, function() {
                    _savePhoto(photoModel, photo, photosIndexes, nextFile);
                  });

                  return;
                }

                ffmpeg.ffprobe(file, function(err, metadata) {
                  if (err || !metadata || !metadata.streams || !metadata.streams.length) {
                    _log(logFileOptions, 'can\'t get the metadata (with ffprobe) for: ' + photo.source);

                    videoOnError = true;

                    return nextFunc();
                  }

                  if (metadata.streams[0].rotation == '-90' || metadata.streams[0].rotation == '90') {
                    var width = metadata.streams[0].height;
                    metadata.streams[0].height = metadata.streams[0].width;
                    metadata.streams[0].width = width;
                  }

                  isVideoHorizontal = metadata.streams[0].width > metadata.streams[0].height;

                  destPath = path.join(destDir, dateDir);

                  var cover = fileName.replace('.mp4', '-120x120.png');

                  photo.isVideo = true;

                  if (fs.existsSync(path.join(destPath, cover))) {
                    return nextFunc();
                  }

                  ffmpeg(file)
                    .on('error', function() {
                      _log(logFileOptions, 'can\'t generate a thumbnail (with ffmpeg) for: ' + photo.source);

                      videoOnError = true;

                      nextFunc();
                    })
                    .on('end', function() {
                      photo.cover = '/media/photos/' + dateDir + '/' + cover;
                      photo.thumbnail = photo.cover;

                      nextFunc();
                    })
                    .screenshots({
                      count: 1,
                      size: '120x?',
                      folder: destPath,
                      filename: cover
                    });
                });
              });
            }, function(nextFunc) {
              var destCompressFileName = fileName.replace('.mp4', '-720p.mp4'),
                  destCompressFile = path.join(destPath, destCompressFileName);

              if (!INDEXER_VIDEOS_COMPRESS || fs.existsSync(destCompressFile)) {
                return nextFunc();
              }

              ffmpeg(file)
                .on('error', function() {
                  _log(logFileOptions, 'can\'t generate a compressed video (with ffmpeg) for: ' + photo.source);

                  videoOnError = true;

                  nextFunc();
                })
                .on('progress', function(progress) {
                  _workingOutput(startDate, count, added, updated, files.length, null,
                    '(Compressing ' + (
                      progress.percent || progress.percent === 0 ? Math.max(0, Math.min(100, Math.round(progress.percent))) : 100
                    ) + '%) '
                  );
                })
                .on('end', function() {
                  photo.videoCache = '/media/photos/' + dateDir + '/' + destCompressFileName;

                  nextFunc();
                })
                .size(isVideoHorizontal ? '1280x720' : '720x1280')
                .videoBitrate('4000k')
                .output(destCompressFile)
                .run();
            }, function() {
              if (videoOnError) {
                return nextFile();
              }

              _savePhoto(photoModel, photo, photosIndexes, nextFile);
            }]);
          }, function() {

            async.waterfall([function(nextFunc) {

              _workingOutput(startDate, count, added, updated, files.length);

              ExifService.stop();

              var toRemove = [];

              for (var i = 0; i < photos.length; i++) {
                if (!filesRef[photos[i].source]) {
                  toRemove.push(photos[i].id);
                }
              }

              if (!toRemove.length) {
                return nextFunc();
              }

              PhotoModel
                .destroy({
                  id: toRemove
                })
                .exec(function(err) {
                  if (err) {
                    _log(logFileOptions, 'can\'t clean photos models with no file');
                  }

                  nextFunc();
                });
            }, function() {

              EntityModel
                .findOrCreate({
                  entityType: 'photosIndexes'
                })
                .exec(function(err, photosIndexesModel) {
                  if (err || !photosIndexesModel) {
                    _log(logFileOptions, err && err.message || 'no photosIndexes found');

                    _workingOutput(startDate, files.length, added, updated, files.length, true);

                    return _indexDone();
                  }

                  photosIndexesModel.dates = photosIndexes.dates;
                  photosIndexesModel.total = photosIndexes.total;

                  photosIndexesModel.save(function() {
                    _workingOutput(startDate, files.length, added, updated, files.length, true);

                    $allonsy.sendMessage({
                      event: 'call(indexer/stop)'
                    });

                    _indexDone();
                  });
                });
            }]);
          });

        });
    });
  }

  function _infiniteLoop() {
    setTimeout(_infiniteLoop, 3600 * 1000 * 10);
  }

  function _activity() {
    clearTimeout(_activityTimeout);

    _activityTimeout = setTimeout(_index, 5000);
  }

  $allonsy.requireInFeatures('models/realtime-service');
  $allonsy.requireInFeatures('models/models-database-service-back');
  $allonsy.requireInFeatures('models/models-abstract-service');
  $allonsy.requireInFeatures('models/i18n-service');

  require(path.resolve(__dirname, '../photos/models/photos-thumbs-factory-back.js'))();

  var $DatabaseService = DependencyInjection.injector.controller.get('$DatabaseService');

  $DatabaseService.initModels(false, function() {
    $allonsy.outputInfo('► PHOTOS INDEXER IS RUNNING');

    if (!process.env.INDEXER_AT_START || process.env.INDEXER_AT_START == 'true') {
      _index();
    }

    if (INDEXER_RECEIVER) {
      chokidar
        .watch(INDEXER_RECEIVER, {
          persistent: true
        })
        .on('add', function() {
          _activity();
        })
        .on('change', function() {
          _activity();
        });
    }
    else {
      _infiniteLoop();
    }

    $done();
  });

};
