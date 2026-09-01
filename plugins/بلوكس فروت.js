// roblox-power-guess-full.js
import fetch from 'node-fetch';

const gameDuration = 60000;
const poin = 2000;
const game = '.روبلوكس';
const botname = `Roblox`;

const robloxQuestions = [
  { name: "سبايدر", img: "https://files.catbox.moe/qn76xq.jpg" },
  { name: "زلزال", img: "https://files.catbox.moe/l9ljoj.jpg" },
  { name: "ساوند", img: "https://files.catbox.moe/dovz80.jpg" },
  { name: "ربر", img: "https://files.catbox.moe/e7dmcj.jpg" },
  { name: "روكيت", img: "https://files.catbox.moe/wmttr9.jpg" },
  { name: "جوست", img: "https://files.catbox.moe/fi8zk0.jpg" },
  { name: "بورتال", img: "https://files.catbox.moe/xcguq8.jpg" },
  { name: "غاز", img: "https://files.catbox.moe/a07dg3.jpg" },
  { name: "كيتسوني", img: "https://files.catbox.moe/p2xzc5.jpg" },
  { name: "دراجون", img: "https://files.catbox.moe/4o604s.jpg" },
  { name: "بومب", img: "https://files.catbox.moe/sqbqu5.jpg" },
  { name: "سموك", img: "https://files.catbox.moe/wi37po.jpg" },
  { name: "يتي", img: "https://files.catbox.moe/9zalee.jpg" },
  { name: "دايموند", img: "https://files.catbox.moe/0e36mi.jpg" },
  { name: "لايت", img: "https://files.catbox.moe/juwiw4.jpg" },
  { name: "بودا", img: "https://files.catbox.moe/neburw.jpg" },
  { name: "ساند", img: "https://files.catbox.moe/1t4sku.jpg" },
  { name: "ماجما", img: "https://files.catbox.moe/gvau80.jpg" },
  { name: "فونيكس", img: "https://files.catbox.moe/k31bio.jpg" },
  { name: "جرافتي", img: "https://files.catbox.moe/k2afi7.jpg" },
  { name: "ماموث", img: "https://files.catbox.moe/nkh9lf.jpg" },
  { name: "ايجيل", img: "https://files.catbox.moe/egfj1u.jpg" },
  { name: "موتشي", img: "https://files.catbox.moe/1zmoiw.jpg" },
  { name: "سيبريت", img: "https://files.catbox.moe/f4bcp4.jpg" },
  { name: "ايس", img: "https://files.catbox.moe/rv7q9r.jpg" },
  { name: "سبن", img: "https://files.catbox.moe/do4q0e.jpg" },
  { name: "كونترول", img: "https://files.catbox.moe/d2h0ik.jpg" },
  { name: "بليزرد", img: "https://files.catbox.moe/bp9c0x.jpg" },
  { name: "سبرينج", img: "https://files.catbox.moe/hmsrxx.jpg" },
  { name: "شوب", img: "https://files.catbox.moe/grazes.jpg" },
  { name: "تايجر", img: "https://files.catbox.moe/64mvwy.jpg" },
  { name: "شادو", img: "https://files.catbox.moe/z3fjzg.jpg" },
  { name: "سبايك", img: "https://files.catbox.moe/m1yiv8.jpg" },
  { name: "برق", img: "https://files.catbox.moe/xtcw5o.jpg" },
  { name: "فليم", img: "https://files.catbox.moe/k2n7f5.jpg" },
  { name: "دارك", img: "https://files.catbox.moe/dcpwte.jpg" },
  { name: "لوف", img: "https://files.catbox.moe/5ybt5j.jpg" },
  { name: "تيركس", img: "https://files.catbox.moe/nwmhsd.jpg" },
  { name: "تيركس", img: "https://files.catbox.moe/dbv99s.jpg" }, // نفس الاسم مرتين (رابط ثاني)
  { name: "كريتون", img: "https://files.catbox.moe/b0fvis.jpg" },
  { name: "باين", img: "https://files.catbox.moe/fholnb.jpg" }
];

