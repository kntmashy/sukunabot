// plugins/مزاد.js
import axios from 'axios';

// ================== قائمة اللاعبين ==================
const footballersPool = [
  // ===== حراس مرمى (GK) =====
  { name: 'بوفون', position: 'GK' },
  { name: 'إيكر كاسياس', position: 'GK' },
  { name: 'مانويل نوير', position: 'GK' },
  { name: 'ياشين', position: 'GK' },
  { name: 'أوليفر كان', position: 'GK' },
  { name: 'ديدا', position: 'GK' },
  { name: 'بيتر شمايكل', position: 'GK' },
  { name: 'ديانو زوف', position: 'GK' },
  { name: 'تير شتيجن', position: 'GK' },
  { name: 'أليسون', position: 'GK' },
  { name: 'إيديرسون', position: 'GK' },
  { name: 'دي خيا', position: 'GK' },
  { name: 'كيبا', position: 'GK' },
  { name: 'نافاس', position: 'GK' },
  { name: 'أوبلاك', position: 'GK' },
  { name: 'كورتوا', position: 'GK' },
  { name: 'دوناروما', position: 'GK' },
  { name: 'فيكتور فالديز', position: 'GK' },
  { name: 'محمد الشناوي', position: 'GK' },
  { name: 'إسلام جابر', position: 'GK' },
  { name: 'محمد العويس', position: 'GK' },
  { name: 'ياسر الموسيلم', position: 'GK' },
  { name: 'جوردان بيكفورد', position: 'GK' },
  { name: 'نيك بوب', position: 'GK' },
  { name: 'ديفيد سيمان', position: 'GK' },
  { name: 'جو هارت', position: 'GK' },
  { name: 'هوغو لوريس', position: 'GK' },
  { name: 'جيانلويجي دوناروما', position: 'GK' },
  { name: 'أندريه أونانا', position: 'GK' },

  // ===== ظهير أيمن (RB) =====
  { name: 'الكسندر أرنولد', position: 'RB' },
  { name: 'كافو', position: 'RB' },
  { name: 'داني ألفيس', position: 'RB' },
  { name: 'كارفخال', position: 'RB' },
  { name: 'كانسيلو', position: 'RB' },
  { name: 'ليليان تورام', position: 'RB' },
  { name: 'مايكون', position: 'RB' },
  { name: 'ريس جيمس', position: 'RB' },
  { name: 'كايل ووكر', position: 'RB' },
  { name: 'أحمد سامي', position: 'RB' },
  { name: 'محمد عبد المنعم', position: 'RB' },
  { name: 'سلطان الغنام', position: 'RB' },
  { name: 'عبدالله عطيف', position: 'RB' },
  { name: 'سيرج أورييه', position: 'RB' },
  { name: 'دارميان', position: 'RB' },

  // ===== مدافع (CB) =====
  { name: 'راموس', position: 'CB' },
  { name: 'فاندايك', position: 'CB' },
  { name: 'بويول', position: 'CB' },
  { name: 'كانافارو', position: 'CB' },
  { name: 'باولو مالديني', position: 'CB' },
  { name: 'فرانز بيكنباور', position: 'CB' },
  { name: 'بوبي مور', position: 'CB' },
  { name: 'ثياجو سيلفا', position: 'CB' },
  { name: 'فينسنت كومباني', position: 'CB' },
  { name: 'جيرارد بيكيه', position: 'CB' },
  { name: 'رافاييل فاران', position: 'CB' },
  { name: 'ألساندرو نيستا', position: 'CB' },
  { name: 'ريو فرديناند', position: 'CB' },
  { name: 'جون تيري', position: 'CB' },
  { name: 'روبن دياز', position: 'CB' },
  { name: 'باو كوبارسي', position: 'CB' },
  { name: 'توني أدامز', position: 'CB' },
  { name: 'وليد سليمان', position: 'CB' },
  { name: 'محمد حمدي الجوكر', position: 'CB' },
  { name: 'أيمن أشرف', position: 'CB' },
  { name: 'عمر جابر', position: 'CB' },
  { name: 'عبدالله العنبر', position: 'CB' },
  { name: 'علي البليهي', position: 'CB' },
  { name: 'هاري ماغواير', position: 'CB' },
  { name: 'بن وايت', position: 'CB' },
  { name: 'ويليام سالييبا', position: 'CB' },
  { name: 'مانييه', position: 'CB' },

  // ===== ظهير أيسر (LB) =====
  { name: 'روبرتو كارلوس', position: 'LB' },
  { name: 'أندرو روبرتسون', position: 'LB' },
  { name: 'مارسيلو', position: 'LB' },
  { name: 'أشلي كول', position: 'LB' },
  { name: 'باتريس إيفرا', position: 'LB' },
  { name: 'جوردي ألبا', position: 'LB' },
  { name: 'ثيو هيرنانديز', position: 'LB' },
  { name: 'لوكاس هيرنانديز', position: 'LB' },
  { name: 'بن تشيلويل', position: 'LB' },
  { name: 'محمد هاني', position: 'LB' },
  { name: 'يحيى الشهري', position: 'LB' },
  { name: 'سعد الزهراني', position: 'LB' },
  { name: 'ألفونسو ديفيز', position: 'LB' },
  { name: 'ستيوارت بيرس', position: 'LB' },

  // ===== ارتكاز (DM) =====
  { name: 'كاسيميرو', position: 'DM' },
  { name: 'فابينيو', position: 'DM' },
  { name: 'نجولو كانتي', position: 'DM' },
  { name: 'سيرجيو بوسكيتس', position: 'DM' },
  { name: 'كلود ماكيليلي', position: 'DM' },
  { name: 'رودري', position: 'DM' },
  { name: 'تشابي ألونسو', position: 'DM' },
  { name: 'باتريك فييرا', position: 'DM' },
  { name: 'إدجار ديفيدز', position: 'DM' },
  { name: 'تشواميني', position: 'DM' },
  { name: 'ديكلان رايس', position: 'DM' },
  { name: 'عمرو جمال', position: 'DM' },
  { name: 'عبدالرحمن الغامدي', position: 'DM' },
  { name: 'محمد كنو', position: 'DM' },
  { name: 'توماس بارتي', position: 'DM' },
  { name: 'مارك فان بومل', position: 'DM' },
  { name: 'ماتيو غيندوزي', position: 'DM' },

  // ===== لاعب وسط (CM) =====
  { name: 'كروس', position: 'CM' },
  { name: 'ستيفن جيرارد', position: 'CM' },
  { name: 'فرانك لامبارد', position: 'CM' },
  { name: 'أندريا بيرلو', position: 'CM' },
  { name: 'بافيل نيدفيد', position: 'CM' },
  { name: 'باستيان شفاينشتايجر', position: 'CM' },
  { name: 'مايكل بالاك', position: 'CM' },
  { name: 'كامافينجا', position: 'CM' },
  { name: 'بول سكولز', position: 'CM' },
  { name: 'يايا توريه', position: 'CM' },
  { name: 'محمد بركات', position: 'CM' },
  { name: 'سامي الجابر (وسط)', position: 'CM' },
  { name: 'جاك ويلشير', position: 'CM' },
  { name: 'إيلكاي غوندوغان', position: 'CM' },
  { name: 'مارتن أودجارد', position: 'CM' },
  { name: 'غافي', position: 'CM' },
  { name: 'بيدري', position: 'CM' },

  // ===== صانع ألعاب (AM) =====
  { name: 'زيدان', position: 'AM' },
  { name: 'دي بروين', position: 'AM' },
  { name: 'مودريتش', position: 'AM' },
  { name: 'إنييستا', position: 'AM' },
  { name: 'تشافي', position: 'AM' },
  { name: 'خوان رومان ريكيلمي', position: 'AM' },
  { name: 'مسعود أوزيل', position: 'AM' },
  { name: 'كاكا', position: 'AM' },
  { name: 'برناردو سيلفا', position: 'AM' },
  { name: 'بيليجهام', position: 'AM' },
  { name: 'موسيالا', position: 'AM' },
  { name: 'مارادونا', position: 'AM' },
  { name: 'روبرتو باجيو', position: 'AM' },
  { name: 'فرانشيسكو توتي', position: 'AM' },
  { name: 'دينيس برجكامب', position: 'AM' },
  { name: 'كول بالمر', position: 'AM' },
  { name: 'رمضان صبحي', position: 'AM' },
  { name: 'ماليكوم (الهلال)', position: 'AM' },
  { name: 'فيرمينو (الاتحاد)', position: 'AM' },
  { name: 'دييجو فورلان', position: 'AM' },

  // ===== وينج شمال (LW) =====
  { name: 'نيمار', position: 'LW' },
  { name: 'رونالدو (كريستيانو)', position: 'LW' },
  { name: 'فينيسيوس', position: 'LW' },
  { name: 'كفاراتسخيليا', position: 'LW' },
  { name: 'جورج بست', position: 'LW' },
  { name: 'رايان جيجز', position: 'LW' },
  { name: 'أنطوان جريزمان', position: 'LW' },
  { name: 'رودريجو', position: 'LW' },
  { name: 'إندريك', position: 'LW' },
  { name: 'مارتينيلي', position: 'LW' },
  { name: 'رونالدينيو', position: 'LW' },
  { name: 'مصطفى محمد', position: 'LW' },
  { name: 'عبد الله السعيد', position: 'LW' },
  { name: 'محمد الشلهوب', position: 'LW' },
  { name: 'صالح الشهري', position: 'LW' },
  { name: 'ماركوس راشفورد', position: 'LW' },
  { name: 'ليروي ساني', position: 'LW' },
  { name: 'ستيرلينج', position: 'LW' },
  { name: 'فيليبي أندرسون', position: 'LW' },
  { name: 'دوغلاس كوستا', position: 'LW' },

  // ===== وينج يمين (RW) =====
  { name: 'ميسي', position: 'RW' },
  { name: 'محمد صلاح', position: 'RW' },
  { name: 'أرين روبن', position: 'RW' },
  { name: 'جاريث بيل', position: 'RW' },
  { name: 'رياض محرز', position: 'RW' },
  { name: 'ساكا', position: 'RW' },
  { name: 'فودين', position: 'RW' },
  { name: 'لامين يامال', position: 'RW' },
  { name: 'مايكل أوليسي', position: 'RW' },
  { name: 'عمر مرموش', position: 'RW' },
  { name: 'محمد شريف', position: 'RW' },
  { name: 'فراس البريكان', position: 'RW' },
  { name: 'جارود بوين', position: 'RW' },
  { name: 'أنتوني', position: 'RW' },
  { name: 'كيليان مبابي (جناح)', position: 'RW' },
  { name: 'إيفان بيريسيتش', position: 'RW' },
  { name: 'خوان كوادرادو', position: 'RW' },

  // ===== رأس حربة (ST) =====
  { name: 'رونالدو البرازيلي', position: 'ST' },
  { name: 'مبابي', position: 'ST' },
  { name: 'هالاند', position: 'ST' },
  { name: 'بنزيما', position: 'ST' },
  { name: 'لوكاكو', position: 'ST' },
  { name: 'هاري كين', position: 'ST' },
  { name: 'لويس سواريز', position: 'ST' },
  { name: 'ليفاندوفسكي', position: 'ST' },
  { name: 'فان باستن', position: 'ST' },
  { name: 'باتيستوتا', position: 'ST' },
  { name: 'ديدييه دروجبا', position: 'ST' },
  { name: 'زلاتان إبراهيموفيتش', position: 'ST' },
  { name: 'ميروسلاف كلوزه', position: 'ST' },
  { name: 'جيرد مولر', position: 'ST' },
  { name: 'بيليه', position: 'ST' },
  { name: 'أندريه شفيتشينكو', position: 'ST' },
  { name: 'فرناندو توريس', position: 'ST' },
  { name: 'راؤول جونزاليز', position: 'ST' },
  { name: 'مايكل أوين', position: 'ST' },
  { name: 'روماريو', position: 'ST' },
  { name: 'سيرجيو أجويرو', position: 'ST' },
  { name: 'أوسيمين', position: 'ST' },
  { name: 'أوباميانج', position: 'ST' },
  { name: 'ألفاريز', position: 'ST' },
  { name: 'تييري هنري', position: 'ST' },
  { name: 'أندي كول', position: 'ST' },
  { name: 'روبي فاولر', position: 'ST' },
  { name: 'إيان راش', position: 'ST' },
  { name: 'أحمد حسام ميدو', position: 'ST' },
  { name: 'حسام حسن', position: 'ST' },
  { name: 'محمود كهربا', position: 'ST' },
  { name: 'شيكابالا', position: 'ST' },
  { name: 'سامي الجابر', position: 'ST' },
  { name: 'ياسر القحطاني', position: 'ST' },
  { name: 'نواف العابد', position: 'ST' },
  { name: 'عبدالرزاق حمدالله', position: 'ST' },
  { name: 'كريم بنزيمة (الاتحاد)', position: 'ST' },
  { name: 'رونالدو (النصر)', position: 'ST' },
  { name: 'لوريس أوليفييه جيرو', position: 'ST' },
  { name: 'إيوسيبيو', position: 'ST' },
];

