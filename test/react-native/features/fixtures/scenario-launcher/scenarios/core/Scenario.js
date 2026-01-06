export default class Scenario {
  run () {
  }

  timeout (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
