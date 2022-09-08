import BugsnagReactPlugin from '@bugsnag/plugin-react'
import React from 'react'

var NOTIFY = decodeURIComponent(window.location.search.match(/NOTIFY=([^&]+)/)![1])
var SESSIONS = decodeURIComponent(window.location.search.match(/SESSIONS=([^&]+)/)![1])
var API_KEY = decodeURIComponent(window.location.search.match(/API_KEY=([^&]+)/)![1])

export const apiKey = API_KEY
export const endpoints = { notify: NOTIFY, sessions: SESSIONS }
export const plugins = [new BugsnagReactPlugin(React)]
