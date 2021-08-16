const uuid = require('uuid')

// an arbitrary name to use for generated UUIDs, this is augmented with data
// unique to the application and device so we can generate the same UUID on
// different runs
const UUID_NAME = 'bugsnag-device-id'

// an arbitrary UUID to use as the UUID v5 namespace
// generated with `uuid.v5('bugsnag-device-id', uuid.NIL)`
const UUID_NAMESPACE = '87fbaa2d-5030-50b0-800f-45f0c2a04b6d'

// the key to store device IDs under
const DEVICE_ID_STORAGE_KEY = UUID_NAME

module.exports = class DeviceId {
  static _cache = null

  constructor (os, constants, application, storage) {
    this._isAndroid = os == 'android'
    this._constants = constants
    this._application = application
    this._storage = storage
  }

  get (callback) {
    // attempt to get an ID synchronously, if possible
    const maybeId = this._getSync()

    if (maybeId) {
      callback(null, maybeId)
    } else {
      this._getAsync()
        .then(id => { callback(null, id) })
        .catch(error => { callback(error, null) })
    }
  }

  _getSync () {
    if (DeviceId._cache) {
      return DeviceId._cache
    }

    if (this._constants.installationId) {
      return this._cacheAndStoreId(this._constants.installationId)
    }

    return null
  }

  async _getAsync () {
    // TODO if this fails should we retry? does failing to get something from
    //      storage mean it will always fail? it _should_ be safe to generate the
    //      UUID again as it is deterministic, but that doesn't apply if we had
    //      a stored installation ID
    const storedId = await this._storage.getItem(DEVICE_ID_STORAGE_KEY)

    if (storedId) {
      DeviceId._cache = storedId

      return storedId
    }

    let vendorId

    if (this._isAndroid) {
      vendorId = this._constants.androidId
    } else {
      vendorId = await this._getIosVendorId()
    }

    const newId = this._generateDeviceId(vendorId)

    return this._cacheAndStoreId(newId)
  }

  _generateDeviceId (vendorId) {
    // create an ID using the application ID and a vendor-specific device ID
    // this ensures our device ID is different across apps & devices
    // this also ensures the same app & device will always generate the same UUID
    return uuid.v5(
      `${UUID_NAME}-${this._application.applicationId}-${vendorId}`,
      UUID_NAMESPACE
    )
  }

  _cacheAndStoreId (id) {
    DeviceId._cache = id

    // save the ID but don't wait for it to be stored before returning
    // ignore errors as the UUIDs we generate are deterministic - if we fail
    // to store it this time, we will generate the same ID and try again next time
    this._storage.setItem(DEVICE_ID_STORAGE_KEY, DeviceId._cache)
      .catch(() => {})

    return DeviceId._cache
  }

  async _getIosVendorId () {
    const vendorId = await this._application.getIosIdForVendorAsync()

    // iOS will sometimes return null as the ID for vendor; usually this means
    // that the device has restarted and not yet been unlocked
    if (vendorId) {
      return vendorId
    }

    throw new Error('Unable to fetch the ID For Vendor')
  }
}
