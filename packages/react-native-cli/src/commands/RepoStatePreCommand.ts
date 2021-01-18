import prompts from 'prompts'
import logger from '../Logger'
import { detectState, RepoState } from '../lib/Repo'
import onCancel from '../lib/OnCancel'

export default async function run (argv: string[], projectRoot: string, opts: Record<string, unknown>): Promise<void> {
  logger.info('Detecting repo state')

  const state = detectState(projectRoot, logger)
  const continueByDefault = state === RepoState.GIT_CLEAN

  logger.warn(messages[state])

  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Do you want to continue anyway?',
    initial: continueByDefault
  }, { onCancel })

  if (!confirm) process.exit(0)
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

const messages = {
  [RepoState.NONE]: NONE_MSG,
  [RepoState.GIT_DIRTY]: DIRTY_MSG,
  [RepoState.GIT_CLEAN]: CLEAN_MSG,
  [RepoState.UNKNOWN]: UNKNOWN_MSG
}
