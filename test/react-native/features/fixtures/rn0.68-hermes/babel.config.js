module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // Make sure this is added
    ['@babel/plugin-transform-runtime', {
      regenerator: true
    }]
  ]
};
