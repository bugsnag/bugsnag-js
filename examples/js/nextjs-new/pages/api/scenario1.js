/**
 * API scenario 1
 * 
 * API has a top-of-module Promise that rejects, but its result is not awaited.
 */

import { start, getServerlessHandler } from '../../lib/bugsnag';

start();
const serverlessHandler = getServerlessHandler()

const doAsyncWork = () => Promise.reject(new Error('API scenario 1'))
doAsyncWork()

async function handler(req, res) {
  res.status(200).json({ name: 'John Doe' })
}

export default serverlessHandler(handler)
