const
Q = require('q'),
saucePlatforms = require('./sauce-platforms.js'),
wd = require('wd'),
_ = require('underscore');

require('./wd-extensions.js');

var testSetup = {};

const TEST_TAG = "detector";

// startup determines if browser sessions will be local or use saucelabs.
// should only be called once per session (potentially, once for many tests)
//
// saucelabs is used if:
//  - opts include sauceUser and sauceApiKey or
//  - env vars include PERSONA_SAUCE_USER and PERSONA_SAUCE_APIKEY
//
// opts may also include
//  - platform (a browser from the list in lib/sauce_platforms)
//  - desiredCapabilities (see json wire protocol for list of capabilities)
// env var equivalents are PERSONA_BROWSER and PERSONA_BROWSER_CAPABILITIES
testSetup.startup = function(opts) {
  opts = opts || {};
  _setSessionOpts(opts);

  var sauceUser = opts.sauceUser || process.env['PERSONA_SAUCE_USER'],
    sauceApiKey = opts.sauceApiKey || process.env['PERSONA_SAUCE_APIKEY'],
    browser;

  if (sauceUser && sauceApiKey) {
    browser = wd.remote('ondemand.saucelabs.com', 80, sauceUser, sauceApiKey);
    browser.on('status', function(info){
      // using console.error so we don't mix up plain text with junitxml
      info = info.trim();
      // for the first message, let's print out a URL that can be loaded
      // rather an opaque status message.
      if (info.split(" ")[0] == "Driving") {
        var url = "https://saucelabs.com/tests/" + info.split(" ")[5];
        console.error('\n\x1b[36m%s\x1b[0m: %s\n', "Running", url);
      } else {
        console.error('\n\x1b[36m%s\x1b[0m\n', info);
      }
    });
    if (process.env['DEBUG_TESTS']) {
      browser.on('command', function(method, path){
        console.log(method, path);
      });
    };
  } else {
    browser = wd.remote();
  }

  var id = testSetup.browsers.push(browser);
  return id - 1;
}

// store multiple browsers until we can switch between sessions via d
testSetup.browsers = []

// these session opts aren't needed until the user requests a session via newSession()
// but we harvest them from the command line at startup time
function _setSessionOpts(opts) {
  opts = opts || {};
  var sessionOpts = {};

  // check for typos: throw error if requestedPlatform not found in list of supported sauce platforms
  var requestedPlatform = opts.platform || process.env['PERSONA_BROWSER'];
  if (requestedPlatform && !saucePlatforms.platforms[requestedPlatform]) {
    throw new Error('requested platform ' + requestedPlatform +
                    ' not found in list of available platforms');
  }
  // Default to chrome which does not need a version number.
  var defaultPlatform = { browserName: 'chrome', platform: 'VISTA' };
  var platform = requestedPlatform ? saucePlatforms.platforms[requestedPlatform] : defaultPlatform;

  // add platform, browserName, version to session opts
  _.extend(sessionOpts, platform);

  // pull the default desired capabilities out of the sauce-platforms file
  // overwrite if specified by user
  var desiredCapabilities = opts.desiredCapabilities || process.env['PERSONA_BROWSER_CAPABILITIES'] || {};
  _.extend(sessionOpts, saucePlatforms.defaultCapabilities);
  _.extend(sessionOpts, desiredCapabilities);

  if (sessionOpts.browserName === 'opera' && !sessionOpts.proxy) {
    // TODO reportedly works for opera; investigate
    sessionOpts.proxy = { proxyType: 'direct' };
  }

  // Ensure there is a tag.
  sessionOpts.tags = sessionOpts.tags || [];
  if (sessionOpts.tags.indexOf(TEST_TAG) === -1) {
    sessionOpts.tags.push(TEST_TAG);
  }

  sessionOpts.public = sessionOpts.public || true;

  testSetup.sessionOpts = sessionOpts;
}

// opts could be of the form:
// { browsers: 2 }
// or of the form
// { b:2 }
// just be polite and don't mix the two.
//
// cb could be of the form:
// function(err, fixtures) {
//   // either these are global or you declared them in outer scope
//   browser = fixtures.browsers[0];
//   secondBrowser = fixtures.browsers[1];
// }
testSetup.setup = function(opts, cb) {
  var fixtures = {},
    browsers = opts.browsers || opts.b,
    promises = [];

  // no need to return a promise, just fire the cb when ready
  if (promises) {
    Q.all(promises)
      .then(function() {
        fixtures = setupBrowsers(browsers, fixtures);
        cb(null, fixtures);
      })
      .fail(function(error) { cb(error) });
  } else {
    fixtures = setupBrowsers(browsers, fixtures);
    cb(null, fixtures)
  }
}

function setupBrowsers(browserCount, out) {
  for (var i = 0; i < browserCount; i++) { testSetup.startup() }
  // just use the browsers array directly
  out.b = out.browsers = testSetup.browsers;
  return out;
}

module.exports = testSetup;
