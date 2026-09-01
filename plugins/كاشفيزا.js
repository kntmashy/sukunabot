// plugins/كاشفيزا.js
// 💵 كاش ولا 💳 فيزا؟! — لعبة مناقصات 1×1 لبناء أقوى تشكيلة من 6 لاعيبة
import axios from 'axios';

// ================== إعدادات عامة ==================
const SQUAD_SIZE = 6;
const CASH_BUDGET = 100_000_000;
const VISA_MIN = 20_000_000;
const VISA_MAX = 90_000_000;
const START_PRICE = 2_000_000;
const MIN_INCREMENT = 1_000_000;

const POSITION_ORDER = ['GK', 'CB', 'CM', 'AM', 'ST', 'RW'];
const POSITION_LABEL = {
  GK: 'حارس مرمى', CB: 'مدافع', CM: 'لاعب وسط',
  AM: 'صانع ألعاب', ST: 'رأس حربة', RW: 'وينج',
};

const PLAYERS_DB = {
  GK: {
    stars: ['بوفون', 'نوير', 'كاسياس', 'أليسون', 'أوبلاك'],
    downgrades: ['الشناوي', 'العويس', 'الموسيلم', 'بيكفورد'],
    bigDowngrades: ['حارس المركز الشبابي', 'حارس احتياطي رقم 3', 'حارس معتزل من زمان'],
  },
  CB: {
    stars: ['راموس', 'فاندايك', 'بيكيه', 'ثياجو سيلفا', 'كانافارو'],
    downgrades: ['هاري ماغواير', 'بن وايت', 'عبدالله العنبر', 'علي البليهي'],
    bigDowngrades: ['مدافع الدوري الرديف', 'مدافع بير السلم', 'مدافع اتعور بدري'],
  },
  CM: {
    stars: ['كروس', 'مودريتش', 'بوسكيتس', 'دي بروين', 'تشافي'],
    downgrades: ['غافي', 'بيدري', 'غوندوغان', 'ديكلان رايس'],
    bigDowngrades: ['وسط بير السلم', 'لاعب كان بيلعب في الجيم بس', 'متسرب من الأكاديمية'],
  },
  AM: {
    stars: ['زيدان', 'ميسي', 'إنييستا', 'مارادونا', 'كاكا'],
    downgrades: ['أوزيل', 'بيليجهام', 'موسيالا', 'توتي'],
    bigDowngrades: ['صانع ألعاب بلايستيشن بس', 'لاعب فري فاير مش فوتبول', 'خطيب الجامع اللي بيلعب في العيد'],
  },
  ST: {
    stars: ['رونالدو', 'مبابي', 'هالاند', 'بنزيما', 'سواريز'],
    downgrades: ['أوسيمين', 'ألفاريز', 'أوباميانج', 'لوكاكو'],
    bigDowngrades: ['مهاجم بير السلم', 'واحد بيلعب في الشارع', 'مهاجم اتقفل معاه كل حاجة'],
  },
  RW: {
    stars: ['محمد صلاح', 'نيمار', 'جاريث بيل', 'ساكا', 'لامين يامال'],
    downgrades: ['عمر مرموش', 'رياض محرز', 'فودين', 'جارود بوين'],
    bigDowngrades: ['جناح كورة الشارع', 'واحد بيجري بس مش بيلعب', 'لاعب فيفا مش حقيقي'],
  },
};

const FOOTER = '\n\n╭─────────────────⊹\n│ ✨ 𝑩𝒚 : 𝑺𝑼𝑲𝑼𝑵𝑨 ✨\n╰─────────────────⊹ 👑⚡';
const withCredit = (text) => `${text}${FOOTER}`;
const decorateTitle = (t) => `『 ${t} 』`;
const formatMoney = (n) => `${n.toLocaleString('en-US')} يورو`;

const gamesStorage = new Map();

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildPools = () => {
  const pools = {};
  for (const pos of POSITION_ORDER) {
    pools[pos] = {
      stars: shuffle(PLAYERS_DB[pos].stars),
      downgrades: shuffle(PLAYERS_DB[pos].downgrades),
      bigDowngrades: shuffle(PLAYERS_DB[pos].bigDowngrades),
    };
  }
  return pools;
};

