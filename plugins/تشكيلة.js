// ================== لعبة التشكيلة المخفية ==================
const POSITION_ORDER = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
const POSITION_LABEL = {
  GK: 'حارس مرمى',
  RB: 'ظهير أيمن',
  CB: 'مدافع',
  LB: 'ظهير أيسر',
  DM: 'ارتكاز',
  CM: 'لاعب وسط',
  AM: 'صانع ألعاب',
  LW: 'وينج شمال',
  RW: 'وينج يمين',
  ST: 'رأس حربة',
};

const ATTACK_POSITIONS = ['ST', 'AM', 'LW', 'RW', 'CM'];
const DEFENSE_POSITIONS = ['GK', 'CB', 'RB', 'LB', 'DM'];

const clubsPool = {
  'تشيلسي': {
    GK: [{ name: 'كورتوا', rating: 88 }, { name: 'بيتر تشيك', rating: 90 }, { name: 'كيبا', rating: 75 }],
    RB: [{ name: 'أزبيليكويتا', rating: 85 }, { name: 'ريس جيمس', rating: 83 }, { name: 'إيفانوفيتش', rating: 82 }],
    CB: [{ name: 'جون تيري', rating: 89 }, { name: 'تياجو سيلفا', rating: 87 }, { name: 'كارفاليو', rating: 84 }, { name: 'ديفيد لويز', rating: 80 }],
    LB: [{ name: 'أشلي كول', rating: 88 }, { name: 'ألونسو', rating: 80 }, { name: 'تشيلويل', rating: 78 }],
    DM: [{ name: 'ماكيليلي', rating: 87 }, { name: 'كانتي', rating: 88 }, { name: 'ميكيل', rating: 78 }],
    CM: [{ name: 'لامبارد', rating: 91 }, { name: 'إيسيان', rating: 83 }, { name: 'كوفاسيتش', rating: 79 }],
    AM: [{ name: 'هازارد', rating: 89 }, { name: 'خوان ماتا', rating: 83 }, { name: 'ماسون ماونت', rating: 80 }],
    LW: [{ name: 'أرين روبن', rating: 86 }, { name: 'هدسون أودوي', rating: 76 }, { name: 'بيرتراند', rating: 74 }],
    RW: [{ name: 'ويليان', rating: 82 }, { name: 'زواهاي', rating: 75 }, { name: 'ديبروين', rating: 78 }],
    ST: [{ name: 'دروجبا', rating: 91 }, { name: 'دييجو كوستا', rating: 85 }, { name: 'فيرناندو توريس', rating: 80 }, { name: 'سام كير', rating: 70 }],
  },
  'ريال مدريد': {
    GK: [{ name: 'كاسياس', rating: 90 }, { name: 'كورتوا', rating: 88 }, { name: 'لوبيز', rating: 76 }],
    RB: [{ name: 'أرنولد', rating: 79 }, { name: 'كارفخال', rating: 86 }, { name: 'ناتشو', rating: 70 }],
    CB: [{ name: 'راموس', rating: 91 }, { name: 'بيبي', rating: 85 }, { name: 'فاران', rating: 84 }, { name: 'مارتينيز', rating: 78 }],
    LB: [{ name: 'روبرتو كارلوس', rating: 90 }, { name: 'مارسيلو', rating: 88 }, { name: 'مندي', rating: 79 }],
    DM: [{ name: 'كاسيميرو', rating: 87 }, { name: 'تشابي ألونسو', rating: 87 }, { name: 'رويز', rating: 74 }],
    CM: [{ name: 'كروس', rating: 89 }, { name: 'تشواميني', rating: 82 }, { name: 'جوتي', rating: 80 }],
    AM: [{ name: 'زيدان', rating: 93 }, { name: 'مودريتش', rating: 89 }, { name: 'بيليجهام', rating: 87 }],
    LW: [{ name: 'رونالدو', rating: 94 }, { name: 'فينيسيوس', rating: 88 }, { name: 'روبن', rating: 82 }],
    RW: [{ name: 'هازارد', rating: 76 }, { name: 'رودريجو', rating: 85 }, { name: 'دي ماريا', rating: 83 }],
    ST: [{ name: 'رونالدو البرازيلي', rating: 92 }, { name: 'بنزيما', rating: 90 }, { name: 'مبابي', rating: 89 }, { name: 'هيغواين', rating: 79 }],
  },
  'برشلونة': {
    GK: [{ name: 'فالديز', rating: 85 }, { name: 'تير شتيجن', rating: 87 }, { name: 'براڤو', rating: 74 }],
    RB: [{ name: 'ألفيس', rating: 88 }, { name: 'روبيرتو', rating: 78 }, { name: 'إيمرسون', rating: 70 }],
    CB: [{ name: 'بويول', rating: 89 }, { name: 'بيكيه', rating: 87 }, { name: 'أراوخو', rating: 82 }, { name: 'مارتينيز', rating: 80 }],
    LB: [{ name: 'جوردي ألبا', rating: 86 }, { name: 'أبيدال', rating: 81 }, { name: 'بالدي', rating: 77 }],
    DM: [{ name: 'بوسكيتس', rating: 87 }, { name: 'يايا توريه', rating: 82 }, { name: 'دي يونج', rating: 80 }],
    CM: [{ name: 'تشافي', rating: 91 }, { name: 'بيدري', rating: 84 }, { name: 'إيبانيز', rating: 65 }],
    AM: [{ name: 'إنييستا', rating: 92 }, { name: 'رونالدينيو', rating: 92 }, { name: 'جافي', rating: 83 }],
    LW: [{ name: 'نيمار', rating: 90 }, { name: 'تييري هنري', rating: 89 }, { name: 'ديمبلي', rating: 78 }],
    RW: [{ name: 'ميسي', rating: 96 }, { name: 'رافينيا', rating: 80 }, { name: 'بيدرو', rating: 77 }],
    ST: [{ name: 'إيتو', rating: 89 }, { name: 'رونالدو البرازيلي', rating: 90 }, { name: 'لويس صواريز', rating: 89 }, { name: 'ستويتشكوف', rating: 78 }],
  },
  'منتخب البرازيل': {
    GK: [{ name: 'ديدا', rating: 84 }, { name: 'أليسون', rating: 88 }, { name: 'تافاريل', rating: 75 }],
    RB: [{ name: 'كافو', rating: 88 }, { name: 'مايكون', rating: 82 }, { name: 'ألفيس', rating: 86 }],
    CB: [{ name: 'تياجو سيلفا', rating: 87 }, { name: 'لوسيو', rating: 84 }, { name: 'ألديير', rating: 74 }, { name: 'سانتوس', rating: 76 }],
    LB: [{ name: 'روبرتو كارلوس', rating: 91 }, { name: 'مارسيلو', rating: 87 }, { name: 'جونيور', rating: 72 }],
    DM: [{ name: 'دونجا', rating: 82 }, { name: 'جيلبرتو سيلفا', rating: 80 }, { name: 'كاسيميرو', rating: 85 }],
    CM: [{ name: 'خوسيه', rating: 68 }, { name: 'زيتو', rating: 79 }, { name: 'باولينيو', rating: 77 }],
    AM: [{ name: 'زيكو', rating: 90 }, { name: 'كاكا', rating: 90 }, { name: 'ريفالدو', rating: 88 }],
    LW: [{ name: 'رومارينيو', rating: 70 }, { name: 'روبينيو', rating: 80 }, { name: 'نيمار', rating: 90 }],
    RW: [{ name: 'جارينشا', rating: 90 }, { name: 'رونالدينيو', rating: 92 }, { name: 'فيرمينو', rating: 78 }],
    ST: [{ name: 'بيليه', rating: 97 }, { name: 'رونالدو البرازيلي', rating: 93 }, { name: 'روماريو', rating: 90 }, { name: 'أدريانو', rating: 82 }],
  },
};