const POSITION_ORDER = ['GK', 'RB', 'CB', 'CB', 'LB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
const POSITION_LABEL = {
  GK: 'حارس مرمى', RB: 'ظهير أيمن', CB: 'مدافع',
  LB: 'ظهير أيسر', DM: 'ارتكاز', CM: 'لاعب وسط',
  AM: 'صانع ألعاب', LW: 'وينج شمال', RW: 'وينج يمين', ST: 'رأس حربة',
};

const FOOTER = '\n\n╭─────────────⊹\n│ 👹⌁ 𝐁𝐲 : 𝐒𝐔𝐊𝐔𝐍𝐀 ⌁👹\n╰─────────────⊹ 💀🔥';
const withCredit = (text) => `${text}${FOOTER}`;
const decorateTitle = (t) => `『 ${t} 』`;

const TEAM_BUDGET = 200_000_000;
const SQUAD_SIZE = 11;
const START_PRICE = 1_000_000;
const MIN_INCREMENT = 500_000;
const MIN_RESERVE_PER_SLOT = 1_000_000;
const formatMoney = (n) => `${n.toLocaleString('en-US')} يورو`;

const auctionStorage = new Map();

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildPositionPools = () => {
  const pools = {};
  for (const pos of POSITION_ORDER) {
    pools[pos] = shuffle(footballersPool.filter((p) => p.position === pos));
  }
  return pools;
};

const createFreshAuction = () => ({
  stage: 'IDLE',
  teams: new Map(),
  pools: {},
  positionIndex: 0,
  currentPlayer: null,
  currentBid: 0,
  currentBidderId: null,
  auctionStarterId: null,
});

const getAuction = (groupId) => {
  if (!auctionStorage.has(groupId)) auctionStorage.set(groupId, createFreshAuction());
  return auctionStorage.get(groupId);
};

const isPlayer = (game, userId) => game.teams.has(userId);

const maxAllowedBid = (team) => {
  const empty = SQUAD_SIZE - team.squad.length - 1;
  return team.budget - Math.max(empty, 0) * MIN_RESERVE_PER_SLOT;
};

const findNextAvailablePositionIndex = (game, startIndex, advanceFirst) => {
  let idx = startIndex;
  if (advanceFirst) idx = (idx + 1) % POSITION_ORDER.length;
  for (let count = 0; count < POSITION_ORDER.length; count++) {
    const pos = POSITION_ORDER[idx];
    if (game.pools[pos] && game.pools[pos].length > 0) return idx;
    idx = (idx + 1) % POSITION_ORDER.length;
  }
  return -1;
};

const nextPlayer = (game, advance = true) => {
  const allFull = [...game.teams.values()].every((t) => t.squad.length >= SQUAD_SIZE);
  if (allFull) { game.stage = 'FINISHED'; game.currentPlayer = null; return null; }

  const idx = findNextAvailablePositionIndex(game, game.positionIndex, advance);
  if (idx === -1) { game.stage = 'FINISHED'; game.currentPlayer = null; return null; }

  game.positionIndex = idx;
  const pos = POSITION_ORDER[idx];
  game.currentPlayer = game.pools[pos].shift();
  game.currentBid = START_PRICE;
  game.currentBidderId = null;
  game.stage = 'BIDDING';
  return game.currentPlayer;
};

const playerDisplay = (p) => `${p.name} (${POSITION_LABEL[p.position]})`;
const priceLabel = (price) => price === 0 ? 'بدون مقابل (توزيع تلقائي)' : formatMoney(price);

const pickRandomOpponent = (game, buyerId) => {
  const eligible = [...game.teams.entries()].filter(([id, t]) => id !== buyerId && t.squad.length < SQUAD_SIZE);
  if (!eligible.length) return null;
  const [id, team] = eligible[Math.floor(Math.random() * eligible.length)];
  return { id, team };
};

const takeRandomPlayerFromPoolByPosition = (game, position) => {
  const list = game.pools[position];
  if (!list || !list.length) return null;
  const i = Math.floor(Math.random() * list.length);
  const [chosen] = list.splice(i, 1);
  return chosen;
};

const buildFinalSummary = (game) => {
  let msg = `🏆 ${decorateTitle('انتهى المزاد - التشكيلات النهائية')}\n\n`;
  for (const team of game.teams.values()) {
    msg += `👤 *${team.name}*\n💰 المتبقي: ${formatMoney(team.budget)}\n`;
    msg += team.squad.length
      ? `🧢 التشكيلة (${team.squad.length}/${SQUAD_SIZE}):\n${team.squad.map((p, i) => `   ${i + 1}. ${p.name} (${POSITION_LABEL[p.position]}) - ${priceLabel(p.price)}`).join('\n')}\n\n`
      : '   لا يوجد لاعبين\n\n';
  }
  return msg;
};

// ================== AI لنتيجة المباراة ==================
async function getMatchResult(teamsData) {
  const teamsText = teamsData.map(t =>
    `فريق ${t.name}: ${t.squad.map(p => `${p.name} (${POSITION_LABEL[p.position]})`).join(', ')}`
  ).join('\n');

  const prompt = `أنت محلل كرة قدم خبير. بناءً على هذين الفريقين من لاعبين حقيقيين في أفضل مستواهم:\n\n${teamsText}\n\nاكتب نتيجة مباراة واقعية ومثيرة بين الفريقين. اذكر:\n1. النتيجة النهائية\n2. أهداف كل فريق ومن سجلها وفي أي دقيقة\n3. تقييم قصير للمباراة (3-4 جمل)\nاكتب بالعربية فقط وبأسلوب تعليق رياضي.`;

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
      console.error(`[مزاد AI] محاولة ${attempt} فشلت:`, e.message);
    }
  }
  return null;
}

