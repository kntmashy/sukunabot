import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '../data/quiz_scores.json')

// تأكد من وجود ملف النقاط
if (!fs.existsSync(path.dirname(dataPath))) {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true })
}
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({}))
}

// الأسئلة الدينية
const questions = [
  { q: 'كم عدد أركان الإسلام؟', options: ['4', '5', '6', '7'], answer: 1 },
  { q: 'ما هي أول سورة نزلت من القرآن الكريم؟', options: ['الفاتحة', 'البقرة', 'العلق', 'المدثر'], answer: 2 },
  { q: 'كم عدد أشهر السنة الهجرية؟', options: ['10', '11', '12', '13'], answer: 2 },
  { q: 'في أي مدينة ولد النبي محمد ﷺ؟', options: ['المدينة', 'مكة المكرمة', 'الطائف', 'القدس'], answer: 1 },
  { q: 'كم عدد أركان الإيمان؟', options: ['4', '5', '6', '7'], answer: 2 },
  { q: 'ما اسم والد النبي إبراهيم عليه السلام؟', options: ['عمران', 'آزر', 'يعقوب', 'نوح'], answer: 1 },
  { q: 'كم عدد سور القرآن الكريم؟', options: ['110', '114', '120', '100'], answer: 1 },
  { q: 'ما هي القبلة الأولى للمسلمين؟', options: ['مكة المكرمة', 'القدس', 'المدينة', 'الأقصى'], answer: 1 },
  { q: 'ما هي أطول سورة في القرآن الكريم؟', options: ['آل عمران', 'النساء', 'البقرة', 'المائدة'], answer: 2 },
  { q: 'في أي شهر فُرض الصيام؟', options: ['شوال', 'ذو الحجة', 'رمضان', 'محرم'], answer: 2 },
  { q: 'كم عدد الصلوات المفروضة في اليوم؟', options: ['3', '4', '5', '6'], answer: 2 },
  { q: 'ما هو أصغر سورة في القرآن الكريم؟', options: ['الفاتحة', 'الكوثر', 'الإخلاص', 'الناس'], answer: 1 },
  { q: 'كم عدد أنبياء الله المذكورين في القرآن؟', options: ['20', '25', '30', '35'], answer: 1 },
  { q: 'ما اسم زوجة النبي إبراهيم أم إسماعيل؟', options: ['سارة', 'هاجر', 'مريم', 'خديجة'], answer: 1 },
  { q: 'في أي عام هاجر النبي ﷺ من مكة للمدينة؟', options: ['610م', '615م', '622م', '630م'], answer: 2 },
  { q: 'ما اسم السورة التي تُسمى قلب القرآن؟', options: ['البقرة', 'الكهف', 'يس', 'الرحمن'], answer: 2 },
  { q: 'ما هو النصاب الذي تجب فيه الزكاة للذهب؟', options: ['75 جرام', '85 جرام', '100 جرام', '50 جرام'], answer: 1 },
  { q: 'كم مرة يطوف الحاج حول الكعبة؟', options: ['5', '6', '7', '8'], answer: 2 },
  { q: 'ما اسم أم المؤمنين التي تُوفيت قبل الهجرة؟', options: ['عائشة', 'خديجة', 'حفصة', 'أم سلمة'], answer: 1 },
  { q: 'ما هي السورة التي تعادل ثلث القرآن؟', options: ['الفاتحة', 'الكهف', 'الإخلاص', 'الفلق'], answer: 2 },
  { q: 'كم عدد آيات سورة الفاتحة؟', options: ['5', '6', '7', '8'], answer: 2 },
  { q: 'ما اسم الجبل الذي أُنزل فيه القرآن؟', options: ['جبل عرفات', 'جبل ثور', 'جبل النور', 'جبل أحد'], answer: 2 },
  { q: 'من هو النبي الذي بنى الكعبة مع ابنه؟', options: ['نوح', 'موسى', 'إبراهيم', 'يعقوب'], answer: 2 },
  { q: 'ما هو الركن الأول من أركان الإسلام؟', options: ['الصلاة', 'الزكاة', 'الشهادتان', 'الصيام'], answer: 2 },
  { q: 'ما هي الصلاة التي لا تُقصر في السفر؟', options: ['المغرب', 'الفجر', 'العشاء', 'الظهر'], answer: 0 },
  { q: 'كم عدد تكبيرات صلاة الجنازة؟', options: ['3', '4', '5', '6'], answer: 1 },
  { q: 'ما هي السورة التي تبدأ بـ "الم"؟', options: ['يس', 'البقرة', 'الكهف', 'النمل'], answer: 1 },
  { q: 'في أي ليلة أُنزل القرآن؟', options: ['ليلة الإسراء', 'ليلة القدر', 'ليلة النصف', 'ليلة الجمعة'], answer: 1 },
  { q: 'ما هو مقدار زكاة الفطر؟', options: ['كيلو', '2 كيلو', '2.5 كيلو', '3 كيلو'], answer: 2 },
  { q: 'من هو النبي الذي كُلّم الله تكليماً؟', options: ['إبراهيم', 'عيسى', 'موسى', 'محمد'], answer: 2 },
]

