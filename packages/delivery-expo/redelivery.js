const REDELIVER_INTERVAL_MS = 30 * 1000
const MAX_RETRIES = 5

module.exports = (
  send,
  queue,
  onerror = () => {},
  redeliveryInterval = REDELIVER_INTERVAL_MS,
  maxRetries = MAX_RETRIES
) => {
  let timer = null
  let stopped = false

  const stop = () => {
    stopped = true
    clearTimeout(timer)
  }

  const schedule = (fn, t) => {
    if (stopped) return
    timer = setTimeout(fn, t)
  }

  const redeliver = async () => {
    try {
      // pop a failed request off of the queue
      const req = await queue.dequeue(onerror)

      // if there isn't anything on the queue, wait and try again
      if (!req) {
        schedule(redeliver, redeliveryInterval)
        return
      }

      // if there is, attempt to deliver it
      send(req.url, req.opts, (err) => {
        if (err) {
          onerror(err)
          // increment the retry count
          const r = { ...req, retries: req.retries + 1 }
          // if it's allowed some more retries and the failure this time is not
          // explicitly marked isRetryable=false, enqueue it again for later
          if (err.isRetryable !== false && r.retries < maxRetries) queue.enqueue(r, onerror)
          // try again later
          schedule(redeliver, redeliveryInterval)
          return
        }
        // this redelivery succeed, grab another immediately
        schedule(redeliver, 0)
      })
    } catch (e) {
      onerror(e)
    }
  }

  // kick off the redeliver loop, but not before the notifier has been configured
  schedule(redeliver, 0)

  // allow the timeout to be cleared
  return () => stop()
}
