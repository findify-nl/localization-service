import { cleanEnv, num, str } from 'envalid'

const env = cleanEnv(Bun.env, {
  BACKBLAZE_KEY: str(),
  BACKBLAZE_KEY_ID: str(),
  BACKBLAZE_BUCKET_ID: str(),

  TELEGRAM_BOT_TOKEN: str(),
  TELEGRAM_ADMIN_ID: num(),
  
  CLOUDFLARE_API_KEY: str(),
  CLOUDFLARE_DOMAIN_URL: str(),
  CLOUDFLARE_ZONE_ID: str(),

  TOLGEE_ENDPOINT: str(),
  TOLGEE_API_KEY: str()
})

export default env
