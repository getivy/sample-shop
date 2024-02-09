const express = require('express')
const axios = require('axios')
const router = express.Router()
const config = require('../config')
const cart = require('../data/cart.json')
const agnostic_cart = require('../data/agnostic-cart.json')
const ecosia_cart = require('../data/ecosia-cart.json')
const bits_cart = require('../data/bits-cart.json')
const { getCartPrice } = require('../utils/getCartPrice')

// --- Internal facing routes ---
if (config.IS_INTERNAL) {
  router.get('/all-buttons', (_, res) => {
    res.render('shop-with-all-buttons', {
      title: 'Ivy Demo Store',
      items: cart.items,
      ...getCartPrice(cart),
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/', (_, res) => {
    res.render('shop', {
      title: 'Ivy Demo Store',
      items: cart.items,
      ...getCartPrice(cart),
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/iframe', (_, res) => {
    res.render('iframe-view', {
      title: 'Ivy Demo Store',
      items: cart.items,
      ...getCartPrice(cart),
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/pay-by-link', (_, res) => {
    res.render('pay-by-link', {
      title: 'Pay by link',
      items: cart.items,
      ...getCartPrice(cart),
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/qr-checkout', async (_, res) => {
    res.render('shop-bits-cap-new', {
      title: 'Bits x Ivy Store',
      item: bits_cart,
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/sold-out', (_, res) => {
    res.render('shop-bits-sold-out', {
      title: 'Bits Ivy Store',
    })
  })

  router.get('/bits-success', (_, res) => {
    res.render('shop-bits-success', {
      title: 'Bits Ivy Store',
    })
  })

  router.get('/bits-failure', (_, res) => {
    res.render('shop-bits-failure', {
      title: 'Bits Ivy Store',
    })
  })

  router.get('/klarna', (_, res) => {
    res.render('klarna', {
      title: 'Ivy Demo Store',
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/klarna1', (_, res) => {
    res.render('klarna1', {
      title: 'Ivy Demo Store',
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/klarna2', (_, res) => {
    res.render('klarna2', {
      title: 'Ivy Demo Store',
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/klarna/success', (_, res) => {
    res.render('klarna-success', {
      title: 'Ivy Demo Store',
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/klarna1/success', (_, res) => {
    res.render('klarna-success', {
      title: 'Ivy Demo Store',
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/dynamic', (_, res) => {
    res.render('dynamic', {
      title: 'Dynamic',
      shop: 'dynamic',
      items: cart.items,
      ...getCartPrice(cart),
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/ais', (_, res) => {
    res.render('ais', {
      title: 'Ivy Demo AIS Page',
      cdnUrl: config.IVY_CDN_URL,
      version: process.env.npm_package_version,
    })
  })

  router.get('/custom', (req, res) => {
    const appId = req.app.get('customApiKey')?.split('.')[0]

    res.render('custom', {
      title: 'Shop: ' + appId,
      apiKey: req.app.get('customApiKey'),
      webhookSigningSecret: req.app.get('customWebhookSigningSecret'),
      items: cart.items,
      ...getCartPrice(cart),
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
      successCallbackUrl: reqData.origin + '/callback/success?shop=ais',
      errorCallbackUrl: reqData.origin + '/callback/error?shop=ais',
      resultCallbackUrl: reqData.resultCallbackUrl || reqData.origin + '/callback/data',
      market: req.market || 'DE',
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

  router.post('/checkout-bits', async (_, res) => {
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
}

// --- External facing routes ---

router.get('/callback/success', (req, res) => {
  // TODO get order details
  const shop = req.query.shop

  res.render('success', {
    title: 'Order Confirmation - Success',
    orderId: '12726',
    // shippingAddress: TODO
    // billingAddress: TODO
    // billingAddress: TODO
    shop,
  })
})

router.get('/callback/error', (req, res) => {
  const shop = req.query.shop

  res.render('error', {
    title: 'Order Failed',
    shop,
  })
})

router.post('/checkout', async (req, res) => {
  const cartPrice = getCartPrice(cart)
  const generateReferenceId = (Math.random().toString(36) + '00000000000000000').slice(2, 13)

  const randomMail = `test+${generateReferenceId}@getivy.de`

  const reqData = Object.keys(req.body).length > 0 ? req.body : req.query

  if (reqData.apiKey) {
    req.app.set('customApiKey', reqData.apiKey)
  }

  if (reqData.webhookSigningSecret) {
    req.app.set('customWebhookSigningSecret', reqData.webhookSigningSecret)
  }

  try {
    const financialAddress =
      reqData.currency === 'EUR'
        ? {
            type: 'iban',
            iban: {
              iban: 'FR7629833000010000003989057',
              accountHolderName: 'CARRY PRODUCTS GMBH',
            },
          }
        : {
            type: 'sort_code',
            sortCode: {
              accountNumber: '68209296',
              sortCode: '231470',
              accountHolderName: 'Ivy',
            },
          }

    const data = {
      market: reqData.market || 'DE',
      verificationToken: 'TEST',
      plugin: reqData.plugin,
      express: reqData.express,
      setupPaymentMandate: Boolean(reqData.setupPaymentMandate),
      handshake: reqData.handshake,
      guest: reqData.guest,
      ...(reqData.direct && {
        paymentMode: 'direct',
        settlementDestination: {
          financialAddress,
          reference: 'test joshua becker',
        },
      }),
      disableBankSelection: reqData.disableBankSelection,
      referenceId: generateReferenceId,
      category: '5999',
      price: {
        totalNet: cartPrice.totalNet,
        vat: cartPrice.vat,
        shipping: cartPrice.shipping,
        total: reqData.amount ?? cartPrice.total,
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
        phone: Boolean(reqData.phoneRequired),
      },
      incentiveMode: reqData.incentiveMode,
      ...(reqData.origin && {
        successCallbackUrl: reqData.successCallbackUrl
          ? reqData.origin + reqData.successCallbackUrl
          : reqData.origin + '/callback/success?shop=' + reqData.shop,
        errorCallbackUrl: reqData.errorCallbackUrl
          ? reqData.origin + reqData.errorCallbackUrl
          : reqData.origin + '/callback/error?shop=' + reqData.shop,
      }),
    }

    console.log('begin request')

    console.log(`${config.IVY_API_URL}/service/checkout/session/create`)

    const { data: session } = await axios.post(
      `${config.IVY_API_URL}/service/checkout/session/create`,
      data,
      {
        headers: {
          'X-Ivy-Api-Key':
            reqData.custom === 'true' ? req.app.get('customApiKey') : config.IVY_API_KEY,
        },
      }
    )

    console.log('session:', session)
    res.json({
      url: session.redirectUrl,
    })
  } catch (err) {
    console.log(err)
    console.error(err.response?.data)
    res.status(400).send(err.response?.data.message)
  }
})

router.get('/agnostic', (_, res) => {
  res.render('agnostic', {
    title: 'Agnostic',
    shop: 'agnostic',
    items: agnostic_cart.items,
    ...getCartPrice(agnostic_cart),
    cdnUrl: config.IVY_CDN_URL,
    version: process.env.npm_package_version,
  })
})

router.get('/ecosia', (_, res) => {
  res.render('ecosia', {
    title: 'Ecosia',
    hideTitle: true,
    shop: 'ecosia',
    items: ecosia_cart.items,
    ...getCartPrice(ecosia_cart),
    cdnUrl: config.IVY_CDN_URL,
    version: process.env.npm_package_version,
  })
})

module.exports = router
