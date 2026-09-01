// plugins/devContact.js

const handler = async (m, { conn }) => {
  try {
    // استخدام RegExp للتأكد من مطابقة النصوص
    if (/^🚀 تواصل مع المطور$/i.test(m.text)) {

      const contact1 = {
        displayName: 'عمي',
        vcard: `BEGIN:VCARD
VERSION:3.0
FN:عمي
TEL;type=CELL;waid=201036547166:+201036547166
END:VCARD`
      };

      const contact2 = {
        displayName: 'عمي 2',
        vcard: `BEGIN:VCARD
VERSION:3.0
FN:عمي 2
TEL;type=CELL;waid=201016855501:+201016855501
END:VCARD`
      };

      await conn.sendMessage(m.chat, {
        contacts: { displayName: 'جهات اتصال المطور', contacts: [contact1, contact2] }
      }, { quoted: m });
    }
  } catch (err) {
    console.error('[ SUKUNA BOT ] خطأ في التواصل مع المطور:', err);
    await conn.sendMessage(m.chat, { text: '⚠️ حدث خطأ أثناء إرسال جهات الاتصال!' }, { quoted: m });
  }
};

handler.help = ['🚀 تواصل مع المطور'];
handler.tags  = ['main'];
handler.command = ['🚀 تواصل مع المطور']; // لازم نضيفها للـ esm
handler.rowner = false; // مش لازم يكون مالك
handler.limit = false;  // بدون حد
export default handler;