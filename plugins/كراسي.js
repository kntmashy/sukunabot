// ================== الزخرفة والحقوق ==================
const FOOTER = '\n\n╭─────────────⊹';
const FOOTER_LINE2 = '\n│ 👹⌁ 𝐁𝐲 : 𝐒𝐔𝐊𝐔𝐍𝐀 ⌁👹';
const FOOTER_LINE3 = '\n╰─────────────⊹ 💀🔥';
const CREDIT_FOOTER = `${FOOTER}${FOOTER_LINE2}${FOOTER_LINE3}`;

const decorateTitle = (title) => `『 ${title} 』`;
const withCredit = (text) => `${text}${CREDIT_FOOTER}`;

// ================== تخزين الجولات ==================
// المفتاح: id الجروب - القيمة: حالة اللعبة
const chairsGameStorage = new Map();

const createFreshGame = () => ({
  stage: 'IDLE', // IDLE | JOINING | MUSIC_PLAYING | CHAIRS_STOPPED
  players: new Map(), // id -> name
  chairsCount: 0,
  seated: new Set(),
  timer: null,
});

const getGame = (groupId) => {
  if (!chairsGameStorage.has(groupId)) {
    chairsGameStorage.set(groupId, createFreshGame());
  }
  return chairsGameStorage.get(groupId);
};

const resetGame = (groupId) => {
  const old = chairsGameStorage.get(groupId);
  if (old && old.timer) clearTimeout(old.timer);
  chairsGameStorage.set(groupId, createFreshGame());
};

// بدء جولة موسيقى جديدة (مرحلة اللف حوالين الكراسي)
const startMusicRound = (groupId, conn) => {
  const game = getGame(groupId);
  const activePlayerIds = [...game.players.keys()];

  game.chairsCount = activePlayerIds.length - 1;
  game.stage = 'MUSIC_PLAYING';
  game.seated = new Set();

  conn.sendMessage(groupId, {
    text: withCredit(
      `🎶 ${decorateTitle('الموسيقى شغالة دلوقتي')}\n` +
      `الكل بيلف حوالين الكراسي.. 🏃‍♂️\n` +
      `عدد الكراسي في الجولة دي: 🪑 *${game.chairsCount}*\n\n` +
      `⏳ خليك مستعد، أول ما الموسيقى تقف اقعد فوراً بـ \`.كراسي اقعد\`!`
    ),
  });

  const waitTime = Math.floor(Math.random() * 7000) + 5000; // بين 5 و12 ثانية
  game.timer = setTimeout(() => {
    const current = chairsGameStorage.get(groupId);
    if (current && current.stage === 'MUSIC_PLAYING') {
      current.stage = 'CHAIRS_STOPPED';
      conn.sendMessage(groupId, {
        text: withCredit(`🚨 ${decorateTitle('ديررررم! الموسيقى وقفت')}\n\nاقعدوا بسرعة! اكتبوا: \`.كراسي اقعد\``),
      });
    }
  }, waitTime);
};

