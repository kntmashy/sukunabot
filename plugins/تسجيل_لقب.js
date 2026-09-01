let handler = async (m, { conn, text }) => {
  let owners = ['201036547166@s.whatsapp.net', '201016855501@s.whatsapp.net']
  if (!owners.includes(m.sender)) return m.reply('❌ الأمر ده لعمو مهاب بس 😎')

  let target = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null)
  if (!target) return m.reply('❌ منشن الشخص أو اعمل ريبلاي عليه')

  if (!text) return m.reply('❌ اكتب اللقب بعد الأمر')

  let args = text.split(' ')
  args.shift()
  let title = args.join(' ')

  if (!title) return m.reply('❌ لازم تكتب لقب!')

  let user = global.db.data.users[target]
  if (!user) global.db.data.users[target] = {}

  user.title = title

  conn.reply(m.chat, `👑 تم تسجيل اللقب:\n@${target.split('@')[0]} ➜ ${title}`, m, {
    mentions: [target]
  })
}

handler.command = ['تسجيل_لقب']
export default handler