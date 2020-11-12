import bytesize from '../'

test.each([
  ['', 0],
  ['abc', 3],
  ['aaaaaaaaa', 9],
  ['abcdefghijklmnopqrstuvwxyz', 26],
  // $ = 1 byte, £ = 2, € = 3
  ['$£€', 6],
  // each of these cyrillic characters are 2 bytes + 1 byte for the space
  ['обичам те', 17],
  // these emoji are 4 bytes each
  ['😀😃😄😁', 16],
  // the woman running emoji with a skin tone is made up of several combining characters
  ['🏃🏽‍♀️', 17],
  // this is the same woman running emoji but encoded
  ['\ud83c\udfc3\ud83c\udffd\u200d\u2640\ufe0f', 17],
  // these families are several separate emojis + combining characters
  ['👩‍👩‍👧‍👧👨‍👨‍👦‍👦', 50],
  ['1234567890'.repeat(1024), 10240],
  ['обичам те'.repeat(1024), 17408],
  // big strings to stress test performance — these are ~1mb & ~5mb
  ['a'.repeat(1_000_000), 1_000_000],
  ['👩‍👩‍👧‍👧👨‍👨‍👦‍👦'.repeat(100_000), 5_000_000],
  // this is 'ññ' but the first 'ñ' is made up of 'n' and a combining tilde, so
  // is counted as 3 bytes instead of 2
  ['\u006E\u0303\u00F1', 5],
  ['\uD834\uDF06', 4],
  // stacking a bunch of combining characters to ensure they are each counted correctly
  ['h\u0336\u0340\u0307\u0342\u030C\u033E\u035B\u0360\u0310\u0308\u0308\u030D\u0305\u0328\u0320\u0356\u031F\u031D\u0348\u035A\u0329\u0347e\u0336\u030A\u0329\u0345\u032B\u0319\u032F\u0339\u0339\u0317l\u0337\u0344\u034C\u0350\u035A\u0330\u031D\u0318\u0320\u0356\u0332\u0332\u033A\u033Bl\u0335\u0346\u0308\u0346\u035A\u0327\u0339\u032E\u0339\u0356o\u0336\u0352\u030C\u031B\u0351\u030D\u034B\u031A\u030A\u0342\u030A\u0304\u031B\u030E\u033F\u0323\u0329\u0349\u033B\u031E\u0330\u0323\u033C\u0348\u0347\u0359\u031F\u0359\u0355\u0347\u032E', 179],
  ['\u{1FA00}\u{1003FF}', 8],
  ['\u{1F701}\u{1F702}\u{1F703}\u{1F704}', 16]
])('it calculates the size of a string in bytes (%#)', (string, expected) => {
  expect(bytesize(string)).toBe(expected)
})

test.each([
  [123, 'number'],
  [123.456, 'number'],
  [true, 'boolean'],
  [[1, 'a', 2, 'b'], 'object'],
  [{ a: 1, b: 2 }, 'object'],
  [null, 'object'],
  [undefined, 'undefined'],
  [Symbol('abc'), 'symbol'],
  [2n ** 64n, 'bigint'],
  [() => {}, 'function']
])('it throws when given an invalid type: %p', (input, expectedType) => {
  const expected = new Error(`Invalid type given, expected string but got ${expectedType}`)

  expect(() => bytesize(input)).toThrow(expected)
})