function loadScores() {
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  } catch {
    return {}
  }
}

function saveScores(scores) {
  fs.writeFileSync(dataPath, JSON.stringify(scores, null, 2))
}

function getLeaderboard() {
  const scores = loadScores()
  return Object.entries(scores)
    .sort(([, a], [, b]) => b.points - a.points)
    .slice(0, 10)
}

// ───────── زخرفة موحّدة لكل رسائل البلجن ─────────
function box(title, body) {
  return (
    `╭─❀· 🕌 ${title} 🕌 ·❀─╮\n\n` +
    `${body}\n\n` +
    `╰──────❀·❀──────╯`
  )
}

// سؤال نشط واحد لكل جروب/شات في كل مرة
const activeQuestions = new Map()

// استخراج نص + هوية المرسل + رد الزرار من رسالة Baileys الخام
function extractAnswerData(rawMsg) {
  const msg = rawMsg.message
  if (!msg) return null

  const chat = rawMsg.key.remoteJid
  const isGroup = chat?.endsWith('@g.us')
  const sender = isGroup ? rawMsg.key.participant : rawMsg.key.remoteJid
  const pushName = rawMsg.pushName

  let body =
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    ''

  const btnId = msg.buttonsResponseMessage?.selectedButtonId || ''

  return { chat, sender, pushName, body: body.trim(), btnId }
}

function resolveAnswerIndex(body, btnId) {
  if (btnId.startsWith('dq_')) {
    return parseInt(btnId.replace('dq_', ''), 10)
  }
  const numMap = { '1': 0, '١': 0, '2': 1, '٢': 1, '3': 2, '٣': 2, '4': 3, '٤': 3 }
  const letMap = { 'أ': 0, 'ب': 1, 'ج': 2, 'د': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 }
  if (numMap[body] !== undefined) return numMap[body]
  if (letMap[body?.toLowerCase()] !== undefined) return letMap[body.toLowerCase()]
  return -1
}

async function handleAnswer(conn, chat, sender, senderName, answerIndex, quotedKey) {
  const session = activeQuestions.get(chat)
  if (!session || session.solved) return
  if (answerIndex === -1) return
  if (session.answeredBy.has(sender)) return

  session.answeredBy.add(sender)
  const q = session.question
  const isCorrect = answerIndex === q.answer

  const scores = loadScores()
  if (!scores[senderName]) scores[senderName] = { points: 0, correct: 0, wrong: 0 }

  if (isCorrect) {
    session.solved = true
    clearTimeout(session.timer)
    activeQuestions.delete(chat)
    conn.ev.off('messages.upsert', session.listener)

    scores[senderName].points += 10
    scores[senderName].correct++
    saveScores(scores)

    await conn.sendMessage(chat, {
      text: box(
        'إجابة صحيحة',
        `🎉 *${senderName}* أجاب صح!\n` +
        `✅ الإجابة: *${q.options[q.answer]}*\n` +
        `⭐ +10 نقاط | مجموعه: *${scores[senderName].points}* نقطة`
      )
    })
  } else {
    scores[senderName].points -= 3
    scores[senderName].wrong++
    saveScores(scores)

    await conn.sendMessage(chat, {
      text: `❌ *${senderName}* أجاب غلط! -3 نقاط\n_السؤال لسه مفتوح للباقين..._`
    }, quotedKey ? { quoted: { key: quotedKey } } : {})
  }
}

