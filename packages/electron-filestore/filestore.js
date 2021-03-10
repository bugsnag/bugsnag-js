const { unlink, readdir, access, readFile, mkdir, writeFile } = require('fs').promises
const { F_OK } = require('fs').constants
const { dirname, join } = require('path')
const { getIdentifier, createIdentifier, identifierKey } = require('./lib/minidump-io')

class FileStore {
  constructor (apiKey, storageDir, crashDir) {
    const base = join(storageDir, 'bugsnag', apiKey)
    const isMac = process.platform === 'darwin'
    this._paths = {
      events: join(base, 'events'),
      sessions: join(base, 'sessions'),
      runinfo: join(base, 'runinfo'),
      device: join(base, 'device.json'),
      minidumps: join(crashDir, isMac ? 'completed' : 'reports')
    }
  }

  // Create directory layout
  async init () {
    await mkdir(this._paths.events, { recursive: true })
    await mkdir(this._paths.sessions, { recursive: true })
    await mkdir(this._paths.runinfo, { recursive: true })
  }

  getPaths () {
    return this._paths
  }

  async listMinidumps () {
    const basepath = this._paths.minidumps
    return readdir(basepath, { withFileTypes: true })
      .then(async entries => {
        const minidumps = entries
          .filter(entry => entry.isFile() && entry.name.match(/\.dmp$/))
          .map(async entry => {
            const minidumpPath = join(basepath, entry.name)
            const eventPath = await getIdentifier(minidumpPath)
              .then(async id => {
                const path = this.getEventInfoPath(id)
                return await fileExists(path) ? path : null
              })
              .catch(() => null)
            return new Minidump(minidumpPath, eventPath)
          })

        return await Promise.all(minidumps)
      })
      .catch((e) => {
        console.log(e)
        return []
      })
  }

  getEventInfoPath (appRunID) {
    return join(this._paths.runinfo, appRunID)
  }

  async getAppRunID (minidumpPath) {
    return await getIdentifier(minidumpPath)
  }

  async deleteMinidump (minidump) {
    await unlink(minidump.minidumpPath)
    if (minidump.eventPath) {
      await unlink(minidump.eventPath)
    }
  }

  async clearEventInfoPaths () {
    const base = this._paths.runinfo
    await readdir(base, { withFileTypes: true })
      .then(async entries => {
        await Promise.all(entries
          .filter(e => e.isFile())
          .map(async e => await unlink(join(base, e.name))))
      })
      .catch(() => {})
  }

  async getDeviceInfo () {
    try {
      const contents = await readFile(this._paths.device)
      return JSON.parse(contents)
    } catch (e) {
      return {}
    }
  }

  async setDeviceInfo (device) {
    await mkdir(dirname(this._paths.device), { recursive: true })
    await writeFile(this._paths.device, JSON.stringify(device))
  }

  createAppRunMetadata () {
    return { [identifierKey]: createIdentifier() }
  }
}

class Minidump {
  constructor (minidumpPath, eventPath) {
    this.minidumpPath = minidumpPath
    this.eventPath = eventPath
  }
}

const fileExists = async (filepath) => {
  try {
    await access(filepath, F_OK)
    return true
  } catch (e) {
    return false
  }
}

module.exports = { FileStore }
