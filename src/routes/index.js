const express = require('express')
const axios = require('axios')
const router = express.Router()
const config = require('../config')
const { sign } = require('../utils/sign')
const shippingMethods = require('../data/shipping.json')
const vouchers = require('../data/voucher.json')
const cart = require('../data/cart.json')

router.post('/callback/quote', (req, res) => {
  const response = {
    currency: req.body.currency
  }

  const signature = req.get('X-Ivy-Signature')
  const data = req.body

  const expectedSignature = sign(data)

  if (signature !== expectedSignature) throw new Error('invalid signature!')

  console.log(data)
  

  if(req.body.shipping) {
    response.shippingMethods = shippingMethods.filter(item => !!item.countries.includes(req.body.shipping.shippingAddress.country))
  }

  if(req.body.discount) {
    response.discount = vouchers.find(voucher => voucher.voucher === req.body.discount.voucher)
  }

  const expectedResponse = sign(response)

  res.setHeader('X-Ivy-Signature', expectedResponse)
  res.json(response)
})

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
    vat: parseFloat(subtotal - subtotalNet).toFixed(2),
    shipping: cart.shipping,
    total: parseFloat(subtotal + cart.shipping).toFixed(2),
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

  const generateReferenceId = (Math.random().toString(36)+'00000000000000000').slice(2, 13)

  try {
    const data = {
      express: true,
      referenceId: generateReferenceId,
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
