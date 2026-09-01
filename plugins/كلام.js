/**
 * plugins/tts.js - نص لصوت @Amazing_VoiceBot
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { NewMessage } from 'telegram/events/index.js';

const API_ID   = parseInt(process.env.TG_API_ID);
const API_HASH = process.env.TG_API_HASH;
const BOT_USER = 'Amazing_VoiceBot';

let _client = null;

async function getClient() {
  if (_client?.connected) return _client;
  const session = new StringSession(process.env.TG_SESSION || '');
  _client = new TelegramClient(session, API_ID, API_HASH, { connectionRetries: 5 });
  await _client.connect();
  return _client;
}

function waitForReply(client, checkFn = () => true, timeout = 40000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { client.removeEventHandler(hdl); reject(new Error('انتهى الوقت')); }, timeout);
    const hdl = async (event) => {
      const msg = event.message;
      if (!msg) return;
      try {
        const fromId = msg.peerId?.userId?.toString() || msg.fromId?.userId?.toString() || '';
        if (global._tgIdTTS && fromId === global._tgIdTTS) {
          if (!checkFn(msg)) return;
          clearTimeout(timer); client.removeEventHandler(hdl); resolve(msg); return;
        }
        const sender = await msg.getSender();
        if (sender?.username?.toLowerCase() === BOT_USER.toLowerCase()) {
          if (fromId) global._tgIdTTS = fromId;
          if (!checkFn(msg)) return;
          clearTimeout(timer); client.removeEventHandler(hdl); resolve(msg);
        }
      } catch {}
    };
    client.addEventHandler(hdl, new NewMessage({}));
  });
}

const handler = async (m, { conn, text }) => {
  const input = (text || '').trim();
  if (!input) return m.reply('ابعت النص\nمثال: `.tts مرحبا`');

  try {
    const client = await getClient();
    await m.react('⏳');

    const p = waitForReply(client, msg => !!(msg.voice || msg.audio || msg.document));
    await new Promise(r => setTimeout(r, 400));
    await client.sendMessage(BOT_USER, { message: input });
    const audioMsg = await p;

    const media  = audioMsg.voice || audioMsg.audio || audioMsg.document;
    const buffer = await client.downloadMedia(media);
    if (!buffer) throw new Error('مش قدر يحمل الصوت');

    await conn.sendMessage(m.chat, {
      audio: buffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    }, { quoted: m });

    await m.react('✅');
  } catch (e) {
    console.error('[TTS]', e.message);
    await m.react('❌');
    await m.reply(`❌ فشل\n⚠️ ${e.message}`);
  }
};

handler.help    = ['tts'];
handler.tags    = ['tools'];
handler.command = /^(tts|صوت|كلام)$/i;
export default handler;