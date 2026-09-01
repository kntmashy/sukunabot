// plugins/تواصل.js

let handler = async (m, { conn }) => {
  await conn.sendMessage(m.chat, {
    contacts: {
      displayName: '👑 المطور',
      contacts: [
        {
          vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:👑 عمو مهاب\nTEL;type=CELL;type=VOICE;waid=201036547166:+20 103 654 7166\nEND:VCARD`
        },
        {
          vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:👑 عمو مهاب 2\nTEL;type=CELL;type=VOICE;waid=201016855501:+20 101 685 5501\nEND:VCARD`
        }
      ]
    }
  }, { quoted: m })

  await conn.sendMessage(m.chat, {
    text: `╭─「 ⛩️ *تواصل مع المطور* 」
│
│  🧠 *عمو مهاب* — صانع البوت
│
│  📲 *الرقم الأول:* +20 103 654 7166
│  📲 *الرقم التاني:* +20 101 685 5501
│
│  ✨ *خد وكلم فحلك!*
│  🔧 هيحل أي مشكلة في ثواني
│
╰──────────────`
  }, { quoted: m })
}

handler.help = ['تواصل']
handler.tags = ['main']
handler.command = ['تواصل']

export default handler