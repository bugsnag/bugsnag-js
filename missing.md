The current implementation is missing a few async entry points. (As of 2014-01-03)

## Missing addEventListeners:

### Firefox
```
["MozConnection","MozMobileMessageManager","ModalContentWindow"]
```

### IE 11
```
[object ApplicationCachePrototype]
[object AudioTrackListPrototype]
[object CryptoOperationPrototype]
[object FileReaderPrototype]
[object IDBDatabasePrototype]
[object IDBRequestPrototype]
[object IDBTransactionPrototype]
[object KeyOperationPrototype]
[object MSInputMethodContextPrototype]
[object MSStreamReaderPrototype]
[object MessagePortPrototype]
[object SVGElementInstancePrototype]
[object ScreenPrototype]
[object TextTrackPrototype]
[object TextTrackCuePrototype]
[object TextTrackListPrototype]
[object WebSocketPrototype]
[object WorkerPrototype]
[object XMLHttpRequestEventTargetPrototype]
```

### Safari

```
[ NodePrototype 
NotificationPrototype 
AudioNodePrototype 
EventTargetPrototype 
WindowPrototype 
FileReaderPrototype 
WebKitMediaKeySessionPrototype 
XMLHttpRequestUploadPrototype 
MessagePortPrototype 
XMLHttpRequestPrototype 
MediaControllerPrototype 
TextTrackPrototype 
AbstractWorkerPrototype 
WebSocketPrototype 
TextTrackCuePrototype 
TextTrackListPrototype 
EventSourcePrototype ]
```

### Chrome/Opera

None!

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
