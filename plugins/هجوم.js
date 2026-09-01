const DEVS = ['201150572826@s.whatsapp.net', '201016855501@s.whatsapp.net']
const OWNER = '201016855501@s.whatsapp.net' // ✅ رقمك أنت بس (محدش يقدر يسرقك)

let ro = 3000

let handler = async (m, { conn, usedPrefix, command }) => {
  const isOwner = m.sender === OWNER // ✅ أنت (المالك)
  const isDev = DEVS.includes(m.sender) && !isOwner // ✅ المطورين التانيين (مش أنت)

  let who
  if (m.isGroup) who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false
  else who = m.chat
  if (!who) throw `*[❗] منشن للي هتسرقه يحرامي*`
  if (!(who in global.db.data.users)) throw `*[❗] المستخدم غير موجود في قاعدة البيانات الخاصة بي.*`

  // ===== منع سرقة المالك =====
  if (who === OWNER) {
    return m.reply(`❌ *مينفعش تسرق المالك يا حبيبي!*\n\n@${OWNER.split('@')[0]} هو صاحب البوت 🤖`, null, { mentions: [OWNER] })
  }

  // ===== أنت (المالك) =====
  if (isOwner) {
    const users = global.db.data.users[who]
    const allMoney = users.exp || 0
    if (allMoney <= 0) return m.reply(`😂 @${who.split('@')[0]} مفيش عنده حاجة تسرقها!`, null, { mentions: [who] })

    global.db.data.users[who].exp = 0
    global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + allMoney

    return m.reply(
      `*👑 المالك سرق كل شيء!*\n\n` +
      `*‣ تم سرقة ${allMoney} XP من @${who.split('@')[0]}*\n` +
      `*‣ رصيده الآن: 0 XP* 💀`,
      null, { mentions: [who] }
    )
  }

  // ===== المطورين التانيين (غيرك) =====
  if (isDev) {
    const users = global.db.data.users[who]
    const allMoney = users.exp || 0
    if (allMoney <= 0) return m.reply(`😂 @${who.split('@')[0]} مفيش عنده حاجة تسرقها!`, null, { mentions: [who] })

    global.db.data.users[who].exp = 0
    global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + allMoney

    return m.reply(
      `*⚡ المطور سرق كل شيء!*\n\n` +
      `*‣ تم سرقة ${allMoney} XP من @${who.split('@')[0]}*\n` +
      `*‣ رصيده الآن: 0 XP* 💀`,
      null, { mentions: [who] }
    )
  }

  // ===== الأعضاء العاديين =====
  let time = global.db.data.users[m.sender].lastrob + 7200000
  if (new Date - global.db.data.users[m.sender].lastrob < 7200000)
    throw `*⏱️ مهلا انتظر ${msToTime(time - new Date())} عشان تسرق تاني*`

  let users = global.db.data.users[who]
  let rob = Math.floor(Math.random() * ro)
  if (users.exp < rob) return m.reply(`😔 @${who.split('@')[0]} لديه أقل من *${ro} xp*\nلا تسرق رجل فقير`, null, { mentions: [who] })

  global.db.data.users[m.sender].exp += rob
  global.db.data.users[who].exp -= rob
  m.reply(`*‣ انت سرقت ${rob} XP من @${who.split('@')[0]}*`, null, { mentions: [who] })
  global.db.data.users[m.sender].lastrob = new Date * 1
}

handler.help = ['rob']
handler.tags = ['econ']
handler.command = ['هجوم', 'سرقه']

export default handler

function msToTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
  hours = (hours < 10) ? '0' + hours : hours
  minutes = (minutes < 10) ? '0' + minutes : minutes
  seconds = (seconds < 10) ? '0' + seconds : seconds
  return hours + ' ساعات ' + minutes + ' دقائق'
}