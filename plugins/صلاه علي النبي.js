let sent = false

setInterval(async () => {
  try {
    // كل الشاتات اللي البوت فيها
    const chats = Object.keys(global.db.data.chats || {})

    for (const chat of chats) {
      // لو عايزة الجروبات فقط
      if (!chat.endsWith('@g.us')) continue

      await conn.reply(
        chat,
        'صلّوا على النبي ﷺ 🤍',
        null
      )
    }
  } catch (e) {
    console.log(e)
  }
}, 60 * 60 * 1000) // كل ساعة

export default {}