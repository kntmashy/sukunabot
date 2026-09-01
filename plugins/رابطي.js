const handler = async (m, { conn }) => {
  const num = m.sender.replace('@s.whatsapp.net', '')
  const link = `https://wa.me/${num}?text=BY-⛩️SUKUNA⚡️BOT⛩️`

  await conn.sendMessage(m.chat, {
    text: link,
    mentions: [m.sender]
  }, { quoted: m })
}

handler.help = ['رابطي']
handler.tags = ['tools']
handler.command = /^(رابطي|لينكي)$/i

export default handler