// plugins/باكات.js
// 🎁 تحدي الباكات — كل لاعب يفتح باكات فيها نجم مخفي وراه شرط تعجيزي!
import axios from 'axios';

// ================== إعدادات عامة ==================
const POSITION_ORDER = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
const SQUAD_SIZE = POSITION_ORDER.length; // 11
const POSITION_LABEL = {
  GK: 'حارس مرمى', RB: 'ظهير أيمن', CB: 'مدافع', LB: 'ظهير أيسر',
  DM: 'ارتكاز', CM: 'لاعب وسط', AM: 'صانع ألعاب',
  LW: 'وينج شمال', RW: 'وينج يمين', ST: 'رأس حربة',
};

const PLAYERS_DB = {
  GK: ['بوفون', 'نوير', 'كاسياس', 'أليسون', 'إيدرسون', 'كورتوا', 'دوناروما'],
  RB: ['الكسندر أرنولد', 'كافو', 'داني ألفيس', 'كارفخال', 'كانسيلو', 'كايل ووكر'],
  CB: ['راموس', 'فاندايك', 'بيكيه', 'كانافارو', 'ثياجو سيلفا', 'فاران', 'ماغواير', 'كومباني'],
  LB: ['روبرتو كارلوس', 'مارسيلو', 'جوردي ألبا', 'ألفونسو ديفيز', 'ثيو هيرنانديز', 'روبرتسون'],
  DM: ['كاسيميرو', 'بوسكيتس', 'نجولو كانتي', 'رودري', 'فابينيو', 'تشواميني'],
  CM: ['كروس', 'مودريتش', 'جيرارد', 'لامبارد', 'بيرلو', 'دي بروين'],
  AM: ['زيدان', 'ميسي', 'إنييستا', 'مارادونا', 'كاكا', 'أوزيل'],
  LW: ['نيمار', 'رونالدو (كريستيانو)', 'فينيسيوس', 'جريزمان', 'كفاراتسخيليا'],
  RW: ['محمد صلاح', 'جاريث بيل', 'رياض محرز', 'ساكا', 'لامين يامال'],
  ST: ['هالاند', 'بنزيما', 'لويس سواريز', 'ليفاندوفسكي', 'هاري كين', 'مبابي'],
};

// لاعبين مجهولين/مضحكين لو فشلت في الشرط التعجيزي 😅
const MYSTERY_PLAYERS = [
  'عثمان (محدش عارف هو مين)', 'زياد بتاع الحي', 'كابتن رمضان المعتزل',
  'واحد شايل الشنطة بس', 'حكم الشارع اتنقل يلعب', 'عمو اللي بيتفرج بس',
  'مصطفى الجزار', 'حد نايم في الدكة من زمان', 'واحد جاي من التمرين غلط',
];

const CONDITION_ICONS = ['🏆', '👕', '🔑', '🎯', '❓', '🧩', '⭐', '🔒'];

const FOOTER = '\n\n╭─────────────⊹\n│ 👹⌁ 𝐁𝐲 : 𝐒𝐔𝐊𝐔𝐍𝐀 ⌁👹\n╰─────────────⊹ 💀🔥';
const withCredit = (text) => `${text}${FOOTER}`;
const decorateTitle = (t) => `『 ${t} 』`;

const gamesStorage = new Map();

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildPersonalPools = () => {
  const pools = {};
  for (const pos of Object.keys(PLAYERS_DB)) pools[pos] = shuffle(PLAYERS_DB[pos]);
  return pools;
};

const takeFrom = (list) => (list.length ? list.shift() : null);
const randomMystery = () => MYSTERY_PLAYERS[Math.floor(Math.random() * MYSTERY_PLAYERS.length)];
const randomIcon = () => CONDITION_ICONS[Math.floor(Math.random() * CONDITION_ICONS.length)];

const createFreshGame = () => ({
  stage: 'IDLE', // IDLE -> JOINING -> RUNNING -> FINISHED
  starterId: null,
  players: new Map(), // userId -> { name, positionIndex, pools, squad: [], pendingPack: null }
  turnUserId: null,
});

const getGame = (groupId) => {
  if (!gamesStorage.has(groupId)) gamesStorage.set(groupId, createFreshGame());
  return gamesStorage.get(groupId);
};

const otherPlayerId = (game, userId) => [...game.players.keys()].find((id) => id !== userId);

const POSITION_ICON_MAP = {
  GK: '🥅', RB: '➡️', CB: '🛡️', LB: '⬅️', DM: '🧱',
  CM: '🎯', AM: '🎨', LW: '🏃‍♂️', RW: '🏃', ST: '⚡',
};

