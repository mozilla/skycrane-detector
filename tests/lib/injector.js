var fs = require('fs'),
  path = require('path');

exports.injectVault = function(browser, cb) {
  exports.injectFile(browser, path.join(__dirname, "..", "..", "detector.js"), cb);
};

exports.injectFile = function(browser, file, cb) {
  fs.readFile(file, function(err, contents) {
    if (err) return cb(err);
    browser.eval(contents, cb);
  });
};
