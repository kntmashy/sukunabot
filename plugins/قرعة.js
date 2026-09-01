/**
 * plugins/قرعة.js
 * امر قرعة لتقسيم الاسامي لفرق
 * الاستخدام: .قرعة اسم1 اسم2 اسم3 اسم4 اسم5 اسم6
 * او: .قرعة 3 اسم1 اسم2 اسم3 اسم4 اسم5 اسم6  (لتحديد عدد الفرق)
 */

function shuffle(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function splitIntoTeams(names, teamCount) {
  const shuffled = shuffle(names);
  const teams = Array.from({ length: teamCount }, () => []);
  shuffled.forEach((name, i) => {
    teams[i % teamCount].push(name);
  });
  return teams;
}

const TEAM_EMOJIS = ['🔴', '🔵', '🟡', '🟢', '🟠', '🟣'];
const TEAM_NAMES = ['الفريق الأول', 'الفريق الثاني', 'الفريق الثالث', 'الفريق الرابع', 'الفريق الخامس', 'الفريق السادس'];

const handler = async (m, { conn, args }) => {
  if (!args || args.length < 2) {
    return m.reply(
      `❌ *طريقة الاستخدام:*\n\n` +
      `*.قرعة اسم1 اسم2 اسم3 اسم4*\n` +
      `_(هيقسم الاسامي لفريقين تلقائياً)_\n\n` +
      `*.قرعة 3 اسم1 اسم2 اسم3 اسم4 اسم5 اسم6*\n` +
      `_(الرقم الأول بيحدد عدد الفرق)_`
    );
  }

  let names = [...args];
  let teamCount = 2; // افتراضي فريقين

  // لو الأرجومنت الأول رقم → هو عدد الفرق
  if (/^\d+$/.test(names[0])) {
    teamCount = parseInt(names[0]);
    names = names.slice(1);
  }

  // تحقق من المدخلات
  if (teamCount < 2 || teamCount > 6) {
    return m.reply('❌ عدد الفرق لازم يكون بين 2 و 6');
  }

  if (names.length < teamCount) {
    return m.reply(`❌ عدد الأسامي (${names.length}) أقل من عدد الفرق (${teamCount})`);
  }

  const teams = splitIntoTeams(names, teamCount);

  let result = `🎲 *نتيجة القرعة!*\n`;
  result += `━━━━━━━━━━━━━━━\n\n`;

  teams.forEach((team, i) => {
    result += `${TEAM_EMOJIS[i]} *${TEAM_NAMES[i]}:*\n`;
    team.forEach(name => {
      result += `  • ${name}\n`;
    });
    result += '\n';
  });

  result += `━━━━━━━━━━━━━━━\n`;
  result += `> `;

  await conn.sendMessage(m.chat, { text: result }, { quoted: m });
};

handler.help    = ['قرعة'];
handler.tags    = ['fun'];
handler.command = /^(قرعة|draw|teams)$/i;

export default handler;