const takeFrom = (list) => (list.length ? list.shift() : null);

const createFreshGame = () => ({
  stage: 'IDLE', // IDLE -> JOINING -> BIDDING -> FINISHED
  starterId: null,
  players: new Map(), // userId -> { name, cash, visa, instaPayUsed, pendingDebt, squad: [] }
  pools: {},
  positionIndex: -1,
  currentPosition: null,
  currentStar: null,
  currentBid: 0,
  currentBidderId: null,
  currentBidMethod: null,
  turnUserId: null,
  history: [],
});

const getGame = (groupId) => {
  if (!gamesStorage.has(groupId)) gamesStorage.set(groupId, createFreshGame());
  return gamesStorage.get(groupId);
};

const otherPlayerId = (game, userId) => [...game.players.keys()].find((id) => id !== userId);

// الفيزا مبلغ عشوائي سري لكل لاعب (بين الحد الأدنى والأقصى) — يتجدد مع كل لعبة جديدة
const randomVisaBudget = () => Math.floor(Math.random() * (VISA_MAX - VISA_MIN + 1)) + VISA_MIN;

const startPosition = (game, advance = true) => {
  if (advance) game.positionIndex++;
  if (game.positionIndex >= POSITION_ORDER.length) {
    game.stage = 'FINISHED';
    game.currentPosition = null;
    return null;
  }
  const pos = POSITION_ORDER[game.positionIndex];
  game.currentPosition = pos;
  game.currentStar = takeFrom(game.pools[pos].stars);
  game.currentBid = 0;
  game.currentBidderId = null;
  game.currentBidMethod = null;
  game.stage = 'BIDDING';
  if (!game.turnUserId) game.turnUserId = game.starterId;
  return game.currentStar;
};

const POSITION_ICON = { GK: '🥅', CB: '🛡️', CM: '🎯', AM: '🎨', ST: '⚡', RW: '🏹' };

const squadStatus = (p) => {
  if (!p.squad.length) return '   لا يوجد لاعبين لسه';
  const byPos = new Map(p.squad.map((s) => [s.position, s]));
  const lines = ['```'];
  for (const pos of POSITION_ORDER) {
    const s = byPos.get(pos);
    const label = `${POSITION_ICON[pos]} ${POSITION_LABEL[pos]}`.padEnd(14, ' ');
    lines.push(s ? `${label}: ${s.name} — ${s.tag}` : `${label}: —`);
  }
  lines.push('```');
  return lines.join('\n');
};

const playerCard = (p) => {
  let msg = `👤 *${p.name}*\n💵 كاش متبقي: ${formatMoney(p.cash)}`;
  if (p.pendingDebt > 0) msg += `\n⚠️ دين مستحق (هيتخصم في التسوية النهائية): ${formatMoney(p.pendingDebt)}`;
  msg += `\n🧢 التشكيلة (${p.squad.length}/${SQUAD_SIZE}):\n${squadStatus(p)}`;
  return msg;
};

const findLastStarEntry = (player) => {
  for (let i = player.squad.length - 1; i >= 0; i--) {
    if (player.squad[i].kind === 'star') return i;
  }
  return -1;
};

