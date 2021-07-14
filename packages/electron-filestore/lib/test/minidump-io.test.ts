import { createIdentifier, getIdentifier, identifierKey } from '../minidump-io'
import { mkdtemp, rmdir, writeFile } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

describe('minidump i/o', () => {
  describe('minidumpIdentifierKey', () => {
    it('is a constant value', () => {
      expect(identifierKey).toEqual('bugsnag_crash_id')
    })
  })

  describe('createIdentifier()', () => {
    it('generates a key in an expected format', () => {
      const id = createIdentifier()
      expect(id).toMatch(/^[0-9a-z]{64}$/)
    })
  })

  describe('getIdentifier()', () => {
    const fakeId = 'aca181540fd9e09caabfd3b18039b74c20e4018493958ed74ebd7314dfbb1bb9'
    const makeTempDir = promisify(mkdtemp)
    const write = promisify(writeFile)
    const deleteDir = promisify(rmdir)
    let tempdir = ''
    let filepath = ''

    beforeEach(async () => {
      tempdir = await makeTempDir('minidump-io-')
      filepath = join(tempdir, 'output.txt')
    })

    afterEach(async () => {
      await deleteDir(tempdir, { recursive: true })
    })

    it('finds a pre-set key at the beginning of the file', async () => {
      // { key } { byte buffer } { id }
      const sequence = `bugsnag_crash_id${'\0'.repeat(8)}${fakeId}`
      const contents = Buffer.from(`${sequence}c${'\0'.repeat(442)}`)
      await write(filepath, contents)
      const identifier = await getIdentifier(filepath)
      expect(identifier).toMatch(fakeId)
    })

    it('finds a pre-set key at the end of the file', async () => {
      const sequence = `bugsnag_crash_id${'\0'.repeat(8)}${fakeId}`
      const contents = Buffer.from(`${'\0'.repeat(442)}${sequence}`)
      await write(filepath, contents)
      const identifier = await getIdentifier(filepath)
      expect(identifier).toMatch(fakeId)
    })

    it('finds a pre-set key near the end of the file', async () => {
      const sequence = `bugsnag_crash_id${'\0'.repeat(8)}${fakeId}`
      const contents = Buffer.from(`${'\0'.repeat(442)}${sequence}c\0\0\0`)
      await write(filepath, contents)
      const identifier = await getIdentifier(filepath)
      expect(identifier).toMatch(fakeId)
    })

    it('finds a pre-set key encoded in a multipart form (crlf)', async () => {
      const sequence = `name="bugsnag_crash_id"\r\n\r\n${fakeId}\r\n------`
      const contents = Buffer.from(`${'\0'.repeat(442)}${sequence}c\0\0\0`)
      await write(filepath, contents)
      const identifier = await getIdentifier(filepath)
      expect(identifier).toMatch(fakeId)
    })

    it('finds a pre-set key encoded in a multipart form (lf)', async () => {
      const sequence = `name="bugsnag_crash_id"\n\n${fakeId}\n------`
      const contents = Buffer.from(`${'\0'.repeat(442)}${sequence}c\0\0\0`)
      await write(filepath, contents)
      const identifier = await getIdentifier(filepath)
      expect(identifier).toMatch(fakeId)
    })

    it('fails without the key being present in the file', async () => {
      const sequence = `${fakeId}`
      const contents = Buffer.from(`${'\0'.repeat(300)}${sequence}c\0\0\0`)
      await write(filepath, contents)
      await expect(getIdentifier(filepath)).rejects.toBeInstanceOf(Error)
    })

    it('fails without a value being in the expected position', async () => {
      const sequence = `bugsnag_crash_id${'\0'.repeat(12)}${fakeId}`
      const contents = Buffer.from(`${'\0'.repeat(50)}${sequence}c${'\0'.repeat(200)}`)
      await write(filepath, contents)
      await expect(getIdentifier(filepath)).rejects.toBeInstanceOf(Error)
    })

    it('fails without a value matching the expected pattern', async () => {
      const sequence = `bugsnag_crash_id${'\0'.repeat(8)}2bd230ac\0abax52716bibdc6`
      const contents = Buffer.from(`${'\0'.repeat(926)}${sequence}c${'\0'.repeat(200)}`)
      await write(filepath, contents)
      await expect(getIdentifier(filepath)).rejects.toBeInstanceOf(Error)
    })

    it('fails when the value length is too short', async () => {
      const sequence = `bugsnag_crash_id${'\0'.repeat(8)}2bd230aca`
      const contents = Buffer.from(`${'\0'.repeat(801)}${sequence}`)
      await write(filepath, contents)
      await expect(getIdentifier(filepath)).rejects.toBeInstanceOf(Error)
    })
  })
})
