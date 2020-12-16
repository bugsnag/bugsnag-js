import logger from '../Logger'
import { insertJs, insertAndroid, insertIos } from '../lib/Insert'

export default async function run (argv: string[], projectRoot: string, opts: Record<string, unknown>): Promise<boolean> {
  try {
    await insertJs(projectRoot, logger)
    await insertIos(projectRoot, logger)
    await insertAndroid(projectRoot, logger)
    return true
  } catch (e) {
    logger.error(e)
    return false
  }
}
