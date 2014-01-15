var webdriver = require('browserstack-webdriver');

browsers = {
  ie6: {
    browser: 'IE',
    browser_version: '6.0',
    os: 'Windows',
    os_version: 'XP'
  },
  ie7: {
    browser: 'IE',
    browser_version: '7.0',
    os: 'Windows',
    os_version: 'XP'
  },
  ie8: {
    browser: 'IE',
    browser_version: '8.0',
    os: 'Windows',
    os_version: '7'
  },
  ie9: {
    browser: 'IE',
    browser_version: '9.0',
    os: 'Windows',
    os_version: '7'
  },
  ie10: {
    browser: 'IE',
    browser_version: '10.0',
    os: 'Windows',
    os_version: '7'
  },
  ie11: {
    browser: 'IE',
    browser_version: '11.0',
    os: 'Windows',
    os_version: '7'
  },
  safari5: {
    browser: 'Safari',
    browser_version: '5.1',
    os: 'OS X',
    os_version: 'Snow Leopard'
  },
  safari6: {
    browser: 'Safari',
    browser_version: '6.0',
    os: 'OS X',
    os_version: 'Lion'
  },
  safari7: {
    browser: 'Safari',
    browser_version: '7.0',
    os: 'OS X',
    os_version: 'Mavericks'
  },
  firefox: {
    browser: 'Firefox',
    browser_version: '26.0',
    os: 'Windows',
    os_Version: '8'
  }
};


// Input capabilities
var capabilities = browsers[process.argv[2]];
capabilities['browserstack.user'] = 'conrad10';
capabilities['browserstack.key'] = process.env.BROWSERSTACK_KEY || process.exit(console.log('no BROWSERSTACK_KEY set'));

var driver = new webdriver.Builder().
usingServer('http://hub.browserstack.com/wd/hub').
withCapabilities(capabilities).
build();

driver.get('http://jelzo.com:6123/bugsnag/');
var tries = 0;

function check() {
  driver.getTitle().then(function(title) {
    if (title) {
      console.log(title);
      driver.quit();
    } else if (tries < 10) {
      console.log(".");
      tries += 1;
      setTimeout(check, 1000);
    } else {
      driver.quit();
    }
  });
}
setTimeout(check, 1000);
