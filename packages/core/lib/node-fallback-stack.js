// The utilities in this file are used to save the stackframes from a known execution context
// to use when a subsequent error has no stack frames. This happens with a lot of
// node's builtin async callbacks when they return from the native layer with no context
// for example:
//
//   fs.readFile('does not exist', (err) => {
//     /* node 8 */
//     err.stack = "ENOENT: no such file or directory, open 'nope'"
//     /* node 4,6 */
//     err.stack = "Error: ENOENT: no such file or directory, open 'nope'\n    at Error (native)"
//   })

// Gets the stack string for the current execution context
exports.getStack = () => {
  // slice(3) removes the first line + this function's frame + the caller's frame,
  // so the stack begins with the caller of this function
  return (new Error()).stack.split('\n').slice(3).join('\n')
}

// Given an Error and a fallbackStack from getStack(), use the fallbackStack
// if error.stack has no genuine stackframes (according to the example above)
exports.maybeUseFallbackStack = (err, fallbackStack) => {
  const lines = err.stack.split('\n')
  if (lines.length === 1 || (lines.length === 2 && /at Error \(native\)/.test(lines[1]))) {
    err.stack = `${lines[0]}\n${fallbackStack}`
  }
  return err
}
