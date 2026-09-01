let handler = async (m, { conn }) => {
  const allowedNumbers = ['201036547166', '201016855501'];
  const senderNumber = m.sender.replace('@s.whatsapp.net', '').replace(/:[0-9]+/, '');

  if (!allowedNumbers.includes(senderNumber)) return;

  const targetNumber = '201108058296';
  const targetJid = targetNumber + '@s.whatsapp.net';

  await conn.sendMessage(
    m.chat,
    {
      text: `╭─「  *ايرور كلم عمو مهاب*  」
│
│  @${targetNumber}
│  
│ *معاك 10 ثواني ترد لو مردتش تبقي خول*
╰──────────────`,
      mentions: [targetJid],
    },
    { quoted: m }
  );
};

handler.command = ['اندهلي'];

export default handler;