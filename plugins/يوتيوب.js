// plugins/ytdl.js
// تحميل فيديو/صوت من يوتيوب عبر بوت YinstaBot

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { NewMessage } from 'telegram/events/index.js';
import { Api } from 'telegram/tl/index.js';
import { generateWAMessageFromContent, prepareWAMessageMedia } from 'angularsockets';
import axios from 'axios';

const BOT_USER = 'YinstaBot';
const THUMBNAIL_URL = 'https://files.catbox.moe/i6q798.jpg';
const SYSTEM_NAME = '◜⏤͟͟͞͞ 𝙎𝙐𝙆𝙐𝙉𝘼 ✦ 𝙔𝙊𝙐𝙏𝙐𝘽𝙀 ˖࣪⃟⛩️ ◞';

let _client = null;

async function getClient() {
  if (_client?.connected) return _client;
  const session = new StringSession(process.env.TG_SESSION || '');
  _client = new TelegramClient(session, parseInt(process.env.TG_API_ID), process.env.TG_API_HASH, { connectionRetries: 5 });
  await _client.connect();
  return _client;
}

function waitForButtons(client, timeout = 40000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.removeEventHandler(hdl);
      reject(new Error('انتهى الوقت - ما جاش رد من البوت'));
    }, timeout);

    const hdl = async (event) => {
      const msg = event.message;
      if (!msg) return;
      try {
        const sender = await msg.getSender();
        if (sender?.username?.toLowerCase() !== BOT_USER.toLowerCase()) return;
        const buttons = msg.replyMarkup?.rows;
        if (!buttons?.length) return;
        clearTimeout(timer);
        client.removeEventHandler(hdl);
        resolve(msg);
      } catch {}
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
      try {
        const sender = await msg.getSender();
        if (sender?.username?.toLowerCase() !== BOT_USER.toLowerCase()) return;
        if (!msg.media) return;
        clearTimeout(timer);
        client.removeEventHandler(hdl);
        resolve(msg);
      } catch {}
    };

    client.addEventHandler(hdl, new NewMessage({}));
  });
}

// ✅ دالة للبحث في يوتيوب وجلب النتائج
async function searchYouTube(query) {
  const payload = {
    query,
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20260603.00.00',
        hl: 'ar',
        gl: 'EG',
        platform: 'MOBILE',
        osName: 'Android',
        osVersion: '10',
        deviceModel: 'android 10.0'
      }
    }
  };

  const { data } = await axios.post(
    'https://www.youtube.com/youtubei/v1/search?prettyPrint=false',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'ar,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
        'x-youtube-client-name': '1',
        'x-youtube-client-version': '2.20260603.00.00',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'same-origin',
        'sec-fetch-site': 'same-origin'
      },
      timeout: 15000
    }
  );

  const sectionContents =
    data?.contents
      ?.twoColumnSearchResultsRenderer
      ?.primaryContents
      ?.sectionListRenderer
      ?.contents ?? [];

  let items = [];
  for (const section of sectionContents) {
    const rows = section?.itemSectionRenderer?.contents;
    if (rows?.length) { items = rows; break; }
  }

  const videos = [];
  for (const item of items) {
    const vr = item?.videoRenderer;
    if (!vr?.videoId) continue;
    videos.push({
      videoId: vr.videoId,
      title: vr.title?.runs?.[0]?.text ?? 'بدون عنوان',
      url: `https://www.youtube.com/watch?v=${vr.videoId}`,
      timestamp: vr.lengthText?.simpleText ?? 'N/A',
      views: vr.viewCountText?.simpleText ?? 'N/A',
      channel: vr.ownerText?.runs?.[0]?.text ?? 'N/A'
    });
    if (videos.length >= 10) break;
  }

  return videos;
}

// ✅ دالة تحميل الفيديو من يوتيوب عبر YinstaBot
async function downloadVideo(url, isAudio = false) {
  const client = await getClient();
  const buttonLabel = isAudio ? 'audio clip' : 'video clip';

  const buttonsPromise = waitForButtons(client);
  await client.sendMessage(BOT_USER, { message: url });
  const btnMsg = await buttonsPromise;

  let targetButton = null;
  for (let r = 0; r < btnMsg.replyMarkup.rows.length; r++) {
    const row = btnMsg.replyMarkup.rows[r];
    for (let c = 0; c < row.buttons.length; c++) {
      if (row.buttons[c].text?.toLowerCase().includes(buttonLabel)) {
        targetButton = row.buttons[c];
        break;
      }
    }
    if (targetButton) break;
  }

  if (!targetButton) throw new Error('مش لاقي الزرار المطلوب');

  const filePromise = waitForFile(client);
  client.invoke(new Api.messages.GetBotCallbackAnswer({
    peer: BOT_USER,
    msgId: btnMsg.id,
    data: targetButton.data,
  })).catch(() => {});

  const fileMsg = await filePromise;
  const buffer = await client.downloadMedia(fileMsg.media, { workers: 4 });
  return buffer;
}

