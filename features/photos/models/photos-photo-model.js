module.exports = function() {
  'use strict';

  DependencyInjection.model('PhotoModel', function($AbstractModel, $RealTimeService) {

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
          }
        };

    return $AbstractModel('PhotoModel', function() {

      var extend = require('extend'),
          async = require('async');

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
          isVideo: 'boolean',
          moments: {
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
        },

        callPhotos: function($socket, eventName, args, callback, momentUpdated, socketOrigin) {
          eventName = eventName || 'photos';

          var sockets = $socket ? [$socket] : $RealTimeService.socketsFromOrigin(eventName);

          this
            .find()
            .sort({
              shotTime: 'desc'
            })
            .exec(function(err, photos) {
              if (err || !photos) {
                return callback();
              }

              var photosLength = 0,
                  videosLength = 0;

              photos = photos.map(function(photo) {
                if (photo.isVideo) {
                  videosLength++;
                }
                else {
                  photosLength++;
                }

                return {
                  cover: photo.cover,
                  shotTime: photo.shotTime,
                  isVideo: photo.isVideo,
                  thumbnail: photo.thumbnail,
                  url: photo.url,
                  moments: photo.moments
                };
              });

              var eventResult = {
                photosLength: photosLength,
                videosLength: videosLength,
                photos: photos
              };

              if (momentUpdated) {
                eventResult.momentUpdated = momentUpdated;
              }

              sockets.forEach(function(socket) {
                eventResult.isOrigin = socket == $socket || socket == socketOrigin || false;

                $RealTimeService.fire(eventName, eventResult, socket);
              });
            });
        },

        updateMoment: function($socket, name, photos) {
          var _this = this;

          this
            .find({
              url: photos
            })
            .exec(function(err, photos) {
              if (err || !photos || !photos.length) {
                return;
              }

              async.eachSeries(photos, function(photo, nextPhoto) {
                photo.moments = photo.moments || [];

                if (photo.moments.indexOf(name) > -1) {
                  return nextPhoto();
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
                  _this.callPhotos(null, null, null, null, name, $socket);
                });
              });

            });
        },

        deleteMoment: function($socket, name, photos) {
          var _this = this;

          this
            .find({
              url: photos
            })
            .exec(function(err, photos) {
              if (err || !photos || !photos.length) {
                return;
              }

              async.eachSeries(photos, function(photo, nextPhoto) {
                photo.moments = photo.moments || [];

                var index = photo.moments.indexOf(name);

                if (index < 0) {
                  return nextPhoto();
                }

                photo.moments.splice(index, 1);

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
                  _this.callPhotos(null, null, null, null, name, $socket);
                });
              });

            });
        }
      };

    });

  });

  return 'PhotoModel';
};
