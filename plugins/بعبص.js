const IMG = 'https://i.ibb.co/8DqX91cF/upload-1778649479473.jpg'

const handler = async (m, { conn, isOwner }) => {
  if (!isOwner) return

  const who = m.mentionedJid?.[0] || m.quoted?.sender
  if (!who) return m.reply(
    `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
    `*┇⌗╎منشن شخص أو رد على رسالته*\n` +
    `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
  )

  const num = who.split('@')[0]

  // رسالة جاري البعبصة
  await conn.sendMessage(m.chat, {
    image: { url: IMG },
    caption:
      `*╔═══━━━─── • ───━━━═══╗*\n` +
      `*   👁️ جـاري الـبـعـبـصـة... 👁️*\n` +
      `*╚═══━━━─── • ───━━━═══╝*\n\n` +
      `*┇⌗╎🎯 الهدف:* @${num}\n` +
      `*┇⌗╎👀 يتم بعبصته الآن بكل دقة...*\n` +
      `*┇⌗╎⏳ يرجى الانتظار...*\n\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`,
    mentions: [who]
  }, { quoted: m })

  await new Promise(r => setTimeout(r, 2500))

  // رسالة تم البعبصة
  await conn.sendMessage(m.chat, {
    image: { url: IMG },
    caption:
      `*╔═══━━━─── • ───━━━═══╗*\n` +
      `*   👁️ تـمـت الـبـعـبـصـة! 👁️*\n` +
      `*╚═══━━━─── • ───━━━═══╝*\n\n` +
      `*┇⌗╎✅ تم بعبصة @${num} بنجاح!*\n` +
      `*┇⌗╎🔍 تم فحصه من الرأس للقدم*\n` +
      `*┇⌗╎😂 مفيش حاجة خفية عليّ!*\n\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`,
    mentions: [who]
  }, { quoted: m })
}

handler.help    = ['بعبص @منشن']
handler.tags    = ['fun']
handler.owner   = true
handler.command = ['بعبص']
export default handler