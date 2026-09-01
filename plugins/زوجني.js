import fetch from "node-fetch"

const handler = async (m, { conn, usedPrefix, command }) => {
  let who
  if (m.isGroup) {
    who = m.mentionedJid?.[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null
  } else {
    who = m.quoted ? m.quoted.sender : null
  }

  if (!who) return m.reply(
    `*[💍] اعمل منشن أو رد على رسالة الشخص*\n*مثال: ${usedPrefix}زوجني @شخص*`
  )

  if (who === m.sender) return m.reply('*[😂] مش تقدر تتجوز نفسك يا عم!*')

  const name1 = m.pushName || m.sender.split('@')[0]
  const name2 = conn.getName(who) || who.split('@')[0]

  const msg = `
╔══════════════════════╗
║   💍 *عقد قران* 💍     
╠══════════════════════╣
║
║  👰 *العروسة:* ${name2}
║  🤵 *العريس:* ${name1}
║
╠══════════════════════╣
║
║  *بسم الله والصلاة على رسول الله*
║  تم عقد قران الكريم بين
║  *${name1}* و *${name2}*
║
║  🌹 بالرفاه والبنين 🌹
║  💫 ألف مبروك للعروسين 💫
║  🕊️ حياة زوجية سعيدة 🕊️
║
╠══════════════════════╣
║
║  *دعاء:*
║  بارك الله لكما وبارك عليكما
║  وجمع بينكما في خير 🤲
║
╚══════════════════════╝
`.trim()

  await conn.sendMessage(m.chat, {
    image: { url: 'https://i.ibb.co/7NjrMHJd/upload-1780039592623.jpg' },
    caption: msg,
    mentions: [m.sender, who]
  }, { quoted: m })
}

handler.command = /^(زوجني)$/i
handler.owner = true
export default handler
