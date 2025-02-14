import { Breadcrumb, Client, Event, Session } from '@bugsnag/core'

import assign from '@bugsnag/core/lib/es-utils/assign'

import Bugsnag from './bugsnag'

export default assign(Bugsnag, { Breadcrumb, Client, Event, Session })
