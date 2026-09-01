/**
 * plugins/وصفه.js
 * جيب البايو/الوصف بتاع أي شخص
 */

let handler = async (m, { conn }) => {
  // تحديد مين
  let who;
  const textMatch = m.text?.match(/@(\d+)/);
  if (textMatch) {
    who = textMatch[1] + '@s.whatsapp.net';
  } else if (m.quoted) {
    who = m.quoted.sender;
  } else if (m.mentionedJid?.[0]) {
    who = m.mentionedJid[0];
  } else {
    who = m.sender;
  }

  if (!who || who.endsWith('@lid')) who = m.sender;

  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

  const username = conn.getName(who) || who.split('@')[0];

  // جرب كل الطرق الممكنة
  let bio = null;

  // طريقة 1: fetchStatus
  if (!bio) {
    try {
      const res = await conn.fetchStatus(who);
      const arr = Array.isArray(res) ? res : [res];
      const found = arr.find(r => r?.status?.status?.trim());
      bio = found?.status?.status?.trim() || null;
      console.log('[وصفه] fetchStatus:', JSON.stringify(res));
    } catch (e) { console.log('[وصفه] fetchStatus fail:', e.message); }
  }

  // طريقة 2: getStatus
  if (!bio) {
    try {
      const res = await conn.getStatus(who);
      const arr = Array.isArray(res) ? res : [res];
      const found = arr.find(r => r?.status?.status?.trim());
      bio = found?.status?.status?.trim() || null;
      console.log('[وصفه] getStatus:', JSON.stringify(res));
    } catch (e) { console.log('[وصفه] getStatus fail:', e.message); }
  }

  // طريقة 3: contacts
  if (!bio) {
    try {
      const contact = conn.contacts?.[who];
      bio = contact?.status || contact?.statusMsg || null;
      console.log('[وصفه] contacts:', JSON.stringify(contact));
    } catch (e) { console.log('[وصفه] contacts fail:', e.message); }
  }

  if (!bio) bio = '❌ لا يوجد وصف';

  // جيب الصورة
  let ppBuffer = null;
  try {
    const ppUrl = await conn.profilePictureUrl(who, 'image');
    const res   = await fetch(ppUrl);
    ppBuffer    = await res.buffer();
  } catch {
    try {
      const { promises: fs } = await import('fs');
      ppBuffer = await fs.readFile('./src/sinfoto.jpg').catch(() => null);
    } catch {}
  }

  const str = `
╮═━━━━━━✦⛩️✦━━━━━━═╭
┊   ｢⛩️SUKUNA⚡️BOT⛩️｣   ┊
╯═━━━━━━✦⛩️✦━━━━━━═╰
✦───────✿───────✦
📝 *وصف المستخدم:*
┊:•⪼ *🪪 الإسم:* ｢${username}｣
┊:•⪼ *📝 الوصف:*
┊  ${bio}
✦───────✿───────✦
  `.trim();

  await conn.sendMessage(m.chat, {
    ...(ppBuffer ? { image: ppBuffer } : { text: str }),
    ...(ppBuffer ? { caption: str } : {}),
    mentions: [who]
  }, { quoted: m });

  await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
};

handler.help    = ['وصفه'];
handler.tags    = ['info'];
handler.command = ['وصفه', 'بايو', 'bio', 'status'];
export default handler;