// كود يوزارات واتساب
// by izana
const FOOTER = "BOT SUKUNA";
const sessions = new Map();

function generateRandomUsername(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  result += chars[Math.floor(Math.random() * 26)];
  for (let i = 1; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function checkUsernames(conn, usernames) {
  const { Boom } = await import('@hapi/boom');
  const { S_WHATSAPP_NET, getBinaryNodeChild } = await import('@whiskeysockets/baileys');

  const wMexQuery = (variables, queryId, query, generateMessageTag) => {
    return query({
      tag: "iq",
      attrs: { id: generateMessageTag(), type: "get", to: S_WHATSAPP_NET, xmlns: "w:mex" },
      content: [{
        tag: "query",
        attrs: { query_id: queryId },
        content: Buffer.from(JSON.stringify({ variables }), "utf-8"),
      }],
    });
  };

  const result = await wMexQuery({ usernames }, "27134626522840286", conn.query, conn.generateMessageTag);
  const child = getBinaryNodeChild(result, "result");

  if (child?.content) {
    const data = JSON.parse(child.content.toString());
    if (data.errors?.length) {
      throw new Boom(data.errors[0].message, { statusCode: data.errors[0].extensions?.error_code || 400 });
    }
    return data?.data?.xwa2_username_check_multi;
  }
  throw new Boom('فشل التحقق من اليوزرات', { statusCode: 400 });
}

const LENGTH_MAP = {
  'يوزر-ثلاثي': 3,
  'يوزر-رباعي': 4,
  'يوزر-خماسي': 5,
  'يوزر-سداسي': 6,
  'يوزر-سباعي': 7,
  'يوزر-ثماني': 8,
};

const handlerHunt = async (m, { conn, text, usedPrefix, len }) => {
  if (sessions.get(m.sender)?.hunting) return m.reply('⏳ في عملية صيد شغالة بالفعل، استخدم .وقف-صيد للإيقاف');

  const args = text?.split(' ').filter(Boolean) || [];
  const target = parseInt(args[0]) || 5; // عدد اليوزرات المطلوب إيجادها
  const maxRounds = 500; // حد أقصى للمحاولات لمنع اللوب اللانهائي

  if (target < 1 || target > 200) {
    return m.reply('❌ العدد المطلوب لازم يكون بين 1 و 200');
  }

  sessions.set(m.sender, { hunting: true, found: [], tried: 0 });
  await m.reply(`🎯 بدأ الصيد...\nطول اليوزر: ${len} حروف/أرقام\nالهدف: ${target} يوزر متاح\nأرسل ${usedPrefix}وقف-صيد للإيقاف`);

  for (let i = 0; i < maxRounds; i++) {
    const session = sessions.get(m.sender);
    if (!session?.hunting) break;
    if (session.found.length >= target) break;

    const batch = Array.from({ length: 20 }, () => generateRandomUsername(len));

    try {
      const res = await checkUsernames(conn, batch);
      const available = res.results.filter(r => r.response?.result === 'SUCCESS').map(r => r.username);

      if (available.length) {
        session.found.push(...available);
        const remaining = target - session.found.length;
        await conn.sendMessage(m.chat, {
          text: `🎉 *تم العثور على يوزرات متاحة!*\n${available.map(u => `✅ ${u}`).join('\n')}${remaining > 0 ? `\n\n📊 المتبقي للهدف: ${remaining}` : ''}`,
          footer: FOOTER
        });
      }

      session.tried += batch.length;
    } catch (e) {
      console.error('Hunt Error:', e.message);
      if (e.message?.includes('rate') || e.statusCode === 429) {
        await conn.sendMessage(m.chat, { text: '⚠️ تم إيقاف الصيد بسبب rate limit من واتساب', footer: FOOTER });
        break;
      }
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  const session = sessions.get(m.sender);
  const foundList = session?.found?.slice(0, target) || [];
  await conn.sendMessage(m.chat, {
    text: `✅ *انتهى الصيد*\n━━━━━━━━━━━━━━━━\n🔍 تمت تجربة: ${session?.tried || 0} يوزر\n🎯 تم الوصول: ${foundList.length}/${target}\n${foundList.length ? foundList.map(u => `• ${u}`).join('\n') : '❌ لم يتم العثور على يوزرات متاحة'}`,
    footer: FOOTER
  });

  sessions.delete(m.sender);
};

const handlerStop = async (m) => {
  const session = sessions.get(m.sender);
  if (!session?.hunting) return m.reply('❌ مفيش عملية صيد شغالة');
  session.hunting = false;
  return m.reply('🛑 جاري إيقاف الصيد...');
};

var handler = async (m, { conn, text, usedPrefix, command }) => {
  if (command === 'وقف-صيد') return handlerStop(m);

  const len = LENGTH_MAP[command];
  if (len) return handlerHunt(m, { conn, text, usedPrefix, len });
};

handler.help = [
  'يوزر-ثلاثي <عدد>',
  'يوزر-رباعي <عدد>',
  'يوزر-خماسي <عدد>',
  'يوزر-سداسي <عدد>',
  'يوزر-سباعي <عدد>',
  'يوزر-ثماني <عدد>',
  'وقف-صيد',
];
handler.tags = ['tools'];
handler.command = /^(يوزر-ثلاثي|يوزر-رباعي|يوزر-خماسي|يوزر-سداسي|يوزر-سباعي|يوزر-ثماني|وقف-صيد)$/i;

export default handler;