import fetch from "node-fetch";

const GROQ_KEY = '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';

let handler = async (m, { text }) => {
  if (!text)
    return m.reply("- 「سمسم」 فين الكلام يا زفت؟ اكتب حاجة وخلصني.\nمثال:\n⟣ .سمسم إشرحلي يعني إيه ذكاء إصطناعي؟");

  await m.reply("استنى بس يا كتكوت، سمسم بيرد عليك دلوقتي...");

  try {
    let result = await askSemsom(text);
    await m.reply(`*╮━━━══━━❪💢❫━━══━━━❍*\n『 سمسم ☠️ 』${result}\n*╯━━━══━━❪💢❫━━══━━━❍*`);
  } catch (e) {
    console.error(e);
    await m.reply("『 سمسم ☠️ 』حتى أنا مش قادر أفهمك يا عرة.");
  }
};

handler.help = ["سمسم"];
handler.tags = ["ai"];
handler.command = /^(سمسم)$/i;

export default handler;

// ───────── API ─────────
async function askSemsom(question) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `أنت شخصية مصرية اسمها "سمسم".
أسلوبك:
- مصري شعبي جدًا
- ساخر ودمه تقيل
- هزار لاذع بس مش عشوائي
- ردود قصيرة ومضحكة
ماتقولش إنك AI.`
        },
        {
          role: 'user',
          content: question
        }
      ]
    })
  });

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "مش لاقي رد.";
}