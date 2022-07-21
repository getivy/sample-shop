const { createHmac } = require('crypto')
const config = require('../config')

function sign(data) {
  const hmac = createHmac('sha256', config.IVY_WEBHOOK_SIGNING_SECRET)
  hmac.update(JSON.stringify(data))
  return hmac.digest('hex')
}

module.exports = { sign }