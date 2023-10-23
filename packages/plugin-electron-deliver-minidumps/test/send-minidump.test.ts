import { mkdtemp, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import sendMinidumpFactory from '../send-minidump'

const client = {
  _config: {
    apiKey: 'test-api-key',
    redactedKeys: [],
    endpoints: {
      minidumps: 'http://localhost/test-minidump-endpoint/'
    }
  }
}

describe('electron-minidump-delivery: sendMinidump', () => {
  let minidumpsPath

  beforeEach(async () => {
    minidumpsPath = await mkdtemp('send-minidumps-')
  })

  afterEach(() => rm(minidumpsPath, { recursive: true }))

  it('sends minidump successfully', async () => {
    const net = {
      request: jest.fn().mockImplementation((_, handle) => {
        handle({ statusCode: 200, on: (event, cb) => {} })
      })
    }

    const minidumpFile = join(minidumpsPath, 'test-minidump.dmp')
    await writeFile(minidumpFile, '{}', 'utf8')

    const { sendMinidump } = sendMinidumpFactory(net, client)
    await sendMinidump(minidumpFile, null)

    expect(net.request).toBeCalledTimes(1)

    const { url, method, headers } = net.request.mock.calls[0][0]
    const parsedUrl = new URL(url)
    expect(parsedUrl.pathname).toBe('/test-minidump-endpoint/minidump')
    expect(parsedUrl.searchParams.get('api_key')).toBe('test-api-key')
    expect(method).toBe('POST')
    expect(headers['content-type']).toMatch(/^multipart\/form-data/)
    expect(headers['Bugsnag-Sent-At']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('marks server error as retry', async () => {
    const net = {
      request: jest.fn().mockImplementation((opts, handle) => {
        handle({ statusCode: 500, on: (event, cb) => {} })
      })
    }

    const minidumpFile = join(minidumpsPath, 'test-minidump.dmp')
    await writeFile(minidumpFile, '{}', 'utf8')

    const { sendMinidump } = sendMinidumpFactory(net, client)
    await expect(sendMinidump(minidumpFile, null)).rejects.toHaveProperty('isRetryable', true)
  })

  it('marks bad request as no-retry', async () => {
    const net = {
      request: jest.fn().mockImplementation((opts, handle) => {
        handle({ statusCode: 400, on: (event, cb) => {} })
      })
    }

    const minidumpFile = join(minidumpsPath, 'test-minidump.dmp')
    await writeFile(minidumpFile, '{}', 'utf8')

    const { sendMinidump } = sendMinidumpFactory(net, client)
    await expect(sendMinidump(minidumpFile, null)).rejects.toHaveProperty('isRetryable', false)
  })

  describe('apiKey in events', () => {
    let minidumpFile
    const net = {
      request: jest.fn().mockImplementation((_, handle) => {
        handle({ statusCode: 200, on: (event, cb) => {} })
      })
    }

    beforeEach(async () => {
      minidumpFile = join(minidumpsPath, 'test-minidump.dmp')
      await writeFile(minidumpFile, '{}', 'utf8')
    })

    it('can be set by the event', async () => {
      const { sendMinidump } = sendMinidumpFactory(net, client)
      await sendMinidump(minidumpFile, {
        apiKey: 'c0ffeec0ffeec0ffeec0ffeec0ffeec0'
      })

      expect(net.request).toBeCalledTimes(1)

      const { url } = net.request.mock.calls[0][0]
      const parsedUrl = new URL(url)
      expect(parsedUrl.pathname).toBe('/test-minidump-endpoint/minidump')
      expect(parsedUrl.searchParams.get('api_key')).toBe('c0ffeec0ffeec0ffeec0ffeec0ffeec0')
    })
  })
})
