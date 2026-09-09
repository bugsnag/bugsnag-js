import { getMazeRunnerAddress, FALLBACK_ADDRESS } from './ConfigFileReader'

const INTERVAL = 500

// On Android maze runner pushes the config file to /data/local/tmp, which is outside
// the app sandbox and so survives reinstalls. The app can therefore read an address
// left behind by a previous session before maze runner writes the current one - and
// would then poll a dead address until the runner gives up. Re-read the file if the
// address we hold stops responding, so we recover instead of stranding the run.
const FAILURES_BEFORE_REREAD = 4

let mazeAddress

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export async function getCurrentCommand () {
  if (!mazeAddress) {
    mazeAddress = await getMazeRunnerAddress()
  }

  console.error(`[Bugsnag CommandRunner] Fetching command from http://${mazeAddress}/command`)

  let consecutiveFailures = 0

  while (true) {
    const url = `http://${mazeAddress}/command`

    try {
      // eslint-disable-next-line no-undef
      const response = await fetch(url)
      const text = await response.text()
      console.error(`[Bugsnag CommandRunner] Response from maze runner: ${text}`)

      const command = JSON.parse(text)
      consecutiveFailures = 0

      // keep polling until a scenario command is received
      if (command.action !== 'noop') {
        console.error(`[Bugsnag CommandRunner] Received command from maze runner: ${JSON.stringify(command)}`)

        return command
      }
    } catch (err) {
      console.error(`[Bugsnag CommandRunner] Error fetching command from maze runner: ${err.message}`, err)

      if (++consecutiveFailures >= FAILURES_BEFORE_REREAD) {
        consecutiveFailures = 0

        const currentAddress = await getMazeRunnerAddress(0)

        if (currentAddress !== mazeAddress && currentAddress !== FALLBACK_ADDRESS) {
          console.error(`[Bugsnag CommandRunner] maze runner address changed from '${mazeAddress}' to '${currentAddress}', retrying there`)
          mazeAddress = currentAddress
        }
      }
    }

    await delay(INTERVAL)
  }
}
