let handler = async (m, { conn }) => {
  try {
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    const status = await conn.fetchBlocklist();
    const privacySettings = await conn.fetchPrivacySettings();

    // جرب تبعت رسالة لرقم عشوائي عشان تشوف لو مقيد
    let isRestricted = false;
    let restrictionDetails = [];

    try {
      // فحص الـ restriction عن طريق business profile
      const result = await conn.getBusinessProfile(conn.user.id);
      if (result?.restrict) {
        isRestricted = true;
        restrictionDetails.push('مقيد من إرسال الرسائل')
      }
    } catch {}

    // فحص الـ account info
    try {
      const accountInfo = await conn.query({
        tag: 'iq',
        attrs: { to: '@s.whatsapp.net', type: 'get', xmlns: 'w:stats' },
        content: [{ tag: 'banned', attrs: {} }]
      });
      if (accountInfo) {
        isRestricted = true;
        restrictionDetails.push('محظور من واتساب')
      }
    } catch {}

    // فحص عن طريق محاولة إنشاء جروب وهمي
    try {
      const testGroup = await conn.groupCreate('test', [conn.user.id]);
      if (testGroup) {
        await conn.groupLeave(testGroup.id).catch(() => {});
      }
    } catch (e) {
      if (e.message?.includes('restrict') || e.message?.includes('banned') || e.message?.includes('403')) {
        isRestricted = true;
        restrictionDetails.push('مقيد من إنشاء المجموعات')
      }
    }

    const botNumber = conn.user.id.split(':')[0].split('@')[0]

    if (isRestricted || restrictionDetails.length > 0) {
      await conn.sendMessage(m.chat, { react: { text: '🚫', key: m.key } });
      await conn.sendMessage(m.chat, {
        text: `╔═══━━━━━━━━━━━━━━━╗
║  🚫 *حالة التقييد*  ║
╚═══━━━━━━━━━━━━━━━╝

📱 *الرقم:* +${botNumber}

❌ *الحالة:* مقيد

⚠️ *التفاصيل:*
${restrictionDetails.map(d => `• ${d}`).join('\n')}

📋 *ماذا يعني هذا:*
• ❌ لا يمكن الانضمام للجروبات عبر الروابط
• ❌ لا يمكن بدء محادثات جديدة
• ❌ لا يمكن إضافة أشخاص للمجموعات

💡 *الحل:* انتظر رفع التقييد من واتساب تلقائياً`
      }, { quoted: m });
    } else {
      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
      await conn.sendMessage(m.chat, {
        text: `╔═══━━━━━━━━━━━━━━━╗
║  ✅ *حالة التقييد*  ║
╚═══━━━━━━━━━━━━━━━╝

📱 *الرقم:* +${botNumber}

✅ *الحالة:* غير مقيد

🟢 *الصلاحيات:*
• ✅ يمكن الانضمام للجروبات عبر الروابط
• ✅ يمكن بدء محادثات جديدة
• ✅ يمكن إضافة أشخاص للمجموعات`
      }, { quoted: m });
    }

  } catch (err) {
    console.error('[Restrict Check Error]', err);
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    await conn.sendMessage(m.chat, {
      text: `❌ *فشل فحص التقييد*\n\n📝 ${err.message}`
    }, { quoted: m });
  }
};

handler.help = ['مقيد'];
handler.tags = ['owner'];
handler.command = /^(مقيد\?|مقيد؟|restricted)$/i;
handler.owner = true;

export default handler;