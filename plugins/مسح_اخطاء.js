let handler = async (m, { conn }) => {
  // ✅ بس أرقام المالك
  const allowed   = ['201036547166', '201016855501']
  const senderNum = m.sender.replace('@s.whatsapp.net', '').replace(/:[0-9]+/, '')
  if (!allowed.includes(senderNum)) return

  await m.react('⏳')

  const { readdirSync, unlinkSync } = await import('fs')
  const { join }                    = await import('path')
  const { pathToFileURL }           = await import('url')

  const pluginDir = './plugins'
  const files     = readdirSync(pluginDir).filter(f => f.endsWith('.js'))

  let deleted = []
  let kept    = []

  for (const file of files) {
    try {
      const url = pathToFileURL(join(pluginDir, file)).href + `?t=${Date.now()}`
      await import(url)
      kept.push(file)
    } catch (e) {
      try {
        unlinkSync(join(pluginDir, file))
        deleted.push(file)
      } catch {}
    }
  }

  await m.react('✅')
  await m.reply(`╭─「 🧹 تنظيف البلجنات 」
│
│  ✅ *تم حذف:* ${deleted.length} بلجن فاشل
│  📦 *تبقى:* ${kept.length} بلجن شغال
│
${deleted.length > 0 ? deleted.map(f => `│  🗑️ ${f}`).join('\n') + '\n' : '│  ✨ مفيش بلجنات فاشلة!\n'}╰──────────────`)
}

handler.help = ['مسح_اخطاء']
handler.tags = ['owner']
handler.command = ['مسح_اخطاء']

export default handler