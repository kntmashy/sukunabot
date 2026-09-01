// kafka.js
// ضع هذا الملف في مجلد handlers ثم أعد تشغيل البوت

let handler = async (m, { conn, text }) => {
  if (!text) return await m.reply("- 「🤔」 اكتب سؤالك بعد الأمر.\nمثال:\n.كافكا كيف أتصرف أمام كايجو؟");

  await m.reply("🤔 كافكا يفكر... لحظة.");

  try {
    let result = await KafkaAI(text);
    await m.reply(`*╮━━━══━━❪🛡️ كافكا ❫━━══━━━❍*\n${result}\n*╯━━━══━━❪🛡️❫━━══━━━❍*`);
  } catch (e) {
    console.error("Kafka handler error:", e);
    await m.reply("『 🛡️ 』كافكا مش قادر يرد دلوقتي... جرب بعد شوية.");
  }
};

handler.command = /^(كافكا|كافكا٨|كافكا8|كايجو|كايجو٨|كايجو8)$/i;
export default handler;

// ---------------- helper functions ----------------
async function getFetch() {
  if (globalThis.fetch) return globalThis.fetch;
  // dynamic import for node-fetch if needed
  try {
    const mod = await import('node-fetch');
    return mod.default || mod;
  } catch (err) {
    console.error("getFetch: failed to import node-fetch, fetch not available", err);
    throw new Error("fetch not available. Install node-fetch or use Node >= 18");
  }
}

async function KafkaAI(q) {
  const fetch = await getFetch();
  const base = "https://alakreb.vercel.app/api/ai/gpt?q=";

  // توجه الـ API: كافكا من كايجو رقم 8 — طيب ومتوتر شوية لكن عنده قوة كبيرة
  const prompt = `أنت كافكا هيبينو من Kaiju No.8. تكلم بأسلوب طيب، مرتبك قليلًا، لكنه قوي ومصمّم. ردودك قصيرة، مرنة، وفيها لمسة شجاعة مفاجئة. أجب باختصار وبأسلوب واقعي. السؤال: ${q}`;

  const url = base + encodeURIComponent(prompt);
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text().catch(()=>'<no-body>');
    console.error("Kafka API non-OK:", res.status, body);
    throw new Error(`API responded ${res.status}`);
  }

  // حاول نقرأ JSON، واطبع شكله عشان نتبع المشاكل بسهولة
  const data = await res.json().catch(err => {
    console.error("Kafka parse json err:", err);
    return null;
  });
  console.log("Kafka API raw response:", JSON.stringify(data));

  // اقرأ من المفاتيح الشائعة (message, result, answer, data) أو لو الـ API رجع نص خام
  const reply =
    (data && (data.message || data.result || data.answer || data.data)) ||
    (typeof data === 'string' ? data : null);

  return reply || "🛡️ كافكا لم يستطع الحصول على رد من الخادم.";
}