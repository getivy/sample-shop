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
    subtotalNet,
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

  try {
    const data = {
      referenceId: cart.reference,
      category: '5999',
      price: {
        totalNet: cartPrice.subtotalNet,
        vat: cartPrice.vat,
        shipping: cartPrice.shipping,
        total: cartPrice.total,
        currency: 'EUR',
      },
      lineItems: cart.items.map(item => ({
        name: item.name,
        singleNet: item.price_net,
        singleVat: item.price_vat,
        amount: item.price_total,
        image: item.image,
      })),
      billingAddress: {
        country: 'DE',
        line1: 'Hauptstr. 1',
        zipCode: '88662',
        city: 'Überlingen',
      },
    }

    const { data: session } = await axios.post(
      `${config.IVY_API_URL}/service/checkout/session/create`,
      data,
      {
        headers: {
          'X-Ivy-Api-Key': config.IVY_API_KEY,
        },
      }
    )

    console.log('session:', session)
    res.redirect(session.redirectUrl)
  } catch (err) {
    console.error(err.response.data)
    res.status(400).send(err.response.data.message)
  }
})

module.exports = router
