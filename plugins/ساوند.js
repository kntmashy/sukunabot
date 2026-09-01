import axios from "axios";

let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    const query = args.join(" ");
    if (!query)
      return m.reply(`🎧 *الاستخدام:* ${usedPrefix + command} <اسم الأغنية>\n📌 مثال:\n${usedPrefix + command} funk de beleza`);

    await m.reply("🔍 *جارِ البحث في SoundCloud...*");

    // 🔍 الخطوة 1 — البحث
    const searchUrl = `https://dark-api-x.vercel.app/api/v1/search/sound_cloud?query=${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl);

    if (!data.status || !data.results?.length)
      return m.reply("❌ لم يتم العثور على أي نتيجة.");

    const track = data.results[0]; // ✅ أول نتيجة فقط

    await m.reply(`🎵 *تم العثور على الأغنية الأولى:*\n\n🎧 *${track.title}*\n👤 الفنان: ${track.artist}\n🎵 النوع: ${track.genre}\n⏱️ المدة: ${track.duration}\n❤️ الإعجابات: ${track.likes}\n▶️ التشغيلات: ${track.plays}\n\n📥 *جارِ التحميل...*`);

    // 📥 الخطوة 2 — التحميل
    const downloadUrl = `https://dark-api-x.vercel.app/api/v1/download/sound_cloud?url=${encodeURIComponent(track.link)}`;
    const res = await axios.get(downloadUrl);
    const dl = res.data;

    if (!dl.status) return m.reply("⚠️ فشل التحميل.");

    const caption = `🎧 *${dl.title}*\n💿 *الجودة:* ${dl.quality}\n💾 *الحجم:* ${(dl.size / 1024 / 1024).toFixed(2)} MB\n\n✅ *تم التحميل بواسطة ⛩️ *SUKUNA ⚡️ BOT* ⛩️*`;

    await conn.sendMessage(m.chat, {
      audio: { url: dl.audioUrl },
      mimetype: "audio/mpeg",
      fileName: `${dl.title}.mp3`,
      caption,
      contextInfo: {
        externalAdReply: {
          title: dl.title,
          body: track.artist,
          thumbnailUrl: dl.thumbnail,
          sourceUrl: track.link,
          mediaType: 1,
          renderLargerThumbnail: true,
        },
      },
    });

  } catch (e) {
    console.error(e);
    m.reply("⚠️ حدث خطأ أثناء معالجة طلب SoundCloud.");
  }
};

handler.help = ["ساوند"];
handler.tags = ["downloader"];
handler.command = /^سوند$/i;

export default handler;