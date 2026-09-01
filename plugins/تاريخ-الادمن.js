/**
 * plugins/تاريخ-الادمن.js
 * يسجل كل عمليات تعيين/إزالة الأدمن في الجروب
 * ويعرضها بالأمر .تاريخ-الادمن (للأدمنية فقط)
 */

import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'adminHistory.json')

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function saveDB(db) {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)) } catch (e) {
    console.error('[AdminHistory] save fail:', e.message)
  }
}

// ══════════════════════════════════════════════════
//  مستمع لتحديثات الأعضاء (تعيين/إزالة أدمن)
// ══════════════════════════════════════════════════
function attachListener(conn) {
  if (!conn || conn._adminHistoryAttached) return
  conn._adminHistoryAttached = true

  conn.ev.on('group-participants.update', async (update) => {
    try {
      const { id: groupId, participants, action, author } = update
      if (action !== 'promote' && action !== 'demote') return

      const db = loadDB()
      if (!db[groupId]) db[groupId] = []

      for (const p of participants) {
        db[groupId].push({
          target: p,
          action,
          by: author || null,
          time: Date.now()
        })
      }

      if (db[groupId].length > 200) db[groupId] = db[groupId].slice(-200)
      saveDB(db)
    } catch (e) {
      console.error('[AdminHistory] listener error:', e.message)
    }
  })
}

let _lastConn = null
setInterval(() => {
  if (global.conn && global.conn !== _lastConn) {
    attachListener(global.conn)
    _lastConn = global.conn
  }
}, 5000)

if (global.conn) attachListener(global.conn)

