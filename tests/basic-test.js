#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
path = require('path'),
assert = require('assert'),
utils = require('./lib/utils.js'),
runner = require('./lib/runner.js'),
testSetup = require('./lib/test-setup.js'),
injector = require('./lib/injector.js');

var browser;

runner.run(module, {
  "setup": function(done) {
    testSetup.setup({browsers: 1, personatestusers: 2}, function(err, fixtures) {
      browser = fixtures.browsers[0];
      done(err);
    });
  },
  "create a new selenium session": function(done) {
    browser.newSession(testSetup.sessionOpts, done);
  },
  "load github login screen": function(done) {
    browser.get("https://github.com/login", done);
  },
  "inject detector javascript and cause it to run": function(done) {
    injector.injectVault(browser, function(err, val) {
      assert.equal(null, err);
      injector.injectFile(browser, path.join(__dirname, "browser-harness.js"), function(err, val) {
        assert.equal(null, err);
        done();
      });
    });
  },
  "verify elements were detected in page": function(done) {
    browser.find(".mozVaultDetectedLoginField", function(err, elem) {
      assert.ok(!err);
      assert.ok(elem);
      browser.find(".mozVaultDetectedPasswordField", function(err, elem) {
        assert.ok(!err);
        assert.ok(elem);
        browser.find(".mozVaultDetectedSubmitButton", function(err, elem) {
          assert.ok(!err);
          assert.ok(elem);
          done();
        });
      });
    });
  },
  "mfb tear down browser": function(done) {
    browser.quit(done);
  }
});
