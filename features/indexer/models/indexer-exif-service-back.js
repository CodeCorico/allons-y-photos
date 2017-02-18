'use strict';

module.exports = function() {

  DependencyInjection.model('ExifService', function() {

    return new (function() {

      var _this = this,
          _exifSpawn = null,
          _scanCallback = null,
          _response = '';

      this.start = function() {
        if (_exifSpawn) {
          return;
        }

        var spawn = require('child_process').spawn,
            spawnWith = {
              stdio: ['pipe', 'pipe', 'pipe', 'ipc']
            };

        _exifSpawn = spawn('exiftool', ['-stay_open', 'true', '-@', '-'], spawnWith);

        _exifSpawn.stdout.on('data', function(data) {
          data = data.toString();

          _response += data;

          if (data.indexOf('{ready}') > -1) {
            _response = _response.replace('{ready}', '');

            var tags = {},
                lines = _response.split('\n');

            lines.forEach(function(line) {
              if (!line || line.indexOf(':') < 0) {
                return;
              }

              line = line.split(':');
              var key = line.shift().trim();

              tags[key] = line.join(':').trim();
            });

            if (_scanCallback) {
              _scanCallback(tags);
            }

            _response = '';
          }
        });

        _exifSpawn.on('exit', function() {
          _exifSpawn = null;
        });
      };

      this.scan = function(filePath, callback) {
        if (!_exifSpawn) {
          _this.start();
        }

        _scanCallback = callback;

        _exifSpawn.stdin.write(filePath + '\n-execute\n');
      };

      this.stop = function() {
        if (_exifSpawn) {
          _exifSpawn.stdin.end();
          _exifSpawn.kill();
        }
      };

    })();

  });

};
