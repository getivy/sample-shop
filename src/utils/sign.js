const { createHmac } = require('crypto')

function sign(data) {
  const signingSecret =
    process.env.IVY_WEBHOOK_SIGNING_SECRET || '0a319afc-76cd-4720-b2a2-f182fb05df5b'
  const hmac = createHmac('sha256', signingSecret)
  hmac.update(JSON.stringify(data))
  return hmac.digest('hex')
}

module.exports = { sign }