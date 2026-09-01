let handler = async (m, { conn, text, command, usedPrefix, args }) => {
  let pp = 'https://www.bighero6challenge.com/images/thumbs/Piedra,-papel-o-tijera-0003318_1584.jpeg';
  const choices = ['حجر', 'ورقة', 'مقص'];

  if (!args[0] || !choices.includes(args[0])) {
    return conn.sendHydrated(m.chat, 
      `✊ ✋ ✌️ *لعبة حجر ورقة مقص*\n\nاختر أحد الخيارات باستخدام الأزرار أو الأوامر:\n\n${usedPrefix}${command} حجر\n${usedPrefix}${command} ورقة\n${usedPrefix}${command} مقص\n\n_Abdelrahman Elshamhout_`, 
      null, pp, null, null, null, null, [
        ['حجر 🥌', `${usedPrefix + command} حجر`],
        ['ورقة 📄', `${usedPrefix + command} ورقة`],
        ['مقص ✂️', `${usedPrefix + command} مقص`]
      ], m
    );
  }

  let userChoice = args[0];
  let botChoice = choices[Math.floor(Math.random() * 3)];
  let result = '';

  if (userChoice === botChoice) {
    global.db.data.users[m.sender].exp += 500;
    result = `🔰 تعادل!\n\nأنت: ${userChoice}\nالبوت: ${botChoice}\n🎁 حصلت على +500 نقطة`;
  } else if (
    (userChoice === 'حجر' && botChoice === 'مقص') ||
    (userChoice === 'ورقة' && botChoice === 'حجر') ||
    (userChoice === 'مقص' && botChoice === 'ورقة')
  ) {
    global.db.data.users[m.sender].exp += 1000;
    result = `🥳 فزت!\n\nأنت: ${userChoice}\nالبوت: ${botChoice}\n🎁 حصلت على +1000 نقطة`;
  } else {
    global.db.data.users[m.sender].exp -= 300;
    result = `☠️ خسرت!\n\nأنت: ${userChoice}\nالبوت: ${botChoice}\n❌ تم خصم -300 نقطة`;
  }

  m.reply(result);
};

handler.help = ['ppt'];
handler.tags = ['games'];
handler.command = /^(لعبه|لعبة|حجر-ورقه-مقص|حجر|ورقة|ورقه|مقص)$/i;

export default handler;