// goku.js
// نسخة غوكو – Dragon Ball

let handler = async (m, { conn, text }) => {
  if (!text) return await m.reply("- 🍙 غوكو مش قارئ عقول! اكتب سؤالك.\nمثال:\n.غوكو ما أقوى وجبة أكلتها؟");

  await m.reply("🍙 هممم... غوكو يفكر...");

  try {
    let result = await GokuAI(text);
    await m.reply(`*╮━━━══━━❪🍙 غوكو ❫━━══━━━❍*\n${result}\n*╯━━━══━━❪🍙❫━━══━━━❍*`);
  } catch (e) {
    console.error("Goku handler error:", e);
    await m.reply("『 🍙 』غوكو انشغل في التدريب... جرب بعد شوية!");
  }
};

handler.command = /^(غوكو|goku)$/i;
export default handler;

// ---------------- helper functions ----------------
async function getFetch() {
  if (globalThis.fetch) return globalThis.fetch;
  try {
    const mod = await import('node-fetch');
    return mod.default || mod;
  } catch (err) {
    console.error("getFetch: failed to import node-fetch", err);
    throw new Error("fetch not available. Install node-fetch or use Node >= 18");
  }
}

async function GokuAI(q) {
  const fetch = await getFetch();
  const base = "https://alakreb.vercel.app/api/ai/gpt?q=";

  // أسلوب غوكو
  const prompt = `أنت سون غوكو من Dragon Ball. تحدث بأسلوب مرح، بسيط، محب للأكل والقتال، دائمًا متفائل وحماسي. أجب بشكل قصير ومليء بالطاقة. سؤالي هو: ${q}`;

  const url = base + encodeURIComponent(prompt);
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text().catch(()=>'<no-body>');
    console.error("Goku API non-OK:", res.status, body);
    throw new Error(`API responded ${res.status}`);
  }

  const data = await res.json().catch(err => {
    console.error("Goku parse json err:", err);
    return null;
  });
  console.log("Goku API raw response:", JSON.stringify(data));

  const reply =
    (data && (data.message || data.result || data.answer || data.data)) ||
    (typeof data === 'string' ? data : null);

  return reply || "🍙 غوكو مش لاقي رد دلوقتي...";
}