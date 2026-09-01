import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// --- الـ API / Scraper الداخلي لموقع أنمي ريفت ---
async function searchAndGetAnimeVideo(query) {
  try {
    const baseUrl = 'https://anime-rift.com'; // الرابط الأساسي للموقع (قد يتغير الدومين حسب الحظر)
    
    // 1. البحث عن الأنمي داخل الموقع
    const searchUrl = `${baseUrl}/?s=${encodeURIComponent(query)}`;
    const searchResponse = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(searchResponse.data);
    
    // جلب أول نتيجة بحث تظهر
    const firstResultLink = $('div.anime-card a').first().attr('href') || $('article a').first().attr('href');
    
    if (!firstResultLink) {
      throw new Error('لم يتم العثور على نتائج للأنمي المطلوب.');
    }

    // 2. الدخول لصفحة الأنمي/الحلقة وجلب سيرفر المشاهدة
    const animePageResponse = await axios.get(firstResultLink, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const $anime = cheerio.load(animePageResponse.data);
    
    // البحث عن روابط سيرفرات المشاهدة والتحميل (عادة تكون داخل iframe أو أزرار تحميل)
    let videoUrl = '';
    
    // محاولة جلب رابط السيرفر من الـ Iframe (مثل StreamTape أو DoodStream)
    $anime('iframe').each((i, elem) => {
      const src = $anime(elem).attr('src');
      if (src && (src.includes('streamtape') || src.includes('dood') || src.includes('mp4upload') || src.includes('rift'))) {
        videoUrl = src;
      }
    });

    // إذا لم يجد iframe، يبحث في أزرار التحميل المباشرة
    if (!videoUrl) {
      $anime('a').each((i, elem) => {
        const href = $anime(elem).attr('href');
        if (href && (href.includes('download') || href.includes('storage') || href.includes('.mp4'))) {
          videoUrl = href;
        }
      });
    }

    if (!videoUrl) {
      throw new Error('فشل استخراج سيرفر التحميل المباشر لهذه الحلقة.');
    }

    // تنظيف الرابط إذا كان يبدأ بـ //
    if (videoUrl.startsWith('//')) {
      videoUrl = 'https:' + videoUrl;
    }

    const title = $anime('h1.entry-title').text().trim() || 'أنمي مترجم';

    return {
      title: title,
      downloadUrl: videoUrl
    };

  } catch (error) {
    throw new Error(`خطأ في الـ Scraper الداخلي: ${error.message}`);
  }
}
// --------------------------------------------------

const handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply('❌ يرجى إدخال اسم الأنمي أو رقم الحلقة.\nمثال: .انمي Naruto 1');
  }

  await m.reply('🔍 يقوم الـ API الداخلي الآن بالبحث في أنمي ريفت واستخراج السيرفرات...');

  try {
    // استدعاء الـ API الذي قمنا بكتابته فوق
    const animeData = await searchAndGetAnimeVideo(text);

    await m.reply(`🎬 تم العثور على: *${animeData.title}*\n⏳ جاري تحميل الفيديو وإرساله لك الآن...`);

    const outputDir = './downloads/';
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const animePath = path.join(outputDir, `anime_${Date.now()}.mp4`);

    // تحميل مقطع الفيديو مؤقتاً إلى السيرفر
    const writer = fs.createWriteStream(animePath);
    const streamResponse = await axios({
      url: animeData.downloadUrl,
      method: 'GET',
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    streamResponse.data.pipe(writer);

    writer.on('finish', async () => {
      // إرسال ملف الأنمي للمستخدم كـ Document لضمان الجودة الكاملة
      await conn.sendMessage(m.chat, {
        document: fs.readFileSync(animePath),
        mimetype: 'video/mp4',
        fileName: `${animeData.title}.mp4`,
        caption: `🎌 *مشاهدة ممتعة!* \n\n✨ اسم الحلقة: ${animeData.title}\n🤖 تم الاستخراج بواسطة الـ API الخاص بالبوت.`
      }, { quoted: m });

      // مسح الملف لتوفير مساحة الاستضافة/الترمكس
      fs.unlinkSync(animePath);
    });

    writer.on('error', (err) => {
      if (fs.existsSync(animePath)) fs.unlinkSync(animePath);
      m.reply(`❌ فشل تحميل ملف الفيديو من السيرفر: ${err.message}`);
    });

  } catch (e) {
    return m.reply(`❌ تعذر جلب الأنمي تلقائياً:\n${e.message}\n\n💡 _ملاحظة: قد يكون الموقع مفعلاً لحماية Cloudflare قوية في الوقت الحالي تمنع البوت من الدخول._`);
  }
};

handler.help = ['انمي *<الاسم>*'];
handler.tags = ['anime'];
handler.command = /^(انمي|أنمي|rift|anime)$/i;

export default handler;