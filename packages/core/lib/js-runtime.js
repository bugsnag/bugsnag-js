module.exports = process.env.IS_BROWSER
  ? 'browserjs'
  : ((typeof navigator !== 'undefined' && navigator.product === 'ReactNative')
    ? (typeof Expo !== 'undefined' ? 'expojs' : 'reactnativejs')
    : 'nodejs')
