let handler = async (m, { conn, text }) => {
  try {
    const num = text?.trim();

    if (!['1', '2', '3'].includes(num)) {
      return conn.sendMessage(m.chat, {
        text: `╔═══━━━━━━━━━━━━━━━╗
║  ⚙️ *إعدادات الإضافة*  ║
╚═══━━━━━━━━━━━━━━━╝

📌 *الاستخدام:*
• *.اضافة 1* ← الكل يقدر يضيف البوت
• *.اضافة 2* ← جهات الاتصال بس
• *.اضافة 3* ← المالك بس`
      }, { quoted: m });
    }

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    const settingMap = {
      '1': 'all',
      '2': 'contacts',
      '3': 'none'
    };

    const labelMap = {
      '1': '🌍 الكل',
      '2': '👥 جهات الاتصال فقط',
      '3': '🔒 المالك فقط'
    };

    const setting = settingMap[num];

    await conn.updateGroupsAddPrivacy(setting);

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    await conn.sendMessage(m.chat, {
      text: `╔═══━━━━━━━━━━━━━━━╗
║  ✅ *تم التحديث*  ║
╚═══━━━━━━━━━━━━━━━╝

⚙️ *إعداد الإضافة للجروبات:*
${labelMap[num]}

✅ تم تطبيق الإعداد بنجاح`
    }, { quoted: m });

  } catch (err) {
    console.error('[Add Privacy Error]', err);
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    await conn.sendMessage(m.chat, {
      text: `❌ *فشل تغيير الإعداد*\n\n📝 ${err.message}`
    }, { quoted: m });
  }
};

handler.help = ['اضافة <1|2|3>'];
handler.tags = ['owner'];
handler.command = /^اضافة$/i;
handler.owner = true;

export default handler;