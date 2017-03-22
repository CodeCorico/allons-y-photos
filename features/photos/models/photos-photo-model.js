module.exports = function() {
  'use strict';

  DependencyInjection.model('PhotoModel', function($allonsy, $AbstractModel, $RealTimeService) {

    var REALTIME_EVENTS = {
          photos: {
            permissions: ['photos-access'],
            call: 'callPhotos'
          }
        },
        PERMISSIONS = {
          'photos-access': {
            title: 'Access to the Photos app',
            description: 'Access to the Photos app.',
            isPublic: true
          },
          'photos-moments': {
            title: 'Moments administration',
            description: 'Moments administration of the Photos app.',
            isPublic: true
          },
          'photos-people': {
            title: 'People administration',
            description: 'People administration of the Photos app.',
            isPublic: true
          },
          'photos-hidden': {
            title: 'Hidden photos',
            description: 'Hidden photos administration.',
            isPublic: true
          }
        };

    return $AbstractModel('PhotoModel', function() {

      var extend = require('extend'),
          async = require('async'),
          fs = require('fs-extra'),
          path = require('path'),
          _mediaFolder = path.resolve('media'),
          _photosCache = null,
          _photosWithoutHiddenCache = null;

      return {
        identity: 'photos',
        entities: true,
        entityType: 'photo',
        isSearchable: true,
        isSearchableAdvanced: true,
        attributes: {
          shotDate: {
            type: 'date',
            index: true
          },
          shotTime: {
            type: 'integer',
            index: true
          },
          sourceModifiedAt: 'integer',
          name: {
            type: 'string',
            index: true
          },
          source: {
            type: 'string',
            index: true
          },
          url: {
            type: 'string',
            index: true
          },
          cover: 'string',
          videoCache: 'string',
          isHidden: 'boolean',
          isVideo: 'boolean',
          moments: {
            type: 'array',
            index: true
          },
          people: {
            type: 'array',
            index: true
          },

          publicData: function(moreData, remove) {
            var photo = this.toJSON();

            delete photo.isSearchable;
            delete photo.isSearchableAdvanced;
            delete photo.entityType;

            if (moreData) {
              extend(true, photo, moreData);
            }

            if (remove) {
              remove.forEach(function(removeKey) {
                delete photo[removeKey];
              });
            }

            return photo;
          }
        },

        init: function() {
          var _this = this,
              GroupModel = DependencyInjection.injector.model.get('GroupModel'),
              $RealTimeService = DependencyInjection.injector.model.get('$RealTimeService');

          GroupModel.registerPermissions(PERMISSIONS);

          Object.keys(REALTIME_EVENTS).forEach(function(eventName) {
            if (REALTIME_EVENTS[eventName].call) {
              var call = REALTIME_EVENTS[eventName].call;

              REALTIME_EVENTS[eventName].call = function() {
                _this[call].apply(_this, arguments);
              };
            }
          });

          $RealTimeService.registerEvents(REALTIME_EVENTS);

          $allonsy.on('message', function(args) {
            if (args.event == 'call(indexer/stopped)') {
              _this.clearPhotosCache();
            }
          });
        },

        clearPhotosCache: function() {
          _photosCache = null;
          _photosWithoutHiddenCache = null;
        },

        callPhotos: function($socket, eventName, args, callback, addOnly, socketOrigin) {
          eventName = eventName || 'photos';

          if (_photosCache && $socket && $socket.user.hasPermission('photos-hidden')) {
            return $RealTimeService.fire(eventName, _photosCache, $socket);
          }
          else if (_photosWithoutHiddenCache && $socket && !$socket.user.hasPermission('photos-hidden')) {
            return $RealTimeService.fire(eventName, _photosWithoutHiddenCache, $socket);
          }

          var sockets = $socket ? [$socket] : $RealTimeService.socketsFromOrigin(eventName);

          this
            .find({
              select: ['cover', 'videoCache', 'shotTime', 'isHidden', 'isVideo', 'thumbnail', 'url', 'moments', 'people']
            })
            .sort({
              shotTime: 'desc',
              source: 'asc'
            })
            .exec(function(err, photos) {
              if (err || !photos) {
                return callback();
              }

              var photosLength = 0,
                  videosLength = 0,
                  photosWithoutHidden = [];

              photos = photos.map(function(photo) {
                if (photo.isVideo) {
                  videosLength++;
                }
                else {
                  photosLength++;
                }

                photo = {
                  cover: photo.cover,
                  videoCache: photo.videoCache,
                  shotTime: photo.shotTime,
                  isHidden: photo.isHidden,
                  isVideo: photo.isVideo,
                  thumbnail: photo.thumbnail,
                  url: photo.url,
                  moments: photo.moments,
                  people: photo.people
                };

                if (!photo.isHidden) {
                  photosWithoutHidden.push(photo);
                }

                return photo;
              });

              _photosCache = {
                photosLength: photosLength,
                videosLength: videosLength,
                photos: photos
              };

              _photosWithoutHiddenCache = {
                photosLength: photosLength,
                videosLength: videosLength,
                photos: photosWithoutHidden
              };

              sockets.forEach(function(socket) {
                var eventResult = socket.user.hasPermission('photos-hidden') ? _photosCache : _photosWithoutHiddenCache;

                eventResult.isOrigin = socket == $socket || socket == socketOrigin || false;
                eventResult.addOnly = addOnly || false;

                $RealTimeService.fire(eventName, eventResult, socket);
              });
            });
        },

        updateMoment: function($socket, name, photos) {
          var _this = this,
              nameFormatted = name.toLowerCase();

          this
            .find({
              select: ['id', 'moments'],
              where: {
                url: photos
              }
            })
            .exec(function(err, photos) {
              if (err || !photos || !photos.length) {
                return;
              }

              async.eachSeries(photos, function(photo, nextPhoto) {
                photo.moments = photo.moments || [];

                for (var i = 0; i < photo.moments.length; i++) {
                  if (photo.moments[i].toLowerCase() == nameFormatted) {
                    return nextPhoto();
                  }
                }

                photo.moments.push(name);

                _this
                  .update({
                    id: photo.id
                  }, {
                    moments: photo.moments
                  })
                  .exec(function() {
                    nextPhoto();
                  });
              }, function() {
                setTimeout(function() {
                  _this.clearPhotosCache();

                  _this.callPhotos(null, null, null, null, true, $socket);
                });
              });
            });
        },

        deleteMoment: function($socket, names, photos) {
          var _this = this;

          this
            .find({
              select: ['id', 'moments'],
              where: {
                url: photos
              }
            })
            .exec(function(err, photos) {
              if (err || !photos || !photos.length) {
                return;
              }

              async.eachSeries(photos, function(photo, nextPhoto) {
                photo.moments = photo.moments || [];

                var hasRemoved = false;

                names.forEach(function(name) {
                  var nameFormatted = name.toLowerCase(),
                      index = -1;

                  for (var i = 0; i < photo.moments.length; i++) {
                    if (photo.moments[i].toLowerCase() == nameFormatted) {
                      index = i;

                      break;
                    }
                  }

                  if (index > -1) {
                    photo.moments.splice(index, 1);

                    hasRemoved = true;
                  }
                });

                if (!hasRemoved) {
                  return nextPhoto();
                }

                _this
                  .update({
                    id: photo.id
                  }, {
                    moments: photo.moments
                  })
                  .exec(function() {
                    nextPhoto();
                  });
              }, function() {
                setTimeout(function() {
                  _this.clearPhotosCache();

                  _this.callPhotos();
                });
              });

            });
        },

        updatePeople: function($socket, name, photos) {
          var _this = this,
              nameFormatted = name.toLowerCase();

          this
            .find({
              select: ['id', 'people'],
              where: {
                url: photos
              }
            })
            .exec(function(err, photos) {
              if (err || !photos || !photos.length) {
                return;
              }

              async.eachSeries(photos, function(photo, nextPhoto) {
                photo.people = photo.people || [];

                for (var i = 0; i < photo.people.length; i++) {
                  if (photo.people[i].toLowerCase() == nameFormatted) {
                    return nextPhoto();
                  }
                }

                if (photo.people.indexOf(name) > -1) {
                  return nextPhoto();
                }

                photo.people.push(name);

                _this
                  .update({
                    id: photo.id
                  }, {
                    people: photo.people
                  })
                  .exec(function() {
                    nextPhoto();
                  });
              }, function() {
                var identityFile = path.join(_mediaFolder, 'photos/people/' + name + '.jpg');

                if (!fs.existsSync(identityFile)) {
                  fs.copySync(path.resolve(__dirname, '../views/resources/identity.jpg'), identityFile);
                }

                setTimeout(function() {
                  _this.clearPhotosCache();

                  _this.callPhotos(null, null, null, null, true, $socket);
                });
              });

            });
        },

        deletePeople: function($socket, photos) {
          var _this = this;

          this
            .find({
              select: ['id', 'people'],
              where: {
                url: photos
              }
            })
            .exec(function(err, photos) {
              if (err || !photos || !photos.length) {
                return;
              }

              async.eachSeries(photos, function(photo, nextPhoto) {
                if (!photo.people || !photo.people.length) {
                  return nextPhoto();
                }

                photo.people = [];

                _this
                  .update({
                    id: photo.id
                  }, {
                    people: photo.people
                  })
                  .exec(function() {
                    nextPhoto();
                  });
              }, function() {
                setTimeout(function() {
                  _this.clearPhotosCache();

                  _this.callPhotos();
                });
              });

            });
        },

        updateAvatar: function($socket, name, photos) {
          this
            .findOne({
              select: ['id', 'cover'],
              where: {
                url: photos[0]
              }
            })
            .exec(function(err, photo) {
              if (err || !photo) {
                return;
              }

              var identityFile = path.join(_mediaFolder, 'photos/people/' + name + '.jpg'),
                  sourceFile = path.join(_mediaFolder, photo.cover.replace('/media/', ''));

              fs.copySync(sourceFile, identityFile);

              $socket.emit('read(photos/avatar)', {
                name: name
              });
            });
        },

        hideShow: function($socket, photos) {
          var _this = this;

          this
            .find({
              select: ['id', 'isHidden'],
              where: {
                url: photos
              }
            })
            .exec(function(err, photos) {
              if (err || !photos) {
                return;
              }

              async.eachSeries(photos, function(photo, nextPhoto) {
                photo.isHidden = !photo.isHidden;

                _this
                  .update({
                    id: photo.id
                  }, {
                    isHidden: photo.isHidden
                  })
                  .exec(function() {
                    nextPhoto();
                  });
              }, function() {
                setTimeout(function() {
                  _this.clearPhotosCache();

                  _this.callPhotos();
                });
              });
            });
        }
      };

    });

  });

  return 'PhotoModel';
};
