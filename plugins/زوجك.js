const handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('*[👥] هذا الأمر للجروبات فقط!*')

  const groupData = await conn.groupMetadata(m.chat)
  const members = groupData.participants
    .map(p => p.id)
    .filter(id => id !== m.sender && id !== conn.user.id)

  if (!members.length) return m.reply('*[😅] مفيش أعضاء كفاية في الجروب!*')

  const randomMember = members[Math.floor(Math.random() * members.length)]

  const msg = `
╔══════════════════════╗
║  💍 *زوجك المستقبلي* 💍
╠══════════════════════╣
║
║  👤 *أنت:* @${m.sender.split('@')[0]}
║  💑 *شريك حياتك:* @${randomMember.split('@')[0]}
║
╠══════════════════════╣
║
║  🔮 *الكون قرر إن*
║  @${m.sender.split('@')[0]} هيتجوز @${randomMember.split('@')[0]}
║
║  🌹 بالرفاه والبنين 🌹
║  💫 ألف مبروك مقدماً 💫
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
    image: { url: 'https://files.catbox.moe/1a5xat.jpg' },
    caption: msg,
    mentions: [m.sender, randomMember]
  }, { quoted: m })
}

handler.command = /^(زوجك|زواج)$/i
export default handler