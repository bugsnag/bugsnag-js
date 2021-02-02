import Client from '@bugsnag/core/client'
import plugin from '../'
import { Breadcrumb } from '@bugsnag/core'

describe('plugin: electron client sync', () => {
  it('updates context', done => {
    const c = new Client({
      apiKey: 'api_key',
      plugins: [
        plugin({
          updateContext: (update: any) => {
            expect(update).toBe('1234')
            done()
          }
        })
      ]
    })
    c.setContext('1234')
  })

  it('updates metadata', done => {
    const c = new Client({
      apiKey: 'api_key',
      plugins: [
        plugin({
          addMetadata: (key: string, updates: any) => {
            expect(key).toBe('widget')
            expect(updates).toEqual({
              id: '14',
              count: 340
            })
            done()
          }
        })
      ]
    })
    c.addMetadata('widget', { id: '14', count: 340 })
    expect(c.getMetadata('widget')).toEqual({ id: '14', count: 340 })
  })

  it('clears metadata', done => {
    const c = new Client({
      apiKey: 'api_key',
      plugins: [
        plugin({
          addMetadata: () => {},
          clearMetadata: () => {}
        })
      ]
    })
    c.addMetadata('widget', { id: '14', count: 340 })
    expect(c.getMetadata('widget')).toEqual({ id: '14', count: 340 })
    c.clearMetadata('widget', 'count')
    expect(c.getMetadata('widget', 'count')).toBeUndefined()
    c.clearMetadata('widget')
    expect(c.getMetadata('widget')).toBeUndefined()
    done()
  })

  it('updates user', done => {
    const c = new Client({
      apiKey: 'api_key',
      plugins: [
        plugin({
          updateUser: (id: string, email: string, name: string) => {
            expect(id).toBe('1234')
            expect(name).toBe('Ben')
            expect(email).toBe('user@example.com')
            done()
          }
        })
      ]
    })
    c.setUser('1234', 'user@example.com', 'Ben')
    expect(c.getUser()).toEqual({ id: '1234', name: 'Ben', email: 'user@example.com' })
  })

  it('syncs breadcrumbs', (done) => {
    const c = new Client({
      apiKey: 'api_key',
      plugins: [
        plugin({
          leaveBreadcrumb: ({ message, metadata, type, timestamp }: Breadcrumb) => {
            expect(message).toBe('Spin')
            expect(type).toBe('manual')
            expect(metadata).toEqual({ direction: 'ccw', deg: '90' })
            expect(timestamp).toBeTruthy()
            done()
          }
        })
      ]
    })
    c.leaveBreadcrumb('Spin', { direction: 'ccw', deg: '90' })
  })
})