const squadStatus = (p) => {
  if (!p.squad.length) return '   لا يوجد لاعبين لسه';
  const byPos = new Map();
  for (const s of p.squad) {
    if (!byPos.has(s.position)) byPos.set(s.position, []);
    byPos.get(s.position).push(s);
  }
  const lines = ['```'];
  const seen = {};
  for (const pos of POSITION_ORDER) {
    seen[pos] = (seen[pos] || 0);
    const arr = byPos.get(pos) || [];
    const s = arr[seen[pos]];
    seen[pos]++;
    const label = `${POSITION_ICON_MAP[pos]} ${POSITION_LABEL[pos]}`.padEnd(14, ' ');
    lines.push(s ? `${label}: ${s.name}${s.isMystery ? ' 🃏' : ''}` : `${label}: —`);
  }
  lines.push('```');
  return lines.join('\n');
};

const playerCard = (p) =>
  `👤 *${p.name}*\n🧢 التشكيلة (${p.squad.length}/${SQUAD_SIZE}):\n${squadStatus(p)}`;

// ================== فتح الباكة ==================
const openPackFor = (game, userId) => {
  const p = game.players.get(userId);
  p.positionIndex++;
  if (p.positionIndex >= POSITION_ORDER.length) return null;
  const pos = POSITION_ORDER[p.positionIndex];
  const star = takeFrom(p.pools[pos]) || randomMystery();
  const correctChoice = Math.floor(Math.random() * 3) + 1; // 1..3، سري
  p.pendingPack = { position: pos, star, correctChoice, icon: randomIcon() };
  return p.pendingPack;
};

const resolvePackAnswer = (game, userId, choice) => {
  const p = game.players.get(userId);
  const pack = p.pendingPack;
  if (!pack) return null;
  const success = choice === pack.correctChoice;
  const entry = success
    ? { name: pack.star, position: pack.position, isMystery: false }
    : { name: randomMystery(), position: pack.position, isMystery: true };
  p.squad.push(entry);
  p.pendingPack = null;
  return { success, position: pack.position, star: pack.star, result: entry.name };
};

// ================== ملخص + AI ==================
const buildFinalSummary = (game) => {
  let msg = `🏆 ${decorateTitle('انتهى تحدي الباكات - التشكيلات النهائية')}\n\n`;
  for (const p of game.players.values()) msg += `${playerCard(p)}\n\n`;
  return msg;
};

async function getMatchResult(playersData) {
  const teamsText = playersData.map((p) =>
    `فريق ${p.name}: ${p.squad.map((s) => `${s.name} (${POSITION_LABEL[s.position]})`).join(', ')}`
  ).join('\n');

  const prompt = `أنت محلل كرة قدم خبير. بناءً على هذين الفريقين من لاعبين حقيقيين في أفضل مستواهم (وبعض اللاعبين المجهولين/المضحكين كنتيجة فشل في تحدي فتح الباكات):\n\n${teamsText}\n\nاكتب نتيجة مباراة واقعية ومثيرة بين الفريقين. اذكر:\n1. النتيجة النهائية\n2. أهداف كل فريق ومن سجلها وفي أي دقيقة\n3. تقييم قصير للمباراة (3-4 جمل) وتحديد الفريق الأقوى\nاكتب بالعربية فقط وبأسلوب تعليق رياضي.`;

  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.get(
        `https://nour-deepseek-api.vercel.app/chat?message=${encodeURIComponent(prompt)}`,
        { timeout: 15000 }
      );
      if (res.data?.success && res.data?.reply) return res.data.reply;
      throw new Error('استجابة غير صالحة');
    } catch (e) {
      console.error(`[باكات AI] محاولة ${attempt} فشلت:`, e.message);
    }
  }
  return null;
}

const finishGameAndAnnounce = async (m, conn, game, groupId, leadMsg) => {
  const summary = buildFinalSummary(game);
  const playersData = [...game.players.values()];
  gamesStorage.set(groupId, createFreshGame());

  await m.reply(withCredit(`${leadMsg}\n\n${summary}`));
  await m.reply('⚽ جاري تحليل التشكيلتين وتحديد الفريق الأقوى بالذكاء الاصطناعي...');
  const result = await getMatchResult(playersData);
  if (result) {
    await conn.sendMessage(groupId, {
      text: withCredit(`🏟️ ${decorateTitle('نتيجة المباراة النهائية')}\n\n${result}`)
    }, { quoted: m });
  } else {
    await m.reply(withCredit('❌ تعذر الحصول على نتيجة المباراة من AI.'));
  }
};

