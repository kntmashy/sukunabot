// plugins/لصوت.js
/**
 * 🎵 SUKUNA Audio Extractor - Simple CMD Edition
 * 
 * ميزات:
 * - استخدام FFmpeg مباشرة عبر CMD ✅
 * - بدون مكاتب إضافية ✅
 * - logs نظيفة ✅
 * - سريع وفعال ✅
 * 
 * ༒⫷ 𝙍𝘼𝙂𝙉𝘼 • 𝘾𝙍𝙄𝙈𝙎𝙊𝙉 ⫸༒: ⚜️ CRIMSON VOID ⚜️
 */

import { writeFileSync, readFileSync, unlinkSync, existsSync, statSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

// ════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION
// ════════════════════════════════════════════════════════

const CONFIG = {
  MAX_FILE_SIZE_MB: 500,
  AUDIO_BITRATE: '192k',
  AUDIO_SAMPLE_RATE: 44100,
  TEMP_DIR: tmpdir()
}

// ════════════════════════════════════════════════════════
// 🎵 EXTRACT AUDIO - SIMPLE CMD
// ════════════════════════════════════════════════════════

async function extractAudioSimple(inputPath, outputPath) {
  try {
    // أمر FFmpeg بسيط ونظيف
    const command = `ffmpeg -i "${inputPath}" -vn -acodec libmp3lame -b:a ${CONFIG.AUDIO_BITRATE} -ar ${CONFIG.AUDIO_SAMPLE_RATE} -loglevel error -y "${outputPath}"`
    
    // تنفيذ الأمر (بدون output ما عدا الأخطاء)
    await execPromise(command, {
      maxBuffer: 50 * 1024 * 1024,
      windowsHide: true // إخفاء نافذة CMD
    })
    
    if (!existsSync(outputPath)) {
      throw new Error('فشل إنشاء ملف الصوت')
    }
    
    return outputPath
    
  } catch (error) {
    throw new Error(`فشل الاستخراج: ${error.message}`)
  }
}

// ════════════════════════════════════════════════════════
// 📊 GET FILE INFO
// ════════════════════════════════════════════════════════

function getFileSizeMB(filePath) {
  const stats = statSync(filePath)
  return stats.size / (1024 * 1024)
}

async function getAudioDuration(filePath) {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    const { stdout } = await execPromise(command, { windowsHide: true })
    return parseFloat(stdout.trim()) || 0
  } catch {
    return 0
  }
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ════════════════════════════════════════════════════════
// 🧹 CLEANUP
// ════════════════════════════════════════════════════════

function cleanup(...files) {
  for (const file of files) {
    try {
      if (file && existsSync(file)) {
        unlinkSync(file)
      }
    } catch {}
  }
}

// ════════════════════════════════════════════════════════
// 🎬 MAIN HANDLER
// ════════════════════════════════════════════════════════

let handler = async (m, { conn, usedPrefix, command }) => {
  
  // التحقق من الـ Reply
  if (!m.quoted) {
    return m.reply(`❌ *عمل رد على فيديو!*\n\n📝 *الطريقة:*\n1️⃣ اعمل رد على فيديو\n2️⃣ اكتب: ${usedPrefix}${command}\n\n🎵 *مثال:*\n[رد على فيديو] → ${usedPrefix}لصوت`)
  }
  
  // التحقق من نوع الرسالة
  const quotedMsg = m.quoted
  if (!quotedMsg.mimetype || !quotedMsg.mimetype.startsWith('video/')) {
    return m.reply('❌ *الرد يجب يكون على فيديو!*\n\n🎥 اعمل رد على فيديو وحاول تاني')
  }
  
  let tempVideo = null
  let tempAudio = null
  
  try {
    // رسالة الانتظار
    const wait = await m.reply('🎵 *جاري استخراج الصوت...*\n\n⏳ انتظر قليلاً...')
    
    // تجهيز المسارات
    const timestamp = Date.now()
    tempVideo = join(CONFIG.TEMP_DIR, `vid_${timestamp}.mp4`)
    tempAudio = join(CONFIG.TEMP_DIR, `aud_${timestamp}.mp3`)
    
    // تحميل الفيديو
    const videoBuffer = await quotedMsg.download()
    if (!videoBuffer) {
      throw new Error('فشل تحميل الفيديو')
    }
    
    // حفظ الفيديو
    writeFileSync(tempVideo, videoBuffer)
    
    const videoSize = getFileSizeMB(tempVideo)
    
    // التحقق من الحجم
    if (videoSize > CONFIG.MAX_FILE_SIZE_MB) {
      throw new Error(`الفيديو كبير جداً (${videoSize.toFixed(1)}MB). الحد الأقصى ${CONFIG.MAX_FILE_SIZE_MB}MB`)
    }
    
    // استخراج الصوت (بدون logs)
    await extractAudioSimple(tempVideo, tempAudio)
    
    // معلومات الصوت
    const audioSize = getFileSizeMB(tempAudio)
    const duration = await getAudioDuration(tempAudio)
    const durationStr = formatDuration(duration)
    
    // قراءة الصوت
    const audioBuffer = readFileSync(tempAudio)
    
    // إرسال الصوت
    await conn.sendMessage(m.chat, {
      audio: audioBuffer,
      mimetype: 'audio/mpeg',
      fileName: `SUKUNA_Audio_${timestamp}.mp3`,
      ptt: false
    }, { quoted: m })
    
    // رسالة النجاح
    const success = `╭─━━━〔 🎵 Audio 〕━━━─╮
✅ *تم الاستخراج بنجاح*

📊 *المعلومات:*
• الحجم: ${audioSize.toFixed(2)} MB
• المدة: ${durationStr}
• الجودة: ${CONFIG.AUDIO_BITRATE}

⚡ *SUKUNA Extractor*
╰─━━━〔 ✨ 〕━━━─╯`
    
    await m.reply(success)
    
  } catch (error) {
    let errorMsg = '❌ *فشل استخراج الصوت*\n\n'
    
    if (error.message.includes('فشل تحميل')) {
      errorMsg += '📥 فشل تحميل الفيديو\n\n💡 حاول مرة أخرى'
    } else if (error.message.includes('كبير جداً')) {
      errorMsg += `📊 ${error.message}\n\n💡 جرب فيديو أصغر`
    } else if (error.message.includes('فشل الاستخراج')) {
      errorMsg += '🎵 الفيديو ليس فيه صوت\n\n💡 تأكد أن الفيديو فيه صوت'
    } else if (error.message.includes('ffmpeg') || error.message.includes('not found')) {
      errorMsg += '🔧 FFmpeg غير مثبت\n\n💡 ثبت FFmpeg أولاً:\n```npm install @ffmpeg-installer/ffmpeg```'
    } else {
      errorMsg += `📝 ${error.message}\n\n💡 حاول مرة أخرى`
    }
    
    await m.reply(errorMsg)
    
  } finally {
    // تنظيف الملفات
    cleanup(tempVideo, tempAudio)
  }
}

// ════════════════════════════════════════════════════════
// 📋 PLUGIN INFO
// ════════════════════════════════════════════════════════

handler.help = ['لصوت', 'toaudio', 'tomp3']
handler.tags = ['tools']
handler.command = /^(لصوت|toaudio|tomp3|audio|صوت)$/i
handler.limit = true

export default handler