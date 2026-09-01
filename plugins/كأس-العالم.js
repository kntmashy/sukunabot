/**
 * plugins/كاس-العالم.js
 * أمر جلب مباريات كاس العالم 2026
 * 
 * ⚠️ مهم: اعمل حساب مجاني على https://www.football-data.org
 * وحط الـ API Key بتاعك في السطر التالي 👇
 */

const API_KEY = 'a1adc2734ed74710919a9fcba3416a6e';
const BASE_URL = 'https://api.football-data.org/v4';

// رموز المجموعات
const GROUP_EMOJIS = {
  'GROUP_A': '🅰️', 'GROUP_B': '🅱️', 'GROUP_C': '©️',
  'GROUP_D': '🇩', 'GROUP_E': '🇪', 'GROUP_F': '🇫',
  'GROUP_G': '🇬', 'GROUP_H': '🇭', 'GROUP_I': '🇮',
  'GROUP_J': '🇯', 'GROUP_K': '🇰', 'GROUP_L': '🇱',
};

// حالات المباراة بالعربي
const STATUS_AR = {
  'SCHEDULED': '❪🕐❫ *لَـمْ تَـبْـدَأ*',
  'TIMED':     '❪🕐❫ *لَـمْ تَـبْـدَأ*',
  'IN_PLAY':   '❪🔴❫ *جَـارِيَـةٌ الآنَ*',
  'PAUSED':    '❪⏸️❫ *اسْـتِـرَاحَـة*',
  'FINISHED':  '❪✅❫ *انْـتَـهَـت*',
  'SUSPENDED': '❪⚠️❫ *مَـوْقُـوفَـة*',
  'POSTPONED': '❪📅❫ *مُـؤَجَّـلَـة*',
  'CANCELLED': '❪❌❫ *مُـلْـغَـاة*',
};

// ==========================================
// جلب المباريات من الـ API
// ==========================================
async function fetchMatches(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'X-Auth-Token': API_KEY }
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

