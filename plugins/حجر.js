// plugins/rps-game.js

const SIGN = "  ⛩️ *SUKUNA ⚡️ BOT* ⛩️";
const WAIT_TTL_MS = 60000;
const PICK_TTL_MS = 60000;

const CHOICES = {
  "rps_حجر":  "🪨 حجر",
  "rps_ورقه": "📄 ورقه",
  "rps_مقص":  "✂️ مقص"
};

const WINS = {
  "rps_حجر":  "rps_مقص",
  "rps_مقص":  "rps_ورقه",
  "rps_ورقه": "rps_حجر"
};

const sessions = new Map();
const pendingPrivate = new Map(); // اللاعبين اللي محتاجين يبعتوا . الأول

// ══════════════════════════════════════
//  بناء الأزرار
// ══════════════════════════════════════
function buildButtons(groupJid) {
  return [
    { buttonId: `rps_حجر::${groupJid}`,  buttonText: { displayText: "🪨 حجر"  }, type: 1 },
    { buttonId: `rps_ورقه::${groupJid}`, buttonText: { displayText: "📄 ورقه" }, type: 1 },
    { buttonId: `rps_مقص::${groupJid}`,  buttonText: { displayText: "✂️ مقص"  }, type: 1 }
  ];
}

// ══════════════════════════════════════
//  بعت أزرار لكل لاعب في الخاص
// ══════════════════════════════════════
async function sendPrivateButtons(conn, player, groupJid, opponentName) {
  try {
    await conn.sendMessage(player, {
      text:
`🎮 *حجر ورقة مقص*

⚔️ خصمك: ${opponentName}

👇 اختار هنا (سري):

${SIGN}`,
      buttons: buildButtons(groupJid),
      headerType: 1
    });
  } catch (e) {
    console.log("❌ مش قادر يبعت خاص لـ", player, e.message);
    return false;
  }
  return true;
}

// ══════════════════════════════════════
//  إعلان النتيجة
// ══════════════════════════════════════
async function announceResult(conn, groupJid, session) {
  const { playerA, choiceA, playerB, choiceB } = session;

  const nameA = `@${playerA.split("@")[0]}`;
  const nameB = `@${playerB.split("@")[0]}`;

  let resultLine = "";
  let winner = null;

  if (choiceA === choiceB) {
    resultLine = `🤝 *تعادل!* الاتنين اختاروا ${CHOICES[choiceA]}`;
  } else if (WINS[choiceA] === choiceB) {
    resultLine = `🏆 ${nameA} فاز بـ ${CHOICES[choiceA]} على ${CHOICES[choiceB]}!`;
    winner = playerA;
  } else {
    resultLine = `🏆 ${nameB} فاز بـ ${CHOICES[choiceB]} على ${CHOICES[choiceA]}!`;
    winner = playerB;
  }

  if (winner) {
    try {
      if (!global.db) global.db = { data: { users: {} } };
      if (!global.db.data.users[winner]) global.db.data.users[winner] = {};
      global.db.data.users[winner].exp = (global.db.data.users[winner].exp || 0) + 2000;
    } catch {}
  }

  await conn.sendMessage(groupJid, {
    text:
`🎮 *نتيجة التحدي!*
━━━━━━━━━━━━━━━

${nameA}  ➜  ${CHOICES[choiceA]}
${nameB}  ➜  ${CHOICES[choiceB]}

━━━━━━━━━━━━━━━
${resultLine}
${winner ? "\n🎉 الفائز بياخد 2000 XP!" : ""}

${SIGN}`,
    mentions: [playerA, playerB]
  });
}

