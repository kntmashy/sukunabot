import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029VbBzSYd0AgW4AHD9j63c';
const lastSentSong = new Map();

const getAudioUrl = async (songName, cacheKey) => {
  const lastAudioUrl = lastSentSong.get(cacheKey)

  // ━━━ tikwm بعدة طرق ━━━
  const tikwmApis = [
    // طريقة 1 - POST عادي
    async () => {
      const r = await axios.post('https://www.tikwm.com/api/feed/search', {
        keywords: `${songName} full song`, count: 20, cursor: 0, HD: 1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.tikwm.com/',
          'Origin': 'https://www.tikwm.com'
        },
        timeout: 15000
      })
      const videos = r.data?.data?.videos
      if (!videos?.length) throw new Error('no results')
      for (const v of videos) {
        const url = v.music || v.play
        if (url && url !== lastAudioUrl) { lastSentSong.set(cacheKey, url); return url }
      }
      const url = videos[0].music || videos[0].play
      lastSentSong.set(cacheKey, url)
      return url
    },
    // طريقة 2 - GET
    async () => {
      const r = await axios.get(
        `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(songName + ' music')}&count=20&cursor=0`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.tikwm.com/' },
          timeout: 15000
        }
      )
      const videos = r.data?.data?.videos
      if (!videos?.length) throw new Error('no results')
      for (const v of videos) {
        const url = v.music || v.play
        if (url && url !== lastAudioUrl) { lastSentSong.set(cacheKey, url); return url }
      }
      const url = videos[0].music || videos[0].play
      lastSentSong.set(cacheKey, url)
      return url
    },
    // طريقة 3 - بدون full song
    async () => {
      const r = await axios.post('https://www.tikwm.com/api/feed/search', {
        keywords: songName, count: 30, cursor: 0, HD: 1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        },
        timeout: 15000
      })
      const videos = r.data?.data?.videos
      if (!videos?.length) throw new Error('no results')
      // فلتر الفيديوهات اللي فيها موسيقى
      const musicVideos = videos.filter(v => v.music && v.music !== lastAudioUrl)
      if (musicVideos.length) {
        const url = musicVideos[0].music
        lastSentSong.set(cacheKey, url)
        return url
      }
      const url = videos[0].music || videos[0].play
      lastSentSong.set(cacheKey, url)
      return url
    }
  ]

  // جرب tikwm أولاً
  for (let i = 0; i < tikwmApis.length; i++) {
    try {
      console.log(`[شغل] tikwm طريقة ${i+1}...`)
      const url = await tikwmApis[i]()
      if (url) { console.log(`[شغل] ✅ tikwm ${i+1}`); return url }
    } catch (e) {
      console.log(`[شغل] ❌ tikwm ${i+1}: ${e.message}`)
    }
  }

  // fallback - يوتيوب
  console.log('[شغل] جاري تجربة يوتيوب...')
  try {
    const yts = await axios.get(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(songName + ' audio')}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
    )
    const match = yts.data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/)
    if (!match) throw new Error('no video')
    const ytUrl = `https://www.youtube.com/watch?v=${match[1]}`

    const r1 = await axios.get(
      `https://loader.to/ajax/download.php?format=mp3&url=${encodeURIComponent(ytUrl)}`,
      { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!r1.data?.id) throw new Error('no id')

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const r2 = await axios.get(`https://loader.to/ajax/progress.php?id=${r1.data.id}`, { timeout: 10000 })
      if (r2.data?.download_url) return r2.data.download_url
    }
  } catch (e) {
    console.log('[شغل] ❌ يوتيوب:', e.message)
  }

  return null
}

const handler = async (m, { conn, text }) => {
  const jid = m.chat
  const songName = (text || '').trim()

  if (!songName) {
    return m.reply(`╭━━━〔 ❌ 𝑬𝑹𝑹𝑶𝑹 〕━━━⬣\n┃ ✦ اكتب اسم الأغنية\n┃ ✦ مثال ↬ .شغل mockingbird\n╰━━━━━━━━━━━━━━⬣\n\n> 𖣂 SUKUNA BOT 𖣂`)
  }

  await conn.sendMessage(jid, { react: { text: '🎧', key: m.key } })
  await m.reply(`╭━━━〔 🔍 𝑺𝑬𝑨𝑹𝑪𝑯 〕━━━⬣\n┃ ✦ 𝑺𝒐𝒏𝒈 ↬ ${songName}\n┃ ✦ 𝑺𝒕𝒂𝒕𝒖𝒔 ↬ Searching...\n╰━━━━━━━━━━━━━━⬣`)

  const cacheKey = `${jid}_${songName.toLowerCase()}`
  const audioUrl = await getAudioUrl(songName, cacheKey)

  if (!audioUrl) {
    return m.reply(`╭━━━〔 ❌ 𝑵𝑶 𝑹𝑬𝑺𝑼𝑳𝑻𝑺 〕━━━⬣\n┃ ✦ لا توجد نتائج\n┃ ✦ جرّب اسم آخر\n╰━━━━━━━━━━━━━━⬣`)
  }

  const tempDir = path.join(__dirname, '../tmp')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
  const audioPath = path.join(tempDir, `song_${Date.now()}.mp3`)

  await conn.sendMessage(jid, { react: { text: '⬇️', key: m.key } })

  try {
    const r = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    fs.writeFileSync(audioPath, Buffer.from(r.data))
  } catch (e) {
    return m.reply(`❌ فشل التحميل: ${e.message}`)
  }

  await conn.sendMessage(jid, { react: { text: '✅', key: m.key } })

  await conn.sendMessage(jid, {
    audio: fs.readFileSync(audioPath),
    mimetype: 'audio/mpeg',
    ptt: false,
    fileName: `${songName}.mp3`,
    caption: `╭━━━〔 🎵 𝑭𝑼𝑳𝑳 𝑺𝑶𝑵𝑮 〕━━━⬣\n┃ ✦ 𝑺𝒐𝒏𝒈 ↬ ${songName}\n┃ ✦ 𝑺𝒐𝒖𝒓𝒄𝒆 ↬ TikTok\n┃ ✦ 𝑸𝒖𝒂𝒍𝒊𝒕𝒚 ↬ HQ\n╰━━━━━━━━━━━━━━⬣\n\n📢 القناة:\n${CHANNEL_LINK}\n\n> ⛩️ SUKUNA BOT ⛩️`
  }, { quoted: m })

  try { fs.unlinkSync(audioPath) } catch {}
}

handler.help = ['شغل <اسم الأغنية>']
handler.tags = ['downloader']
handler.command = /^(شغل)$/i

export default handler