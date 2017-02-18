'use strict';

var path = require('path');

module.exports = {
  name: 'Allons-y Photos Indexer',
  enabled: !process.env.INDEXER || process.env.INDEXER == 'true' || false,
  fork: true,
  forkCount: 1,
  forkMaxRestarts: 10,
  module: require(path.resolve(__dirname, 'indexer.js'))
};
