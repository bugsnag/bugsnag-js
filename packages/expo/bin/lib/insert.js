module.exports = async () => {
  console.log(`TODO insert ${module.exports.code} into App.js`)
}

module.exports.code = `
  import bugsnag from '@bugsnag/expo'
  const bugsagClient = bugsnag()
`
