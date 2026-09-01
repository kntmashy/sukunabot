import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { NewMessage } from 'telegram/events/index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_ID    = parseInt(process.env.TG_API_ID)
const API_HASH  = process.env.TG_API_HASH
const BOT_USER  = 'EnhanceX_Bot'

let _client = null

async function getClient() {
  if (_client?.connected) return _client
  const session = new StringSession(process.env.TG_SESSION || '')
  _client = new TelegramClient(session, API_ID, API_HASH, { connectionRetries: 5 })
  await _client.connect()
  return _client
}

function waitForReply(client, checkFn = () => true, timeout = 90000) {
  return new Promise((resolve, reject) => {
    let resolved = false
    
    const timer = setTimeout(() => {
      if (!resolved) {
        client.removeEventHandler(hdl)
        reject(new Error('انتهى الوقت'))
      }
    }, timeout)

    const hdl = async (event) => {
      if (resolved) return
      
      const msg = event.message
      if (!msg) return
      
      try {
        const fromId = msg.peerId?.userId?.toString() || msg.fromId?.userId?.toString() || ''
        
        let isFromBot = false
        if (global._tgIdEnhance && fromId === global._tgIdEnhance) {
          isFromBot = true
        } else {
          const sender = await msg.getSender()
          if (sender?.username?.toLowerCase() === BOT_USER.toLowerCase()) {
            if (fromId) global._tgIdEnhance = fromId
            isFromBot = true
          }
        }
        
        if (!isFromBot) return
        
        const condition = checkFn(msg)
        console.log(`[waitForReply] Check result: ${condition}, has media: ${!!msg.media}, has text: ${!!msg.text}, has buttons: ${!!msg.replyMarkup}`)
        
        if (!condition) return
        
        resolved = true
        clearTimeout(timer)
        client.removeEventHandler(hdl)
        resolve(msg)
      } catch (e) {
        console.error('[waitForReply Error]', e.message)
      }
    }

    client.addEventHandler(hdl, new NewMessage({}))
  })
}

// ✅ دالة خاصة لانتظار أزرار v2/v3
async function waitForButtons(client, timeout = 30000) {
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    await new Promise(r => setTimeout(r, 1000))
    
    try {
      const msgs = await client.getMessages(BOT_USER, { limit: 5 })
      
      for (const msg of msgs) {
        const sender = await msg.getSender()
        if (sender?.username?.toLowerCase() !== BOT_USER.toLowerCase()) continue
        
        // ✅ البحث عن رسالة فيها أزرار v2 أو v3
        if (msg.replyMarkup) {
          const btns = msg.replyMarkup.rows?.flatMap(r => r.buttons) || []
          const hasV2V3 = btns.some(b => b.text?.toLowerCase() === 'v2' || b.text?.toLowerCase() === 'v3')
          
          if (hasV2V3) {
            console.log('[waitForButtons] Found v2/v3 buttons!')
            return msg
          }
        }
      }
    } catch (e) {
      console.error('[waitForButtons Error]', e.message)
    }
  }
  
  throw new Error('انتهى الوقت - مش لاقي أزرار v2/v3')
}

// ✅ دالة خاصة للضغط على زر معين واستلام النتيجة
async function clickButtonAndGetResult(client, msg, buttonText, timeout = 90000) {
  const btns = msg.replyMarkup?.rows?.flatMap(r => r.buttons) || []
  let btnData = null
  
  for (const btn of btns) {
    if (btn.text?.toLowerCase() === buttonText.toLowerCase()) {
      btnData = btn.data
      break
    }
  }
  
  if (!btnData) throw new Error(`مش لاقي زر: ${buttonText}`)
  
  console.log(`[clickButtonAndGetResult] Clicking: ${buttonText}`)
  await msg.click({ data: btnData })
  
  // انتظار النتيجة
  const resultMsg = await waitForReply(client, msg => !!(msg.media), timeout)
  return resultMsg
}

function waitForMultipleReplies(client, timeout = 20000) {
  return new Promise((resolve) => {
    const messages = []
    let timer = setTimeout(() => {
      client.removeEventHandler(hdl)
      resolve(messages)
    }, timeout)

    const hdl = async (event) => {
      const msg = event.message
      if (!msg) return
      try {
        const fromId = msg.peerId?.userId?.toString() || msg.fromId?.userId?.toString() || ''
        const isFromBot = global._tgIdEnhance
          ? fromId === global._tgIdEnhance
          : (await msg.getSender())?.username?.toLowerCase() === BOT_USER.toLowerCase()

        if (!isFromBot) return

        clearTimeout(timer)
        messages.push(msg)
        timer = setTimeout(() => {
          client.removeEventHandler(hdl)
          resolve(messages)
        }, 4000)
      } catch {}
    }

    client.addEventHandler(hdl, new NewMessage({}))
  })
}

