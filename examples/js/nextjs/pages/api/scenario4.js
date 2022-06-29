/**
 * API scenario 4
 * 
 * API uses a try/catch to handle an exception and records it.
 */

import Bugsnag from '@bugsnag/js'
import { start, getServerlessHandler } from '../../lib/bugsnag'

start()
const serverlessHandler = getServerlessHandler()

async function handler(req, res) {
  try {
    throw new Error('API scenario 4')
  } catch (error) {
    Bugsnag.notify(error)
  }

  // Flushing before returning is necessary if deploying to Vercel, see
  // https://vercel.com/docs/platform/limits#streaming-responses
  await require('@bugsnag/in-flight').flush(2000);
  res.status(200).json({ name: 'John Doe' })
}

export default serverlessHandler(handler)