// ==========================================
// تنسيق وقت المباراة بتوقيت القاهرة (UTC+3)
// ==========================================
function formatTime(utcDate) {
  const date = new Date(utcDate);
  // تحويل لتوقيت القاهرة UTC+3
  const cairo = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  let hours = cairo.getUTCHours();
  const minutes = String(cairo.getUTCMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;
  const h = String(hours).padStart(2, '0');
  const d = cairo.getUTCDate();
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const mon = months[cairo.getUTCMonth()];
  return { time: `${h}:${minutes} ${period}`, date: `${d} ${mon}` };
}

// ==========================================
// تنسيق مباراة واحدة
// ==========================================
function formatMatch(match) {
  const home = match.homeTeam?.shortName || match.homeTeam?.name || '؟';
  const away = match.awayTeam?.shortName || match.awayTeam?.name || '؟';
  const status = STATUS_AR[match.status] || match.status;
  const { time, date } = formatTime(match.utcDate);
  const stage = match.stage === 'GROUP_STAGE' 
    ? (GROUP_EMOJIS[match.group] || '🏟️') + ' ' + (match.group?.replace('GROUP_', 'مجموعة ') || '')
    : getStageName(match.stage);

  let score = '';
  if (match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED') {
    const h = match.score?.fullTime?.home ?? match.score?.halfTime?.home ?? '-';
    const a = match.score?.fullTime?.away ?? match.score?.halfTime?.away ?? '-';
    score = ` [ ${h} - ${a} ]`;
  }

  return (
    `╔══━━━❪⚽❫━━━══╗\n` +
    `║ ${stage}\n` +
    `╠══━━━━━━━━━━━━══╣\n` +
    `║ 🏠 *${home}*${score}\n` +
    `║ ✈️ *${away}*\n` +
    `║ ${status}\n` +
    `╠══━━━━━━━━━━━━══╣\n` +
    `║ ❪📅❫ ${date}  ❪🕐❫ ${time} القاهرة\n` +
    `╚══━━━❪🏆❫━━━══╝`
  );
}

function getStageName(stage) {
  const stages = {
    'GROUP_STAGE': '🏟️ دور المجموعات',
    'LAST_32': '🔥 دور الـ32',
    'LAST_16': '⚔️ دور الـ16',
    'QUARTER_FINALS': '🏆 ربع النهائي',
    'SEMI_FINALS': '🌟 نصف النهائي',
    'THIRD_PLACE': '🥉 المركز الثالث',
    'FINAL': '🏆 النهائي',
  };
  return stages[stage] || stage;
}

// ==========================================
// الهاندلر الرئيسي
// ==========================================
const handler = async (m, { conn, args }) => {
  // يقبل الأمر بمسافة (.كاس اليوم) أو بـ - (.كاس-اليوم)
  const raw = m.text?.trim() || '';
  const hyphenMatch = raw.match(/^[.!#/](?:كأس|كاس|wc|worldcup)-(.+)/i);
  const sub = (hyphenMatch ? hyphenMatch[1] : args[0] || 'اليوم').toLowerCase();

  await m.reply(
    `╔═══━━━❪⏳❫━━━═══╗\n` +
    `║ *جَـارِي جَـلْـبُ* ║\n` +
    `║ *الْـمَـبَـارِيَـاتِ...* ║\n` +
    `╚═══━━━❪⚽❫━━━═══╝`
  );

  try {
    let data, title, matches;

    if (sub === 'اليوم' || sub === 'today') {
      // مباريات اليوم
      const today = new Date().toISOString().split('T')[0];
      data = await fetchMatches(`/competitions/WC/matches?dateFrom=${today}&dateTo=${today}`);
      matches = data.matches || [];
      title = '📅 مباريات كأس العالم اليوم';

    } else if (sub === 'غد' || sub === 'tomorrow') {
      // مباريات الغد
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      data = await fetchMatches(`/competitions/WC/matches?dateFrom=${tomorrow}&dateTo=${tomorrow}`);
      matches = data.matches || [];
      title = '📅 مباريات كأس العالم غداً';

    } else if (sub === 'مباشر' || sub === 'live') {
      // المباريات الجارية
      data = await fetchMatches(`/competitions/WC/matches?status=IN_PLAY`);
      matches = data.matches || [];
      title = '🔴 المباريات الجارية الآن';

    } else if (sub === 'نتائج' || sub === 'results') {
      // آخر النتائج
      data = await fetchMatches(`/competitions/WC/matches?status=FINISHED`);
      matches = (data.matches || []).slice(-10).reverse();
      title = '✅ آخر نتائج كأس العالم';

    } else if (sub === 'قادمة' || sub === 'next') {
      // المباريات القادمة
      data = await fetchMatches(`/competitions/WC/matches?status=SCHEDULED`);
      matches = (data.matches || []).slice(0, 10);
      title = '🗓️ المباريات القادمة في كأس العالم';

    } else if (sub === 'جدول' || sub === 'table') {
      // الجدول الكامل للمجموعات
      data = await fetchMatches(`/competitions/WC/standings`);
      return await sendStandings(m, conn, data);

    } else {
      return m.reply(
        `╔═══━━━❪🏆❫━━━═══╗\n` +
        `║ ❪⚽❫ *أَوَامِرُ كَأْسِ الْعَالَمِ* ║\n` +
        `╚═══━━━❪🏆❫━━━═══╝\n\n` +
        `╔═══━━━❪📋❫━━━═══╗\n` +
        `║ ❪📅❫ *.كاس-اليوم* — مَبَارِيَاتُ الْيَوْمِ ║\n` +
        `║ ❪🌙❫ *.كاس-غد* — مَبَارِيَاتُ الْغَدِ ║\n` +
        `║ ❪🔴❫ *.كاس-مباشر* — جَارِيَةٌ الآنَ ║\n` +
        `║ ❪✅❫ *.كاس-نتائج* — آخِرُ النَّتَائِجِ ║\n` +
        `║ ❪🗓️❫ *.كاس-قادمة* — الْمَبَارِيَاتُ الْقَادِمَةُ ║\n` +
        `║ ❪📊❫ *.كاس-جدول* — تَرْتِيبُ الْمَجْمُوعَاتِ ║\n` +
        `╚═══━━━❪📋❫━━━═══╝\n\n` +
        `╔═══━━━❪⚡️❫━━━═══╗\n` +
        `║ ❪🔥❫ *𝑺𝑼𝑲𝑼𝑵𝑨 𝑩𝑶𝑻* ║\n` +
        `║ ❪👹❫ *𝑲𝑰𝑵𝑮 𝑶𝑭 𝑪𝑼𝑹𝑺𝑬𝑺* ║\n` +
        `╚═══━━━❪⚡️❫━━━═══╝`
      );
    }

    if (!matches.length) {
      return m.reply(
        `╔═══━━━❪❌❫━━━═══╗\n` +
        `║ *لَا تُوجَدُ مَبَارِيَاتٌ* ║\n` +
        `║ *مُتَاحَةٌ حَالِيًّا* ║\n` +
        `╚═══━━━❪❌❫━━━═══╝\n\n` +
        `╔═══━━━❪⚡️❫━━━═══╗\n` +
        `║ ❪🔥❫ *𝑺𝑼𝑲𝑼𝑵𝑨 𝑩𝑶𝑻* ║\n` +
        `╚═══━━━❪⚡️❫━━━═══╝`
      );
    }

    const lines = matches.map(formatMatch).join('\n\n');

    const msg =
      `╔═══━━━━━━━━━━━━━━━══╗\n` +
      `║  ❪⚽❫ *${title}*  ║\n` +
      `╚═══━━━━━━━━━━━━━━━══╝\n\n` +
      lines +
      `\n\n╔═══━━━❪⚡️❫━━━═══╗\n` +
      `║ ❪🔥❫ *𝑺𝑼𝑲𝑼𝑵𝑨 𝑩𝑶𝑻* ║\n` +
      `╚═══━━━❪⚡️❫━━━═══╝`;

    await conn.sendMessage(m.chat, { text: msg }, { quoted: m });

  } catch (err) {
    console.error('[كأس العالم]', err.message);

    if (err.message.includes('403') || err.message.includes('401')) {
      return m.reply(`❌ *خطأ في الـ API Key*\n\nتأكد إنك حاطط الـ API Key الصح في ملف الأمر.\n\nاعمل حساب مجاني على:\nhttps://www.football-data.org`);
    }

    await m.reply(`❌ فشل جلب المباريات: ${err.message}`);
  }
};

// ==========================================
// ترتيب المجموعات
// ==========================================
async function sendStandings(m, conn, data) {
  const standings = data.standings || [];
  if (!standings.length) return m.reply('❌ لا يوجد جدول متاح حالياً.');

  let text = 
    `╔═══━━━━━━━━━━━━━━━══╗\n` +
    `║ ❪🏆❫ *تَـرْتِـيبُ كَأْسِ الْعَالَمِ* ║\n` +
    `╚═══━━━━━━━━━━━━━━━══╝\n\n`;

  for (const group of standings) {
    const groupName = group.group?.replace('GROUP_', 'المجموعة ') || group.stage;
    text += `━━━ *${GROUP_EMOJIS[group.group] || '🏟️'} ${groupName}* ━━━\n`;

    for (const team of group.table) {
      const pos = team.position;
      const name = team.team?.shortName || team.team?.name;
      const pts = team.points;
      const w = team.won, d = team.draw, l = team.lost;
      const gd = team.goalDifference >= 0 ? `+${team.goalDifference}` : team.goalDifference;
      const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}.`;
      text += `${medal} *${name}* — ${pts} نقطة (${w}ف ${d}ت ${l}خ) فارق: ${gd}\n`;
    }
    text += '\n';
  }

  text += `╔═══━━━❪⚡️❫━━━═══╗\n` +
           `║ ❪🔥❫ *𝑺𝑼𝑲𝑼𝑵𝑨 𝑩𝑶𝑻* ║\n` +
           `║ ❪👹❫ *𝑲𝑰𝑵𝑮 𝑶𝑭 𝑪𝑼𝑹𝑺𝑬𝑺* ║\n` +
           `╚═══━━━❪⚡️❫━━━═══╝`;
  await conn.sendMessage(m.chat, { text }, { quoted: m });
}

handler.help    = ['كأس'];
handler.tags    = ['info'];
handler.command = /^(كأس|كاس|wc|worldcup)(-\S+)?$/i;

export default handler;