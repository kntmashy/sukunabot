const handler = async (m, { conn, text }) => {
  if (!text) return m.reply('اكتب الكلام اللي عايز البوت يقوله!')
  
  // امسح رسالة الأمر
  try { await conn.sendMessage(m.chat, { delete: m.key }) } catch {}
  
  // بعت الكلام
  await conn.sendMessage(m.chat, { text: text })
}

handler.help = ['قول <الكلام>']
handler.tags = ['tools']
handler.command = /^(قول|say)$/i
handler.owner = true

export default handler