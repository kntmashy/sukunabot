import fetch from "node-fetch";

let handler = async (m, { conn, args, usedPrefix, text, command }) => {
  if (!text)
    return m.reply(
      "- 「🚀」 *أدخل نصًا بعد الامر لاستخدام الرد بالذكاء الاصطناعي* *مثال* :\n ⟣ *.كلاودي* افضل انمي حتی الان ⟣ \n*.كلاودي* اكتب رمز JS",
    );
  await m.reply("⏳ جاري التفكير...");
  try {
    let result = await CleanDx(text);
    let translatedResult = await translateToArabic(result);
    await m.reply(translatedResult);
  } catch (e) {
    console.log(e);
    await m.reply("وقعت مشكلة :(\n" + e.message);
  }
};
handler.help = ["كلاودي"];
handler.tags = ["ai"];
handler.command = /^(كلاودي)$/i;
export default handler;

async function CleanDx(your_qus) {
  let Baseurl = "https://api.siputzx.my.id/api/ai/gpt3?prompt=";

  let response = await fetch(Baseurl + encodeURIComponent(your_qus));
  const data = await response.json();

  if (!data.data) throw new Error("رد غير متوقع: " + JSON.stringify(data));

  return data.data;
}

async function translateToArabic(text) {
  const response = await fetch(
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=" +
      encodeURIComponent(text),
  );
  const result = await response.json();
  return result[0][0][0];
}