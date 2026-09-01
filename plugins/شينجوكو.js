import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const DB    = path.join(__dirname, '../database/shinjuku.json')
const THUMB = 'https://files.catbox.moe/8bd92k.jpg'

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
  gojoHP: 100, sukunaHP: 100, agitoHP: 100,
  round: 0, logs: [],
  gojo:   { blue: 20, red: 20, combo: 999, field: 4, heal: 5, flash: 1, fieldCount: 0, infinity: 3 },
  sukuna: { punch: 999, dismantle: 20, slice: 999, field: 4, heal: 5, mahoraga: 5, agito: 1, fieldCount: 0 },
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
  const isGojo = g.char === 'gojo'
  const stats = isGojo
    ? `📊 أزرق(${g.gojo.blue}) أحمر(${g.gojo.red}) شفاء(${g.gojo.heal}) لانهائية(${g.gojo.infinity})${g.infinityActive ? '🛡️' : ''} فلاش(${g.gojo.flash}) مجال(${g.gojo.field})`
    : `📊 تفكيك(${g.sukuna.dismantle}) شفاء(${g.sukuna.heal}) ماهوراجا(${g.sukuna.mahoraga}) مجال(${g.sukuna.field})`
  let cmds = ''
  if (g.phase === 'started')
    cmds = isGojo
      ? '⚔️ الأزرق | الأحمر | مدمج | ريفرس | لانهائية | توسيع'
      : '⚔️ لكمة | تفكيك | تقطيع | ريفرس | ماهوراجا | توسيع'
  else if (g.phase === 'battle')
    cmds = isGojo
      ? `⚔️ الأزرق | الأحمر | مدمج | ريفرس | لانهائية${g.gojo.flash > 0 ? ' | فلاش 🖤' : ''}`
      : '⚔️ لكمة | تفكيك | تقطيع | ريفرس | ماهوراجا'
  else if (g.phase === 'final')
    cmds = (g.agitoActive && isGojo)
      ? '⚔️ اقتل أجيتو أولاً ← .الأزرق'
      : (!g.agitoActive && isGojo)
        ? '💜 أجيتو مات! أطلق الضربة الأخيرة ← .بنفسجي'
        : '⚔️ لكمة | تفكيك | تقطيع'
  else if (g.phase === 'cutscene')
    cmds = '⏳ ماهوراجا تهاجم... انتظر!'
  const phaseLabel = { started:'⚡ المواجهة', battle:'💥 قتال مباشر', final:'🔥 المعركة الأخيرة', end:'🏁 انتهت', cutscene:'🎬 مشهد' }[g.phase] || ''
  const agitoLine  = (g.phase === 'final' && g.agitoActive) ? `\n👁️ أجيتو : ${bar(g.agitoHP)} ${g.agitoHP}%` : ''
  return {
    image: { url: THUMB },
    caption: `╔═══━━━─── • ───━━━═══╗\n   ⟡ 𓂀 𝗚 𝗢 𝗝 𝗢 𓂀 ⟡\n╚═══━━━─── • ───━━━═══╝\n\n${phaseLabel} | جولة ${g.round}\n🔵 ساتورو  : ${bar(g.gojoHP)} ${g.gojoHP}%\n🔴 سوكونا: ${bar(g.sukunaHP)} ${g.sukunaHP}%${agitoLine}\n\n📜 الأحداث:\n${logs}\n\n${stats}\n\n${cmds}\n╚════════════════╝`
  }
}

const SUKUNA_BOT = [
  { d: 18, m: '👊 سوكونا: لكمة معززة!\n   "أنت ضعيف يا ساتورو!"' },
  { d: 12, m: '🔪 سوكونا: تفكيك!\n   "تحرك كالملك أو مت كالعبد!"' },
  { d: 10, m: '✂️ سوكونا: تقطيع!\n   "هل هذا كل ما لديك؟"' },
  { d: 20, m: '👊 سوكونا: ضربة بطاقة ملعونة!\n   "انتهى وقتك!"' },
  { d: 14, m: '🔪 سوكونا: تفكيك متلاحق!\n   "ستسقط عاجلاً!"' },
  { d: 16, m: '✂️ سوكونا: تقطيع مزدوج!\n   "ما زلت تقاوم؟ مثير..."' }
]
const GOJO_BOT = [
  { d: 15, m: '🔵 ساتورو: أزرق!\n   "لا مفر من اللانهائي!"' },
  { d: 15, m: '🔴 ساتورو: أحمر!\n   "هل تشعر بهذا؟"' },
  { d: 20, m: '⚪ ساتورو: قبضة + أزرق!\n   "أنا لم أبدأ بعد!"' },
  { d: 18, m: '🔵 ساتورو: أزرق متلاحق!\n   "فكر بشكل أسرع!"' },
  { d: 12, m: '⚪ ساتورو: ضربة معززة!\n   "كم ستصمد؟"' }
]
const botAtk = (g) => {
  const pool = g.char === 'gojo' ? SUKUNA_BOT : GOJO_BOT
  return pool[Math.floor(Math.random() * pool.length)]
}

const collisionResult = (n) => {
  if (n === 1) return { win:'sukuna', dmg:25, lines:['💥 اصطدام المجالات!','🔮 الضريح الخبيث يبتلع الفراغ!','🔴 سوكونا يفوز بالاصطدام الأول!','   "نملة كبيرة... لكنها نملة!"','🔵 ساتورو يتراجع ويتضرر!'] }
  if (n === 2) return { win:'sukuna', dmg:25, lines:['💥 اصطدام المجالات مجدداً!','🔴 الضريح الخبيث يطغى مرة أخرى!','🔴 سوكونا يفوز للمرة الثانية!','   "هل فكرت في الاستسلام يا ساتورو؟"','🔵 ساتورو ينزف!'] }
  if (n === 3) return { win:'sukuna', dmg:25, lines:['💥 ثالث اصطدام!','🔮 الضريح الخبيث يسحق الفراغ اللانهائي!','🔴 سوكونا يفوز للمرة الثالثة!','   "إلى متى ستصمد؟"','🔵 ساتورو يتألم بشدة!'] }
  return { win:'gojo', dmg:35, lines:['💥 الاصطدام الرابع والأخير!','🌌 الفراغ اللانهائي يمزق الضريح الخبيث!','🔵 ساتورو يفوز هذه المرة!','   "الفراغ لا حدود له!"','🔴 سوكونا يتضرر بشدة!'] }
}

const INTRO_LOGS = [
  '🔵 ساتورو: لا تفهم قدومي لك خطأً يا سوكونا',
  '         أنت المتحدي هنا',
  '',
  '🔴 سوكونا: أنا المتحدي؟',
  '           أنت مجرد سمكة على لوح التقطيع',
  '',
  '🔵 ساتورو: انظر من يتكلم...',
  '         الهارب من جسد يوجي إيتادوري',
  '',
  '⚡⚡⚡ بدأت المعركة! ⚡⚡⚡'
]

