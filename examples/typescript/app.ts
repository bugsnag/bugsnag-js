/// <reference path="./node_modules/bugsnag-js/types/global.d.ts" />
var client = bugsnag({
  apiKey: '554fd7369ed9371cb722d1391eafeeeb',
  endpoint: '//localhost:8000'
})

var el: HTMLInputElement = <HTMLInputElement> document.getElementById('jsondata')
var rawjson: string = el.value || ''

try {
  JSON.parse(rawjson)
} catch (e) {
  client.notify(e, { metaData: { rawjson: rawjson } })
}
