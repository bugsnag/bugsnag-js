import { getSuggestedBugsnagGradleVersion, modifyAppBuildGradle, modifyRootBuildGradle, checkReactNativeMappings, addUploadEndpoint, addBuildEndpoint } from '../Gradle'
import logger from '../../Logger'
import path from 'path'
import { promises as fs } from 'fs'

async function loadFixture (fixture: string) {
  return jest.requireActual('fs').promises.readFile(fixture, 'utf8')
}

async function generateNotFoundError () {
  try {
    await jest.requireActual('fs').promises.readFile(path.join(__dirname, 'does-not-exist.txt'))
  } catch (e) {
    return e
  }
}

jest.mock('../../Logger')
jest.mock('fs', () => {
  return { promises: { readFile: jest.fn(), writeFile: jest.fn() } }
})

afterEach(() => jest.resetAllMocks())

test('modifyRootBuildGradle(): success', async () => {
  const rootBuildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'root-build-before.gradle'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(rootBuildGradle)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyRootBuildGradle('/random/path', '5.+', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/build.gradle', 'utf8')
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/android/build.gradle',
    await loadFixture(path.join(__dirname, 'fixtures', 'root-build-after.gradle')),
    'utf8'
  )
})

test('modifyRootBuildGradle(): tolerates errors', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue('not a gradle file')
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyRootBuildGradle('/random/path', '5.+', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('The gradle file was in an unexpected format and so couldn\'t be updated automatically')
  )
})

test('modifyRootBuildGradle(): skips when no changes are required', async () => {
  const rootBuildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'root-build-after.gradle'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(rootBuildGradle)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyRootBuildGradle('/random/path', '5.+', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('Value already found in file, skipping.')
  )
})

test('modifyRootBuildGradle(): tolerates missing gradle file', async () => {
  const notFoundErr = await generateNotFoundError()
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(notFoundErr)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyRootBuildGradle('/random/path', '5.+', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('A gradle file was not found at the expected location and so couldn\'t be updated automatically.')
  )
})

test('modifyRootBuildGradle(): passes on unknown errors', async () => {
  const unknownErr = new Error('Unknown error')
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(unknownErr)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await expect(modifyRootBuildGradle('/random/path', '5.+', logger)).rejects.toThrowError('Unknown error')
})

test('modifyAppBuildGradle(): success', async () => {
  const appBuildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before.gradle'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(appBuildGradle)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyAppBuildGradle('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/build.gradle',
    await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after.gradle')),
    'utf8'
  )
})

test('modifyAppBuildGradle(): tolerates gradle format errors', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue('not a gradle file')
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyAppBuildGradle('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('The gradle file was in an unexpected format and so couldn\'t be updated automatically')
  )
})

test('modifyAppBuildGradle(): skips when no changes are required', async () => {
  const appBuildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after.gradle'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(appBuildGradle)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyAppBuildGradle('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('Value already found in file, skipping.')
  )
})

test('modifyAppBuildGradle(): tolerates missing gradle file', async () => {
  const notFoundErr = await generateNotFoundError()
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(notFoundErr)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyAppBuildGradle('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('A gradle file was not found at the expected location and so couldn\'t be updated automatically.')
  )
})

test('modifyAppBuildGradle(): passes on unknown errors', async () => {
  const unknownErr = new Error('Unknown error')
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(unknownErr)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await expect(modifyAppBuildGradle('/random/path', logger)).rejects.toThrowError('Unknown error')
})

test('checkReactNativeMappings(): success without initial bugsnag config', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before.gradle'))
  const expected = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-no-mappings.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(buildGradle)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockImplementation((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expected)
    expect(encoding).toBe('utf8')
  })

  await checkReactNativeMappings('/random/path', logger)

  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(buildGradle).toStrictEqual(expected)
})

test('checkReactNativeMappings(): success with initial bugsnag config', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before-with-bugsnag-config.gradle'))
  const expected = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-and-bugsnag-config.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(buildGradle)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  writeFileMock.mockImplementation((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expected)
    expect(encoding).toBe('utf8')
  })

  await checkReactNativeMappings('/random/path', logger)

  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(buildGradle).toStrictEqual(expected)
})

test('checkReactNativeMappings(): success with empty initial bugsnag config', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before-with-empty-bugsnag-config.gradle'))
  const expected = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-and-empty-bugsnag-config.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(buildGradle)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockImplementation((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expected)
    expect(encoding).toBe('utf8')
  })

  await checkReactNativeMappings('/random/path', logger)

  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(buildGradle).toStrictEqual(expected)
})

