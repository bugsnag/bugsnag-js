var tracks = [
  { name: 'Quicksand', length: '2:13' },
  { name: 'A Kiss to Send Us Off', length: '4:16' },
  { name: 'Dig', length: '4:17' },
  { name: 'Anna Molly', length: '3:46' },
  { name: 'Love Hurts', length: '3:57' },
  { name: 'Light Grenades', length: '2:20' },
  { name: 'Earth to Bella (Part I)', length: '2:28' },
  { name: 'Oil and Water', length: '3:50' },
  { name: 'Diamonds and Coal', length: '3:47' },
  { name: 'Rogues', length: '3:56' },
  { name: 'Paper Shoes', length: '4:17' },
  { name: 'Pendulous Threads', length: '5:35' },
  { name: 'Earth to Bella (Part II)', length: '2:56' }
]

var longest = 0
for (var i = 0, secs; i <= tracks.length; i++) {
  secs = toSecs(tracks[i].length)
  if (secs > longest) longest = secs
}
alert(longest)

function toSecs(str) {
  var parts = str.split(':')
  return parts[0] * 60 + parts[1]
}
