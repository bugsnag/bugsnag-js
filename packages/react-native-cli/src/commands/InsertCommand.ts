import logger from '../Logger'
import { insertJs, insertAndroid, insertIos } from '../lib/Insert'

export default async function run (argv: string[], opts: Record<string, unknown>): Promise<void> {
  const projectRoot = process.cwd()

  try {
    await insertJs(projectRoot, logger)
    await insertIos(projectRoot, logger)
    await insertAndroid(projectRoot, logger)
  } catch (e) {
    logger.error(e)
  }
}
