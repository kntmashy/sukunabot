import fs from 'fs';

const mutedPath = './data/muted.json';

const loadMuted = () => {
  if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
  if (!fs.existsSync(mutedPath)) fs.writeFileSync(mutedPath, '{}', 'utf8');
  try { return JSON.parse(fs.readFileSync(mutedPath, 'utf8')); }
  catch { return {}; }
};

const saveMuted = (data) =>
  fs.writeFileSync(mutedPath, JSON.stringify(data, null, 2), 'utf8');

const normalizeJid = (jid) =>
  jid?.replace(/:[\d]+@/, '@').trim() ?? '';

const box = (title, lines) =>
  `╭─「 ${title} 」\n${lines.map((l) => `│  ${l}`).join('\n')}\n╰──────────────`;

// ✅ الأرقام المسموح ليها بس
const allowedNumbers = ['201036547166', '201016855501'];

const handler = async (m, { conn, usedPrefix, command }) => {
  const groupId = m.chat;

  let targetJid = null;

  if (m.quoted) {
    targetJid = normalizeJid(m.quoted.sender || m.quoted.participant);
  }

  if (!targetJid && m.mentionedJid?.length > 0) {
    targetJid = normalizeJid(m.mentionedJid[0]);
  }

  const senderJid = normalizeJid(m.sender);
  const botJid = normalizeJid(conn.user.id);

  // ✅ تحقق من المالك أول حاجة
  const senderNumber = senderJid.replace('@s.whatsapp.net', '');
  if (!allowedNumbers.includes(senderNumber)) {
    return m.reply(box('🚫 ممنوع', [
      'هذا الأمر محجوز للمالك فقط!',
    ]));
  }

  switch (command) {

    case 'كتم': {
      if (!targetJid) {
        return m.reply(box('🔇 كتم عضو', [
          '⚠️  لازم تحدد الشخص!',
          '',
          '📌 *طرق الاستخدام:*',
          '  • ريبلاي على رسالته + `.كتم`',
          '  • `.كتم` مع منشن `@شخص`',
        ]));
      }

      if (targetJid === botJid)
        return m.reply(box('🤖 خطأ', ['😂  أنا مش هكتم نفسي!']));

      if (targetJid === senderJid)
        return m.reply(box('🤨 خطأ', ['مش منطقي تكتم نفسك 😅']));

      try {
        const groupMeta = await conn.groupMetadata(groupId);
        const member = groupMeta.participants.find((p) =>
          normalizeJid(p.id) === targetJid ||
          normalizeJid(p.lid || '') === targetJid
        );
        if (member?.admin === 'admin' || member?.admin === 'superadmin')
          return m.reply(box('🛡️ خطأ', [
            'مش قادر أكتم أدمن!',
            'اشيله من الأدمن الأول.',
          ]));
      } catch {}

      const realJid = targetJid;
      const muted = loadMuted();
      if (!muted[groupId]) muted[groupId] = [];

      if (muted[groupId].includes(realJid))
        return m.reply(box('🔇 تنبيه', [
          `@${targetJid.replace('@s.whatsapp.net', '')} متكتم أصلاً!`,
          '',
          `💡 استخدم *${usedPrefix}فككتم* عشان ترفع الكتم.`,
        ]));

      muted[groupId].push(realJid);
      saveMuted(muted);

      await conn.sendMessage(groupId, {
        text: box('🔇 تم الكتم', [
          `👤  *العضو:* @${targetJid.replace('@s.whatsapp.net', '')}`,
          `👮  *بواسطة:* @${senderNumber}`,
          `📦  *الحالة:* متكتم الآن`,
          '',
          `🗑️  أي رسالة هيبعتها هتتمسح فوراً`,
          `💡  استخدم *${usedPrefix}فككتم* عشان ترفع الكتم`,
        ]),
        mentions: [targetJid, senderJid],
      });
      break;
    }

    case 'فككتم': {
      if (!targetJid)
        return m.reply(box('🔊 فك كتم', [
          '⚠️  لازم تحدد الشخص!',
          '',
          '📌 *طرق الاستخدام:*',
          '  • ريبلاي على رسالته + `.فككتم`',
          '  • `.فككتم` مع منشن `@شخص`',
        ]));

      const muted = loadMuted();
      const before = (muted[groupId] || []).length;
      muted[groupId] = (muted[groupId] || []).filter(
        (jid) => normalizeJid(jid) !== targetJid
      );

      if (muted[groupId].length === before)
        return m.reply(box('🔊 تنبيه', ['الشخص ده مش متكتم أصلاً!']));

      saveMuted(muted);

      await conn.sendMessage(groupId, {
        text: box('🔊 تم فك الكتم', [
          `👤  *العضو:* @${targetJid.replace('@s.whatsapp.net', '')}`,
          `👮  *بواسطة:* @${senderNumber}`,
          `📦  *الحالة:* طليق يبعت زي ما يريد 😄`,
        ]),
        mentions: [targetJid, senderJid],
      });
      break;
    }
  }
};

handler.help = ['كتم', 'فككتم'];
handler.tags = ['group'];
handler.command = ['كتم', 'فككتم'];
handler.group = true;
handler.botAdmin = true;

export default handler;