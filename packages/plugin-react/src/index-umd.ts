import BugsnagPluginReact, { formatComponentStack } from './plugin'

import assign from '@bugsnag/core/lib/es-utils/assign'

export default assign(BugsnagPluginReact, { formatComponentStack })
