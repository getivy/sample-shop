const express = require('express')
const router = express.Router()
const cart = require('../cart.json')
const config = require('../config')

router.get('/callback/success', (req, res) => {
  // TODO get order details

  res.render('success', {
    title: 'Order Confirmation - Success',
    orderId: '12726',
    // shippingAddress: TODO
    // billingAddress: TODO
    // billingAddress: TODO
  })
})

router.get('/callback/error', (req, res) => {
  res.render('error', {
    title: 'Order Failed',
  })
})

router.get('/', (req, res) => {
  const subtotal = parseFloat(
    cart.items
      .reduce((acc, item) => {
        return acc + item.price_total
      }, 0)
      .toFixed(2)
  )

  console.log('config.CDN_URL:', config.CDN_URL)
  res.render('shop', {
    title: 'Checkout - Cart',
    items: cart.items,
    subtotal,
    shipping: cart.shipping,
    total: subtotal + cart.shipping,
    cdnUrl: config.CDN_URL,
  })
})

module.exports = router
