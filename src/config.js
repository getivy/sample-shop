module.exports = {
  PORT: process.env.PORT,
  IVY_API_KEY: process.env.IVY_API_KEY,
  IVY_CDN_URL: process.env.IVY_CDN_URL,
  IVY_API_URL: process.env.IVY_API_URL,
  IVY_WEBHOOK_SIGNING_SECRET: process.env.IVY_WEBHOOK_SIGNING_SECRET,
  INSTANT_REFUND: process.env.INSTANT_REFUND === 'true',
  IS_EXTERNAL: process.env.IS_EXTERNAL === 'true',
}
