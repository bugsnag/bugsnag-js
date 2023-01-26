import jsonPayload from '../json-payload'

function makeBigObject () {
  var big: Record<string, string> = {}
  var i = 0
  while (JSON.stringify(big).length < 2 * 10e5) {
    big['entry' + i] = 'long repetitive string'.repeat(1000)
    i++
  }
  return big
}

describe('jsonPayload.event', () => {
  it('safe stringifies the payload and redacts values from certain paths of the supplied keys', () => {
    expect(jsonPayload.event({
      api_key: 'd145b8e5afb56516423bc4d605e45442',
      events: [
        {
          errorMessage: 'Failed load tickets',
          errorClass: 'CheckoutError',
          user: {
            name: 'Jim Bug',
            email: 'jim@bugsnag.com'
          },
          request: {
            api_key: '245b39ebd3cd3992e85bffc81c045924'
          }
        }
      ]
    }, ['api_key'])).toBe('{"api_key":"d145b8e5afb56516423bc4d605e45442","events":[{"errorMessage":"Failed load tickets","errorClass":"CheckoutError","user":{"name":"Jim Bug","email":"jim@bugsnag.com"},"request":{"api_key":"[REDACTED]"}}]}')
  })

  it('strips the metaData of the first event if the payload is too large', () => {
    const payload = {
      api_key: 'd145b8e5afb56516423bc4d605e45442',
      events: [
        {
          errorMessage: 'Failed load tickets',
          errorClass: 'CheckoutError',
          user: {
            name: 'Jim Bug',
            email: 'jim@bugsnag.com'
          },
          request: {
            api_key: '245b39ebd3cd3992e85bffc81c045924'
          },
          _metadata: {}
        }
      ]
    }

    payload.events[0]._metadata = { 'big thing': makeBigObject() }

    expect(jsonPayload.event(payload)).toBe('{"api_key":"d145b8e5afb56516423bc4d605e45442","events":[{"errorMessage":"Failed load tickets","errorClass":"CheckoutError","user":{"name":"Jim Bug","email":"jim@bugsnag.com"},"request":{"api_key":"245b39ebd3cd3992e85bffc81c045924"},"_metadata":{"notifier":"WARNING!\\nSerialized payload was 2.003435MB (limit = 1MB)\\nmetadata was removed"}}]}')
  })

  it('does not attempt to strip any other data paths from the payload to reduce the size', () => {
    const payload = {
      api_key: 'd145b8e5afb56516423bc4d605e45442',
      events: [
        {
          errorMessage: 'Failed load tickets',
          errorClass: 'CheckoutError',
          user: {
            name: 'Jim Bug',
            email: 'jim@bugsnag.com'
          },
          _metadata: {}
        },
        {
          errorMessage: 'Request failed',
          errorClass: 'APIError',
          _metadata: {}
        }
      ]
    }
    payload.events[1]._metadata = { 'big thing': makeBigObject() }

    expect(jsonPayload.event(payload).length).toBeGreaterThan(10e5)
  })
})

describe('jsonPayload.session', () => {
  it('safe stringifies the payload', () => {
    expect(jsonPayload.session({
      api_key: 'd145b8e5afb56516423bc4d605e45442',
      events: [
        {
          errorMessage: 'Failed load tickets',
          errorClass: 'CheckoutError',
          user: {
            name: 'Jim Bug',
            email: 'jim@bugsnag.com'
          },
          request: {
            api_key: '245b39ebd3cd3992e85bffc81c045924'
          }
        }
      ]
    }, ['api_key'])).toBe('{"api_key":"d145b8e5afb56516423bc4d605e45442","events":[{"errorMessage":"Failed load tickets","errorClass":"CheckoutError","user":{"name":"Jim Bug","email":"jim@bugsnag.com"},"request":{"api_key":"245b39ebd3cd3992e85bffc81c045924"}}]}')
  })
})