test('checkReactNativeMappings(): failure mappings already enabled', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before-with-mappings.gradle'))
  const expected = buildGradle

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(buildGradle)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockImplementation((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expected)
    expect(encoding).toBe('utf8')
  })

  await checkReactNativeMappings('/random/path', logger)

  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
})

test('checkReactNativeMappings(): failure gradle file not found', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(await generateNotFoundError())

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await checkReactNativeMappings('/random/path', logger)

  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).not.toHaveBeenCalled()
})

test('addUploadEndpoint(): success without initial bugsnag config and custom upload endpoint', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before.gradle'))
  const expectedMappings = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings.gradle'))
  const expectedUploadEndpoint = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-and-upload-endpoint.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(expectedMappings)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedMappings)
    expect(encoding).toBe('utf8')
  }).mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedUploadEndpoint)
    expect(encoding).toBe('utf8')
  })

  await checkReactNativeMappings('/random/path', logger)
  await addUploadEndpoint('/random/path', 'https://upload.example.com', logger)

  expect(readFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', 'utf8')
  expect(readFileMock).toHaveBeenNthCalledWith(2, '/random/path/android/app/build.gradle', 'utf8')

  expect(writeFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', expectedMappings, 'utf8')
  expect(writeFileMock).toHaveBeenNthCalledWith(2, '/random/path/android/app/build.gradle', expectedUploadEndpoint, 'utf8')
})

test('addUploadEndpoint(): success with initial bugsnag config and custom upload endpoint', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before-with-bugsnag-config.gradle'))
  const expectedMappings = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-and-bugsnag-config.gradle'))
  const expectedUploadEndpoint = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-upload-endpoint-and-bugsnag-config.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(expectedMappings)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedMappings)
    expect(encoding).toBe('utf8')
  }).mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedUploadEndpoint)
    expect(encoding).toBe('utf8')
  })

  await addUploadEndpoint('/random/path', 'https://upload.example.com', logger)

  expect(readFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', 'utf8')
  expect(readFileMock).toHaveBeenNthCalledWith(2, '/random/path/android/app/build.gradle', 'utf8')

  expect(writeFileMock).not.toHaveBeenCalled()
  expect(buildGradle).toStrictEqual(expectedMappings)
  expect(buildGradle).toStrictEqual(expectedUploadEndpoint)
})

test('addBuildEndpoint(): success with initial bugsnag config and custom build endpoint', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before-with-bugsnag-config.gradle'))
  const expectedMappings = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-and-bugsnag-config.gradle'))
  const expectedBuildEndpoint = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-build-endpoint-and-bugsnag-config.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(expectedMappings)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedMappings)
    expect(encoding).toBe('utf8')
  }).mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedBuildEndpoint)
    expect(encoding).toBe('utf8')
  })

  await addBuildEndpoint('/random/path', 'https://build.example.com', logger)

  expect(readFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', 'utf8')
  expect(readFileMock).toHaveBeenNthCalledWith(2, '/random/path/android/app/build.gradle', 'utf8')

  expect(writeFileMock).not.toHaveBeenCalled()
  expect(buildGradle).toStrictEqual(expectedMappings)
  expect(buildGradle).toStrictEqual(expectedBuildEndpoint)
})