// ================== Handler ==================
const OWNER_ID = '201016855501@s.whatsapp.net';

const handler = async (m, { conn }) => {
  const groupId = m.chat;
  const userId = m.sender;
  const userName = m.pushName || 'مجهول';

  const parts = m.text.trim().split(/\s+/);
  const subCommand = parts[1] || 'بدء';
  const game = getAuction(groupId);

  // ── خذ: أمر حصري للأونر - يأخذ اللاعب الحالي مجاناً ──
  if (subCommand === 'خذ') {
    if (userId !== OWNER_ID)
      return m.reply('🚫 هذا الأمر للأونر فقط!');
    if (game.stage !== 'BIDDING' || !game.currentPlayer)
      return m.reply('❌ مفيش لاعب معروض حالياً!');
    if (!isPlayer(game, userId))
      return m.reply('❌ الأونر مش مسجل في المزاد ده!');

    const ownerTeam = game.teams.get(userId);
    if (ownerTeam.squad.length >= SQUAD_SIZE)
      return m.reply('⚠️ فريقك مكتمل!');

    const takenPlayer = game.currentPlayer;
    ownerTeam.squad.push({ name: takenPlayer.name, position: takenPlayer.position, price: 0 });

    let msg = `👑 ${decorateTitle('صلاحية الأونر')}\n\n`;
    msg += `⚽ *${playerDisplay(takenPlayer)}* انضم لفريق *${ownerTeam.name}* مجاناً!\n`;
    msg += `🧢 التشكيلة: ${ownerTeam.squad.length}/${SQUAD_SIZE}\n`;
    msg += `💵 الميزانية: ${formatMoney(ownerTeam.budget)}`;

    const next = nextPlayer(game, true);
    if (next) {
      msg += `\n\n➡️ ${decorateTitle(`مركز ${POSITION_LABEL[next.position]}`)}\nاللاعب التالي: *${playerDisplay(next)}*\n💵 سعر الافتتاح: ${formatMoney(START_PRICE)}`;
      return m.reply(withCredit(msg));
    }

    const summary = buildFinalSummary(game);
    const teamsData = [...game.teams.values()];
    auctionStorage.set(groupId, createFreshAuction());

    await m.reply(withCredit(`${msg}\n\n${summary}`));
    await m.reply('⚽ جاري حساب نتيجة المباراة بالذكاء الاصطناعي...');
    const result = await getMatchResult(teamsData);
    if (result) {
      await conn.sendMessage(m.chat, {
        text: withCredit(`🏟️ ${decorateTitle('نتيجة المباراة')}\n\n${result}`)
      }, { quoted: m });
    } else {
      await m.reply(withCredit('❌ تعذر الحصول على نتيجة المباراة من AI.'));
    }
    return;
  }

  // ── إنهاء/إلغاء: فقط اللاعبين المسجلين ──
  if (['انهاء', 'الغاء', 'إلغاء'].includes(subCommand)) {
    if (game.stage === 'IDLE') return m.reply(withCredit('⚠️ مفيش مزاد شغال!'));
    if (!isPlayer(game, userId))
      return m.reply('🚫 بس اللاعبين المسجلين في المزاد يقدروا ينهوه!');
    auctionStorage.set(groupId, createFreshAuction());
    return m.reply(withCredit(`🛑 تم إنهاء المزاد بواسطة ${userName}.`));
  }

  // ── بدء ──
  if (subCommand === 'بدء') {
    if (game.stage !== 'IDLE') return m.reply('⚠️ فيه مزاد شغال بالفعل!');
    game.stage = 'JOINING';
    game.auctionStarterId = userId;
    game.teams = new Map([[userId, { name: userName, budget: TEAM_BUDGET, squad: [] }]]);
    game.pools = buildPositionPools();
    game.positionIndex = 0;
    return m.reply(withCredit(
      `⚽ ${decorateTitle('مزاد الأبطال بدأ')}\n\n` +
      `عشان تشارك بفريقك، اكتب: \`.مزاد انا\`\n` +
      `💰 ميزانية كل فريق: ${formatMoney(TEAM_BUDGET)}\n` +
      `🧢 حجم التشكيلة المطلوبة: ${SQUAD_SIZE} لاعب\n` +
      `👥 الفرق المسجلة: ${userName}\n\n` +
      `💡 بعد التجمع، اكتب: \`.مزاد ابدأ\``
    ));
  }

  // ── تسجيل فريق ──
  if (subCommand === 'انا') {
    if (game.stage !== 'JOINING') return m.reply('❌ مفيش باب تسجيل مفتوح!');
    if (game.teams.has(userId)) return m.reply(`⚠️ أنت مسجل بالفعل يا ${userName}!`);
    game.teams.set(userId, { name: userName, budget: TEAM_BUDGET, squad: [] });
    return m.reply(withCredit(`✅ تم تسجيل فريقك يا ${userName}!\n👥 عدد الفرق: ${game.teams.size}`));
  }

  // ── بدء المزاد الفعلي: فقط من فتح المزاد ──
  if (subCommand === 'ابدأ') {
    if (game.stage !== 'JOINING') return m.reply('❌ المزاد مش في مرحلة التسجيل!');
    if (userId !== game.auctionStarterId)
      return m.reply('🚫 بس اللي فتح المزاد يقدر يبدأه!');
    if (game.teams.size < 2) return m.reply('❌ محتاج فريقين على الأقل!');
    const player = nextPlayer(game, false);
    return m.reply(withCredit(
      `🔥 ${decorateTitle('المزاد بدأ رسمياً')}\n\n` +
      `⚽ اللاعب المعروض: *${playerDisplay(player)}*\n` +
      `💵 سعر الافتتاح: ${formatMoney(START_PRICE)}\n\n` +
      `للمزايدة: \`.مزاد ادفع <المبلغ>\``
    ));
  }

  // ── المزايدة: فقط اللاعبين المسجلين ──
  if (['ادفع', 'زايد'].includes(subCommand)) {
    if (game.stage !== 'BIDDING') return m.reply('❌ مفيش لاعب معروض للمزايدة!');
    if (!isPlayer(game, userId))
      return m.reply('🚫 بس اللاعبين المسجلين في المزاد يقدروا يزايدوا!');
    const team = game.teams.get(userId);
    if (team.squad.length >= SQUAD_SIZE) return m.reply('⚠️ فريقك مكتمل!');

    const rawAmount = parts[2];
    if (!rawAmount || isNaN(Number(rawAmount))) return m.reply('❌ اكتب مبلغ صحيح!');

    let amount = Number(rawAmount);
    if (amount < 1000) amount *= 1_000_000;

    if (amount <= game.currentBid) return m.reply(`❌ المبلغ لازم يكون أكبر من ${formatMoney(game.currentBid)}!`);
    if (game.currentBidderId && amount < game.currentBid + MIN_INCREMENT)
      return m.reply(`❌ أقل زيادة مسموحة: ${formatMoney(MIN_INCREMENT)}!`);
    if (game.currentBidderId === userId) return m.reply('⚠️ أنت بالفعل صاحب أعلى مزايدة!');

    const maxAllowed = maxAllowedBid(team);
    if (amount > maxAllowed)
      return m.reply(`❌ أقصى مبلغ ممكن تدفعه: ${formatMoney(maxAllowed)}`);

    game.currentBid = amount;
    game.currentBidderId = userId;

    return m.reply(withCredit(
      `💸 ${userName} دفع ${formatMoney(amount)} للاعب *${playerDisplay(game.currentPlayer)}*!\n` +
      `👑 هو حالياً صاحب أعلى مزايدة.\n` +
      `لإغلاق الصفقة: \`.مزاد بيع\` (من أي لاعب مسجل غير صاحب أعلى مزايدة)`
    ));
  }

  // ── إغلاق الصفقة: فقط اللاعبين المسجلين، وليس صاحب أعلى مزايدة ──
  if (subCommand === 'بيع') {
    if (game.stage !== 'BIDDING') return m.reply('❌ مفيش صفقة مفتوحة!');
    if (!isPlayer(game, userId))
      return m.reply('🚫 بس اللاعبين المسجلين في المزاد يقدروا يبيعوا!');
    if (!game.currentBidderId) return m.reply('⚠️ محدش دفع لسه! اكتب `.مزاد تخطي` لتخطيه.');
    if (game.currentBidderId === userId)
      return m.reply('⚠️ أنت صاحب أعلى مزايدة، مينفعش تبيع لنفسك! انتظر لاعب تاني يكتب `.مزاد بيع`.');

    const buyerTeam = game.teams.get(game.currentBidderId);
    const buyerName = buyerTeam.name;
    buyerTeam.budget -= game.currentBid;
    buyerTeam.squad.push({ name: game.currentPlayer.name, position: game.currentPlayer.position, price: game.currentBid });

    let msg = `✅ ${decorateTitle('تمت الصفقة')}\n\n`;
    msg += `⚽ *${playerDisplay(game.currentPlayer)}* انضم لفريق *${buyerName}*\n`;
    msg += `💰 بمبلغ: ${formatMoney(game.currentBid)}\n`;
    msg += `🧢 تشكيلة ${buyerName}: ${buyerTeam.squad.length}/${SQUAD_SIZE}\n`;
    msg += `💵 المتبقي: ${formatMoney(buyerTeam.budget)}`;

    const opponent = pickRandomOpponent(game, game.currentBidderId);
    if (opponent) {
      const compPlayer = takeRandomPlayerFromPoolByPosition(game, game.currentPlayer.position);
      if (compPlayer) {
        opponent.team.squad.push({ name: compPlayer.name, position: compPlayer.position, price: 0 });
        msg += `\n\n🔄 فريق *${opponent.team.name}* استلم *${playerDisplay(compPlayer)}* بدون مقابل.`;
      }
    }

    const next = nextPlayer(game, true);
    if (next) {
      msg += `\n\n➡️ ${decorateTitle(`مركز ${POSITION_LABEL[next.position]}`)}\nاللاعب التالي: *${playerDisplay(next)}*\n💵 سعر الافتتاح: ${formatMoney(START_PRICE)}`;
      return m.reply(withCredit(msg));
    }

    const summary = buildFinalSummary(game);
    const teamsData = [...game.teams.values()];
    auctionStorage.set(groupId, createFreshAuction());

    await m.reply(withCredit(`${msg}\n\n${summary}`));

    await m.reply('⚽ جاري حساب نتيجة المباراة بالذكاء الاصطناعي...');
    const result = await getMatchResult(teamsData);
    if (result) {
      await conn.sendMessage(m.chat, {
        text: withCredit(`🏟️ ${decorateTitle('نتيجة المباراة')}\n\n${result}`)
      }, { quoted: m });
    } else {
      await m.reply(withCredit('❌ تعذر الحصول على نتيجة المباراة من AI.'));
    }
    return;
  }

  // ── تخطي: فقط اللاعبين المسجلين ──
  if (subCommand === 'تخطي') {
    if (game.stage !== 'BIDDING') return m.reply('❌ مفيش لاعب معروض!');
    if (!isPlayer(game, userId))
      return m.reply('🚫 بس اللاعبين المسجلين يقدروا يتخطوا!');
    if (game.currentBidderId) return m.reply('⚠️ فيه حد دافع! اقفل الصفقة بـ `.مزاد بيع`.');

    const skipped = game.currentPlayer;
    const next = nextPlayer(game, true);
    if (next) {
      return m.reply(withCredit(
        `⏭️ تم تخطي *${playerDisplay(skipped)}*.\n➡️ ${decorateTitle(`مركز ${POSITION_LABEL[next.position]}`)}\nاللاعب التالي: *${playerDisplay(next)}*`
      ));
    }
    const summary = buildFinalSummary(game);
    auctionStorage.set(groupId, createFreshAuction());
    return m.reply(withCredit(`⏭️ تم تخطي *${playerDisplay(skipped)}*.\n\n${summary}`));
  }

  // ── فريقي ──
  if (subCommand === 'فريقي') {
    const team = game.teams.get(userId);
    if (!team) return m.reply('❌ أنت مش مشترك في مزاد حالي.');
    let msg = `👤 ${decorateTitle(`فريق ${team.name}`)}\n\n💰 المتبقي: ${formatMoney(team.budget)}\n🧢 التشكيلة (${team.squad.length}/${SQUAD_SIZE}):\n`;
    msg += team.squad.length ? team.squad.map((p, i) => `${i + 1}. ${p.name} (${POSITION_LABEL[p.position]}) - ${priceLabel(p.price)}`).join('\n') : 'لا يوجد لاعبين لسه';
    return m.reply(withCredit(msg));
  }

  // ── الحالة ──
  if (['الحالة', 'الفرق'].includes(subCommand)) {
    if (game.stage === 'IDLE') return m.reply('⚠️ مفيش مزاد شغال.');
    let msg = `📊 ${decorateTitle('حالة المزاد')}\n\n`;
    for (const team of game.teams.values()) {
      msg += `👤 *${team.name}* — 💰 ${formatMoney(team.budget)} — 🧢 ${team.squad.length}/${SQUAD_SIZE}\n`;
    }
    if (game.stage === 'BIDDING' && game.currentPlayer) {
      msg += `\n⚽ اللاعب الحالي: *${playerDisplay(game.currentPlayer)}*\n`;
      msg += `💵 أعلى مزايدة: ${formatMoney(game.currentBid)}`;
      if (game.currentBidderId) {
        const bidderTeam = game.teams.get(game.currentBidderId);
        msg += ` — ${bidderTeam?.name || 'غير معروف'}`;
      }
    }
    return m.reply(withCredit(msg));
  }
};

handler.help = ['مزاد'];
handler.tags = ['games'];
handler.command = /^(مزاد|auction)$/i;

export default handler;