// ================== Handler ==================
const handler = async (m, { conn }) => {
  const groupId = m.chat;
  const userId = m.sender;
  const userName = m.pushName || 'مجهول';

  const parts = m.text.trim().split(/\s+/);
  const subCommand = parts[1] || 'مساعدة';
  const game = getGame(groupId);

  // ── مساعدة ──
  if (subCommand === 'مساعدة') {
    return m.reply(withCredit(
      `🎁 ${decorateTitle('تحدي الباكات')}\n\n` +
      `كل لاعب يفتح ${SQUAD_SIZE} باكة (مركز مركز) لبناء تشكيلته. كل باكة فيها نجم مخفي وراه شرط تعجيزي.. لو عديته ياخد النجم، ولو فشلت ياخد لاعب مجهول! 😅\n\n` +
      `\`.باكات بدء\` — تبدأ التحدي\n` +
      `\`.باكات انضم\` — تنضم كخصم\n` +
      `\`.باكات ابدأ\` — يبدأ صاحب التحدي\n` +
      `\`.باكات افتح\` — تفتح الباكة الجاية (في دورك)\n` +
      `\`.باكات جاوب <1/2/3>\` — تجاوب على الشرط التعجيزي\n` +
      `\`.باكات فريقي\` — تشوف تشكيلتك\n` +
      `\`.باكات الحالة\` — حالة التحدي\n` +
      `\`.باكات الغاء\` — إلغاء التحدي`
    ));
  }

  // ── إلغاء ──
  if (['الغاء', 'إلغاء'].includes(subCommand)) {
    if (game.stage === 'IDLE') return m.reply(withCredit('⚠️ مفيش تحدي شغال!'));
    if (!game.players.has(userId)) return m.reply('🚫 بس اللاعبين المسجلين يقدروا يلغوا!');
    gamesStorage.set(groupId, createFreshGame());
    return m.reply(withCredit(`🛑 تم إلغاء التحدي بواسطة ${userName}.`));
  }

  // ── بدء ──
  if (subCommand === 'بدء') {
    if (game.stage !== 'IDLE') return m.reply('⚠️ فيه تحدي شغال بالفعل!');
    game.stage = 'JOINING';
    game.starterId = userId;
    game.players = new Map([[userId, {
      name: userName, positionIndex: -1, pools: buildPersonalPools(), squad: [], pendingPack: null,
    }]]);
    return m.reply(withCredit(
      `🎁 ${decorateTitle('تحدي الباكات بدأ')}\n\n` +
      `عايز تنافس؟ اكتب: \`.باكات انضم\`\n` +
      `🧢 كل لاعب هيبني تشكيلة من ${SQUAD_SIZE} لاعبين عن طريق فتح باكات فيها شرط تعجيزي.\n` +
      `👥 اللاعبين: ${userName}\n\n` +
      `بعد ما حد ينضم، اكتب: \`.باكات ابدأ\``
    ));
  }

  // ── انضمام ──
  if (subCommand === 'انضم') {
    if (game.stage !== 'JOINING') return m.reply('❌ مفيش باب انضمام مفتوح!');
    if (game.players.has(userId)) return m.reply(`⚠️ أنت مسجل بالفعل يا ${userName}!`);
    if (game.players.size >= 2) return m.reply('❌ التحدي كامل (لاعبين بس)!');
    game.players.set(userId, {
      name: userName, positionIndex: -1, pools: buildPersonalPools(), squad: [], pendingPack: null,
    });
    return m.reply(withCredit(`✅ ${userName} انضم للتحدي! دلوقتي ممكن تبدأوا: \`.باكات ابدأ\``));
  }

  // ── ابدأ ──
  if (subCommand === 'ابدأ') {
    if (game.stage !== 'JOINING') return m.reply('❌ التحدي مش في مرحلة التسجيل!');
    if (userId !== game.starterId) return m.reply('🚫 بس اللي فتح التحدي يقدر يبدأه!');
    if (game.players.size < 2) return m.reply('❌ محتاج خصم واحد على الأقل، خليه يكتب `.باكات انضم`!');
    game.stage = 'RUNNING';
    game.turnUserId = game.starterId;
    const turnName = game.players.get(game.turnUserId).name;
    return m.reply(withCredit(
      `🔥 ${decorateTitle('بدأ تحدي الباكات رسمياً')}\n\n` +
      `الدور على: *${turnName}*\n` +
      `افتح أول باكة بـ: \`.باكات افتح\``
    ));
  }

  // ── افتح باكة ──
  if (subCommand === 'افتح') {
    if (game.stage !== 'RUNNING') return m.reply('❌ التحدي مش شغال دلوقتي!');
    if (!game.players.has(userId)) return m.reply('🚫 بس اللاعبين المسجلين يقدروا يفتحوا باكات!');
    if (userId !== game.turnUserId) return m.reply('⏳ استنى دورك!');
    const p = game.players.get(userId);
    if (p.pendingPack) return m.reply('⚠️ عندك باكة مفتوحة لسه محتاجة إجابة! اكتب `.باكات جاوب <1/2/3>`');
    if (p.squad.length >= SQUAD_SIZE) return m.reply('✅ تشكيلتك مكتملة بالفعل!');

    const pack = openPackFor(game, userId);
    if (!pack) return m.reply('✅ تشكيلتك مكتملة بالفعل!');

    return m.reply(withCredit(
      `🎁 ${decorateTitle(`باكة ${POSITION_LABEL[pack.position]}`)}\n\n` +
      `${pack.icon} فيها نجم مخفي.. بس لازم تعدي *الشرط التعجيزي* الأول!\n` +
      `🎲 اختار رقم من 1 لـ 3 (واحد بس صح):\n1️⃣  2️⃣  3️⃣\n\n` +
      `جاوب بـ: \`.باكات جاوب <رقم>\``
    ));
  }

  // ── جاوب ──
  if (subCommand === 'جاوب') {
    if (game.stage !== 'RUNNING') return m.reply('❌ التحدي مش شغال دلوقتي!');
    if (!game.players.has(userId)) return m.reply('🚫 بس اللاعبين المسجلين يقدروا يجاوبوا!');
    if (userId !== game.turnUserId) return m.reply('⏳ استنى دورك!');
    const p = game.players.get(userId);
    if (!p.pendingPack) return m.reply('⚠️ لسه ما فتحتش باكة! اكتب `.باكات افتح`');

    const choice = Number(parts[2]);
    if (![1, 2, 3].includes(choice)) return m.reply('❌ اختار رقم من 1 لـ 3 بس!');

    const result = resolvePackAnswer(game, userId, choice);
    let msg = result.success
      ? `✅ *${decorateTitle('عديت الشرط التعجيزي!')}*\n⭐ *${result.star}* (${POSITION_LABEL[result.position]}) انضم لتشكيلتك!`
      : `❌ *${decorateTitle('فشلت في الشرط التعجيزي!')}*\n🃏 الباكة طلعت فاضية.. حصلت على *${result.result}* بدل *${result.star}* 😂`;

    // الدور للاعب التاني
    const otherId = otherPlayerId(game, userId);
    game.turnUserId = otherId;

    const bothDone = [...game.players.values()].every((pl) => pl.squad.length >= SQUAD_SIZE);
    if (bothDone) {
      return finishGameAndAnnounce(m, conn, game, groupId, msg);
    }

    const otherPlayer = game.players.get(otherId);
    const otherStatus = otherPlayer.squad.length >= SQUAD_SIZE
      ? `فريقه مكتمل، بينتظر خصمه.`
      : `دوره دلوقتي، يفتح باكة بـ \`.باكات افتح\`.`;
    msg += `\n\n➡️ الدور على *${otherPlayer.name}* — ${otherStatus}`;

    // لو دور اللاعب التاني بس تشكيلته مكتملة، رجّع الدور للاعب الحالي لو لسه ناقصه
    if (otherPlayer.squad.length >= SQUAD_SIZE && p.squad.length < SQUAD_SIZE) {
      game.turnUserId = userId;
      msg += `\n(دلوقتي رجع الدور تاني لـ *${p.name}* عشان يكمل تشكيلته)`;
    }

    return m.reply(withCredit(msg));
  }

  // ── فريقي ──
  if (subCommand === 'فريقي') {
    const player = game.players.get(userId);
    if (!player) return m.reply('❌ أنت مش مشترك في تحدي حالي.');
    return m.reply(withCredit(playerCard(player)));
  }

  // ── الحالة ──
  if (['الحالة', 'حالة'].includes(subCommand)) {
    if (game.stage === 'IDLE') return m.reply('⚠️ مفيش تحدي شغال.');
    let msg = `📊 ${decorateTitle('حالة التحدي')}\n\n`;
    for (const p of game.players.values()) {
      msg += `👤 *${p.name}* — 🧢 ${p.squad.length}/${SQUAD_SIZE}\n`;
    }
    if (game.stage === 'RUNNING') {
      msg += `\n⏳ الدور على: *${game.players.get(game.turnUserId)?.name}*`;
    }
    return m.reply(withCredit(msg));
  }
};

handler.help = ['باكات'];
handler.tags = ['games'];
handler.command = /^(باكات|تحدي_الباكات|packs)$/i;

export default handler;