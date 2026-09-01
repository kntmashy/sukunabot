import translate from '@vitalets/google-translate-api'
import { Anime } from "@shineiichijo/marika"
const client = new Anime();

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`*[❗] من فضلك أدخل اسم الأنمي الذي تريد البحث عنه*`);
  try {
    let anime = await client.searchAnime(text);
    let result = anime.data[0];

    // ترجمة السيرة واللمحة للعربية
    let translatedBackground = await translate(`${result.background || 'لا توجد لمحة متوفرة'}`, { to: 'ar', autoCorrect: true });
    let translatedSynopsis = await translate(`${result.synopsis || 'لا توجد سيرة متوفرة'}`, { to: 'ar', autoCorrect: true });

    // تنسيق البيانات النهائية
    let AnimeInfo = `
*معلومات الأنمي:*

• الاسم: ${result.title}
• الشكل: ${result.type}
• الحالة: ${result.status.toUpperCase().replace(/_/g, " ")}
• عدد الحلقات: ${result.episodes || 'غير معروف'}
• المدة: ${result.duration || 'غير معروفة'}
• مقتبس من: ${result.source.toUpperCase()}
• أول عرض: ${result.aired.from || 'غير متوفر'}
• تاريخ الانتهاء: ${result.aired.to || 'غير متوفر'}
• الشعبية: ${result.popularity}
• عدد المفضلة: ${result.favorites}
• التصنيف العمري: ${result.rating}
• الترتيب العالمي: ${result.rank}
• رابط التريلر: ${result.trailer?.url || 'لا يوجد'}
• رابط MAL: ${result.url}

*لمحة عن الأنمي:*
${translatedBackground.text}

*السيرة:*
${translatedSynopsis.text}
    `.trim();

    conn.sendFile(m.chat, result.images.jpg.image_url, 'anime.jpg', AnimeInfo, m);
  } catch (e) {
    console.error(e);
    throw `*[❗] حدث خطأ أثناء جلب المعلومات، حاول مرة أخرى لاحقاً.*`;
  }
}

handler.command = /^(anime|انمي)$/i
export default handler