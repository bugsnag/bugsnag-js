import { start, getServerlessHandler } from '../../lib/bugsnag';

start();
const serverlessHandler = getServerlessHandler()

const doAsyncWork = () => Promise.reject(new Error('API Test 1'))
doAsyncWork()

async function handler(req, res) {
  res.status(200).json({ name: 'John Doe' })
}

export default serverlessHandler(handler)
