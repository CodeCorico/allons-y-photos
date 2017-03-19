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
      names: ['object'],
      photos: ['object']
    })) {
      return;
    }

    if (!$message.names.length) {
      return;
    }

    if (!$message.photos.length) {
      return;
    }

    PhotoModel.deleteMoment($socket, $message.names, $message.photos);
  }
}, {
  event: 'update(photos/people)',
  permissions: ['photos-people'],
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

    PhotoModel.updatePeople($socket, $message.name, $message.photos);
  }
}, {
  event: 'delete(photos/people)',
  permissions: ['photos-people'],
  controller: function($socket, PhotoModel, $message) {
    if (!this.validMessage($message, {
      photos: ['object']
    })) {
      return;
    }

    if (!$message.photos.length) {
      return;
    }

    PhotoModel.deletePeople($socket, $message.photos);
  }
}, {
  event: 'update(photos/avatar)',
  permissions: ['photos-people'],
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

    PhotoModel.updateAvatar($socket, $message.name, $message.photos);
  }
}, {
  event: 'update(photos/hidden)',
  permissions: ['photos-hidden'],
  controller: function($socket, PhotoModel, $message) {
    if (!this.validMessage($message, {
      photos: ['object']
    })) {
      return;
    }

    if (!$message.photos.length) {
      return;
    }

    PhotoModel.hideShow($socket, $message.photos);
  }
}];
