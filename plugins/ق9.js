import fs from 'fs';

let handler = async (m, { conn }) => {
  let taguser = '@' + m.sender.split("@")[0];

  // قراءة روابط الصور من ملف
  const linksFile = './media-links.txt';
  if (!fs.existsSync(linksFile)) return await m.reply('⚠️ ملف روابط الصور غير موجود.');

  const links = fs.readFileSync(linksFile, 'utf-8').split('\n').filter(Boolean);
  if (!links.length) return await m.reply('⚠️ ملف روابط الصور فارغ.');

  // اختيار صورة عشوائية
  const randomImageUrl = links[Math.floor(Math.random() * links.length)];

  let message = `
╮••─๋︩︪──๋︩︪─═⊐‹﷽›⊏═─๋︩︪──๋︩︪─┈☇
╿↵ مرحــبـا ⌊${taguser}⌉
── • ◈ • ──
*⌝⛩️┊قــســم الزخارف┊⛩️⌞* 
╮─ׅ─๋︩︪─┈─๋︩︪─═⊐‹⛩️›⊏═┈ ─๋︩︪─ ∙ ∙ ⊰ـ
┤─ׅ─ׅ┈ ─๋︩︪──ׅ─ׅ┈ ─๋︩︪─☇ـ
┤┌ ─๋︩︪─✦الزخارف☇─˚᳝᳝𖥻
│┊ ۬.͜ـ💠˖ ⟨زخرفه1☇ 
│┊ ۬.͜ـ💠˖ ⟨زخرفه2☇
│┊ ۬.͜ـ💠˖ ⟨زخرفه3☇
│┊ ۬.͜ـ💠˖ ⟨زخرفه4☇
│┊ ۬.͜ـ💠˖ ⟨زخرفه5☇
│┊ ۬.͜ـ💠˖ ⟨زخرفه6☇
│┊ ۬.͜ـ💠˖ ⟨زخرفه7☇
│┊ ۬.͜ـ💠˖ ⟨زخرفه8☇
│┊ ۬.͜ـ💠˖ ⟨زخرفه9☇
│┊ ۬.͜ـ💠˖ ⟨زخرفه10☇
│┊ ۬.͜ـ💠˖ ⟨زخرفه11☇
┤└─ׅ─ׅ┈ ─๋︩︪──ׅ─ׅ┈ ─๋︩︪☇ـ
╯─ׅ─๋︩︪─═⊐‹⛩️›⊏═┈ ─๋︩︪─⊰ـ  `;

  const emojiReaction = '🖌️';

  try {
    await conn.sendMessage(m.chat, { react: { text: emojiReaction, key: m.key } });

    await conn.sendMessage(m.chat, { 
      image: { url: randomImageUrl },
      caption: message,
      mentions: [m.sender]
    });
  } catch (error) {
    console.error("Error sending message:", error);
    await conn.sendMessage(m.chat, { text: 'حدث خطأ أثناء إرسال الصورة.' });
  }
};

handler.command = /^(ق9)$/i;
handler.exp = 50;
handler.fail = null;

export default handler;