test('addUploadEndpoint(): success with empty initial bugsnag config and custom upload endpoint', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before-with-empty-bugsnag-config.gradle'))
  const expectedMappings = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-upload-endpoint-and-empty-bugsnag-config.gradle'))
  const expectedUploadEndpoint = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-upload-endpoint-and-empty-bugsnag-config.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(expectedMappings)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedMappings)
    expect(encoding).toBe('utf8')
  }).mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedUploadEndpoint)
    expect(encoding).toBe('utf8')
  })

  await addUploadEndpoint('/random/path', 'https://upload.example.com', logger)

  expect(readFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', 'utf8')
  expect(readFileMock).toHaveBeenNthCalledWith(2, '/random/path/android/app/build.gradle', 'utf8')

  expect(writeFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', expectedMappings, 'utf8')
  expect(writeFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', expectedUploadEndpoint, 'utf8')
})

test('addBuildEndpoint(): success with empty initial bugsnag config and custom build endpoint', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before-with-empty-bugsnag-config.gradle'))
  const expectedMappings = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-build-endpoint-and-empty-bugsnag-config.gradle'))
  const expectedBuildEndpoint = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-build-endpoint-and-empty-bugsnag-config.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(expectedMappings)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedMappings)
    expect(encoding).toBe('utf8')
  }).mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedBuildEndpoint)
    expect(encoding).toBe('utf8')
  })

  await addBuildEndpoint('/random/path', 'https://build.example.com', logger)

  expect(readFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', 'utf8')
  expect(readFileMock).toHaveBeenNthCalledWith(2, '/random/path/android/app/build.gradle', 'utf8')

  expect(writeFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', expectedMappings, 'utf8')
  expect(writeFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', expectedBuildEndpoint, 'utf8')
})

test('addUploadEndpoint() and addBuildEndpoint(): success with initial bugsnag config and custom endpoints', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before-with-bugsnag-config.gradle'))
  const expectedMappings = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-and-bugsnag-config.gradle'))
  const expectedUploadEndpoint = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-upload-endpoint-and-bugsnag-config.gradle'))
  const expectedFinal = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-both-endpoints-and-bugsnag-config.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(expectedMappings)
    .mockResolvedValueOnce(expectedUploadEndpoint)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedMappings)
    expect(encoding).toBe('utf8')
  }).mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedUploadEndpoint)
    expect(encoding).toBe('utf8')
  }).mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedFinal)
    expect(encoding).toBe('utf8')
  })

  await addUploadEndpoint('/random/path', 'https://upload.example.com', logger)
  await addBuildEndpoint('/random/path', 'https://build.example.com', logger)

  expect(readFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', 'utf8')
  expect(readFileMock).toHaveBeenNthCalledWith(2, '/random/path/android/app/build.gradle', 'utf8')
  expect(readFileMock).toHaveBeenNthCalledWith(3, '/random/path/android/app/build.gradle', 'utf8')

  expect(writeFileMock).not.toHaveBeenCalled()
  expect(buildGradle).toStrictEqual(expectedMappings)
  expect(buildGradle).toStrictEqual(expectedUploadEndpoint)
  expect(buildGradle).toStrictEqual(expectedFinal)
})

test('addUploadEndpoint() and addBuildEndpoint(: success without initial bugsnag config and custom endpoints', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before.gradle'))
  const expectedMappings = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings.gradle'))
  const expectedUploadEndpoint = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-and-upload-endpoint.gradle'))
  const expectedFinal = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after-with-mappings-and-both-endpoints.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(buildGradle)
    .mockResolvedValueOnce(expectedMappings)
    .mockResolvedValueOnce(expectedUploadEndpoint)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedMappings)
    expect(encoding).toBe('utf8')
  }).mockImplementationOnce((file, contents, encoding) => {
    expect(file).toBe('/random/path/android/app/build.gradle')
    expect(contents).toBe(expectedFinal)
    expect(encoding).toBe('utf8')
  })

  await addUploadEndpoint('/random/path', 'https://upload.example.com', logger)
  await addBuildEndpoint('/random/path', 'https://build.example.com', logger)

  expect(readFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', 'utf8')
  expect(readFileMock).toHaveBeenNthCalledWith(2, '/random/path/android/app/build.gradle', 'utf8')

  expect(writeFileMock).toHaveBeenNthCalledWith(1, '/random/path/android/app/build.gradle', expectedMappings, 'utf8')
  expect(writeFileMock).toHaveBeenNthCalledWith(2, '/random/path/android/app/build.gradle', expectedFinal, 'utf8')
})

test('getSuggestedBugsnagGradleVersion(): success', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'root-build-before.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValueOnce(buildGradle)

  const version = await getSuggestedBugsnagGradleVersion('/random/path', logger)
  expect(version).toBe('5.+')
})

test('getSuggestedBugsnagGradleVersion(): null with wrong file', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValueOnce(buildGradle)

  const version = await getSuggestedBugsnagGradleVersion('/random/path', logger)
  expect(version).toBe('')
})

test('getSuggestedBugsnagGradleVersion(): success with bracketed AGP version', async () => {
  const buildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'root-build-before-with-prefixed-agp-version.gradle'))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValueOnce(buildGradle)

  const version = await getSuggestedBugsnagGradleVersion('/random/path', logger)
  expect(version).toBe('7.+')
})
