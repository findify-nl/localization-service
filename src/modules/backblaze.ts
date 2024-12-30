import B2 from 'backblaze-b2'
import env from '../config'

export const b2 = new B2({
  applicationKeyId: env.BACKBLAZE_KEY_ID,
  applicationKey: env.BACKBLAZE_KEY
})
