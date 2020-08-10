export default class Scenario {
  constructor(configuration, extraData, jsConfig) {}
  run() {}

  timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
