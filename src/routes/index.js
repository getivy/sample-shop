const express = require('express')
const axios = require('axios')
const router = express.Router()
const config = require('../config')
const cart = require('../data/cart.json')
const bits_cart = require('../data/bits-cart.json')
const { getCartPrice } = require('../utils/getCartPrice')

router.get('/all-buttons', (req, res) => {
  res.render('shop-with-all-buttons', {
    title: 'Ivy Demo Store',
    items: cart.items,
    ...getCartPrice(cart),
    cdnUrl: config.IVY_CDN_URL,
    version: process.env.npm_package_version,
  })
})

router.get('/', (req, res) => {
  res.render('shop', {
    title: 'Ivy Demo Store',
    items: cart.items,
    ...getCartPrice(cart),
    cdnUrl: config.IVY_CDN_URL,
    version: process.env.npm_package_version,
  })
})

router.get('/pay-by-link', (req, res) => {
  res.render('pay-by-link', {
    title: 'Pay by link',
    items: cart.items,
    ...getCartPrice(cart),
    cdnUrl: config.IVY_CDN_URL,
    version: process.env.npm_package_version,
  })
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

router.post('/checkout', async (req, res) => {
  const cartPrice = getCartPrice(cart)
  const generateReferenceId = (Math.random().toString(36) + '00000000000000000').slice(2, 13)
  const randomMail = 'info+' + generateReferenceId + '@getivy.de'

  const reqData = Object.keys(req.body).length > 0 ? req.body : req.query

  const isUsCheckout = reqData.bank === 'us-usbanks'

  try {
    const data = {
      market: reqData.market || "DE",
      verificationToken: 'TEST',
      plugin: reqData.plugin,
      express: reqData.express,
      handshake: reqData.handshake,
      guest: reqData.guest,
      ...(reqData.direct && {
        paymentMode: 'direct',
        settlementDestination: {
          financialAddress: {
            type: 'iban',
            iban: {
              iban: 'AV123',
              accountHolderName: 'Hans Zimmer',
            },
          },
          reference: 'superRef',
        },
      }),
      disableBankSelection: reqData.disableBankSelection,
      referenceId: generateReferenceId,
      category: '5999',
      price: {
        totalNet: cartPrice.totalNet,
        vat: cartPrice.vat,
        shipping: cartPrice.shipping,
        total: cartPrice.total,
        subTotal: cartPrice.subtotal,
        currency: reqData.currency ?? 'EUR',
      },
      lineItems: cart.items.map(item => ({
        name: item.name,
        singleNet: item.price_net,
        singleVat: item.price_vat,
        amount: item.price_total,
        image: item.image,
        quantity: item.amount,
      })),
      billingAddress: {
        country: 'DE',
        line1: 'Hauptstr. 1',
        zipCode: '88662',
        city: 'Überlingen',
      },
      metadata: {
        test: 1,
        broken: reqData.broken,
      },
      prefill: {
        email: reqData.email === 'true' ? randomMail : '',
        bankId: reqData.bank,
      },
      ...(reqData.locale && { locale: reqData.locale }),
      required: {
        phone: reqData.phoneRequired,
      },
      incentiveMode: reqData.incentiveMode,
    }

    console.log('begin request')

    console.log(`${config.IVY_API_URL}/service/checkout/session/create`)

    const { data: session } = await axios.post(
      `${config.IVY_API_URL}/service/checkout/session/create`,
      data,
      {
        headers: {
          'X-Ivy-Api-Key': isUsCheckout ? config.US_IVY_API_KEY : config.IVY_API_KEY,
        },
      }
    )

    console.log('session:', session)
    res.json({
      url: session.redirectUrl,
    })
  } catch (err) {
    console.log(err)
    console.error(err.response.data)
    res.status(400).send(err.response.data.message)
  }
})

router.get('/qr-checkout', async (req, res) => {
  res.render('shop-bits-cap-new', {
    title: 'Bits x Ivy Store',
    item: bits_cart,
    cdnUrl: config.IVY_CDN_URL,
    version: process.env.npm_package_version,
  })
})

router.get('/sold-out', (req, res) => {
  res.render('shop-bits-sold-out', {
    title: 'Bits Ivy Store',
  })
})

router.get('/bits-success', (req, res) => {
  res.render('shop-bits-success', {
    title: 'Bits Ivy Store',
  })
})

router.get('/bits-failure', (req, res) => {
  res.render('shop-bits-failure', {
    title: 'Bits Ivy Store',
  })
})

router.get('/dynamic', (req, res) => {
  res.render('dynamic', {
    title: 'Ivy Demo Store',
    items: cart.items,
    ...getCartPrice(cart),
    cdnUrl: config.IVY_CDN_URL,
    version: process.env.npm_package_version,
  })
})

router.get('/ais', (req, res) => {
  res.render('ais', {
    title: 'Ivy Demo AIS Page',
    cdnUrl: config.IVY_CDN_URL,
    version: process.env.npm_package_version,
  })
})

router.post('/ais', async (req, res) => {
  const generateReferenceId = (Math.random().toString(36) + '00000000000000000').slice(2, 13)

  const reqData = Object.keys(req.body).length > 0 ? req.body : req.query
  const data = {
    referenceId: generateReferenceId,
    prefill: {
      email: reqData.email === 'true' ? randomMail : '',
      bankId: reqData.bank,
    },
    shop: {
      websiteUrl: 'https://www.getivy.io',
      name: "Ivy's Demo Store",
    },
    ...(reqData.permissions === 'match_identity' && {
      matchData: {
        financialAddress: {
          type: 'iban',
          iban: {
            accountHolderName: 'Hans Peter',
            bic: '123',
            iban: '123',
          },
        },
      },
    }),
    ...(reqData.locale ? { locale: reqData.locale } : {}),
    permissions: [reqData.permissions],
    successCallbackUrl: reqData.origin + '/callback/success',
    errorCallbackUrl: reqData.origin + '/callback/error',
    resultCallbackUrl: reqData.resultCallbackUrl || reqData.origin + '/callback/data',
    metadata: {
      test: 1,
    },
  }

  console.log('create data session with:', data)

  const { data: session } = await axios
    .post(`${config.IVY_API_URL}/service/data/session/create`, data, {
      headers: {
        'X-Ivy-Api-Key': config.IVY_API_KEY,
      },
    })
    .catch(err => {
      console.log(err)
      console.error(err.response.data)
      return res.status(400).send(err.response.data.message)
    })

  console.log('session:', session)
  res.json(session)
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
        },
      ],
      billingAddress: {
        country: 'DE',
        line1: 'Bits & Pretzels',
        zipCode: '80469',
        city: 'München',
      },
      metadata: {
        event: 'bits',
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
    console.log(response.bitsSoldOut)

    if (response.bitsSoldOut !== undefined) {
      res.json({
        soldOut: true,
      })
    } else {
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

module.exports = router
