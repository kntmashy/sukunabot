import { Sticker, StickerTypes } from 'wa-sticker-formatter'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tmpDir = path.join(__dirname, '../tmp')
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

export default {
  name: 'ملصق',
  aliases: ['sticker', 'ستيكر', 'لملصق'],
  tags: ['tools'],
  help: ['ملصق — رد على صورة أو فيديو'],

  ownerOnly: false,
  groupOnly: false,
  adminOnly: false,

  async execute(conn, m) {
    const q = m.quoted || m
    const mime = (q.msg?.mimetype || q.mimetype || '').toLowerCase()

    const isImage = /image\/(jpeg|png|gif|webp)/.test(mime)
    const isVideo = /video\//.test(mime)

    if (!isImage && !isVideo) {
      return m.reply(
        `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
        `*┇⌗╎ꕥ رد على صورة أو فيديو ⌗*\n` +
        `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
      )
    }

    if (isVideo) {
      const seconds = q.msg?.seconds || q.seconds || 0
      if (seconds > 10) {
        return m.reply(
          `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
          `*┇⌗╎ꕥ الفيديو أطول من 10 ثواني ⌗*\n` +
          `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
        )
      }
    }

    await m.react('⏳')

    try {
      const media = await q.download()
      let stickerBuffer

      if (isVideo) {
        const inputPath  = path.join(tmpDir, `input_${Date.now()}.mp4`)
        const outputPath = path.join(tmpDir, `output_${Date.now()}.webp`)

        fs.writeFileSync(inputPath, media)

        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('انتهى الوقت')), 20000)

            ffmpeg(inputPath)
              .outputOptions([
                // حافظ على نسبة الصورة وأضف مساحة شفافة بدل القص
                '-vf', 'scale=256:256:force_original_aspect_ratio=decrease,format=rgba,pad=256:256:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                '-c:v', 'libwebp',
                '-q:v', '30',
                '-loop', '0',
                '-an',
                '-vsync', '0',
                '-fs', '800K'
              ])
              .on('end', () => { clearTimeout(timeout); resolve() })
              .on('error', (err) => { clearTimeout(timeout); reject(err) })
              .save(outputPath)
          })

          stickerBuffer = fs.readFileSync(outputPath)

          if (stickerBuffer.length > 900 * 1024) {
            const reOutputPath = path.join(tmpDir, `re_output_${Date.now()}.webp`)
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('انتهى الوقت')), 15000)
              ffmpeg(outputPath)
                .outputOptions(['-c:v', 'libwebp', '-q:v', '20', '-fs', '700K'])
                .on('end', () => { clearTimeout(timeout); resolve() })
                .on('error', (err) => { clearTimeout(timeout); reject(err) })
                .save(reOutputPath)
            })
            stickerBuffer = fs.readFileSync(reOutputPath)
            try { fs.unlinkSync(reOutputPath) } catch {}
          }

          try { fs.unlinkSync(inputPath) } catch {}
          try { fs.unlinkSync(outputPath) } catch {}

        } catch (ffErr) {
          console.error('FFmpeg error:', ffErr.message)
          const sticker = new Sticker(media, {
            pack: global.stickpack || '⛩️ SUKUNA BOT',
            author: global.stickauth || 'SUKUNA',
            type: StickerTypes.CROPPED,
            quality: 20,
          })
          stickerBuffer = await sticker.toBuffer()
        }

      } else {
        const inputPath  = path.join(tmpDir, `img_input_${Date.now()}.jpg`)
        const outputPath = path.join(tmpDir, `img_output_${Date.now()}.webp`)

        fs.writeFileSync(inputPath, media)

        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('انتهى الوقت')), 10000)

            ffmpeg(inputPath)
              .outputOptions([
                // حافظ على نسبة الصورة وأضف مساحة شفافة بدل القص
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                '-c:v', 'libwebp',
                '-q:v', '50',
                '-fs', '900K'
              ])
              .on('end', () => { clearTimeout(timeout); resolve() })
              .on('error', (err) => { clearTimeout(timeout); reject(err) })
              .save(outputPath)
          })

          stickerBuffer = fs.readFileSync(outputPath)
          try { fs.unlinkSync(inputPath) } catch {}
          try { fs.unlinkSync(outputPath) } catch {}

        } catch (ffErr) {
          console.error('FFmpeg image error:', ffErr.message)
          const sticker = new Sticker(media, {
            pack: global.stickpack || '⛩️ SUKUNA BOT',
            author: global.stickauth || 'SUKUNA',
            type: StickerTypes.FULL,
            quality: 30,
          })
          stickerBuffer = await sticker.toBuffer()
        }
      }

      if (stickerBuffer.length > 900 * 1024) {
        try {
          const finalSticker = new Sticker(stickerBuffer, {
            pack: global.stickpack || '⛩️ SUKUNA BOT',
            author: global.stickauth || 'SUKUNA',
            type: isVideo ? StickerTypes.CROPPED : StickerTypes.FULL,
            quality: 10,
          })
          stickerBuffer = await finalSticker.toBuffer()
        } catch (e) {
          console.error('فشل الضغط الإضافي:', e)
        }
      }

      await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
      await m.react('✅')

    } catch (e) {
      console.error('[ملصق Error]', e)
      await m.react('❌')

      try {
        const media2 = await q.download()
        const sticker = new Sticker(media2, {
          pack: global.stickpack || '⛩️ SUKUNA BOT',
          author: global.stickauth || 'SUKUNA',
          type: isVideo ? StickerTypes.CROPPED : StickerTypes.FULL,
          quality: 10,
        })
        const stickerBuffer = await sticker.toBuffer()
        await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
        await m.react('✅')
      } catch (e2) {
        return m.reply(
          `*╮═≼『⛩️┃خطأ┃⛩️』≽═╭*\n` +
          `*┇⌗╎❌ فشل التحويل: ${e.message} ⌗*\n` +
          `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
        )
      }
    }
  }
}