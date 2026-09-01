const handler = async (m, { conn, command, participants }) => {
  try {
    const users = participants.map(v => v.id)
    let message = ''
    if (command === 'منشن_الكل') {
      message = '⛩️ منشن الجميع ⛩️\n\n' + users.map(u => `@${u.split('@')[0]}`).join(' ')
    } else if (command === 'منشن_الاعضاء') {
      const members = participants.filter(p => !p.admin)
      message = '⛩️ منشن الأعضاء ⛩️\n\n' + members.map(u => `@${u.id.split('@')[0]}`).join(' ')
    } else if (command === 'منشن_المشرفين') {
      const admins = participants.filter(p => p.admin)
      message = '👑 منشن المشرفين 👑\n\n' + admins.map(u => `@${u.id.split('@')[0]}`).join(' ')
    }

    await conn.sendMessage(m.chat, { text: message, mentions: users })
  } catch (e) {
    console.error('❌ Error in mention-actions.js:', e)
    m.reply('⚠️ حدث خطأ أثناء تنفيذ أمر المنشن.')
  }
}

handler.command = /^(منشن_الكل|منشن_الاعضاء|منشن_المشرفين)$/i
export default handler