const handler = async (m, { conn }) => {
  try {
    const jid = m.chat;

    // لو مش جروب
    if (!m.isGroup) {
      return m.reply("❌ الأمر ده يشتغل داخل الجروبات فقط");
    }

    await m.reply(
      `📌 *Group ID:*\n\n${jid}\n\n` +
      `📎 استخدمه في الإعدادات أو المشاريع`
    );

  } catch (e) {
    console.log(e);
    m.reply("❌ حصل خطأ");
  }
};

handler.help = ['group-id'];
handler.tags = ['tools'];
handler.command = /^(group-id|id|ايدي_الجروب)$/i;

export default handler;