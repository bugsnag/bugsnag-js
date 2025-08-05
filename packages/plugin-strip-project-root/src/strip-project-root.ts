import { Config, Plugin, Stackframe } from '@bugsnag/core'
import normalizePath from '@bugsnag/path-normalizer'

interface PluginConfig extends Config {
  projectRoot?: string
}

const plugin: Plugin<PluginConfig> = {
  load: client => client.addOnError(event => {
    if (!client._config.projectRoot) return
    const projectRoot = normalizePath(client._config.projectRoot)
    const allFrames: Stackframe[] = event.errors.reduce((accum: Stackframe[], er) => accum.concat(er.stacktrace), [])
    allFrames.map(stackframe => {
      if (typeof stackframe.file === 'string' && stackframe.file.indexOf(projectRoot) === 0) {
        stackframe.file = stackframe.file.replace(projectRoot, '')
      }
    })
  })
}

export default plugin