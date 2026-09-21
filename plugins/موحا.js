/**
 * plugins/mohab.js
 * لما حد يقول موحا يرد عليه
 */

const handler = async function (m, { conn }) {
  if (!m?.text) return
  if (!/موحا/i.test(m.text)) return

  await conn.sendMessage(m.chat, {
    text: `عايز إيه من مرات مهاب🎀😭`,
  }, { quoted: m })
}

handler.all = async function (m, { conn }) {
  if (!m?.text) return
  if (!/موحا/i.test(m.text)) return

  await conn.sendMessage(m.chat, {
    text: `عايز إيه من مرات مهاب🎀😭`,
  }, { quoted: m }).catch(() => {})
}

handler.command = false
handler.tags    = ['fun']
export default handler