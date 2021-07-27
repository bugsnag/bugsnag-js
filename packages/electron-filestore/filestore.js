const fs = require('fs')
const { readFileSync, writeFileSync, mkdirSync } = fs
const { unlink, readdir, access, mkdir } = fs.promises
const { F_OK } = fs.constants
const { dirname, join } = require('path')
const { getIdentifier, createIdentifier, identifierKey } = require('./lib/minidump-io')

class FileStore {
  constructor (apiKey, storageDir, crashDir) {
    const base = join(storageDir, 'bugsnag', apiKey)
    this._paths = {
      events: join(base, 'events'),
      sessions: join(base, 'sessions'),
      runinfo: join(base, 'runinfo'),
      device: join(base, 'device.json'),
      lastRunInfo: join(base, 'last-run-info.json'),
      minidumps: crashDir
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
    return this._listMinidumpFiles()
      .then(minidumpPaths => {
        const minidumps = minidumpPaths
          .map(async minidumpPath => {
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

  async _listMinidumpFiles () {
    const dirs = [this._paths.minidumps]
    const minidumpFiles = []
    while (dirs.length) {
      const dir = dirs.pop()
      const entries = await readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isFile() && entry.name.match(/\.dmp$/)) {
          minidumpFiles.push(join(dir, entry.name))
        } else if (entry.isDirectory()) {
          dirs.push(join(dir, entry.name))
        }
      }
    }

    return minidumpFiles
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
   * for the device and persists it prior to returning device info.
   */
  getDeviceInfo () {
    let device

    try {
      // Do this one sync routine upon startup because if we use the async fs operations,
      // it doesn't get scheduled until at least 500ms after the process has started.
      // Bugsnag needs the device ID before sending any events or sessions so it's
      // important we get it in a timely manner
      const contents = readFileSync(this._paths.device)
      device = JSON.parse(contents)
    } catch (e) {
      // either the file could not be read or wasn't valid JSON
    }

    try {
      // attempt to create or update the device.json file with
      // a) the device data we retrieved or
      // b) a new auto generated id
      return this.setDeviceInfo(device)
    } catch (e) {
      // in the event of a failure we don't want to return the device
      // id we have in memory because it won't have been persisted,
      // and so won't be stable across app launches
      return {}
    }
  }

  setDeviceInfo (device = {}) {
    if (!device.id) {
      device.id = createIdentifier()
    }
    mkdirSync(dirname(this._paths.device), { recursive: true })
    writeFileSync(this._paths.device, JSON.stringify(device))
    return device
  }

  getLastRunInfo () {
    try {
      // similar to getDeviceInfo - the lastRunInfo must be available during tha app-launch phase
      // as such we use readFileSync to ensure that the data is loaded immediately
      const contents = readFileSync(this._paths.lastRunInfo)
      return JSON.parse(contents)
    } catch (e) {
    }

    return { crashed: false, crashedDuringLaunch: false, consecutiveLaunchCrashes: 0 }
  }

  setLastRunInfo (lastRunInfo = {}) {
    mkdirSync(dirname(this._paths.lastRunInfo), { recursive: true })
    writeFileSync(this._paths.lastRunInfo, JSON.stringify(lastRunInfo))
    return lastRunInfo
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
