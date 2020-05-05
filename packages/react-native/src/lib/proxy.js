module.exports = typeof Proxy !== 'undefined' ? Proxy : require('proxy-polyfill/src/proxy.js')