// ══════════════════════════════════════════════════
//  الأمر - للأدمنية فقط
// ══════════════════════════════════════════════════
const handler = async (m, { conn, isAdmin, isROwner }) => {
  // ✅ منع غير الأدمنية من استخدام الأمر
  if (!isAdmin && !isROwner) {
    return m.reply(`╔═══━━━══━━━❪🚫❫━━━══━━━═══╗
║  ❪⛔️❫ *هَذَا الأَمْرُ*        ║
║  ❪👑❫ *لِلْمُشْرِفِينَ فَقَط* ║
╚═══━━━══━━━❪🚫❫━━━══━━━═══╝

╔═══━━━══━━━❪🩸❫━━━══━━━═══╗
║  ❪👹❫ *أَنْتَ لَسْتَ مُشْرِفًا* ║
║  ❪🔥❫ *لَا تَقْرَبْ مِمَّا لَا يَخُصُّكَ* ║
╚═══━━━══━━━❪🩸❫━━━══━━━═══╝

╔═══━━━══━━━❪⚡️❫━━━══━━━═══╗
║  ❪🔥❫ *𝑺𝑼𝑲𝑼𝑵𝑨 𝑩𝑶𝑻*        ║
║  ❪👹❫ *𝑲𝑰𝑵𝑮 𝑶𝑭 𝑪𝑼𝑹𝑺𝑬𝑺*     ║
╚═══━━━══━━━❪⚡️❫━━━══━━━═══╝`)
  }

  if (!m.isGroup) return m.reply(`╔═══━━━══━━━❪🚫❫━━━══━━━═══╗
║  ❪⛔️❫ *هَذَا الأَمْرُ*        ║
║  ❪👥❫ *لِلْمَجْمُوعَاتِ فَقَط* ║
╚═══━━━══━━━❪🚫❫━━━══━━━═══╝

╔═══━━━══━━━❪⚡️❫━━━══━━━═══╗
║  ❪🔥❫ *𝑺𝑼𝑲𝑼𝑵𝑨 𝑩𝑶𝑻*        ║
║  ❪👹❫ *𝑲𝑰𝑵𝑮 𝑶𝑭 𝑪𝑼𝑹𝑺𝑬𝑺*     ║
╚═══━━━══━━━❪⚡️❫━━━══━━━═══╝`)

  const groupId = m.chat
  const db = loadDB()
  const history = db[groupId] || []

  if (!history.length) {
    return m.reply(`╔═══━━━══━━━❪📭❫━━━══━━━═══╗
║  ❪📭❫ *لَا يُوجَدُ سِجِلٌّ*    ║
║  ❪📜❫ *بَعْدُ لِهَذَا الجَّرُوبِ* ║
╚═══━━━══━━━❪📭❫━━━══━━━═══╝

╔═══━━━══━━━❪🩸❫━━━══━━━═══╗
║  ❪👹❫ *السِّجِلُ يَبْدَأُ*      ║
║  ❪🔥❫ *مِنْ لَحْظَةِ تَشْغِيلِ هَذَا الأَمْرِ* ║
╚═══━━━══━━━❪🩸❫━━━══━━━═══╝

╔═══━━━══━━━❪⚡️❫━━━══━━━═══╗
║  ❪🔥❫ *𝑺𝑼𝑲𝑼𝑵𝑨 𝑩𝑶𝑻*        ║
║  ❪👹❫ *𝑲𝑰𝑵𝑮 𝑶𝑭 𝑪𝑼𝑹𝑺𝑬𝑺*     ║
╚═══━━━══━━━❪⚡️❫━━━══━━━═══╝`)
  }

  const recent = history.slice(-30).reverse()
  const mentions = new Set()

  const lines = recent.map(entry => {
    const date = new Date(entry.time)
    const dateStr = date.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
    const actionText = entry.action === 'promote' ? '✅ *تَمَّ تَعْيِينُهُ أَدْمِن*' : '❌ *تَمَّ إِزَالَتُهُ مِنَ الأَدْمِن*'

    mentions.add(entry.target)
    let byText = '❓ غَيْرُ مَعْرُوف (تَحْدِيثٌ تِلْقَائِيٌّ مِنْ وَاتسَاب)'
    if (entry.by) {
      mentions.add(entry.by)
      byText = `@${entry.by.split('@')[0]}`
    }

    return `┏━━━━━━━━━━━━━━━━━━━┓
${actionText}
┣━━━━━━━━━━━━━━━━━━━┫
👤 *الشَّخْصُ:* @${entry.target.split('@')[0]}
👮 *بِوَاسِطَةِ:* ${byText}
🕐 *الوَقْتُ:* ${dateStr}
┗━━━━━━━━━━━━━━━━━━━┛`
  })

  return conn.sendMessage(groupId, {
    text: `╔═══━━━══━━━❪👑❫━━━══━━━═══╗
║  ❪📜❫ *𝑨𝑫𝑴𝑰𝑵𝑺*              ║
║  ❪⚔️❫ *سِجِلُّ التَّعْدِيلَات*   ║
╚═══━━━══━━━❪👑❫━━━══━━━═══╝

╔═══━━━══━━━❪🩸❫━━━══━━━═══╗
║  ❪👑❫ *لِلْمُشْرِفِينَ فَقَط* ║
║  ──━━━══━━━──                  ║
║  ❪📊❫ *آخِر ${recent.length} تَعْدِيل* ║
║  ❪⏳❫ *مِنْذُ تَشْغِيلِ النِّظَامِ* ║
╚═══━━━══━━━❪🩸❫━━━══━━━═══╝

${lines.join('\n\n')}

╔═══━━━══━━━❪👑❫━━━══━━━═══╗
║  ❪🩸❫ *اَلْقُوَّةُ لَا تَأْتِي* ║
║  ❪🔥❫ *إِلَّا بِالسَّيْطَرَةِ*  ║
╚═══━━━══━━━❪👑❫━━━══━━━═══╝

╔═══━━━══━━━❪⚡️❫━━━══━━━═══╗
║  ❪🔥❫ *𝑺𝑼𝑲𝑼𝑵𝑨 𝑩𝑶𝑻*        ║
║  ❪👹❫ *𝑲𝑰𝑵𝑮 𝑶𝑭 𝑪𝑼𝑹𝑺𝑬𝑺*     ║
╚═══━━━══━━━❪⚡️❫━━━══━━━═══╝`,
    mentions: [...mentions]
  }, { quoted: m })
}

handler.help    = ['تاريخ-الادمن']
handler.tags    = ['group']
handler.command = /^(تاريخ-الادمن|تاريخ_الادمن|سجل-الادمن|adminhistory)$/i

export default handler