/// <reference path="./node_modules/bugsnag-js/types/global.d.ts" />
var client = bugsnag({ apiKey: 'API_KEY' })

var el: HTMLInputElement = <HTMLInputElement> document.getElementById('jsondata')
var rawjson: string = el.value || ''

try {
  JSON.parse(rawjson)
} catch (e) {
  client.notify(e, { metaData: { rawjson: rawjson } })
}