const newPvpGame = (gojoPlayer, gojoChat, sukunaPlayer, sukunaChat) => {
  const g = newGame('gojo')
  g.pvp          = true
  g.gojoPlayer   = gojoPlayer
  g.sukunaPlayer = sukunaPlayer
  g.gojoChat     = gojoChat
  g.sukunaChat   = sukunaChat
  g.currentTurn  = 'gojo'
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
  const order = ['gojo', 'toji', 'sukuna', 'mahoraga']
  const alive  = order.filter(c => {
    if (c === 'gojo')     return g.gojoHP > 0
    if (c === 'sukuna')   return g.sukunaHP > 0
    if (c === 'toji')     return g.tojiAlive && g.tojiHP > 0
    if (c === 'mahoraga') return g.mahoragaAlive && g.mahoragaHP > 0
    return false
  })
  if (!alive.length) return g.currentTurn
  const idx = alive.indexOf(g.currentTurn)
  return alive[(idx + 1) % alive.length]
}

const checkTeamWin = (g) => {
  const sukunaDead = g.sukunaHP <= 0 && (!g.mahoragaAlive || g.mahoragaHP <= 0)
  const gojoDead   = g.gojoHP   <= 0 && (!g.tojiAlive     || g.tojiHP     <= 0)
  if (sukunaDead) return 'gojo'
  if (gojoDead)   return 'sukuna'
  return null
}

const applyTeamDmg = (g, attackerChar, dmg, bypassInfinity = false) => {
  const gojoSide   = ['gojo', 'toji']
  const sukunaSide = ['sukuna', 'mahoraga']
  if (gojoSide.includes(attackerChar)) {
    if (g.sukunaHP > 0) { g.sukunaHP = Math.max(g.sukunaHP - dmg, 0); return { target: 'سوكونا' } }
    else if (g.mahoragaAlive && g.mahoragaHP > 0) { g.mahoragaHP = Math.max(g.mahoragaHP - dmg, 0); return { target: 'ماهوراجا' } }
  } else {
    if (!bypassInfinity && g.spearActive) { g.spearActive = false; return { speared: true } }
    if (!bypassInfinity && g.infinityActive) { g.infinityActive = false; return { absorbed: true } }
    if (g.gojoHP > 0) { g.gojoHP = Math.max(g.gojoHP - dmg, 0); return { target: 'ساتورو' } }
    else if (g.tojiAlive && g.tojiHP > 0) { g.tojiHP = Math.max(g.tojiHP - dmg, 0); return { target: 'توجي' } }
  }
  return {}
}

const teamDisplay = (g, char) => {
  const logs = g.logs.slice(-10).join('\n')
  const gl = `🔵 ساتورو  : ${bar(g.gojoHP)} ${g.gojoHP}%${g.infinityActive ? ' 🛡️' : ''}`
  const tl = g.tojiAlive ? `⚪ توجي  : ${bar(g.tojiHP)} ${g.tojiHP}%${g.spearActive ? ' 🔱' : ''}` : ''
  const sl = `🔴 سوكونا: ${bar(g.sukunaHP)} ${g.sukunaHP}%`
  const ml = g.mahoragaAlive ? `🐉 ماهوراجا: ${bar(g.mahoragaHP)} ${g.mahoragaHP}%` : ''
  const ms = g.mahoraga_skills || {}
  let cmds = ''
  if (char === 'gojo')
    cmds = `📊 أزرق(${g.gojo?.blue||0}) أحمر(${g.gojo?.red||0}) شفاء(${g.gojo?.heal||0}) لانهائية(${g.gojo?.infinity||0}) فلاش(${g.gojo?.flash||0})\n⚔️ الأزرق | الأحمر | مدمج | ريفرس | لانهائية | فلاش | توسيع`
  else if (char === 'toji')
    cmds = `📊 سحابة(∞) خاطف(${g.toji?.katana||0}) رمح(${g.toji?.spear||0})\n⚔️ يد | سحابة | خاطف | رمح\n💡 كل هجمات توجي تخترق اللانهائية`
  else if (char === 'sukuna')
    cmds = `📊 تفكيك(${g.sukuna?.dismantle||0}) شفاء(${g.sukuna?.heal||0}) مجال(${g.sukuna?.field||0})\n⚔️ لكمة | تفكيك | تقطيع | ريفرس | توسيع`
  else if (char === 'mahoraga')
    cmds = `📊 تكيف(${ms.adapt||0}) دمار(${ms.domainDestroy||0})${ms.adaptedSlash > 0 ? ` مكيفة(${ms.adaptedSlash})` : ''}\n⚔️ شريحة | تكيف | دمار${ms.adaptedSlash > 0 ? ' | مكيفة' : ''}`
  const charName = { gojo:'🔵 ساتورو', toji:'⚪ توجي', sukuna:'🔴 سوكونا', mahoraga:'🐉 ماهوراجا' }
  const myTurn   = g.currentTurn === char
  const turnNote = myTurn ? '🎮 دورك الآن!' : `⏳ دور ${charName[g.currentTurn] || g.currentTurn}...`
  return {
    image: { url: THUMB },
    caption:
`╔═══━━━─── • ───━━━═══╗
   ⟡ ⚔️ وضع الفريق ⚔️ ⟡
╚═══━━━─── • ───━━━═══╝

🔵 فريق ساتورو:
${gl}${tl ? '\n' + tl : ''}

🔴 فريق سوكونا:
${sl}${ml ? '\n' + ml : ''}

📜 الأحداث:
${logs}

${cmds}

${turnNote} | جولة ${g.round}
╚════════════════╝`
  }
}

const broadcastTeam = (conn, pg, exceptUser = null) => {
  const players = [
    { id: pg.gojoPlayer,     chat: pg.gojoChat,     char: 'gojo' },
    { id: pg.sukunaPlayer,   chat: pg.sukunaChat,   char: 'sukuna' },
    pg.tojiAlive     ? { id: pg.tojiPlayer,     chat: pg.tojiChat,     char: 'toji' }     : null,
    pg.mahoragaAlive ? { id: pg.mahoragaPlayer, chat: pg.mahoragaChat, char: 'mahoraga' } : null,
  ].filter(p => p && p.id && p.id !== exceptUser)
  players.forEach(p => conn.sendMessage(p.chat, teamDisplay(pg, p.char)))
}