export default {
  name: 'سوال_ديني',
  aliases: ['سؤال_ديني', 'سوال_ديني', 'ديني'],
  tags: ['fun'],
  help: ['سوال_ديني — سؤال ديني للجروب | سوال_ديني نقاط — لوحة المتصدرين'],

  ownerOnly: false,
  groupOnly: false,
  adminOnly: false,

  async execute(conn, m) {
    const args = m.body?.split(' ').slice(1) || []
    const sub = args[0]?.toLowerCase()
    const chat = m.chat

    // ── لوحة المتصدرين ──
    if (sub === 'نقاط' || sub === 'لوحة' || sub === 'top') {
      const board = getLeaderboard()

      if (!board.length) {
        return m.reply(box('نقاط', 'لا توجد نقاط بعد!'))
      }

      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
      const text = board.map(([name, d], i) =>
        `${medals[i]} *${name}* — ${d.points} نقطة (✅${d.correct} / ❌${d.wrong})`
      ).join('\n')

      return m.reply(box('لوحة المتصدرين', text))
    }

    // ── لو في سؤال نشط بالفعل ──
    if (activeQuestions.has(chat)) {
      return m.reply(box('تنبيه', '⚠️ في سؤال نشط الآن! أجب عليه أولاً.'))
    }

    // ── اختار سؤال عشوائي ──
    const q = questions[Math.floor(Math.random() * questions.length)]
    const letters = ['🅰️', '🅱️', '🅲', '🅳']
    const optText = q.options.map((o, i) => `${letters[i]} ${o}`).join('\n')

    const msgText = box(
      'سؤال ديني',
      `*${q.q}*\n\n${optText}\n\n⏱️ عندك دقيقة للإجابة!`
    )

    try {
      await conn.sendMessage(chat, {
        text: msgText,
        footer: '🕌 اكتب رقم الإجابة: 1 أو 2 أو 3 أو 4',
        buttons: q.options.map((opt, i) => ({
          buttonId: `dq_${i}`,
          buttonText: { displayText: `${['١', '٢', '٣', '٤'][i]} ${opt}` },
          type: 1
        })),
        headerType: 1
      })
    } catch {
      await conn.sendMessage(chat, { text: msgText })
    }

    // listener مباشر على حدث Baileys الخام، عشان نضمن إنه هيتنفذ
    // مهما كانت طريقة الفريموورك بتاعك في توزيع الرسائل على البلجنز
    const listener = async ({ messages, type }) => {
      if (type !== 'notify') return
      for (const rawMsg of messages) {
        if (rawMsg.key.fromMe) continue
        if (rawMsg.key.remoteJid !== chat) continue

        const data = extractAnswerData(rawMsg)
        if (!data) continue

        const answerIndex = resolveAnswerIndex(data.body, data.btnId)
        if (answerIndex === -1) continue

        const senderName = data.pushName || data.sender?.split('@')[0] || 'مستخدم'
        await handleAnswer(conn, chat, data.sender, senderName, answerIndex, rawMsg.key)
      }
    }

    conn.ev.on('messages.upsert', listener)

    const session = {
      question: q,
      answeredBy: new Set(),
      solved: false,
      listener,
      timer: setTimeout(async () => {
        if (activeQuestions.has(chat)) {
          activeQuestions.delete(chat)
          conn.ev.off('messages.upsert', listener)
          await conn.sendMessage(chat, {
            text: box(
              'انتهى الوقت',
              `⏰ محدش أجاب!\n✅ الإجابة الصحيحة: *${q.options[q.answer]}*`
            )
          })
        }
      }, 60000) // دقيقة كاملة
    }

    activeQuestions.set(chat, session)
  },

  // محتفظ بيها لو الفريموورك عندك بينادي onMessage فعلاً —
  // مش هتعمل تعارض لأن handleAnswer بتتجاهل أي إجابة اتسجلت قبل كده (answeredBy)
  async onMessage(conn, m) {
    const chat = m.chat
    const session = activeQuestions.get(chat)
    if (!session || session.solved) return

    const sender = m.sender
    const senderName = m.pushName || sender?.split('@')[0] || 'مستخدم'

    const btnId = m.message?.buttonsResponseMessage?.selectedButtonId || ''
    const body = (m.body || '').trim()
    const answerIndex = resolveAnswerIndex(body, btnId)
    if (answerIndex === -1) return

    await handleAnswer(conn, chat, sender, senderName, answerIndex, m.key)
  }
}