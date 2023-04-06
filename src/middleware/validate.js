const { sign } = require('../utils/sign')

module.exports = function (secret) {
  return function (req, res, next) {

    const signature = req.get('X-Ivy-Signature')
    const data = req.body
    console.log(secret, signature, data)
    const expectedSignature = sign(data, secret)

    res.locals.secret = secret

    if (signature !== expectedSignature) throw new Error('invalid signature!')

    next()
  }
}
