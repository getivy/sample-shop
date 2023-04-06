const express = require('express')
const router = express.Router()


router.post('/', (req, res) => {
  console.log(data)
  // Do something with data and/or data.payload

  res.send({ success: true })
})

module.exports = router
