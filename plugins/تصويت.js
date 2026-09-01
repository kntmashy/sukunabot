import crypto from 'crypto';

if (!global.pollStore) global.pollStore = new Map();

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('❌ استخدم الأمر كده:\n`.تصويت السؤال | اختيار1 | اختيار2`');

  const parts = text.split('|').map(p => p.trim()).filter(Boolean);
  if (parts.length < 3) return m.reply('❌ محتاج سؤال + اختيارين على الأقل!');

  const question = parts[0];
  const options = parts.slice(1);
  if (options.length > 12) return m.reply('❌ أقصى عدد اختيارات هو 12!');

  const pollSecret = crypto.randomBytes(32);

  try {
    const sent = await conn.sendMessage(m.chat, {
      poll: { name: question, values: options, selectableCount: 1 },
      pollSecret,
    }, { quoted: m });

    const msgId = sent?.key?.id;
    if (msgId) {
      global.pollStore.set(msgId, {
        secret: pollSecret,
        options,
        question,
        creatorJid: conn.user?.jid || conn.user?.id,
        chat: m.chat,
      });
      setTimeout(() => global.pollStore.delete(msgId), 3600000);
    }
  } catch (e) {
    console.log('تصويت error:', e);
    m.reply('❌ حصل خطأ: ' + e.message);
  }
};

handler.command = /^(تصويت|poll)$/i;
handler.help = ['تصويت السؤال | اختيار1 | اختيار2'];
handler.tags = ['tools'];

export default handler;