// plugins/qawaneen.js
// أمر: .قوانين أو .rules
// متوافق مع Baileys-Pro

import fs from "fs";
import path from "path";

const RULES_TEXT = `⛩️ • قوانين المجموعة — SUKUNA BOT • ⛩️

مرحبًا أيها الأبطال! ✨ القوانين هنا مش تعذيب، دي علشان نحافظ على جو ممتع وآمن لكل الناس.
اقرأها كويس وتابعها عشان تبقى جزء من العيلة 🔥

1) ✋ الاحترام أولًا
   لا سب، لا شتائم، لا إساءة لأي شخص — سواء مدير أو عضو جديد.

2) 🚫 لا سبام / لا نشر إعلانات
   أي رسالة تروج لمجموعات أو قنوات أو قول “احفظ وانشر” بدون إذن — سيتم حذفها وتحذير صاحبها.

3) 🔗 ممنوع نشر روابط عامة
   روابط خارجية، روابط تحمل فيروسات، أو روابط بقصد الاحتيال ممنوعة. للمشاركة استخدم إذن الادمن.

4) 🤐 لا تحاول تستفز أو تشعل شتائم
   لو حصلت مشكلة بين أعضاء — راسل الادمن بدل ما تنزل مشاهد علنية.

5) 🖼️ ستيكرات وصور مناسبة فقط
   ممنوع إرسال محتوى فاضح/مخل أو صور داخلية مُهينة. أي ستيكر خادش هـ يتسبب بعقوبة.

6) 🎧 لا تزعج بالنداءات المتكررة
   منشن كتير بدون سبب = تحذير. استخدم المنشن بعقلانية.

7) ⚖️ّ القرارات للادمنز
   قرارات الحظر والتحذير بيد الادمن. احترم حكمهم — لو حسيت بالظلم كلم المطور.

8) 🧾 الخصوصية محترمة
   لا تنشر معلومات خاصة عن أي حد (أرقام، محادثات، صور) بدون موافقة صريحة.

9) ⏱️ التكرار يعاقب
   تكرار نفس الإزعاج بعد تحذيرين = حظر مؤقت أو دائم حسب الحالة.

10) 📢 تواصل مع الدعم
   لو عندك شكوى أو استفسار تواصل مع المسؤول: *01002804195* (مشرف البوت).

━━━━━━━━━━━━━━
🛡️ نظام العقوبات:
- مخالفة أولى: تحذير.
- مخالفة ثانية: صمت/كتم لمدة محددة.
- مخالفة مستمرة: طرد أو حظر نهائي.

⛩️SUKUNA⚡️BOT⛩️
احترموا المكان، وخلّوا الجروب ممتع وآمن للجميع!`;

export default async function handler(m, { conn }) {
  try {
    const jid = m.key.remoteJid;
    const mediaDir = path.join(process.cwd(), "media"); 
    const stickerPath = path.join(mediaDir, "rules.webp"); 
    const imagePath = path.join(mediaDir, "rules.jpg");    

    // إرسال ستكر لو موجود
    if (fs.existsSync(stickerPath)) {
      const stickerBuf = fs.readFileSync(stickerPath);
      await conn.sendMessage(jid, { sticker: stickerBuf }, { quoted: m });
    }

    // إرسال صورة ترويجية للقوانين
    if (fs.existsSync(imagePath)) {
      const imgBuf = fs.readFileSync(imagePath);
      await conn.sendMessage(jid, { image: imgBuf, caption: "⛩️ قوانين المجموعة — اقرأها بعناية 👇" }, { quoted: m });
    }

    // إرسال نص القوانين المطوّل
    await conn.sendMessage(jid, { text: RULES_TEXT }, { quoted: m });

  } catch (err) {
    console.error("plugins/qawaneen.js error:", err);
    try {
      await conn.sendMessage(m.key.remoteJid, { text: "❌ حصل خطأ أثناء جلب القوانين. حاول تاني." }, { quoted: m });
    } catch {}
  }
}

handler.command = /^(قوانين|rules)$/i;
handler.tags = ["group"];
handler.help = ["قوانين"];