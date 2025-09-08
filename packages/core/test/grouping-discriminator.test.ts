import Client from '../client'

describe('@bugsnag/core/grouping discriminator', () => {
  describe('Client', () => {
    describe('getGroupingDiscriminator() / setGroupingDiscriminator()', () => {
      it('sets and retrieves grouping discriminator on client', () => {
        const client = new Client({ apiKey: 'API_KEY' })

        // Initially should be undefined
        expect(client.getGroupingDiscriminator()).toBe(undefined)

        // Set a value and retrieve it
        const previousValue = client.setGroupingDiscriminator('test-discriminator')
        expect(previousValue).toBe(undefined)
        expect(client.getGroupingDiscriminator()).toBe('test-discriminator')

        // Update the value
        const previousValue2 = client.setGroupingDiscriminator('new-discriminator')
        expect(previousValue2).toBe('test-discriminator')
        expect(client.getGroupingDiscriminator()).toBe('new-discriminator')

        // Clear the value
        const previousValue3 = client.setGroupingDiscriminator(undefined)
        expect(previousValue3).toBe('new-discriminator')
        expect(client.getGroupingDiscriminator()).toBe(undefined)
      })
    })
  })

  describe('Client notify() integration', () => {
    it('uses client grouping discriminator when event has none set', (done) => {
      const client = new Client({ apiKey: 'API_KEY' })
      client.setGroupingDiscriminator('client-discriminator')

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events).toHaveLength(1)
          const event = payload.events[0]
          expect(event.getGroupingDiscriminator()).toBe('client-discriminator')

          const eventPayload = event.toJSON()
          expect(eventPayload.groupingDiscriminator).toBe('client-discriminator')
          done()
        },
        sendSession: () => {}
      }))

      client.notify(new Error('test error'))
    })

    it('uses event grouping discriminator when set, ignoring client discriminator', (done) => {
      const client = new Client({ apiKey: 'API_KEY' })
      client.setGroupingDiscriminator('client-discriminator')

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events).toHaveLength(1)
          const event = payload.events[0]
          expect(event.getGroupingDiscriminator()).toBe('event-discriminator')

          const eventPayload = event.toJSON()
          expect(eventPayload.groupingDiscriminator).toBe('event-discriminator')
          done()
        },
        sendSession: () => {}
      }))

      client.notify(new Error('test error'), (event) => {
        event.setGroupingDiscriminator('event-discriminator')
      })
    })

    it('does not set grouping discriminator when neither client nor event has one', (done) => {
      const client = new Client({ apiKey: 'API_KEY' })

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events).toHaveLength(1)
          const event = payload.events[0]
          expect(event.getGroupingDiscriminator()).toBe(undefined)

          const eventPayload = event.toJSON()
          expect(eventPayload.groupingDiscriminator).toBe(undefined)
          done()
        },
        sendSession: () => {}
      }))

      client.notify(new Error('test error'))
    })

    it('handles multiple notify calls with different discriminators', (done) => {
      const client = new Client({ apiKey: 'API_KEY' })
      client.setGroupingDiscriminator('client-discriminator')

      let callCount = 0
      const expectedResults = [
        'client-discriminator', // First call uses client discriminator
        'custom-discriminator', // Second call has event discriminator set
        'client-discriminator', // Third call uses client discriminator again
        undefined // Fourth call has the discriminator cleared
      ]

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events).toHaveLength(1)
          const event = payload.events[0]
          expect(event.getGroupingDiscriminator()).toBe(expectedResults[callCount])

          const eventPayload = event.toJSON()
          expect(eventPayload.groupingDiscriminator).toBe(expectedResults[callCount])

          callCount++
          if (callCount === 4) {
            done()
          }
        },
        sendSession: () => {}
      }))

      // First notify - should use client discriminator
      client.notify(new Error('test error 1'))

      // Second notify - should use event discriminator
      client.notify(new Error('test error 2'), (event) => {
        event.setGroupingDiscriminator('custom-discriminator')
      })

      // Third notify - should use client discriminator again
      client.notify(new Error('test error 3'))

      // Fourth notify - clear the event discriminator
      client.notify(new Error('test error 4'), (event) => {
        event.setGroupingDiscriminator(undefined)
      })
    })

    it('allows changing client discriminator between notify calls', (done) => {
      const client = new Client({ apiKey: 'API_KEY' })
      client.setGroupingDiscriminator('initial-discriminator')

      let callCount = 0
      const expectedResults = [
        'initial-discriminator',
        'updated-discriminator'
      ]

      client._setDelivery(client => ({
        sendEvent: (payload) => {
          expect(payload.events).toHaveLength(1)
          const event = payload.events[0]
          expect(event.getGroupingDiscriminator()).toBe(expectedResults[callCount])

          callCount++
          if (callCount === 2) {
            done()
          }
        },
        sendSession: () => {}
      }))

      // First notify
      client.notify(new Error('test error 1'))

      // Change client discriminator
      client.setGroupingDiscriminator('updated-discriminator')

      // Second notify
      client.notify(new Error('test error 2'))
    })
  })
})
