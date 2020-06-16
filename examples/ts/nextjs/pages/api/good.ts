import { NextApiRequest, NextApiResponse } from 'next'
import '../../lib/bugsnag';
import Bugsnag from '@bugsnag/js';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ name: 'John Doe' }))

  Bugsnag.notify(new Error('something was called'))
}
