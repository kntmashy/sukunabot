// plugins/quiz-stadium.js - خمن الملعب
// npm i axios

import axios from "axios";

const SIGN = " ⛩️ *SUKUNA ⚡️ BOT* ⛩️";
const SESSION_TTL_MS = 120_000;

function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }
function pick(arr,n=1){ const s = shuffle(arr.slice()); return n===1 ? s[0] : s.slice(0,n) }

// ✅ قائمة الملاعب مع صورها
const STADIUMS_LIST = [
  { img: "https://files.catbox.moe/ocs8ut.jpg", name: "يوهان كرويف ارينا" },
  { img: "https://files.catbox.moe/7ost7p.jpg", name: "استاد القاهرة الدولي" },
  { img: "https://files.catbox.moe/rb5bqv.jpg", name: "اليانز ارينا" },
  { img: "https://files.catbox.moe/wsd5wo.jpg", name: "كامب نو" },
  { img: "https://files.catbox.moe/vxcypw.jpg", name: "الانفيلد" },
  { img: "https://files.catbox.moe/chafm6.jpg", name: "اولد ترافورد" },
  { img: "https://files.catbox.moe/582ot8.jpg", name: "سنتياغو برنابيو" },
  { img: "https://files.catbox.moe/dyynpu.jpg", name: "ملعب ويمبلي" },
  { img: "https://files.catbox.moe/pq5k29.jpg", name: "ملعب الماركانا" },
];

const attached = new WeakSet();
const sessions = new Map();

// ✅ معالج الأزرار
export function attachConverter(conn){
  if(!conn || attached.has(conn) || !conn.ev) return;
  attached.add(conn);

  conn.ev.on("messages.upsert", async up => {
    try {
      const msgs = up.messages || [];
      for(const m of msgs){
        if(!m || !m.message || m.key?.fromMe) continue;

        let selectedText = null;
        let selectedId = null;

        if (m.message?.buttonsResponseMessage) {
          selectedText = m.message.buttonsResponseMessage.selectedDisplayText;
          selectedId = m.message.buttonsResponseMessage.selectedButtonId;
        }
        if (!selectedText && m.message?.listResponseMessage) {
          selectedText = m.message.listResponseMessage?.singleSelectReply?.selectedDisplayText;
          selectedId = m.message.listResponseMessage?.singleSelectReply?.selectedRowId;
        }
        if (!selectedText && m.message?.templateButtonReplyMessage) {
          selectedText = m.message.templateButtonReplyMessage.selectedDisplayText;
          selectedId = m.message.templateButtonReplyMessage.selectedId;
        }
        if (!selectedText && m.message?.interactiveMessage) {
          const im = m.message.interactiveMessage;
          if (im.buttonsResponseMessage) {
            selectedText = im.buttonsResponseMessage.selectedDisplayText;
            selectedId = im.buttonsResponseMessage.selectedButtonId;
          } else if (im.listResponseMessage) {
            selectedText = im.listResponseMessage?.singleSelectReply?.selectedDisplayText;
            selectedId = im.listResponseMessage?.singleSelectReply?.selectedRowId;
          }
        }

        const final = (selectedId || selectedText || '').toString().trim();
        if (!final) continue;
        if (!final.startsWith("stadium_answer::")) continue;

        const payload = final.slice("stadium_answer::".length).trim();
        const jid = m.key.remoteJid;
        if (!jid) continue;

        const session = sessions.get(jid);
        if (!session || session.answered) continue;

        session.answered = true;
        clearTimeout(session.timeout);

        const chosen = String(payload);
        const correct = session.answer;

        if(chosen === correct){
          // ✅ منح XP
          try {
            const senderJid = m.key.participant || m.key.remoteJid;
            if (senderJid) {
              if (!global.db) global.db = { data: { users: {} } };
              if (!global.db.data) global.db.data = { users: {} };
              if (!global.db.data.users) global.db.data.users = {};
              if (!global.db.data.users[senderJid]) global.db.data.users[senderJid] = {};

              const user = global.db.data.users[senderJid];
              user.exp = (user.exp || 0) + 5000;

              if (typeof global.saveDatabase === 'function') await global.saveDatabase();
            }
          } catch (e) {
            console.warn('stadium quiz xp error:', e?.message);
          }

          let feedback = `✅ إجابة صحيحة!\nالملعب: *${correct}*\n\n🎉 حصلت على *5000 XP*!`;

          try {
            const senderJid = m.key.participant || m.key.remoteJid;
            if (senderJid && global.db?.data?.users?.[senderJid]) {
              const newTotal = global.db.data.users[senderJid].exp || 0;
              feedback += `\nمجموع XP: *${newTotal}*`;
            }
          } catch (_) {}

          feedback += `\n\n${SIGN}`;
          await conn.sendMessage(jid, { text: feedback }, { quoted: m }).catch(()=>{});
        } else {
          await conn.sendMessage(jid, {
            text: `❌ إجابة خاطئة.\nإجابتك: *${chosen}*\nالإجابة الصحيحة: *${correct}*\n\n${SIGN}`
          }, { quoted: m }).catch(()=>{});
        }
        sessions.delete(jid);
      }
    } catch(e) {
      console.error("stadium converter error:", e?.message);
    }
  });

  console.log("✅ stadium quiz converter attached");
}

