import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const DB    = path.join(__dirname, '../database/shippuden.json')
const THUMB = 'https://files.catbox.moe/s9llyi.jpg'

const readDB = () => {
  try {
    const d = path.dirname(DB)
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
    if (!fs.existsSync(DB)) return {}
    return JSON.parse(fs.readFileSync(DB, 'utf8')) || {}
  } catch { return {} }
}
const writeDB = (data) => {
  try {
    const d = path.dirname(DB)
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
    fs.writeFileSync(DB, JSON.stringify(data, null, 2))
  } catch {}
}

const newGame = (char) => ({
  char,
  phase: 'started',
  narutoHP: 100, madaraHP: 100, kuramaHP: 100,
  round: 0, logs: [],
  naruto: { blue: 20, red: 20, combo: 999, field: 4, heal: 5, flash: 1, fieldCount: 0, infinity: 3 },
  madara: { punch: 999, dismantle: 20, slice: 999, field: 4, heal: 5, mahoraga: 5, agito: 1, fieldCount: 0 },
  fieldCollisions: 0,
  brainDamage: false,
  mahoragaActive: false,
  agitoActive: false,
  infinityActive: false,
  pvp: false
})

const bar = (hp) =>
  '█'.repeat(Math.max(0, Math.floor(hp / 5))) +
  '░'.repeat(Math.max(0, 20 - Math.floor(hp / 5)))

const display = (g) => {
  const logs = g.logs.slice(-14).join('\n')
  const isNaruto = g.char === 'naruto'
  const stats = isNaruto
    ? `📊 راسينغان(${g.naruto.blue}) راسينشوريكين(${g.naruto.red}) شفاء(${g.naruto.heal}) درع كيوراما(${g.naruto.infinity})${g.infinityActive ? '🛡️' : ''} بيجوداما(${g.naruto.flash}) سينين(${g.naruto.field})`
    : `📊 سوسانو(${g.madara.dismantle}) شفاء(${g.madara.heal}) كيوبي(${g.madara.mahoraga}) تسوكويومي(${g.madara.field})`
  let cmds = ''
  if (g.phase === 'started')
    cmds = isNaruto
      ? '⚔️ راسينغان | راسينشوريكين | مدمج | ريفرس | درع كيوراما | سينين'
      : '⚔️ ضربة | سوسانو | موجة | ريفرس | كيوبي | تسوكويومي'
  else if (g.phase === 'battle')
    cmds = isNaruto
      ? `⚔️ راسينغان | راسينشوريكين | مدمج | ريفرس | درع كيوراما${g.naruto.flash > 0 ? ' | بيجوداما 🖤' : ''}`
      : '⚔️ ضربة | سوسانو | موجة | ريفرس | كيوبي'
  else if (g.phase === 'final')
    cmds = (g.agitoActive && isNaruto)
      ? '⚔️ اقتل أوبيتو أولاً ← .راسينغان'
      : (!g.agitoActive && isNaruto)
        ? '💜 أوبيتو مات! أطلق الضربة الأخيرة ← .بنفسجي'
        : '⚔️ ضربة | سوسانو | موجة'
  else if (g.phase === 'cutscene')
    cmds = '⏳ كيوبي تهاجم... انتظر!'
  const phaseLabel = { started:'⚡ المواجهة', battle:'💥 قتال مباشر', final:'🔥 المعركة الأخيرة', end:'🏁 انتهت', cutscene:'🎬 مشهد' }[g.phase] || ''
  const agitoLine  = (g.phase === 'final' && g.agitoActive) ? `\n👁️ أوبيتو : ${bar(g.agitoHP)} ${g.agitoHP}%` : ''
  return {
    image: { url: THUMB },
    caption: `╔═══━━━─── • ───━━━═══╗\n   ⟡ 𓂀 𝗚 𝗢 𝗝 𝗢 𓂀 ⟡\n╚═══━━━─── • ───━━━═══╝\n\n${phaseLabel} | جولة ${g.round}\n🟠 ناروتو  : ${bar(g.narutoHP)} ${g.narutoHP}%\n🔴 مادارا: ${bar(g.madaraHP)} ${g.madaraHP}%${agitoLine}\n\n📜 الأحداث:\n${logs}\n\n${stats}\n\n${cmds}\n╚════════════════╝\n\n> برعاية ايتادوري`
  }
}

const MADARA_BOT = [
  { d: 18, m: '👊 مادارا: ضربة سوسانو معززة!\n   "أنت ضعيف يا ناروتو!"' },
  { d: 12, m: '🔪 مادارا: سيف سوسانو!\n   "تحرك كالشينوبي أو مت كالعبد!"' },
  { d: 10, m: '🌊 مادارا: موجة شاكرا!\n   "هل هذا كل ما لديك؟"' },
  { d: 20, m: '👊 مادارا: ضربة سوسانو الناري!\n   "انتهى وقتك!"' },
  { d: 14, m: '🔪 مادارا: سوسانو متلاحق!\n   "ستسقط عاجلاً!"' },
  { d: 16, m: '🌊 مادارا: موجة شاكرا مزدوجة!\n   "ما زلت تقاوم؟ مثير..."' }
]
const NARUTO_BOT = [
  { d: 15, m: '🟠 ناروتو: راسينغان!\n   "لا مفر من دوامة التشاكرا!"' },
  { d: 15, m: '🟡 ناروتو: راسينشوريكين!\n   "هل تشعر بهذا؟"' },
  { d: 20, m: '⚪ ناروتو: وضع كيوراما + راسينغان!\n   "أنا لم أبدأ بعد!"' },
  { d: 18, m: '🟠 ناروتو: راسينغان متلاحق!\n   "فكر بشكل أسرع!"' },
  { d: 12, m: '⚪ ناروتو: ضربة معززة بالتشاكرا!\n   "كم ستصمد؟"' }
]
const botAtk = (g) => {
  const pool = g.char === 'naruto' ? MADARA_BOT : NARUTO_BOT
  return pool[Math.floor(Math.random() * pool.length)]
}

const collisionResult = (n) => {
  if (n === 1) return { win:'madara', dmg:25, lines:['💥 اصطدام المجالات!','🔮 تسوكويومي اللامحدود يبتلع وضع السينين!','🔴 مادارا يفوز بالاصطدام الأول!','   "نملة كبيرة... لكنها نملة!"','🟠 ناروتو يتراجع ويتضرر!'] }
  if (n === 2) return { win:'madara', dmg:25, lines:['💥 اصطدام المجالات مجدداً!','🔴 تسوكويومي اللامحدود يطغى مرة أخرى!','🔴 مادارا يفوز للمرة الثانية!','   "هل فكرت في الاستسلام يا ناروتو؟"','🟠 ناروتو ينزف!'] }
  if (n === 3) return { win:'madara', dmg:25, lines:['💥 ثالث اصطدام!','🔮 تسوكويومي اللامحدود يسحق وضع السينين!','🔴 مادارا يفوز للمرة الثالثة!','   "إلى متى ستصمد؟"','🟠 ناروتو يتألم بشدة!'] }
  return { win:'naruto', dmg:35, lines:['💥 الاصطدام الرابع والأخير!','🌌 شاكرا كيوراما تمزق تسوكويومي اللامحدود!','🟠 ناروتو يفوز هذه المرة!','   "إرادة النار لا حدود لها!"','🔴 مادارا يتضرر بشدة!'] }
}

