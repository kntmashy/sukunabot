// plugins/add-meta-bot.js
import fetch from "node-fetch";

let handler = async (m, { conn }) => {

  // ─── التأكد من أن الأمر يُستخدم في الجروبات فقط ───
  if (!m.isGroup) {
    return conn.sendMessage(m.chat, { text: "❌ هذا الأمر مخصص للمجموعات فقط يا صاحبي." }, { quoted: m });
  }

  const replyText = `≪  ❪ 🌐 𝙈𝙀𝙏𝘼 𝙊𝙁𝙁𝙄𝘾𝙄𝘼𝙇 🌐 ❫ ≫
       ❪ 𝘼𝙄 𝘼𝙎𝙎𝙄𝙎𝙏𝘼𝙉𝙏 ❫
≪ ━ ❪ 🤖 𝙏𝙃𝙀 𝘽𝙊𝙏 🤖 ❫ ━ ≫
╟「 🌐 」↬ Meta AI ✦ Official Bot ˖࣪⃟🤖
╟「 ⚡ 」↬ Processing Addition... ˖࣪⃟⚡

╰─── ≪ ❪ ✅ تمت الإضافة ❫ ≫ ───╯
◜⏤͟͟͞͞ تمت محاولة إضافة بوت ميتا للجروب بنجاح! ◞`;

  // رابط لصورة ميتا (يمكنك تغييره لأي صورة تناسبك)
  const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Meta-Logo.png/512px-Meta-Logo.png";

  try {
    // ─── React مبدئي (جاري التحميل) ───
    await conn.sendMessage(m.chat, {
      react: { text: "⏳", key: m.key }
    });

    // ─── تنفيذ أمر إضافة ميتا للجروب ───
    const metaBotJid = '867051314767696@bot';
    await conn.groupParticipantsUpdate(m.chat, [metaBotJid], 'add');

    // ─── تحميل الصورة ───
    const res = await fetch(imageUrl, { timeout: 10_000 });
    if (!res.ok) throw new Error(`فشل تحميل الصورة: ${res.status}`);
    const imageBuffer = Buffer.from(await res.arrayBuffer());

    // ─── تغيير الريأكت لعلامة الصح ───
    await conn.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    });

    // ─── إرسال رسالة التأكيد مع externalAdReply ───
    await conn.sendMessage(
      m.chat,
      {
        text: replyText,
        contextInfo: {
          externalAdReply: {
            title: "◜⏤͟͟͞͞ 𝙈𝙀𝙏𝘼 ✦ 𝘼𝙄 ✦ 𝘽𝙊𝙏 ˖࣪⃟🌐 ◞",
            body:  "˖࣪⃟🤖 𝙊𝙁𝙁𝙄𝘾𝙄𝘼𝙇 ✦ 𝘼𝙄 ✦ 𝘼𝙎𝙎𝙄𝙎𝙏𝘼𝙉𝙏 🤖˖࣪⃟",
            thumbnail: imageBuffer,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: m } 
    );

  } catch (err) {
    console.error("❌ addmeta error:", err.message);
    
    // ─── React بحالة الخطأ ───
    await conn.sendMessage(m.chat, {
      react: { text: "❌", key: m.key }
    });

    // ─── fallback: رسالة الفشل ───
    await conn.sendMessage(
      m.chat,
      { text: `❌ **فشلت عملية الإضافة.**\n\n⚠️ **ملاحظة:** قد تمنع سيرفرات واتساب إضافة الحسابات الرسمية عبر البوتات.\n\n⚙️ **تفاصيل الخطأ:** ${err.message}` },
      { quoted: m }
    ).catch(e => console.error("❌ fallback failed:", e.message));
  }
};

// ─── إعدادات الأمر ───
handler.help = ['addmeta'];
handler.tags = ['group'];
handler.command = /^(addmeta|ضيف-ميتا)$/i;

export default handler;