import { start, getServerlessHandler } from '../../lib/bugsnag'

start();
const bugsnagHandler = getServerlessHandler();

const handler = (req, res) => {
  throw new Error('something went wrong')
  res.status(200).json({ name: 'John Doe' })
}

export default bugsnagHandler(handler);
