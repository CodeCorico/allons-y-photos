'use strict';

module.exports = function($server) {
  var fs = require('fs');

  function _404(res) {
    res
      .status(404)
      .json({
        error: 'File not found'
      });
  }

  function _sendFile(req, res, url) {
    var PhotoModel = DependencyInjection.injector.controller.get('PhotoModel');

    PhotoModel
      .findOne({
        url: url
      })
      .exec(function(err, photo) {
        if (err || !photo || !fs.existsSync(photo.source)) {
          return _404(res);
        }

        res.sendFile(photo.source);
      });
  }

  $server.use('/photo', function(req, res) {
    _sendFile(req, res, '/photo' + decodeURI(req.path));
  });
};
