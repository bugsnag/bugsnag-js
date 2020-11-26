import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import logger from '../Logger'

import automateSymbolication from '../commands/AutomateSymbolicationCommand'
import install from '../commands/InstallCommand'

const topLevelDefs = [
  {
    name: 'command',
    defaultOption: true
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'show this message'
  },
  {
    name: 'version',
    type: Boolean,
    description: 'output the version of the CLI module'
  }
]

export default async function run (argv: string[]): Promise<void> {
  try {
    const opts = commandLineArgs(topLevelDefs, { argv, stopAtFirstUnknown: true })

    if (opts.version) {
      return console.log(
        `bugsnag-react-native-cli v${require('../../package.json').version}`
      )
    }

    const remainingOpts = opts._unknown || []
    switch (opts.command) {
      case 'init':
      case 'insert':
      case 'configure':
        logger.info(`TODO ${opts.command}`)
        break
      case 'install':
        await install(remainingOpts, opts)
        break
      case 'automate-symbolication':
        await automateSymbolication(remainingOpts, opts)
        break
      default:
        if (opts.help) return usage()
        if (opts.command) {
          logger.error(`Unrecognized command "${opts.command}".`)
        } else {
          logger.error('Command expected, nothing provided.')
        }
        usage()
    }
  } catch (e) {
    logger.error(`Invalid options. ${e.message}`)
    process.exitCode = 1
  }
}

function usage (): void {
  console.log(
    commandLineUsage([
      { content: 'bugsnag-react-native-cli <command>' },
      { header: 'Available commands', content: commandList },
      { header: 'Options', optionList: topLevelDefs, hide: ['command'] }
    ])
  )
}

const commandList = [
  {
    name: 'init',
    summary: 'integrates Bugsnag with a React Native project (this command runs all of the other commands)'
  },
  {
    name: 'install',
    summary: 'installs @bugsnag/react-native'
  },
  {
    name: 'insert',
    summary: 'inserts Bugsnag initialisation into the JS, Android and iOS parts of the codebase'
  },
  {
    name: 'configure',
    summary: 'prompts for necessary configuration and outputs them to the relevant manifests'
  },
  {
    name: 'automate-symbolication',
    summary: 'configures the Xcode and Gradle builds to automatically upload source maps, dsyms and mappings to Bugsnag'
  }
]
