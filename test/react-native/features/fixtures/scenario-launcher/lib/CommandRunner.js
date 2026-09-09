import { getMazeRunnerAddress, readMazeRunnerAddress } from './ConfigFileReader'

const INTERVAL = 500

// Until maze runner has given us a scenario to run we cannot be certain the address
// we hold is this session's, so keep an eye on the config file. This is cheap and
// stops once the first command arrives.
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

    if (++pollsSinceReread >= POLLS_BETWEEN_REREADS) {
      pollsSinceReread = 0

      const currentAddress = await readMazeRunnerAddress()

      if (currentAddress !== null && currentAddress !== mazeAddress) {
        console.error(`[Bugsnag CommandRunner] maze runner address changed from '${mazeAddress}' to '${currentAddress}', retrying there`)
        mazeAddress = currentAddress
      }
    }

    await delay(INTERVAL)
  }
}
