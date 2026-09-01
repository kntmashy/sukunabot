import axios from "axios"

const handler = async (m, { conn, args, usedPrefix, command }) => {
  let who
  if (m.isGroup) {
    who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
  } else {
    who = m.chat
  }

  const textquien = `*[😡] اعمل منشن علي الشخص الي مديقك*\n\n*—◉ مثل:*\n◉ ${usedPrefix + command} @${global.suittag}`
  if ((who === m.chat && m.isGroup) || (!who && m.isGroup)) {
    return m.reply(textquien, m.chat, { mentions: conn.parseMention(textquien) })
  }

  try {
    let name = who === m.chat ? '｢⛩️SUKUNA⚡️BOT⛩️｣' : conn.getName(who)
    let name2 = conn.getName(m.sender)

    const res = await axios.get('https://nekos.life/api/v2/img/slap', { timeout: 10000 })
    const url = res.data.url

    await conn.sendSticker(m.chat, url, m, {
      packName: global.stickpack || '⛩️ SUKUNA BOT',
      packPublish: `${name2} صفع ${name}`
    })

  } catch (e) {
    m.reply('*[❗] حصل خطأ: ' + e.message + '*')
  }
}

handler.help = ['slap']
handler.tags = ['General']
handler.command = /^(slap|صفع)$/i

export default handler