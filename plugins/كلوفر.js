import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const DB    = path.join(__dirname, '../database/blackclover.json')
const THUMB = 'https://files.catbox.moe/1nlc8b.jpg'

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
  astaHP: 100, yunoHP: 100, demonHP: 100,
  round: 0, logs: [],
  asta: { black: 20, demon: 20, combo: 999, field: 4, heal: 5, flash: 1, fieldCount: 0, infinity: 3 },
  yuno: { wind: 999, spirit: 20, slash: 999, field: 4, heal: 5, demonGod: 5, angel: 1, fieldCount: 0 },
  fieldCollisions: 0,
  brainDamage: false,
  demonGodActive: false,
  angelActive: false,
  infinityActive: false,
  pvp: false
})

const bar = (hp) =>
  '█'.repeat(Math.max(0, Math.floor(hp / 5))) +
  '░'.repeat(Math.max(0, 20 - Math.floor(hp / 5)))

const display = (g) => {
  const logs = g.logs.slice(-14).join('\n')
  const isAsta = g.char === 'asta'
  const stats = isAsta
    ? `📊 سيف-سحري(${g.asta.black}) سيف-ساحر(${g.asta.demon}) شفاء(${g.asta.heal}) درع-إلبا(${g.asta.infinity})${g.infinityActive ? '🛡️' : ''} سيف-مدمج(${g.asta.flash}) تحكم-سحري(${g.asta.field})`
    : `📊 روح-الرياح(${g.yuno.spirit}) شفاء(${g.yuno.heal}) إله-الشر(${g.yuno.demonGod}) تحكم-رياحي(${g.yuno.field})`
  let cmds = ''
  if (g.phase === 'started')
    cmds = isAsta
      ? '⚔️ سيف-سحري | سيف-ساحر | مدمج | ريفرس | درع-إلبا | تحكم-سحري'
      : '⚔️ ضربة-رياح | روح-الرياح | موجة-رياح | ريفرس | إله-الشر | تحكم-رياحي'
  else if (g.phase === 'battle')
    cmds = isAsta
      ? `⚔️ سيف-سحري | سيف-ساحر | مدمج | ريفرس | درع-إلبا${g.asta.flash > 0 ? ' | سيف-مدمج 🖤' : ''}`
      : '⚔️ ضربة-رياح | روح-الرياح | موجة-رياح | ريفرس | إله-الشر'
  else if (g.phase === 'final')
    cmds = (g.angelActive && isAsta)
      ? '⚔️ اقتل لوسيوس أولاً ← .سيف-سحري'
      : (!g.angelActive && isAsta)
        ? '💜 لوسيوس مات! أطلق الضربة الأخيرة ← .بنفسجي'
        : '⚔️ ضربة-رياح | روح-الرياح | موجة-رياح'
  else if (g.phase === 'cutscene')
    cmds = '⏳ إله الشر يهاجم... انتظر!'
  const phaseLabel = { started:'⚡ المواجهة', battle:'💥 قتال مباشر', final:'🔥 المعركة الأخيرة', end:'🏁 انتهت', cutscene:'🎬 مشهد' }[g.phase] || ''
  const angelLine  = (g.phase === 'final' && g.angelActive) ? `\n👁️ لوسيوس : ${bar(g.angelHP)} ${g.angelHP}%` : ''
  return {
    image: { url: THUMB },
    caption: `╔═══━━━─── • ───━━━═══╗\n   ⟡ ☘️ 𝗕 𝗟 𝗔 𝗖 𝗞  𝗖 𝗟 𝗢 𝗩 𝗘 𝗥 ☘️ ⟡\n╚═══━━━─── • ───━━━═══╝\n\n${phaseLabel} | جولة ${g.round}\n🟠 آستا    : ${bar(g.astaHP)} ${g.astaHP}%\n🔴 يونو    : ${bar(g.yunoHP)} ${g.yunoHP}%${angelLine}\n\n📜 الأحداث:\n${logs}\n\n${stats}\n\n${cmds}\n╚════════════════╝\n\n> برعاية المايسترو ادم`
  }
}

const YUNO_BOT = [
  { d: 18, m: '🌪️ يونو: ضربة-رياح معززة!\n   "أنت ضعيف يا آستا!"' },
  { d: 12, m: '💨 يونو: روح-الرياح!\n   "تحرك كالساحر أو مُت!"' },
  { d: 10, m: '🌀 يونو: موجة-رياح!\n   "هل هذا كل ما لديك؟"' },
  { d: 20, m: '🌪️ يونو: ضربة-رياح نارية!\n   "انتهى وقتك!"' },
  { d: 14, m: '💨 يونو: روح-الرياح متلاحقة!\n   "ستسقط عاجلاً!"' },
  { d: 16, m: '🌀 يونو: موجة-رياح مزدوجة!\n   "ما زلت تقاوم؟ مثير..."' }
]
const ASTA_BOT = [
  { d: 15, m: '⚔️ آستا: سيف-سحري!\n   "لا مفر من سيفي!"' },
  { d: 15, m: '🗡️ آستا: سيف-ساحر!\n   "هل تشعر بهذا؟"' },
  { d: 20, m: '⚔️ آستا: وضع إلبا + سيف-سحري!\n   "أنا لم أبدأ بعد!"' },
  { d: 18, m: '⚔️ آستا: سيف-سحري متلاحق!\n   "فكر بشكل أسرع!"' },
  { d: 12, m: '⚔️ آستا: ضربة معززة بالسحر المضاد!\n   "كم ستصمد؟"' }
]
const botAtk = (g) => {
  const pool = g.char === 'asta' ? YUNO_BOT : ASTA_BOT
  return pool[Math.floor(Math.random() * pool.length)]
}

const collisionResult = (n) => {
  if (n === 1) return { win:'yuno', dmg:25, lines:['💥 اصطدام المجالات!','🔮 تحكم-رياحي يبتلع تحكم-سحري!','🔴 يونو يفوز بالاصطدام الأول!','   "نملة كبيرة... لكنها نملة!"','🟠 آستا يتراجع ويتضرر!'] }
  if (n === 2) return { win:'yuno', dmg:25, lines:['💥 اصطدام المجالات مجدداً!','🔴 تحكم-رياحي يطغى مرة أخرى!','🔴 يونو يفوز للمرة الثانية!','   "هل فكرت في الاستسلام يا آستا؟"','🟠 آستا ينزف!'] }
  if (n === 3) return { win:'yuno', dmg:25, lines:['💥 ثالث اصطدام!','🔮 تحكم-رياحي يسحق تحكم-سحري!','🔴 يونو يفوز للمرة الثالثة!','   "إلى متى ستصمد؟"','🟠 آستا يتألم بشدة!'] }
  return { win:'asta', dmg:35, lines:['💥 الاصطدام الرابع والأخير!','🌌 سيف إلبا يمزق تحكم-رياحي!','🟠 آستا يفوز هذه المرة!','   "إرادة السحر المضاد لا حدود لها!"','🔴 يونو يتضرر بشدة!'] }
}

const INTRO_LOGS = [
  '🟠 آستا: لا تفهم قدومي لك خطأً يا يونو',
  '         أنت المتحدي هنا',
  '',
  '🔴 يونو: أنا المتحدي؟',
  '           أنت مجرد قزم على أرض المعركة',
  '',
  '🟠 آستا: انظر من يتكلم...',
  '         الهارب من مملكة السحرة',
  '',
  '⚡⚡⚡ بدأت المعركة! ⚡⚡⚡'
]

