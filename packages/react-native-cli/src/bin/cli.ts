import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import logger from '../Logger'

import { UrlType } from '../lib/OnPremise'

import automateSymbolication from '../commands/AutomateSymbolicationCommand'
import install from '../commands/InstallCommand'
import configure from '../commands/ConfigureCommand'
import insert from '../commands/InsertCommand'
import repoStatePreCommand from '../commands/RepoStatePreCommand'
import getOnPremiseUrls from '../commands/OnPremiseUrlsCommand'

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
  },
  {
    name: 'project-root',
    type: String,
    description: 'the top level directory of the React Native project. Defaults to the current directory.'
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

    if (opts.help) return usage()

    const projectRoot = opts.projectRoot || process.cwd()

    const remainingOpts = opts._unknown || []
    switch (opts.command) {
      case 'init': {
        await repoStatePreCommand(remainingOpts, projectRoot, opts)

        const urls = await getOnPremiseUrls(UrlType.NOTIFY, UrlType.SESSIONS, UrlType.UPLOAD, UrlType.BUILD)

        if (!await install(remainingOpts, projectRoot, opts)) return
        if (!await insert(remainingOpts, projectRoot, opts)) return
        if (!await configure(projectRoot, urls)) return
        if (!await automateSymbolication(projectRoot, urls)) return
        logger.success('Finished')
        break
      }

      case 'insert': {
        await repoStatePreCommand(remainingOpts, projectRoot, opts)
        await insert(remainingOpts, projectRoot, opts)
        break
      }

      case 'configure': {
        await repoStatePreCommand(remainingOpts, projectRoot, opts)

        const urls = await getOnPremiseUrls(UrlType.NOTIFY, UrlType.SESSIONS)

        await configure(projectRoot, urls)
        break
      }

      case 'install': {
        await repoStatePreCommand(remainingOpts, projectRoot, opts)
        await install(remainingOpts, projectRoot, opts)
        break
      }

      case 'automate-symbolication': {
        await repoStatePreCommand(remainingOpts, projectRoot, opts)

        const urls = await getOnPremiseUrls(UrlType.UPLOAD, UrlType.BUILD)

        await automateSymbolication(projectRoot, urls)
        break
      }

      default: {
        if (opts.command) {
          logger.error(`Unrecognized command "${opts.command}".`)
        } else {
          logger.error('Command expected, nothing provided.')
        }
        usage()
      }
    }
  } catch (e) {
    let error = ''
    if (e instanceof Error) error = e.message
    logger.error(`Invalid options. ${error}`)
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
