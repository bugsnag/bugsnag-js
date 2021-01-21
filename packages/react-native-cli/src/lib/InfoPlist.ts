import { Logger } from '../Logger'
import plist from 'plist'
import path from 'path'
import { promises as fs } from 'fs'

const DOCS_LINK = 'https://docs.bugsnag.com/platforms/react-native/react-native/#ios'

export interface Options {
  apiKey: string
  notifyEndpoint?: string
  sessionsEndpoint?: string
}

interface BugsnagPlist {
  apiKey?: string
  endpoints?: {
    notify?: string
    sessions?: string
  }
}

export async function configure (projectRoot: string, options: Options, logger: Logger): Promise<void> {
  const iosDir = path.join(projectRoot, 'ios')

  let xcodeprojDir

  try {
    xcodeprojDir = (await fs.readdir(iosDir)).find(p => p.endsWith('.xcodeproj'))
  } catch (e) {}

  if (!xcodeprojDir) {
    logger.warn(getUnableToFindProjectMessage(options))
    return
  }

  const plistPath = path.join(iosDir, xcodeprojDir.replace(/\.xcodeproj$/, ''), 'Info.plist')

  try {
    const infoPlist = plist.parse(await fs.readFile(plistPath, 'utf8'))
    const bugsnag = (infoPlist.bugsnag || {}) as BugsnagPlist
    let hasChanged = false

    if (options.apiKey) {
      if (bugsnag.apiKey) {
        logger.warn('API key is already present, skipping')
      } else {
        bugsnag.apiKey = options.apiKey
        hasChanged = true
      }
    }

    if (options.notifyEndpoint) {
      bugsnag.endpoints = bugsnag.endpoints || {}

      if (bugsnag.endpoints.notify) {
        logger.warn('Notify endpoint is already present, skipping')
      } else {
        bugsnag.endpoints.notify = options.notifyEndpoint
        hasChanged = true
      }
    }

    if (options.sessionsEndpoint) {
      bugsnag.endpoints = bugsnag.endpoints || {}

      if (bugsnag.endpoints.sessions) {
        logger.warn('Sessions endpoint is already present, skipping')
      } else {
        bugsnag.endpoints.sessions = options.sessionsEndpoint
        hasChanged = true
      }
    }

    if (!hasChanged) {
      return
    }

    infoPlist.bugsnag = bugsnag

    await fs.writeFile(plistPath, `${plist.build(infoPlist, { indent: '\t', indentSize: 1, offset: -1 })}\n`, 'utf8')

    logger.success('Updated Info.plist')
  } catch (e) {
    logger.warn(getNoMatchMessage(options))
  }
}

const HUMAN_READABLE_PROPERTY_NAMES: Record<keyof Options, string> = {
  apiKey: 'API key',
  notifyEndpoint: 'notify endpoint',
  sessionsEndpoint: 'sessions endpoint'
}

function getUnableToFindProjectMessage (options: Options): string {
  return `The Xcode configuration was not in the expected location and so couldn't be updated automatically.

Add your ${humanReadableOptions(options)} to the Info.plist in your project.

See ${DOCS_LINK} for more information`
}

function getNoMatchMessage (options: Options): string {
  return `The project's Info.plist couldn't be updated automatically. The plist file may not be valid XML.

Add your ${humanReadableOptions(options)} to the Info.plist in your project manually.

See ${DOCS_LINK} for more information`
}

function humanReadableOptions (options: Options): string {
  return Object.keys(options)
    .map(key => HUMAN_READABLE_PROPERTY_NAMES[key as keyof Options])
    .join(', ')
    .replace(/,(?=[^,]*$)/, ' and')
}
