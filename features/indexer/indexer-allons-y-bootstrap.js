'use strict';

var path = require('path');

module.exports = {
  liveCommands: [!process.env.INDEXER || process.env.INDEXER == 'true' ? {
    commands: 'photos',
    description: 'execute the photos indexer immediately',
    action: require(path.resolve(__dirname, 'indexer-live-commands.js'))
  } : null]
};

