// plugins/anti-react.js - مضاد رياكت الشتايم
// لما حد يعمل رياكت غير محترم، يدي انذار للمرسل

// ✅ قائمة الأرقام المستثناة (لن ينذاروا)
const EXCEPTED_NUMBERS = [
  '201016855501', // ✅ الرقم الوحيد المستثنى
  // ضيف أي رقم تاني هنا
];

// ✅ الإيموجيات الممنوعة (الرياكتات اللي تدي انذار)
const BAD_REACTS = ['🖕', '🍌', '🍆', '🥒'];

// ✅ تخزين حالة النظام لكل جروب
const groupStatus = new Map();

// ✅ دالة للتحقق من أن الرقم مستثنى
function isExcepted(number) {
  if (!number) return false;
  const cleanNumber = number.replace(/[^0-9]/g, '');
  return EXCEPTED_NUMBERS.some(ex => cleanNumber.includes(ex) || ex.includes(cleanNumber));
}

const warnings = new Map();
const attached = new WeakSet();

// ====== HANDLER الرئيسي ======
let handler = async (m, { conn, command }) => {
  const jid = m.chat;

  // ✅ أمر التفعيل
  if (command === 'تفعيل_رياكت' || command === 'انتي_رياكت' || command === 'مضاد_رياكت') {
    if (!jid.endsWith("@g.us")) return m.reply("❌ هذا الأمر يعمل فقط في الجروبات!");

    groupStatus.set(jid, true);

    if (!attached.has(conn)) {
      attached.add(conn);

      conn.ev.on("messages.upsert", async (upsert) => {
        try {
          const msg = upsert.messages?.[0];
          if (!msg) return;

          const reaction = msg.message?.reactionMessage;
          if (!reaction) return;

          const jid2 = msg.key.remoteJid;
          if (!jid2 || !jid2.endsWith("@g.us")) return;
          if (!groupStatus.get(jid2)) return;

          const sender = msg.key.participant || msg.key.remoteJid;
          if (!sender) return;
          if (isExcepted(sender)) return;

          const emoji = reaction.text || reaction.emoji;
          if (!emoji) return;

          if (!BAD_REACTS.includes(emoji)) return;

          const warnKey = `${jid2}-${sender}`;
          const count = (warnings.get(warnKey) || 0) + 1;
          warnings.set(warnKey, count);

          await conn.sendMessage(jid2, {
            text: `⧈═━━━━✦⛩️✦━━━━═⧈
❪⚡️❫⇇ *🚫 تم اكتشاف رياكت غير محترم!* ⇇❪⛩️❫
❪☠️❫⇇ *@${sender.split("@")[0]}* قام بعمل رياكت ${emoji}!
❪👾❫⇇ *عدد التحذيرات:* ❪${count}/3❫
⧈═━━━━✦⛩️✦━━━━═⧈
⛩️ *SUKUNA BOT*`,
            mentions: [sender]
          });

          if (count >= 3) {
            warnings.delete(warnKey);
            await conn.sendMessage(jid2, {
              text: `⧈═━━━━✦⛩️✦━━━━═⧈
❪⚡️❫⇇ *⚠️ تم تجاوز الحد الأقصى للتحذيرات!* ⇇❪⛩️❫
❪☠️❫⇇ *@${sender.split("@")[0]}* لقد تجاوزت *3* تحذيرات بسبب الرياكتات غير المحترمة!
❪👾❫⇇ *سيتم طردك الآن! 👽*
⧈═━━━━✦⛩️✦━━━━═⧈
⛩️ *SUKUNA BOT*`,
              mentions: [sender]
            });
            await conn.groupParticipantsUpdate(jid2, [sender], "remove");
          }

        } catch (e) {
          console.error("anti-react error:", e?.message);
        }
      });
    }

    await conn.sendMessage(jid, {
      text: `✅ *تم تفعيل نظام مضاد الرياكتات في هذا الجروب!*

📋 *القوانين:*
• رياكت 🖕 → تحذير (3 تحذيرات = طرد)
• رياكت 🍌 → تحذير (3 تحذيرات = طرد)
• رياكت 🍆 → تحذير (3 تحذيرات = طرد)
• رياكت 🥒 → تحذير (3 تحذيرات = طرد)
• مطور البوت → مستثنى 👑

⛩️ *SUKUNA BOT*`
    }, { quoted: m });
    return;
  }

  // ✅ أمر إلغاء التحذيرات (لشخص معين)
  if (command === 'الغاء_انذار' || command === 'الغاء_تحذير' || command === 'unwarn') {
    if (!jid.endsWith("@g.us")) return m.reply("❌ هذا الأمر يعمل فقط في الجروبات!");

    // ✅ تحديد المستخدم المطلوب إلغاء تحذيراته
    let target = m.mentionedJid?.[0];
    if (!target && m.quoted) {
      target = m.quoted.sender;
    }
    if (!target) {
      return m.reply(`❌ *منشن الشخص أو رد على رسالته!*

📋 *الاستخدام الصحيح:*
${usedPrefix}الغاء_انذار @الشخص
أو رد على رسالة الشخص واكتب .الغاء_انذار`);
    }

    const warnKey = `${jid}-${target}`;
    
    if (!warnings.has(warnKey)) {
      return conn.sendMessage(jid, {
        text: `✅ *@${target.split("@")[0]}* ليس لديه أي تحذيرات!`,
        mentions: [target]
      });
    }

    const oldCount = warnings.get(warnKey);
    warnings.delete(warnKey);

    await conn.sendMessage(jid, {
      text: `✅ *تم إلغاء تحذيرات @${target.split("@")[0]}!*

📊 *كان عنده:* ❪${oldCount}/3❫ تحذيرات
💚 *الآن:* 0 تحذيرات

⛩️ *SUKUNA BOT*`,
      mentions: [target]
    });
    return;
  }

  // ✅ أمر الإيقاف
  if (command === 'ايقاف-رياكت' || command === 'تعطيل-رياكت' || command === 'وقف-رياكت') {
    if (!jid.endsWith("@g.us")) return m.reply("❌ هذا الأمر يعمل فقط في الجروبات!");

    groupStatus.set(jid, false);

    for (const key of warnings.keys()) {
      if (key.startsWith(jid)) {
        warnings.delete(key);
      }
    }

    await conn.sendMessage(jid, {
      text: `⛔ *تم إيقاف نظام مضاد الرياكتات في هذا الجروب!*

📋 *لتفعيله مرة أخرى اكتب:* .تفعيل_رياكت

⛩️ *SUKUNA BOT*`
    }, { quoted: m });
    return;
  }
};

handler.command = /^(تفعيل_رياكت|انتي_رياكت|مضاد_رياكت|ايقاف-رياكت|تعطيل-رياكت|وقف-رياكت|الغاء_انذار|الغاء_تحذير|unwarn)$/i;
handler.group = true;
handler.admin = true;

export default handler;