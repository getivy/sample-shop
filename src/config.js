// TEMP for showcase of checkout flow in staging
const stage_api_uri = 'https://api.stage.getivy.de'
const stage_cdn_uri = 'https://cdn.stage.getivy.de'
const stage_api_key = '62ff726af3df03c337720236.fbe641a3-2336-48a7-9bbe-bf5c5813d1db'
const stage_webhook_signing_secret = 'edfcc81a-a1dd-4aec-96de-fa9e4ba6b204'

module.exports = {
  PORT: process.env.PORT,
  IVY_API_KEY: stage_api_key,
  IVY_CDN_URL: stage_cdn_uri,
  IVY_API_URL: stage_api_uri,
  IVY_WEBHOOK_SIGNING_SECRET: stage_webhook_signing_secret,
}