const newPvpGame = (astaPlayer, astaChat, yunoPlayer, yunoChat) => {
  const g = newGame('asta')
  g.pvp          = true
  g.astaPlayer = astaPlayer
  g.yunoPlayer = yunoPlayer
  g.astaChat   = astaChat
  g.yunoChat   = yunoChat
  g.currentTurn  = 'asta'
  g.logs         = [...INTRO_LOGS]
  g.teamWaiting      = true
  g.teamMode         = false
  g.lichtPlayer       = null
  g.lichtChat         = null
  g.demonGodPlayer   = null
  g.demonGodChat     = null
  g.lichtHP           = 80
  g.demonGodHP       = 120
  g.lichtAlive        = false
  g.demonGodAlive    = false
  g.spearActive      = false
  g.licht = { punch: 999, cloud: 999, katana: 5, spear: 2 }
  g.demonGod_skills  = { slash: 999, adapt: 3, domainDestroy: 1, adaptedSlash: 0 }
  return g
}

const pvpDisplay = (g, char) => {
  const d = display({ ...g, char })
  const note = g.phase === 'end' ? '' : g.currentTurn === char ? '\n\n🎮 دورك! اكتب أمر هجوم' : '\n\n⏳ دور خصمك... انتظر'
  return { ...d, caption: d.caption + note }
}

const getNextTurn = (g) => {
  const order = ['asta', 'licht', 'yuno', 'demonGod']
  const alive  = order.filter(c => {
    if (c === 'asta')   return g.astaHP > 0
    if (c === 'yuno')   return g.yunoHP > 0
    if (c === 'licht')   return g.lichtAlive && g.lichtHP > 0
    if (c === 'demonGod')    return g.demonGodAlive && g.demonGodHP > 0
    return false
  })
  if (!alive.length) return g.currentTurn
  const idx = alive.indexOf(g.currentTurn)
  return alive[(idx + 1) % alive.length]
}

const checkTeamWin = (g) => {
  const yunoDead = g.yunoHP <= 0 && (!g.demonGodAlive || g.demonGodHP <= 0)
  const astaDead = g.astaHP <= 0 && (!g.lichtAlive     || g.lichtHP     <= 0)
  if (yunoDead) return 'asta'
  if (astaDead) return 'yuno'
  return null
}

const applyTeamDmg = (g, attackerChar, dmg, bypassInfinity = false) => {
  const astaSide = ['asta', 'licht']
  const yunoSide = ['yuno', 'demonGod']
  if (astaSide.includes(attackerChar)) {
    if (g.yunoHP > 0) { g.yunoHP = Math.max(g.yunoHP - dmg, 0); return { target: 'يونو' } }
    else if (g.demonGodAlive && g.demonGodHP > 0) { g.demonGodHP = Math.max(g.demonGodHP - dmg, 0); return { target: 'لوسيوس' } }
  } else {
    if (!bypassInfinity && g.spearActive) { g.spearActive = false; return { speared: true } }
    if (!bypassInfinity && g.infinityActive) { g.infinityActive = false; return { absorbed: true } }
    if (g.astaHP > 0) { g.astaHP = Math.max(g.astaHP - dmg, 0); return { target: 'آستا' } }
    else if (g.lichtAlive && g.lichtHP > 0) { g.lichtHP = Math.max(g.lichtHP - dmg, 0); return { target: 'ليخت' } }
  }
  return {}
}

const teamDisplay = (g, char) => {
  const logs = g.logs.slice(-10).join('\n')
  const gl = `🟠 آستا    : ${bar(g.astaHP)} ${g.astaHP}%${g.infinityActive ? ' 🛡️' : ''}`
  const tl = g.lichtAlive ? `⚪ ليخت    : ${bar(g.lichtHP)} ${g.lichtHP}%${g.spearActive ? ' 🔱' : ''}` : ''
  const sl = `🔴 يونو    : ${bar(g.yunoHP)} ${g.yunoHP}%`
  const ml = g.demonGodAlive ? `🐉 لوسيوس : ${bar(g.demonGodHP)} ${g.demonGodHP}%` : ''
  const ms = g.demonGod_skills || {}
  let cmds = ''
  if (char === 'asta')
    cmds = `📊 سيف-سحري(${g.asta?.black||0}) سيف-ساحر(${g.asta?.demon||0}) شفاء(${g.asta?.heal||0}) درع-إلبا(${g.asta?.infinity||0}) سيف-مدمج(${g.asta?.flash||0})\n⚔️ سيف-سحري | سيف-ساحر | مدمج | ريفرس | درع-إلبا | سيف-مدمج | تحكم-سحري`
  else if (char === 'licht')
    cmds = `📊 ضوء(∞) سحر-خفيف(${g.licht?.katana||0}) سيف-ضوئي(${g.licht?.spear||0})\n⚔️ ضربة-ضوء | سحر-خفيف | سيف-ضوئي\n💡 كل هجمات ليخت تخترق درع-إلبا`
  else if (char === 'yuno')
    cmds = `📊 روح-الرياح(${g.yuno?.spirit||0}) شفاء(${g.yuno?.heal||0}) تحكم-رياحي(${g.yuno?.field||0})\n⚔️ ضربة-رياح | روح-الرياح | موجة-رياح | ريفرس | تحكم-رياحي`
  else if (char === 'demonGod')
    cmds = `📊 تحكم(${ms.adapt||0}) دمار(${ms.domainDestroy||0})${ms.adaptedSlash > 0 ? ` مكيف(${ms.adaptedSlash})` : ''}\n⚔️ شريحة | تحكم | دمار${ms.adaptedSlash > 0 ? ' | مكيفة' : ''}`
  const charName = { asta:'🟠 آستا', licht:'⚪ ليخت', yuno:'🔴 يونو', demonGod:'🐉 لوسيوس' }
  const myTurn   = g.currentTurn === char
  const turnNote = myTurn ? '🎮 دورك الآن!' : `⏳ دور ${charName[g.currentTurn] || g.currentTurn}...`
  return {
    image: { url: THUMB },
    caption:
`╔═══━━━─── • ───━━━═══╗
   ⟡ ⚔️ وضع الفريق ⚔️ ⟡
╚═══━━━─── • ───━━━═══╝

🟠 فريق آستا:
${gl}${tl ? '\n' + tl : ''}

🔴 فريق يونو:
${sl}${ml ? '\n' + ml : ''}

📜 الأحداث:
${logs}

${cmds}

${turnNote} | جولة ${g.round}
╚════════════════╝

> برعاية المايسترو ادم`
  }
}

const broadcastTeam = (conn, pg, exceptUser = null) => {
  const players = [
    { id: pg.astaPlayer,   chat: pg.astaChat,   char: 'asta' },
    { id: pg.yunoPlayer,   chat: pg.yunoChat,   char: 'yuno' },
    pg.lichtAlive     ? { id: pg.lichtPlayer,     chat: pg.lichtChat,     char: 'licht' } : null,
    pg.demonGodAlive ? { id: pg.demonGodPlayer, chat: pg.demonGodChat, char: 'demonGod' }  : null,
  ].filter(p => p && p.id && p.id !== exceptUser)
  players.forEach(p => conn.sendMessage(p.chat, teamDisplay(pg, p.char)))
}

