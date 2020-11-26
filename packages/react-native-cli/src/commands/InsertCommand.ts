import logger from '../Logger'
import { insertJs, insertAndroid, insertIos } from '../lib/Insert'

export default async function run (argv: string[], projectRoot: string, opts: Record<string, unknown>): Promise<void> {
  try {
    await insertJs(projectRoot, logger)
    await insertIos(projectRoot, logger)
    await insertAndroid(projectRoot, logger)
  } catch (e) {
    logger.error(e)
  }
}
