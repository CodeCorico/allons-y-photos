'use strict';

module.exports = [{
  event: 'update(photos/moment)',
  permissions: ['photos-moments'],
  controller: function($socket, PhotoModel, $message) {
    if (!this.validMessage($message, {
      name: ['string', 'filled'],
      photos: ['object']
    })) {
      return;
    }

    if (!$message.photos.length) {
      return;
    }

    PhotoModel.updateMoment($socket, $message.name, $message.photos);
  }
}, {
  event: 'delete(photos/moment)',
  permissions: ['photos-moments'],
  controller: function($socket, PhotoModel, $message) {
    if (!this.validMessage($message, {
      name: ['string', 'filled'],
      photos: ['object']
    })) {
      return;
    }

    if (!$message.photos.length) {
      return;
    }

    PhotoModel.deleteMoment($socket, $message.name, $message.photos);
  }
}];
