import prompts from 'prompts'
import logger from '../Logger'
import { detectState, RepoState } from '../lib/Repo'
import onCancel from '../lib/OnCancel'

export default async function run (argv: string[], projectRoot: string, opts: Record<string, unknown>): Promise<void> {
  logger.info('Detecting repo state')
  const state = detectState(projectRoot, logger)
  switch (state) {
    case RepoState.NONE: {
      logger.warn(NONE_MSG)
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to continue anyway?',
        initial: false
      }, { onCancel })
      if (!confirm) process.exit(0)
      break
    }
    case RepoState.GIT_DIRTY: {
      logger.warn(DIRTY_MSG)
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to continue anyway?',
        initial: false
      }, { onCancel })
      if (!confirm) process.exit(0)
      break
    }
    case RepoState.GIT_CLEAN: {
      logger.warn(CLEAN_MSG)
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to continue?',
        initial: true
      }, { onCancel })
      if (!confirm) process.exit(0)
      break
    }
    default: {
      logger.warn(UNKNOWN_MSG)
      const { confirm } = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Do you want to continue?',
        initial: false
      }, { onCancel })
      if (!confirm) process.exit(0)
      break
    }
  }
}

const NONE_MSG = `No repo detected.

This command may make modifications to your project. It is recommended that you commit the
current status of your code to a git repo before continuing.`

const DIRTY_MSG = `Uncommited changes detected.

This command may make modifications to your project. It is recommended that you commit or
stash your current changes before continuing.

Afterwards you can review the diff of the changes made by this command and commit
them to your project.`

const CLEAN_MSG = `This command may make modifications to your project. Afterwards you can
review the diff and commit them to your project.`

const UNKNOWN_MSG = `Unable to detect repo state.

This command may make modifications to your project. It is recommended that you commit the
current status of your code to a git repo before continuing.`
