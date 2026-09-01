// plugins/quiz-ultimate.js - مع صورة وأزرار (3 خطأ + 1 صحيح)
// npm i axios

import axios from "axios";

const SIGN = "⛩️ *SUKUNA ⚡️ BOT* ⛩️";
const SESSION_TTL_MS = 120_000;
const GIST_URL = "https://gist.githubusercontent.com/Kyutaka101/98d564d49cbf9b539fee19f744de7b26/raw/f2a3e68bbcdd2b06f9dbd5f30d70b9fda42fec14/guessflag";

function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a }
function pick(arr,n=1){ const s = shuffle(arr.slice()); return n===1 ? s[0] : s.slice(0,n) }

const FALLBACK_LIST = [
  {"img":"https://telegra.ph/file/1ad5efd1f25887764b15f.jpg","name":"روبين"},
  {"img":"https://telegra.ph/file/9d201b2142932048d44d1.jpg","name":"نير"},
  {"img":"https://telegra.ph/file/be4c3fad4268971685d81.jpg","name":"اني"},
  {"img":"https://telegra.ph/file/a60e54286732defb6347d.jpg","name":"ميدوريا"},
  {"img":"https://telegra.ph/file/a8be24815455a6033c0ff.jpg","name":"ساكورا"},
  {"img":"https://telegra.ph/file/986ac215c159b886921d9.jpg","name":"سوكونا"},
  {"img":"https://telegra.ph/file/7879f8170935d592d3836.jpg","name":"سوكونا"},
  {"img":"https://telegra.ph/file/67fa6b4cff5b65068f2f9.jpg","name":"ايس"},
  {"img":"https://telegra.ph/file/ff37828726e424fc5753e.jpg","name":"ساسكي"},
  {"img":"https://telegra.ph/file/4fdcd9b65bf25f918775f.jpg","name":"غارا"},
  {"img":"https://telegra.ph/file/309901e0b8e96c594281b.jpg","name":"نيزوكو"},
  {"img":"https://telegra.ph/file/831a834a4446d3f5fe683.jpg","name":"ناروتو"},
  {"img":"https://telegra.ph/file/a56c29f4cfc4fa251bbb0.jpg","name":"لوفي"},
  {"img":"https://telegra.ph/file/41190693f191ab092d361.jpg","name":"كايدو"},
  {"img":"https://telegra.ph/file/4a033549870058c71c35d.jpg","name":"لولوش"}
];

const ABILITIES = {
  "سوكونا": ["تقنية اللاحدود (Limitless)", "المجال اللانهائي (Infinity)"],
  "سوكونا": ["لعنات متعددة", "تحكم بالأصابع الملعونة"],
  "ناروتو": ["راسينغان", "تحمل شاكرا الهوكاجي"],
  "لوفي": ["جيل-جيلا فاكهة الشيطان", "المطاط"],
  "ساسكي": ["شانينغان", "تشيدوري"],
  "غون": ["هجوم الرصاصة", "حياة صياد"],
  "ايتاتشي": ["أماتيراسو", "تكسير الشارينغان"],
  "نوزوكو": ["تعافي سريع", "تحول شيطاني"],
};

const attached = new WeakSet();
const sessions = new Map();

const GROWTH = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75;
function findLevelLocal(xp, multiplier = 1) {
  if (xp === Infinity) return Infinity;
  if (isNaN(xp) || xp <= 0) return -1;
  let level = 0;
  const xpRange = (l) => {
    l = Math.floor(l);
    const min = l === 0 ? 0 : Math.round(Math.pow(l, GROWTH) * multiplier) + 1;
    const max = Math.round(Math.pow(l + 1, GROWTH) * multiplier);
    return { min, max };
  };
  do { level++; } while (xpRange(level).min <= xp);
  return --level;
}

