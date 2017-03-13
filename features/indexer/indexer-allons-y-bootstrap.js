'use strict';

var path = require('path');

module.exports = {
  bootstrap: function($allonsy, $options, $done) {
    if ((!process.env.INDEXER || process.env.INDEXER == 'true') && $options.owner == 'start') {
      $allonsy.on('message', function(args) {
        if (args.event == 'call(indexer/stop)') {
          $allonsy.sendMessage({
            event: 'call(indexer/stopped)'
          });
        }
      });
    }

    $done();
  },
  liveCommands: [!process.env.INDEXER || process.env.INDEXER == 'true' ? {
    commands: 'photos',
    description: 'execute the photos indexer immediately',
    action: require(path.resolve(__dirname, 'indexer-live-commands.js'))
  } : null]
};

