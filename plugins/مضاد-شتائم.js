// ════════════════════════════════════════════════════════
// ⛩️ SUKUNA BOT v4 — Anti-Swear
// ════════════════════════════════════════════════════════

const badWords = [
  'كس', 'كسم', 'كسمك', 'كسمك', 'كسأمك',
  'متناك', 'متناكة', 'متناكه',
  'زب', 'زبك', 'زبي',
  'شرموط', 'شرموطة', 'شرموطه',
  'عرص', 'عرصة', 'عرصه',
  'لعنة', 'العن',
  'ابن الشرموطة', 'بن الشرموطة', 'ابن الشرموطه', , 'بن الشرموطه',
  'نيك', 'بنيك', 'اتناك',
  'طيز', 'طيزك', 'طيزي',
  'قحبة', 'قحبه',
  'منيوك', 'منيوكة',
]

// regex يكشف الشتيمة كجزء من كلمة أو وحدها
const swearRegex = new RegExp(badWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i')

// ════════════════════════════════════════════════════════
// 📌 أمر .antiswear on / off
// ════════════════════════════════════════════════════════
const handler = async function (m, { conn, args, isAdmin, isROwner }) {
  if (!m.isGroup)
    return m.reply(
      `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
      `*┇⌗╎ꕥ هذا الأمر للمجموعات فقط ⌗*\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
    )

  if (!isAdmin && !isROwner)
    return m.reply(
      `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
      `*┇⌗╎ꕥ هذا الأمر للأدمن فقط ⌗*\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
    )

  const arg = (args[0] || '').toLowerCase()

  if (arg !== 'on' && arg !== 'off')
    return m.reply(
      `*╮═≼『⛩️┃مضاد الشتايم┃⛩️』≽═╭*\n\n` +
      `*┇⌗╎ꕥ اختار أحد الخيارات:*\n` +
      `*┇⌗╎ 🟢 .antiswear on — تفعيل*\n` +
      `*┇⌗╎ 🔴 .antiswear off — تعطيل*\n\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
    )

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
  const chat = global.db.data.chats[m.chat]

  if (arg === 'on') {
    chat.antiSwear = true
    return m.reply(
      `*╮═≼『⛩️┃مضاد الشتايم┃⛩️』≽═╭*\n\n` +
      `*┇⌗╎ 🟢 تم تفعيل مضاد الشتايم!*\n` +
      `*┇⌗╎ꕥ أي شتيمة سيتم التعامل معها فوراً ⌗*\n\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
    )
  }

  chat.antiSwear = false
  return m.reply(
    `*╮═≼『⛩️┃مضاد الشتايم┃⛩️』≽═╭*\n\n` +
    `*┇⌗╎ 🔴 تم تعطيل مضاد الشتايم!*\n\n` +
    `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
  )
}

handler.command  = /^antiswear$/i
handler.help     = ['antiswear on/off']
handler.tags     = ['group']
handler.group    = true
handler.admin    = true

// ════════════════════════════════════════════════════════
// 🔍 before — يراقب كل رسالة
// ════════════════════════════════════════════════════════
handler.before = async function (m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
  if (!m.isGroup) return
  if (!m.text)    return
  if (m.fromMe)   return
  if (isAdmin || isOwner || isROwner) return

  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
  const chat = global.db.data.chats[m.chat]

  // لو مش مفعّل — تجاهل
  if (!chat.antiSwear) return

  // تحقق من الشتيمة
  if (!swearRegex.test(m.text)) return

  // حذف الرسالة فوراً لو البوت أدمن
  if (isBotAdmin) {
    await conn.sendMessage(m.chat, {
      delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.sender }
    }).catch(() => {})
  }

  // نظام الإنذارات
  if (!chat.warnings)           chat.warnings = {}
  if (!chat.warnings[m.sender]) chat.warnings[m.sender] = 0
  chat.warnings[m.sender]++

  const warns = chat.warnings[m.sender]
  const user  = `@${m.sender.split('@')[0]}`

  // أقل من 3 إنذارات
  if (warns < 3) {
    await conn.sendMessage(m.chat, {
      text:     `*「 مضاد الشتايم 」*\n\n${user}\n⚠️ الكلام ده مش مقبول هنا!\nعدد إنذاراتك: *${warns}/3*`,
      mentions: [m.sender]
    }, { quoted: m }).catch(() => {})
    return true
  }

  // 3 إنذارات ➜ طرد
  await conn.sendMessage(m.chat, {
    text:     `*「 مضاد الشتايم 」*\n\n${user}\n💀 وصلت 3 إنذارات → سيتم طردك!`,
    mentions: [m.sender]
  }, { quoted: m }).catch(() => {})

  if (!isBotAdmin) {
    await conn.sendMessage(m.chat, {
      text: `❌ أنا مش أدمن علشان أطرد العضو`
    }).catch(() => {})
    return true
  }

  await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => {})

  // إعادة تصفير الإنذارات
  chat.warnings[m.sender] = 0
  return true
}

export default handler