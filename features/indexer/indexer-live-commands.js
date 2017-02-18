'use strict';

module.exports = function($allonsy) {
  $allonsy.outputInfo('► photos:\n');

  $allonsy.sendMessage({
    event: 'call(indexer/start)'
  });
};
