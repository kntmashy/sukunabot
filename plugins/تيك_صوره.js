import axios from 'axios';

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply('*[❗] ابعت رابط بوست الصور من تيكتوك\n\nمثال: .تيك_صوره https://vm.tiktok.com/ZM2cqBRVS/*');

  await m.react('⏳');

  try {
    const res = await axios.post('https://www.tikwm.com/api/', {
      url: text.trim(),
      hd: 1
    }, {
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      timeout: 20000
    });

    const data = res.data?.data;
    if (!data) throw new Error('مفيش بيانات');

    const images = data.images;
    if (!images || images.length === 0) {
      await m.react('❌');
      return m.reply('*[❗] الرابط ده مش بوست صور (slideshow)، جرب رابط تاني.*');
    }

    await m.react('📸');

    for (const img of images) {
      const imgUrl =
        img?.display_image?.url_list?.[0] ||
        img?.owner_watermark_image?.url_list?.[0] ||
        img?.url || img;

      if (!imgUrl) continue;

      try {
        await conn.sendMessage(m.chat, { image: { url: imgUrl } }, { quoted: m });
      } catch (e) {
        console.log('[تيك_صوره] فشل صورة:', e.message);
      }
    }

    await m.react('✅');

  } catch (e) {
    console.error('[تيك_صوره]', e.message);
    await m.react('❌');
    return m.reply('*[❗] لا يوجد رد من الصفحه، حاول مجددا.*');
  }
};

handler.command = /^(تيك_صوره)$/i;
export default handler;