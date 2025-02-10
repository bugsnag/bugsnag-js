import { Client } from '@bugsnag/core'
import delivery from '../'
import EventWithInternals from '@bugsnag/core/event'

type NativeStackIOS = string[]
interface AndroidStackFrame {
  class: string
  file: string
  lineNumber: number
  methodName: string
}
type NativeStackAndroid = AndroidStackFrame[]

type NativeClientEvent = Pick<EventWithInternals,
| 'errors'
| 'severity'
| 'unhandled'
| 'app'
| 'device'
| 'threads'
| 'breadcrumbs'
| 'context'
| 'groupingHash'
| 'apiKey'
> & {
  severityReason: EventWithInternals['_handledState']['severityReason']
  user: EventWithInternals['_user']
  metadata: EventWithInternals['_metadata']
  correlation: EventWithInternals['_correlation']
  nativeStack: NativeStackIOS | NativeStackAndroid
}

class ReactNativeError extends Error {
  nativeStackAndroid?: NativeStackAndroid
  nativeStackIOS?: NativeStackIOS
}

describe('delivery: react native', () => {
  it('sends the correct payload using the native client’s dispatchAsync() method', done => {
    const sent: NativeClientEvent[] = []
    const NativeClient = {
      dispatchAsync: (event: NativeClientEvent) => {
        sent.push(event)
        return new Promise((resolve) => resolve(true))
      }
    }
    const c = new Client({ apiKey: 'api_key' })

    const metaData: any = {
      from: 'javascript'
    }

    // ensure that circular references in metadata are safely handled
    metaData.circle = metaData

    c._setDelivery(client => delivery(client, NativeClient))
    c.leaveBreadcrumb('hi', metaData, 'state')
    c.setContext('test screen')
    c.setUser('123')
    c.notify(new Error('oh no'), (e) => {
      e.setTraceCorrelation('trace-id', 'span-id')
      e.groupingHash = 'ER_GRP_098'
      e.apiKey = 'abcdef123456abcdef123456abcdef123456'
    }, (err, event) => {
      expect(err).not.toBeTruthy()
      expect(sent.length).toBe(1)
      expect(sent[0].errors[0].errorMessage).toBe('oh no')
      expect(sent[0].severity).toBe('warning')
      expect(sent[0].severityReason.type).toBe('handledException')
      expect(sent[0].unhandled).toBe(false)
      expect(sent[0].app).toEqual({ releaseStage: 'production', version: undefined, type: undefined })
      expect(sent[0].device).toEqual({})
      expect(sent[0].threads).toEqual([])
      expect(sent[0].breadcrumbs.length).toBe(1)
      expect(sent[0].breadcrumbs[0].message).toBe('hi')
      expect(sent[0].breadcrumbs[0].metadata).toStrictEqual({
        from: 'javascript',
        circle: '[Circular]'
      })
      expect(sent[0].context).toBe('test screen')
      expect(sent[0].user).toEqual({ id: '123', email: undefined, name: undefined })
      expect(sent[0].metadata).toEqual({})
      expect(sent[0].groupingHash).toEqual('ER_GRP_098')
      expect(sent[0].apiKey).toBe('abcdef123456abcdef123456abcdef123456')
      expect(sent[0].correlation).toEqual({ traceId: 'trace-id', spanId: 'span-id' })
      done()
    })
  })

  it('extracts nativeStackIOS', done => {
    const sent: NativeClientEvent[] = []
    const NativeClient = {
      dispatchAsync: (event: NativeClientEvent) => {
        sent.push(event)
        return new Promise((resolve) => resolve(true))
      }
    }
    const c = new Client({ apiKey: 'api_key' })
    c._setDelivery(client => delivery(client, NativeClient))
    const error = new ReactNativeError('oh no')
    error.nativeStackIOS = [
      '0   ReactNativeTest                     0x000000010fda7f1b RCTJSErrorFromCodeMessageAndNSError + 79',
      '1   ReactNativeTest                     0x000000010fd76897 __41-[RCTModuleMethod processMethodSignature]_block_invoke_2.103 + 97',
      '2   ReactNativeTest                     0x000000010fccd9c3 -[BenCrash asyncReject:rejecter:] + 106',
      '3   CoreFoundation                      0x00007fff23e44dec __invoking___ + 140',
      '4   CoreFoundation                      0x00007fff23e41fd1 -[NSInvocation invoke] + 321',
      '5   CoreFoundation                      0x00007fff23e422a4 -[NSInvocation invokeWithTarget:] + 68',
      '6   ReactNativeTest                     0x000000010fd76eae -[RCTModuleMethod invokeWithBridge:module:arguments:] + 578',
      '7   ReactNativeTest                     0x000000010fd79138 _ZN8facebook5reactL11invokeInnerEP9RCTBridgeP13RCTModuleDatajRKN5folly7dynamicE + 246'
    ]
    c.notify(error, (e) => {}, (err, event) => {
      expect(err).not.toBeTruthy()
      expect(sent[0].nativeStack).toEqual(error.nativeStackIOS)
      done()
    })
  })

  it('extracts nativeStackAndroid', done => {
    const sent: NativeClientEvent[] = []
    const NativeClient = {
      dispatchAsync: (event: NativeClientEvent) => {
        sent.push(event)
        return new Promise((resolve) => resolve(true))
      }
    }
    const c = new Client({ apiKey: 'api_key' })
    c._setDelivery(client => delivery(client, NativeClient))
    const error = new ReactNativeError('oh no')
    error.nativeStackAndroid = [
      {
        class: 'com.testing.Blah',
        lineNumber: 101,
        file: 'app/com.testing.Blah.java',
        methodName: 'crash()'
      }
    ]
    c.notify(error, (e) => {}, (err, event) => {
      expect(err).not.toBeTruthy()
      expect(sent[0].nativeStack).toBe(error.nativeStackAndroid)
      done()
    })
  })

  it('uses the synchronous dispatch() method when Turbo Modules are enabled', done => {
    // @ts-expect-error __turboModuleProxy does not exist on type 'Global'
    global.__turboModuleProxy = {}

    const sent: NativeClientEvent[] = []
    const NativeClient = {
      dispatch: (event: NativeClientEvent) => {
        sent.push(event)
        return true
      }
    }
    const c = new Client({ apiKey: 'api_key' })

    const metaData: any = {
      from: 'javascript'
    }

    // ensure that circular references in metadata are safely handled
    metaData.circle = metaData

    c._setDelivery(client => delivery(client, NativeClient))
    c.leaveBreadcrumb('hi', metaData, 'state')
    c.setContext('test screen')
    c.setUser('123')
    c.notify(new Error('oh no'), (e) => {
      e.groupingHash = 'ER_GRP_098'
      e.apiKey = 'abcdef123456abcdef123456abcdef123456'
    }, (err, event) => {
      expect(err).not.toBeTruthy()
      expect(sent.length).toBe(1)
      expect(sent[0].errors[0].errorMessage).toBe('oh no')
      expect(sent[0].severity).toBe('warning')
      expect(sent[0].severityReason.type).toBe('handledException')
      expect(sent[0].unhandled).toBe(false)
      expect(sent[0].app).toEqual({ releaseStage: 'production', version: undefined, type: undefined })
      expect(sent[0].device).toEqual({})
      expect(sent[0].threads).toEqual([])
      expect(sent[0].breadcrumbs.length).toBe(1)
      expect(sent[0].breadcrumbs[0].message).toBe('hi')
      expect(sent[0].breadcrumbs[0].metadata).toStrictEqual({
        from: 'javascript',
        circle: '[Circular]'
      })
      expect(sent[0].context).toBe('test screen')
      expect(sent[0].user).toEqual({ id: '123', email: undefined, name: undefined })
      expect(sent[0].metadata).toEqual({})
      expect(sent[0].groupingHash).toEqual('ER_GRP_098')
      expect(sent[0].apiKey).toBe('abcdef123456abcdef123456abcdef123456')
      done()
    })
  })
})
