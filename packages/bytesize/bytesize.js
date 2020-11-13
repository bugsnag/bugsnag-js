export default function bytesize (string) {
  let bytes = 0

  for (let i = 0; i < string.length; ++i) {
    const code = string.charCodeAt(i)

    if (code <= 0x007f) {
      bytes += 1
    } else if (code <= 0x07ff || (code >= 0xd800 && code <= 0xdfff)) {
      // special handling for surrogate pairs (code points between 0xd800-0xdfff)
      // each part of the pair should be 2 bytes (so 4 bytes for the character)
      // see https://www.unicode.org/faq/utf_bom.html#utf16-2
      bytes += 2
    } else {
      bytes += 3
    }

    // 4 bytes isn't possible because 'charCodeAt' returns at most 65536 (0xffff).
    // Code points above this are represented by a surrogate pair of "characters",
    // which are 2 bytes each
  }

  return bytes
}
