// plugins/antibadword.js - مضاد شتايم
// يحذف الرسالة + يحذر 3 مرات ثم يطرد الشخص

// ✅ قائمة الأرقام المستثناة (لن تطرد أو تنذار)
const EXCEPTED_NUMBERS = [
  '201016855501', // ✅ الرقم الوحيد المستثنى
  // ضيف أي رقم تاني هنا
];

// ✅ قائمة الشتايم العامة (للتحذيرات)
const BAD_WORDS = [
  "ابن الكلب", "ابن كلب", "منيك",
  "شرموط", "شرموطة", "زاني", "ابن الزنا",
  "ابن الكلبة", "ابن القحبة", "ابو كلب",
  "قحبة", "منيوكة",
  "ابن الوسخة", "ابن الوسخ", "ابن اللذينة",
  "ابن الحرام", "بنت الحرام",
  "بنت الكلب",
  "شرموطة ابن شرموطة",
  "كس",
  "متناك", "عرص", "خول", "زبي", "زبك",
  // ✅ شتايم عادية جديدة
  "يعرص", "يخول", "يمتناك", "يشرموط", "يالي بتتناك",
  // ✅ شتايم عادية جديدة (مضافة)
  "يخو", "يا شرمو", "يا معر", "يا عر", "يا متن", "يا منيو", "يا كح",
  "يمعر", "يعر", "يشرمو", "يمتنا", "يمتن", "يمنيو",
];

// ✅ شتايم بالأم - طرد فوري
const INSTANT_KICK_PATTERNS = [
  "كس ام", "كس أم", "نيك ام", "نيك أم",
  "طيز ام", "طيز أم",
  "شرموطة ام", "شرموطة أم",
  "قحبة ام", "قحبة أم",
  "متناكة ام", "متناكة أم",
  "عاهرة ام", "عاهرة أم",
  "بتتناك ام", "بتتناك أم",
  "سكس ام", "سكس أم",
  "كسام", "كسم", "نيكام", "نيكم",
  "طيزام", "طيزم",
  "امك شرموطة", "أمك شرموطة",
  "امك قحبة", "أمك قحبة",
  "امك متناكة", "أمك متناكة",
  "امك بتتناك", "أمك بتتناك",
  "امك عاهرة", "أمك عاهرة",
  "امك سكس", "أمك سكس",
  "امك وسخة", "أمك وسخة",
  "امك حرامية", "أمك حرامية",
  "كسمك", // ✅ منقول من الشتايم العادية للشتايم بالام
  "كس اخت", "كس أخت",
  "نيك اخت", "نيك أخت",
  "طيز اخت", "طيز أخت",
  "ام اخت", "ام أخت",
  "ام اختك", "أم أختك",
  "بنت المتناكة", "بنت القحبة", "بنت الشرموطة",
  "بنت الكلبة", "بنت الحرام",
  "ابن المتناكة", "ابن القحبة", "ابن الشرموطة",
  "ابن الكلبة", "ابن الحرام",
  "ابن المرة المتناكة",
  "ابن الزانية",
  // ✅ شتايم الام جديدة
  "يبن الاحبه", "يبن المتناكه", "يبن الشرموطه",
  "كسمين امك", "كسمينك امك", "علي زبي",
];

// ✅ تخزين حالة النظام لكل جروب
const groupStatus = new Map();

// ✅ دالة للتحقق من أن الرقم مستثنى
function isExcepted(number) {
  if (!number) return false;
  const cleanNumber = number.replace(/[^0-9]/g, '');
  return EXCEPTED_NUMBERS.some(ex => cleanNumber.includes(ex) || ex.includes(cleanNumber));
}

function normalizeArabic(text) {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildWholeWordRegex(phrase) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "iu");
}

function containsInstantKick(text) {
  if (!text) return null;
  const normalized = normalizeArabic(text);

  for (const pattern of INSTANT_KICK_PATTERNS) {
    const re = buildWholeWordRegex(normalizeArabic(pattern));
    if (re.test(normalized)) return pattern;
  }

  return null;
}

function containsBadWord(text) {
  if (!text) return null;
  const normalized = normalizeArabic(text);

  for (const word of BAD_WORDS) {
    const re = buildWholeWordRegex(normalizeArabic(word));
    if (re.test(normalized)) return word;
  }

  return null;
}

const warnings = new Map();
const attached = new WeakSet();