const CLUB_NAMES = Object.keys(clubsPool);
const FOOTER = '\n\n╭─────────────⊹\n│ 👹⌁ 𝐁𝐲 : 𝐒𝐔𝐊𝐔𝐍𝐀 ⌁👹\n╰─────────────⊹ 💀🔥';
const decorateTitle = (title) => `『 ${title} 』`;
const withCredit = (text) => `${text}${FOOTER}`;

const SQUAD_SIZE = 11;
const FILLER_PLAYERS = [{ name: 'لاعب احتياطي', rating: 60 }, { name: 'صاعد', rating: 58 }, { name: 'لاعب تجربة', rating: 55 }];

const squadStorage = new Map();

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildClubPools = (clubName) => {
  const pools = {};
  const posCount = {};
  for (const pos of POSITION_ORDER) {
    posCount[pos] = (posCount[pos] || 0) + 1;
  }
  for (const pos of Object.keys(posCount)) {
    const needed = posCount[pos] * 2;
    const available = shuffle(clubsPool[clubName][pos]).map(p => ({ ...p }));
    while (available.length < needed) {
      available.push(...shuffle(clubsPool[clubName][pos]).map(p => ({ ...p })));
    }
    pools[pos] = available;
  }
  return pools;
};

const createFreshGame = () => ({
  stage: 'IDLE',
  teams: new Map(),
  club: null,
  pools: {},
  positionIndex: 0,
  currentOptions: null,
  pickerOrder: [],
  pickerIndex: 0,
  starterId: null,
  endRequestedBy: null,
});

