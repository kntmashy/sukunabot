import fs from 'fs'

const timeout = 60000
const poin    = 500

let handler = async (m, { conn, usedPrefix }) => {
  if (!conn.tekateki) conn.tekateki = {}

  const id = m.chat

  if (id in conn.tekateki) {
    await conn.reply(m.chat,
      '*❍━━━══━━❪⛩️❫━━══━━━❍*\n' +
      '*｢❤️｣⇇ مازال هناك سؤال هنا*\n' +
      '*❍━━━══━━❪⛩️❫━━══━━━❍*',
      conn.tekateki[id][0])
    return
  }

  let tekateki
  try {
    tekateki = JSON.parse(fs.readFileSync('./src/game/عواصم.json', 'utf8'))
  } catch {
    return m.reply('*┇⌗╎ملف الأسئلة غير موجود*')
  }

  const json = tekateki[Math.floor(Math.random() * tekateki.length)]

  const caption = `*｢🍭｣⇇ السؤال↶*
> ❀ ${json.question} ❀
*⊏─๋︩︪─๋︩︪─๋︩︪─๋︩︪─═͜⊐❪⛩️❫⊏═─๋︩︪─๋︩︪─๋︩︪─๋︩︪─๋︩︪─⊐*
*｢👤｣⇇ اللاعب↜❪@${m.sender.split('@')[0]}❫*
*｢🕛｣⇇ الوقت↜❪${(timeout / 1000).toFixed(0)} ثانية❫*
*｢⚜️｣⇇ الجائزة↜❪${poin} نقطة❫*
*⊏─๋︩︪─๋︩︪─๋︩︪─๋︩︪─═͜⊐❪⛩️❫⊏═─๋︩︪─๋︩︪─๋︩︪─๋︩︪─๋︩︪─⊐*
*｢👑｣⇇ المطور: MOHAB*
*❍━━━══━━❪⛩️❫━━══━━━❍*`.trim()

  conn.tekateki[id] = [
    await conn.reply(m.chat, caption, m),
    json,
    poin,
    setTimeout(async () => {
      if (conn.tekateki[id]) {
        await conn.reply(m.chat,
          '*⊏─๋︩︪─๋︩︪─๋︩︪─๋︩︪─═͜⊐❪⛩️❫⊏═─๋︩︪─๋︩︪─๋︩︪─๋︩︪─๋︩︪─⊐*\n' +
          '*｢🌀｣⇇ انتهى الوقت💔*\n' +
          `*｢🍡｣⇇ الإجابة↜❪${json.response}❫*\n` +
          '*⊏─๋︩︪─๋︩︪─๋︩︪─๋︩︪─═͜⊐❪⛩️❫⊏═─๋︩︪─๋︩︪─๋︩︪─๋︩︪─๋︩︪─⊐*',
          conn.tekateki[id][0])
      }
      delete conn.tekateki[id]
    }, timeout)
  ]
}

handler.help    = ['عاصمه']
handler.tags    = ['game']
handler.command = /^(عاصمه)$/i
export default handler