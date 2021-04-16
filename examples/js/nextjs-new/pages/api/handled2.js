import Bugsnag from '@bugsnag/js';
import { start } from '../../lib/bugsnag'

start();

const handler = async (req, res) => {
  await new Promise(async resolve => {
    Bugsnag.notify(
      new Error('a handled error occurred'),
      undefined,
      async () => {
        await require('@bugsnag/in-flight').flush(2000)
        resolve()
      }
    )
  })
  res.status(200).json({ name: 'John Doe' })
}

export default handler
