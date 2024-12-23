import Client from '@bugsnag/core/client'
// @ts-ignore
import Event from '@bugsnag/core/event'
// @ts-ignore
import Session from '@bugsnag/core/session'
// @ts-ignore
import Breadcrumb from '@bugsnag/core/breadcrumb'

import assign from '@bugsnag/core/lib/es-utils/assign'

import Bugsnag from './bugsnag'

export default assign(Bugsnag, { Client, Event, Session, Breadcrumb })
export type { BrowserBugsnagStatic, BrowserConfig } from './bugsnag'

export type { Client, Event, Session, Breadcrumb, Plugin } from '@bugsnag/core'
