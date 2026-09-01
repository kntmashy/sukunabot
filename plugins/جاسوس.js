// قائمة الكلمات السرية
const secretWords = [
  'برجر', 'بيتزا', 'شاورما', 'كشري', 'حواوشي', 'ملوخية', 'مكرونة', 'كباب', 'كفتة', 'سمك',
  'مانجو', 'بطيخ', 'فراولة', 'موز', 'تفاح', 'شوكولاتة', 'آيس كريم', 'بسبوسة', 'كنافة', 'وافل',
  'قهوة', 'شاي', 'عصير', 'بيبسي', 'كابتشينو', 'سحلب', 'أندومي', 'فشار', 'شيبسي', 'مكسرات',
  'روبلوكس', 'ببجي', 'بايثون', 'كمبيوتر', 'موبايل', 'بلايستيشن', 'شاحن', 'سماعة', 'إنترنت', 'سيرفر',
  'يوتيوب', 'واتساب', 'تيك توك', 'فيسبوك', 'ماوس', 'كيبورد', 'شاشة', 'لابتوب', 'تابلت', 'مودم',
  'العاب', 'تشفير', 'سكربت', 'بوت', 'برمجة', 'سيارة', 'طيارة', 'عجلة', 'موتوسيكل', 'قطار',
  'سفينة', 'مترو', 'توكتوك', 'أتوبيس', 'تاكسي', 'مطار', 'محطة', 'سفر', 'بحر', 'فندق',
  'سرير', 'دولاب', 'كرسي', 'ترابيزة', 'مروحة', 'تكييف', 'تلفزيون', 'ثلاجة', 'بوتاجاز', 'غسالة',
  'باب', 'شباك', 'مفتاح', 'محفظة', 'نظارة', 'ساعة', 'قلم', 'كشكول', 'كتاب', 'شنطة',
  'فلوس', 'مخدة', 'سجادة', 'مراية', 'فانوس', 'مدرسة', 'جامعة', 'مستشفى', 'صيدلية', 'سوبرماركت',
  'مطعم', 'كافيه', 'نادي', 'جيم', 'حديقة', 'دكتور', 'مهندس', 'مدرس', 'حلاق', 'طيار',
];

// ================== الزخرفة والحقوق ==================
const FOOTER = '\n\n╭─────────────⊹';
const FOOTER_LINE2 = '\n│ 👹⌁ 𝐁𝐲 : 𝐒𝐔𝐊𝐔𝐍𝐀 ⌁👹';
const FOOTER_LINE3 = '\n╰─────────────⊹ 💀🔥';
const CREDIT_FOOTER = `${FOOTER}${FOOTER_LINE2}${FOOTER_LINE3}`;

// يزخرف عنوان بحدود زخرفية فوق وتحت
const decorateTitle = (title) => `『 ${title} 』`;

// يضيف حقوق سوكونا في آخر أي رسالة من رسايل اللعبة
const withCredit = (text) => `${text}${CREDIT_FOOTER}`;

// ذاكرة اللعبة (Map فيها كل جروب ولعبته)
// المفتاح: id الجروب - القيمة: حالة اللعبة
const spyGameStorage = new Map();

const createFreshGame = () => ({
  stage: 'IDLE', // IDLE | JOINING | PLAYING | VOTING
  players: new Map(), // id -> name
  spyId: null,
  word: '',
  votes: new Map(), // voterId -> votedForId
});

const getGame = (groupId) => {
  if (!spyGameStorage.has(groupId)) {
    spyGameStorage.set(groupId, createFreshGame());
  }
  return spyGameStorage.get(groupId);
};

