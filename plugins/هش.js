const handler = async (m, { conn, usedPrefix, command }) => {
  if (!m.isGroup) return m.reply(`*✳️ هذا الأمر للمجموعات فقط*`);

  try {
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    let groupMetadata = await conn.groupMetadata(m.chat);
    let participants = groupMetadata.participants || [];
    let owner = groupMetadata.owner || m.chat.split('-')[0] + '@s.whatsapp.net';

    let botDevelopers = [
      '201016855501@s.whatsapp.net',
      '201150572826@s.whatsapp.net',
      '201036547166@s.whatsapp.net'
    ];

    const botNumber = (conn.user.id || '').split(':')[0].split('@')[0];

    let participantsToKick = participants.filter(p => {
      const pNum = p.id.split(':')[0].split('@')[0]
      const isOwner = pNum === owner.split('@')[0]
      const isBot = pNum === botNumber
      const isDev = botDevelopers.some(d => d.split('@')[0] === pNum)
      return !isOwner && !isBot && !isDev
    }).map(p => p.id);

    if (participantsToKick.length === 0) {
      return m.reply(`*⚠️ مفيش أعضاء للطرد.*`);
    }

    const chunkSize = 5;
    for (let i = 0; i < participantsToKick.length; i += chunkSize) {
      const chunk = participantsToKick.slice(i, i + chunkSize);
      await conn.groupParticipantsUpdate(m.chat, chunk, 'remove');
      if (i + chunkSize < participantsToKick.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    m.reply(`*✅ تم طرد ${participantsToKick.length} عضو بنجاح.*`);

  } catch (err) {
    console.error('[KickAll Error]', err);
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    m.reply(`*❌ حدث خطأ:* ${err.message}`);
  }
};

handler.help = ['kickall'];
handler.tags = ['group'];
handler.command = ['هاك', 'اسحبها'];
handler.group = true;
handler.owner = true;
handler.botAdmin = true;

export default handler;