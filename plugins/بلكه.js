/**
 * plugins/بلكه.js
 */

const handler = async (m, { conn, isROwner }) => {
  if (!isROwner) return m.reply('❌ هذا الأمر للمالك فقط')

  let target = m.mentionedJid?.[0] || m.quoted?.sender || null
  if (!target) return m.reply('❌ منشن شخص أو رد على رسالته')
  if (target.includes('@g.us')) return m.reply('❌ مينفعش تبلك جروب!')
  if (!target.includes('@')) target += '@s.whatsapp.net'

  console.log('[بلكه] target:', target)

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
        attrs: { action: 'block', jid: target }
      }]
    })
    await m.react('🚫')
    return conn.sendMessage(m.chat, {
      text: `🚫 *تم حظر @${target.split('@')[0]} بنجاح*`,
      mentions: [target]
    }, { quoted: m })
  } catch (e) {
    console.error('[بلكه]', e.message)
    // جرب طريقة تانية
    try {
      await conn.updateBlockStatus(target, 'block')
      await m.react('🚫')
      return conn.sendMessage(m.chat, {
        text: `🚫 *تم حظر @${target.split('@')[0]} بنجاح*`,
        mentions: [target]
      }, { quoted: m })
    } catch (e2) {
      console.error('[بلكه] fallback:', e2.message)
      return m.reply(`❌ فشل الحظر: ${e2.message}`)
    }
  }
}

handler.help    = ['بلكه @شخص']
handler.tags    = ['owner']
handler.command = /^(بلكه|block|حظر)$/i
handler.owner   = true

export default handler