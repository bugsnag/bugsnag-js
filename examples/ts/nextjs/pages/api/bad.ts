import { NextApiRequest, NextApiResponse } from 'next'
import '../../lib/bugsnag';
import Bugsnag from '@bugsnag/js';

var middleware = Bugsnag.getPlugin('express')

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}


export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Run the middleware
    // This must be the first piece of middleware in the stack.
    // It can only capture errors in downstream middleware
    await runMiddleware(req, res, middleware.requestHandler)

    throw new Error('error in next.js API route');

  } catch (error) {
    middleware.errorHandler(error, req, res, () => {
      throw error;
    })
  }
}
