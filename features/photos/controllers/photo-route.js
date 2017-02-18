'use strict';

module.exports = {
  url: '/photo/:file',

  enter: [function() {
    window.page.stop();
    window.location.replace(window.location.href);
  }]
};
