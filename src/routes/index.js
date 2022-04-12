const express = require('express')
const axios = require('axios')
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

function getCartPrice() {
  const subtotal = parseFloat(
    cart.items
      .reduce((acc, item) => {
        return acc + item.price_total
      }, 0)
      .toFixed(2)
  )

  const subtotalNet = parseFloat(
    cart.items
      .reduce((acc, item) => {
        return acc + item.price_net
      }, 0)
      .toFixed(2)
  )

  return {
    subtotal,
    subtotal_net: subtotalNet,
    shipping: cart.shipping,
    vat: subtotal - subtotalNet,
    shipping: cart.shipping,
    total: subtotal + cart.shipping,
  }
}

router.get('/', (req, res) => {
  res.render('shop', {
    title: 'Checkout - Cart',
    items: cart.items,
    ...getCartPrice(),
    cdnUrl: config.IVY_CDN_URL,
  })
})

router.post('/checkout', async (req, res) => {
  const cartPrice = getCartPrice()

  const session = await axios.post(
    `${config.IVY_API_URL}/service/checkout/session/create`,
    {
      referenceId: cart.reference,
      category: '0001',
      price: {
        totalNet: cartPrice.subtotalNet,
        vat: cartPrice.vat,
        shipping: cartPrice.shipping,
        total: cartPrice.total,
      },
      lineItems: cart.items.map(item => ({
        name: item.name,
        singleNet: item.price_net,
        singleVat: item.price_vat,
        amount: item.price_total,
        image: item.image,
      })),
    },
    {
      Headers: {
        'X-Ivy-Api-Key': config.IVY_API_KEY,
      },
    }
  )

  console.log('session:', session)
})

module.exports = router
