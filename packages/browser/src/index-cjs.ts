import Event from '@bugsnag/core/event'
import Session from '@bugsnag/core/session'

import { Breadcrumb, Client } from '@bugsnag/core'

import assign from '@bugsnag/core/lib/es-utils/assign'

import Bugsnag from './bugsnag'

export default assign(Bugsnag, { Breadcrumb, Client, Event, Session })
