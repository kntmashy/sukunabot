// itadori.js
// ضع هذا الملف مع باقي الـ handlers

let handler = async (m, { conn, text }) => {
  if (!text) return await m.reply("- 「🍓」 اكتب سؤالك بعد الأمر.\nمثال:\n.ايتادوري ما هو هدفك؟");

  await m.reply("🍓 إيتادوري يفكر بإيجابية...");

  try {
    let result = await ItadoriAI(text);
    await m.reply(`*╮━━━══━━❪🍓 إيتادوري ❫━━══━━━❍*\n${result}\n*╯━━━══━━❪🍓❫━━══━━━❍*`);
  } catch (e) {
    console.error("Itadori handler error:", e);
    await m.reply("『 🍓 』يوجي مش قادر يرد دلوقتي، جرّب تاني لاحقًا.");
  }
};

handler.command = /^(ايتادوري|يوجي)$/i;
export default handler;

// ---------------- helper functions ----------------
async function getFetch() {
  if (globalThis.fetch) return globalThis.fetch;
  const mod = await import('node-fetch');
  return mod.default || mod;
}

async function ItadoriAI(q) {
  const fetch = await getFetch();
  const base = "https://alakreb.vercel.app/api/ai/gpt?q=";

  const prompt = `أنت يوجي إيتادوري من أنمي جوجوتسو كايسن. تكلم بإيجابية وبساطة، بروح مرحة وقلب طيب، لكن أظهر أيضًا شجاعتك. السؤال: ${q}`;

  const url = base + encodeURIComponent(prompt);
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(()=>'<no-body>');
    console.error("Itadori API responded non-OK:", res.status, txt);
    throw new Error(`API ${res.status}`);
  }

  const data = await res.json().catch(err => { console.error("Itadori parse json err:", err); return null; });
  console.log("Itadori API raw response:", JSON.stringify(data));

  const reply = data?.message || data?.result || data?.answer || data?.data || (typeof data === 'string' ? data : null);

  return reply || "🍓 لم أتمكن من الحصول على رد من الـ API.";
}