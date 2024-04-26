import { getMazeRunnerAddress } from './ConfigFileReader'

const INTERVAL = 500

let mazeAddress

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export async function getCurrentCommand () {
  if (!mazeAddress) {
    mazeAddress = await getMazeRunnerAddress()
  }

  const url = `http://${mazeAddress}/command`
  console.error(`[Bugsnag CommandRunner] Fetching command from ${url}`)

  while (true) {
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

    await delay(INTERVAL)
  }
}
