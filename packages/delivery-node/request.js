const http = require('http')
const https = require('https')

const deliveryError = (code, message) => Object.assign(new Error(message), { code })

module.exports = ({ url, headers, body, agent, timeoutMs, maxRequestBytes, maxResponseBytes }, cb, onRelease = () => {}) => {
  let completed = false
  let released = false
  let req
  let response
  let timer
  let chunks = []
  let responseBytes = 0

  const release = () => {
    if (released) return
    released = true
    onRelease()
  }

  const finish = (err, responseBody) => {
    if (completed) return
    completed = true
    clearTimeout(timer)
    chunks = []
    if (err) {
      if (response) response.destroy()
      if (req) req.destroy()
    }
    // Node can retain a destroyed request in a shared Agent queue until a socket frees.
    // Its admission slot must outlive completion until the request actually closes.
    if (!req || !err) release()
    cb(err, responseBody)
  }

  if (maxRequestBytes !== undefined && Buffer.byteLength(body) > maxRequestBytes) {
    return finish(deliveryError('ERR_DELIVERY_REQUEST_SIZE', 'Delivery request exceeds maxRequestBytes'))
  }

  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') throw new Error('Unsupported delivery protocol')
    const transport = parsedUrl.protocol === 'https:' ? https : http
    req = transport.request({
      method: 'POST',
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      headers,
      agent
    })
  } catch (err) {
    return finish(err || new Error('Delivery request setup failed'))
  }

  req.on('error', finish)
  req.on('close', () => {
    release()
    if (!completed && !response) finish(deliveryError('ERR_DELIVERY_CLOSED', 'Delivery request closed before a response'))
  })
  req.on('response', res => {
    response = res
    res.on('error', finish)
    res.on('aborted', () => {
      if (!completed) finish(deliveryError('ERR_DELIVERY_CLOSED', 'Delivery response aborted'))
    })
    res.on('close', () => {
      if (!completed) finish(deliveryError('ERR_DELIVERY_CLOSED', 'Delivery response closed before completion'))
    })
    res.on('data', chunk => {
      if (completed) return
      responseBytes += chunk.length
      if (maxResponseBytes !== undefined && responseBytes > maxResponseBytes) {
        return finish(deliveryError('ERR_DELIVERY_RESPONSE_SIZE', 'Delivery response exceeds maxResponseBytes'))
      }
      chunks.push(chunk)
    })
    res.on('end', () => {
      if (completed) return
      const responseBody = Buffer.concat(chunks, responseBytes).toString('utf8')
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return finish(deliveryError('ERR_DELIVERY_HTTP', `Bad statusCode from API: ${res.statusCode}\n${responseBody}`))
      }
      finish(null, responseBody)
    })
  })

  if (timeoutMs !== undefined) {
    timer = setTimeout(() => finish(deliveryError('ERR_DELIVERY_TIMEOUT', 'Delivery exceeded timeoutMs')), timeoutMs)
  }

  try {
    req.end(body)
  } catch (err) {
    finish(err || new Error('Delivery request write failed'))
  }
}