const handler = async (m, { conn }) => {
  const groupId = m.chat;
  const userId = m.sender;
  const userName = m.pushName || 'لاعب';

  const args = m.text.trim().split(/\s+/);
  const subCommand = args[1] || 'بدء';

  const game = getGame(groupId);

  // ================= أمر الإنهاء والتصفير المباشر =================
  if (subCommand === 'انهاء' || subCommand === 'وقف') {
    if (game.stage === 'IDLE') {
      return m.reply(withCredit('⚠️ مفيش جيم كراسي شغال حالياً في الجروب ده عشان تنهيه!'));
    }
    resetGame(groupId);
    return m.reply(withCredit(
      `🛑 أبشر، تم إنهاء لعبة الكراسي بنجاح يا ${userName}!\nالذاكرة اتصفرت وتقدروا تبدأوا من جديد بـ \`.كراسي بدء\``
    ));
  }

  // 1. فتح باب التسجيل
  if (subCommand === 'بدء') {
    if (game.stage !== 'IDLE') {
      return m.reply(withCredit('⚠️ فيه جيم كراسي شغال بالفعل في الجروب!'));
    }
    game.stage = 'JOINING';
    game.players = new Map([[userId, userName]]);
    game.seated = new Set();

    return m.reply(withCredit(
      `🎵 ${decorateTitle('بدأت لعبة الكراسي الموسيقية')} 🪑\n\n` +
      `عشان تشارك اكتب: \`.كراسي انا\`\n` +
      `👥 المشتركين: ${userName}\n` +
      `💡 بعد ما تتجمعوا (3 على الأقل) اكتبوا: \`.كراسي ابدأ\`\n` +
      `🛑 لإيقاف اللعبة في أي وقت: \`.كراسي انهاء\``
    ));
  }

  // 2. تسجيل اللاعبين
  if (subCommand === 'انا') {
    if (game.stage !== 'JOINING') {
      return m.reply(withCredit('❌ التسجيل مقفول حالياً!'));
    }
    if (game.players.has(userId)) {
      return m.reply(withCredit('⚠️ أنت مسجل بالفعل!'));
    }
    game.players.set(userId, userName);
    return m.reply(withCredit(
      `✅ تم تسجيلك يا ${userName}!\n👥 قائمة اللاعبين: ${[...game.players.values()].join(', ')}`
    ));
  }

  // 3. بدء تشغيل الموسيقى وسحب الكراسي
  if (subCommand === 'ابدأ' || subCommand === 'ابدا') {
    if (game.stage !== 'JOINING') {
      return m.reply(withCredit('❌ اللعبة مش في مرحلة التسجيل!'));
    }
    if (game.players.size < 3) {
      return m.reply(withCredit('❌ المطلوب 3 لاعبين على الأقل لتشغيل اللعبة!'));
    }

    startMusicRound(groupId, conn);
    return;
  }

  // 4. الجلوس السريع على الكرسي
  if (subCommand === 'اقعد') {
    if (game.stage !== 'CHAIRS_STOPPED') {
      return m.reply(withCredit('❌ الموسيقى لسه شغالة أو الجيم مخلصش!'));
    }
    if (!game.players.has(userId)) {
      return m.reply(withCredit('❌ أنت مش مسجل في الجولة دي أصلاً!'));
    }
    if (game.seated.has(userId)) {
      return m.reply(withCredit('⚠️ أنت قاعد على كرسي بالفعل ومأمن نفسك!'));
    }

    game.seated.add(userId);
    const remaining = game.chairsCount - game.seated.size;
    await m.reply(withCredit(`🪑 *${userName}* لحق يقعد! باقي [${remaining}] كراسي.`));

    // لو الكراسي اتملت بالكامل، نشوف مين طلع بره
    if (game.seated.size === game.chairsCount) {
      const playerIds = [...game.players.keys()];
      const loserId = playerIds.find((id) => !game.seated.has(id));
      const loserName = game.players.get(loserId);

      game.players.delete(loserId); // طرد الخسران من الجولة

      await conn.sendMessage(groupId, {
        text: withCredit(`💥 ${decorateTitle('طلع بره')}\n😢 *${loserName}* ماقدرش يلحق كرسي، وطلع من اللعبة!`),
      });

      // لو اتبقى لاعب واحد بس، هو الفائز النهائي
      if (game.players.size === 1) {
        const winnerName = [...game.players.values()][0];
        resetGame(groupId);
        return conn.sendMessage(groupId, {
          text: withCredit(
            `🏆 ${decorateTitle('نهاية اللعبة')}\n\n` +
            `👑 مبروك يا *${winnerName}*! إنت بطل الكراسي الموسيقية! 🎉🪑`
          ),
        });
      }

      // فيه أكتر من لاعب باقي، هنبدأ جولة جديدة تلقائيًا بعد شوية
      await conn.sendMessage(groupId, {
        text: withCredit(`⏭️ ${decorateTitle('جولة جديدة بعد ثواني')}\nاستعدوا يا شباب...`),
      });

      setTimeout(() => startMusicRound(groupId, conn), 4000);
    }
    return;
  }

  return; // مفيش سب-كوماند مطابق
};

handler.help = [
  'كراسي بدء - يبدأ جولة جديدة',
  'كراسي انا - ينضم للجولة',
  'كراسي ابدأ - يشغّل الموسيقى ويبدأ اللعب',
  'كراسي اقعد - يحاول يقعد لما الموسيقى تقف',
  'كراسي انهاء - ينهي الجولة الحالية في أي مرحلة',
];
handler.tags = ['game'];
handler.command = /^كراسي$/i;

export default handler;