const INTRO_LOGS = [
  '🟠 ناروتو: لا تفهم قدومي لك خطأً يا مادارا',
  '         أنت المتحدي هنا',
  '',
  '🔴 مادارا: أنا المتحدي؟',
  '           أنت مجرد قزم على أرض المعركة',
  '',
  '🟠 ناروتو: انظر من يتكلم...',
  '         الهارب من قرية الورق',
  '',
  '⚡⚡⚡ بدأت المعركة! ⚡⚡⚡'
]

const newPvpGame = (narutoPlayer, narutoChat, madaraPlayer, madaraChat) => {
  const g = newGame('naruto')
  g.pvp          = true
  g.narutoPlayer = narutoPlayer
  g.madaraPlayer = madaraPlayer
  g.narutoChat   = narutoChat
  g.madaraChat   = madaraChat
  g.currentTurn  = 'naruto'
  g.logs         = [...INTRO_LOGS]
  g.teamWaiting      = true
  g.teamMode         = false
  g.tojiPlayer       = null
  g.tojiChat         = null
  g.mahoragaPlayer   = null
  g.mahoragaChat     = null
  g.tojiHP           = 80
  g.mahoragaHP       = 120
  g.tojiAlive        = false
  g.mahoragaAlive    = false
  g.spearActive      = false
  g.toji = { punch: 999, cloud: 999, katana: 5, spear: 2 }
  g.mahoraga_skills  = { slash: 999, adapt: 3, domainDestroy: 1, adaptedSlash: 0 }
  return g
}

const pvpDisplay = (g, char) => {
  const d = display({ ...g, char })
  const note = g.phase === 'end' ? '' : g.currentTurn === char ? '\n\n🎮 دورك! اكتب أمر هجوم' : '\n\n⏳ دور خصمك... انتظر'
  return { ...d, caption: d.caption + note }
}

const getNextTurn = (g) => {
  const order = ['naruto', 'sasuke', 'madara', 'obito']
  const alive  = order.filter(c => {
    if (c === 'naruto')   return g.narutoHP > 0
    if (c === 'madara')   return g.madaraHP > 0
    if (c === 'sasuke')   return g.tojiAlive && g.tojiHP > 0
    if (c === 'obito')    return g.mahoragaAlive && g.mahoragaHP > 0
    return false
  })
  if (!alive.length) return g.currentTurn
  const idx = alive.indexOf(g.currentTurn)
  return alive[(idx + 1) % alive.length]
}

const checkTeamWin = (g) => {
  const madaraDead = g.madaraHP <= 0 && (!g.mahoragaAlive || g.mahoragaHP <= 0)
  const narutoDead = g.narutoHP <= 0 && (!g.tojiAlive     || g.tojiHP     <= 0)
  if (madaraDead) return 'naruto'
  if (narutoDead) return 'madara'
  return null
}

const applyTeamDmg = (g, attackerChar, dmg, bypassInfinity = false) => {
  const narutoSide = ['naruto', 'sasuke']
  const madaraSide = ['madara', 'obito']
  if (narutoSide.includes(attackerChar)) {
    if (g.madaraHP > 0) { g.madaraHP = Math.max(g.madaraHP - dmg, 0); return { target: 'مادارا' } }
    else if (g.mahoragaAlive && g.mahoragaHP > 0) { g.mahoragaHP = Math.max(g.mahoragaHP - dmg, 0); return { target: 'أوبيتو' } }
  } else {
    if (!bypassInfinity && g.spearActive) { g.spearActive = false; return { speared: true } }
    if (!bypassInfinity && g.infinityActive) { g.infinityActive = false; return { absorbed: true } }
    if (g.narutoHP > 0) { g.narutoHP = Math.max(g.narutoHP - dmg, 0); return { target: 'ناروتو' } }
    else if (g.tojiAlive && g.tojiHP > 0) { g.tojiHP = Math.max(g.tojiHP - dmg, 0); return { target: 'ساسكي' } }
  }
  return {}
}

const teamDisplay = (g, char) => {
  const logs = g.logs.slice(-10).join('\n')
  const gl = `🟠 ناروتو  : ${bar(g.narutoHP)} ${g.narutoHP}%${g.infinityActive ? ' 🛡️' : ''}`
  const tl = g.tojiAlive ? `⚪ ساسكي  : ${bar(g.tojiHP)} ${g.tojiHP}%${g.spearActive ? ' 🔱' : ''}` : ''
  const sl = `🔴 مادارا: ${bar(g.madaraHP)} ${g.madaraHP}%`
  const ml = g.mahoragaAlive ? `🐉 أوبيتو: ${bar(g.mahoragaHP)} ${g.mahoragaHP}%` : ''
  const ms = g.mahoraga_skills || {}
  let cmds = ''
  if (char === 'naruto')
    cmds = `📊 راسينغان(${g.naruto?.blue||0}) راسينشوريكين(${g.naruto?.red||0}) شفاء(${g.naruto?.heal||0}) درع كيوراما(${g.naruto?.infinity||0}) بيجوداما(${g.naruto?.flash||0})\n⚔️ راسينغان | راسينشوريكين | مدمج | ريفرس | درع كيوراما | بيجوداما | سينين`
  else if (char === 'sasuke')
    cmds = `📊 كيرين(∞) اماتيراسو(${g.toji?.katana||0}) كاموي مصطنع(${g.toji?.spear||0})\n⚔️ تشيدوري | كيرين | اماتيراسو | كاموي\n💡 كل هجمات ساسكي تخترق درع كيوراما`
  else if (char === 'madara')
    cmds = `📊 سوسانو(${g.madara?.dismantle||0}) شفاء(${g.madara?.heal||0}) تسوكويومي(${g.madara?.field||0})\n⚔️ ضربة | سوسانو | موجة | ريفرس | تسوكويومي`
  else if (char === 'obito')
    cmds = `📊 كاموي(${ms.adapt||0}) دمار(${ms.domainDestroy||0})${ms.adaptedSlash > 0 ? ` مكيف(${ms.adaptedSlash})` : ''}\n⚔️ شريحة | كاموي | دمار${ms.adaptedSlash > 0 ? ' | مكيفة' : ''}`
  const charName = { naruto:'🟠 ناروتو', sasuke:'⚪ ساسكي', madara:'🔴 مادارا', obito:'🐉 أوبيتو' }
  const myTurn   = g.currentTurn === char
  const turnNote = myTurn ? '🎮 دورك الآن!' : `⏳ دور ${charName[g.currentTurn] || g.currentTurn}...`
  return {
    image: { url: THUMB },
    caption:
`╔═══━━━─── • ───━━━═══╗
   ⟡ ⚔️ وضع الفريق ⚔️ ⟡
╚═══━━━─── • ───━━━═══╝

🟠 فريق ناروتو:
${gl}${tl ? '\n' + tl : ''}

🔴 فريق مادارا:
${sl}${ml ? '\n' + ml : ''}

📜 الأحداث:
${logs}

${cmds}

${turnNote} | جولة ${g.round}
╚════════════════╝

> برعاية ايتادوري`
  }
}

const broadcastTeam = (conn, pg, exceptUser = null) => {
  const players = [
    { id: pg.narutoPlayer,   chat: pg.narutoChat,   char: 'naruto' },
    { id: pg.madaraPlayer,   chat: pg.madaraChat,   char: 'madara' },
    pg.tojiAlive     ? { id: pg.tojiPlayer,     chat: pg.tojiChat,     char: 'sasuke' } : null,
    pg.mahoragaAlive ? { id: pg.mahoragaPlayer, chat: pg.mahoragaChat, char: 'obito' }  : null,
  ].filter(p => p && p.id && p.id !== exceptUser)
  players.forEach(p => conn.sendMessage(p.chat, teamDisplay(pg, p.char)))
}

