import { promises } from 'fs'
import { join } from 'path'
import sendMinidumpFactory from '../send-minidump'

const { mkdtemp, rmdir, writeFile } = promises

const client = {
  _config: {
    apiKey: 'test-api-key',
    redactedKeys: [],
    endpoints: {
      minidumps: 'http://localhost/test-minidump-endpoint'
    }
  }
}

describe('electron-minidump-delivery: sendMinidump', () => {
  let minidumpsPath

  beforeEach(async () => {
    minidumpsPath = await mkdtemp('send-minidumps-')
  })

  afterEach(() => rmdir(minidumpsPath, { recursive: true }))

  it('sends minidump successfully', async () => {
    const net = {
      request: jest.fn().mockImplementation((_, handle) => {
        handle({ statusCode: 200 })
      })
    }

    const minidumpFile = join(minidumpsPath, 'test-minidump.dmp')
    await writeFile(minidumpFile, '{}', 'utf8')

    const { sendMinidump } = sendMinidumpFactory(net, client)
    await sendMinidump(minidumpFile, null)

    expect(net.request).toBeCalledTimes(1)

    const { url, method, headers } = net.request.mock.calls[0][0]
    expect(url).toMatch(/\?api_key=test-api-key/)
    expect(method).toBe('POST')
    expect(headers['content-type']).toMatch(/^multipart\/form-data/)
    expect(headers['Bugsnag-Sent-At']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('marks server error as retry', async () => {
    const net = {
      request: jest.fn().mockImplementation((opts, handle) => {
        handle({ statusCode: 500 })
      })
    }

    const minidumpFile = join(minidumpsPath, 'test-minidump.dmp')
    await writeFile(minidumpFile, '{}', 'utf8')

    const { sendMinidump } = sendMinidumpFactory(net, client)
    await expect(sendMinidump(minidumpFile, null)).rejects.toHaveProperty('isRetryable', true)
  })
})