// ══════════════════════════════════════
//  Handler الرئيسي
// ══════════════════════════════════════
async function handler(m, { conn }) {
  const jid = m.chat;
  const sender = m.sender || m.key.participant || m.key.remoteJid;
  const session = sessions.get(jid);

  if (session && session.phase === "picking") {
    if (sender !== session.playerA && sender !== session.playerB) {
      return conn.sendMessage(jid, {
        text: `⚠️ في لعبة شغالة دلوقتي!\nاستنى ما تخلصش.\n\n${SIGN}`
      }, { quoted: m });
    }
    return;
  }

  // ══ أول لاعب ══
  if (!session) {
    const timeout = setTimeout(async () => {
      if (!sessions.has(jid)) return;
      await conn.sendMessage(jid, {
        text: `⌛ انتهى الوقت!\nمحدش انضم للتحدي.\n\nابعت *حجر* تاني لو عايز تبدأ.\n\n${SIGN}`
      });
      sessions.delete(jid);
    }, WAIT_TTL_MS);

    sessions.set(jid, {
      playerA: sender,
      playerB: null,
      choiceA: null,
      choiceB: null,
      phase: "waiting",
      timeout
    });

    return conn.sendMessage(jid, {
      text:
`🎮 *حجر ورقة مقص!*

✋ @${sender.split("@")[0]} جاهز للتحدي!

أي حد عايز يتحدى يكتب:
*.حجر*

⏳ *عندك 60 ثانية*

${SIGN}`,
      mentions: [sender]
    }, { quoted: m });
  }

  // ══ نفس اللاعب الأول ══
  if (session.phase === "waiting" && sender === session.playerA) {
    return conn.sendMessage(jid, {
      text: `⚠️ انت اللي فتحت التحدي يا @${sender.split("@")[0]}!\nاستنى حد تاني يكتب *حجر*.\n\n${SIGN}`,
      mentions: [sender]
    }, { quoted: m });
  }

  // ══ تاني لاعب انضم ══
  clearTimeout(session.timeout);
  session.playerB = sender;
  session.phase = "picking";

  const nameA = session.playerA.split("@")[0];
  const nameB = sender.split("@")[0];

  // تايمر الاختيار
  session.timeout = setTimeout(async () => {
    const s = sessions.get(jid);
    if (!s || s.phase !== "picking") return;
    const didnt = [];
    if (!s.choiceA) didnt.push(`@${s.playerA.split("@")[0]}`);
    if (!s.choiceB) didnt.push(`@${s.playerB.split("@")[0]}`);
    await conn.sendMessage(jid, {
      text: `⌛ انتهى وقت الاختيار!\n${didnt.join(" و ")} لم يختاروا في الوقت.\nالتحدي انتهى بدون نتيجة ❌\n\n${SIGN}`,
      mentions: [s.playerA, s.playerB]
    });
    sessions.delete(jid);
    pendingPrivate.delete(s.playerA);
    pendingPrivate.delete(s.playerB);
  }, PICK_TTL_MS);

  sessions.set(jid, session);

  // سجل اللاعبين كـ pending — محتاجين يبعتوا . الأول
  pendingPrivate.set(session.playerA, { groupJid: jid, opponentName: nameB, ready: false })
  pendingPrivate.set(sender, { groupJid: jid, opponentName: nameA, ready: false })

  await conn.sendMessage(jid, {
    text:
`⚔️ @${nameA}
        VS
⚔️ @${nameB}

🎮 *اللعبة بدأت!*
📩 *ابعت للبوت في الخاص: .*
*بعدها هيجيلك الاختيارات* 💫

⏳ *عندكم 60 ثانية*

${SIGN}`,
    mentions: [session.playerA, sender]
  });
}

// ══════════════════════════════════════
//  before — بيشتغل على كل رسالة خاص
// ══════════════════════════════════════
handler.before = async (m, { conn }) => {
  const userId = m.sender
  const chatId = m.chat
  const isPrivate = !chatId.endsWith('@g.us')
  if (!isPrivate || !m.text) return false

  const text = m.text.trim()

  // ══ اللاعب بعت . ══
  if (text === '.') {
    const data = pendingPrivate.get(userId)
    if (!data) return false

    const session = sessions.get(data.groupJid)
    if (!session || session.phase !== 'picking') return false

    // بعت الأزرار
    await sendPrivateButtons(conn, userId, data.groupJid, data.opponentName)
    data.ready = true
    pendingPrivate.set(userId, data)
    return true
  }

  // ══ اللاعب ضغط زرار ══
  let selectedId = null
  if (m.message?.buttonsResponseMessage)
    selectedId = m.message.buttonsResponseMessage.selectedButtonId
  if (!selectedId && m.message?.templateButtonReplyMessage)
    selectedId = m.message.templateButtonReplyMessage.selectedId

  if (!selectedId?.startsWith('rps_')) return false

  const parts = selectedId.split('::')
  const choice = parts[0]
  const groupJid = parts[1]
  if (!groupJid) return false

  const session = sessions.get(groupJid)
  if (!session || session.phase !== 'picking') return false

  const isA = userId === session.playerA
  const isB = userId === session.playerB
  if (!isA && !isB) return false

  if (isA && session.choiceA) return true
  if (isB && session.choiceB) return true

  if (isA) session.choiceA = choice
  else session.choiceB = choice

  await conn.sendMessage(userId, {
    text: `🤫 *تم تسجيل اختيارك!*\nاستنى الطرف الثاني...\n\n${SIGN}`
  }, { quoted: m })

  if (session.choiceA && session.choiceB) {
    clearTimeout(session.timeout)
    await announceResult(conn, groupJid, session)
    sessions.delete(groupJid)
    pendingPrivate.delete(session.playerA)
    pendingPrivate.delete(session.playerB)
  }

  return true
}

handler.command = /^حجر$/i;
handler.help = ["حجر"];
handler.tags = ["games"];

export default handler;
