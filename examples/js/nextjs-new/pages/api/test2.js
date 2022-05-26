/**
 * API Test 2
 * 
 * API has a top-of-module exception.
 */

import { start, getServerlessHandler } from '../../lib/bugsnag';

start();
const serverlessHandler = getServerlessHandler()

function work() {
  throw new Error('API Test 2')
}

work()

async function handler(req, res) {
  res.status(200).json({ name: 'John Doe' })
}

export default serverlessHandler(handler)
