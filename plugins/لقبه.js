// ════════════════════════════════════════════
// أمر .لقبه — عرض لقب شخص آخر
// ════════════════════════════════════════════
let handler = async (m, { conn }) => {
  const who = m.mentionedJid?.[0] || m.quoted?.sender
  if (!who)
    return m.reply(
      `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
      `*┇⌗╎منشن شخص أو رد على رسالته*\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
    )

  const user  = global.db.data.users[who]
  const title = user?.title || 'لا يوجد لقب'
  const name  = user?.name  || who.split('@')[0]
  const num   = who.split('@')[0]

  await conn.sendMessage(m.chat, {
    text:
      `*╔═══━━━─── • ───━━━═══╗*\n` +
      `*   ⟡ 𓂀 𝗟𝗤𝗔𝗕 𓂀 ⟡*\n` +
      `*╚═══━━━─── • ───━━━═══╝*\n` +
      `*┇⌗╎👤 الشخص:* @${num}\n` +
      `*┇⌗╎👑 اللقب:* ${title}\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`,
    mentions: [who]
  }, { quoted: m })
}

handler.help    = ['لقبه @منشن']
handler.tags    = ['economy']
handler.command = ['لقبه']
export default handler