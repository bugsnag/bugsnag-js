import Bugsnag from '@bugsnag/js';
import { start } from '../../lib/bugsnag'

start();

const handler = async (req, res) => {
  await new Promise(resolve =>
    Bugsnag.notify(new Error('a handled error occurred'), undefined, () => resolve())
  )
  res.status(200).json({ name: 'John Doe' })
}

export default handler
