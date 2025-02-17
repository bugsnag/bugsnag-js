import { Breadcrumb, Client, Event, Session } from '@bugsnag/core'

import Bugsnag from './bugsnag'

export default Object.assign(Bugsnag, { Breadcrumb, Client, Event, Session })
