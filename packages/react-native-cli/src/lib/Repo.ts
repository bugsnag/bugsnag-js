import { spawnSync } from 'child_process'
import { Logger } from '../Logger'

export enum RepoState { UNKNOWN, GIT_CLEAN, GIT_DIRTY, NONE }

export function detectState (projectRoot: string, logger: Logger) {
  const res = gitStatus(projectRoot)

  if (res.error) {
    if ((res.error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.warn(res.error)
    }

    return RepoState.UNKNOWN
  }

  if (res.stderr.match(/not a git repository/)) return RepoState.NONE
  if (res.stdout.length > 0) return RepoState.GIT_DIRTY
  return RepoState.GIT_CLEAN
}

function gitStatus (cwd: string) {
  return spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' })
}
