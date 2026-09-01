// ════════════════════════════════════════════════════════
// ⛩️ SUKUNA BOT v4 — أمر الغش (للمطور فقط)
// ════════════════════════════════════════════════════════

const devNumber = '201036547166'

let handler = async (m, { conn }) => {
  // تحقق من المطور
  const senderNum = m.sender.replace('@s.whatsapp.net', '').replace(/\D/g, '')
  if (senderNum !== devNumber)
    return m.reply(
      `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
      `*┇⌗╎ꕥ هذا الأمر للمطور فقط ⌗*\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
    )

  // تحقق من وجود لعبة شغالة في الجروب
  const id = m.chat
  if (!conn.tekateki || !(id in conn.tekateki))
    return m.reply(
      `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
      `*┇⌗╎ꕥ مفيش سؤال شغال دلوقتي ⌗*\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
    )

  const json = conn.tekateki[id][1]

  return m.reply(
    `*╮═≼『⛩️┃الغش┃⛩️』≽═╭*\n\n` +
    `*┇⌗╎🤫 الإجابة هي:*\n` +
    `*┇⌗╎👑 ${json.response}*\n\n` +
    `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
  )
}

handler.help    = ['غششني']
handler.tags    = ['game']
handler.command = /^(غششني)$/i

export default handler