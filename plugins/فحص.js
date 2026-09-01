// plugin: _checkplugins.js
// بيكتشف كل الـ plugins الفاشلة ويبعتها للمالك

const handler = async (m, { conn, isOwner }) => {
  if (!isOwner) return

  const fs = await import('fs')
  const path = await import('path')
  const { fileURLToPath, pathToFileURL } = await import('url')

  const pluginDir = path.default.join(process.cwd(), 'plugins')
  const files = fs.default.readdirSync(pluginDir).filter(f => f.endsWith('.js'))

  let broken = []

  for (const file of files) {
    try {
      const url = pathToFileURL(path.default.join(pluginDir, file)).href + `?check=${Date.now()}`
      await import(url)
    } catch (e) {
      broken.push(`❌ *${file}*\n┗ ${e.message}`)
    }
  }

  if (!broken.length) {
    return m.reply(`✅ كل الـ plugins شغالة تمام! (${files.length} ملف)`)
  }

  // قسم الرسايل لو كتير
  const chunkSize = 20
  for (let i = 0; i < broken.length; i += chunkSize) {
    const chunk = broken.slice(i, i + chunkSize)
    const msg = `*🔍 Plugins فاشلة (${i + 1}-${Math.min(i + chunkSize, broken.length)} من ${broken.length}):*\n\n` + chunk.join('\n\n')
    await conn.sendMessage(m.chat, { text: msg }, { quoted: m })
    await new Promise(r => setTimeout(r, 1000))
  }
}

handler.command = /^(checkplugins|فحص)$/i
handler.tags = ['owner']
handler.owner = true
export default handler