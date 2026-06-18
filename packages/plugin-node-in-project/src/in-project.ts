import { Config, Plugin, Stackframe } from '@bugsnag/core'
import normalizePath from '@bugsnag/path-normalizer'

interface PluginConfig extends Config {
  projectRoot?: string
}

const NODE_MODULES_PATH_REGEX = /\/node_modules\//

const plugin: Plugin<PluginConfig> = {
  load: (client) => {
    client.addOnError((event) => {
      const configuredProjectRoot = client._config.projectRoot
      if (!configuredProjectRoot) return

      const projectRoot = normalizePath(configuredProjectRoot)

      const allFrames: Stackframe[] = event.errors.reduce(
        (accum: Stackframe[], error) => accum.concat(error.stacktrace),
        []
      )

      allFrames.forEach((stackframe: Stackframe) => {
        const file = stackframe.file
        stackframe.inProject =
          typeof file === 'string' &&
          file.startsWith(projectRoot) &&
          !NODE_MODULES_PATH_REGEX.test(file)
      })
    })
  }
}

export default plugin