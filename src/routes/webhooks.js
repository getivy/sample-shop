const express = require('express')
const router = express.Router()
const { createHmac } = require('crypto')

router.post('/', (req, res) => {
  const signature = req.get('X-Ivy-Signature')
  const data = req.body

  const signingSecret =
    process.env.IVY_WEBHOOK_SIGNING_SECRET || '0a319afc-76cd-4720-b2a2-f182fb05df5b'
  const hmac = createHmac('sha256', signingSecret)
  hmac.update(JSON.stringify(data))
  const expectedSignature = hmac.digest('hex')

  if (signature !== expectedSignature) throw new Error('invalid webhook signature!')

  console.log(data)
  // Do something with data and/or data.payload

  res.send({ success: true })
})

module.exports = router
