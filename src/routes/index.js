const express = require('express')
const axios = require('axios')
const router = express.Router()
const cart = require('../cart.json')
const config = require('../config')
const { sign } = require('../utils/sign')


const shippingMethods = [
  {
    price: 4.99,
    name: "DHL",
    countries: ['DE', 'GB'],
    reference: "ref-id-1",
    timeFrame: "4-5 Days"
  },
  {
    price: 2.99,
    name: "Hermes",
    countries: ['DE', 'GB'],
    reference: "ref-id-2",
    timeFrame: "4-5 Days"
  },
  {
    price: 0.99,
    name: "ALI-Express",
    countries: ['GB'],
    reference: "ref-id-2",
    timeFrame: "1 Day"
  },

  {
    price: 10,
    name: "DHL - Express",
    countries: ['DE'],
    reference: "ref-id-3",
    timeFrame: "2 Days"
  },
  {
    price: 3.99,
    name: "UPS",
    countries: ['DE', 'GB', 'NL', 'FR', 'GR'],
    reference: "ref-id-4",
    timeFrame: "5-7 Days"
  },
]

const vouchers = [
  {
    voucher: 'ABCD',
    amount: 10
  },
  {
    voucher: '50',
    amount: 50
  },
  {
    voucher: '100',
    amount: 100
  }
]

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

  try {
    const data = {
      express: true,
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