const startTeamBattle = (conn, gameKey) => {
  const db = readDB()
  const pg = db[gameKey]
  if (!pg || !pg.teamWaiting) return
  pg.teamWaiting = false
  pg.teamMode    = pg.tojiAlive || pg.mahoragaAlive
  pg.currentTurn = 'gojo'
  pg.logs.push('')
  if (pg.teamMode) {
    pg.logs.push('⚔️⚔️ وضع الفريق بدأ! ⚔️⚔️')
    pg.logs.push(`🔵 فريق ساتورو: ساتورو${pg.tojiAlive ? ' ⚡ توجي' : ''}`)
    pg.logs.push(`🔴 فريق سوكونا: سوكونا${pg.mahoragaAlive ? ' ⚡ ماهوراجا' : ''}`)
    pg.logs.push('')
    pg.logs.push('🔵 ساتورو يبدأ الجولة الأولى!')
  } else {
    pg.logs.push('⚡ لم ينضم أحد للفرق')
    pg.logs.push('🥊 معركة 1 ضد 1 كلاسيكية!')
    pg.logs.push('🔵 ساتورو يبدأ!')
  }
  db[gameKey] = pg
  writeDB(db)
  if (pg.teamMode) {
    broadcastTeam(conn, pg)
  } else {
    conn.sendMessage(pg.gojoChat,   pvpDisplay(pg, 'gojo'))
    conn.sendMessage(pg.sukunaChat, pvpDisplay(pg, 'sukuna'))
  }
}

const applyPlayerAtk = (g, cmd) => {
  const isGojo = g.char === 'gojo'
  let dmg = 0, msg = '', sp = null, err = null
  if (isGojo) {
    if (cmd === 'الأزرق')    { if (!g.gojo.blue) return { err:'❌ نفد الأزرق!' }; dmg=15; g.gojo.blue--; msg='🔵 ساتورو: الأزرق!\n   💫 قوة الجاذبية تسحب كل شيء!' }
    else if (cmd === 'الأحمر')   { if (!g.gojo.red) return { err:'❌ نفد الأحمر!' }; dmg=15; g.gojo.red--; msg='🔴 ساتورو: الأحمر!\n   💥 دفعة تنافرية مرعبة!' }
    else if (cmd === 'مدمج')     { dmg=22; msg='⚪ ساتورو: قبضة + أزرق!\n   🌪️ هجوم لا يُرد ولا يُصد!' }
    else if (cmd === 'ريفرس')    { if (!g.gojo.heal) return { err:'❌ نفد الشفاء!' }; g.gojoHP=100; g.gojo.heal--; msg='✨ ساتورو: ريفرس تكنيك!\n   💚 الجروح تختفي... شفاء كامل!'; sp='heal' }
    else if (cmd === 'لانهائية') { if (!g.gojo.infinity) return { err:'❌ نفدت اللانهائية!' }; g.infinityActive=true; g.gojo.infinity--; msg='∞ ساتورو: اللانهائية!\n   🛡️ حاجز لا يُخترق!'; sp='infinity' }
    else if (cmd === 'فلاش')     { if (!g.gojo.flash) return { err:'❌ استُخدم البلاك فلاش!' }; if (g.phase!=='battle') return { err:'❌ البلاك فلاش في مرحلة القتال فقط!' }; dmg=35; g.gojo.flash--; msg='⚫ ساتورو: بلاك فلاش!!!\n   💥 انفجار مرعب!'; sp='flash' }
  } else {
    if (cmd === 'لكمة')      { dmg=18; msg='👊 سوكونا: لكمة معززة!\n   💪 قوة الملك لا تُقاوم!' }
    else if (cmd === 'تفكيك')    { if (!g.sukuna.dismantle) return { err:'❌ نفد التفكيك!' }; dmg=12; g.sukuna.dismantle--; msg='🔪 سوكونا: تفكيك!\n   ⚔️ يمزق الطاقة كالورق!' }
    else if (cmd === 'تقطيع')    { dmg=10; msg='✂️ سوكونا: تقطيع!\n   🌪️ موجة ملعونة تقطع الفراغ!' }
    else if (cmd === 'ريفرس')    { if (!g.sukuna.heal) return { err:'❌ نفد الشفاء!' }; g.sukunaHP=100; g.sukuna.heal--; msg='✨ سوكونا: ريفرس تكنيك!\n   💚 الملك لا يموت بهذه السهولة!'; sp='heal' }
    else if (cmd === 'ماهوراجا') { if (!g.sukuna.mahoraga) return { err:'❌ ماهوراجا استنفد قوته!' }; dmg=35; g.sukuna.mahoraga--; msg='🐉 سوكونا: استدعاء ماهوراجا!\n   ⚙️ التكيّف مع اللانهائي!\n   💥 ضربة تخترق الفراغ!'; sp='mahoraga' }
  }
  return { dmg, msg, sp, err }
}

