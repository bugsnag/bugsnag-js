const { FileSystem } = require('expo')

const PAYLOAD_PATH = `${FileSystem.cacheDirectory}bugsnag/payloads`
const filenameRe = /^bugsnag-payload-.*\.json$/

// create a random 16 byte url
const uid = () => {
  return Array(16).fill(1).reduce((accum, val) => {
    return accum + Math.floor(Math.random() * 10).toString()
  }, '')
}

const generateFilename = () => `bugsnag-payload-${(new Date()).toISOString()}-${uid()}.json`

// async function clear () {
//   await FileSystem.deleteAsync(PAYLOAD_PATH)
// }

async function ensureDirectoryExistsAsync () {
  const { exists, isDirectory } = await FileSystem.getInfoAsync(PAYLOAD_PATH)
  if (exists && isDirectory) return true
  await FileSystem.makeDirectoryAsync(PAYLOAD_PATH, { intermediates: true })
}

async function enqueue (req, onerror = () => {}) {
  try {
    await ensureDirectoryExistsAsync()
    await FileSystem.writeAsStringAsync(
      `${PAYLOAD_PATH}/${generateFilename()}`,
      JSON.stringify(req)
    )
  } catch (e) {
    onerror(e)
  }
}

async function dequeue (onerror = () => {}) {
  try {
    const payloads = await FileSystem.readDirectoryAsync(PAYLOAD_PATH)
    const payloadFileName = payloads.filter(f => filenameRe.test(f)).sort()[0]
    if (!payloadFileName) return null
    const payloadPath = `${PAYLOAD_PATH}/${payloadFileName}`
    const payloadJson = await FileSystem.readAsStringAsync(payloadPath)
    try { await FileSystem.deleteAsync(payloadPath) } catch (e) {}
    return JSON.parse(payloadJson)
  } catch (e) {
    onerror(e)
    return null
  }
}

module.exports = { enqueue, dequeue, generateFilename }
