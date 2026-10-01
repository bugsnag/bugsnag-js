import { Breadcrumb, Client, Event, Session } from '@bugsnag/core'



import Bugsnag from './notifier'

export default Object.assign(Bugsnag, { Breadcrumb, Client, Event, Session })
