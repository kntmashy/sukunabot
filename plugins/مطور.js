const handler = async (m, { conn }) => {
  await conn.sendMessage(m.chat, {
    contacts: {
      displayName: '⛩️ الفحل',
      contacts: [{
        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:⛩️ الفحل\nORG:Sukuna Bot\nTEL;type=CELL;type=VOICE;waid=201016855501:+201016855501\nEND:VCARD`
      }]
    }
  }, { quoted: m })
}

handler.command = /^(مطور|dev)$/i
export default handler
