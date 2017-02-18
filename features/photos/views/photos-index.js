(function() {
  'use strict';

  window.bootstrap([
    '$Page', '$BodyDataService', '$i18nService', '$done',
  function($Page, $BodyDataService, $i18nService, $done) {
    var _user = $BodyDataService.data('user') || null;

    if (_user && _user.permissionsPublic && _user.permissionsPublic.indexOf('photos-access') > -1) {
      $Page.push('apps', {
        name: $i18nService._('Photos'),
        select: function() {
          window.page('/photos');
        }
      });
    }

    $done();
  }]);

})();
