const { createHmac } = require('crypto')

function sign(data, secret) {
  const hmac = createHmac('sha256', secret)
  hmac.update(JSON.stringify(data))
  return hmac.digest('hex')
}

module.exports = { sign }