async function downloadTgMedia(client, msg) {
  const tmpDir = path.join(__dirname, '../tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  
  let ext = 'png'
  if (msg.media && msg.media.document) {
    const mimeType = msg.media.document.mimeType
    if (mimeType === 'image/png') ext = 'png'
    else if (mimeType === 'image/webp') ext = 'webp'
    else if (mimeType === 'image/jpeg') ext = 'jpg'
  } else if (msg.media && msg.media.photo) {
    ext = 'jpg'
  }
  
  const tmpPath = path.join(tmpDir, `enhance_${Date.now()}.${ext}`)
  await client.downloadMedia(msg, { outputFile: tmpPath })
  
  if (fs.existsSync(tmpPath)) {
    const stats = fs.statSync(tmpPath)
    console.log(`[Download] File saved: ${tmpPath}, size: ${stats.size} bytes`)
    if (stats.size === 0) {
      throw new Error('الملف المحمل فاضي')
    }
  } else {
    throw new Error('فشل تحميل الملف')
  }
  
  return tmpPath
}

async function clickButton(client, msg, textToFind) {
  const allBtns = msg.replyMarkup?.rows?.flatMap(r => r.buttons) || []
  
  for (const btn of allBtns) {
    if (btn.text?.includes(textToFind)) {
      console.log(`[clickButton] Clicking: ${btn.text}`)
      await msg.click({ data: btn.data })
      return true
    }
  }
  return false
}

const userStates = {}

const MENU_TEXT = `🎨 *اختار العملية:*

1️⃣ توضيح 🔥 (v3 تلقائي)
2️⃣ فلاتر
3️⃣ تبديل الوجوه
4️⃣ تمويه الخلفية (متوسط تلقائي)
5️⃣ إزالة الخلفية
6️⃣ توسيع
7️⃣ تمويه الوجوه
8️⃣ معالجة الصور القديمة
9️⃣ تلوين 🔥
🔟 إزالة النص

*مثال: رد على صورة واكتب .تحسين 1*`

const BUTTONS_MAP = {
  '1': 'توضيح',
  '2': 'فلاتر',
  '3': 'تبديل الوجوه',
  '4': 'تمويه الخلفية',
  '5': 'إزالة الخلفية',
  '6': 'توسيع',
  '7': 'تمويه الوجوه',
  '8': 'معالجة الصور القديمة',
  '9': 'تلوين',
  '10': 'إزالة النص'
}

function getMessageText(msg) {
  if (!msg) return ''
  
  const possibleText = [
    msg.body,
    msg.text,
    msg.message?.conversation,
    msg.message?.extendedTextMessage?.text,
    msg.message?.buttonsResponseMessage?.selectedDisplayText,
    msg.message?.listResponseMessage?.title,
    msg.message?.templateButtonReplyMessage?.selectedDisplayText,
    (msg.msg || msg).text,
    (msg.msg || msg).body
  ]
  
  for (const text of possibleText) {
    if (text && typeof text === 'string') return text.trim()
  }
  
  return ''
}

async function processChoice(choice, userId, m, conn, client, menuMsg, tmpPath) {
  const buttonText = BUTTONS_MAP[choice]
  if (!buttonText) {
    await conn.reply(m.chat, '⚠️ رقم غير صحيح، اختار من 1 لـ 10', m)
    return false
  }

  console.log(`[ProcessChoice] Choice: ${choice}, ButtonText: ${buttonText}`)
  
  const found = await clickButton(client, menuMsg, buttonText)
  if (!found) {
    await conn.reply(m.chat, `❌ مش لاقي زر: ${buttonText}`, m)
    return false
  }

  // ======================
  // 3 - تبديل الوجوه
  // ======================
  if (choice === '3') {
    await waitForReply(client, msg => !!(msg.text || msg.message), 15000)
    userStates[userId] = { step: 'await_second_image', firstImagePath: tmpPath }
    await conn.reply(m.chat, '📸 ابعت الصورة التانية (الوجه اللي هيتبدل)', m)
    await m.react('✅')
    return true
  }

  // ======================
  // 1 - توضيح (v3 تلقائي)
  // ======================
  if (choice === '1') {
    console.log('[ProcessChoice] Waiting for first result...')
    const firstResult = await waitForReply(client, msg => !!(msg.media), 120000)
    console.log('[ProcessChoice] Got first result')
    
    const firstPath = await downloadTgMedia(client, firstResult)
    await conn.sendFile(m.chat, fs.readFileSync(firstPath), 'result.png', '', m)
    try { fs.unlinkSync(firstPath) } catch {}

    // ✅ انتظار أزرار v2/v3 بالطريقة الجديدة
    console.log('[ProcessChoice] Waiting for v2/v3 buttons...')
    const buttonsMsg = await waitForButtons(client, 30000)
    
    // ✅ الضغط على v3
    console.log('[ProcessChoice] Clicking v3...')
    const resultMsg = await clickButtonAndGetResult(client, buttonsMsg, 'v3', 120000)
    
    const resultPath = await downloadTgMedia(client, resultMsg)
    await conn.sendFile(m.chat, fs.readFileSync(resultPath), 'result.png', '', m)
    try { fs.unlinkSync(resultPath) } catch {}

    delete userStates[userId]
    await m.react('✅')
    return true
  }

  // ======================
  // 2 - فلاتر
  // ======================
  if (choice === '2') {
    const allMsgs = await waitForMultipleReplies(client, 25000)
    const imgMsgs = allMsgs.filter(msg => msg.media)
    if (!imgMsgs.length) {
      await conn.reply(m.chat, '❌ مفيش صور وصلت', m)
      return false
    }

    for (const imgMsg of imgMsgs) {
      const p = await downloadTgMedia(client, imgMsg)
      await conn.sendFile(m.chat, fs.readFileSync(p), 'result.png', '', m)
      try { fs.unlinkSync(p) } catch {}
    }

    delete userStates[userId]
    await m.react('✅')
    return true
  }

  // ======================
  // 4 - تمويه الخلفية (متوسط تلقائي)
  // ======================
  if (choice === '4') {
    console.log('[ProcessChoice] Waiting for quality buttons...')
    const qualityMsg = await waitForReply(client, msg => !!(msg.replyMarkup), 30000)
    
    const allBtns = qualityMsg.replyMarkup?.rows?.flatMap(r => r.buttons) || []
    let btnData = null
    
    for (const btn of allBtns) {
      if (btn.text?.includes('متوسط')) {
        btnData = btn.data
        break
      }
    }
    
    if (!btnData) throw new Error('مش لاقي زر متوسط')
    
    console.log('[ProcessChoice] Clicking متوسط...')
    await qualityMsg.click({ data: btnData })
    
    const resultMsg = await waitForReply(client, msg => !!(msg.media), 120000)
    const resultPath = await downloadTgMedia(client, resultMsg)
    await conn.sendFile(m.chat, fs.readFileSync(resultPath), 'result.png', '', m)
    try { fs.unlinkSync(resultPath) } catch {}

    delete userStates[userId]
    await m.react('✅')
    return true
  }

  // ======================
  // باقي العمليات (5-10)
  // ======================
  console.log('[ProcessChoice] Waiting for result media...')
  const resultMsg = await waitForReply(client, msg => !!(msg.media), 120000)
  console.log('[ProcessChoice] Result received, downloading...')
  const resultPath = await downloadTgMedia(client, resultMsg)
  await conn.sendFile(m.chat, fs.readFileSync(resultPath), 'result.png', '', m)
  try { fs.unlinkSync(resultPath) } catch {}

  delete userStates[userId]
  await m.react('✅')
  return true
}

const handler = async (m, { conn, args }) => {
  const userId = m.sender?.split('@')[0] || m.sender || m.key?.remoteJid?.split('@')[0]
  const state  = userStates[userId] || {}
  const messageText = getMessageText(m)
  const quotedMsg = m.quoted || m.msg?.quoted
  
  console.log(`[Handler] User: ${userId}, Step: ${state.step || 'none'}, Message: "${messageText}"`)
  
  if (!state.step) {
    let imageBuffer = null
    let mime = ''
    
    if (quotedMsg) {
      mime = quotedMsg.mimetype || quotedMsg.msg?.mimetype || ''
      if (mime.startsWith('image')) {
        try {
          imageBuffer = await quotedMsg.download()
          console.log('[Handler] Downloaded quoted image, size:', imageBuffer.length)
        } catch (e) {
          console.error('Error downloading quoted image:', e)
        }
      }
    }
    
    if (!imageBuffer) {
      mime = m.mimetype || m.msg?.mimetype || ''
      if (mime.startsWith('image')) {
        try {
          imageBuffer = await m.download()
          console.log('[Handler] Downloaded direct image, size:', imageBuffer.length)
        } catch (e) {
          console.error('Error downloading image:', e)
        }
      }
    }
    
    let choice = null
    
    if (args && args.length > 0) {
      choice = args[0]?.trim()
    }
    
    if (!choice && messageText) {
      const parts = messageText.split(/\s+/)
      if (parts.length > 1) {
        choice = parts[1]?.trim()
      }
    }
    
    if (!choice && /^\d+$/.test(messageText)) {
      choice = messageText
    }
    
    if (!imageBuffer) {
      return conn.reply(m.chat, MENU_TEXT, m)
    }

    try {
      await m.react('⏳')
      const client = await getClient()

      const tmpDir = path.join(__dirname, '../tmp')
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
      const tmpPath = path.join(tmpDir, `enhance1_${Date.now()}.jpg`)
      fs.writeFileSync(tmpPath, imageBuffer)

      console.log('[Handler] Sending image to bot...')
      const p = waitForReply(client, msg => !!(msg.replyMarkup), 45000)
      await new Promise(r => setTimeout(r, 1000))
      await client.sendFile(BOT_USER, { file: tmpPath })
      console.log('[Handler] Image sent, waiting for menu...')
      const menuMsg = await p
      console.log('[Handler] Menu received')

      if (choice && BUTTONS_MAP[choice]) {
        await processChoice(choice, userId, m, conn, client, menuMsg, tmpPath)
        return
      }

      userStates[userId] = { step: 'await_choice', firstImagePath: tmpPath, menuMsg }
      await conn.reply(m.chat, MENU_TEXT, m)
      await m.react('✅')

    } catch (e) {
      console.error('[EnhanceX]', e.message)
      await m.react('❌')
      await conn.reply(m.chat, `❌ فشل: ${e.message}`, m)
      delete userStates[userId]
    }
    return
  }

  if (state.step === 'await_choice') {
    let choice = getMessageText(m)
    choice = choice.replace(/[^0-9]/g, '')
    
    console.log(`[EnhanceX] User choice: "${choice}" (original: "${messageText}")`)
    
    if (!BUTTONS_MAP[choice]) {
      return conn.reply(m.chat, '⚠️ اختيار غير صحيح، ابعت رقم من 1 لـ 10', m)
    }

    try {
      await m.react('⏳')
      const client = await getClient()
      const success = await processChoice(choice, userId, m, conn, client, state.menuMsg, state.firstImagePath)
      if (!success) {
        delete userStates[userId]
      }
    } catch (e) {
      console.error('[EnhanceX]', e.message)
      await m.react('❌')
      await conn.reply(m.chat, `❌ فشل: ${e.message}`, m)
      delete userStates[userId]
    }
    return
  }

  if (state.step === 'await_second_image') {
    let imageBuffer = null
    let mime = ''
    
    const quotedMsg = m.quoted || m.msg?.quoted
    
    if (quotedMsg) {
      mime = quotedMsg.mimetype || quotedMsg.msg?.mimetype || ''
      if (mime.startsWith('image')) {
        try {
          imageBuffer = await quotedMsg.download()
        } catch (e) {
          console.error('Error downloading second image:', e)
        }
      }
    }
    
    if (!imageBuffer) {
      mime = m.mimetype || m.msg?.mimetype || ''
      if (mime.startsWith('image')) {
        try {
          imageBuffer = await m.download()
        } catch (e) {
          console.error('Error downloading image:', e)
        }
      }
    }

    if (!imageBuffer) {
      return conn.reply(m.chat, '⚠️ ابعت صورة', m)
    }

    try {
      await m.react('⏳')
      const client = await getClient()

      const tmpDir = path.join(__dirname, '../tmp')
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
      const tmpPath = path.join(tmpDir, `enhance2_${Date.now()}.jpg`)
      fs.writeFileSync(tmpPath, imageBuffer)

      console.log('[Handler] Sending second image for face swap...')
      const p = waitForReply(client, msg => !!(msg.media), 120000)
      await client.sendFile(BOT_USER, { file: tmpPath })
      const resultMsg = await p

      try { fs.unlinkSync(tmpPath) } catch {}
      try { fs.unlinkSync(state.firstImagePath) } catch {}

      const resultPath = await downloadTgMedia(client, resultMsg)
      await conn.sendFile(m.chat, fs.readFileSync(resultPath), 'result.png', '', m)
      try { fs.unlinkSync(resultPath) } catch {}

      await m.react('✅')
      delete userStates[userId]

    } catch (e) {
      console.error('[EnhanceX]', e.message)
      await m.react('❌')
      await conn.reply(m.chat, `❌ فشل: ${e.message}`, m)
      delete userStates[userId]
    }
    return
  }
}

handler.help    = ['تحسين <رقم>']
handler.tags    = ['tools']
handler.command = /^(enhance|تحسين)$/i

export default handler