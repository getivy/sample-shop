const express = require('express')
const axios = require('axios')
const router = express.Router()
const config = require('../config')
const { sign } = require('../utils/sign')
const shippingMethods = require('../data/shipping.json')
const vouchers = require('../data/voucher.json')
const cart = require('../data/cart.json')
const bits_cart = require('../data/bits-cart.json')

router.post('/callback/complete', (req, res) => {
  const signature = req.get('X-Ivy-Signature')
  const data = req.body

  const expectedSignature = sign(data)

  if (signature !== expectedSignature) throw new Error('invalid signature!')

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
  }

  const expectedResponse = sign(response)

  if (!hasSameItems) {
    console.log('/callback/complete: Failed, cart could not been validated')
    res.status(400)
  }

  res.setHeader('X-Ivy-Signature', expectedResponse)
  res.json(response)
})

router.post('/callback/quote', (req, res) => {
  const response = {
    currency: req.body.currency,
  }

  const signature = req.get('X-Ivy-Signature')
  const data = req.body

  const expectedSignature = sign(data)

  if (signature !== expectedSignature) throw new Error('invalid signature!')

  if (req.body.shipping) {
    response.shippingMethods = shippingMethods.filter(
      item => !!item.countries.includes(req.body.shipping.shippingAddress.country)
    )
  }

  if (req.body.discount) {
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
    total: parseFloat(subtotal + cart.shipping).toFixed(2),
  }
}

router.get('/all-buttons', (req, res) => {
  res.render('shop-with-all-buttons', {
    title: 'Ivy Demo Store',
    items: cart.items,
    ...getCartPrice(),
    cdnUrl: config.IVY_CDN_URL,
    version: process.env.npm_package_version,
  })
})

router.get('/', (req, res) => {
  res.render('shop', {
    title: 'Ivy Demo Store',
    items: cart.items,
    ...getCartPrice(),
    cdnUrl: config.IVY_CDN_URL,
    version: process.env.npm_package_version,
  })
})

router.post('/checkout', async (req, res) => {
  const cartPrice = getCartPrice()
  const generateReferenceId = (Math.random().toString(36) + '00000000000000000').slice(2, 13)

  try {
    const data = {
      verificationToken: 'TEST',
      plugin: req.query.plugin,
      express: req.query.express,
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
        quantity: req.query.broken === 'true' ? 100 : item.amount,
      })),
      billingAddress: {
        country: 'DE',
        line1: 'Hauptstr. 1',
        zipCode: '88662',
        city: 'Überlingen',
      },
    }

    console.log('begin request')

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
    res.json({
      url: session.redirectUrl,
    })
  } catch (err) {
    console.error(err.response.data)
    res.status(400).send(err.response.data.message)
  }
})

router.get('/qr-checkout', async (req, res) => {
  res.render('shop-bits-cap', {
    title: 'Bits Ivy Store',
    item: bits_cart,
    cdnUrl: config.IVY_CDN_URL,
    version: process.env.npm_package_version,
  })
})

router.get('/sold-out', async (req, res) => {
  res.render('shop-bits-sold-out', {
    title: 'Bits Ivy Store',
  })
})

router.get('/bits-success', async (req, res) => {
  res.render('shop-bits-success', {
    title: 'Bits Ivy Store',
  })
})

router.get('/bits-failure', async (req, res) => {
  res.render('shop-bits-failure', {
    title: 'Bits Ivy Store',
  })
})

router.post('/checkout-bits', async (req, res) => {

  const generateReferenceId = (Math.random().toString(36) + '00000000000000000').slice(2, 13)

  try {
    const data = {
      referenceId: generateReferenceId,
      category: '5999',
      price: {
        totalNet: bits_cart.price_net,
        vat: bits_cart.price_vat,
        shipping: 0,
        total: bits_cart.price_total,
        currency: 'EUR',
      },
      lineItems: [
        {
          name: bits_cart.name,
          singleNet: bits_cart.price_net,
          singleVat: bits_cart.price_vat,
          amount: bits_cart.amount,
          image: bits_cart.image,
          quantity: bits_cart.quantity,
        }
      ],
      billingAddress: {
        country: 'DE',
        line1: 'Bits & Pretzels',
        zipCode: '80469',
        city: 'München',
      },
      metadata: {
        "event": "bits",
      }
    }

    const { data: response } = await axios.post(
      `${config.IVY_API_URL}/service/checkout/session/create`,
      data,
      {
        headers: {
          'X-Ivy-Api-Key': config.IVY_API_KEY,
        },
      }
    )
    console.log(response.bitsSoldOut)

    if (response.bitsSoldOut !== undefined) {
      res.json({
        soldOut: true,
      })
    }
    else {
      res.json({
        soldOut: false,
        url: response.redirectUrl,
      })
    }

  } catch (err) {
    console.error(err.response.data)
    res.status(400).send(err.response.data.message)
  }
})

router.post('/plant-two-trees', async (req, res) => {

  const generateReferenceId = (Math.random().toString(36) + '00000000000000000').slice(2, 13)

  try {
    const data = {
      referenceId: generateReferenceId,
      category: '5999',
      price: {
        totalNet: 0,
        vat: 0,
        shipping: 0,
        total: 0,
        currency: 'EUR',
      },
      lineItems: [
        {
          name: 'One tree as a gift!',
          singleNet: 0,
          singleVat: 0,
          amount: 0,
          image: '',
          quantity: 1,
        }
      ],
      billingAddress: {
        country: 'DE',
        line1: 'Bits & Pretzels',
        zipCode: '80469',
        city: 'München',
      },
    }

    const { data: response } = await axios.post(
      `${config.IVY_API_URL}/service/checkout/session/create`,
      data,
      {
        headers: {
          'X-Ivy-Api-Key': config.IVY_API_KEY,
        },
      }
    )

    res.json({
      url: response.redirectUrl,
    })

  } catch (err) {
    console.error(err.response.data)
    res.status(400).send(err.response.data.message)
  }
})


module.exports = router