const handler = async (m, { conn }) => {
  const groupId = m.chat;
  const userId = m.sender;
  const userName = m.pushName || 'لاعب';

  const parts = m.text.trim().split(/\s+/);
  const subCommand = parts[1] || 'بدء';

  const game = getGame(groupId);

  // إنهاء/إلغاء اللعبة في أي مرحلة
  if (subCommand === 'انهاء' || subCommand === 'الغاء' || subCommand === 'إلغاء') {
    if (game.stage === 'IDLE') {
      return m.reply(withCredit('⚠️ مفيش لعبة شغالة أصلاً عشان تتنهي!'));
    }

    spyGameStorage.set(groupId, createFreshGame());
    return m.reply(withCredit('🛑 تم إنهاء اللعبة، وانفتح باب اللعب من جديد بـ `.جاسوس بدء`'));
  }

  // 1. بدء لعبة جديدة
  if (subCommand === 'بدء') {
    if (game.stage !== 'IDLE') {
      return m.reply('⚠️ فيه جولة شغالة بالفعل في الجروب ده!');
    }

    game.stage = 'JOINING';
    game.players = new Map([[userId, userName]]);
    game.votes = new Map();

    return m.reply(withCredit(
      `🕵️‍♂️ ${decorateTitle('لعبة الجاسوس بدأت بنجاح')}\n\n` +
      `عشان تشارك، اكتب: \`.جاسوس انا\`\n` +
      `👥 اللاعبين الحاليين: ${userName}\n` +
      `💡 بعد ما تتجمعوا، اكتب: \`.جاسوس ابدأ\` لتوزيع الأدوار.`
    ));
  }

  // 2. تسجيل لاعب جديد
  if (subCommand === 'انا') {
    if (game.stage !== 'JOINING') {
      return m.reply('❌ مفيش باب تسجيل مفتوح حالياً! ابدأ لعبة جديدة الأول بـ `.جاسوس بدء`');
    }
    if (game.players.has(userId)) {
      return m.reply(`⚠️ أنت مسجل بالفعل يا ${userName}!`);
    }

    game.players.set(userId, userName);
    return m.reply(withCredit(
      `✅ تم تسجيلك يا ${userName}!\n👥 قائمة اللاعبين: ${[...game.players.values()].join(', ')}`
    ));
  }

  // 3. توزيع الأدوار
  if (subCommand === 'ابدأ') {
    if (game.stage !== 'JOINING') {
      return m.reply('❌ اللعبة مش في مرحلة التسجيل!');
    }
    if (game.players.size < 3) {
      return m.reply('❌ عدد المشتركين قليل جداً، المطلوب 3 لاعبين على الأقل!');
    }

    game.stage = 'PLAYING';
    game.word = secretWords[Math.floor(Math.random() * secretWords.length)];
    const playerIds = [...game.players.keys()];
    game.spyId = playerIds[Math.floor(Math.random() * playerIds.length)];

    // إرسال الأدوار في الخاص لكل لاعب
    for (const [playerId, playerName] of game.players.entries()) {
      try {
        if (playerId === game.spyId) {
          await conn.sendMessage(playerId, {
            text: withCredit(`🕵️‍♂️ ${decorateTitle('أنت الجاسوس')}\nحاول تتصرف عادي وماحدش يشك فيك.`),
          });
        } else {
          await conn.sendMessage(playerId, {
            text: withCredit(`🤫 ${decorateTitle('الكلمة السرية')}\nهي: *${game.word}*`),
          });
        }
      } catch (err) {
        console.error(`فشل إرسال رسالة خاصة لـ ${playerName}:`, err);
      }
    }

    return m.reply(withCredit('🔥 تم توزيع الأدوار في الخاص بنجاح! ابدأوا النقاش، ولما تخلصوا اكتبوا: `.جاسوس تصويت`'));
  }

  // 4. فتح باب التصويت
  if (subCommand === 'تصويت') {
    if (game.stage !== 'PLAYING') {
      return m.reply('❌ مش وقت التصويت حالياً!');
    }

    game.stage = 'VOTING';
    game.votes = new Map();

    let menu = `🗳️ ${decorateTitle('بدأ فصل التصويت')}\nاكتب اسم الأمر وجنبه رقم الشخص (مثال: \`.جاسوس 2\`):\n\n`;
    let i = 1;
    for (const name of game.players.values()) {
      menu += `${i} - ${name}\n`;
      i++;
    }
    return m.reply(withCredit(menu));
  }

  // 5. استقبال الأصوات بالأرقام
  if (game.stage === 'VOTING' && /^\d+$/.test(subCommand)) {
    if (!game.players.has(userId)) {
      return m.reply('❌ أنت مش مشترك في الجولة دي عشان تصوت!');
    }
    if (game.votes.has(userId)) {
      return m.reply('⚠️ أنت صوتّ قبل كدا وممنوع التغيير.');
    }

    const choiceIndex = parseInt(subCommand, 10) - 1;
    const playerIds = [...game.players.keys()];

    if (choiceIndex < 0 || choiceIndex >= playerIds.length) {
      return m.reply('❌ الرقم غير موجود في القائمة!');
    }

    game.votes.set(userId, playerIds[choiceIndex]);

    if (game.votes.size === game.players.size) {
      return m.reply(withCredit(`✅ تم تسجيل صوتك يا ${userName}!\n🗳️ الأصوات اكتملت! اكتب الآن: \`.جاسوس نتيجة\``));
    }
    return m.reply(withCredit(`✅ تم تسجيل صوتك يا ${userName}! (${game.votes.size}/${game.players.size} صوتوا)`));
  }

  // 6. كشف النتيجة
  if (subCommand === 'نتيجة') {
    if (game.stage !== 'VOTING') {
      return m.reply('❌ مش وقت كشف النتيجة لسه!');
    }
    if (game.votes.size === 0) {
      return m.reply('⚠️ محدش صوت لسه!');
    }

    const voteCounts = new Map();
    for (const votedId of game.votes.values()) {
      voteCounts.set(votedId, (voteCounts.get(votedId) || 0) + 1);
    }

    let suspectId = null;
    let maxVotes = -1;
    for (const [id, count] of voteCounts.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        suspectId = id;
      }
    }

    const suspectName = game.players.get(suspectId);
    const spyName = game.players.get(game.spyId);

    let resultMsg = `🚨 ${decorateTitle('النتيجة النهائية للجولة')}\n\n`;
    resultMsg += `🗳️ الجروب طرد: *${suspectName}*\n`;
    resultMsg += `🕵️‍♂️ الجاسوس الحقيقي: *${spyName}*\n`;
    resultMsg += `🤫 الكلمة السرية: *${game.word}*\n\n`;

    if (suspectId === game.spyId) {
      resultMsg += '🎉 *فوز ساحق للجروب!* كشفتوا الجاسوس وطردتوه صح! 💪🏆';
    } else {
      resultMsg += '👑 *فوز الجاسوس!* الجاسوس خدعكم وطردتوا حد بريء! 🕵️‍♂️🔥';
    }

    // تصفير اللعبة
    spyGameStorage.set(groupId, createFreshGame());

    return m.reply(withCredit(resultMsg));
  }

  return; // مفيش سب-كوماند مطابق، متعملش حاجة
};

handler.help = [
  'جاسوس بدء - يبدأ جولة جديدة',
  'جاسوس انا - ينضم للجولة',
  'جاسوس ابدأ - يوزع الأدوار',
  'جاسوس تصويت - يفتح باب التصويت',
  'جاسوس <رقم> - يصوّت على شخص',
  'جاسوس نتيجة - يكشف نتيجة الجولة',
  'جاسوس انهاء - ينهي الجولة الحالية في أي مرحلة',
];
handler.tags = ['game'];
handler.command = /^جاسوس$/i;

export default handler;