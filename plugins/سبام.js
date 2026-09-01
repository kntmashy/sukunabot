/**
 * plugins/spam.js
 * بعت ملصق كل X دقيقة مع حفظ الحالة
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SPAM_FILE  = join(process.cwd(), 'spam_data.json');
const OWNER      = process.env.OWNER_NUMBER || '201016855501';

if (!global._spamIntervals) global._spamIntervals = {};
if (!global._spamReady)     global._spamReady     = false;

// ══════════════════════════════════════════════════
//  حفظ وقراءة البيانات
// ══════════════════════════════════════════════════
function saveSpamData(data) {
  try { writeFileSync(SPAM_FILE, JSON.stringify(data, null, 2)); } catch (e) {}
}

function loadSpamData() {
  try {
    if (existsSync(SPAM_FILE)) return JSON.parse(readFileSync(SPAM_FILE, 'utf8'));
  } catch (e) {}
  return {};
}

// ══════════════════════════════════════════════════
//  استرجاع السبام بعد restart
// ══════════════════════════════════════════════════
async function restoreSpam(conn) {
  if (global._spamReady) return;
  global._spamReady = true;

  const data = loadSpamData();
  for (const [chatId, info] of Object.entries(data)) {
    if (!info.active || !info.msgKey) continue;
    console.log('[Spam] Restoring for:', chatId, 'every', info.minutes, 'min');

    global._spamIntervals[chatId] = setInterval(async () => {
      try {
        await conn.sendMessage(chatId, { sticker: { url: info.stickerUrl } });
      } catch (e) {
        console.error('[Spam interval]', e.message);
      }
    }, info.minutes * 60 * 1000);
  }
}

// ══════════════════════════════════════════════════
//  Handler
// ══════════════════════════════════════════════════
const handler = async (m, { conn, text, usedPrefix, command }) => {
  // استرجاع السبام بعد restart
  await restoreSpam(conn);

  // تحقق من الأونر
  const sender = m.sender?.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
  if (sender !== OWNER) {
    return m.reply('❌ الأمر ده ليا بس 😅');
  }

  const input = (text || '').trim().toLowerCase();

  // إيقاف
  if (input === 'stop' || input === 'وقف') {
    if (global._spamIntervals[m.chat]) {
      clearInterval(global._spamIntervals[m.chat]);
      delete global._spamIntervals[m.chat];

      // احذف من الملف
      const data = loadSpamData();
      delete data[m.chat];
      saveSpamData(data);

      await m.react('✅');
      return m.reply('🛑 *تم إيقاف السبام*');
    }
    return m.reply('مفيش سبام شغال دلوقتي');
  }

  // جيب عدد الدقائق
  const minutes = parseInt(input);
  if (isNaN(minutes) || minutes < 1) {
    return m.reply(
      `📌 *استخدام أمر السبام:*\n\n` +
      `رد على ملصق واكتب:\n` +
      `\`${usedPrefix}${command} 30\` — كل 30 دقيقة\n` +
      `\`${usedPrefix}${command} 5\` — كل 5 دقايق\n\n` +
      `\`${usedPrefix}${command} stop\` — إيقاف`
    );
  }

  // لازم رد على ملصق
  const quoted = m.quoted;
  if (!quoted) {
    return m.reply('❌ لازم ترد على الملصق اللي عايز تبعته');
  }

  // حمل الملصق وارفعه عشان عندنا URL ثابت
  let stickerBuffer;
  try {
    stickerBuffer = await quoted.download();
    if (!stickerBuffer || stickerBuffer.length < 100) throw new Error('فشل تحميل الملصق');
  } catch (e) {
    return m.reply(`❌ مش قادر أحمل الملصق: ${e.message}`);
  }

  // وقف السبام القديم لو في
  if (global._spamIntervals[m.chat]) {
    clearInterval(global._spamIntervals[m.chat]);
  }

  // بعت الملصق دلوقتي
  await conn.sendMessage(m.chat, { sticker: stickerBuffer });

  // احفظ البيانات
  const data = loadSpamData();
  data[m.chat] = {
    active:  true,
    minutes,
    chatId:  m.chat,
    // مش هنحفظ الـ buffer، هنبعت من الـ sticker اللي عندنا
  };
  saveSpamData(data);

  // ابدأ الـ interval
  global._spamIntervals[m.chat] = setInterval(async () => {
    try {
      await conn.sendMessage(m.chat, { sticker: stickerBuffer });
    } catch (e) {
      console.error('[Spam]', e.message);
      // لو فشل 3 مرات، وقف
      const d = loadSpamData();
      if (d[m.chat]) {
        d[m.chat].errors = (d[m.chat].errors || 0) + 1;
        if (d[m.chat].errors >= 3) {
          clearInterval(global._spamIntervals[m.chat]);
          delete global._spamIntervals[m.chat];
          delete d[m.chat];
        }
        saveSpamData(d);
      }
    }
  }, minutes * 60 * 1000);

  await m.react('✅');
  await m.reply(
    `✅ *السبام شغال!*\n\n` +
    `⏱ هيبعت الملصق كل *${minutes} دقيقة*\n\n` +
    `عشان توقفه: \`${usedPrefix}${command} stop\``
  );
};

handler.help    = ['سبام <دقايق>'];
handler.tags    = ['owner'];
handler.command = /^(سبام|spam)$/i;
export default handler;