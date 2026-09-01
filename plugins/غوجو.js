import fetch from "node-fetch";

let handler = async (m, { conn, text }) => {
  if (!text)
    return m.reply(
      "💫 *سوكونا:* همم... نسيت تسألني عن إيه بالظبط؟ جرب تكتب:\n\nمثال:\n⟣ .سوكونا رأيك في سوكونا؟ ⟣"
    );

  await m.reply("💠 *سوكونا:* لحظة بس... بفكر أرد ولا أسيبك في الغموض 😏");

  try {
    let result = await CleanGojo(text);
    await m.reply(
      `*╭─━━━───✦━━━───╮*\n💠 *سوكونا ساتورو قال:*\n『 ${result} 』\n*╰─━━━───✦━━━───╯*`
    );
  } catch (e) {
    await m.reply("💠 *سوكونا:* حتى أنا أحيانًا بزهق من الذكاء الزايد 🤷‍♂️");
  }
};

handler.help = ["gojo"];
handler.tags = ["ai"];
handler.command = /^(سوكونا)$/i;

export default handler;

async function CleanGojo(your_qus) {
  let Baseurl = "https://alakreb.vercel.app/api/ai/gpt?q=";

  // أسلوب سوكونا ساتورو الحقيقي: الثقة، الذكاء، والسخرية الأنيقة
  let prompt = `
أنت "ساتورو سوكونا" من أنمي جوجوتسو كايسن.
ردّ على سؤالي وكأنك سوكونا بنفسك:
- استخدم أسلوبًا واثقًا جدًا، ساخرًا بلُطف، ذكي، ومرح.
- أظهر أنك الأقوى فعلًا، لكن بدون غرور سخيف — فقط الهيبة الخالصة.
- أضف بعض المزاح الخفيف واللمسات الكاريزمية التي تشبه سوكونا.
السؤال هو: ${your_qus}
`;

  let response = await fetch(Baseurl + encodeURIComponent(prompt));
  let data = await response.json();
  return data.message;
}