const startTeamBattle = (conn, gameKey) => {
  const db = readDB()
  const pg = db[gameKey]
  if (!pg || !pg.teamWaiting) return
  pg.teamWaiting = false
  pg.teamMode    = pg.lichtAlive || pg.demonGodAlive
  pg.currentTurn = 'asta'
  pg.logs.push('')
  if (pg.teamMode) {
    pg.logs.push('⚔️⚔️ وضع الفريق بدأ! ⚔️⚔️')
    pg.logs.push(`🟠 فريق آستا: آستا${pg.lichtAlive ? ' ⚡ ليخت' : ''}`)
    pg.logs.push(`🔴 فريق يونو: يونو${pg.demonGodAlive ? ' ⚡ لوسيوس' : ''}`)
    pg.logs.push('')
    pg.logs.push('🟠 آستا يبدأ الجولة الأولى!')
  } else {
    pg.logs.push('⚡ لم ينضم أحد للفرق')
    pg.logs.push('🥊 معركة 1 ضد 1 كلاسيكية!')
    pg.logs.push('🟠 آستا يبدأ!')
  }
  db[gameKey] = pg
  writeDB(db)
  if (pg.teamMode) {
    broadcastTeam(conn, pg)
  } else {
    conn.sendMessage(pg.astaChat, pvpDisplay(pg, 'asta'))
    conn.sendMessage(pg.yunoChat, pvpDisplay(pg, 'yuno'))
  }
}

const applyPlayerAtk = (g, cmd) => {
  const isAsta = g.char === 'asta'
  let dmg = 0, msg = '', sp = null, err = null
  
  // ===== مهارات آستا فقط =====
  if (isAsta) {
    if (cmd === 'سيف-سحري') { 
      if (!g.asta.black) return { err:'❌ نفدت طاقة السيف السحري!' }
      dmg=15; g.asta.black--; 
      msg='⚔️ آستا: سيف-سحري!\n   💫 سيف السحر المضاد يسحق كل شيء!' 
    }
    else if (cmd === 'سيف-ساحر') {
      if (!g.asta.demon) return { err:'❌ نفد السيف الساحر!' }
      dmg=15; g.asta.demon--; 
      msg='🗡️ آستا: سيف-ساحر!\n   💥 سيف الشيطان يمزق كل ما حوله!' 
    }
    else if (cmd === 'مدمج') { 
      dmg=22; 
      msg='⚔️ آستا: وضع إلبا + سيف-سحري!\n   🌪️ هجوم بقوة إلبا لا يُرد!' 
    }
    else if (cmd === 'ريفرس') {
      if (!g.asta.heal) return { err:'❌ نفد الشفاء!' }
      g.astaHP=100; g.asta.heal--; 
      msg='✨ آستا: تجديد إلبا!\n   💚 الجروح تختفي... شفاء كامل!'; 
      sp='heal' 
    }
    else if (cmd === 'درع-إلبا') {
      if (!g.asta.infinity) return { err:'❌ نفد درع إلبا!' }
      g.infinityActive=true; g.asta.infinity--; 
      msg='∞ آستا: درع-إلبا!\n   🛡️ حاجز لا يُخترق!'; 
      sp='infinity' 
    }
    else if (cmd === 'سيف-مدمج') {
      if (!g.asta.flash) return { err:'❌ استُخدم السيف المدمج!' }
      if (g.phase!=='battle') return { err:'❌ السيف المدمج في مرحلة القتال فقط!' }
      dmg=35; g.asta.flash--; 
      msg='⚫ آستا: سيف-مدمج!!!\n   💥 انفجار مرعب!'; 
      sp='flash' 
    }
    else if (cmd === 'تحكم-سحري') {
      // هتتعامل في الـ phase
    }
    else {
      return { err:'❌ هذا الأمر غير متاح لآستا!\nأوامرك: سيف-سحري | سيف-ساحر | مدمج | ريفرس | درع-إلبا | سيف-مدمج | تحكم-سحري' }
    }
  }
  
  // ===== مهارات يونو فقط =====
  else {
    if (cmd === 'ضربة-رياح') { 
      dmg=18; 
      msg='🌪️ يونو: ضربة-رياح معززة!\n   💪 قوة الروح لا تُقاوم!' 
    }
    else if (cmd === 'روح-الرياح') {
      if (!g.yuno.spirit) return { err:'❌ نفدت طاقة روح الرياح!' }
      dmg=12; g.yuno.spirit--; 
      msg='💨 يونو: روح-الرياح!\n   ⚔️ يمزق الشاكرا كالورق!' 
    }
    else if (cmd === 'موجة-رياح') { 
      dmg=10; 
      msg='🌀 يونو: موجة-رياح!\n   🌪️ موجة رياح تجتاح المكان!' 
    }
    else if (cmd === 'ريفرس') {
      if (!g.yuno.heal) return { err:'❌ نفد الشفاء!' }
      g.yunoHP=100; g.yuno.heal--; 
      msg='✨ يونو: تجديد روح الرياح!\n   💚 لا يموت بهذه السهولة!'; 
      sp='heal' 
    }
    else if (cmd === 'إله-الشر') {
      if (!g.yuno.demonGod) return { err:'❌ إله الشر استنفد قوته!' }
      dmg=35; g.yuno.demonGod--; 
      msg='🐉 يونو: استدعاء إله الشر!\n   ⚙️ التحكم بالسحر المظلم!\n   💥 ضربة تخترق درع-إلبا!'; 
      sp='demonGod' 
    }
    else if (cmd === 'تحكم-رياحي') {
      // هتتعامل في الـ phase
    }
    else {
      return { err:'❌ هذا الأمر غير متاح ليونو!\nأوامرك: ضربة-رياح | روح-الرياح | موجة-رياح | ريفرس | إله-الشر | تحكم-رياحي' }
    }
  }
  
  return { dmg, msg, sp, err }
}

