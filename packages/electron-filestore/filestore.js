const fs = require('fs')
const { readFileSync } = fs
const { unlink, readdir, access, mkdir, writeFile } = fs.promises
const { F_OK } = fs.constants
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

        return Promise.all(minidumps)
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
    return getIdentifier(minidumpPath)
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
          .map(async e => unlink(join(base, e.name))))
      })
      .catch(() => {})
  }

  /*
   * Loads persisted device info. If none is present, it generates an identifier
   * for the device and persists it prior to returning device info
   */
  getDeviceInfo () {
    return new Promise((resolve, reject) => {
      const ensureDeviceId = async (device = {}) => {
        if (!device.id) {
          device.id = createIdentifier()
        }
        // this intentionally resolves the device field before async'ly persisting device info
        // – it means the getDeviceInfo() function returns device info as soon as it's available,
        // rather than having to wait until it's been persisted to disk
        resolve(device)
        try {
          await this.setDeviceInfo(device)
        } catch (e) {
          // it's too late to do anything with this error, so just swallow it
        }
      }

      try {
        // Do this one sync call upon startup because if we use the async readFile,
        // it doesn't get scheduled until at least 500ms after the process has started.
        // Bugsnag needs the device ID before sending any events or sessions so it's
        // important we get it in a timely manner
        const contents = readFileSync(this._paths.device)
        const device = JSON.parse(contents)
        ensureDeviceId(device)
      } catch (e) {
        // either the file could not be read or wasn't valid JSON, which
        // warrants creating a new one
        ensureDeviceId()
      }
    })
  }

  async setDeviceInfo (device) {
    if (!device.id) {
      device.id = createIdentifier()
    }
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
