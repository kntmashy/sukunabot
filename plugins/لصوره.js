import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import sharp from 'sharp'

const execAsync = promisify(exec)

let handler = async (m, { conn, command }) => {
  const quoted = m.quoted
  if (!quoted) return m.reply('⚠️ ريبلاي على ستيكر!')

  const mime = quoted.mimetype || ''
  const isSticker = mime === 'image/webp' || quoted.mediaType === 'sticker'
  if (!isSticker) return m.reply('⚠️ ريبلاي على ستيكر فقط!')

  await m.react('⏳')

  const buffer = await quoted.download()
  const ts     = Date.now()
  const tmpIn  = join(tmpdir(), `in_${ts}.webp`)

  try {
    writeFileSync(tmpIn, buffer)

    if (command === 'لصوره') {
      // ✅ ستيكر صورة → PNG باستخدام sharp
      const img = await sharp(buffer).png().toBuffer()
      await conn.sendMessage(m.chat, {
        image: img,
        caption: '🖼️ تم تحويل الستيكر لصورة!'
      }, { quoted: m })

    } else if (command === 'لفيديو') {
      // ✅ ستيكر متحرك → فريمات PNG → MP4
      const metadata = await sharp(buffer, { animated: true }).metadata()

      if (!metadata.pages || metadata.pages <= 1) {
        return m.reply('⚠️ الستيكر ده مش متحرك!')
      }

      const pages    = metadata.pages
      const delay    = metadata.delay?.[0] || 100
      const fps      = Math.round(1000 / delay)
      const pngFiles = []

      // استخراج كل فريم
      for (let i = 0; i < pages; i++) {
        const framePath = join(tmpdir(), `frame_${ts}_${String(i).padStart(4, '0')}.png`)
        await sharp(buffer, { animated: false, page: i }).png().toFile(framePath)
        pngFiles.push(framePath)
      }

      const tmpOut       = join(tmpdir(), `out_${ts}.mp4`)
      const framePattern = join(tmpdir(), `frame_${ts}_%04d.png`)

      // تجميع الفريمات لـ MP4
      await execAsync(
        `ffmpeg -y -framerate ${fps} -i "${framePattern}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${tmpOut}"`
      )

      const vid = readFileSync(tmpOut)
      await conn.sendMessage(m.chat, {
        video: vid,
        caption: '🎥 تم تحويل الستيكر لفيديو!'
      }, { quoted: m })

      for (const f of pngFiles) { try { unlinkSync(f) } catch {} }
      try { unlinkSync(tmpOut) } catch {}
    }

    await m.react('✅')

  } catch (e) {
    console.error('[StickerConverter]', e.message)
    await m.react('❌')
    m.reply(`❌ خطأ: ${e.message}`)
  } finally {
    try { unlinkSync(tmpIn) } catch {}
  }
}

handler.help = ['لصوره', 'لفيديو']
handler.tags = ['tools']
handler.command = /^(لصوره|لفيديو)$/i

export default handler