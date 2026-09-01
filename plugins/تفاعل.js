let handler = m => m;

const ownerNumbers = [
  '201016855501',
  '201036547166'
];

const emojis = [
  '❤️', '🔥', '😂', '👍', '🎉', '😍', '💯', '👑', '⚡️', '😎',
  '🌹', '💪', '🫡', '🥹', '😈', '👀', '🤩', '💥', '🌙', '⛩️',
  '🎯', '🏆', '✨', '💫', '🦋', '🌊', '🍀', '🎭', '🔮', '🎪',
  '😏', '🤯', '🥶', '🤑', '😴', '🤫', '🫶', '🙌', '👏', '🫰'
];

const reactEnabled = {};

let cmdHandler = async (m, { conn }) => {
  const senderNumber = m.sender.split('@')[0];
  if (!ownerNumbers.includes(senderNumber)) return m.reply('❌ هذا الأمر للمالك فقط.');

  const id = m.chat;
  if (reactEnabled[id]) {
    delete reactEnabled[id];
    return m.reply('*❍━━━══━━❪⛩️❫━━══━━━❍*\n*｢😈｣⇇ تم إيقاف التفاعل التلقائي*\n*❍━━━══━━❪⛩️❫━━══━━━❍*');
  } else {
    reactEnabled[id] = true;
    return m.reply('*❍━━━══━━❪⛩️❫━━══━━━❍*\n*｢❤️｣⇇ تم تفعيل التفاعل التلقائي*\n*❍━━━══━━❪⛩️❫━━══━━━❍*');
  }
};

cmdHandler.command = /^(تفاعل)$/i;

cmdHandler.all = async function (m, { conn }) {
  const id = m.chat;
  if (!reactEnabled[id]) return !0;

  const senderNumber = m.sender.split('@')[0];
  if (!ownerNumbers.includes(senderNumber)) return !0;

  // تجاهل رسائل الأوامر نفسها عشان متعملش لوب
  if (m.text && /^[.!#]تفاعل$/i.test(m.text.trim())) return !0;

  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...emojis].sort(() => 0.5 - Math.random());
  const picked = shuffled.slice(0, count);

  for (let emoji of picked) {
    await conn.sendMessage(id, {
      react: { text: emoji, key: m.key }
    });
  }

  return !0;
};

export default cmdHandler;