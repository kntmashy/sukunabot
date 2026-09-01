// plugin: _zipplugins.js
// بيعمل zip لكل الـ plugins الفاشلة ويبعتها

import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import archiver from 'archiver'

const handler = async (m, { conn, isOwner }) => {
  if (!isOwner) return

  await m.reply('⏳ جاري فحص الـ plugins...')

  const pluginDir = path.join(process.cwd(), 'plugins')
  const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'))

  let brokenFiles = []

  for (const file of files) {
    try {
      const url = pathToFileURL(path.join(pluginDir, file)).href + `?zip=${Date.now()}`
      await import(url)
    } catch (e) {
      brokenFiles.push({ file, error: e.message })
    }
  }

  if (!brokenFiles.length) {
    return m.reply(`✅ كل الـ plugins شغالة! (${files.length} ملف)`)
  }

  await m.reply(`🔍 لقيت *${brokenFiles.length}* plugin فاشل، جاري عمل ZIP...`)

  // مسار ملف الـ zip
  const zipPath = path.join(process.cwd(), 'tmp', `broken_plugins_${Date.now()}.zip`)
  
  // تأكد إن فولدر tmp موجود
  if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) {
    fs.mkdirSync(path.join(process.cwd(), 'tmp'), { recursive: true })
  }

  // إنشاء ملف نصي بقائمة الأخطاء
  const errorLog = brokenFiles.map(({ file, error }) => `❌ ${file}\n┗ ${error}`).join('\n\n')
  const logPath = path.join(process.cwd(), 'tmp', 'errors.txt')
  fs.writeFileSync(logPath, errorLog)

  // عمل الـ ZIP
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', resolve)
    archive.on('error', reject)
    archive.pipe(output)

    // ضيف كل plugin فاشل في الـ zip
    for (const { file } of brokenFiles) {
      const filePath = path.join(pluginDir, file)
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file })
      }
    }

    // ضيف ملف الأخطاء
    archive.file(logPath, { name: 'errors.txt' })

    archive.finalize()
  })

  // ابعت الـ ZIP
  const zipBuffer = fs.readFileSync(zipPath)
  await conn.sendMessage(m.chat, {
    document: zipBuffer,
    mimetype: 'application/zip',
    fileName: `broken_plugins.zip`,
    caption: `📦 *Broken Plugins ZIP*\n\n✅ الملفات: *${brokenFiles.length}* plugin\n📄 ملف \`errors.txt\` بداخله كل الأخطاء`
  }, { quoted: m })

  // حذف الملفات المؤقتة
  try { fs.unlinkSync(zipPath) } catch {}
  try { fs.unlinkSync(logPath) } catch {}
}

handler.command = /^(zipplugins|زيب)$/i
handler.tags = ['owner']
handler.owner = true
export default handler