// ================== حسم المزايدة ==================
const resolveAuction = (game) => {
  const pos = game.currentPosition;
  const winnerId = game.currentBidderId;
  const loserId = otherPlayerId(game, winnerId);
  const winner = game.players.get(winnerId);
  const loser = game.players.get(loserId);
  let msg = '';

  if (game.currentBid === 0) {
    const dg1 = takeFrom(game.pools[pos].downgrades) || { };
    const dg2 = takeFrom(game.pools[pos].downgrades) || { };
    for (const [id, dg] of [[winnerId, dg1], [loserId, dg2]]) {
      const p = game.players.get(id);
      if (dg?.length === undefined && dg) {
        p.squad.push({ name: dg, position: pos, kind: 'downgrade', tag: '🔻 بدون مزايدة' });
      }
    }
    msg = `⏭️ محدش زايد على مركز *${POSITION_LABEL[pos]}*! كل الفريقين استلموا لاعب داون جريد.`;
    game.turnUserId = winnerId;
    return msg;
  }

  if (game.currentBidMethod === 'cash') {
    winner.cash -= game.currentBid;
    winner.squad.push({ name: game.currentStar, position: pos, kind: 'star', tag: `💵 ${formatMoney(game.currentBid)}` });
    game.history.push({ position: pos, winnerId, kind: 'star', squadIndex: winner.squad.length - 1 });
    msg = `✅ ${decorateTitle('تمت الصفقة كاش')}\n\n⚽ *${game.currentStar}* (${POSITION_LABEL[pos]}) انضم لفريق *${winner.name}* بمبلغ ${formatMoney(game.currentBid)} 💵`;
  } else {
    // فيزا — الرصيد سري، ويتحسم فورًا بمجرد الدفع
    const visaOk = game.currentBid <= winner.visa;
    if (visaOk) {
      winner.visa -= game.currentBid;
      winner.squad.push({ name: game.currentStar, position: pos, kind: 'star', tag: `💳✅ ${formatMoney(game.currentBid)}` });
      game.history.push({ position: pos, winnerId, kind: 'star', squadIndex: winner.squad.length - 1 });
      msg = `✅ ${decorateTitle('الفيزا اتقبلت فورًا')}\n\n⚽ *${game.currentStar}* (${POSITION_LABEL[pos]}) انضم لفريق *${winner.name}* بمبلغ ${formatMoney(game.currentBid)} 💳`;
    } else if (!winner.instaPayUsed) {
      const shortfall = game.currentBid - Math.max(winner.visa, 0);
      winner.visa = 0;
      winner.instaPayUsed = true;
      winner.pendingDebt = (winner.pendingDebt || 0) + shortfall;
      winner.squad.push({ name: game.currentStar, position: pos, kind: 'star', tag: `💳❌➡️🟢 تم الإنقاذ (دين ${formatMoney(shortfall)})` });
      game.history.push({ position: pos, winnerId, kind: 'star', squadIndex: winner.squad.length - 1 });
      msg = `💳❌ الفيزا اترفضت لفريق *${winner.name}*!\n🟢 استخدم كارت *إنستا باي* وأنقذ الصفقة!\n⚽ *${game.currentStar}* انضم له، بس هيتخصم ${formatMoney(shortfall)} من رصيده الكاش في التسوية النهائية.`;
    } else {
      game.history.push({ position: pos, winnerId, kind: 'declined', squadIndex: -1 });
      msg = `💳❌ *Visa Declined!* فريق *${winner.name}* خسر *${game.currentStar}* ولم يحصل على بديل في مركز ${POSITION_LABEL[pos]}! 😱`;
      const prevStarIdx = findLastStarEntry(winner);
      if (prevStarIdx !== -1) {
        const oldEntry = winner.squad[prevStarIdx];
        const bigPos = oldEntry.position;
        const bigDg = takeFrom(game.pools[bigPos].bigDowngrades);
        if (bigDg) {
          msg += `\n💀 وكمان *${oldEntry.name}* (${POSITION_LABEL[bigPos]}) اتحول لـ *${bigDg}* كعقوبة قاسية!`;
          winner.squad[prevStarIdx] = { name: bigDg, position: bigPos, kind: 'bigDowngrade', tag: '💀 عقوبة رفض فيزا' };
        }
      }
      game.turnUserId = winnerId;
      return msg;
    }
  }

  // الخاسر ياخد داون جريد عادي (بس لو الصفقة كانت كاش تنافسية فيها خصم فعلي شارك)
  if (game.currentBidMethod === 'cash') {
    const dg = takeFrom(game.pools[pos].downgrades);
    if (dg) {
      loser.squad.push({ name: dg, position: pos, kind: 'downgrade', tag: '🔻 داون جريد' });
      msg += `\n🔻 فريق *${loser.name}* حصل على *${dg}* (داون جريد) بدل ما يخسر المركز.`;
    }
  }

  game.turnUserId = winnerId;
  return msg;
};

