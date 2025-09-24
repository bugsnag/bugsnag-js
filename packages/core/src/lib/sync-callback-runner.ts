import type Breadcrumb from '../breadcrumb'
import { LoggerConfig, OnBreadcrumbCallback, OnSessionCallback } from '../common'
import type Session from '../session'
type Callbacks = (...args: any[]) => any

const runSyncCallbacks = (
  callbacks: OnSessionCallback[] | OnBreadcrumbCallback[] | Callbacks[] | any[],
  callbackArg: Session | Breadcrumb | Event,
  callbackType: string,
  logger: LoggerConfig
): boolean => {
  let ignore = false
  const cbs = callbacks.slice()
  while (!ignore) {
    if (!cbs.length) break
    try {
      ignore = cbs.pop()(callbackArg) === false
    } catch (e) {
      logger.error(
        `Error occurred in ${callbackType} callback, continuing anyway…`
      )
      logger.error(e)
    }
  }
  return ignore
}

export default runSyncCallbacks