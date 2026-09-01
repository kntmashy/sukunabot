let handler2 = async (m, { conn }) => {
  const developers = [
    "201016855501@s.whatsapp.net",
    "201036547166@s.whatsapp.net",
    "201150572826@s.whatsapp.net",
    "201066036607@s.whatsapp.net"
  ]

  if (!developers.includes(m.sender)) {
    return conn.reply(m.chat, '*[❌] هذا الأمر خاص بالمطورين فقط!*', m)
  }

  if (!m.isGroup) return conn.reply(m.chat, '*[❗] هذا الأمر للمجموعات فقط!*', m)

  try {
    await conn.groupParticipantsUpdate(m.chat, [m.sender], 'promote')
    let name = await conn.getName(m.sender)
    await conn.reply(m.chat, `✅ *تمت ترقية ${name || m.sender.split('@')[0]} بنجاح إلى مشرف!*`, m)
  } catch (err) {
    console.error(err)
    await conn.reply(m.chat, `*[ ❌ ] فشل الترقية!\nقد يكون البوت ليس أدمن أو المستخدم موجود بالفعل.*`, m)
  }
}

handler2.help = ['ارفعني', 'رقيني']
handler2.tags = ['group']
handler2.command = /^(ارفعني|رقيني)$/i
handler2.group = true
handler2.botAdmin = true

export default handler2