// ================== ملخص نهائي + الذكاء الاصطناعي ==================
const settleDebts = (game) => {
  let note = '';
  for (const p of game.players.values()) {
    if (p.pendingDebt > 0) {
      const before = p.cash;
      p.cash = Math.max(p.cash - p.pendingDebt, 0);
      note += `\n💸 اتخصم ${formatMoney(before - p.cash)} من كاش *${p.name}* (تسوية ديون إنستا باي).`;
      p.pendingDebt = 0;
    }
  }
  return note;
};

const buildFinalSummary = (game) => {
  const debtNote = settleDebts(game);
  let msg = `🏆 ${decorateTitle('انتهت اللعبة - التشكيلات النهائية')}\n`;
  if (debtNote) msg += debtNote + '\n';
  msg += '\n';
  for (const p of game.players.values()) {
    msg += `${playerCard(p)}\n\n`;
  }
  return msg;
};

async function getMatchResult(playersData) {
  const teamsText = playersData.map((p) =>
    `فريق ${p.name}: ${p.squad.map((s) => `${s.name} (${POSITION_LABEL[s.position]})`).join(', ')}`
  ).join('\n');

  const prompt = `أنت محلل كرة قدم خبير. بناءً على هذين الفريقين من لاعبين حقيقيين في أفضل مستواهم (ولاعبين وهميين ضعاف كداون جريد):\n\n${teamsText}\n\nاكتب نتيجة مباراة واقعية ومثيرة بين الفريقين. اذكر:\n1. النتيجة النهائية\n2. أهداف كل فريق ومن سجلها وفي أي دقيقة\n3. تقييم قصير للمباراة (3-4 جمل) وتحديد أقوى تشكيلة\nاكتب بالعربية فقط وبأسلوب تعليق رياضي.`;

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
      console.error(`[كاشفيزا AI] محاولة ${attempt} فشلت:`, e.message);
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

  if (subCommand === 'مساعدة') {
    return m.reply(withCredit(
      `💵 ${decorateTitle('كاش ولا فيزا؟!')} 💳\n\n` +
      `لعبة 1×1: كل واحد يبني تشكيلة من ${SQUAD_SIZE} لاعيبة عن طريق مزايدات على كل مركز.\n\n` +
      `\`.كاشفيزا بدء\` — تبدأ اللعبة\n` +
      `\`.كاشفيزا انضم\` — تنضم كخصم\n` +
      `\`.كاشفيزا ابدأ\` — يبدأ صاحب اللعبة أول مزايدة\n` +
      `\`.كاشفيزا كاش <مبلغ>\` — تزايد بالكاش (رصيدك معروف، تنافسي مع خصمك)\n` +
      `\`.كاشفيزا فيزا <مبلغ>\` — تدفع بالفيزا (رصيدها سري.. ولو اتقبلت الصفقة بتتم على طول من غير ما تستنى خصمك!)\n` +
      `\`.كاشفيزا تخطي\` — تنسحب من مزايدة الكاش (بس لو الطرف التاني زايد كاش)\n` +
      `\`.كاشفيزا فريقي\` — تشوف تشكيلتك\n` +
      `\`.كاشفيزا الحالة\` — حالة اللعبة\n` +
      `\`.كاشفيزا الغاء\` — إلغاء اللعبة`
    ));
  }

  if (['الغاء', 'إلغاء'].includes(subCommand)) {
    if (game.stage === 'IDLE') return m.reply(withCredit('⚠️ مفيش لعبة شغالة!'));
    if (!game.players.has(userId)) return m.reply('🚫 بس اللاعبين المسجلين يقدروا يلغوا!');
    gamesStorage.set(groupId, createFreshGame());
    return m.reply(withCredit(`🛑 تم إلغاء اللعبة بواسطة ${userName}.`));
  }

  if (subCommand === 'بدء') {
    if (game.stage !== 'IDLE') return m.reply('⚠️ فيه لعبة شغالة بالفعل!');
    game.stage = 'JOINING';
    game.starterId = userId;
    game.players = new Map([[userId, {
      name: userName, cash: CASH_BUDGET,
      visa: randomVisaBudget(),
      instaPayUsed: false, pendingDebt: 0, squad: [],
    }]]);
    game.pools = buildPools();
    return m.reply(withCredit(
      `💵 ${decorateTitle('كاش ولا فيزا؟! بدأت اللعبة')} 💳\n\n` +
      `عايز تنافس؟ اكتب: \`.كاشفيزا انضم\`\n` +
      `💰 الكاش لكل لاعب: ${formatMoney(CASH_BUDGET)} (معروف)\n` +
      `💳 الفيزا: مبلغ عشوائي سري.. محدش عارفه غيرك انت والحكم! 😈\n` +
      `🧢 حجم التشكيلة: ${SQUAD_SIZE} لاعبين\n` +
      `👥 اللاعبين: ${userName}\n\n` +
      `بعد ما حد ينضم، اكتب: \`.كاشفيزا ابدأ\``
    ));
  }

  if (subCommand === 'انضم') {
    if (game.stage !== 'JOINING') return m.reply('❌ مفيش باب انضمام مفتوح!');
    if (game.players.has(userId)) return m.reply(`⚠️ أنت مسجل بالفعل يا ${userName}!`);
    if (game.players.size >= 2) return m.reply('❌ اللعبة كاملة (لاعبين بس)!');
    game.players.set(userId, {
      name: userName, cash: CASH_BUDGET,
      visa: randomVisaBudget(),
      instaPayUsed: false, pendingDebt: 0, squad: [],
    });
    return m.reply(withCredit(`✅ ${userName} انضم للتحدي! دلوقتي ممكن تبدأوا: \`.كاشفيزا ابدأ\``));
  }

  if (subCommand === 'ابدأ') {
    if (game.stage !== 'JOINING') return m.reply('❌ اللعبة مش في مرحلة التسجيل!');
    if (userId !== game.starterId) return m.reply('🚫 بس اللي فتح اللعبة يقدر يبدأها!');
    if (game.players.size < 2) return m.reply('❌ محتاج خصم واحد على الأقل، خليه يكتب `.كاشفيزا انضم`!');
    const star = startPosition(game, true);
    const turnName = game.players.get(game.turnUserId).name;
    return m.reply(withCredit(
      `🔥 ${decorateTitle('بدأت المناقصات رسمياً')}\n\n` +
      `⚽ المركز: *${POSITION_LABEL[game.currentPosition]}*\n` +
      `⭐ اللاعب المطروح: *${star}*\n` +
      `💵 سعر الافتتاح: ${formatMoney(START_PRICE)}\n\n` +
      `الدور على: *${turnName}*\n` +
      `زايد بـ: \`.كاشفيزا كاش <مبلغ>\` أو \`.كاشفيزا فيزا <مبلغ>\``
    ));
  }

  if (['كاش', 'فيزا'].includes(subCommand)) {
    if (game.stage !== 'BIDDING') return m.reply('❌ مفيش مزايدة مفتوحة دلوقتي!');
    if (!game.players.has(userId)) return m.reply('🚫 بس اللاعبين المسجلين يقدروا يزايدوا!');
    if (userId !== game.turnUserId) return m.reply('⏳ استنى دورك في المزايدة!');

    const rawAmount = parts[2];
    if (!rawAmount || isNaN(Number(rawAmount))) return m.reply('❌ اكتب مبلغ صحيح! مثال: `.كاشفيزا كاش 5`');
    let amount = Number(rawAmount);
    if (amount < 1000) amount *= 1_000_000;

    const minRequired = game.currentBid === 0 ? START_PRICE : game.currentBid + MIN_INCREMENT;
    if (amount < minRequired) return m.reply(`❌ أقل مبلغ مسموح: ${formatMoney(minRequired)}!`);

    const player = game.players.get(userId);
    const method = subCommand === 'كاش' ? 'cash' : 'visa';

    if (method === 'cash' && amount > player.cash)
      return m.reply(`❌ رصيدك الكاش مش كفاية! المتاح: ${formatMoney(player.cash)}`);

    game.currentBid = amount;
    game.currentBidderId = userId;
    game.currentBidMethod = method;

    // 💳 الفيزا بتتحسم فورًا: لو اتقبلت الصفقة تتم على طول من غير ما نستنى الخصم
    if (method === 'visa') {
      const resolveMsg = resolveAuction(game);
      const nextStar = startPosition(game, true);

      if (nextStar) {
        const turnName = game.players.get(game.turnUserId).name;
        return m.reply(withCredit(
          `${resolveMsg}\n\n➡️ ${decorateTitle(`مركز ${POSITION_LABEL[game.currentPosition]}`)}\n` +
          `⭐ اللاعب المطروح: *${nextStar}*\n💵 سعر الافتتاح: ${formatMoney(START_PRICE)}\n` +
          `الدور على: *${turnName}*`
        ));
      }
      return finishGameAndAnnounce(m, conn, game, groupId, resolveMsg);
    }

    // 💵 الكاش يفضل تنافسي زي ما هو
    game.turnUserId = otherPlayerId(game, userId);
    return m.reply(withCredit(
      `💵 ${userName} زايد بـ ${formatMoney(amount)} على *${game.currentStar}*!\n` +
      `الدور دلوقتي على *${game.players.get(game.turnUserId).name}*\n` +
      `يقدر يزايد أعلى أو يكتب \`.كاشفيزا تخطي\` عشان ينسحب.`
    ));
  }

  if (subCommand === 'تخطي') {
    if (game.stage !== 'BIDDING') return m.reply('❌ مفيش مزايدة مفتوحة!');
    if (!game.players.has(userId)) return m.reply('🚫 بس اللاعبين المسجلين يقدروا ينسحبوا!');
    if (userId !== game.turnUserId) return m.reply('⏳ استنى دورك!');
    if (!game.currentBidderId) return m.reply('⚠️ محدش زايد لسه، لازم حد يفتح المزايدة الأول!');
    if (userId === game.currentBidderId) return m.reply('⚠️ أنت صاحب أعلى مزايدة، مينفعش تنسحب من نفسك!');

    const resolveMsg = resolveAuction(game);
    const nextStar = startPosition(game, true);

    if (nextStar) {
      const turnName = game.players.get(game.turnUserId).name;
      return m.reply(withCredit(
        `${resolveMsg}\n\n➡️ ${decorateTitle(`مركز ${POSITION_LABEL[game.currentPosition]}`)}\n` +
        `⭐ اللاعب المطروح: *${nextStar}*\n💵 سعر الافتتاح: ${formatMoney(START_PRICE)}\n` +
        `الدور على: *${turnName}*`
      ));
    }
    return finishGameAndAnnounce(m, conn, game, groupId, resolveMsg);
  }

  if (subCommand === 'فريقي') {
    const player = game.players.get(userId);
    if (!player) return m.reply('❌ أنت مش مشترك في لعبة حالية.');
    return m.reply(withCredit(playerCard(player)));
  }

  if (['الحالة', 'حالة'].includes(subCommand)) {
    if (game.stage === 'IDLE') return m.reply('⚠️ مفيش لعبة شغالة.');
    let msg = `📊 ${decorateTitle('حالة اللعبة')}\n\n`;
    for (const p of game.players.values()) {
      msg += `👤 *${p.name}* — 💵 ${formatMoney(p.cash)} — 🧢 ${p.squad.length}/${SQUAD_SIZE} — 🟢 إنستا باي: ${p.instaPayUsed ? 'مستخدم' : 'متاح'}\n`;
    }
    if (game.stage === 'BIDDING' && game.currentStar) {
      msg += `\n⚽ المركز الحالي: *${POSITION_LABEL[game.currentPosition]}*\n⭐ اللاعب المطروح: *${game.currentStar}*\n`;
      msg += game.currentBidderId
        ? `💰 أعلى مزايدة: ${formatMoney(game.currentBid)} (${game.currentBidMethod === 'cash' ? '💵' : '💳'}) — ${game.players.get(game.currentBidderId).name}\n`
        : `💰 مفيش حد زايد لسه\n`;
      msg += `⏳ الدور على: *${game.players.get(game.turnUserId)?.name}*`;
    }
    return m.reply(withCredit(msg));
  }
};

handler.help = ['كاشفيزا'];
handler.tags = ['games'];
handler.command = /^(كاشفيزا|كاش_فيزا|cashvisa)$/i;

export default handler;