'use strict';

module.exports = {
  url: '/photos',

  enter: [
    '$FaviconService', '$BodyDataService', '$Page', '$i18nService', '$Layout', '$next',
  function($FaviconService, $BodyDataService, $Page, $i18nService, $Layout, $next) {
    var $PhotosService = DependencyInjection.injector.view.get('$PhotosService', true);
    if ($PhotosService && $PhotosService.isInit()) {
      return;
    }

    var user = $BodyDataService.data('user');

    if (user.permissionsPublic.indexOf('photos-access') < 0) {
      return $next();
    }

    document.title = $i18nService._('Photos') + ' - ' + $Page.get('web').brand;
    $FaviconService.update('/public/photos/favicon.png');

    $Layout.selectApp('Photos', false);

    var $PhotosService = null;

    setTimeout(function() {
      require('/public/photos/photos-service.js')
        .then(function() {
          $PhotosService = DependencyInjection.injector.view.get('$PhotosService');

          return $PhotosService.init();
        })
        .then(function() {
          return $Page.require('photos-viewer');
        })
        .then(function() {
          $Page.leftButtonAdd('photos-nav', {
            icon: 'fa fa-calendar',
            group: 'group-photos-nav',
            autoOpen: 'main',
            beforeGroup: function(context, $group, userBehavior, callback) {
              context.require('photos-nav').then(callback);
            }
          });

          $Page.rightButtonAdd('photos-select', {
            type: 'indicator',
            image: '/public/photos/photos-pointer.png',
            ready: function(button) {
              $PhotosService.config('selectButton', button);
            },
            action: function() {
              $PhotosService.toggleSelectionMode();
            }
          });

          $Layout.require('photos-layout');
        });
    });
  }],

  exit: ['$next', '$Page', '$Layout', '$PhotosService', function($next, $Page, $Layout, $PhotosService) {
    if (window.location.pathname.indexOf('/photos') === 0) {
      return $next();
    }

    $Layout.leftContext().closeIfGroupOpened('group-photos-nav');
    $Page.leftButtonRemove('photos-nav');
    $Page.rightButtonRemove('photos-select');

    $PhotosService.teardown(null, $next);
  }]
};
