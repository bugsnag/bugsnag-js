import Client from '@bugsnag/core/client'
import Event from '@bugsnag/core/event'
import Session from '@bugsnag/core/session'
import Breadcrumb from '@bugsnag/core/breadcrumb'

import assign from '@bugsnag/core/lib/es-utils/assign'

import Bugsnag from './bugsnag'

export default assign(Bugsnag, { Breadcrumb, Client, Event, Session })
