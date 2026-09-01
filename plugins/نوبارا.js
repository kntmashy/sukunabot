// nobara.js
// ضع هذا الملف في مجلد handlers ثم أعد تشغيل البوت

let handler = async (m, { conn, text }) => {
  if (!text) return await m.reply("- 「🔥」 اكتب سؤالك بعد الأمر.\nمثال:\n.نوبارا مين الأقوى؟");

  await m.reply("🔥 نوبارا جاهزة... استعد للضربات اللاذعة.");

  try {
    let result = await NobaraAI(text);
    await m.reply(`*╮━━━══━━❪🔥 نوبارا ❫━━══━━━❍*\n${result}\n*╯━━━══━━❪🔥❫━━══━━━❍*`);
  } catch (e) {
    console.error("Nobara handler error:", e);
    await m.reply("『 🔥 』نوبارا مش فاضية دلوقتي... جرب بعد شوية.");
  }
};

handler.command = /^(نوبارا)$/i;
export default handler;

// ---------------- helper functions ----------------
async function getFetch() {
  if (globalThis.fetch) return globalThis.fetch;
  const mod = await import('node-fetch');
  return mod.default || mod;
}

async function NobaraAI(q) {
  const fetch = await getFetch();
  const base = "https://alakreb.vercel.app/api/ai/gpt?q=";

  // توجه الـ API بحيث الرد يكون على هيئة نوبارا: حامية، لاذعة، وصريحة
  const prompt = `أنت نوبارا كوشيوا من جوجوتسو كايسن. تكلم بحدة وثقة، ردودك قصيرة ولاذعة وتحتوي على سخرية مرحة. أجب بشكل مباشر وواضح. السؤال: ${q}`;

  const url = base + encodeURIComponent(prompt);
  const res = await fetch(url);

  if (!res.ok) {
    const txt = await res.text().catch(()=>'<no-body>');
    console.error("Nobara API non-OK:", res.status, txt);
    throw new Error(`API ${res.status}`);
  }

  const data = await res.json().catch(err => { console.error("Nobara parse json err:", err); return null; });
  console.log("Nobara API raw response:", JSON.stringify(data));

  const reply = data?.message || data?.result || data?.answer || data?.data || (typeof data === 'string' ? data : null);
  return reply || "🔥 نوبارا لم تستطع الحصول على رد من الـ API.";
}