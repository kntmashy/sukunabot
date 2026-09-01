import WebSocket from 'ws'

function generateUsername() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let username = ''
  for (let i = 0; i < 16; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return username
}

const password = {
  m1x: "2077bbef25efe7518d487a570cb5cff8bacce03bb8418cc2a72c83f987e8e02d",
  m1y: "4aee85ecae1ce39e52d690c662f341885dffa280417a62c3c26830d51a0441a0",
  m2:  "57223fab5ca6a91db7de1ecf173cee63c398017f8d73b8d43fa3981a325ea4f2",
  iv:  "b6b6ad34a53220f1b38e90a7fac885c7",
  message: "4fdd6b0d4261b56507a814f8358599fa9bce770d209f243e0ab3aa1a411b69414f99388249d4a4e2b006bdc72c7f1afa8a53b98912cfe088b1894c0edfeb2e160f79e19ba8964eacb92f0875ad18a7a9"
}

const magicword = {
  m1x: "fc4762a0cd77ffdae1f58f98a84b3a28503110925c7e675bfc1827044b62625e",
  m1y: "fa551a50e6b7aa7fecff96b115fbddeaff7664ec19f51139892434d04a566ccd",
  m2:  "2a5e35d6b73977416ff99832f897d6a13190bdbef9bf1c9cb0ad7e7d8e6ed755",
  iv:  "e5f21c784e485b6b923c75b80e8e33b6",
  message: "2096641ea3c7858d3085a9123b3ae7c3"
}

const serverList = [
  'wss://195.13.182.213/Auth',
  'wss://51.79.208.190/Auth',
  'wss://91.220.101.139/Auth',
  'wss://51.81.147.222/Auth',
  'wss://95.213.143.188/Auth',
  'wss://95.213.143.162/Auth',
  'wss://91.220.101.165/Auth',
  'wss://185.10.60.174/Auth'
]

function registerSafeUM() {
  return new Promise(async (resolve) => {
    const username = generateUsername()
    const payload = {
      action: "Register",
      subaction: "Desktop",
      locale: "en_GB",
      gmt: "+05",
      login: username,
      devicename: "Xiaomi 23106RN0DA",
      softwareversion: "1.1.0.2300",
      nickname: "TestUser",
      os: "AND",
      deviceuid: "7796efb323b2256e",
      devicepushuid: "*safeum:push:uid",
      osversion: "and_13.0.0",
      id: Date.now().toString(),
      password,
      magicword,
      magicwordhint: "0000"
    }

    for (let server of serverList) {
      try {
        await new Promise((res, rej) => {
          const socket = new WebSocket(server, {
            rejectUnauthorized: false,
            headers: {
              app: 'com.safeum.android',
              url: server
            }
          })

          let resolved = false

          socket.on('open', () => {
            socket.send(JSON.stringify(payload))
          })

          socket.on('message', (msg) => {
            let data
            try {
              data = JSON.parse(msg.toString())
            } catch (e) {
              return rej("فشل في قراءة الرد")
            }

            if (data?.status === "Success") {
              resolved = true
              socket.close()
              return resolve({ success: true, username, server })
            } else {
              socket.close()
              return rej(data || "رد غير متوقع")
            }
          })

          socket.on('error', (err) => {
            socket.close()
            rej(err.message)
          })

          socket.on('close', () => {
            if (!resolved) rej("فشل في الاتصال")
          })

          setTimeout(() => {
            if (!resolved) {
              socket.close()
              rej("انتهى الوقت")
            }
          }, 7000)
        })
      } catch (e) {
        continue
      }
    }

    return resolve({ success: false, username, response: "❌ جميع السيرفرات فشلت" })
  })
}

// أمر البوت
const handler = async (m, { conn, text }) => {
  const count = Math.min(parseInt(text) || 1, 10)
  await conn.reply(m.chat, `⌛ جاري إنشاء ${count} حساب SafeUM...`, m)

  let success = 0
  let failed = 0
  let results = []

  for (let i = 0; i < count; i++) {
    const res = await registerSafeUM()
    if (res.success) {
      success++
      results.push(`✅ ${res.username} (${res.server})`)
    } else {
      failed++
      results.push(`❌ ${res.username || "؟"} - ${JSON.stringify(res.response)}`)
    }
  }

  const msg = `
📦 تم الإنتهاء من إنشاء الحسابات:

✔️ ناجح: ${success}
❌ فشل: ${failed}

النتائج:
${results.join('\n')}
`.trim()

  await conn.reply(m.chat, msg, m)
}

handler.command = /^\.?safeum$/i
handler.tags = ['tools']
handler.help = ['.safeum [عدد]']
handler.limit = 2
handler.premium = false

export default handler