const startTeamBattle = (conn, gameKey) => {
  const db = readDB()
  const pg = db[gameKey]
  if (!pg || !pg.teamWaiting) return
  pg.teamWaiting = false
  pg.teamMode    = pg.tojiAlive || pg.mahoragaAlive
  pg.currentTurn = 'naruto'
  pg.logs.push('')
  if (pg.teamMode) {
    pg.logs.push('⚔️⚔️ وضع الفريق بدأ! ⚔️⚔️')
    pg.logs.push(`🟠 فريق ناروتو: ناروتو${pg.tojiAlive ? ' ⚡ ساسكي' : ''}`)
    pg.logs.push(`🔴 فريق مادارا: مادارا${pg.mahoragaAlive ? ' ⚡ أوبيتو' : ''}`)
    pg.logs.push('')
    pg.logs.push('🟠 ناروتو يبدأ الجولة الأولى!')
  } else {
    pg.logs.push('⚡ لم ينضم أحد للفرق')
    pg.logs.push('🥊 معركة 1 ضد 1 كلاسيكية!')
    pg.logs.push('🟠 ناروتو يبدأ!')
  }
  db[gameKey] = pg
  writeDB(db)
  if (pg.teamMode) {
    broadcastTeam(conn, pg)
  } else {
    conn.sendMessage(pg.narutoChat, pvpDisplay(pg, 'naruto'))
    conn.sendMessage(pg.madaraChat, pvpDisplay(pg, 'madara'))
  }
}

const applyPlayerAtk = (g, cmd) => {
  const isNaruto = g.char === 'naruto'
  let dmg = 0, msg = '', sp = null, err = null
  if (isNaruto) {
    if (cmd === 'راسينغان')    { if (!g.naruto.blue) return { err:'❌ نفدت طاقة الراسينغان!' }; dmg=15; g.naruto.blue--; msg='🟠 ناروتو: راسينغان!\n   💫 كرة التشاكرا الدوارة تسحق كل شيء!' }
    else if (cmd === 'راسينشوريكين')   { if (!g.naruto.red) return { err:'❌ نفد الراسينشوريكين!' }; dmg=15; g.naruto.red--; msg='🟡 ناروتو: راسينشوريكين!\n   💥 شفرة تشاكرا تمزق كل ما حولها!' }
    else if (cmd === 'مدمج')     { dmg=22; msg='⚪ ناروتو: وضع كيوراما + راسينغان!\n   🌪️ هجوم بقوة بيجو لا يُرد!' }
    else if (cmd === 'ريفرس')    { if (!g.naruto.heal) return { err:'❌ نفد الشفاء!' }; g.narutoHP=100; g.naruto.heal--; msg='✨ ناروتو: تجديد كيوراما!\n   💚 الجروح تختفي... شفاء كامل!'; sp='heal' }
    else if (cmd === 'درع كيوراما') { if (!g.naruto.infinity) return { err:'❌ نفد درع كيوراما!' }; g.infinityActive=true; g.naruto.infinity--; msg='∞ ناروتو: درع شاكرا كيوراما!\n   🛡️ حاجز لا يُخترق!'; sp='infinity' }
    else if (cmd === 'بيجوداما')     { if (!g.naruto.flash) return { err:'❌ استُخدمت البيجو داما!' }; if (g.phase!=='battle') return { err:'❌ البيجو داما في مرحلة القتال فقط!' }; dmg=35; g.naruto.flash--; msg='⚫ ناروتو: بيجو داما!!!\n   💥 انفجار مرعب!'; sp='flash' }
  } else {
    if (cmd === 'ضربة')      { dmg=18; msg='👊 مادارا: ضربة سوسانو معززة!\n   💪 قوة المُحيي لا تُقاوم!' }
    else if (cmd === 'سوسانو')    { if (!g.madara.dismantle) return { err:'❌ نفدت طاقة سوسانو!' }; dmg=12; g.madara.dismantle--; msg='🔪 مادارا: سيف سوسانو!\n   ⚔️ يمزق الشاكرا كالورق!' }
    else if (cmd === 'موجة')    { dmg=10; msg='🌊 مادارا: موجة شاكرا!\n   🌪️ موجة من شاكرا الرينيغان تجتاح المكان!' }
    else if (cmd === 'ريفرس')    { if (!g.madara.heal) return { err:'❌ نفد الشفاء!' }; g.madaraHP=100; g.madara.heal--; msg='✨ مادارا: تجديد خلايا هاشيراما!\n   💚 لا يموت بهذه السهولة!'; sp='heal' }
    else if (cmd === 'كيوبي') { if (!g.madara.mahoraga) return { err:'❌ كيوبي استنفد قوته!' }; dmg=35; g.madara.mahoraga--; msg='🐉 مادارا: استدعاء كيوبي!\n   ⚙️ التحكم بالبيجو عبر الرينيغان!\n   💥 ضربة تخترق درع كيوراما!'; sp='mahoraga' }
  }
  return { dmg, msg, sp, err }
}