export function attachConverter(conn){
  if(!conn || attached.has(conn) || !conn.ev) return;
  attached.add(conn);
  
  conn.ev.on("messages.upsert", async up => {
    try {
      const msgs = up.messages || [];
      for(const m of msgs){
        if(!m || !m.message || m.key?.fromMe) continue;
        
        let text = m.message.conversation || m.message.extendedTextMessage?.text || null;
        
        // معالجة الأزرار
        const br = m.message.buttonsResponseMessage;
        if(br?.selectedButtonId) {
          text = br.selectedButtonId;
        }
        
        // معالجة القوائم
        const lr = m.message.listResponseMessage;
        if(lr?.singleSelectReply?.selectedRowId) {
          text = lr.singleSelectReply.selectedRowId;
        }
        
        if(!text || !text.startsWith("quiz_answer::")) continue;
        
        const payload = text.slice("quiz_answer::".length).trim();
        const jid = m.key.remoteJid;
        if(!jid) continue;
        
        const session = sessions.get(jid);
        if(!session || session.answered) continue;
        
        session.answered = true;
        clearTimeout(session.timeout);

        const chosen = String(payload);
        const correct = session.answer;

        if(chosen === correct){
          await conn.sendMessage(jid, { 
            text: `✅ *إجابة صحيحة!*\n\n⛩️ الشخصية: *${correct}*\n${SIGN}` 
          }, { quoted: m }).catch(()=>{});

          // منح XP
          try {
            const userJid = m.key.participant || jid;
            if (userJid && global.db?.data?.users) {
              if (!global.db.data.users[userJid]) global.db.data.users[userJid] = {};
              const user = global.db.data.users[userJid];
              user.exp = (user.exp || 0) + 5000;
              const newLevel = (typeof global.findLevel === 'function') ? global.findLevel(user.exp) : findLevelLocal(user.exp);

              if (typeof global.saveDatabase === 'function') await global.saveDatabase();
              await conn.sendMessage(jid, { 
                text: `✨ *+5000 XP*\n💾 الإجمالي: ${user.exp}\n🏅 المستوى: ${newLevel}` 
              }, { quoted: m }).catch(()=>{});
            }
          } catch (e) {}

        } else {
          await conn.sendMessage(jid, { 
            text: `❌ *إجابة خاطئة!*\n\n💭 إجابتك: ${chosen}\n✅ الصحيحة: ${correct}\n\n${SIGN}` 
          }, { quoted: m }).catch(()=>{});
        }
        sessions.delete(jid);
      }
    } catch(e) {}
  });

  console.log("✅ quiz converter loaded");
}

async function loadChoices(){
  try{
    const r = await axios.get(GIST_URL, { timeout: 8000 });
    const data = Array.isArray(r.data) ? r.data : JSON.parse(r.data);
    if(Array.isArray(data) && data.length >= 6) return data;
  }catch(e){}
  return FALLBACK_LIST.slice();
}

async function handler(m, { conn }){
  try{
    if(!conn) return;
    attachConverter(conn);

    const choicesList = await loadChoices();
    if(!choicesList?.length){
      return conn.sendMessage(m.chat, { text: "❌ خطأ في تحميل البيانات" }, { quoted: m }).catch(()=>{});
    }

    // اختيار نوع السؤال
    const types = ["image"];
    const qtype = pick(types);

    if(qtype === "image"){
      // اختيار شخصية صحيحة
      const correctItem = pick(choicesList);
      const correctName = correctItem.name;
      const imageUrl = correctItem.img;

      // اختيار 3 أسماء خاطئة مختلفة تماماً
      const wrongNames = choicesList
        .filter(item => item.name !== correctName)
        .map(item => item.name);
      
      const uniqueWrongs = [...new Set(wrongNames)];
      const selectedWrongs = shuffle(uniqueWrongs).slice(0, 3);

      // مزج الخيارات
      const allOptions = shuffle([correctName, ...selectedWrongs]);

      // تأكد من وجود الإجابة الصحيحة
      if (!allOptions.includes(correctName)) {
        allOptions[0] = correctName;
      }

      const caption = `⛩️ *SUKUNA  QUIZ* ⛩️

🎯 *من هذه الشخصية؟*

⏳ المتبقي: 120 ثانية

${SIGN}`;

      // بناء الأزرار (4 خيارات فقط)
      const buttons = allOptions.map(opt => ({
        buttonId: `quiz_answer::${opt}`,
        buttonText: { displayText: opt },
        type: 1
      }));

      // إرسال الصورة مع الأزرار
      try {
        await conn.sendMessage(m.chat, {
          image: { url: imageUrl },
          caption: caption,
          footer: SIGN,
          buttons: buttons,
          headerType: 4
        }, { quoted: m });
      } catch (e) {
        // fallback: نص فقط
        const txt = [caption, "الخيارات:", ...allOptions.map((o, i) => `${i + 1}. ${o}`)].join("\n");
        await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
      }

      // حفظ الجلسة
      const timeout = setTimeout(async () => {
        const s = sessions.get(m.chat);
        if(!s) return;
        if(!s.answered){
          try { 
            await conn.sendMessage(m.chat, { 
              text: `⌛ *انتهى الوقت!*\n\n✅ الإجابة الصحيحة: *${correctName}*\n\n${SIGN}` 
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
conn.quizSession = conn.quizSession || {}
conn.quizSession[m.chat] = { answer: correctName }
      return;
    }

  }catch(err){
    console.error("quiz error:", err?.message);
  }
}

handler.command = /^احزر$/i;
handler.help = ["احزر"];
handler.tags = ["quiz","fun"];

export default handler;