function buildQuickButtons(options){
  return options.slice(0, 4).map(opt => ({
    buttonId: `stadium_answer::${opt}`,
    buttonText: { displayText: opt },
    type: 1
  }));
}

async function handler(m, { conn }){
  try{
    if(!conn) return;
    attachConverter(conn);

    const list = STADIUMS_LIST;
    if(!list || list.length < 4){
      return conn.sendMessage(m.chat, { text: "❌ قائمة الملاعب غير كافية." }, { quoted: m }).catch(()=>{});
    }

    // ✅ اختيار الملعب الصحيح
    const correct = pick(list);
    const correctName = correct.name;
    const imageUrl = correct.img;

    // ✅ اختيار 3 أسماء غلط مختلفة
    const poolNames = list.map(x => x.name).filter(n => n !== correctName);
    const uniqueWrongs = [...new Set(poolNames)];
    const wrongs = shuffle(uniqueWrongs).slice(0, 3);
    const options = shuffle([correctName, ...wrongs]);

    if (!options.includes(correctName)) {
      options[0] = correctName;
    }

    const caption = `🏟️ *STADIUM QUIZ* 🏟️\n\n⚽ خمن اسم هذا الملعب!\n⏳ لديك 120 ثانية للإجابة\n\n${SIGN}`;

    // ✅ إرسال الصورة مع الأزرار
    try {
      const buttons = buildQuickButtons(options);
      await conn.sendMessage(m.chat, {
        image: { url: imageUrl },
        caption,
        buttons,
        headerType: 4
      }, { quoted: m });
    } catch (e) {
      // fallback نصي عند فشل الأزرار
      const txt = [caption, "", ...options.map((o, i) => `${i + 1}. ${o}`)].join("\n");
      await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
    }

    // ✅ حفظ الجلسة مع timeout
    const timeout = setTimeout(async () => {
      const s = sessions.get(m.chat);
      if(!s) return;
      if(!s.answered){
        try {
          await conn.sendMessage(m.chat, {
            text: `⌛ انتهى الوقت!\nالإجابة الصحيحة: *${correctName}*\n\n${SIGN}`
          }, { quoted: m });
        } catch(_) {}
      }
      sessions.delete(m.chat);
    }, SESSION_TTL_MS);

    sessions.set(m.chat, {
      answer: correctName,
      timeout,
      answered: false,
      createdAt: Date.now()
    });

  }catch(err){
    console.error("stadium quiz error:", err?.message);
  }
}

handler.command = /^ملعب$/i;
handler.help = ["ملعب"];
handler.tags = ["quiz", "fun", "football"];

export default handler;