import fetch from "node-fetch";

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("- 「⚔️」 هل تظن أنني أقرأ العقول؟ اكتب شيئًا بعد الأمر.\nمثال:\n⟣ .يوتا ما رأيك في سوكونا؟ ⟣");

  await m.reply("... يوتا يفكر في إجابتك، انتظر لحظة.");

  try {
    let result = await CleanYuta(text);
    await m.reply(`*╮━━━══━━❪⚡❫━━══━━━❍*\n『 ⚡ 』${result}\n*╯━━━══━━❪⚡❫━━══━━━❍*`);
  } catch (e) {
    await m.reply("『 ⚡ 』حتى يوتا أحيانًا يتردد في الرد...");
  }
};

handler.help = ["yuta"];
handler.tags = ["ai"];
handler.command = /^(يوتا)$/i;

export default handler;

async function CleanYuta(your_qus) {
  let Baseurl = "https://alakreb.vercel.app/api/ai/gpt?q=";

  // توجيه الـ API: الرد يكون بأسلوب يوتا
  let prompt = `أنت يوتا أوكوتسو من جوجوتسو كايسن. تحدث كما لو أنك يوتا: أسلوبك خجول، متردد أحيانًا، لكن قوي وحساس في نفس الوقت. أظهر طيبتك وقوة ريكّا في كلماتك. سؤالي هو: ${your_qus}`;

  let response = await fetch(Baseurl + encodeURIComponent(prompt));
  let data = await response.json();
  return data.message;
}