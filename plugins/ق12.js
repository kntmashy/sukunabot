let handler = async (m, { conn }) => {
  let mentionId = m.sender;

  let caption = `╮••─๋︩︪──๋︩︪─═⊐‹﷽›⊏═─๋︩︪──๋︩︪─┈☇  
╿↵ *مرحبـًا يا @${mentionId.split('@')[0]}* 😎  
── • ◈ • ──  
⌝👑┊قــســم الـمـطـور┊⛩️⌞  
╮─ׅ─๋︩︪─┈─๋︩︪─═⊐‹✨›⊏═┈ ─๋︩︪─  
┤┌ ─๋︩︪─✦ *أوامـر المـطـور* ☇─˚᳝᳝𖥻  
│⛩️ ⟨احفظ⟩ ⛩️
│⛩️ ⟨امسح⟩ ⛩️
│⛩️ ⟨اخرج⟩ ⛩️
│⛩️ ⟨فحص⟩ ⛩️
│⛩️ ⟨زيب⟩ ⛩️
│⛩️ ⟨ريستارت⟩ ⛩️
│⛩️ ⟨حظر⟩ ⛩️
│⛩️ ⟨بعبص⟩ ⛩️
│⛩️ ⟨باتش⟩ ⛩️
│⛩️ ⟨انضم⟩ ⛩️
│⛩️ ⟨اضف-مطور⟩ ⛩️
│⛩️ ⟨كشف⟩ ⛩️
┤└────────────────☇  
╯⊰ـ *سوكونا يقول:* هنا يسكن المطور 😈⚡`.trim();

  await conn.sendMessage(m.chat, {
    text: caption,
    mentions: [mentionId]
  }, { quoted: m });
};

handler.help = ['ق12'];
handler.tags = ['main'];
handler.command = /^(ق12)$/i;

export default handler;