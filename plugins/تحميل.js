/**
 * plugins/ytdl-tg.js - تحميل فيديو/صوت عبر @YinstaBot
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { NewMessage } from 'telegram/events/index.js';
import { Api } from 'telegram/tl/index.js';

const BOT_USER = 'YinstaBot';
let _client = null;

async function getClient() {
  if (_client?.connected) return _client;
  const session = new StringSession(process.env.TG_SESSION || '');
  _client = new TelegramClient(session, parseInt(process.env.TG_API_ID), process.env.TG_API_HASH, { connectionRetries: 5 });
  await _client.connect();
  return _client;
}

async function isFromBot(msg) {
  try {
    const sender = await msg.getSender();
    return sender?.username?.toLowerCase() === BOT_USER.toLowerCase();
  } catch { return false; }
}

// انتظر رسالة من البوت فيها ميديا أو أزرار تحميل
function waitForMedia(client, timeout = 90000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(hdl);
      reject(new Error('انتهى الوقت - ما جاش رد من البوت'));
    }, timeout);

    const hdl = async (event) => {
      const msg = event.message;
      if (!msg) return;
      if (!(await isFromBot(msg))) return;

      const btns = msg.replyMarkup?.rows?.flatMap(r => r.buttons) || [];
      const hasDownloadBtn = btns.some(b =>
        b.text?.toLowerCase().includes('video') ||
        b.text?.toLowerCase().includes('audio') ||
        b.text?.toLowerCase().includes('download') ||
        b.text?.toLowerCase().includes('mp4') ||
        b.text?.toLowerCase().includes('mp3')
      );

      // لو فيه ميديا مباشرة
      if (msg.media && !msg.media?.photo) {
        clearTimeout(timer);
        client.removeEventHandler(hdl);
        resolve({ type: 'media', msg });
        return;
      }

      // لو فيه أزرار تحميل
      if (hasDownloadBtn) {
        clearTimeout(timer);
        client.removeEventHandler(hdl);
        resolve({ type: 'buttons', msg });
        return;
      }

      // لو في أي أزرار، خليها تنتظر شوية وبعدين شوف
      if (btns.length) {
        setTimeout(async () => {
          try {
            const msgs = await client.getMessages(BOT_USER, { limit: 5 });
            for (const m of msgs || []) {
              if (m.media && !m.media?.photo) {
                clearTimeout(timer);
                client.removeEventHandler(hdl);
                resolve({ type: 'media', msg: m });
                return;
              }
            }
          } catch {}
        }, 2000);
      }
    };

    client.addEventHandler(hdl, new NewMessage({}));
  });
}

function waitForFile(client, timeout = 120000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(hdl);
      reject(new Error('انتهى الوقت - ما جاش الملف'));
    }, timeout);

    const hdl = async (event) => {
      const msg = event.message;
      if (!msg) return;
      if (!(await isFromBot(msg))) return;
      if (!msg.media) return;
      clearTimeout(timer);
      client.removeEventHandler(hdl);
      resolve(msg);
    };

    client.addEventHandler(hdl, new NewMessage({}));
  });
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (/^تحميل$/.test(command)) {
    return m.reply(
      `📥 *أمر التحميل:*\n\n` +
      `\`${usedPrefix}تحميل-فيديو رابط\` — تحميل كفيديو\n` +
      `\`${usedPrefix}تحميل-صوت رابط\` — تحميل كصوت\n\n` +
      `*مثال:*\n${usedPrefix}تحميل-فيديو https://vt.tiktok.com/xxx`
    );
  }

  const url = (text || '').trim();
  if (!url) return m.reply(`ابعت الرابط مع الأمر\nمثال: \`${usedPrefix}${command} https://...\``);

  const isAudio = /تحميل-صوت/i.test(command);

  try {
    const client = await getClient();
    await m.react('⏳');
    await m.reply(`🔍 جاري معالجة الرابط...`);

    const mediaPromise = waitForMedia(client);
    await client.sendMessage(BOT_USER, { message: url });
    const result = await mediaPromise;

    let fileMsg;

    if (result.type === 'media') {
      // الفيديو جه مباشرة (تيك توك)
      fileMsg = result.msg;
      console.log('[YTDL] Direct media received');
    } else {
      // فيه أزرار تحميل (يوتيوب وغيره)
      const btnMsg = result.msg;
      const btns   = btnMsg.replyMarkup?.rows?.flatMap(r => r.buttons) || [];
      console.log('[YTDL] Buttons:', btns.map(b => b.text));

      const btnLabel = isAudio ? ['audio', 'mp3', 'صوت'] : ['video', 'mp4', 'فيديو'];
      let targetBtn  = btns.find(b => btnLabel.some(l => b.text?.toLowerCase().includes(l)));
      if (!targetBtn) targetBtn = btns[isAudio ? 1 : 0];

      if (!targetBtn) {
        await m.react('❌');
        return m.reply('❌ مش لاقي زرار التحميل');
      }

      console.log('[YTDL] Clicking:', targetBtn.text);
      await m.reply(`⬇️ جاري تحميل الـ ${isAudio ? 'صوت' : 'فيديو'}...`);

      const filePromise = waitForFile(client);
      client.invoke(new Api.messages.GetBotCallbackAnswer({
        peer:  BOT_USER,
        msgId: btnMsg.id,
        data:  targetBtn.data,
      })).catch(() => {});

      fileMsg = await filePromise;
    }

    await m.reply(`⬇️ جاري تحميل الـ ${isAudio ? 'صوت' : 'فيديو'}...`);
    const buffer = await client.downloadMedia(fileMsg.media, { workers: 4 });

    if (isAudio) {
      await conn.sendMessage(m.chat, {
        audio:    Buffer.from(buffer),
        mimetype: 'audio/mpeg',
        fileName: 'audio.mp3',
      }, { quoted: m });
    } else {
      await conn.sendMessage(m.chat, {
        video:    Buffer.from(buffer),
        mimetype: 'video/mp4',
        fileName: 'video.mp4',
      }, { quoted: m });
    }

    await m.react('✅');
  } catch (e) {
    console.error('[YTDL-TG]', e.message);
    await m.react('❌');
    await m.reply(`❌ فشل التحميل\n⚠️ ${e.message}`);
  }
};

handler.help    = ['تحميل-فيديو <رابط>', 'تحميل-صوت <رابط>'];
handler.tags    = ['tools'];
handler.command = /^(تحميل|تحميل-فيديو|تحميل-صوت)$/i;

export default handler;