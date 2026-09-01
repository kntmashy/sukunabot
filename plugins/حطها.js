/**
 * plugins/setpp.js - تغيير صورة البروفايل
 */

import fetch from 'node-fetch';

const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);

const handler = async (m, { conn, args }) => {
  let buffer = null;

  const url = args?.[0];
  if (url && /^https?:\/\//.test(url)) {
    try {
      const res = await fetch(url);
      buffer = Buffer.from(await res.arrayBuffer());
    } catch (e) {
      return m.reply('❌ مش قادر يحمل الصورة من الرابط');
    }
  }

  if (!buffer && m.quoted) {
    try {
      buffer = await m.quoted.download();
    } catch (e) {
      console.error('[SETPP download]', e.message);
    }
  }

  if (!buffer || buffer.length < 100) {
    return m.reply('ابعت رابط صورة مع الأمر\nأو ريبلاي على صورة\n\nمثال: `.حطها https://...`');
  }

  try {
    await m.react('⏳');

    const jid = conn.user?.jid;

    // updateProfilePicture بتاخد jid و { url: buffer } مش buffer مباشرة في بعض الإصدارات
    await withTimeout(
      conn.updateProfilePicture(jid, { url: buffer })
    );

    await m.react('✅');
    await m.reply('✅ تم تغيير صورة البروفايل بنجاح!');
  } catch (e) {
    console.error('[SETPP]', e.message);
    await m.react('❌');
    await m.reply('❌ فشل: ' + e.message);
  }
};

handler.command = /^(حطها|setpp|ppbot)$/i;
handler.owner = true;
export default handler;