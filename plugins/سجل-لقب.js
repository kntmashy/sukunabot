// ════════════════════════════════════════════
// أمر .سجل-لقب — تسجيل لقب شخص (للمالك فقط)
// ════════════════════════════════════════════
let handler = async (m, { conn, text }) => {
  const who = m.mentionedJid?.[0] || m.quoted?.sender
  if (!who)
    return m.reply(
      `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
      `*┇⌗╎منشن شخص أو رد على رسالته*\n` +
      `*مثال: .سجل-لقب @منشن اللقب*\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
    )

  if (!text)
    return m.reply(
      `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
      `*┇⌗╎اكتب اللقب بعد المنشن*\n` +
      `*مثال: .سجل-لقب @منشن اللقب*\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
    )

  if (text.length > 30)
    return m.reply(
      `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
      `*┇⌗╎اللقب طويل جداً — الحد الأقصى 30 حرف*\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
    )

  if (!global.db.data.users[who]) global.db.data.users[who] = {}
  const user = global.db.data.users[who]

  user.title       = text
  user.titleLocked = true  // 🔒 قفل — ميغيرش بـ .لقبي

  const num = who.split('@')[0]

  await conn.sendMessage(m.chat, {
    text:
      `*╔═══━━━─── • ───━━━═══╗*\n` +
      `*   ⟡ 𓂀 𝗟𝗤𝗔𝗕 𓂀 ⟡*\n` +
      `*╚═══━━━─── • ───━━━═══╝*\n` +
      `*┇⌗╎✅ تم تسجيل لقب @${num}*\n` +
      `*┇⌗╎👑 اللقب:* ${text}\n` +
      `*┇⌗╎🔒 مقفول — لا يمكن تغييره*\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`,
    mentions: [who]
  }, { quoted: m })
}

handler.help    = ['سجل-لقب @منشن <اللقب>']
handler.tags    = ['economy']
handler.owner   = true
handler.command = ['سجل-لقب', 'سجل_لقب']
export default handler