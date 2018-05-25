/* global self */
module.exports = () => typeof (window) !== 'undefined' ? window : self
