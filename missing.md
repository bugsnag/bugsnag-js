The current implementation is missing a few async entry points. (As of 2014-01-08)

## Missing DOM functions that take callbacks

I found these by poking around in https://github.com/mozilla/gecko-dev/blob/master/dom/webidl

```
AudioContext.decodeAudioData
Geolocation.getCurrentPosition
Geolocation.watchPosition
Canvas.toBlob
MediaQueryList.addListener
MutationObserver.observe
Navigator.getUserMedia
Notification.requestPermission
Promise.then ?
WebComponents
```

## Script to find missing event listeners

```javascript

var needed = []
var wanted = []

var w = window
while (w) {

  Object.getOwnPropertyNames(w).forEach(function (k) {
    try {
      if (w[k] && w[k].prototype && w[k].prototype.addEventListener) {
        var r = w[k].prototype;
        while (r) {
          if (r.hasOwnProperty('addEventListener')) {
             console.log(k, w[k].prototype, r);
             if (needed.indexOf(r) < 0) {
                needed.push(r);
                wanted.push(k);
              }
            }
            r = Object.getPrototypeOf(r);
          }
        }
      } catch(e) {
        console.log(k, e);
      }
    });

  w = Object.getPrototypeOf(w);
}
console.log(needed);
console.log(wanted);
````
