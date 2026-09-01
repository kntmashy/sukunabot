import fetch from "node-fetch";

let handler = async (m, { conn }) => {
  const replyText = `
⛩️══════════════⛩️
🩸 *𝑹 𝒀 𝑶 𝑴 𝑬 𝑵  𝑺 𝑼 𝑲 𝑼 𝑵 𝑨* 🩸
⛩️══════════════⛩️

❖ *ﭐلِاسَمُ*  ⟶  رِيـومَـن سُوكـونَـا
❖ *ﭐللَّقَـبُ* ⟶  مَـلِكُ اللَّعَنَـاتِ 😈
❖ *ﭐلرُّتبَـةُ* ⟶  ﭐلشَّيطَـانُ ﭐلمَحظُـور ☠️
❖ *ﭐلقُـوَّةُ* ⟶  لَا حُـدُودَ لَهَـا 🔱

⛩️══════════════⛩️

❝ اِركَعْ أَمَامِي وَأَثْبِتْ أَنَّكَ ❞
❝ تَسْتَحِقُّ المَوْتَ عَلَى يَدَيَّ ❞

⛩️══════════════⛩️

👑 *زَوْجُ العَدِيدِ مِنَ النِّسَاء*
⚡ *وَيُمكِنُ أَنتِ تَكُونِي مِنهُم*

⛩️══════════════⛩️
🩸 *👹 𝑾𝑬𝑳𝑪𝑶𝑴𝑬 𝑻𝑶 𝑴𝒀 𝑫𝑶𝑴𝑨𝑰𝑵 👹* 🩸
⛩️══════════════⛩️`.trim();

  const videoUrl = "https://files.catbox.moe/mqlh1o.mp4";
  const audioUrl = "https://files.catbox.moe/lrc08x.mp3";

  try {
    // تحميل الفيديو
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) throw new Error("فشل تحميل الفيديو");
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

    // بعت الفيديو كـ GIF مع النص
    await conn.sendMessage(
      m.chat,
      { video: videoBuffer, caption: replyText, gifPlayback: true },
      { quoted: m }
    );

    // تحميل الصوت
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error("فشل تحميل الصوت");
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    // بعت الصوت كـ PTT (voice note)
    await conn.sendMessage(
      m.chat,
      { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: true },
      { quoted: m }
    );

  } catch (err) {
    await conn.sendMessage(
      m.chat,
      { text: `⚠️ حدث خطأ: ${err.message}` },
      { quoted: m }
    );
  }
};

handler.customPrefix = /^(تست|\.تست)$/i;
handler.command = new RegExp();

export default handler;