// ================== الزخرفة والحقوق ==================
const FOOTER = '\n\n╭─────────────⊹';
const FOOTER_LINE2 = '\n│ 👹⌁ 𝐁𝐲 : 𝐒𝐔𝐊𝐔𝐍𝐀 ⌁👹';
const FOOTER_LINE3 = '\n╰─────────────⊹ 💀🔥';
const CREDIT_FOOTER = `${FOOTER}${FOOTER_LINE2}${FOOTER_LINE3}`;

const decorateTitle = (title) => `『 ${title} 』`;
const withCredit = (text) => `${text}${CREDIT_FOOTER}`;

const killerGameStorage = new Map();

const createFreshGame = () => ({
  stage: 'IDLE',
  players: new Map(),
  killerId: null,
  detectiveId: null,
  witnessId: null,
  shadowWitnessId: null,
  killerHelperIds: [],
  innocentIds: [],
  votes: new Map(),
});

const getGame = (groupId) => {
  if (!killerGameStorage.has(groupId)) {
    killerGameStorage.set(groupId, createFreshGame());
  }
  return killerGameStorage.get(groupId);
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const handler = async (m, { conn }) => {
  const groupId = m.chat;
  const userId = m.sender;
  const userName = m.pushName || 'لاعب';

  const parts = m.text.trim().split(/\s+/);
  const subCommand = parts[1] || 'بدء';

  const game = getGame(groupId);

  if (subCommand === 'انهاء' || subCommand === 'الغاء' || subCommand === 'إلغاء') {
    if (game.stage === 'IDLE') {
      return m.reply(withCredit('⚠️ مفيش لعبة شغالة أصلاً عشان تتنهي!'));
    }
    killerGameStorage.set(groupId, createFreshGame());
    return m.reply(withCredit('🛑 تم إنهاء اللعبة، وانفتح باب اللعب من جديد بـ `.قاتل بدء`'));
  }

  if (subCommand === 'بدء') {
    if (game.stage !== 'IDLE') {
      return m.reply('⚠️ فيه جولة شغالة بالفعل في الجروب ده!');
    }

    game.stage = 'JOINING';
    game.players = new Map([[userId, userName]]);
    game.votes = new Map();

    return m.reply(withCredit(
      `🔪 ${decorateTitle('لعبة القاتل بدأت بنجاح')}\n\n` +
      `عشان تشارك، اكتب: \`.قاتل انا\`\n` +
      `👥 اللاعبين الحاليين: ${userName}\n` +
      `💡 المطلوب 4 لاعبين على الأقل\n` +
      `(قاتل، محقق، شاهد حر، شاهد بيساعد القاتل، والباقي بينقسم نص أعوان للقاتل ونص أبرياء)\n` +
      `بعد ما تتجمعوا، اكتب: \`.قاتل ابدأ\` لتوزيع الأدوار.`
    ));
  }

  if (subCommand === 'انا') {
    if (game.stage !== 'JOINING') {
      return m.reply('❌ مفيش باب تسجيل مفتوح حالياً! ابدأ لعبة جديدة الأول بـ `.قاتل بدء`');
    }
    if (game.players.has(userId)) {
      return m.reply(`⚠️ أنت مسجل بالفعل يا ${userName}!`);
    }

    game.players.set(userId, userName);
    return m.reply(withCredit(
      `✅ تم تسجيلك يا ${userName}!\n👥 قائمة اللاعبين: ${[...game.players.values()].join(', ')}`
    ));
  }

  if (subCommand === 'ابدأ') {
    if (game.stage !== 'JOINING') {
      return m.reply('❌ اللعبة مش في مرحلة التسجيل!');
    }
    if (game.players.size < 4) {
      return m.reply('❌ عدد المشتركين قليل جداً، المطلوب 4 لاعبين على الأقل!');
    }

    game.stage = 'PLAYING';

    const shuffled = shuffle([...game.players.keys()]);
    game.killerId = shuffled[0];
    game.detectiveId = shuffled[1];
    game.witnessId = shuffled[2];
    game.shadowWitnessId = shuffled[3];

    const rest = shuffled.slice(4);
    const half = Math.ceil(rest.length / 2);
    game.killerHelperIds = rest.slice(0, half);
    game.innocentIds = rest.slice(half);

    const killerName = game.players.get(game.killerId);
    const detectiveName = game.players.get(game.detectiveId);

    for (const [playerId, playerName] of game.players.entries()) {
      try {
        if (playerId === game.killerId) {
          await conn.sendMessage(playerId, {
            text: withCredit(
              `🔪 ${decorateTitle('أنت القاتل')}\n` +
              `حاول تتصرف عادي وماحدش يشك فيك، والمحقق عارفك فاحذر!\n` +
              `عندك شاهد وأعوان بيعرفوك وبيدافعوا عنك من غير ما يفضحوا نفسهم.`
            ),
          });
        } else if (playerId === game.detectiveId) {
          await conn.sendMessage(playerId, {
            text: withCredit(
              `🕵️‍♂️ ${decorateTitle('أنت المحقق')}\n` +
              `معندكش أي معلومة أكيدة عن القاتل، لازم تكتشفه من كلام الناس زي أي حد تاني.\n` +
              `بس خد بالك، هويتك كمحقق معلنة للجميع في الجروب!`
            ),
          });
        } else if (playerId === game.witnessId) {
          await conn.sendMessage(playerId, {
            text: withCredit(
              `👀 ${decorateTitle('أنت الشاهد الحر')}\n` +
              `هويتك سرية ومحدش عارف انك الشاهد، بس انت فعلاً عارف القاتل الحقيقي: *${killerName}*\n` +
              `حاول تثبت كلامك للجروب، بس اتوقع محدش يصدقك بسهولة!`
            ),
          });
        } else if (playerId === game.shadowWitnessId) {
          await conn.sendMessage(playerId, {
            text: withCredit(
              `🎭 ${decorateTitle('أنت الشاهد الخفي')}\n` +
              `انت بتساعد القاتل! القاتل الحقيقي هو: *${killerName}*\n` +
              `مهمتك تضلل الجروب وتوجّه الشك بعيد عنه، وممكن تكدب في شهادتك عادي.`
            ),
          });
        } else if (game.killerHelperIds.includes(playerId)) {
          await conn.sendMessage(playerId, {
            text: withCredit(
              `🤝 ${decorateTitle('أنت من أعوان القاتل')}\n` +
              `انت من ضمن المشتبه بيهم ظاهرياً، بس انت فعلاً عارف القاتل الحقيقي: *${killerName}*\n` +
              `دافع عن نفسك وحاول تحمي القاتل من غير ما حد يكتشف انك عارفه.`
            ),
          });
        } else {
          await conn.sendMessage(playerId, {
            text: withCredit(
              `🙋 ${decorateTitle('أنت بريء')}\n` +
              `معندكش أي معلومة، حاول تثبت إنك مش القاتل وتكتشف مين هو من كلام الناس.`
            ),
          });
        }
      } catch (err) {
        console.error(`فشل إرسال رسالة خاصة لـ ${playerName}:`, err);
      }
    }

    return m.reply(withCredit(
      '🔥 تم توزيع الأدوار في الخاص بنجاح!\n' +
      `🕵️‍♂️ المحقق المعلن في الجولة دي هو: *${detectiveName}*\n` +
      'كل واحد دافع عن نفسه وحاول يكتشف مين القاتل الحقيقي.\n' +
      'ابدأوا التحقيق والنقاش، ولما تخلصوا اكتبوا: `.قاتل تصويت`'
    ));
  }

  if (subCommand === 'تصويت') {
    if (game.stage !== 'PLAYING') {
      return m.reply('❌ مش وقت التصويت حالياً!');
    }

    game.stage = 'VOTING';
    game.votes = new Map();

    let menu = `🗳️ ${decorateTitle('بدأ فصل التصويت')}\nصوّتوا مين هو القاتل، اكتب: \`.قاتل <رقم>\`\n\n`;
    let i = 1;
    for (const name of game.players.values()) {
      menu += `${i} - ${name}\n`;
      i++;
    }
    return m.reply(withCredit(menu));
  }

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
      return m.reply(withCredit(`✅ تم تسجيل صوتك يا ${userName}!\n🗳️ الأصوات اكتملت! اكتب الآن: \`.قاتل نتيجة\``));
    }
    return m.reply(withCredit(`✅ تم تسجيل صوتك يا ${userName}! (${game.votes.size}/${game.players.size} صوتوا)`));
  }

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
    const killerName = game.players.get(game.killerId);
    const detectiveName = game.players.get(game.detectiveId);
    const witnessName = game.players.get(game.witnessId);
    const shadowWitnessName = game.players.get(game.shadowWitnessId);
    const helperNames = game.killerHelperIds.map((id) => game.players.get(id));
    const innocentNames = game.innocentIds.map((id) => game.players.get(id));

    let resultMsg = `🚨 ${decorateTitle('النتيجة النهائية للجولة')}\n\n`;
    resultMsg += `🗳️ الجروب اتهم: *${suspectName}*\n`;
    resultMsg += `🔪 القاتل الحقيقي: *${killerName}*\n`;
    resultMsg += `🕵️‍♂️ المحقق كان: *${detectiveName}*\n`;
    resultMsg += `👀 الشاهد الحر كان: *${witnessName}*\n`;
    resultMsg += `🎭 الشاهد الخفي (بتاع القاتل) كان: *${shadowWitnessName}*\n`;
    if (helperNames.length) resultMsg += `🤝 أعوان القاتل: ${helperNames.join(', ')}\n`;
    if (innocentNames.length) resultMsg += `🙋 الأبرياء: ${innocentNames.join(', ')}\n`;
    resultMsg += '\n';

    if (suspectId === game.killerId) {
      resultMsg += '🎉 *فوز ساحق للأبرياء!* كشفتوا القاتل صح! 💪🏆';
    } else {
      resultMsg += '👑 *فوز القاتل وعصابته!* خدعوكم وهربوا من العدالة! 🔪🔥';
    }

    killerGameStorage.set(groupId, createFreshGame());

    return m.reply(withCredit(resultMsg));
  }

  return;
};

handler.help = [
  'قاتل بدء - يبدأ جولة جديدة',
  'قاتل انا - ينضم للجولة',
  'قاتل ابدأ - يوزع الأدوار',
  'قاتل تصويت - يفتح باب التصويت',
  'قاتل <رقم> - يصوّت على شخص',
  'قاتل نتيجة - يكشف نتيجة الجولة',
  'قاتل انهاء - ينهي الجولة الحالية',
];
handler.tags = ['game'];
handler.command = /^قاتل$/i;

export default handler;