const getGame = (groupId) => {
  if (!squadStorage.has(groupId)) {
    squadStorage.set(groupId, createFreshGame());
  }
  return squadStorage.get(groupId);
};

const drawPlayer = (pool) => {
  if (pool.length === 0) return { ...FILLER_PLAYERS[Math.floor(Math.random() * FILLER_PLAYERS.length)] };
  const i = Math.floor(Math.random() * pool.length);
  const [chosen] = pool.splice(i, 1);
  return chosen;
};

const preparePositionOptions = (game) => {
  const pos = POSITION_ORDER[game.positionIndex];
  const pool = game.pools[pos];
  const optionA = drawPlayer(pool);
  const optionB = drawPlayer(pool);
  const [known, hidden] = Math.random() < 0.5 ? [optionA, optionB] : [optionB, optionA];
  game.currentOptions = { known, hidden };
  return { pos, known, hidden };
};

const currentPickerId = (game) => game.pickerOrder[game.pickerIndex];
const partnerId = (game) => game.pickerOrder[(game.pickerIndex + 1) % game.pickerOrder.length];

const playerLine = (p, label) => `${label}: ${p.name} (⭐ ${p.rating})`;

const avgRatingByPositions = (squad, positions) => {
  const list = squad.filter((p) => positions.includes(p.position));
  if (list.length === 0) return 65;
  return list.reduce((s, p) => s + p.rating, 0) / list.length;
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const expectedGoals = (attack, defense) => clamp(1.4 + (attack - defense) / 25, 0.2, 4.5);
const rollGoals = (xg) => Math.max(0, Math.round(xg + (Math.random() - 0.5) * 2));

const pickScorer = (squad) => {
  const weighted = [];
  for (const p of squad) {
    let weight = 1;
    if (p.position === 'ST') weight = 6;
    else if (p.position === 'AM' || p.position === 'LW' || p.position === 'RW') weight = 3;
    else if (p.position === 'CM') weight = 2;
    for (let i = 0; i < weight; i++) weighted.push(p);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
};

const simulateMatch = (teamA, teamB) => {
  const attackA = avgRatingByPositions(teamA.squad, ATTACK_POSITIONS);
  const defenseA = avgRatingByPositions(teamA.squad, DEFENSE_POSITIONS);
  const attackB = avgRatingByPositions(teamB.squad, ATTACK_POSITIONS);
  const defenseB = avgRatingByPositions(teamB.squad, DEFENSE_POSITIONS);

  const goalsA = rollGoals(expectedGoals(attackA, defenseB));
  const goalsB = rollGoals(expectedGoals(attackB, defenseA));

  const tally = (squad, goals) => {
    const map = new Map();
    for (let i = 0; i < goals; i++) {
      const scorer = pickScorer(squad);
      if (!scorer) continue;
      map.set(scorer.name, (map.get(scorer.name) || 0) + 1);
    }
    return [...map.entries()].map(([name, count]) => (count > 1 ? `${name} (${count})` : name));
  };

  return {
    goalsA,
    goalsB,
    scorersA: tally(teamA.squad, goalsA),
    scorersB: tally(teamB.squad, goalsB),
  };
};

const buildFinalSummary = (game) => {
  const ids = game.pickerOrder;
  let msg = `🏟️ ${decorateTitle('انتهت التشكيلة - وقت المحاكاة')}\n\n`;
  msg += `🏛️ النادي: *${game.club}*\n\n`;

  for (const id of ids) {
    const team = game.teams.get(id);
    msg += `👤 *${team.name}*\n`;
    msg += team.squad
      .map((p, i) => `   ${i + 1}. ${p.name} (${POSITION_LABEL[p.position]}) - ⭐ ${p.rating}`)
      .join('\n');
    msg += '\n\n';
  }

  if (ids.length >= 2) {
    const teamA = game.teams.get(ids[0]);
    const teamB = game.teams.get(ids[1]);
    const result = simulateMatch(teamA, teamB);
    msg += `⚽ ${decorateTitle('نتيجة المباراة')}\n\n`;
    msg += `*${teamA.name}* ${result.goalsA} - ${result.goalsB} *${teamB.name}*\n\n`;
    msg += `🥅 هدافو ${teamA.name}:\n${result.scorersA.length ? result.scorersA.join('\n') : '   لا يوجد'}\n\n`;
    msg += `🥅 هدافو ${teamB.name}:\n${result.scorersB.length ? result.scorersB.join('\n') : '   لا يوجد'}`;
  } else {
    msg += '⚠️ محتاج فريقين على الأقل عشان تتعمل محاكاة.';
  }

  return msg;
};

const handler = async (m, { conn }) => {
  const groupId = m.chat;
  const userId = m.sender;
  const userName = m.pushName || 'مدير';

  const text = m.text.trim();
  const parts = text.split(/\s+/);
  const subCommand = (parts[1] || 'بدء').toLowerCase();

  const game = getGame(groupId);

  // ── إنهاء/إلغاء: فقط اللاعبين المسجلين، وبموافقة الطرف التاني لو أكتر من فريق ──
  if (subCommand === 'انهاء' || subCommand === 'الغاء' || subCommand === 'إلغاء') {
    if (game.stage === 'IDLE') {
      return m.reply(withCredit('⚠️ مفيش لعبة شغالة!'));
    }
    if (!game.teams.has(userId)) {
      return m.reply('🚫 بس اللاعبين المسجلين في اللعبة يقدروا ينهوها!');
    }

    // لو فريق واحد بس مسجل، مفيش حد لازم يوافق
    if (game.teams.size <= 1) {
      squadStorage.set(groupId, createFreshGame());
      return m.reply(withCredit(`🛑 تم إنهاء اللعبة بواسطة ${userName}.`));
    }

    // لو نفس الشخص اللي طلب الإنهاء يكرر الطلب
    if (game.endRequestedBy === userId) {
      return m.reply('⏳ لسه مستني موافقة فريق تاني على الإنهاء!');
    }

    // لو حد تاني وافق على طلب إنهاء موجود بالفعل
    if (game.endRequestedBy && game.endRequestedBy !== userId) {
      const requesterTeam = game.teams.get(game.endRequestedBy);
      squadStorage.set(groupId, createFreshGame());
      return m.reply(withCredit(
        `🛑 تم إنهاء اللعبة.\n👥 بموافقة ${userName} على طلب ${requesterTeam?.name || 'فريق آخر'}.`
      ));
    }

    // أول طلب إنهاء
    game.endRequestedBy = userId;
    return m.reply(withCredit(
      `⚠️ ${userName} طلب إنهاء اللعبة.\n` +
      `عشان الإنهاء يتم، لازم فريق تاني مسجل يكتب: \`.تشكيلة انهاء\` للموافقة.`
    ));
  }

  if (subCommand === 'بدء') {
    if (game.stage !== 'IDLE') {
      return m.reply('⚠️ فيه لعبة شغالة بالفعل!');
    }
    const club = CLUB_NAMES[Math.floor(Math.random() * CLUB_NAMES.length)];
    game.stage = 'JOINING';
    game.teams = new Map([[userId, { name: userName, squad: [] }]]);
    game.club = club;
    game.pools = buildClubPools(club);
    game.positionIndex = 0;
    game.starterId = userId;
    game.endRequestedBy = null;

    return m.reply(withCredit(
      `🕵️ ${decorateTitle('التشكيلة المخفية بدأت')}\n\n` +
      `🏛️ النادي: *${club}*\n` +
      `.تشكيلة انا - سجل فريقك\n` +
      `🧢 11 لاعب لكل فريق\n` +
      `❓ كل مركز: لاعب واضح + مخفي\n` +
      `👥 المسجل: ${userName}`
    ));
  }

  if (subCommand === 'انا') {
    if (game.stage !== 'JOINING') {
      return m.reply('❌ مفيش تسجيل الآن!');
    }
    if (game.teams.has(userId)) {
      return m.reply('⚠️ أنت مسجل بالفعل!');
    }
    game.teams.set(userId, { name: userName, squad: [] });
    return m.reply(withCredit(`✅ تسجيل ${userName}\n👥 عدد الفرق: ${game.teams.size}`));
  }

  if (subCommand === 'ابدأ') {
    if (game.stage !== 'JOINING') {
      return m.reply('❌ مش في مرحلة التسجيل!');
    }
    if (!game.teams.has(userId)) {
      return m.reply('🚫 بس اللاعبين المسجلين يقدروا يبدأوا الاختيارات!');
    }
    if (game.teams.size < 2) {
      return m.reply('❌ محتاج فريقين على الأقل!');
    }

    game.pickerOrder = shuffle([...game.teams.keys()]);
    game.pickerIndex = 0;
    game.stage = 'PICKING';

    const { pos, known } = preparePositionOptions(game);
    const picker = game.teams.get(currentPickerId(game));

    return m.reply(withCredit(
      `🔥 ${decorateTitle('بدأت الاختيارات')}\n\n` +
      `🎯 المركز: *${POSITION_LABEL[pos]}*\n\n` +
      `1️⃣ ${playerLine(known, 'الواضح')}\n` +
      `2️⃣ المخفي ❓\n\n` +
      `👑 دور: *${picker.name}*\n` +
      '.تشكيلة هاته أو .تشكيلة خدو'
    ));
  }

  if (subCommand === 'هاته' || subCommand === 'خدو') {
    if (game.stage !== 'PICKING') {
      return m.reply('❌ مفيش اختيار متاح!');
    }
    if (!game.teams.has(userId)) {
      return m.reply('🚫 أنت مش مشترك في اللعبة دي!');
    }
    if (userId !== currentPickerId(game)) {
      const picker = game.teams.get(currentPickerId(game));
      return m.reply(`⚠️ دور ${picker.name}!`);
    }

    const pos = POSITION_ORDER[game.positionIndex];
    const { known, hidden } = game.currentOptions;
    const pickerTeam = game.teams.get(currentPickerId(game));
    const partnerTeam = game.teams.get(partnerId(game));

    const pickerGets = subCommand === 'هاته' ? known : hidden;
    const partnerGets = subCommand === 'هاته' ? hidden : known;

    pickerTeam.squad.push({ name: pickerGets.name, position: pos, rating: pickerGets.rating });
    if (partnerTeam && partnerTeam !== pickerTeam) {
      partnerTeam.squad.push({ name: partnerGets.name, position: pos, rating: partnerGets.rating });
    }

    let extraMsg = '';
    for (let i = 2; i < game.pickerOrder.length; i++) {
      const extraId = game.pickerOrder[(game.pickerIndex + i) % game.pickerOrder.length];
      const extraTeam = game.teams.get(extraId);
      const extraPlayer = drawPlayer(game.pools[pos]);
      extraTeam.squad.push({ name: extraPlayer.name, position: pos, rating: extraPlayer.rating });
      extraMsg += `\n🔄 ${extraTeam.name}: ${extraPlayer.name}`;
    }

    let msg = `✅ ${decorateTitle('تم الاختيار')}\n\n`;
    msg += `🎯 المركز: *${POSITION_LABEL[pos]}*\n`;
    msg += `👑 *${pickerTeam.name}*: *${pickerGets.name}* (⭐ ${pickerGets.rating})\n`;
    if (partnerTeam && partnerTeam !== pickerTeam) {
      msg += `🤝 *${partnerTeam.name}*: *${partnerGets.name}* (⭐ ${partnerGets.rating})`;
    }
    msg += extraMsg;

    game.positionIndex += 1;
    game.pickerIndex = (game.pickerIndex + 1) % game.pickerOrder.length;

    const allFull = [...game.teams.values()].every((t) => t.squad.length >= SQUAD_SIZE);
    if (allFull || game.positionIndex >= POSITION_ORDER.length) {
      const summary = buildFinalSummary(game);
      squadStorage.set(groupId, createFreshGame());
      return m.reply(withCredit(`${msg}\n\n${summary}`));
    }

    const { pos: nextPos, known: nextKnown } = preparePositionOptions(game);
    const nextPicker = game.teams.get(currentPickerId(game));
    msg += `\n\n➡️ ${decorateTitle(`مركز ${POSITION_LABEL[nextPos]}`)}\n`;
    msg += `1️⃣ ${playerLine(nextKnown, 'الواضح')}\n`;
    msg += `2️⃣ المخفي ❓\n\n`;
    msg += `👑 دور: *${nextPicker.name}*`;

    return m.reply(withCredit(msg));
  }

  if (subCommand === 'فريقي') {
    const team = game.teams.get(userId);
    if (!team) {
      return m.reply('❌ أنت مش مشترك!');
    }
    let msg = `👤 ${decorateTitle(`فريق ${team.name}`)}\n\n`;
    msg += `🧢 (${team.squad.length}/${SQUAD_SIZE}):\n`;
    msg += team.squad.length
      ? team.squad.map((p, i) => `${i + 1}. ${p.name} (${POSITION_LABEL[p.position]}) - ⭐ ${p.rating}`).join('\n')
      : 'لا يوجد';
    return m.reply(withCredit(msg));
  }

  if (subCommand === 'الحالة' || subCommand === 'الفرق') {
    if (game.stage === 'IDLE') {
      return m.reply('⚠️ مفيش لعبة شغالة!');
    }
    let msg = `📊 ${decorateTitle('حالة اللعبة')}\n\n`;
    msg += `🏛️ النادي: *${game.club}*\n`;
    if (game.stage === 'PICKING') {
      const pos = POSITION_ORDER[game.positionIndex];
      const picker = game.teams.get(currentPickerId(game));
      msg += `🎯 المركز: *${POSITION_LABEL[pos]}*\n`;
      msg += `👑 الدور: *${picker.name}*\n\n`;
    }
    for (const team of game.teams.values()) {
      msg += `👤 ${team.name}: ${team.squad.length}/${SQUAD_SIZE}\n`;
    }
    return m.reply(withCredit(msg));
  }

  return;
};

handler.help = [
  '.تشكيلة - لعبة جديدة',
  '.تشكيلة انا - سجل فريقك',
  '.تشكيلة ابدأ - ابدأ الاختيارات',
  '.تشكيلة هاته - اختر الواضح',
  '.تشكيلة خدو - اختر المخفي',
  '.تشكيلة فريقي - تشكيلتك',
  '.تشكيلة الحالة - حالة اللعبة',
  '.تشكيلة انهاء - اوقف اللعبة (يحتاج موافقة فريق تاني)',
];
handler.tags = ['game'];
handler.command = /^تشكيل[ةه]$/i;

export default handler;