const handler = async (m, { conn, command }) => {
  const u  = m.sender
  const db = readDB()

  // ══ إصلاح: تنظيف الأمر من أي مسافات أو رموز زيادة ══
  const cmd = (command || '').trim()

  if (cmd === 'شيبودن') {
    return conn.sendMessage(m.chat, {
      image: { url: THUMB },
      caption:
`╔═══━━━─── • ───━━━═══╗
   ⟡ 𓂀 𝗠 𝗎 𝗗 𝗨 𓂀 ⟡
╚═══━━━─── • ───━━━═══╝

⚡⚡⚡ لقد بدأت مواجهة نهائية ⚡⚡⚡

المعركة النهائية:
🟠 ناروتو أوزوماكي (الهوكاجي السابع)
🔴 مادارا أوتشيها (أقوى أوتشيها في التاريخ)

اختر شخصيتك:
🟠 .ناروتو
🔴 .مادارا

   ⟡ الوقت قد حان ⟡
╚════════════════╝

> برعاية ايتادوري`
    }, { quoted: m })
  }

  if (cmd === 'ساسكي') {
    if (db[u]) return m.reply('❌ لديك لعبة بالفعل! اكتب .انهاء أولاً\n\n> برعاية ايتادوري')
    const entry = Object.entries(db).find(([k, v]) =>
      k.startsWith('pvp_') && v.teamWaiting && !v.tojiPlayer &&
      v.narutoPlayer !== u && v.madaraPlayer !== u
    )
    if (!entry) return m.reply(
`⚠️ لا توجد مباريات تنتظر الآن!

💡 انتظر حتى يبدأ لاعبان معركة
   ثم اكتب .ساسكي خلال 40 ثانية

> برعاية ايتادوري`
    )
    const [gameKey, pg] = entry
    pg.tojiPlayer = u
    pg.tojiChat   = m.chat
    pg.tojiAlive  = true
    db[u] = { pvp: true, gameKey, char: 'sasuke' }
    db[gameKey] = pg
    writeDB(db)
    const joinMsg =
`╔═══━━━─── • ───━━━═══╗
   ⟡ ⚪ ساسكي أوتشيها ⟡
╚═══━━━─── • ───━━━═══╝

⚪ انضممت كـ ساسكي أوتشيها!

📖 معلومات الشخصية:
🔒 شاكرا الرعد والنار: عالية جداً
👁️ المانجكيو الأبدي: نشط
✨ كل هجماتك تخترق درع كيوراما تلقائياً

⚔️ مهاراتك:
├ .تشيدوري  → سيف الرعد (20 ضرر) ∞
├ .كيرين    → سحابة كيرين الرعدية (28 ضرر) ∞
├ .اماتيراسو → نار اماتيراسو السوداء (35 ضرر) x5
└ .كاموي    → كاموي مصطنع x2
              يبطل الهجوم القادم

⏳ انتظر بدء المعركة...
╚════════════════╝

> برعاية ايتادوري`
    conn.sendMessage(pg.narutoChat, { text: `⚪ ساسكي أوتشيها انضم لفريقك!\n"قوة الرعد والنار... لإنهاء هذه الحرب"\n\n> برعاية ايتادوري` })
    conn.sendMessage(pg.madaraChat, { text: `⚠️ ساسكي انضم لفريق ناروتو!\nحامل المانجكيو الأبدي... الأخطر!\n\n> برعاية ايتادوري` })
    return conn.sendMessage(m.chat, { image: { url: THUMB }, caption: joinMsg }, { quoted: m })
  }

  if (cmd === 'أوبيتو' && !db[u]) {
    const entry = Object.entries(db).find(([k, v]) =>
      k.startsWith('pvp_') && v.teamWaiting && !v.mahoragaPlayer &&
      v.narutoPlayer !== u && v.madaraPlayer !== u
    )
    if (!entry) return m.reply(
`⚠️ لا توجد مباريات تنتظر الآن!

💡 انتظر حتى يبدأ لاعبان معركة
   ثم اكتب .أوبيتو خلال 40 ثانية

> برعاية ايتادوري`
    )
    const [gameKey, pg] = entry
    pg.mahoragaPlayer = u
    pg.mahoragaChat   = m.chat
    pg.mahoragaAlive  = true
    db[u] = { pvp: true, gameKey, char: 'obito' }
    db[gameKey] = pg
    writeDB(db)
    const joinMsg =
`╔═══━━━─── • ───━━━═══╗
   ⟡ 🐉 الرجل المقنّع ⟡
╚═══━━━─── • ───━━━═══╝

🐉 انضممت كـ أوبيتو أوتشيها!

📖 معلومات الشخصية:
⚙️ قدرة كاموي: نشطة دائماً
🛡️ نقاط الحياة: 120 (الأكثر متانة)
🍩 جوبيتو... يخدم الخطة!

⚔️ مهاراتك:
├ .شريحة  → شفرة كاموي (25 ضرر) ∞
├ .كاموي  → تفعيل بُعد كاموي x3
├ .مكيفة  → اختراق كاموي يخترق درع كيوراما (40 ضرر!)
└ .دمار   → تدمير المجال بكاموي! يكسر درع كيوراما x1

⏳ انتظر بدء المعركة...
╚════════════════╝

> برعاية ايتادوري`
    conn.sendMessage(pg.madaraChat, { text: `🐉 أوبيتو انضم لفريقك!\nالرجل المقنّع يخدم الخطة!\n\n> برعاية ايتادوري` })
    conn.sendMessage(pg.narutoChat, { text: `⚠️ أوبيتو انضم لفريق مادارا!\nمن تكيّف مع كاموي وتلاعب بالحرب...\n\n> برعاية ايتادوري` })
    return conn.sendMessage(m.chat, { image: { url: THUMB }, caption: joinMsg }, { quoted: m })
  }

  if (cmd === 'ناروتو' || cmd === 'مادارا') {
    const pickedChar   = cmd === 'ناروتو' ? 'naruto' : 'madara'
    const oppositeChar = pickedChar === 'naruto' ? 'madara' : 'naruto'
    const pending      = db.pending

    if (pending && pending.char === oppositeChar && pending.user !== u) {
      const gameKey      = `pvp_${Date.now()}`
      const narutoPlayer = pickedChar === 'naruto' ? u : pending.user
      const madaraPlayer = pickedChar === 'madara' ? u : pending.user
      const narutoChat   = pickedChar === 'naruto' ? m.chat : pending.chat
      const madaraChat   = pickedChar === 'madara' ? m.chat : pending.chat
      const g = newPvpGame(narutoPlayer, narutoChat, madaraPlayer, madaraChat)
      db[narutoPlayer] = { pvp: true, gameKey, char: 'naruto' }
      db[madaraPlayer] = { pvp: true, gameKey, char: 'madara' }
      db[gameKey]      = g
      delete db.pending
      writeDB(db)
      const teamInviteMsg =
`╔═══━━━─── • ───━━━═══╗
   ⟡ 🔱 وضع الفريق 🔱 ⟡
╚═══━━━─── • ───━━━═══╝

⚔️ تم إيجاد خصم!
⏳ 40 ثانية للانضمام كفريق!

🟠 فريق ناروتو:
   ⟡ ناروتو أوزوماكي ✅ (محجوز)
   ⟡ ساسكي أوتشيها ← اكتب .ساسكي

🔴 فريق مادارا:
   ⟡ مادارا أوتشيها ✅ (محجوز)
   ⟡ أوبيتو أوتشيها ← اكتب .أوبيتو

💡 بعد 40 ثانية:
   - انضم الاثنان → معركة فريق 2 ضد 2
   - انضم واحد   → معركة 2 ضد 1
   - لم ينضم أحد → معركة 1 ضد 1 عادية

   ⟡ الوقت بدأ الآن ⟡
╚════════════════╝

> برعاية ايتادوري`
      conn.sendMessage(narutoChat, { image: { url: THUMB }, caption: teamInviteMsg })
      conn.sendMessage(madaraChat, { image: { url: THUMB }, caption: teamInviteMsg })
      setTimeout(() => startTeamBattle(conn, gameKey), 40000)
      return
    }

    db[u] = { waiting: true, char: pickedChar }
    db.pending = { user: u, char: pickedChar, chat: m.chat, time: Date.now() }
    writeDB(db)
    return conn.sendMessage(m.chat, {
      image: { url: THUMB },
      caption:
`╔═══━━━─── • ───━━━═══╗
   ⟡ 𓂀 𝗠 𝗎 𝗗 𝗨 𓂀 ⟡
╚═══━━━─── • ───━━━═══╝

⏳ اخترت ${cmd === 'ناروتو' ? '🟠 ناروتو' : '🔴 مادارا'}!

في انتظار لاعب ${oppositeChar === 'madara' ? '🔴 مادارا' : '🟠 ناروتو'}...

🤖 اكتب .مود للعب ضد الروبوت الآن

   ⟡ الوقت قد حان ⟡
╚════════════════╝

> برعاية ايتادوري`
    }, { quoted: m })
  }

  if (cmd === 'مود') {
    if (!db[u] || !db[u].waiting) return m.reply('❌ ليس لديك لعبة بانتظار\nاكتب .شيبودن أولاً\n\n> برعاية ايتادوري')
    const pickedChar = db[u].char
    if (db.pending && db.pending.user === u) delete db.pending
    const g = newGame(pickedChar)
    g.logs = [...INTRO_LOGS]
    db[u] = g
    writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  if (!db[u]) return m.reply('❌ اكتب: .شيبودن\n\n> برعاية ايتادوري')
  if (db[u].waiting) return m.reply('⏳ في انتظار خصم...\nاكتب .مود للعب ضد الروبوت\n\n> برعاية ايتادوري')

  if (cmd === 'انهاء') {
    if (db[u].pvp) {
      const gameKey = db[u].gameKey
      const pg = db[gameKey]
      if (pg) {
        const allPlayers = [pg.narutoPlayer, pg.madaraPlayer, pg.tojiPlayer, pg.mahoragaPlayer].filter(Boolean)
        allPlayers.forEach(p => { if (p !== u && db[p]) delete db[p] })
        delete db[gameKey]
      }
    }
    if (db[u].waiting && db.pending && db.pending.user === u) delete db.pending
    delete db[u]
    writeDB(db)
    return m.reply('✅ تم إنهاء اللعبة\n\n> برعاية ايتادوري')
  }

  const g = db[u]

  const allCmds = [
    'راسينغان','راسينشوريكين','مدمج','سينين','ريفرس','بيجوداما','درع كيوراما',
    'ضربة','سوسانو','موجة','كيوبي',
    'تشيدوري','كيرين','اماتيراسو','كاموي',
    'شريحة','تكيف','دمار','مكيفة',
    'بنفسجي'
  ]
  if (!allCmds.includes(cmd)) return

  if (g.phase === 'end') return m.reply('⚔️ انتهت المعركة!\nاكتب .شيبودن لبدء جديدة\n\n> برعاية ايتادوري')
  if (g.phase === 'cutscene') return m.reply('⏳ انتظر... كيوبي تهاجم!\n\n> برعاية ايتادوري')

  // ══ PvP ══
  if (g.pvp) {
    const gameKey = g.gameKey
    const myChar  = g.char
    const pg      = db[gameKey]
    if (!pg) return m.reply('❌ انتهت اللعبة\n\n> برعاية ايتادوري')
    if (pg.teamWaiting) return m.reply('⏳ انتظر بدء المعركة!\nالوقت المتبقي أقل من 40 ثانية...\n\n> برعاية ايتادوري')
    if (pg.phase === 'end') return m.reply('⚔️ انتهت المعركة!\n\n> برعاية ايتادوري')
    if (pg.currentTurn !== myChar) {
      const charName = { naruto:'🟠 ناروتو', sasuke:'⚪ ساسكي', madara:'🔴 مادارا', obito:'🐉 أوبيتو' }
      return m.reply(`⏳ انتظر! دور ${charName[pg.currentTurn] || pg.currentTurn} الآن\n\n> برعاية ايتادوري`)
    }

    pg.round++
    pg.logs.push('')
    let dmg = 0, msg = '', sp = null, err = null
    let bypassInfinity = false

    if (myChar === 'sasuke') {
      bypassInfinity = true
      if (cmd === 'تشيدوري') { dmg=20; msg='⚪ ساسكي: تشيدوري!\n   💪 "ألف طائر يصرخون!"\n   ✨ اخترق درع كيوراما بشكل طبيعي!' }
      else if (cmd === 'كيرين') { dmg=28; msg='⚪ ساسكي: كيرين!\n   🌀 سحابة الرعد تحطم كل شيء!\n   ✨ لا دفاع يصمد أمام شاكرا الرعد!' }
      else if (cmd === 'اماتيراسو') {
        if (!pg.toji.katana) { err='❌ نفدت ضربات اماتيراسو! (٥/٥)' }
        else { dmg=35; pg.toji.katana--; msg='⚪ ساسكي: اماتيراسو!\n   🔥 "نار سوداء لا تنطفئ..."\n   💀 لا اللانهائية ولا المجال يوقفها!' }
      } else if (cmd === 'كاموي') {
        if (!pg.toji.spear) { err='❌ نفد كاموي المصطنع! (٢/٢)' }
        else { pg.toji.spear--; pg.spearActive=true; msg='🔱 ساسكي: كاموي مصطنع!\n   ✨ "تشتيت الهجوم في بُعد آخر..."\n   🛡️ الهجوم القادم سيُبطل تلقائياً!'; sp='spear' }
      } else { err='❌ هذا الأمر غير متاح لساسكي!\nأوامرك: تشيدوري | كيرين | اماتيراسو | كاموي' }
    }

    else if (myChar === 'obito') {
      const ms = pg.mahoraga_skills
      if (cmd === 'شريحة') { dmg=25; msg='🐉 أوبيتو: شفرة كاموي!\n   ⚔️ "البُعد المكاني يقطع كل ما أمامه!"\n   💥 موجة قاطعة تهز المكان!' }
      else if (cmd === 'تكيف') {
        if (!ms.adapt) { err='❌ نفدت قدرة كاموي! (٣/٣)' }
        else { ms.adapt--; ms.adaptedSlash++; msg='⚙️ أوبيتو: تفعيل بُعد كاموي!\n   🔄 العين الدوارة تدور وتدور وتدور...\n   💡 ضربة الاختراق جاهزة!\n   الآن اكتب .مكيفة لإطلاق ضربة 40 ضرر!'; sp='adapt_passive' }
      } else if (cmd === 'دمار') {
        if (!ms.domainDestroy) { err='❌ استُخدم تدمير المجال بالفعل!' }
        else { ms.domainDestroy--; pg.infinityActive=false; pg.spearActive=false; msg='🐉 أوبيتو: تدمير المجال بكاموي!\n   💥 "يحطم درع كيوراما وكل مجال نشط!"\n   🔱 كاموي مادارا... يتحطم!\n   ∞ درع كيوراما... ينهار!'; sp='domainDestroy' }
      } else if (cmd === 'مكيفة') {
        if (!ms.adaptedSlash) { err='❌ لا توجد ضربة اختراق جاهزة!\nاستخدم .كاموي أولاً' }
        else { dmg=40; bypassInfinity=true; ms.adaptedSlash--; msg='🐉 أوبيتو: اختراق كاموي!!!\n   ⚙️ "بُعد آخر... بدون مهرب!"\n   💜 الضربة تخترق كل دفاع!\n   💥 ٤٠ ضرر نقي!' }
      } else { err='❌ هذا الأمر غير متاح لأوبيتو!\nأوامرك: شريحة | كاموي | دمار | مكيفة' }
    }

    else if (pg.teamMode) {
      const pvpAteam = {
        naruto: {
          راسينغان:      { d:15, m:'🟠 ناروتو: راسينغان!\n   "لا مفر من دوامة التشاكرا يا مادارا!"' },
          راسينشوريكين:  { d:15, m:'🟡 ناروتو: راسينشوريكين!\n   "هل تشعر بهذا؟"' },
          مدمج:          { d:22, m:'⚪ ناروتو: وضع كيوراما + راسينغان!\n   "أنا لم أبدأ بعد!"' },
          سينين:         { d:30, m:'🌌 ناروتو: وضع السينين الكامل!\n   "ابتلع كل شيء!"', sp:'field_g' },
          ريفرس:         { d:0,  m:'💚 ناروتو: تجديد كيوراما! شفاء كامل!', sp:'heal_g' },
          'درع كيوراما': { d:0,  m:'∞ ناروتو: درع شاكرا كيوراما! حاجز لا يُخترق!', sp:'infinity' },
          بيجوداما:      { d:35, m:'⚫ ناروتو: بيجو داما!!!\n   "انفجار مرعب يهز الوجود!"', sp:'flash_g' },
        },
        madara: {
          ضربة:    { d:18, m:'👊 مادارا: ضربة سوسانو!\n   "قوة المُحيي لا تُقاوم!"' },
          سوسانو:  { d:12, m:'🔪 مادارا: سيف سوسانو!', sp:'dismantle' },
          موجة:    { d:10, m:'🌊 مادارا: موجة شاكرا!' },
          تسوكويومي: { d:30, m:'🔮 مادارا: تسوكويومي اللامحدود!', sp:'field_s' },
          ريفرس:   { d:0,  m:'💚 مادارا: تجديد هاشيراما! شفاء كامل!', sp:'heal_s' },
          كيوبي:   { d:35, m:'🐉 مادارا: يقوي أوبيتو!\n   "خذ شاكرا البيجو الزائدة!"', sp:'boost_m' },
        }
      }
      const a = pvpAteam[myChar]?.[cmd]
      if (!a) { db[gameKey]=pg; writeDB(db); return conn.sendMessage(m.chat, teamDisplay(pg, myChar), { quoted: m }) }
      msg=a.m; dmg=a.d; sp=a.sp||null
      if (sp==='heal_g')   { if (!pg.naruto.heal) { err='❌ نفد الشفاء!' } else { pg.narutoHP=100; pg.naruto.heal-- } }
      if (sp==='heal_s')   { if (!pg.madara.heal) { err='❌ نفد الشفاء!' } else { pg.madaraHP=100; pg.madara.heal-- } }
      if (sp==='infinity') { if (!pg.naruto.infinity) { err='❌ نفد درع كيوراما!' } else { pg.infinityActive=true; pg.naruto.infinity--; dmg=0 } }
      if (sp==='flash_g')  { if (!pg.naruto.flash) { err='❌ استُخدمت البيجو داما!' } else { pg.naruto.flash-- } }
      if (sp==='dismantle') { if (!pg.madara.dismantle) { err='❌ نفدت طاقة سوسانو!' } else { pg.madara.dismantle-- } }
      if (sp==='boost_m' && pg.mahoragaAlive) { pg.mahoraga_skills.adaptedSlash++; msg+= '\n   ⚙️ أوبيتو يكتسب ضربة اختراق إضافية!'; dmg=0 }
    }

    else {
      const pvpA = {
        naruto: {
          راسينغان:     {d:15, m:'🟠 ناروتو: راسينغان!\n   "لا مفر من دوامة التشاكرا!"'},
          راسينشوريكين: {d:15, m:'🟡 ناروتو: راسينشوريكين!\n   "هل تشعر بهذا؟"'},
          مدمج:         {d:22, m:'⚪ ناروتو: وضع كيوراما + راسينغان!\n   "أنا لم أبدأ بعد!"'},
          سينين:        {d:30, m:'🌌 ناروتو: وضع السينين الكامل!'},
          ريفرس:        {d:0,  m:'💚 ناروتو: تجديد كيوراما!', sp:'heal_g'},
          'درع كيوراما':{d:0,  m:'∞ ناروتو: درع شاكرا كيوراما!', sp:'infinity'},
          بيجوداما:     {d:35, m:'⚫ بيجو داما!!!', sp:'flash_g'},
        },
        madara: {
          ضربة:   {d:18, m:'👊 مادارا: ضربة سوسانو!'},
          سوسانو: {d:12, m:'🔪 مادارا: سيف سوسانو!', sp:'dismantle'},
          موجة:   {d:10, m:'🌊 مادارا: موجة شاكرا!'},
          تسوكويومي: {d:30, m:'🔮 مادارا: تسوكويومي اللامحدود!'},
          ريفرس:  {d:0,  m:'💚 مادارا: تجديد هاشيراما!', sp:'heal_s'},
          كيوبي:  {d:35, m:'🐉 كيوبي!', sp:'mah_s'},
        }
      }
      const a = pvpA[myChar]?.[cmd] || { d:10, m:'⚔️ يهاجم!' }
      dmg=a.d; msg=a.m; sp=a.sp||null
      if (sp==='heal_g')   pg.narutoHP=100
      if (sp==='heal_s')   pg.madaraHP=100
      if (sp==='infinity') { pg.infinityActive=true; dmg=0 }
      if (sp==='dismantle') { if (!pg.madara.dismantle) { err='❌ نفدت طاقة سوسانو!' } else pg.madara.dismantle-- }
    }

    if (err) {
      pg.logs.push(err); db[gameKey]=pg; writeDB(db)
      const disp = pg.teamMode ? teamDisplay(pg, myChar) : pvpDisplay(pg, myChar)
      return conn.sendMessage(m.chat, disp, { quoted: m })
    }

    pg.logs.push(msg)

    if (dmg > 0 && !['adapt_passive','domainDestroy','spear','infinity'].includes(sp)) {
      if (pg.teamMode) {
        const res = applyTeamDmg(pg, myChar, dmg, bypassInfinity)
        if (res.absorbed) { pg.logs.push('∞ درع كيوراما امتص الهجوم!') }
        else if (res.speared) { pg.logs.push('🔱 كاموي مادارا يبطل الهجوم!') }
        else if (res.target) { pg.logs.push(`   💥 ${res.target} يتلقى ${dmg} ضرر!`) }
      } else {
        if (myChar === 'naruto') {
          pg.madaraHP = Math.max(pg.madaraHP - dmg, 0)
        } else {
          if (pg.infinityActive) { pg.logs.push('∞ درع كيوراما امتص الهجوم!'); pg.infinityActive=false }
          else { pg.narutoHP = Math.max(pg.narutoHP - dmg, 0) }
        }
      }
    }

    let winner = null
    if (pg.teamMode) { winner = checkTeamWin(pg) }
    else {
      if (pg.narutoHP <= 0) winner = 'madara'
      if (pg.madaraHP <= 0) winner = 'naruto'
    }

    if (winner) {
      pg.logs.push('')
      if (winner === 'naruto') {
        pg.logs.push('🟠⚡ انتصر فريق ناروتو! ⚡🟠')
        pg.logs.push(pg.tojiAlive ? '"ناروتو وساسكي... الثنائي الذي لا يُقهر!"' : '"الهوكاجي السابع انتصر!"')
      } else {
        pg.logs.push('🔴⚡ انتصر فريق مادارا! ⚡🔴')
        pg.logs.push(pg.mahoragaAlive ? '"مادارا وأوبيتو... لا شيء يقف في وجههما!"' : '"أقوى أوتشيها لا يُهزم!"')
      }
      pg.phase = 'end'
      const allPlayers = [pg.narutoPlayer, pg.madaraPlayer, pg.tojiPlayer, pg.mahoragaPlayer].filter(Boolean)
      db[gameKey] = pg
      allPlayers.forEach(p => { if (db[p]) delete db[p] })
      writeDB(db)
      if (pg.teamMode) {
        broadcastTeam(conn, pg)
        conn.sendMessage(m.chat, teamDisplay(pg, myChar), { quoted: m })
      } else {
        const oppChar = myChar === 'naruto' ? 'madara' : 'naruto'
        const oppChat = myChar === 'naruto' ? pg.madaraChat : pg.narutoChat
        conn.sendMessage(oppChat, pvpDisplay(pg, oppChar))
        conn.sendMessage(m.chat, pvpDisplay(pg, myChar), { quoted: m })
      }
      return
    }

    pg.currentTurn = pg.teamMode ? getNextTurn(pg) : (myChar === 'naruto' ? 'madara' : 'naruto')
    db[gameKey] = pg
    writeDB(db)

    if (pg.teamMode) {
      broadcastTeam(conn, pg, u)
      return conn.sendMessage(m.chat, teamDisplay(pg, myChar), { quoted: m })
    } else {
      const oppChar = myChar === 'naruto' ? 'madara' : 'naruto'
      const oppChat = myChar === 'naruto' ? pg.madaraChat : pg.narutoChat
      conn.sendMessage(oppChat, pvpDisplay(pg, oppChar))
      return conn.sendMessage(m.chat, pvpDisplay(pg, myChar), { quoted: m })
    }
  }

  // ══ ضد البوت ══
  const isNaruto = g.char === 'naruto'
  g.round++
  g.logs.push('')

  if (g.phase === 'final') {
    if (isNaruto) {
      if (cmd === 'راسينغان' && g.agitoActive) {
        g.agitoHP = 0; g.agitoActive = false
        g.logs.push('🟠 ناروتو: راسينغان!')
        g.logs.push('   يطلق دوامة التشاكرا مباشرة على أوبيتو!')
        g.logs.push('')
        g.logs.push('🐉 أوبيتو يتلقى الضربة مباشرة!')
        g.logs.push('💥 أوبيتو... ينهار ويتحطم!')
        g.logs.push('🔴 مادارا: لا!!! أوبيتو!!!')
        g.logs.push('')
        g.logs.push('💜 الآن اكتب .بنفسجي لإطلاق الضربة الأخيرة!')
        db[u] = g; writeDB(db)
        return conn.sendMessage(m.chat, display(g), { quoted: m })
      } else if (cmd === 'بنفسجي' && !g.agitoActive) {
        g.logs.push('🟠 ناروتو يرفع يديه نحو السماء...')
        g.logs.push('🟡 الراسينشوريكين في يد... 🟠 الراسينغان في يد أخرى...')
        g.logs.push('💜 يلتقيان في المنتصف...')
        g.logs.push('')
        g.logs.push('💜💜💜 راسينغان البيجو الأقصى!!! 💜💜💜')
        g.logs.push('   "يمحو كل ما يلمسه من الوجود!"')
        g.logs.push('')
        g.logs.push('🐉 كيوبي... يختفي في الانفجار!')
        g.logs.push('🔴 مادارا يتلقى ضربة لا توصف!')
        g.madaraHP = 0; g.mahoragaActive = false; g.phase = 'end'
        db[u] = g; writeDB(db)
        setTimeout(() => {
          const fr = readDB(); const g2 = fr[u]; if (!g2) return
          g2.logs.push('')
          g2.logs.push('🔴 مادارا: هذا... لا يمكن...')
          g2.logs.push('🔴 مادارا يسقط على ركبتيه...')
          g2.logs.push('')
          g2.logs.push('🟠 ناروتو: قلت لك يا مادارا سأفوز')
          g2.logs.push('🔴 مادارا: مت بفخر')
          g2.logs.push('           لقد كنت الأقوى ناروتو أوزوماكي')
          g2.logs.push('')
          g2.logs.push('🏁 ══ انتصر ناروتو! ══ 🏁')
          fr[u] = g2; writeDB(fr); conn.sendMessage(m.chat, display(g2))
        }, 2000)
        return conn.sendMessage(m.chat, display(g), { quoted: m })
      } else if (cmd === 'راسينغان' && !g.agitoActive) {
        g.logs.push('💡 أوبيتو مات! اكتب .بنفسجي الآن!')
      } else {
        const fatk = {
          راسينشوريكين: {d:15, m:'🟡 ناروتو: راسينشوريكين!'},
          مدمج:         {d:22, m:'⚪ ناروتو: مدمج!'},
          'درع كيوراما':{d:0,  m:'∞ درع كيوراما!', sp:'infinity'}
        }[cmd] || {d:12, m:'⚪ ناروتو: يهاجم!'}
        g.logs.push(fatk.m)
        if (fatk.sp === 'infinity') { g.infinityActive = true }
        else { g.madaraHP = Math.max(g.madaraHP - fatk.d, 0) }
        const bot = botAtk(g); g.logs.push(bot.m)
        if (g.infinityActive) { g.logs.push('∞ درع كيوراما امتص الهجوم!'); g.infinityActive=false }
        else { g.narutoHP = Math.max(g.narutoHP - bot.d, 0) }
      }
    } else {
      const sa = {
        ضربة:   {d:18, m:'👊 مادارا: ضربة سوسانو!'},
        سوسانو: {d:12, m:'🔪 سيف سوسانو!'},
        موجة:   {d:10, m:'🌊 موجة شاكرا!'}
      }[cmd] || {d:12, m:'👊 يهاجم!'}
      g.logs.push(sa.m); g.narutoHP = Math.max(g.narutoHP - sa.d, 0)
      if (g.narutoHP <= 0) { g.logs.push(''); g.logs.push('⚔️ انتصر مادارا في المعركة الأخيرة!'); g.phase='end' }
      else { const bot = botAtk(g); g.logs.push(bot.m); g.madaraHP = Math.max(g.madaraHP - bot.d, 0) }
    }
    db[u] = g; writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  if (g.phase === 'battle') {
    if (cmd === 'سينين' || cmd === 'تسوكويومي') { g.logs.push('❌ لا يمكن تفعيل المجال! الدماغ تضرر!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    const res = applyPlayerAtk(g, cmd)
    if (res.err) { g.logs.push(res.err); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    g.logs.push(res.msg)

    if (res.sp === 'flash') {
      g.madaraHP = Math.max(g.madaraHP - res.dmg, 0)
      g.mahoragaActive = true
      g.phase = 'cutscene'
      g.logs.push('')
      g.logs.push('🐉 كيوبي تظهر من الانفجار!')
      g.logs.push('   تحارب ناروتو لـ 20 ثانية...')
      db[u] = g; writeDB(db)
      setTimeout(() => {
        const fr = readDB(); const g2 = fr[u]; if (!g2 || g2.phase === 'end') return
        g2.logs.push('')
        g2.logs.push('🔴 مادارا: استيقظت!')
        g2.logs.push('           ثلاثة ضد واحد!')
        g2.logs.push('🗡️ مادارا: استدعاء... أوبيتو!')
        g2.logs.push('')
        g2.logs.push('⚠️ أوبيتو وكيوبي ومادارا يهاجمون معاً!')
        g2.logs.push('💡 اقتل أوبيتو أولاً بـ .راسينغان')
        g2.agitoActive = true; g2.agitoHP = 100
        g2.mahoragaActive = false; g2.phase = 'final'
        fr[u] = g2; writeDB(fr)
        conn.sendMessage(m.chat, display(g2))
      }, 20000)
      return conn.sendMessage(m.chat, display(g), { quoted: m })
    } else if (res.sp === 'mahoraga') { g.narutoHP = Math.max(g.narutoHP - res.dmg, 0) }
    else if (res.sp !== 'heal' && res.sp !== 'infinity') {
      if (isNaruto) g.madaraHP = Math.max(g.madaraHP - res.dmg, 0)
      else          g.narutoHP = Math.max(g.narutoHP - res.dmg, 0)
    }

    if (!isNaruto && g.narutoHP <= 0) { g.logs.push(''); g.logs.push('🟠 ناروتو: لقد كنت مذهلاً...'); g.logs.push('⚔️ انتصر مادارا!'); g.phase='end'; db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    if (!g.mahoragaActive) {
      const bot = botAtk(g); g.logs.push(bot.m)
      if (isNaruto) {
        if (g.infinityActive) { g.logs.push('∞ درع كيوراما امتص!'); g.logs.push('🔴 مادارا: مستحيل!'); g.infinityActive=false }
        else g.narutoHP = Math.max(g.narutoHP - bot.d, 0)
      } else { g.madaraHP = Math.max(g.madaraHP - bot.d, 0) }
    }
    if (isNaruto  && g.narutoHP <= 0) { g.logs.push(''); g.logs.push('🔴 مادارا: "حتى الأقوى يسقط..."'); g.logs.push('⚔️ انتصر مادارا!'); g.phase='end' }
    if (!isNaruto && g.madaraHP <= 0) { g.logs.push(''); g.logs.push('🟠 ناروتو: "لم يكن أمامك خيار يا مادارا"'); g.logs.push('⚔️ انتصر ناروتو!'); g.phase='end' }
    db[u] = g; writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  if (g.phase === 'started') {
    if (cmd === 'بيجوداما') { g.logs.push('⚠️ البيجو داما في مرحلة القتال المباشر فقط!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    if (cmd === 'سينين' || cmd === 'تسوكويومي') {
      if (isNaruto) {
        if (!g.naruto.field) { g.logs.push('❌ نفد وضع السينين لديك!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
        g.naruto.field--; g.naruto.fieldCount++
        g.logs.push('🌌 ناروتو: وضع السينين الكامل!'); g.logs.push('   ∞ تفعيل وضع السينين!')
      } else {
        if (!g.madara.field) { g.logs.push('❌ نفد تسوكويومي لديك!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
        g.madara.field--; g.madara.fieldCount++
        g.logs.push('🔮 مادارا: تسوكويومي اللامحدود!'); g.logs.push('   🌑 تفعيل عالم تسوكويومي اللامحدود!')
      }
      const botHasField = isNaruto ? g.madara.field > 0 : g.naruto.field > 0
      if (botHasField) {
        g.logs.push('')
        if (isNaruto) { g.logs.push('🔴 مادارا: لن تسحبني لوضع السينين!'); g.logs.push('🔮 مادارا يفعّل تسوكويومي فوراً!'); g.madara.field--; g.madara.fieldCount++ }
        else { g.logs.push('🟠 ناروتو: لن تحبسني في تسوكويومي!'); g.logs.push('🌌 ناروتو يفعّل وضع السينين فوراً!'); g.naruto.field--; g.naruto.fieldCount++ }
        g.fieldCollisions++
        const cr = collisionResult(g.fieldCollisions)
        cr.lines.forEach(l => g.logs.push(l))
        if (cr.win === 'madara') g.narutoHP = Math.max(g.narutoHP - cr.dmg, 0)
        else                     g.madaraHP = Math.max(g.madaraHP - cr.dmg, 0)
        if (g.fieldCollisions >= 4) {
          g.phase = 'cutscene'; db[u]=g; writeDB(db)
          setTimeout(() => {
            const fr = readDB(); const g2 = fr[u]; if (!g2) return
            g2.logs.push(''); g2.logs.push('🔴 مادارا: كيوبي... هروب!!'); g2.logs.push('🐉 كيوبي يحمل مادارا بعيداً!')
            g2.logs.push(''); g2.logs.push('🧠💥 تلف شبكة شاكرا ناروتو!'); g2.logs.push('🟠 ناروتو يسقط على ركبتيه...')
            g2.logs.push(''); g2.logs.push('🔴 مادارا: لن يفعل وضع السينين مرة أخرى يا ناروتو أوزوماكي')
            g2.logs.push(''); g2.logs.push('🔴 مادارا: لقد أتلفت شبكتك العصبية!')
            g2.logs.push('           تجديدك المستمر أتلف شبكتك!'); g2.logs.push('')
            g2.logs.push('⚡⚡ القتال المباشر الآن! لا مجالات! ⚡⚡')
            g2.brainDamage=true; g2.naruto.field=0; g2.madara.field=0; g2.phase='battle'
            fr[u]=g2; writeDB(fr); conn.sendMessage(m.chat, display(g2))
          }, 2000)
          return conn.sendMessage(m.chat, display(g), { quoted: m })
        }
      } else {
        g.logs.push(isNaruto ? '🔴 مادارا لا يملك مجالاً!' : '🟠 ناروتو لا يملك وضع سينين!')
        g.logs.push(isNaruto ? '🟠 ناروتو يفوز بالمجال!' : '🔴 مادارا يفوز بالمجال!')
        if (isNaruto) g.madaraHP = Math.max(g.madaraHP - 30, 0)
        else          g.narutoHP = Math.max(g.narutoHP - 30, 0)
      }
      db[u]=g; writeDB(db)
      return conn.sendMessage(m.chat, display(g), { quoted: m })
    }
    const res = applyPlayerAtk(g, cmd)
    if (res.err) { g.logs.push(res.err); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    g.logs.push(res.msg)
    if (res.sp !== 'heal' && res.sp !== 'infinity' && res.sp !== 'mahoraga') {
      if (isNaruto) g.madaraHP = Math.max(g.madaraHP - res.dmg, 0)
      else          g.narutoHP = Math.max(g.narutoHP - res.dmg, 0)
    } else if (res.sp === 'mahoraga') { g.narutoHP = Math.max(g.narutoHP - res.dmg, 0) }
    const botHasField2 = isNaruto ? g.madara.field > 0 : g.naruto.field > 0
    if (botHasField2 && g.fieldCollisions < 4) {
      g.logs.push('')
      if (isNaruto) { g.logs.push('🔴 مادارا: "تسوكويومي اللامحدود!"'); g.logs.push('🔮 مادارا يفعّل مجاله!'); g.madara.field--; g.madara.fieldCount++; g.narutoHP=Math.max(g.narutoHP-18,0); g.logs.push('💥 مجال مادارا يضرب ناروتو!'); g.logs.push('   رد بـ .سينين!') }
      else { g.logs.push('🟠 ناروتو: "وضع السينين الكامل!"'); g.logs.push('🌌 ناروتو يفعّل مجاله!'); g.naruto.field--; g.naruto.fieldCount++; g.madaraHP=Math.max(g.madaraHP-18,0); g.logs.push('💥 مجال ناروتو يضرب مادارا!'); g.logs.push('   رد بـ .تسوكويومي!') }
    } else {
      const bot = botAtk(g); g.logs.push(bot.m)
      if (isNaruto) { if (g.infinityActive) { g.logs.push('∞ درع كيوراما امتص!'); g.infinityActive=false } else g.narutoHP=Math.max(g.narutoHP-bot.d,0) }
      else { g.madaraHP=Math.max(g.madaraHP-bot.d,0) }
    }
    db[u]=g; writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  db[u]=g; writeDB(db)
  return conn.sendMessage(m.chat, display(g), { quoted: m })
}

handler.help    = ['شيبودن']
handler.tags    = ['games']
handler.command = /^(شيبودن|ناروتو|مادارا|ساسكي|راسينغان|راسينشوريكين|مدمج|سينين|ريفرس|بيجوداما|درع كيوراما|ضربة|سوسانو|موجة|كيوبي|بنفسجي|انهاء|مود|تشيدوري|كيرين|اماتيراسو|كاموي|شريحة|تكيف|دمار|مكيفة)$/u

export default handler