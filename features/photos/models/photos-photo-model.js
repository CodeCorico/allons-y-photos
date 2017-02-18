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

      var extend = require('extend');

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

        callPhotos: function($socket, eventName, args, callback) {
          eventName = eventName || 'photos';

          this
            .find()
            .sort({
              shotTime: 'desc'
            })
            .exec(function(err, photos) {
              if (err || !photos) {
                return callback();
              }

              photos = photos.map(function(photo) {
                return {
                  cover: photo.cover,
                  shotTime: photo.shotTime,
                  isVideo: photo.isVideo,
                  thumbnail: photo.thumbnail,
                  url: photo.url
                }
              });

              $RealTimeService.fire(eventName, {
                photos: photos
              }, $socket);
            });
        }
      };

    });

  });

  return 'PhotoModel';
};
