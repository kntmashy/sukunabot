import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, text }) => {
  // رد فعل سريع
  try {
    await conn.sendMessage(m.chat, { react: { text: "🎞️", key: m.key } });
  } catch (e) {}

  if (!text) {
    return await conn.sendMessage(m.chat, {
      text: `⌯﹝ ⛩️ *SUKUNA ⚡️ BOT* ⛩️ ﹞⌯\n\n⚠️ *يرجى كتابة اسم الشخصية التي تريد الايديت لها.*\n\nمثال: .ايديت-بينتر ايزانا`
    }, { quoted: m });
  }

  await conn.sendMessage(m.chat, { text: "⏳ جارٍ البحث عن ايديت من Pinterest، يرجى الانتظار..." }, { quoted: m });

  try {
    // 1) ابحث في Dark API عن بنز (pins) مرتبطة بالاستعلام
    const searchResp = await axios.get(`https://dark-api-x.vercel.app/api/v1/search/pinterest_video?query=${encodeURIComponent(text)}`);
    const pins = searchResp.data?.pins;

    if (!pins || pins.length === 0) {
      return conn.sendMessage(m.chat, {
        text: `⌯﹝⛩️ *SUKUNA ⚡️ BOT* ⛩️ ﹞⌯\n\n❌ لم أجد أي نتائج ل: *${text}*`
      }, { quoted: m });
    }

    // نأخذ أول نتيجة أو عشوائية — هنا نستخدم أول نتيجة لتفادي اختيار خاطئ
    const chosenPin = pins[0];
    const pinUrl = chosenPin.pin_url || chosenPin.link || chosenPin.url || '';

    if (!pinUrl) {
      return conn.sendMessage(m.chat, {
        text: `⌯﹝ ⛩️ *SUKUNA ⚡️ BOT* ⛩️ ﹞⌯\n\n❌ لم أستطع الحصول على رابط البن.`
      }, { quoted: m });
    }

    // 2) اطلب من الـ API رابط الفيديو القابل للتحميل
    const dlResp = await axios.get(`https://dark-api-x.vercel.app/api/v1/download/pinviddl?url=${encodeURIComponent(pinUrl)}`);
    const dl = dlResp.data;

    if (!dl || !dl.status || !dl.video_url) {
      return conn.sendMessage(m.chat, {
        text: `⌯﹝ 𝑆𝐻𝛩𝐷𝛩𝑊 𝐵𝛩𝑇 ﹞⌯\n\n❌ لم أتمكن من استخراج رابط الفيديو من Pinterest.`
      }, { quoted: m });
    }

    const videoUrl = dl.video_url;
    const output = path.resolve('./pin_edit.mp4');

    // تأكد من حذف أي ملف قديم بنفس الاسم
    try { if (fs.existsSync(output)) fs.unlinkSync(output); } catch (e) {}

    await conn.sendMessage(m.chat, { text: "⬇️ جاري تنزيل ومعالجة الفيديو..." }, { quoted: m });

    // 3) استخدم ffmpeg لتحميل الفيديو (copy stream) — يَحافظ على الجودة إن أمكن
    const ff = spawn('ffmpeg', ['-i', videoUrl, '-c', 'copy', '-y', output], { stdio: 'ignore' });

    ff.on('error', async (err) => {
      console.error('ffmpeg spawn error:', err);
      await conn.sendMessage(m.chat, {
        text: `⌯﹝ 𝑆𝐻𝛩𝐷𝛩𝑊 𝐵𝛩𝑇 ﹞⌯\n\n❌ فشل تشغيل ffmpeg: ${err.message}`
      }, { quoted: m });
    });

    ff.on('close', async (code) => {
      if (code === 0 && fs.existsSync(output)) {
        const caption = `
⌯﹝ 𝑆𝐻𝛩𝐷𝛩𝑊 𝐵𝛩𝑇 ﹞⌯

🎬 تفضل ايديت لـ *${text}* من Pinterest
📥 المصدر: Pinterest
${dl.title ? `\n📝 العنوان: ${dl.title}` : ''}
`.trim();

        try {
          // اقرأ الملف وأرسله كفيديو
          const fileData = fs.readFileSync(output);
          await conn.sendMessage(m.chat, {
            video: fileData,
            caption
          }, { quoted: m });
        } catch (e) {
          console.error('send video error:', e);
          await conn.sendMessage(m.chat, {
            text: `⌯﹝ ⛩️ *SUKUNA ⚡️ BOT* ⛩️ ﹞⌯\n\n❌ حدث خطأ أثناء إرسال الفيديو: ${e.message}`
          }, { quoted: m });
        } finally {
          // نظف الملف
          try { fs.unlinkSync(output); } catch (e) {}
        }
      } else {
        console.error('ffmpeg exited with code', code);
        await conn.sendMessage(m.chat, {
          text: `⌯﹝ ⛩️ *SUKUNA ⚡️ BOT* ⛩️ ﹞⌯\n\n❌ فشل في تنزيل/معالجة الفيديو (رمز الخروج: ${code}).`
        }, { quoted: m });
      }
    });
  } catch (e) {
    console.error(e);
    await conn.sendMessage(m.chat, {
      text: `⌯﹝ ⛩️ *SUKUNA ⚡️ BOT* ⛩️ ﹞⌯\n\n❌ حدث خطأ أثناء العملية:\n*${e.message || e}*`
    }, { quoted: m });
  }
};

handler.help = ['ايديت-بينتر <اسم>'];
handler.tags = ['search', 'downloader'];
handler.command = /^(ايديت-بينتر|ايديتبينتر|ايدت-بينتر|بينتر-ايديت)$/i;

export default handler;