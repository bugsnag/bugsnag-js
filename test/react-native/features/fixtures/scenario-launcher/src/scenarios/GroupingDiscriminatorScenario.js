import Scenario from './Scenario'
import Bugsnag from '@bugsnag/react-native'

export class GroupingDiscriminatorScenario extends Scenario {
  run () {
    // 1. Notify with error that has no discriminator
    Bugsnag.notify(new Error('no-discriminator'))

    // 2. Notify with error that should use client discriminator
    Bugsnag.setGroupingDiscriminator('client-discriminator')
    Bugsnag.notify(new Error('client-discriminator'))

    // 3. Notify with error and set event discriminator
    Bugsnag.notify(new Error('event-discriminator'), event => {
      event.setGroupingDiscriminator('event-discriminator')
    })

    // 4. Notify with error and explicitly set event discriminator to null
    Bugsnag.notify(new Error('null-discriminator'), event => {
      event.setGroupingDiscriminator(null)
    })

    // 5. Notify with error and explicitly set event discriminator to undefined
    Bugsnag.notify(new Error('undefined-discriminator'), event => {
      event.setGroupingDiscriminator(undefined)
    })

    // 6. Clear client grouping discriminator and notify
    Bugsnag.setGroupingDiscriminator(undefined)
    Bugsnag.notify(new Error('no-discriminator-2'))
  }
}
