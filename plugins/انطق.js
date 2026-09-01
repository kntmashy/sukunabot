import fetch from "node-fetch";

let handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) {
    return m.reply(`أدخل نصًا بعد الأمر.\nمثال: *${usedPrefix}انطق مرحبًا بك في البوت*`);
  }

  try {
    const audioUrl = await generateAudio(text);
    if (audioUrl) {
      await m.reply(`تم توليد الصوت، يمكنك الاستماع إليه: ${audioUrl}`);
    } else {
      await m.reply("لم يتم العثور على الصوت. حاول مرة أخرى.");
    }
  } catch (e) {
    console.error("حدث خطأ:", e);
    await m.reply("حدث خطأ أثناء معالجة طلبك. يرجى المحاولة لاحقًا.");
  }
};

handler.help = ["انطق"];
handler.tags = ["tools"];
handler.command = /^انطق$/i;

export default handler;

async function generateAudio(text) {
  const url = `https://bk9.fun/tools/tts-voices?q=${encodeURIComponent(text)}&voice=`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("فشل الاتصال بالخدمة.");
    }

    const data = await response.json();

    if (data?.audioUrl) {
      return data.audioUrl;  // سيتم إرجاع رابط الصوت من الـ API
    } else {
      throw new Error("لم يتم العثور على رابط الصوت في الرد.");
    }
  } catch (error) {
    console.error("خطأ في التواصل مع API:", error);
    throw new Error("فشل في الحصول على الصوت من الـ API.");
  }
}