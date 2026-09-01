const ownerNumbers = [
  '201016855501',
  '201036547166'
];

const stickyReact = {}; // { targetJid: emoji }

let cmdHandlerHatt2 = async (m, { conn }) => {
  const senderNumber = m.sender.split('@')[0];
  if (!ownerNumbers.includes(senderNumber)) return m.reply('❌ هذا الأمر للمالك فقط.');

  const args = m.text.trim().split(' ').slice(1);
  const emoji = args[args.length - 1];
  if (!emoji) return m.reply('❌ اكتب الإيموجي بعد الأمر.');

  let targetJid;

  if (m.mentionedJid && m.mentionedJid.length) {
    targetJid = m.mentionedJid[0];
  } else if (m.quoted) {
    targetJid = m.quoted.sender || m.quoted.participant || (m.quoted.key && m.quoted.key.participant);
  }

  if (!targetJid) {
    return m.reply('❌ رد على شخص أو منشنه.');
  }

  if (stickyReact[targetJid] === emoji) {
    delete stickyReact[targetJid];
    return m.reply(`⏹️ وقفت التفاعل مع @${targetJid.split('@')[0]}`);
  }

  stickyReact[targetJid] = emoji;
  return m.reply(`✅ هفضل أتفاعل مع رسايل @${targetJid.split('@')[0]} بـ ${emoji}`);
};
cmdHandlerHatt2.command = /^حط2$/i;

cmdHandlerHatt2.all = async function (m, { conn }) {
  const emoji = stickyReact[m.sender];
  if (!emoji) return !0;

  try {
    await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
  } catch (err) {
    console.log('حط2 error:', err);
  }
  return !0;
};

export default cmdHandlerHatt2;