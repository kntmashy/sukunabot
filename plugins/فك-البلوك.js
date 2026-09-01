/**
 * plugins/فك-البلوك.js
 */

const handler = async (m, { conn, isROwner }) => {
  if (!isROwner) return m.reply('❌ هذا الأمر للمالك فقط')

  let target = m.mentionedJid?.[0] || m.quoted?.sender || null
  if (!target) return m.reply('❌ منشن شخص أو رد على رسالته')
  if (target.includes('@g.us')) return m.reply('❌ مينفعش تفك بلوك جروب!')
  if (!target.includes('@')) target += '@s.whatsapp.net'

  try {
    await conn.sendNode({
      tag: 'iq',
      attrs: {
        to: 's.whatsapp.net',
        type: 'set',
        xmlns: 'blocklist',
        id: conn.generateMessageTag()
      },
      content: [{
        tag: 'item',
        attrs: { action: 'unblock', jid: target }
      }]
    })
    await m.react('✅')
    return conn.sendMessage(m.chat, {
      text: `✅ *تم فك حظر @${target.split('@')[0]} بنجاح*`,
      mentions: [target]
    }, { quoted: m })
  } catch (e) {
    try {
      await conn.updateBlockStatus(target, 'unblock')
      await m.react('✅')
      return conn.sendMessage(m.chat, {
        text: `✅ *تم فك حظر @${target.split('@')[0]} بنجاح*`,
        mentions: [target]
      }, { quoted: m })
    } catch (e2) {
      return m.reply(`❌ فشل فك الحظر: ${e2.message}`)
    }
  }
}

handler.help    = ['فك-البلوك @شخص']
handler.tags    = ['owner']
handler.command = /^(فك-البلوك|فك_البلوك|unblock|فك)$/i
handler.owner   = true

export default handler