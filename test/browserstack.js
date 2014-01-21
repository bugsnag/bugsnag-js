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
  firefox3: {
    browser: 'Firefox',
    browser_version: '3.6',
    os: 'Windows',
    os_version: '7'
  },
  firefox4: {
    browser: 'Firefox',
    browser_version: '4',
    os: 'Windows',
    os_version: '7'
  },
  firefox5: {
    browser: 'Firefox',
    browser_version: '5',
    os: 'Windows',
    os_version: '7'
  },
  firefox6: {
    browser: 'Firefox',
    browser_version: '6',
    os: 'Windows',
    os_version: '7'
  },
  firefox7: {
    browser: 'Firefox',
    browser_version: '7',
    os: 'Windows',
    os_version: '7'
  },
  firefox8: {
    browser: 'Firefox',
    browser_version: '8',
    os: 'Windows',
    os_version: '7'
  },
  firefox10: {
    browser: 'Firefox',
    browser_version: '10',
    os: 'Windows',
    os_version: '7'
  },
  firefox16: {
    browser: 'Firefox',
    browser_version: '16',
    os: 'Windows',
    os_version: '7'
  },
  firefox17: {
    browser: 'Firefox',
    browser_version: '17',
    os: 'Windows',
    os_version: '7'
  },
  firefox20: {
    browser: 'Firefox',
    browser_version: '20',
    os: 'Windows',
    os_version: '7'
  },
  firefox24: {
    browser: 'Firefox',
    browser_version: '24',
    os: 'Windows',
    os_version: '7'
  },
  firefox26: {
    browser: 'Firefox',
    browser_version: '26.0',
    os: 'Windows',
    os_Version: '8'
  },
  opera10: {
    browser: 'Opera',
    browser_version: '10.6',
    os: 'Windows',
    os_version: '7'
  },
  opera12: {
    browser: 'Opera',
    browser_version: '12.16',
    os: 'Windows',
    os_version: '7'
  },
  chrome14: {
    browser: 'Chrome',
    browser_version: '14',
    os: 'Windows',
    version: '7'
  },
  chrome21: {
    browser: 'Chrome',
    browser_version: '21',
    os: 'Windows',
    version: '7'
  },
  chrome31: {
    browser: 'Chrome',
    browser_version: '31',
    os: 'Windows',
    version: '7'
  },
  iphone5s: {
    browserName: 'iPhone',
    platform: 'MAC',
    device: 'iPhone 5s'
  },
  iphone5: {
    browserName: 'iPhone',
    platform: 'MAC',
    device: 'iPhone 5'
  },
  iphone4s: {
    browserName: 'iPhone',
    platform: 'MAC',
    device: 'iPhone 4S'
  },
  android41: {
    browserName: 'android',
    platform: 'ANDROID',
    device: 'Samsung Galaxy Note II'
  },
  android40: {
    browserName: 'android',
    platform: 'ANDROID',
    device: 'HTC One X'
  }
};


// Input capabilities
var capabilities = browsers[process.argv[3]];
capabilities['browserstack.user'] = 'conrad10';
capabilities['browserstack.key'] = process.env.BROWSERSTACK_KEY || process.exit(console.log('no BROWSERSTACK_KEY set'));

var driver = new webdriver.Builder().
usingServer('http://hub.browserstack.com/wd/hub').
withCapabilities(capabilities).
build();

driver.get(process.argv[2]);
var tries = 0;

function check() {
  driver.getTitle().then(function(title) {
    if (title && title != 'Running') {
      console.log(title);
      driver.quit();
    } else if (tries < 10) {
      tries += 1;
      setTimeout(check, 1000);
    } else {
      driver.quit();
    }
  });
}
setTimeout(check, 1000);
