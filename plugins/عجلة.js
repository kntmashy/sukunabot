// plugins/random-name.js
// امر عجلة لاختيار اسم عشوائي من القائمة

let handler = async (m, { text, usedPrefix, command }) => {
  // لو مفيش أسماء مكتوبة
  if (!text) {
    return m.reply(`🎲 *طريقة الاستخدام:*\n\n${usedPrefix}${command} اسم1 اسم2 اسم3 ...\n\n📌 *مثال:*\n${usedPrefix}${command} مهاب مازن زياد احمد حسين`)
  }

  // تقسيم الأسماء (بأي مسافة أو فاصلة)
  let names = text.split(/[\s,]+/).filter(name => name.trim())
  
  if (names.length === 0) {
    return m.reply(`❌ *مافيش أسماء!*\n\n${usedPrefix}${command} مهاب مازن زياد`)
  }
  
  if (names.length === 1) {
    return m.reply(`⚠️ *لازم أكتر من اسم واحد عشان اختار!*\n\n${usedPrefix}${command} مهاب مازن زياد`)
  }

  // اختيار اسم عشوائي
  const randomIndex = Math.floor(Math.random() * names.length)
  const winner = names[randomIndex]
  
  // رسائل عشوائية للتفاعل
  const messages = [
    `🎲 *العجلة تدور...*\n\n✨ وقع الاختيار على:\n\n🏆 *${winner}* 🏆`,
    `🌀 *دارت العجلة ووقفت على...*\n\n🎯 *${winner}* 🎯`,
    `⚡ *عجلة الحظ اختارت...*\n\n🎲 *${winner}* 🎲`,
    `🎰 *تم السحب العشوائي!*\n\n🥇 *${winner}* 🥇`,
    `🎪 *النتيجة!*\n\n🎊 *${winner}* 🎊`
  ]
  
  const randomMsg = messages[Math.floor(Math.random() * messages.length)]
  
  await m.reply(randomMsg)
}

handler.help = ['عجلة <أسماء>']
handler.tags = ['fun']
handler.command = /^(عجلة|random|قرعة)$/i

export default handler