// ==================== حط ====================
let cmdHandlerHatt = async (m, { conn }) => {
  const text = m.text.trim();
  const match = text.match(/^[.!#]حط\s+(\S+)$/u);
  if (!match) return;

  const emoji = match[1];

  if (!m.quoted) {
    return m.reply('❌ لازم ترد على رسالة عشان أحط الإيموجي عليها.');
  }

  const quotedKey = {
    remoteJid: m.chat,
    fromMe: m.quoted.fromMe || false,
    id: m.quoted.id || (m.quoted.key && m.quoted.key.id),
    participant: m.quoted.sender || m.quoted.participant || (m.quoted.key && m.quoted.key.participant)
  };

  try {
    await conn.sendMessage(m.chat, {
      react: { text: emoji, key: quotedKey }
    });
  } catch (err) {
    console.log('حط error:', err);
    return m.reply('❌ حصل خطأ، ابعت الإيرور دة: ' + err.message);
  }
};
cmdHandlerHatt.command = /^حط$/i;

export default cmdHandlerHatt;