const handler = async (m, { conn, command }) => {
  const u  = m.sender
  const db = readDB()

  const cmd = (command || '').trim()

  if (cmd === 'كلوفر') {
    return conn.sendMessage(m.chat, {
      image: { url: THUMB },
      caption:
`╔═══━━━─── • ───━━━═══╗
   ⟡ ☘️ 𝗕 𝗟 𝗔 𝗖 𝗞  𝗖 𝗟 𝗢 𝗩 𝗘 𝗥 ☘️ ⟡
╚═══━━━─── • ───━━━═══╝

⚡⚡⚡ لقد بدأت المواجهة النهائية ⚡⚡⚡

المعركة الأسطورية:
🟠 آستا (ساحر مضاد السحر)
🔴 يونو (ملك السحرة المستقبلي)

اختر شخصيتك:
🟠 .آستا
🔴 .يونو

   ⟡ الوقت قد حان ⟡
╚════════════════╝

> برعاية المايسترو ادم`
    }, { quoted: m })
  }

  if (cmd === 'ليخت') {
    if (db[u]) return m.reply('❌ لديك لعبة بالفعل! اكتب .انهاء أولاً\n\n> برعاية المايسترو ادم')
    const entry = Object.entries(db).find(([k, v]) =>
      k.startsWith('pvp_') && v.teamWaiting && !v.lichtPlayer &&
      v.astaPlayer !== u && v.yunoPlayer !== u
    )
    if (!entry) return m.reply(
`⚠️ لا توجد مباريات تنتظر الآن!

💡 انتظر حتى يبدأ لاعبان معركة
   ثم اكتب .ليخت خلال 40 ثانية

> برعاية المايسترو ادم`
    )
    const [gameKey, pg] = entry
    pg.lichtPlayer = u
    pg.lichtChat   = m.chat
    pg.lichtAlive  = true
    db[u] = { pvp: true, gameKey, char: 'licht' }
    db[gameKey] = pg
    writeDB(db)
    const joinMsg =
`╔═══━━━─── • ───━━━═══╗
   ⟡ ⚪ ليخت ⚪ ⟡
╚═══━━━─── • ───━━━═══╝

⚪ انضممت كـ ليخت!

📖 معلومات الشخصية:
🔒 سحر الضوء: عالية جداً
👁️ عين الضوء: نشطة
✨ كل هجماتك تخترق درع-إلبا تلقائياً

⚔️ مهاراتك:
├ .ضربة-ضوء  → ضربة ضوء (20 ضرر) ∞
├ .سحر-خفيف    → سحر خفيف (28 ضرر) ∞
├ .سيف-ضوئي → سيف ضوئي (35 ضرر) x5
└ .كاموي    → كاموي مصطنع x2
              يبطل الهجوم القادم

⏳ انتظر بدء المعركة...
╚════════════════╝

> برعاية المايسترو ادم`
    conn.sendMessage(pg.astaChat, { text: `⚪ ليخت انضم لفريقك!\n"قوة الضوء... لإنهاء هذه الحرب"\n\n> برعاية المايسترو ادم` })
    conn.sendMessage(pg.yunoChat, { text: `⚠️ ليخت انضم لفريق آستا!\nساحر الضوء... الأخطر!\n\n> برعاية المايسترو ادم` })
    return conn.sendMessage(m.chat, { image: { url: THUMB }, caption: joinMsg }, { quoted: m })
  }

  if (cmd === 'لوسيوس' && !db[u]) {
    const entry = Object.entries(db).find(([k, v]) =>
      k.startsWith('pvp_') && v.teamWaiting && !v.demonGodPlayer &&
      v.astaPlayer !== u && v.yunoPlayer !== u
    )
    if (!entry) return m.reply(
`⚠️ لا توجد مباريات تنتظر الآن!

💡 انتظر حتى يبدأ لاعبان معركة
   ثم اكتب .لوسيوس خلال 40 ثانية

> برعاية المايسترو ادم`
    )
    const [gameKey, pg] = entry
    pg.demonGodPlayer = u
    pg.demonGodChat   = m.chat
    pg.demonGodAlive  = true
    db[u] = { pvp: true, gameKey, char: 'demonGod' }
    db[gameKey] = pg
    writeDB(db)
    const joinMsg =
`╔═══━━━─── • ───━━━═══╗
   ⟡ 🐉 لوسيوس ⟡
╚═══━━━─── • ───━━━═══╝

🐉 انضممت كـ لوسيوس!

📖 معلومات الشخصية:
⚙️ قدرة التحكم: نشطة دائماً
🛡️ نقاط الحياة: 120 (الأكثر متانة)
🍩 لوسيوس... يخدم الخطة!

⚔️ مهاراتك:
├ .شريحة  → شفرة لوسيوس (25 ضرر) ∞
├ .تحكم  → تفعيل تحكم x3
├ .مكيفة  → اختراق يخترق درع-إلبا (40 ضرر!)
└ .دمار   → تدمير المجال! يكسر درع-إلبا x1

⏳ انتظر بدء المعركة...
╚════════════════╝

> برعاية المايسترو ادم`
    conn.sendMessage(pg.yunoChat, { text: `🐉 لوسيوس انضم لفريقك!\nالزعيم الأسطوري يخدم الخطة!\n\n> برعاية المايسترو ادم` })
    conn.sendMessage(pg.astaChat, { text: `⚠️ لوسيوس انضم لفريق يونو!\nمن تحكم بالسحر المظلم وتلاعب بالحرب...\n\n> برعاية المايسترو ادم` })
    return conn.sendMessage(m.chat, { image: { url: THUMB }, caption: joinMsg }, { quoted: m })
  }

  if (cmd === 'آستا' || cmd === 'يونو') {
    const pickedChar   = cmd === 'آستا' ? 'asta' : 'yuno'
    const oppositeChar = pickedChar === 'asta' ? 'yuno' : 'asta'
    const pending      = db.pending

    if (pending && pending.char === oppositeChar && pending.user !== u) {
      const gameKey      = `pvp_${Date.now()}`
      const astaPlayer = pickedChar === 'asta' ? u : pending.user
      const yunoPlayer = pickedChar === 'yuno' ? u : pending.user
      const astaChat   = pickedChar === 'asta' ? m.chat : pending.chat
      const yunoChat   = pickedChar === 'yuno' ? m.chat : pending.chat
      const g = newPvpGame(astaPlayer, astaChat, yunoPlayer, yunoChat)
      db[astaPlayer] = { pvp: true, gameKey, char: 'asta' }
      db[yunoPlayer] = { pvp: true, gameKey, char: 'yuno' }
      db[gameKey]      = g
      delete db.pending
      writeDB(db)
      const teamInviteMsg =
`╔═══━━━─── • ───━━━═══╗
   ⟡ 🔱 وضع الفريق 🔱 ⟡
╚═══━━━─── • ───━━━═══╝

⚔️ تم إيجاد خصم!
⏳ 40 ثانية للانضمام كفريق!

🟠 فريق آستا:
   ⟡ آستا ✅ (محجوز)
   ⟡ ليخت ← اكتب .ليخت

🔴 فريق يونو:
   ⟡ يونو ✅ (محجوز)
   ⟡ لوسيوس ← اكتب .لوسيوس

💡 بعد 40 ثانية:
   - انضم الاثنان → معركة فريق 2 ضد 2
   - انضم واحد   → معركة 2 ضد 1
   - لم ينضم أحد → معركة 1 ضد 1 عادية

   ⟡ الوقت بدأ الآن ⟡
╚════════════════╝

> برعاية المايسترو ادم`
      conn.sendMessage(astaChat, { image: { url: THUMB }, caption: teamInviteMsg })
      conn.sendMessage(yunoChat, { image: { url: THUMB }, caption: teamInviteMsg })
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
   ⟡ ☘️ 𝗕 𝗟 𝗔 𝗖 𝗞  𝗖 𝗟 𝗢 𝗩 𝗘 𝗥 ☘️ ⟡
╚═══━━━─── • ───━━━═══╝

⏳ اخترت ${cmd === 'آستا' ? '🟠 آستا' : '🔴 يونو'}!

في انتظار لاعب ${oppositeChar === 'yuno' ? '🔴 يونو' : '🟠 آستا'}...

🤖 اكتب .مود للعب ضد الروبوت الآن

   ⟡ الوقت قد حان ⟡
╚════════════════╝

> برعاية المايسترو ادم`
    }, { quoted: m })
  }

  if (cmd === 'مود') {
    if (!db[u] || !db[u].waiting) return m.reply('❌ ليس لديك لعبة بانتظار\nاكتب .كلوفر أولاً\n\n> برعاية المايسترو ادم')
    const pickedChar = db[u].char
    if (db.pending && db.pending.user === u) delete db.pending
    const g = newGame(pickedChar)
    g.logs = [...INTRO_LOGS]
    db[u] = g
    writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  if (!db[u]) return m.reply('❌ اكتب: .كلوفر\n\n> برعاية المايسترو ادم')
  if (db[u].waiting) return m.reply('⏳ في انتظار خصم...\nاكتب .مود للعب ضد الروبوت\n\n> برعاية المايسترو ادم')

  if (cmd === 'انهاء') {
    if (db[u].pvp) {
      const gameKey = db[u].gameKey
      const pg = db[gameKey]
      if (pg) {
        const allPlayers = [pg.astaPlayer, pg.yunoPlayer, pg.lichtPlayer, pg.demonGodPlayer].filter(Boolean)
        allPlayers.forEach(p => { if (p !== u && db[p]) delete db[p] })
        delete db[gameKey]
      }
    }
    if (db[u].waiting && db.pending && db.pending.user === u) delete db.pending
    delete db[u]
    writeDB(db)
    return m.reply('✅ تم إنهاء اللعبة\n\n> برعاية المايسترو ادم')
  }

  const g = db[u]

  const allCmds = [
    'سيف-سحري','سيف-ساحر','مدمج','تحكم-سحري','ريفرس','سيف-مدمج','درع-إلبا',
    'ضربة-رياح','روح-الرياح','موجة-رياح','إله-الشر',
    'ضربة-ضوء','سحر-خفيف','سيف-ضوئي','كاموي',
    'شريحة','تحكم','دمار','مكيفة',
    'بنفسجي'
  ]
  if (!allCmds.includes(cmd)) return

  if (g.phase === 'end') return m.reply('⚔️ انتهت المعركة!\nاكتب .كلوفر لبدء جديدة\n\n> برعاية المايسترو ادم')
  if (g.phase === 'cutscene') return m.reply('⏳ انتظر... إله الشر يهاجم!\n\n> برعاية المايسترو ادم')

  // ══ PvP ══
  if (g.pvp) {
    const gameKey = g.gameKey
    const myChar  = g.char
    const pg      = db[gameKey]
    if (!pg) return m.reply('❌ انتهت اللعبة\n\n> برعاية المايسترو ادم')
    if (pg.teamWaiting) return m.reply('⏳ انتظر بدء المعركة!\nالوقت المتبقي أقل من 40 ثانية...\n\n> برعاية المايسترو ادم')
    if (pg.phase === 'end') return m.reply('⚔️ انتهت المعركة!\n\n> برعاية المايسترو ادم')
    if (pg.currentTurn !== myChar) {
      const charName = { asta:'🟠 آستا', licht:'⚪ ليخت', yuno:'🔴 يونو', demonGod:'🐉 لوسيوس' }
      return m.reply(`⏳ انتظر! دور ${charName[pg.currentTurn] || pg.currentTurn} الآن\n\n> برعاية المايسترو ادم`)
    }

    pg.round++
    pg.logs.push('')
    let dmg = 0, msg = '', sp = null, err = null
    let bypassInfinity = false

    if (myChar === 'licht') {
      bypassInfinity = true
      if (cmd === 'ضربة-ضوء') { dmg=20; msg='⚪ ليخت: ضربة-ضوء!\n   💪 "نور لا يُقاوم!"\n   ✨ اخترق درع-إلبا بشكل طبيعي!' }
      else if (cmd === 'سحر-خفيف') { dmg=28; msg='⚪ ليخت: سحر-خفيف!\n   🌀 سحابة الضوء تحطم كل شيء!\n   ✨ لا دفاع يصمد أمام سحر الضوء!' }
      else if (cmd === 'سيف-ضوئي') {
        if (!pg.licht.katana) { err='❌ نفدت ضربات السيف الضوئي! (٥/٥)' }
        else { dmg=35; pg.licht.katana--; msg='⚪ ليخت: سيف-ضوئي!\n   🔥 "سيف الضوء!"\n   💀 لا اللانهائية ولا المجال يوقفها!' }
      } else if (cmd === 'كاموي') {
        if (!pg.licht.spear) { err='❌ نفد كاموي المصطنع! (٢/٢)' }
        else { pg.licht.spear--; pg.spearActive=true; msg='🔱 ليخت: كاموي مصطنع!\n   ✨ "تشتيت الهجوم في بُعد آخر..."\n   🛡️ الهجوم القادم سيُبطل تلقائياً!'; sp='spear' }
      } else { err='❌ هذا الأمر غير متاح لليخت!\nأوامرك: ضربة-ضوء | سحر-خفيف | سيف-ضوئي | كاموي' }
    }

    else if (myChar === 'demonGod') {
      const ms = pg.demonGod_skills
      if (cmd === 'شريحة') { dmg=25; msg='🐉 لوسيوس: شفرة لوسيوس!\n   ⚔️ "البُعد المكاني يقطع كل ما أمامه!"\n   💥 موجة قاطعة تهز المكان!' }
      else if (cmd === 'تحكم') {
        if (!ms.adapt) { err='❌ نفدت قدرة التحكم! (٣/٣)' }
        else { ms.adapt--; ms.adaptedSlash++; msg='⚙️ لوسيوس: تفعيل التحكم!\n   🔄 العين تدور وتدور وتدور...\n   💡 ضربة الاختراق جاهزة!\n   الآن اكتب .مكيفة لإطلاق ضربة 40 ضرر!'; sp='adapt_passive' }
      } else if (cmd === 'دمار') {
        if (!ms.domainDestroy) { err='❌ استُخدم تدمير المجال بالفعل!' }
        else { ms.domainDestroy--; pg.infinityActive=false; pg.spearActive=false; msg='🐉 لوسيوس: تدمير المجال!\n   💥 "يحطم درع-إلبا وكل مجال نشط!"\n   🔱 كاموي ليخت... يتحطم!\n   ∞ درع-إلبا... ينهار!'; sp='domainDestroy' }
      } else if (cmd === 'مكيفة') {
        if (!ms.adaptedSlash) { err='❌ لا توجد ضربة اختراق جاهزة!\nاستخدم .تحكم أولاً' }
        else { dmg=40; bypassInfinity=true; ms.adaptedSlash--; msg='🐉 لوسيوس: اختراق!!!\n   ⚙️ "بُعد آخر... بدون مهرب!"\n   💜 الضربة تخترق كل دفاع!\n   💥 ٤٠ ضرر نقي!' }
      } else { err='❌ هذا الأمر غير متاح للوسيوس!\nأوامرك: شريحة | تحكم | دمار | مكيفة' }
    }

    else if (pg.teamMode) {
      const pvpAteam = {
        asta: {
          'سيف-سحري':      { d:15, m:'⚔️ آستا: سيف-سحري!\n   "لا مفر من دوامة السحر المضاد!"' },
          'سيف-ساحر':  { d:15, m:'🗡️ آستا: سيف-ساحر!\n   "هل تشعر بهذا؟"' },
          'مدمج':          { d:22, m:'⚔️ آستا: وضع إلبا + سيف-سحري!\n   "أنا لم أبدأ بعد!"' },
          'تحكم-سحري':         { d:30, m:'🌌 آستا: التحكم بالسحر الكامل!\n   "ابتلع كل شيء!"', sp:'field_g' },
          'ريفرس':         { d:0,  m:'💚 آستا: تجديد إلبا! شفاء كامل!', sp:'heal_g' },
          'درع-إلبا': { d:0,  m:'∞ آستا: درع-إلبا! حاجز لا يُخترق!', sp:'infinity' },
          'سيف-مدمج':      { d:35, m:'⚫ آستا: سيف-مدمج!!!\n   "انفجار مرعب يهز الوجود!"', sp:'flash_g' },
        },
        yuno: {
          'ضربة-رياح':    { d:18, m:'🌪️ يونو: ضربة-رياح معززة!\n   "قوة الروح لا تُقاوم!"' },
          'روح-الرياح':  { d:12, m:'💨 يونو: روح-الرياح!', sp:'spirit' },
          'موجة-رياح':    { d:10, m:'🌀 يونو: موجة-رياح!' },
          'تحكم-رياحي': { d:30, m:'🔮 يونو: تحكم-رياحي!', sp:'field_s' },
          'ريفرس':   { d:0,  m:'💚 يونو: تجديد روح الرياح! شفاء كامل!', sp:'heal_s' },
          'إله-الشر':   { d:35, m:'🐉 يونو: يقوي لوسيوس!\n   "خذ شاكرا إله الشر الزائدة!"', sp:'boost_m' },
        }
      }
      const a = pvpAteam[myChar]?.[cmd]
      if (!a) { db[gameKey]=pg; writeDB(db); return conn.sendMessage(m.chat, teamDisplay(pg, myChar), { quoted: m }) }
      msg=a.m; dmg=a.d; sp=a.sp||null
      if (sp==='heal_g')   { if (!pg.asta.heal) { err='❌ نفد الشفاء!' } else { pg.astaHP=100; pg.asta.heal-- } }
      if (sp==='heal_s')   { if (!pg.yuno.heal) { err='❌ نفد الشفاء!' } else { pg.yunoHP=100; pg.yuno.heal-- } }
      if (sp==='infinity') { if (!pg.asta.infinity) { err='❌ نفد درع-إلبا!' } else { pg.infinityActive=true; pg.asta.infinity--; dmg=0 } }
      if (sp==='flash_g')  { if (!pg.asta.flash) { err='❌ استُخدم السيف المدمج!' } else { pg.asta.flash-- } }
      if (sp==='spirit') { if (!pg.yuno.spirit) { err='❌ نفدت طاقة روح الرياح!' } else { pg.yuno.spirit-- } }
      if (sp==='boost_m' && pg.demonGodAlive) { pg.demonGod_skills.adaptedSlash++; msg+= '\n   ⚙️ لوسيوس يكتسب ضربة اختراق إضافية!'; dmg=0 }
    }

    else {
      const pvpA = {
        asta: {
          'سيف-سحري':     {d:15, m:'⚔️ آستا: سيف-سحري!\n   "لا مفر من السحر المضاد!"'},
          'سيف-ساحر': {d:15, m:'🗡️ آستا: سيف-ساحر!\n   "هل تشعر بهذا؟"'},
          'مدمج':         {d:22, m:'⚔️ آستا: وضع إلبا + سيف-سحري!\n   "أنا لم أبدأ بعد!"'},
          'تحكم-سحري':        {d:30, m:'🌌 آستا: التحكم بالسحر الكامل!'},
          'ريفرس':        {d:0,  m:'💚 آستا: تجديد إلبا!', sp:'heal_g'},
          'درع-إلبا':{d:0,  m:'∞ آستا: درع-إلبا!', sp:'infinity'},
          'سيف-مدمج':     {d:35, m:'⚫ سيف-مدمج!!!', sp:'flash_g'},
        },
        yuno: {
          'ضربة-رياح':   {d:18, m:'🌪️ يونو: ضربة-رياح معززة!'},
          'روح-الرياح': {d:12, m:'💨 يونو: روح-الرياح!', sp:'spirit'},
          'موجة-رياح':   {d:10, m:'🌀 يونو: موجة-رياح!'},
          'تحكم-رياحي': {d:30, m:'🔮 يونو: تحكم-رياحي!'},
          'ريفرس':  {d:0,  m:'💚 يونو: تجديد روح الرياح!', sp:'heal_s'},
          'إله-الشر':  {d:35, m:'🐉 إله-الشر!', sp:'demon_s'},
        }
      }
      const a = pvpA[myChar]?.[cmd] || { d:10, m:'⚔️ يهاجم!' }
      dmg=a.d; msg=a.m; sp=a.sp||null
      if (sp==='heal_g')   pg.astaHP=100
      if (sp==='heal_s')   pg.yunoHP=100
      if (sp==='infinity') { pg.infinityActive=true; dmg=0 }
      if (sp==='spirit') { if (!pg.yuno.spirit) { err='❌ نفدت طاقة روح الرياح!' } else pg.yuno.spirit-- }
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
        if (res.absorbed) { pg.logs.push('∞ درع-إلبا امتص الهجوم!') }
        else if (res.speared) { pg.logs.push('🔱 كاموي ليخت يبطل الهجوم!') }
        else if (res.target) { pg.logs.push(`   💥 ${res.target} يتلقى ${dmg} ضرر!`) }
      } else {
        if (myChar === 'asta') {
          pg.yunoHP = Math.max(pg.yunoHP - dmg, 0)
        } else {
          if (pg.infinityActive) { pg.logs.push('∞ درع-إلبا امتص الهجوم!'); pg.infinityActive=false }
          else { pg.astaHP = Math.max(pg.astaHP - dmg, 0) }
        }
      }
    }

    let winner = null
    if (pg.teamMode) { winner = checkTeamWin(pg) }
    else {
      if (pg.astaHP <= 0) winner = 'yuno'
      if (pg.yunoHP <= 0) winner = 'asta'
    }

    if (winner) {
      pg.logs.push('')
      if (winner === 'asta') {
        pg.logs.push('🟠⚡ انتصر آستا! ⚡🟠')
        pg.logs.push(pg.lichtAlive ? '"آستا وليخت... الثنائي الذي لا يُقهر!"' : '"ساحر السحر المضاد انتصر!"')
      } else {
        pg.logs.push('🔴⚡ انتصر يونو! ⚡🔴')
        pg.logs.push(pg.demonGodAlive ? '"يونو ولوسيوس... لا شيء يقف في وجههما!"' : '"أقوى ساحر لا يُهزم!"')
      }
      pg.phase = 'end'
      const allPlayers = [pg.astaPlayer, pg.yunoPlayer, pg.lichtPlayer, pg.demonGodPlayer].filter(Boolean)
      db[gameKey] = pg
      allPlayers.forEach(p => { if (db[p]) delete db[p] })
      writeDB(db)
      if (pg.teamMode) {
        broadcastTeam(conn, pg)
        conn.sendMessage(m.chat, teamDisplay(pg, myChar), { quoted: m })
      } else {
        const oppChar = myChar === 'asta' ? 'yuno' : 'asta'
        const oppChat = myChar === 'asta' ? pg.yunoChat : pg.astaChat
        conn.sendMessage(oppChat, pvpDisplay(pg, oppChar))
        conn.sendMessage(m.chat, pvpDisplay(pg, myChar), { quoted: m })
      }
      return
    }

    pg.currentTurn = pg.teamMode ? getNextTurn(pg) : (myChar === 'asta' ? 'yuno' : 'asta')
    db[gameKey] = pg
    writeDB(db)

    if (pg.teamMode) {
      broadcastTeam(conn, pg, u)
      return conn.sendMessage(m.chat, teamDisplay(pg, myChar), { quoted: m })
    } else {
      const oppChar = myChar === 'asta' ? 'yuno' : 'asta'
      const oppChat = myChar === 'asta' ? pg.yunoChat : pg.astaChat
      conn.sendMessage(oppChat, pvpDisplay(pg, oppChar))
      return conn.sendMessage(m.chat, pvpDisplay(pg, myChar), { quoted: m })
    }
  }

  // ══ ضد البوت ══
  const isAsta = g.char === 'asta'
  g.round++
  g.logs.push('')

  if (g.phase === 'final') {
    if (isAsta) {
      if (cmd === 'سيف-سحري' && g.angelActive) {
        g.angelHP = 0; g.angelActive = false
        g.logs.push('⚔️ آستا: سيف-سحري!')
        g.logs.push('   يطلق السحر المضاد مباشرة على لوسيوس!')
        g.logs.push('')
        g.logs.push('🐉 لوسيوس يتلقى الضربة مباشرة!')
        g.logs.push('💥 لوسيوس... ينهار ويتحطم!')
        g.logs.push('🔴 يونو: لا!!! لوسيوس!!!')
        g.logs.push('')
        g.logs.push('💜 الآن اكتب .بنفسجي لإطلاق الضربة الأخيرة!')
        db[u] = g; writeDB(db)
        return conn.sendMessage(m.chat, display(g), { quoted: m })
      } else if (cmd === 'بنفسجي' && !g.angelActive) {
        g.logs.push('⚔️ آستا يرفع سيفيه نحو السماء...')
        g.logs.push('⚔️ سيف-سحري في يد... 🗡️ سيف-ساحر في يد أخرى...')
        g.logs.push('💜 يلتقيان في المنتصف...')
        g.logs.push('')
        g.logs.push('💜💜💜 سيف إلبا الأقصى!!! 💜💜💜')
        g.logs.push('   "يمحو كل ما يلمسه من الوجود!"')
        g.logs.push('')
        g.logs.push('🐉 إله الشر... يختفي في الانفجار!')
        g.logs.push('🔴 يونو يتلقى ضربة لا توصف!')
        g.yunoHP = 0; g.demonGodActive = false; g.phase = 'end'
        db[u] = g; writeDB(db)
        setTimeout(() => {
          const fr = readDB(); const g2 = fr[u]; if (!g2) return
          g2.logs.push('')
          g2.logs.push('🔴 يونو: هذا... لا يمكن...')
          g2.logs.push('🔴 يونو يسقط على ركبتيه...')
          g2.logs.push('')
          g2.logs.push('⚔️ آستا: قلت لك يا يونو سأفوز')
          g2.logs.push('🔴 يونو: مت بفخر')
          g2.logs.push('           لقد كنت الأقوى آستا')
          g2.logs.push('')
          g2.logs.push('🏁 ══ انتصر آستا! ══ 🏁')
          fr[u] = g2; writeDB(fr); conn.sendMessage(m.chat, display(g2))
        }, 2000)
        return conn.sendMessage(m.chat, display(g), { quoted: m })
      } else if (cmd === 'سيف-سحري' && !g.angelActive) {
        g.logs.push('💡 لوسيوس مات! اكتب .بنفسجي الآن!')
      } else {
        const fatk = {
          'سيف-ساحر': {d:15, m:'🗡️ آستا: سيف-ساحر!'},
          'مدمج':         {d:22, m:'⚔️ آستا: مدمج!'},
          'درع-إلبا':{d:0,  m:'∞ درع-إلبا!', sp:'infinity'}
        }[cmd] || {d:12, m:'⚔️ آستا: يهاجم!'}
        g.logs.push(fatk.m)
        if (fatk.sp === 'infinity') { g.infinityActive = true }
        else { g.yunoHP = Math.max(g.yunoHP - fatk.d, 0) }
        const bot = botAtk(g); g.logs.push(bot.m)
        if (g.infinityActive) { g.logs.push('∞ درع-إلبا امتص الهجوم!'); g.infinityActive=false }
        else { g.astaHP = Math.max(g.astaHP - bot.d, 0) }
      }
    } else {
      const sa = {
        'ضربة-رياح':   {d:18, m:'🌪️ يونو: ضربة-رياح معززة!'},
        'روح-الرياح': {d:12, m:'💨 روح-الرياح!'},
        'موجة-رياح':   {d:10, m:'🌀 موجة-رياح!'}
      }[cmd] || {d:12, m:'🌪️ يهاجم!'}
      g.logs.push(sa.m); g.astaHP = Math.max(g.astaHP - sa.d, 0)
      if (g.astaHP <= 0) { g.logs.push(''); g.logs.push('⚔️ انتصر يونو في المعركة الأخيرة!'); g.phase='end' }
      else { const bot = botAtk(g); g.logs.push(bot.m); g.yunoHP = Math.max(g.yunoHP - bot.d, 0) }
    }
    db[u] = g; writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  if (g.phase === 'battle') {
    if (cmd === 'تحكم-سحري' || cmd === 'تحكم-رياحي') { g.logs.push('❌ لا يمكن تفعيل المجال! الدماغ تضرر!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    const res = applyPlayerAtk(g, cmd)
    if (res.err) { g.logs.push(res.err); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    g.logs.push(res.msg)

    if (res.sp === 'flash') {
      g.yunoHP = Math.max(g.yunoHP - res.dmg, 0)
      g.demonGodActive = true
      g.phase = 'cutscene'
      g.logs.push('')
      g.logs.push('🐉 إله الشر تظهر من الانفجار!')
      g.logs.push('   تحارب آستا لـ 20 ثانية...')
      db[u] = g; writeDB(db)
      setTimeout(() => {
        const fr = readDB(); const g2 = fr[u]; if (!g2 || g2.phase === 'end') return
        g2.logs.push('')
        g2.logs.push('🔴 يونو: استيقظت!')
        g2.logs.push('           ثلاثة ضد واحد!')
        g2.logs.push('🗡️ يونو: استدعاء... لوسيوس!')
        g2.logs.push('')
        g2.logs.push('⚠️ لوسيوس وإله الشر ويونو يهاجمون معاً!')
        g2.logs.push('💡 اقتل لوسيوس أولاً بـ .سيف-سحري')
        g2.angelActive = true; g2.angelHP = 100
        g2.demonGodActive = false; g2.phase = 'final'
        fr[u] = g2; writeDB(fr)
        conn.sendMessage(m.chat, display(g2))
      }, 20000)
      return conn.sendMessage(m.chat, display(g), { quoted: m })
    } else if (res.sp === 'demonGod') { g.astaHP = Math.max(g.astaHP - res.dmg, 0) }
    else if (res.sp !== 'heal' && res.sp !== 'infinity') {
      if (isAsta) g.yunoHP = Math.max(g.yunoHP - res.dmg, 0)
      else          g.astaHP = Math.max(g.astaHP - res.dmg, 0)
    }

    if (!isAsta && g.astaHP <= 0) { g.logs.push(''); g.logs.push('⚔️ انتصر يونو!'); g.phase='end'; db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    if (!g.demonGodActive) {
      const bot = botAtk(g); g.logs.push(bot.m)
      if (isAsta) {
        if (g.infinityActive) { g.logs.push('∞ درع-إلبا امتص!'); g.logs.push('🔴 يونو: مستحيل!'); g.infinityActive=false }
        else g.astaHP = Math.max(g.astaHP - bot.d, 0)
      } else { g.yunoHP = Math.max(g.yunoHP - bot.d, 0) }
    }
    if (isAsta  && g.astaHP <= 0) { g.logs.push(''); g.logs.push('⚔️ انتصر يونو!'); g.phase='end' }
    if (!isAsta && g.yunoHP <= 0) { g.logs.push(''); g.logs.push('⚔️ انتصر آستا!'); g.phase='end' }
    db[u] = g; writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  if (g.phase === 'started') {
    if (cmd === 'سيف-مدمج') { g.logs.push('⚠️ السيف المدمج في مرحلة القتال المباشر فقط!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    if (cmd === 'تحكم-سحري' || cmd === 'تحكم-رياحي') {
      if (isAsta) {
        if (!g.asta.field) { g.logs.push('❌ نفد التحكم بالسحر لديك!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
        g.asta.field--; g.asta.fieldCount++
        g.logs.push('🌌 آستا: التحكم بالسحر الكامل!'); g.logs.push('   ∞ تفعيل التحكم بالسحر!')
      } else {
        if (!g.yuno.field) { g.logs.push('❌ نفد التحكم بالرياح لديك!'); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
        g.yuno.field--; g.yuno.fieldCount++
        g.logs.push('🔮 يونو: تحكم-رياحي!'); g.logs.push('   🌑 تفعيل التحكم بالرياح!')
      }
      const botHasField = isAsta ? g.yuno.field > 0 : g.asta.field > 0
      if (botHasField) {
        g.logs.push('')
        if (isAsta) { g.logs.push('🔴 يونو: لن تسحبني للتحكم بالسحر!'); g.logs.push('🔮 يونو يفعّل التحكم بالرياح فوراً!'); g.yuno.field--; g.yuno.fieldCount++ }
        else { g.logs.push('⚔️ آستا: لن تحبسني في التحكم بالرياح!'); g.logs.push('🌌 آستا يفعّل التحكم بالسحر فوراً!'); g.asta.field--; g.asta.fieldCount++ }
        g.fieldCollisions++
        const cr = collisionResult(g.fieldCollisions)
        cr.lines.forEach(l => g.logs.push(l))
        if (cr.win === 'yuno') g.astaHP = Math.max(g.astaHP - cr.dmg, 0)
        else                     g.yunoHP = Math.max(g.yunoHP - cr.dmg, 0)
        if (g.fieldCollisions >= 4) {
          g.phase = 'cutscene'; db[u]=g; writeDB(db)
          setTimeout(() => {
            const fr = readDB(); const g2 = fr[u]; if (!g2) return
            g2.logs.push(''); g2.logs.push('🔴 يونو: إله الشر... هروب!!'); g2.logs.push('🐉 إله الشر يحمل يونو بعيداً!')
            g2.logs.push(''); g2.logs.push('🧠💥 تلف شبكة السحر!'); g2.logs.push('⚔️ آستا يسقط على ركبتيه...')
            g2.logs.push(''); g2.logs.push('🔴 يونو: لن يفعل التحكم بالسحر مرة أخرى يا آستا')
            g2.logs.push(''); g2.logs.push('🔴 يونو: لقد أتلفت شبكتك السحرية!')
            g2.logs.push('           تجديدك المستمر أتلف شبكتك!'); g2.logs.push('')
            g2.logs.push('⚡⚡ القتال المباشر الآن! لا مجالات! ⚡⚡')
            g2.brainDamage=true; g2.asta.field=0; g2.yuno.field=0; g2.phase='battle'
            fr[u]=g2; writeDB(fr); conn.sendMessage(m.chat, display(g2))
          }, 2000)
          return conn.sendMessage(m.chat, display(g), { quoted: m })
        }
      } else {
        g.logs.push(isAsta ? '🔴 يونو لا يملك مجالاً!' : '⚔️ آستا لا يملك مجالاً!')
        g.logs.push(isAsta ? '🟠 آستا يفوز بالمجال!' : '🔴 يونو يفوز بالمجال!')
        if (isAsta) g.yunoHP = Math.max(g.yunoHP - 30, 0)
        else          g.astaHP = Math.max(g.astaHP - 30, 0)
      }
      db[u]=g; writeDB(db)
      return conn.sendMessage(m.chat, display(g), { quoted: m })
    }
    const res = applyPlayerAtk(g, cmd)
    if (res.err) { g.logs.push(res.err); db[u]=g; writeDB(db); return conn.sendMessage(m.chat,display(g),{quoted:m}) }
    g.logs.push(res.msg)
    if (res.sp !== 'heal' && res.sp !== 'infinity' && res.sp !== 'demonGod') {
      if (isAsta) g.yunoHP = Math.max(g.yunoHP - res.dmg, 0)
      else          g.astaHP = Math.max(g.astaHP - res.dmg, 0)
    } else if (res.sp === 'demonGod') { g.astaHP = Math.max(g.astaHP - res.dmg, 0) }
    const botHasField2 = isAsta ? g.yuno.field > 0 : g.asta.field > 0
    if (botHasField2 && g.fieldCollisions < 4) {
      g.logs.push('')
      if (isAsta) { g.logs.push('🔴 يونو: "تحكم-رياحي!"'); g.logs.push('🔮 يونو يفعّل مجاله!'); g.yuno.field--; g.yuno.fieldCount++; g.astaHP=Math.max(g.astaHP-18,0); g.logs.push('💥 مجال يونو يضرب آستا!'); g.logs.push('   رد بـ .تحكم-سحري!') }
      else { g.logs.push('⚔️ آستا: "التحكم بالسحر الكامل!"'); g.logs.push('🌌 آستا يفعّل مجاله!'); g.asta.field--; g.asta.fieldCount++; g.yunoHP=Math.max(g.yunoHP-18,0); g.logs.push('💥 مجال آستا يضرب يونو!'); g.logs.push('   رد بـ .تحكم-رياحي!') }
    } else {
      const bot = botAtk(g); g.logs.push(bot.m)
      if (isAsta) { if (g.infinityActive) { g.logs.push('∞ درع-إلبا امتص!'); g.infinityActive=false } else g.astaHP=Math.max(g.astaHP-bot.d,0) }
      else { g.yunoHP=Math.max(g.yunoHP-bot.d,0) }
    }
    db[u]=g; writeDB(db)
    return conn.sendMessage(m.chat, display(g), { quoted: m })
  }

  db[u]=g; writeDB(db)
  return conn.sendMessage(m.chat, display(g), { quoted: m })
}

handler.help    = ['كلوفر']
handler.tags    = ['games']
handler.command = /^(كلوفر|آستا|يونو|ليخت|سيف-سحري|سيف-ساحر|مدمج|تحكم-سحري|ريفرس|سيف-مدمج|درع-إلبا|ضربة-رياح|روح-الرياح|موجة-رياح|إله-الشر|بنفسجي|انهاء|مود|ضربة-ضوء|سحر-خفيف|سيف-ضوئي|كاموي|شريحة|تحكم|دمار|مكيفة|لوسيوس)$/u

export default handler