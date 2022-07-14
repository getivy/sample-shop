const express = require('express')
const { sign } = require('../utils/sign')
const router = express.Router()


router.post('/', (req, res) => {
  const signature = req.get('X-Ivy-Signature')
  const data = req.body

  const expectedSignature = sign(data)

  if (signature !== expectedSignature) throw new Error('invalid webhook signature!')

  console.log(data)
  // Do something with data and/or data.payload

  res.send({ success: true })
})

module.exports = router