export async function handler(m, { command, text, conn }) {
  let id = m.chat;
  conn.robloxGame = conn.robloxGame || {};
  let currentGame = conn.robloxGame[id];
  let poster = "https://qu.ax/qlqve.jpg";

  if (currentGame) {
    // يوجد لعبة جارية — تحقق من الإدخال
    if (!text) {
      return conn.reply(id, '> *◞❕◜ هـنـاك لـعـبـة قـيـد الـتـشـغـيـل.*', m);
    } else if (text === currentGame[1].name) {
      m.react('✅');
      try { global.db.data.users[m.sender].exp += poin } catch (e) {}
      conn.sendButton(id, `> *◞🎊◜ أحسنت! ربحت ${poin} نقطة.*`, `> ${botname}`, poster, [[`↬⌯الـمــ↪️ـزيـد‹◝`, game]], null, null);
      clearTimeout(currentGame[3]);
      delete conn.robloxGame[id];
    } else if (text === 'انسحب') {
      clearTimeout(currentGame[3]);
      conn.sendButton(id, `> *◞😅◜ انسحبت! كانت الإجابة الصحيحة: ${currentGame[1].name}*`, `> ${botname}`, poster, [[`↬⌯الـمــ↪️ـزيـد‹◝`, game]], null, null);
      delete conn.robloxGame[id];
    } else {
      m.react('❌');
      clearTimeout(currentGame[3]);
      conn.sendButton(id, `> *◞❌◜ خطأ! الإجابة كانت: ${currentGame[1].name}*`, `> ${botname}`, poster, [[`↬⌯الـمــ↪️ـزيـد‹◝`, game]], null, null);
      delete conn.robloxGame[id];
    }
  } else {
    // لا توجد لعبة حالية — ابدأ لعبة جديدة إذا لم يُرسل نص
    if (!text) {
      let question = robloxQuestions[Math.floor(Math.random() * robloxQuestions.length)];
      let options = [question.name];

      while (options.length < 4) {
        let opt = robloxQuestions[Math.floor(Math.random() * robloxQuestions.length)].name;
        if (!options.includes(opt)) options.push(opt);
      }

      options = options.sort(() => Math.random() - 0.5);

      conn.robloxGame[id] = [m, question, 10, setTimeout(() => {
        delete conn.robloxGame[id];
        conn.sendButton(id, `> *◞⏰◜ انتهى الوقت! الإجابة كانت: ${question.name}*`, `> ${botname}`, poster, [[`↬⌯الـمــ↪️ـزيـد‹◝`, game]], null, null);
      }, gameDuration)];

      let message = `
> ‹◝ احـزر قـدرة روبـلـوكـس↬

*┐┈─๋︩︪──๋︩︪─═⊐‹⚡›⊏═─๋︩︪──๋︩︪─┈┌*
> *↬⌯وقـت الاجـابـة: ${(gameDuration / 1000).toFixed(2)} ثـواني*
> *↬⌯الـجـائـزة: ${poin} نـقـاط*
> *انسـحـب؟ اضـغـط ◞انـسـحـاب◜*
*┘┈─๋︩︪──๋︩︪─═⊐‹⚡›⊏═─๋︩︪──๋︩︪─┈└*
`;

      await conn.sendButton(id, message, `> ${botname}`, question.img, [
        [`✦┇${options[0]}┇✦`, `${game} ${options[0]}`],
        [`✦┇${options[1]}┇✦`, `${game} ${options[1]}`],
        [`✦┇${options[2]}┇✦`, `${game} ${options[2]}`],
        [`✦┇${options[3]}┇✦`, `${game} ${options[3]}`],
        [`◞انـسـحـاب🏃‍♂️◜`, `${game} انسحب`]
      ], null, null);
    } else {
      m.react('👇🏻');
      conn.sendButton(id, `> *اللعبة غير فعالة حالياً.*`, `> ${botname}`, poster, [[`↬⌯الـمــ↪️ـزيـد‹◝`, game]], null, null);
    }
  }
}

handler.help = ['روبلوكس'];
handler.tags = ['العاب'];
handler.command = ['روبلوكس'];

export default handler;