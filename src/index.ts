import env from './config'
import Zip from 'adm-zip'
import { b2 } from './modules/backblaze'
import { Bot } from 'grammy'

const bot = new Bot(env.TELEGRAM_BOT_TOKEN)

const getFiles = async (key: string) => {
  const res = await fetch(`${env.TOLGEE_ENDPOINT}/v2/projects/export?ak=${key}&filterState=REVIEWED`)
  if (res.status !== 200) throw new Error(`Не удалось получить файлы. Статус: ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  const zip = new Zip(buffer)

  return zip.getEntries()
}

const uploadFiles = async (files: Zip.IZipEntry[], folder: string) => {
  const authorization = await b2.authorize()

  const auth = await b2.getUploadUrl({
    bucketId: env.BACKBLAZE_BUCKET_ID
  })

  const keys = []

  for (const file of files) {
    const key = `locales/${folder}/${file.entryName}`
    const data = file.getData()

    const uploaded = await b2.uploadFile({
      uploadUrl: auth.data.uploadUrl,
      uploadAuthToken: auth.data.authorizationToken,
      fileName: key,
      data
    })

    const filesResponse = await fetch(`${authorization.data.apiUrl}/b2api/v2/b2_list_file_versions?bucketId=${env.BACKBLAZE_BUCKET_ID}&prefix=${key}&maxFileCount=10000`, {
      headers: {
        Authorization: authorization.data.authorizationToken
      }
    })

    const files = await filesResponse.json()

    for (const file of files.files.filter((item: any) => item.fileId !== uploaded.data.fileId)) {
      await fetch(`${authorization.data.apiUrl}/b2api/v2/b2_delete_file_version`, {
        method: 'POST',
        headers: {
          Authorization: authorization.data.authorizationToken
        },
        body: JSON.stringify({
          fileId: file.fileId,
          fileName: file.fileName
        })
      })
    }
    keys.push(key)
  }

  await fetch(`https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CLOUDFLARE_API_KEY}`,
    },
    body: JSON.stringify({
      files: keys.map(key => `${env.CLOUDFLARE_DOMAIN_URL}/${key}`)
    })
  })

  return keys
}

bot.hears('/upload', async ctx => {
  if (ctx.chat.type !== 'private') return
  if (ctx.from?.id !== env.TELEGRAM_ADMIN_ID) return

  ctx.reply('Начинаем...')

  const params = env.TOLGEE_API_KEY.split(',')

  for (const key of params) {
    const [folder, apiKey] = key.split(' ')
    try {
      const files = await uploadFiles(await getFiles(apiKey), folder)
  
      ctx.reply(`Файлы успешно загружены: \n${files.map(item => `${env.CLOUDFLARE_DOMAIN_URL}/${item}`).join('\n')}`)
    } catch (error: any) {
      ctx.reply(`Что-то пошло не так: ${error.message}`)
    }
  }
})

bot.start()
