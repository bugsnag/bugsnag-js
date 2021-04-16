import Bugsnag from '@bugsnag/js';
import { start } from '../../lib/bugsnag'

start();

const handler = async (req, res) => {
  Bugsnag.notify(new Error('a handled error occurred'))
  await require('@bugsnag/in-flight').flush(2000)
  res.status(200).json({ name: 'John Doe' })
}

export default handler
