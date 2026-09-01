import fs from 'fs'

const DB = './shinjuku.json'

const readDB = () => {
  if (!fs.existsSync(DB)) return {}
  return JSON.parse(fs.readFileSync(DB))
}

const writeDB = (data) => {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2))
}

const bar = (hp) =>
  '█'.repeat(Math.floor(hp / 5)) +
  '░'.repeat(20 - Math.floor(hp / 5))

const newGame = () => ({
  phase: 'battle',
  round: 0,

  gojoHP: 100,
  sukunaHP: 100,
  tojiHP: 80,
  mahoragaHP: 120,
  yutaHP: 100,
  megumiHP: 90,
  nanamiHP: 95,
  itadoriHP: 100,

  currentTurn: 'gojo',

  alive: {
    gojo: true,
    sukuna: true,
    toji: false,
    mahoraga: false,
    yuta: false,
    megumi: false,
    nanami: false,
    itadori: false
  },

  logs: []
})

const getNextTurn = (g) => {
  const order = ['gojo','toji','yuta','nanami','sukuna','mahoraga','megumi','itadori']
  const alive = order.filter(c => g.alive[c])
  let i = alive.indexOf(g.currentTurn)
  return alive[(i + 1) % alive.length]
}

const attack = (g, char, cmd) => {
  let dmg = 0
  let msg = ''

  // 🔵 غوجو
  if (char === 'gojo') {
    if (cmd === 'أزرق') { dmg=15; msg='🔵 غوجو: أزرق!' }
    if (cmd === 'أحمر') { dmg=15; msg='🔴 غوجو: أحمر!' }
    if (cmd === 'بنفسجي') { dmg=35; msg='💜 غوجو: هولو بيربل!!!' }
  }

  // 🔴 سوكونا
  if (char === 'sukuna') {
    if (cmd === 'تفكيك') { dmg=15; msg='🔪 سوكونا: تفكيك!' }
    if (cmd === 'تقطيع') { dmg=12; msg='✂️ سوكونا: تقطيع!' }
  }

  // ⚪ توجي
  if (char === 'toji') {
    if (cmd === 'رمح') { dmg=30; msg='🔱 توجي: رمح السماء!' }
    if (cmd === 'يد') { dmg=20; msg='👊 توجي: لكمة!' }
  }

  // 🐉 ماهوراجا
  if (char === 'mahoraga') {
    if (cmd === 'شريحة') { dmg=25; msg='🐉 ماهوراجا: شريحة!' }
  }

  // 🟣 يوتا
  if (char === 'yuta') {
    if (cmd === 'سيف') { dmg=20; msg='🟣 يوتا: ضربة سيف!' }
    if (cmd === 'ريكا') { dmg=35; msg='👻 ريكا تهاجم!' }
  }

  // 🟢 ميجومي
  if (char === 'megumi') {
    if (cmd === 'كلاب') { dmg=18; msg='🐺 الكلاب تهاجم!' }
    if (cmd === 'نوي') { dmg=25; msg='⚡ نوي!' }
  }

  // 🟡 نانامي
  if (char === 'nanami') {
    if (cmd === 'نسبة') { dmg=20; msg='📏 نانامي: ضربة النسبة!' }
  }

  // 🔴 إيتادوري
  if (char === 'itadori') {
    if (cmd === 'لكمة') { dmg=18; msg='👊 إيتادوري!' }
    if (cmd === 'بلاك') { dmg=40; msg='⚫ بلاك فلاش!!!' }
  }

  return { dmg, msg }
}

const applyDmg = (g, attacker, dmg) => {
  const enemyTeam = ['gojo','toji','yuta','nanami']
  const targetTeam = enemyTeam.includes(attacker)
    ? ['sukuna','mahoraga','megumi','itadori']
    : ['gojo','toji','yuta','nanami']

  for (let t of targetTeam) {
    if (g.alive[t]) {
      g[t + 'HP'] -= dmg
      if (g[t + 'HP'] <= 0) {
        g.alive[t] = false
        g.logs.push(`💀 ${t} مات!`)
      }
      return
    }
  }
}

const display = (g) => {
  return `
🎮 الجولة ${g.round}

🔵 فريق غوجو:
غوجو ${bar(g.gojoHP)}
توجي ${g.alive.toji ? bar(g.tojiHP) : 'ميت'}
يوتا ${g.alive.yuta ? bar(g.yutaHP) : 'ميت'}
نانامي ${g.alive.nanami ? bar(g.nanamiHP) : 'ميت'}

🔴 فريق سوكونا:
سوكونا ${bar(g.sukunaHP)}
ماهوراجا ${g.alive.mahoraga ? bar(g.mahoragaHP) : 'ميت'}
ميجومي ${g.alive.megumi ? bar(g.megumiHP) : 'ميت'}
إيتادوري ${g.alive.itadori ? bar(g.itadoriHP) : 'ميت'}

📜:
${g.logs.slice(-6).join('\n')}

🎯 الدور: ${g.currentTurn}
`
}

const handler = async (m, { command }) => {
  const db = readDB()
  const u = m.sender

  if (command === 'شينجوكو') {
    db[u] = newGame()
    writeDB(db)
    return m.reply('🔥 بدأت المعركة!')
  }

  if (!db[u]) return m.reply('ابدأ بـ .شينجوكو')

  const g = db[u]

  const cmds = ['أزرق','أحمر','بنفسجي','تفكيك','تقطيع','رمح','يد','شريحة','سيف','ريكا','كلاب','نوي','نسبة','لكمة','بلاك']

  if (!cmds.includes(command)) return

  if (!g.alive[g.currentTurn]) {
    g.currentTurn = getNextTurn(g)
  }

  const res = attack(g, g.currentTurn, command)

  if (!res.msg) return

  g.round++
  g.logs.push(res.msg)

  applyDmg(g, g.currentTurn, res.dmg)

  g.currentTurn = getNextTurn(g)

  db[u] = g
  writeDB(db)

  return m.reply(display(g))
}

handler.command = /^(شينجوكو|أزرق|أحمر|بنفسجي|تفكيك|تقطيع|رمح|يد|شريحة|سيف|ريكا|كلاب|نوي|نسبة|لكمة|بلاك)$/i

export default handler