let handler = async (m, { conn, usedPrefix, command, text, isAdmin, isOwner }) => {
  if (!isAdmin && !isOwner) return conn.reply(m.chat, '*[❗] هذا الأمر مخصص للمشرفين فقط!*', m)
  if (!m.isGroup) return conn.reply(m.chat, '*[❗] هذا الأمر للمجموعات فقط!*', m)

  let user = null

  // حالة 1: الرد على رسالة شخص
  if (m.quoted) {
    user = m.quoted.sender
  } 
  // حالة 2: منشن شخص (@username)
  else if (m.mentionedJid && m.mentionedJid.length > 0) {
    user = m.mentionedJid[0]
  }
  // حالة 3: كتابة الرقم مباشرة
  else if (text) {
    let number = text.trim()
    // إزالة @ من البداية لو موجودة
    number = number.replace('@', '')
    // إزالة أي حروف غير أرقام
    number = number.replace(/[^0-9]/g, '')
    
    if (number.length < 10 || number.length > 15) {
      return conn.reply(m.chat, `*[ ⚠️ ] الرقم غير صحيح!\n\nالرقم يجب أن يكون بين 10 و 15 رقم.*`, m)
    }
    user = number + '@s.whatsapp.net'
  }
  // حالة 4: مفيش أي بيانات
  else {
    return conn.reply(m.chat, `*[❗] الاستخدام الصحيح:*\n\n*┯┷*\n*┠≽ ${usedPrefix}اعفاء @منشن*\n*┠≽ ${usedPrefix}اعفاء (بالرد على رسالة الشخص)*\n*┷┯*`, m)
  }

  // التأكد إن الشخص موجود
  if (!user) {
    return conn.reply(m.chat, `*[ ❌ ] لم يتم العثور على المستخدم!*`, m)
  }

  try {
    await conn.groupParticipantsUpdate(m.chat, [user], 'demote')
    let name = await conn.getName(user)
    await conn.reply(m.chat, `✅ *تم إعفاء ${name || user.split('@')[0]} من الإدارة بنجاح!*`, m)
  } catch (err) {
    console.error(err)
    await conn.reply(m.chat, `*[ ❌ ] فشل الإعفاء!\nقد يكون البوت ليس أدمن أو المستخدم ليس أدمن بالفعل.*`, m)
  }
}

handler.help = ['اعفاء @منشن', 'اعفاء (بالرد)']
handler.tags = ['group']
handler.command = /^(اعفاء|تنزيل|demote)$/i
handler.group = true
handler.botAdmin = true
handler.admin = true

export default handler