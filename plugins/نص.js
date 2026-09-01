import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { NewMessage } from 'telegram/events/index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_ID    = parseInt(process.env.TG_API_ID)
const API_HASH  = process.env.TG_API_HASH
const BOT_USER  = 'voice_to_text_tg_bot'

let _client = null

async function getClient() {
  if (_client?.connected) return _client
  const session = new StringSession(process.env.TG_SESSION || '')
  _client = new TelegramClient(session, API_ID, API_HASH, { connectionRetries: 5 })
  await _client.connect()
  return _client
}

function waitForReply(client, checkFn = () => true, timeout = 40000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(hdl)
      reject(new Error('انتهى الوقت'))
    }, timeout)
    const hdl = async (event) => {
      const msg = event.message
      if (!msg) return
      try {
        const fromId = msg.peerId?.userId?.toString() || msg.fromId?.userId?.toString() || ''
        if (global._tgIdSTT && fromId === global._tgIdSTT) {
          if (!checkFn(msg)) return
          clearTimeout(timer); client.removeEventHandler(hdl); resolve(msg); return
        }
        const sender = await msg.getSender()
        if (sender?.username?.toLowerCase() === BOT_USER.toLowerCase()) {
          if (fromId) global._tgIdSTT = fromId
          if (!checkFn(msg)) return
          clearTimeout(timer); client.removeEventHandler(hdl); resolve(msg)
        }
      } catch {}
    }
    client.addEventHandler(hdl, new NewMessage({}))
  })
}

const handler = async (m, { conn }) => {
  const quoted = m.quoted
  const mime = quoted?.mimetype || quoted?.msg?.mimetype || ''
  if (!quoted || !mime.match(/audio|ogg/i)) {
    return m.reply('رد على رسالة صوتية\nمثال: رد على صوت وكتب `.stt`')
  }

  try {
    const client = await getClient()
    await m.react('⏳')

    // تحميل الصوت
    const buffer = await quoted.download()
    if (!buffer || !buffer.length) throw new Error('الصوت فاضي')

    // احفظ في tmp
    const tmpDir = path.join(__dirname, '../tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
    const tmpPath = path.join(tmpDir, `stt_${Date.now()}.ogg`)
    fs.writeFileSync(tmpPath, buffer)

    // بعت للبوت وانتظر الرد
    const p = waitForReply(client, msg => !!(msg.text || msg.message), 40000)
    await new Promise(r => setTimeout(r, 400))
    await client.sendFile(BOT_USER, { file: tmpPath })
    const replyMsg = await p

    try { fs.unlinkSync(tmpPath) } catch {}

    const txt = replyMsg.text || replyMsg.message || 'مش قدر يتعرف على الصوت'
    await m.reply(`🎙️ *النص:*\n\n${txt}`)
    await m.react('✅')

  } catch (e) {
    console.error('[STT]', e.message)
    await m.react('❌')
    await m.reply(`❌ فشل\n⚠️ ${e.message}`)
  }
}

handler.help    = ['stt']
handler.tags    = ['tools']
handler.command = /^(stt|نص|transcribe)$/i

export default handler