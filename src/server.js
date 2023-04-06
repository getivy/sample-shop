const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const morgan = require('morgan')
const cors = require('cors')

const webhookRoutes = require('./routes/webhooks')
const routes = require('./routes')
const config = require('./config')
const callbacks = require('./routes/callbacks')
const validateRequest = require('./middleware/validate')

const server = express()
server.set('view engine', 'pug')
server.set('views', path.join(__dirname, './views'))

server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: true }))
server.use(morgan('dev'))
server.use(cors({ origin: true }))
server.use(compression({ threshold: 0 }))
server.use(express.static(path.join(__dirname, 'assets')))

server.use(routes)

server.use('/callback', validateRequest(config.IVY_WEBHOOK_SIGNING_SECRET), callbacks)
server.use('/webhooks', validateRequest(config.IVY_WEBHOOK_SIGNING_SECRET), webhookRoutes)

//Stuff for us sample shop
server.use('/us/callback', validateRequest(config.US_IVY_WEBHOOK_SIGNING_SECRET), callbacks)
server.use('/us/webhooks', validateRequest(config.US_IVY_WEBHOOK_SIGNING_SECRET), webhookRoutes)

module.exports = async () => {
  server.listen(config.PORT, () => {
    console.log(`Ivy sample Shop listening at http://localhost:${config.PORT}`)
  })
}
