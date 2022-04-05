const express = require('express')
const router = express.Router()

router.post('/', (req, res) => {
  // TODO handle webhooks
  res.send({ success: true })
})

module.exports = router
