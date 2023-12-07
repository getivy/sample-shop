const express = require('express')
const router = express.Router()
const { sign } = require('../utils/sign')
const shippingMethods = require('../data/shipping.json')
const vouchers = require('../data/voucher.json')
const cart = require('../data/cart.json')
const { getCartPrice } = require('../utils/getCartPrice')

router.post('/complete', (req, res) => {
  const data = req.body

  if (data.metadata.broken === 'true') throw new Error('Handshake refused')

  console.log(data)

  const hasSameItems = cart.items.every(cartItem => {
    return data.lineItems.find(
      lineItem =>
        lineItem.name === cartItem.name &&
        lineItem.quantity === cartItem.amount &&
        lineItem.singleNet === cartItem.price_net
    )
  })

  const response = {
    redirectUrl: `${req.protocol}://${req.headers.host}/callback/success`,
    displayId: 'beautiful_id',
    referenceId: data.referenceId + '-updated-from-callback',
  }

  const expectedResponse = sign(response, res.locals.secret)

  if (!hasSameItems) {
    console.log('/callback/complete: Failed, cart could not been validated')
    res.status(400)
  }

  res.setHeader('X-Ivy-Signature', expectedResponse)
  res.json(response)
})

router.post('/quote', (req, res) => {
  const response = {
    currency: req.body.currency,
  }

  if (req.body.shipping) {
    response.shippingMethods = shippingMethods.filter(
      item => !!item.countries.includes(req.body.shipping.shippingAddress.country)
    )
  }

  if (req.body.discount) {
    const hasValidVoucher = vouchers.find(voucher => voucher.voucher === req.body.discount.voucher)
    if (hasValidVoucher) {
      const cartPrice = getCartPrice(cart)
      response.price = {
        totalNet: cartPrice.subtotalNet - hasValidVoucher.amount,
        vat: cartPrice.vat,
        total: cartPrice.total - hasValidVoucher.amount,
      }
      response.discount = hasValidVoucher
    }
  }

  response.metadata = {
    newValueFromQuote: 'hello',
  }

  const expectedResponse = sign(response, res.locals.secret)

  res.setHeader('X-Ivy-Signature', expectedResponse)
  res.json(response)
})

module.exports = router
