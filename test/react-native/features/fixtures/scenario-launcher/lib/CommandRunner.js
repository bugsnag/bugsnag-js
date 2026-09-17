import { getMazeRunnerAddress, FALLBACK_ADDRESS } from './ConfigFileReader'

const INTERVAL = 500

// On Android maze runner pushes the config file to /data/local/tmp, which is outside
// the app sandbox and so survives reinstalls. The app can therefore start up holding
// an address left behind by a previous session. That address may be dead, or - since
// agents publish maze runner on a port range - may even be a live but unrelated maze
// runner, which answers 'noop' forever. So keep re-reading the config file until a
// real command arrives, rather than trusting the address we started with.
const POLLS_BETWEEN_REREADS = 8

let mazeAddress

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export async function getCurrentCommand () {
  if (!mazeAddress) {
    mazeAddress = await getMazeRunnerAddress()
  }

  console.error(`[Bugsnag CommandRunner] Fetching command from http://${mazeAddress}/command`)

  let pollsSinceReread = 0

  while (true) {
    const url = `http://${mazeAddress}/command`

    try {
      // eslint-disable-next-line no-undef
      const response = await fetch(url)
      const text = await response.text()
      console.error(`[Bugsnag CommandRunner] Response from maze runner: ${text}`)

      const command = JSON.parse(text)

      // keep polling until a scenario command is received
      if (command.action !== 'noop') {
        console.error(`[Bugsnag CommandRunner] Received command from maze runner: ${JSON.stringify(command)}`)

        return command
      }
    } catch (err) {
      console.error(`[Bugsnag CommandRunner] Error fetching command from maze runner: ${err.message}`, err)
    }

    // We have not been given a scenario yet, so the address we hold may be stale
    // whether or not it is answering. Re-read the config file periodically until
    // maze runner tells us what to run.
    if (++pollsSinceReread >= POLLS_BETWEEN_REREADS) {
      pollsSinceReread = 0

      const currentAddress = await getMazeRunnerAddress(0)

      if (currentAddress !== mazeAddress && currentAddress !== FALLBACK_ADDRESS) {
        console.error(`[Bugsnag CommandRunner] maze runner address changed from '${mazeAddress}' to '${currentAddress}', retrying there`)
        mazeAddress = currentAddress
      }
    }

    await delay(INTERVAL)
  }
}