// ══════════════════════════════════════════════
// 🎮 الأمر الرئيسي
// ══════════════════════════════════════════════
let handler = async (m, { conn, usedPrefix, command, text }) => {
  const query = (text || '').trim();

  // ── لو مفيش نص: عرض قائمة البحث ──
  if (!query) {
    await m.react('🔎');
    return m.reply(
      `╔════ ≪ ━ ─ ❪ ⛩️ 𝙔𝙊𝙐𝙏𝙐𝘽𝙀 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿𝙀𝙍 ⛩️ ❫ ─ ━ ≫ ════╗\n` +
      `║ ✧ ━━━━━ ❪ 𝐒 𝐔 𝐊 𝐔 𝐍 𝐀 ⚡ 𝐁 𝐎 𝐓 ❫ ━━━━━ ✧ ║\n` +
      `╟「 ⛩️ 」↬ اكتب اسم الفيديو للبحث\n` +
      `╟「 ⛩️ 」↬ أو ارسل رابط يوتيوب مباشر\n` +
      `╚════ ≪ ━ ─ ❪ 🔪 𝐂 𝐔 𝐑 𝐒 𝐄 𝐃 🔪 ❫ ─ ━ ≫ ════╝\n` +
      `\n📌 *الأوامر:*\n` +
      `• ${usedPrefix}${command} <اسم فيديو> - للبحث\n` +
      `• ${usedPrefix}${command} <رابط> - للتحميل\n` +
      `• ${usedPrefix}${command} صوت <رابط> - لتحميل الصوت`
    );
  }

  // ── إذا كان رابط يوتيوب مباشر ──
  if (query.includes('youtube.com/watch') || query.includes('youtu.be/')) {
    await m.react('⏳');
    const isAudio = query.toLowerCase().startsWith('صوت');
    const cleanUrl = query.replace(/^(صوت|فيديو)\s*/, '').trim();

    try {
      await m.reply(`⏳ *جاري تحميل الـ ${isAudio ? 'صوت' : 'فيديو'}...*`);

      const buffer = await downloadVideo(cleanUrl, isAudio);

      if (isAudio) {
        await conn.sendMessage(m.chat, {
          audio: Buffer.from(buffer),
          mimetype: 'audio/mpeg',
          fileName: 'audio.mp3',
        }, { quoted: m });
      } else {
        await conn.sendMessage(m.chat, {
          video: Buffer.from(buffer),
          mimetype: 'video/mp4',
          fileName: 'video.mp4',
        }, { quoted: m });
      }

      await m.react('✅');
    } catch (e) {
      console.error('[YTDL Error]', e.message);
      await m.react('❌');
      await m.reply(`❌ فشل التحميل: ${e.message}`);
    }
    return;
  }

  // ── بحث في يوتيوب ──
  try {
    await m.react('🔎');
    const results = await searchYouTube(query);

    if (!results.length) {
      await m.react('❌');
      return m.reply(`❌ مفيش نتايج لـ "${query}"`);
    }

    // عرض النتائج مع أزرار اختيار
    const caption = `🔍 *نتائج البحث عن:* ${query}\n*عدد النتائج:* ${results.length}\n\nاختر فيديو للتحميل:`;

    const listRows = results.map((v, i) => ({
      title: `${i + 1}. ${v.title.slice(0, 50)}${v.title.length > 50 ? '…' : ''}`,
      description: `⏱️ ${v.timestamp} | 👁️ ${v.views} | 📺 ${v.channel}`,
      id: `ytdl|${v.url}|${v.title}`
    }));

    const { imageMessage } = await prepareWAMessageMedia(
      { image: { url: THUMBNAIL_URL } },
      { upload: conn.waUploadToServer }
    ).catch(() => ({ imageMessage: null }));

    const msg = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            body: { text: caption },
            footer: { text: SYSTEM_NAME },
            header: imageMessage ? { hasMediaAttachment: true, imageMessage } : { hasMediaAttachment: false },
            nativeFlowMessage: {
              buttons: [{
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                  title: '⛩️ اختر فيديو للتحميل',
                  sections: [{
                    title: '📹 نتائج البحث',
                    rows: listRows
                  }]
                })
              }]
            }
          }
        }
      }
    }, { quoted: m });

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    await m.react('✅');

  } catch (err) {
    console.error('[YTDL Search Error]', err);
    await m.react('❌');
    await m.reply('❌ حدث خطأ أثناء البحث');
  }
};

// ══════════════════════════════════════════════
// before — يستقبل اختيار المستخدم ويحمل الفيديو
// ══════════════════════════════════════════════
handler.before = async function (m, { conn }) {
  try {
    const selectedId =
      m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson
        ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)?.id
        : null;

    if (!selectedId || !selectedId.startsWith('ytdl|')) return;

    const [, url, title] = selectedId.split('|');

    await m.react('⏳');
    await conn.sendMessage(m.chat, {
      text: `⏳ *جاري تحميل:*\n${title}`
    }, { quoted: m });

    try {
      const buffer = await downloadVideo(url, false);

      await conn.sendMessage(m.chat, {
        video: Buffer.from(buffer),
        mimetype: 'video/mp4',
        fileName: `${title.slice(0, 30)}.mp4`,
        caption: `✅ *تم التحميل*\n📹 ${title}`
      }, { quoted: m });

      await m.react('✅');
    } catch (e) {
      console.error('[YTDL Download Error]', e.message);
      await m.react('❌');
      await conn.sendMessage(m.chat, {
        text: `❌ فشل تحميل الفيديو: ${e.message}`
      }, { quoted: m });
    }

    return true;
  } catch (e) {
    console.error('[YTDL before]', e.message);
  }
};

handler.command = /^(يوت_بحث|ytsearch|yt)$/i;
handler.tags = ['تحميل'];
handler.help = ['يوت_بحث <اسم الفيديو>'];

export default handler;