// ====== HANDLER الرئيسي ======
let handler = async (m, { conn, command }) => {
  const jid = m.chat;

  if (command === 'تفعيل_شتايم' || command === 'انتيشتايم' || command === 'مضاد_شتايم') {
    if (!jid.endsWith("@g.us")) return m.reply("❌ هذا الأمر يعمل فقط في الجروبات!");

    groupStatus.set(jid, true);

    if (!attached.has(conn)) {
      attached.add(conn);

      conn.ev.on("messages.upsert", async up => {
        try {
          const msgs = up.messages || [];
          for (const m of msgs) {
            if (!m || !m.message || m.key?.fromMe) continue;

            const jid2 = m.key.remoteJid;
            if (!jid2 || !jid2.endsWith("@g.us")) continue;

            if (!groupStatus.get(jid2)) continue;

            const sender = m.key.participant || m.key.remoteJid;
            if (!sender) continue;

            if (isExcepted(sender)) {
              const text =
                m.message?.conversation ||
                m.message?.extendedTextMessage?.text ||
                m.message?.imageMessage?.caption ||
                m.message?.videoMessage?.caption ||
                "";

              if (text) {
                const bad = containsBadWord(text);
                const instant = containsInstantKick(text);
                if (bad || instant) {
                  await conn.sendMessage(jid2, {
                    text: `👑 *مطور البوت يتدلع ويشتم براحته!* 👑
                    
@${sender.split("@")[0]} : "${text}"

😎 *عادي هو المطور، له الكل* 😎

⛩️ *SUKUNA BOT*`,
                    mentions: [sender]
                  });
                }
              }
              continue;
            }

            const text =
              m.message?.conversation ||
              m.message?.extendedTextMessage?.text ||
              m.message?.imageMessage?.caption ||
              m.message?.videoMessage?.caption ||
              "";

            if (!text) continue;

            const instantWord = containsInstantKick(text);
            if (instantWord) {
              try {
                await conn.sendMessage(jid2, { delete: m.key });
              } catch (_) {}

              try {
                await conn.sendMessage(jid2, {
                  text: `⧈═━━━━✦⛩️✦━━━━═⧈
❪⚡️❫⇇ *🚫 تم اكتشاف شتيمة بالام!* ⇇❪⛩️❫
❪☠️❫⇇ *@${sender.split("@")[0]}* تم طردك فوراً!
❪👾❫⇇ *السبب:* ❪${instantWord}❫
❪💀❫⇇ *هذا النوع من الكلمات ممنوع تماماً!*
⧈═━━━━✦⛩️✦━━━━═⧈
⛩️ *SUKUNA BOT*`,
                  mentions: [sender]
                });
                await conn.groupParticipantsUpdate(jid2, [sender], "remove");
              } catch (_) {}

              const key = `${jid2}-${sender}`;
              warnings.delete(key);
              continue;
            }

            const bad = containsBadWord(text);
            if (!bad) continue;

            try {
              await conn.sendMessage(jid2, { delete: m.key });
            } catch (_) {}

            const key = `${jid2}-${sender}`;
            const count = (warnings.get(key) || 0) + 1;
            warnings.set(key, count);

            if (count >= 3) {
              try {
                await conn.sendMessage(jid2, {
                  text: `⧈═━━━━✦⛩️✦━━━━═⧈
❪⚡️❫⇇ *⚠️ تم تجاوز الحد الأقصى للتحذيرات!* ⇇❪⛩️❫
❪☠️❫⇇ *@${sender.split("@")[0]}* لقد تجاوزت *3* تحذيرات.
❪👾❫⇇ *سيتم طردك الآن! 👽*
⧈═━━━━✦⛩️✦━━━━═⧈
⛩️ *SUKUNA BOT*`,
                  mentions: [sender]
                });
                await conn.groupParticipantsUpdate(jid2, [sender], "remove");
              } catch (_) {}
              warnings.delete(key);
            } else {
              try {
                await conn.sendMessage(jid2, {
                  text: `⧈═━━━━✦⛩️✦━━━━═⧈
❪⚡️❫⇇ *@${sender.split("@")[0]}* لقد قمت بكتابة كلمة غير لائقة! ⇇❪⛩️❫
❪☠️❫⇇ *الكلمة:* ❪${bad}❫
❪👾❫⇇ *عدد التحذيرات:* ❪${count}/3❫
⧈═━━━━✦⛩️✦━━━━═⧈
⛩️ *SUKUNA BOT*`,
                  mentions: [sender]
                });
              } catch (_) {}
            }
          }
        } catch (e) {
          console.error("antibadword error:", e?.message);
        }
      });
    }

    await conn.sendMessage(jid, {
      text: `✅ *تم تفعيل نظام مضاد الشتايم في هذا الجروب!*

📋 *القوانين:*
• شتيمة عادية → تحذير (3 تحذيرات = طرد)
• شتيمة بالأم → طرد فوري 🚫
• مطور البوت → يتدلع ويشتم براحته 👑

⛩️ *SUKUNA BOT*`
    }, { quoted: m });
    return;
  }

  if (command === 'ايقاف-شتايم' || command === 'تعطيل-شتايم' || command === 'وقف-شتايم') {
    if (!jid.endsWith("@g.us")) return m.reply("❌ هذا الأمر يعمل فقط في الجروبات!");

    groupStatus.set(jid, false);

    for (const key of warnings.keys()) {
      if (key.startsWith(jid)) {
        warnings.delete(key);
      }
    }

    await conn.sendMessage(jid, {
      text: `⛔ *تم إيقاف نظام مضاد الشتايم في هذا الجروب!*

📋 *لتفعيله مرة أخرى اكتب:* .تفعيل_شتايم

⛩️ *SUKUNA BOT*`
    }, { quoted: m });
    return;
  }
};

handler.command = /^(تفعيل_شتايم|انتيشتايم|مضاد_شتايم|ايقاف-شتايم|تعطيل-شتايم|وقف-شتايم)$/i;
handler.group = true;
handler.admin = true;

export default handler;