const DeviceId = require('../device-id')

describe('plugin: expo device - device ID', () => {
  const platforms = ['android', 'ios']
  const storage = {
    setItem: jest.fn(),
    getItem: jest.fn()
  }

  beforeEach(() => {
    Object.values(storage).forEach(mock => mock.mockReset())

    // ensure setItem returns a promise so we can call 'catch' on its return value
    storage.setItem.mockResolvedValue()

    // reset the cached device ID otherwise tests will interfere with eachother
    DeviceId._cache = null
  })

  describe('synchronous', () => {
    it.each(platforms)('[%s] should return and store the installationId when available', os => {
      const constants = { installationId: 'the installation ID' }
      const application = {}
      const callback = jest.fn()

      const deviceId = new DeviceId(os, constants, application, storage)
      deviceId.get(callback)

      // ensure the callback is called synchronously
      expect(callback).toHaveBeenCalledWith(null, 'the installation ID')
      expect(callback).toHaveBeenCalledTimes(1)

      expect(storage.setItem).toHaveBeenCalledWith('bugsnag-device-id', 'the installation ID')
      expect(storage.setItem).toHaveBeenCalledTimes(1)
    })

    // TODO is this actually necessary? will we ever call this more than once?
    //      given the (low) possibility for changing the device ID if called
    //      multiple times, it feels like this is useful but maybe it's not...
    it.each(platforms)('[%s] should return the cached ID when available', os => {
      const constants = {}
      const application = {}
      const callback = jest.fn()

      const deviceId = new DeviceId(os, constants, application, storage)
      DeviceId._cache = 'a cached value'

      deviceId.get(callback)

      // ensure the callback is called synchronously
      expect(callback).toHaveBeenCalledWith(null, 'a cached value')
      expect(callback).toHaveBeenCalledTimes(1)

      // if the ID is cached then we expect that it has already been stored, so
      // we shouldn't try to store it again
      expect(storage.setItem).not.toHaveBeenCalled()
    })
  })

  const getDeviceId = function (deviceId) {
    return new Promise(function (resolve, reject) {
      deviceId.get(function (error, id) {
        if (error) {
          reject(error)
        } else {
          resolve(id)
        }
      })
    })
  }

  describe('asynchronous', () => {
    it.each(platforms)('[%s] should resolve to the stored ID when available', async os => {
      const constants = {}
      const application = {}

      storage.getItem.mockImplementation(key => {
        if (key === 'bugsnag-device-id') {
          return 'a stored ID'
        }
      })

      const deviceId = new DeviceId(os, constants, application, storage)

      const id = await getDeviceId(deviceId)

      expect(id).toBe('a stored ID')
      expect(storage.setItem).not.toHaveBeenCalled()
    })

    it('[android] should store and resolve to a newly generated ID', async () => {
      const constants = { androidId: 'andrew droid' }
      const application = { applicationId: 'gansgub' }

      const deviceId = new DeviceId('android', constants, application, storage)

      const id = await getDeviceId(deviceId)

      // the generated UUID should be based off of the given android ID
      const expectedUuid = deviceId._generateDeviceId(constants.androidId)

      expect(id).toBe(expectedUuid)
      expect(storage.setItem).toHaveBeenCalledWith('bugsnag-device-id', expectedUuid)
      expect(storage.setItem).toHaveBeenCalledTimes(1)
      expect(storage.getItem).toHaveBeenCalledTimes(1)
    })

    it('[ios] should store and resolve to a newly generated ID using the iOS vendor ID', async () => {
      const constants = {}
      const application = {
        async getIosIdForVendorAsync () {
          return 'iGansgub'
        }
      }

      const deviceId = new DeviceId('ios', constants, application, storage)

      const id = await getDeviceId(deviceId)

      // on iOS the generated UUID should be based off of the 'ID for vendor'
      const expectedUuid = deviceId._generateDeviceId(await application.getIosIdForVendorAsync())

      expect(id).toBe(expectedUuid)
      expect(storage.setItem).toHaveBeenCalledWith('bugsnag-device-id', expectedUuid)
      expect(storage.setItem).toHaveBeenCalledTimes(1)
      expect(storage.getItem).toHaveBeenCalledTimes(1)
    })

    it('[ios] should error when vendor ID returns null', async () => {
      const constants = {}
      const application = {
        async getIosIdForVendorAsync () {
          return null
        }
      }

      const deviceId = new DeviceId('ios', constants, application, storage)

      await expect(getDeviceId(deviceId)).rejects.toThrow(new Error('Unable to fetch the ID For Vendor'))

      expect(storage.setItem).not.toHaveBeenCalled()
      expect(storage.getItem).toHaveBeenCalledTimes(1)
    })

    it.each(platforms)('[%s] succeeds if AsyncStorage.setItem throws an error', async os => {
      const constants = {}
      const application = {
        androidId: 'gansgub',

        async getIosIdForVendorAsync () {
          return 'iGansgub'
        }
      }

      storage.setItem.mockRejectedValueOnce(new Error('Failed to get from storage'))

      const deviceId = new DeviceId(os, constants, application, storage)

      expect(await getDeviceId(deviceId)).toBeTruthy()

      expect(storage.setItem).toHaveBeenCalledWith('bugsnag-device-id', expect.any(String))
      expect(storage.setItem).toHaveBeenCalledTimes(1)
      expect(storage.getItem).toHaveBeenCalledTimes(1)
    })

    it.each(platforms)('[%s] fails if AsyncStorage.getItem throws an error', async os => {
      const constants = {}
      const application = {
        androidId: 'gansgub',

        async getIosIdForVendorAsync () {
          return 'iGansgub'
        }
      }

      storage.getItem.mockRejectedValue(new Error('Failed to get from storage'))

      const deviceId = new DeviceId(os, constants, application, storage)

      await expect(getDeviceId(deviceId)).rejects.toThrow(new Error('Failed to get from storage'))

      expect(storage.setItem).not.toHaveBeenCalled()
      expect(storage.getItem).toHaveBeenCalledTimes(1)
    })
  })

  // TODO should this use the public API?
  it.each(platforms)('[%s] should generate deterministic IDs', os => {
    const constants = {}
    const application = {}
    const storage = {}

    const deviceId = new DeviceId(os, constants, application, storage)

    // two IDs generated with the same key should be the same
    const id1 = deviceId._generateDeviceId('a key')
    const id2 = deviceId._generateDeviceId('a key')

    expect(id1).toBe(id2)

    // two IDs generated with the same key different to the above should also be the same
    const id3 = deviceId._generateDeviceId('a different key')
    const id4 = deviceId._generateDeviceId('a different key')

    expect(id3).toBe(id4)

    // the IDs generated with different keys should _not_ be the same
    expect(id3).not.toBe(id1)
  })
})