const handler = async (m, { conn, command }) => {
  const u  = m.sender
  const db = readDB()

  // ══ إصلاح: تنظيف الأمر من أي مسافات أو رموز زيادة ══
  const cmd = (command || '').trim()

  if (cmd === 'شينجوكو') {
    return conn.sendMessage(m.chat, {
      image: { url: THUMB },
      caption:
`╔═══━━━─── • ───━━━═══╗
   ⟡ 𓂀 𝗚 𝗢 𝗝 𝗢 𓂀 ⟡
╚═══━━━─── • ───━━━═══╝

⚡⚡⚡ لقد بدأت مواجهة نهائية ⚡⚡⚡

المعركة النهائية:
🔵 ساتورو ساتورو (الأقوى في عصره)
🔴 ريومن سوكونا (الأقوى في التاريخ)

اختر شخصيتك:
🔵 .ساتورو
🔴 .سوكونا

   ⟡ الوقت قد حان ⟡
╚════════════════╝`
    }, { quoted: m })
  }

  if (cmd === 'توجي') {
    if (db[u]) return m.reply('❌ لديك لعبة بالفعل! اكتب .انهاء أولاً')
    const entry = Object.entries(db).find(([k, v]) =>
      k.startsWith('pvp_') && v.teamWaiting && !v.tojiPlayer &&
      v.gojoPlayer !== u && v.sukunaPlayer !== u
    )
    if (!entry) return m.reply(
`⚠️ لا توجد مباريات تنتظر الآن!

💡 انتظر حتى يبدأ لاعبان معركة
   ثم اكتب .توجي خلال 40 ثانية`
    )
    const [gameKey, pg] = entry
    pg.tojiPlayer = u
    pg.tojiChat   = m.chat
    pg.tojiAlive  = true
    db[u] = { pvp: true, gameKey, char: 'toji' }
    db[gameKey] = pg
    writeDB(db)
    const joinMsg =
`╔═══━━━─── • ───━━━═══╗
   ⟡ ⚪ توجي فوشيغورو ⟡
╚═══━━━─── • ───━━━═══╝

⚪ انضممت كـ توجي فوشيغورو!

📖 معلومات الشخصية:
🔒 الطاقة الملعونة: صفر مطلق
💪 القوة الجسدية: لا محدود
✨ كل هجماتك تخترق اللانهائية تلقائياً

⚔️ مهاراتك:
├ .يد    → لكمة خارقة (20 ضرر) ∞
├ .سحابة → سحابة اللهو (28 ضرر) ∞
├ .خاطف  → خاطف الروح (35 ضرر) x5
└ .رمح   → رمح السماء المعكوس x2
            يبطل الهجوم الملعون القادم

⏳ انتظر بدء المعركة...
╚════════════════╝`
    conn.sendMessage(pg.gojoChat,   { text: `⚪ توجي فوشيغورو انضم لفريقك!\n"قيمة بلا طاقة ملعونة... أقتل الأقوى"` })
    conn.sendMessage(pg.sukunaChat, { text: `⚠️ توجي انضم لفريق ساتورو!\nالبشر بلا طاقة ملعونة... الأخطر!` })
    return conn.sendMessage(m.chat, { image: { url: THUMB }, caption: joinMsg }, { quoted: m })
  }

  if (cmd === 'ماهوراجا' && !db[u]) {
    const entry = Object.entries(db).find(([k, v]) =>
      k.startsWith('pvp_') && v.teamWaiting && !v.mahoragaPlayer &&
      v.gojoPlayer !== u && v.sukunaPlayer !== u
    )
    if (!entry) return m.reply(
`⚠️ لا توجد مباريات تنتظر الآن!

💡 انتظر حتى يبدأ لاعبان معركة
   ثم اكتب .ماهوراجا خلال 40 ثانية`
    )
    const [gameKey, pg] = entry
    pg.mahoragaPlayer = u
    pg.mahoragaChat   = m.chat
    pg.mahoragaAlive  = true
    db[u] = { pvp: true, gameKey, char: 'mahoraga' }
    db[gameKey] = pg
    writeDB(db)
    const joinMsg =
`╔═══━━━─── • ───━━━═══╗
   ⟡ 🐉 الجنرال الاقوي ⟡
╚═══━━━─── • ───━━━═══╝

🐉 انضممت كـ ماهوراجا!

📖 معلومات الشخصية:
⚙️ قدرة التكيّف: نشطة دائماً
🛡️ نقاط الحياة: 120 (الأكثر متانة)
🐍 الملك أمر... الجنرال يُطيع

⚔️ مهاراتك:
├ .شريحة  → ضربة قاطعة (25 ضرر) ∞
├ .تكيف   → تكيّف! تفعيل شريحة مكيفة x3
├ .مكيفة  → شريحة تخترق اللانهائية (40 ضرر!)
└ .دمار   → تدمير المجال! يكسر اللانهائية x1

⏳ انتظر بدء المعركة...
╚════════════════╝`
    conn.sendMessage(pg.sukunaChat, { text: `🐉 ماهوراجا انضم لفريقك!\nالجنرال الاقوي يُطيع الملك!` })
    conn.sendMessage(pg.gojoChat,   { text: `⚠️ ماهوراجا انضم لفريق سوكونا!\nالجنرال الذي تكيّف مع اللانهائية...` })
    return conn.sendMessage(m.chat, { image: { url: THUMB }, caption: joinMsg }, { quoted: m })
  }

  if (cmd === 'ساتورو' || cmd === 'سوكونا') {
    const pickedChar   = cmd === 'ساتورو' ? 'gojo' : 'sukuna'
    const oppositeChar = pickedChar === 'gojo' ? 'sukuna' : 'gojo'
    const pending      = db.pending

    if (pending && pending.char === oppositeChar && pending.user !== u) {
      const gameKey      = `pvp_${Date.now()}`
      const gojoPlayer   = pickedChar === 'gojo' ? u : pending.user
      const sukunaPlayer = pickedChar === 'sukuna' ? u : pending.user
      const gojoChat     = pickedChar === 'gojo' ? m.chat : pending.chat
      const sukunaChat   = pickedChar === 'sukuna' ? m.chat : pending.chat
      const g = newPvpGame(gojoPlayer, gojoChat, sukunaPlayer, sukunaChat)
      db[gojoPlayer]   = { pvp: true, gameKey, char: 'gojo' }
      db[sukunaPlayer] = { pvp: true, gameKey, char: 'sukuna' }
      db[gameKey]      = g
      delete db.pending
      writeDB(db)
      const teamInviteMsg =
`╔═══━━━─── • ───━━━═══╗
   ⟡ 🔱 وضع الفريق 🔱 ⟡
╚═══━━━─── • ───━━━═══╝

⚔️ تم إيجاد خصم!
⏳ 40 ثانية للانضمام كفريق!

🔵 فريق ساتورو:
   ⟡ ساتورو ساتورو ✅ (محجوز)
   ⟡ توجي فوشيغورو ← اكتب .توجي

🔴 فريق سوكونا:
   ⟡ ريومن سوكونا ✅ (محجوز)
   ⟡ ماهوراجا ← اكتب .ماهوراجا

💡 بعد 40 ثانية:
   - انضم الاثنان → معركة فريق 2 ضد 2
   - انضم واحد   → معركة 2 ضد 1
   - لم ينضم أحد → معركة 1 ضد 1 عادية

   ⟡ الوقت بدأ الآن ⟡
╚════════════════╝`
      conn.sendMessage(gojoChat,   { image: { url: THUMB }, caption: teamInviteMsg })
      conn.sendMessage(sukunaChat, { image: { url: THUMB }, caption: teamInviteMsg })
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
   ⟡ 𓂀 𝗚 𝗢 𝗝 𝗢 𓂀 ⟡
╚═══━━━─── • ───━━━═══╝

⏳ اخترت ${cmd === 'ساتورو' ? '🔵 ساتورو' : '🔴 سوكونا'}!

في انتظار لاعب ${oppositeChar === 'sukuna' ? '🔴 سوكونا' : '🔵 ساتورو'}...

🤖 اكتب .مود للعب ضد الروبوت الآن

   ⟡ الوقت قد حان ⟡
╚════════════════╝`
    }, { quoted: m })
  }

  if (cmd === 'مود') {
    if (!db[u] || !db[u].waiting) return m.reply('❌ ليس لديك لعبة بانتظار\nاكتب .شينجوكو أولاً')
    const pickedChar = db[u].char
    if (db.pending && db.pending.user === u) delete db.pending
    const g = newGame(pickedChar)
    g.logs = [...INTRO_LOGS]
    db[u] = g
    writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  if (!db[u]) return m.reply('❌ اكتب: .شينجوكو')
  if (db[u].waiting) return m.reply('⏳ في انتظار خصم...\nاكتب .مود للعب ضد الروبوت')

  if (cmd === 'انهاء') {
    if (db[u].pvp) {
      const gameKey = db[u].gameKey
      const pg = db[gameKey]
      if (pg) {
        const allPlayers = [pg.gojoPlayer, pg.sukunaPlayer, pg.tojiPlayer, pg.mahoragaPlayer].filter(Boolean)
        allPlayers.forEach(p => { if (p !== u && db[p]) delete db[p] })
        delete db[gameKey]
      }
    }
    if (db[u].waiting && db.pending && db.pending.user === u) delete db.pending
    delete db[u]
    writeDB(db)
    return m.reply('✅ تم إنهاء اللعبة')
  }

  const g = db[u]

  const allCmds = [
    'الأزرق','الأحمر','مدمج','توسيع','ريفرس','فلاش','لانهائية',
    'لكمة','تفكيك','تقطيع','ماهوراجا',
    'يد','سحابة','خاطف','رمح',
    'شريحة','تكيف','دمار','مكيفة',
    'بنفسجي'
  ]
  if (!allCmds.includes(cmd)) return

  if (g.phase === 'end') return m.reply('⚔️ انتهت المعركة!\nاكتب .شينجوكو لبدء جديدة')
  if (g.phase === 'cutscene') return m.reply('⏳ انتظر... ماهوراجا تهاجم!')

  // ══ PvP ══
  if (g.pvp) {
    const gameKey = g.gameKey
    const myChar  = g.char
    const pg      = db[gameKey]
    if (!pg) return m.reply('❌ انتهت اللعبة')
    if (pg.teamWaiting) return m.reply('⏳ انتظر بدء المعركة!\nالوقت المتبقي أقل من 40 ثانية...')
    if (pg.phase === 'end') return m.reply('⚔️ انتهت المعركة!')
    if (pg.currentTurn !== myChar) {
      const charName = { gojo:'🔵 ساتورو', toji:'⚪ توجي', sukuna:'🔴 سوكونا', mahoraga:'🐉 ماهوراجا' }
      return m.reply(`⏳ انتظر! دور ${charName[pg.currentTurn] || pg.currentTurn} الآن`)
    }

    pg.round++
    pg.logs.push('')
    let dmg = 0, msg = '', sp = null, err = null
    let bypassInfinity = false

    if (myChar === 'toji') {
      bypassInfinity = true
      if (cmd === 'يد') { dmg=20; msg='⚪ توجي: يد!\n   💪 "لا طاقة ملعونة... فقط قوة خارقة للطبيعة!"\n   ✨ اخترق اللانهائية بشكل طبيعي!' }
      else if (cmd === 'سحابة') { dmg=28; msg='⚪ توجي: سحابة اللهو!\n   🌀 العصا ثلاثية الأقسام تحطم كل شيء!\n   ✨ لا دفاع يصمد أمام الجسد الخارق!' }
      else if (cmd === 'خاطف') {
        if (!pg.toji.katana) { err='❌ نفدت ضربات خاطف الروح! (٥/٥)' }
        else { dmg=35; pg.toji.katana--; msg='⚪ توجي: خاطف الروح!\n   🗡️ "سلاح يقطع الروح مباشرة..."\n   💀 لا اللانهائية ولا المجال يوقفه!' }
      } else if (cmd === 'رمح') {
        if (!pg.toji.spear) { err='❌ نفد رمح السماء المعكوس! (٢/٢)' }
        else { pg.toji.spear--; pg.spearActive=true; msg='🔱 توجي: رمح السماء المعكوس!\n   ✨ "يبطل جميع الأساليب الملعونة..."\n   🛡️ الهجوم الملعون القادم سيُبطل تلقائياً!'; sp='spear' }
      } else { err='❌ هذا الأمر غير متاح لتوجي!\nأوامرك: يد | سحابة | خاطف | رمح' }
    }

    else if (myChar === 'mahoraga') {
      const ms = pg.mahoraga_skills
      if (cmd === 'شريحة') { dmg=25; msg='🐉 ماهوراجا: شريحة!\n   ⚔️ "الجنرال الاقوي يقطع كل ما أمامه!"\n   💥 موجة قاطعة تهز المكان!' }
      else if (cmd === 'تكيف') {
        if (!ms.adapt) { err='❌ نفدت قدرة التكيف! (٣/٣)' }
        else { ms.adapt--; ms.adaptedSlash++; msg='⚙️ ماهوراجا: تكيّف!\n   🔄 عجلة التكيف تدور وتدور وتدور...\n   💡 الشريحة المكيفة جاهزة!\n   الآن اكتب .مكيفة لإطلاق ضربة 40 ضرر!'; sp='adapt_passive' }
      } else if (cmd === 'دمار') {
        if (!ms.domainDestroy) { err='❌ استُخدم تدمير المجال بالفعل!' }
        else { ms.domainDestroy--; pg.infinityActive=false; pg.spearActive=false; msg='🐉 ماهوراجا: تدمير المجال!\n   💥 "يحطم اللانهائية وكل مجال نشط!"\n   🔱 رمح السماء المعكوس... يتحطم!\n   ∞ اللانهائية... تنهار!'; sp='domainDestroy' }
      } else if (cmd === 'مكيفة') {
        if (!ms.adaptedSlash) { err='❌ لا توجد شريحة مكيفة!\nاستخدم .تكيف أولاً' }
        else { dmg=40; bypassInfinity=true; ms.adaptedSlash--; msg='🐉 ماهوراجا: شريحة مكيفة!!!\n   ⚙️ "تكيّف مع اللانهائية..."\n   💜 الضربة تخترق كل دفاع!\n   💥 ٤٠ ضرر نقي!' }
      } else { err='❌ هذا الأمر غير متاح لماهوراجا!\nأوامرك: شريحة | تكيف | دمار | مكيفة' }
    }

    else if (pg.teamMode) {
      const pvpAteam = {
        gojo: {
          الأزرق:   { d:15, m:'🔵 ساتورو: أزرق!\n   "لا مفر من اللانهائي يا سوكونا!"' },
          الأحمر:   { d:15, m:'🔴 ساتورو: أحمر!\n   "هل تشعر بهذا؟"' },
          مدمج:     { d:22, m:'⚪ ساتورو: قبضة + أزرق!\n   "أنا لم أبدأ بعد!"' },
          توسيع:    { d:30, m:'🌌 ساتورو: الفراغ اللانهائي!\n   "ابتلع كل شيء!"', sp:'field_g' },
          ريفرس:    { d:0,  m:'💚 ساتورو: ريفرس تكنيك! شفاء كامل!', sp:'heal_g' },
          لانهائية: { d:0,  m:'∞ ساتورو: اللانهائية! حاجز لا يُخترق!', sp:'infinity' },
          فلاش:     { d:35, m:'⚫ ساتورو: بلاك فلاش!!!\n   "انفجار مرعب يهز الوجود!"', sp:'flash_g' },
        },
        sukuna: {
          لكمة:    { d:18, m:'👊 سوكونا: لكمة!\n   "قوة الملك لا تُقاوم!"' },
          تفكيك:   { d:12, m:'🔪 سوكونا: تفكيك!', sp:'dismantle' },
          تقطيع:   { d:10, m:'✂️ سوكونا: تقطيع!' },
          توسيع:   { d:30, m:'🔮 سوكونا: الضريح الخبيث!', sp:'field_s' },
          ريفرس:   { d:0,  m:'💚 سوكونا: ريفرس! شفاء كامل!', sp:'heal_s' },
          ماهوراجا:{ d:35, m:'🐉 سوكونا: يقوي ماهوراجا!\n   "الملك يمنح الجنرال طاقته!"', sp:'boost_m' },
        }
      }
      const a = pvpAteam[myChar]?.[cmd]
      if (!a) { db[gameKey]=pg; writeDB(db); return conn.sendMessage(m.chat, teamDisplay(pg, myChar), { quoted: m }) }
      msg=a.m; dmg=a.d; sp=a.sp||null
      if (sp==='heal_g')   { if (!pg.gojo.heal) { err='❌ نفد الشفاء!' } else { pg.gojoHP=100; pg.gojo.heal-- } }
      if (sp==='heal_s')   { if (!pg.sukuna.heal) { err='❌ نفد الشفاء!' } else { pg.sukunaHP=100; pg.sukuna.heal-- } }
      if (sp==='infinity') { if (!pg.gojo.infinity) { err='❌ نفدت اللانهائية!' } else { pg.infinityActive=true; pg.gojo.infinity--; dmg=0 } }
      if (sp==='flash_g')  { if (!pg.gojo.flash) { err='❌ استُخدم البلاك فلاش!' } else { pg.gojo.flash-- } }
      if (sp==='dismantle') { if (!pg.sukuna.dismantle) { err='❌ نفد التفكيك!' } else { pg.sukuna.dismantle-- } }
      if (sp==='boost_m' && pg.mahoragaAlive) { pg.mahoraga_skills.adaptedSlash++; msg+= '\n   ⚙️ ماهوراجا يكتسب شريحة مكيفة إضافية!'; dmg=0 }
    }

    else {
      const pvpA = {
        gojo: {
          الأزرق:   {d:15, m:'🔵 ساتورو: أزرق!\n   "لا مفر من اللانهائي!"'},
          الأحمر:   {d:15, m:'🔴 ساتورو: أحمر!\n   "هل تشعر بهذا؟"'},
          مدمج:     {d:22, m:'⚪ ساتورو: قبضة + أزرق!\n   "أنا لم أبدأ بعد!"'},
          توسيع:    {d:30, m:'🌌 ساتورو: الفراغ اللانهائي!'},
          ريفرس:    {d:0,  m:'💚 ساتورو: شفاء!', sp:'heal_g'},
          لانهائية: {d:0,  m:'∞ ساتورو: اللانهائية!', sp:'infinity'},
          فلاش:     {d:35, m:'⚫ بلاك فلاش!!!', sp:'flash_g'},
        },
        sukuna: {
          لكمة:    {d:18, m:'👊 سوكونا: لكمة!'},
          تفكيك:   {d:12, m:'🔪 سوكونا: تفكيك!', sp:'dismantle'},
          تقطيع:   {d:10, m:'✂️ سوكونا: تقطيع!'},
          توسيع:   {d:30, m:'🔮 سوكونا: الضريح الخبيث!'},
          ريفرس:   {d:0,  m:'💚 سوكونا: شفاء!', sp:'heal_s'},
          ماهوراجا:{d:35, m:'🐉 ماهوراجا!', sp:'mah_s'},
        }
      }
      const a = pvpA[myChar]?.[cmd] || { d:10, m:'⚔️ يهاجم!' }
      dmg=a.d; msg=a.m; sp=a.sp||null
      if (sp==='heal_g')   pg.gojoHP=100
      if (sp==='heal_s')   pg.sukunaHP=100
      if (sp==='infinity') { pg.infinityActive=true; dmg=0 }
      if (sp==='dismantle') { if (!pg.sukuna.dismantle) { err='❌ نفد التفكيك!' } else pg.sukuna.dismantle-- }
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
        if (res.absorbed) { pg.logs.push('∞ اللانهائية امتصت الهجوم!') }
        else if (res.speared) { pg.logs.push('🔱 رمح السماء المعكوس يبطل الهجوم الملعون!') }
        else if (res.target) { pg.logs.push(`   💥 ${res.target} يتلقى ${dmg} ضرر!`) }
      } else {
        if (myChar === 'gojo') {
          pg.sukunaHP = Math.max(pg.sukunaHP - dmg, 0)
        } else {
          if (pg.infinityActive) { pg.logs.push('∞ اللانهائية امتصت الهجوم!'); pg.infinityActive=false }
          else { pg.gojoHP = Math.max(pg.gojoHP - dmg, 0) }
        }
      }
    }

    let winner = null
    if (pg.teamMode) { winner = checkTeamWin(pg) }
    else {
      if (pg.gojoHP   <= 0) winner = 'sukuna'
      if (pg.sukunaHP <= 0) winner = 'gojo'
    }

    if (winner) {
      pg.logs.push('')
      if (winner === 'gojo') {
        pg.logs.push('🔵⚡ انتصر فريق ساتورو! ⚡🔵')
        pg.logs.push(pg.tojiAlive ? '"ساتورو وتوجي... الثنائي الذي لا يُقهر!"' : '"الأقوى في عصره انتصر!"')
      } else {
        pg.logs.push('🔴⚡ انتصر فريق سوكونا! ⚡🔴')
        pg.logs.push(pg.mahoragaAlive ? '"الملك وجنراله... لا شيء يقف في وجههما!"' : '"ملك الملاعين لا يُهزم!"')
      }
      pg.phase = 'end'
      const allPlayers = [pg.gojoPlayer, pg.sukunaPlayer, pg.tojiPlayer, pg.mahoragaPlayer].filter(Boolean)
      db[gameKey] = pg
      allPlayers.forEach(p => { if (db[p]) delete db[p] })
      writeDB(db)
      if (pg.teamMode) {
        broadcastTeam(conn, pg)
        conn.sendMessage(m.chat, teamDisplay(pg, myChar), { quoted: m })
      } else {
        const oppChar = myChar === 'gojo' ? 'sukuna' : 'gojo'
        const oppChat = myChar === 'gojo' ? pg.sukunaChat : pg.gojoChat
        conn.sendMessage(oppChat, pvpDisplay(pg, oppChar))
        conn.sendMessage(m.chat, pvpDisplay(pg, myChar), { quoted: m })
      }
      return
    }

    pg.currentTurn = pg.teamMode ? getNextTurn(pg) : (myChar === 'gojo' ? 'sukuna' : 'gojo')
    db[gameKey] = pg
    writeDB(db)

    if (pg.teamMode) {
      broadcastTeam(conn, pg, u)
      return conn.sendMessage(m.chat, teamDisplay(pg, myChar), { quoted: m })
    } else {
      const oppChar = myChar === 'gojo' ? 'sukuna' : 'gojo'
      const oppChat = myChar === 'gojo' ? pg.sukunaChat : pg.gojoChat
      conn.sendMessage(oppChat, pvpDisplay(pg, oppChar))
      return conn.sendMessage(m.chat, pvpDisplay(pg, myChar), { quoted: m })
    }
  }

  // ══ ضد البوت ══
  const isGojo = g.char === 'gojo'
  g.round++
  g.logs.push('')

  if (g.phase === 'final') {
    if (isGojo) {
      if (cmd === 'الأزرق' && g.agitoActive) {
        g.agitoHP = 0; g.agitoActive = false
        g.logs.push('🔵 ساتورو: الأزرق!')
        g.logs.push('   يطلق قوة الجاذبية مباشرة على أجيتو!')
        g.logs.push('')
        g.logs.push('👁️ أجيتو يتلقى الضربة مباشرة!')
        g.logs.push('💥 أجيتو... ينهار ويتحطم!')
        g.logs.push('🔴 سوكونا: لا!!! أجيتو!!!')
        g.logs.push('')
        g.logs.push('💜 الآن اكتب .بنفسجي لإطلاق الضربة الأخيرة!')
        db[u] = g; writeDB(db)
        return conn.sendMessage(m.chat, display(g), { quoted: m })
      } else if (cmd === 'بنفسجي' && !g.agitoActive) {
        g.logs.push('🔵 ساتورو يرفع يديه نحو السماء...')
        g.logs.push('🔴 الأحمر في يد... 🔵 الأزرق في يد أخرى...')
        g.logs.push('💜 يلتقيان في المنتصف...')
        g.logs.push('')
        g.logs.push('💜💜💜 البنفسجي الجوف!!! 💜💜💜')
        g.logs.push('   "يمحو كل ما يلمسه من الوجود!"')
        g.logs.push('')
        g.logs.push('🐉 ماهوراجا... تختفي في الفراغ!')
        g.logs.push('🔴 سوكونا يتلقى ضربة لا توصف!')
        g.sukunaHP = 0; g.mahoragaActive = false; g.phase = 'end'
        db[u] = g; writeDB(db)
        setTimeout(() => {
          const fr = readDB(); const g2 = fr[u]; if (!g2) return
          g2.logs.push('')
          g2.logs.push('🔴 سوكونا: هذا... لا يمكن...')
          g2.logs.push('🔴 سوكونا يسقط على ركبتيه...')
          g2.logs.push('')
          g2.logs.push('🔵 ساتورو: قلت لك يا سوكونا سأفوز')
          g2.logs.push('🔴 سوكونا: مت بفخر')
          g2.logs.push('           لقد كنت الأقوى ساتورو ساتورو')
          g2.logs.push('')
          g2.logs.push('🏁 ══ انتصر ساتورو! ══ 🏁')
          fr[u] = g2; writeDB(fr); conn.sendMessage(m.chat, display(g2))
        }, 2000)
        return conn.sendMessage(m.chat, display(g), { quoted: m })
      } else if (cmd === 'الأزرق' && !g.agitoActive) {
        g.logs.push('💡 أجيتو مات! اكتب .بنفسجي الآن!')
      } else {
        const fatk = {
          الأحمر:   {d:15, m:'🔴 ساتورو: أحمر!'},
          مدمج:     {d:22, m:'⚪ ساتورو: مدمج!'},
          لانهائية: {d:0,  m:'∞ لانهائية!', sp:'infinity'}
        }[cmd] || {d:12, m:'⚪ ساتورو: يهاجم!'}
        g.logs.push(fatk.m)
        if (fatk.sp === 'infinity') { g.infinityActive = true }
        else { g.sukunaHP = Math.max(g.sukunaHP - fatk.d, 0) }
        const bot = botAtk(g); g.logs.push(bot.m)
        if (g.infinityActive) { g.logs.push('∞ اللانهائية امتصت الهجوم!'); g.infinityActive=false }
        else { g.gojoHP = Math.max(g.gojoHP - bot.d, 0) }
      }
    } else {
      const sa = {
        لكمة:   {d:18, m:'👊 سوكونا: لكمة!'},
        تفكيك:  {d:12, m:'🔪 تفكيك!'},
        تقطيع:  {d:10, m:'✂️ تقطيع!'}
      }[cmd] || {d:12, m:'👊 يهاجم!'}
      g.logs.push(sa.m); g.gojoHP = Math.max(g.gojoHP - sa.d, 0)
      if (g.gojoHP <= 0) { g.logs.push(''); g.logs.push('⚔️ انتصر سوكونا في المعركة الأخيرة!'); g.phase='end' }
      else { const bot = botAtk(g); g.logs.push(bot.m); g.sukunaHP = Math.max(g.sukunaHP - bot.d, 0) }
    }
    db[u] = g; writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  if (g.phase === 'battle') {
    if (cmd === 'توسيع') { g.logs.push('❌ لا يمكن توسيع المجال! الدماغ تضرر!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    const res = applyPlayerAtk(g, cmd)
    if (res.err) { g.logs.push(res.err); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    g.logs.push(res.msg)

    if (res.sp === 'flash') {
      g.sukunaHP = Math.max(g.sukunaHP - res.dmg, 0)
      g.mahoragaActive = true
      g.phase = 'cutscene'
      g.logs.push('')
      g.logs.push('🐉 ماهوراجا تظهر من العدم!')
      g.logs.push('   تحارب ساتورو لـ 20 ثانية...')
      db[u] = g; writeDB(db)
      setTimeout(() => {
        const fr = readDB(); const g2 = fr[u]; if (!g2 || g2.phase === 'end') return
        g2.logs.push('')
        g2.logs.push('🔴 سوكونا: استيقظت!')
        g2.logs.push('           ثلاثة ضد واحد!')
        g2.logs.push('🗡️ سوكونا: استدعاء شيكيجامي... أجيتو!')
        g2.logs.push('')
        g2.logs.push('⚠️ أجيتو وماهوراجا وسوكونا يهاجمون معاً!')
        g2.logs.push('💡 اقتل أجيتو أولاً بـ .الأزرق')
        g2.agitoActive = true; g2.agitoHP = 100
        g2.mahoragaActive = false; g2.phase = 'final'
        fr[u] = g2; writeDB(fr)
        conn.sendMessage(m.chat, display(g2))
      }, 20000)
      return conn.sendMessage(m.chat, display(g), { quoted: m })
    } else if (res.sp === 'mahoraga') { g.gojoHP = Math.max(g.gojoHP - res.dmg, 0) }
    else if (res.sp !== 'heal' && res.sp !== 'infinity') {
      if (isGojo) g.sukunaHP = Math.max(g.sukunaHP - res.dmg, 0)
      else        g.gojoHP   = Math.max(g.gojoHP   - res.dmg, 0)
    }

    if (!isGojo && g.gojoHP <= 0) { g.logs.push(''); g.logs.push('🔵 ساتورو: لقد كنت مذهلاً...'); g.logs.push('⚔️ انتصر سوكونا!'); g.phase='end'; db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    if (!g.mahoragaActive) {
      const bot = botAtk(g); g.logs.push(bot.m)
      if (isGojo) {
        if (g.infinityActive) { g.logs.push('∞ اللانهائية امتصت!'); g.logs.push('🔴 سوكونا: مستحيل!'); g.infinityActive=false }
        else g.gojoHP = Math.max(g.gojoHP - bot.d, 0)
      } else { g.sukunaHP = Math.max(g.sukunaHP - bot.d, 0) }
    }
    if (isGojo  && g.gojoHP   <= 0) { g.logs.push(''); g.logs.push('🔴 سوكونا: "حتى الأقوى يسقط..."'); g.logs.push('⚔️ انتصر سوكونا!'); g.phase='end' }
    if (!isGojo && g.sukunaHP <= 0) { g.logs.push(''); g.logs.push('🔵 ساتورو: "لم يكن أمامك خيار يا سوكونا"'); g.logs.push('⚔️ انتصر ساتورو!'); g.phase='end' }
    db[u] = g; writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  if (g.phase === 'started') {
    if (cmd === 'فلاش') { g.logs.push('⚠️ البلاك فلاش في مرحلة القتال المباشر فقط!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    if (cmd === 'توسيع') {
      if (isGojo) {
        if (!g.gojo.field) { g.logs.push('❌ نفد مجالك!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
        g.gojo.field--; g.gojo.fieldCount++
        g.logs.push('🌌 ساتورو: الفراغ اللانهائي!'); g.logs.push('   ∞ توسيع مجال الفراغ اللانهائي!')
      } else {
        if (!g.sukuna.field) { g.logs.push('❌ نفد مجالك!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
        g.sukuna.field--; g.sukuna.fieldCount++
        g.logs.push('🔮 سوكونا: الضريح الخبيث!'); g.logs.push('   🌑 توسيع مجال الضريح الخبيث!')
      }
      const botHasField = isGojo ? g.sukuna.field > 0 : g.gojo.field > 0
      if (botHasField) {
        g.logs.push('')
        if (isGojo) { g.logs.push('🔴 سوكونا: لن تسحبني للفراغ!'); g.logs.push('🔮 سوكونا يوسع مجاله فوراً!'); g.sukuna.field--; g.sukuna.fieldCount++ }
        else { g.logs.push('🔵 ساتورو: لن تحبسني في الضريح!'); g.logs.push('🌌 ساتورو يوسع مجاله فوراً!'); g.gojo.field--; g.gojo.fieldCount++ }
        g.fieldCollisions++
        const cr = collisionResult(g.fieldCollisions)
        cr.lines.forEach(l => g.logs.push(l))
        if (cr.win === 'sukuna') g.gojoHP   = Math.max(g.gojoHP   - cr.dmg, 0)
        else                    g.sukunaHP = Math.max(g.sukunaHP - cr.dmg, 0)
        if (g.fieldCollisions >= 4) {
          g.phase = 'cutscene'; db[u]=g; writeDB(db)
          setTimeout(() => {
            const fr = readDB(); const g2 = fr[u]; if (!g2) return
            g2.logs.push(''); g2.logs.push('🔴 سوكونا: ماهوراجا... هروب!!'); g2.logs.push('🐉 ماهوراجا تقفز وتحمل سوكونا بعيداً!')
            g2.logs.push(''); g2.logs.push('🧠💥 تلف دماغ ساتورو!'); g2.logs.push('🔵 ساتورو يسقط على ركبتيه...')
            g2.logs.push(''); g2.logs.push('🔴 سوكونا: لن تفعل مجالك مرة أخرى يا ساتورو ساتورو')
            g2.logs.push(''); g2.logs.push('🔴 سوكونا: لقد أتلفت عقلك!')
            g2.logs.push('           تجديدك باستمرار أتلف وجدد عقلك!'); g2.logs.push('')
            g2.logs.push('⚡⚡ القتال المباشر الآن! لا مجالات! ⚡⚡')
            g2.brainDamage=true; g2.gojo.field=0; g2.sukuna.field=0; g2.phase='battle'
            fr[u]=g2; writeDB(fr); conn.sendMessage(m.chat, display(g2))
          }, 2000)
          return conn.sendMessage(m.chat, display(g), { quoted: m })
        }
      } else {
        g.logs.push(isGojo ? '🔴 سوكونا لا يملك مجالاً!' : '🔵 ساتورو لا يملك مجالاً!')
        g.logs.push(isGojo ? '🔵 ساتورو يفوز بالمجال!' : '🔴 سوكونا يفوز بالمجال!')
        if (isGojo) g.sukunaHP = Math.max(g.sukunaHP - 30, 0)
        else        g.gojoHP   = Math.max(g.gojoHP   - 30, 0)
      }
      db[u]=g; writeDB(db)
      return conn.sendMessage(m.chat, display(g), { quoted: m })
    }
    const res = applyPlayerAtk(g, cmd)
    if (res.err) { g.logs.push(res.err); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    g.logs.push(res.msg)
    if (res.sp !== 'heal' && res.sp !== 'infinity' && res.sp !== 'mahoraga') {
      if (isGojo) g.sukunaHP = Math.max(g.sukunaHP - res.dmg, 0)
      else        g.gojoHP   = Math.max(g.gojoHP   - res.dmg, 0)
    } else if (res.sp === 'mahoraga') { g.gojoHP = Math.max(g.gojoHP - res.dmg, 0) }
    const botHasField2 = isGojo ? g.sukuna.field > 0 : g.gojo.field > 0
    if (botHasField2 && g.fieldCollisions < 4) {
      g.logs.push('')
      if (isGojo) { g.logs.push('🔴 سوكونا: "الضريح الخبيث!"'); g.logs.push('🔮 سوكونا يوسع مجاله!'); g.sukuna.field--; g.sukuna.fieldCount++; g.gojoHP=Math.max(g.gojoHP-18,0); g.logs.push('💥 مجال سوكونا يضرب ساتورو!'); g.logs.push('   رد بـ .توسيع!') }
      else { g.logs.push('🔵 ساتورو: "الفراغ اللانهائي!"'); g.logs.push('🌌 ساتورو يوسع مجاله!'); g.gojo.field--; g.gojo.fieldCount++; g.sukunaHP=Math.max(g.sukunaHP-18,0); g.logs.push('💥 مجال ساتورو يضرب سوكونا!'); g.logs.push('   رد بـ .توسيع!') }
    } else {
      const bot = botAtk(g); g.logs.push(bot.m)
      if (isGojo) { if (g.infinityActive) { g.logs.push('∞ اللانهائية امتصت!'); g.infinityActive=false } else g.gojoHP=Math.max(g.gojoHP-bot.d,0) }
      else { g.sukunaHP=Math.max(g.sukunaHP-bot.d,0) }
    }
    db[u]=g; writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  db[u]=g; writeDB(db)
  return conn.sendMessage(m.chat, display(g), { quoted: m })
}

handler.help    = ['شينجوكو']
handler.tags    = ['games']
handler.command = /^(شينجوكو|ساتورو|سوكونا|توجي|الأزرق|الأحمر|مدمج|توسيع|ريفرس|فلاش|لانهائية|لكمة|تفكيك|تقطيع|ماهوراجا|بنفسجي|انهاء|مود|يد|سحابة|خاطف|رمح|شريحة|تكيف|دمار|مكيفة)$/u

export default handler