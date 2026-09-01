import axios from "axios"
import fetch from "node-fetch"

// ═══ بحث بالاسم — Saavn ═══
const searchSaavn = async (query) => {
  const res = await axios.get(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(query)}`)
  const songs = res.data
  if (!songs || songs.length === 0) return null
  const song = songs[0]
  if (!song.media_url) return null
  return {
    name: song.song || 'غير معروف',
    artist: song.singers || 'غير معروف',
    album: song.album || '',
    image: song.image?.replace('150x150', '500x500') || null,
    downloadUrl: song.media_url
  }
}

// ═══ بحث بالاسم — JioSaavn backup ═══
const searchBackup = async (query) => {
  const res = await axios.get(`https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(query)}&page=1&limit=1`)
  const song = res.data?.data?.results?.[0]
  if (!song) return null
  const downloadUrl = song.downloadUrl?.find(d => d.quality === '320kbps')?.url ||
                      song.downloadUrl?.[song.downloadUrl.length - 1]?.url
  if (!downloadUrl) return null
  return {
    name: song.name || 'غير معروف',
    artist: song.artists?.primary?.map(a => a.name).join(', ') || 'غير معروف',
    album: song.album?.name || '',
    image: song.image?.find(i => i.quality === '500x500')?.url || song.image?.[0]?.url || null,
    downloadUrl
  }
}

// ═══ تحميل بالرابط من Spotify — عن طريق spotifydown.com ═══
const downloadByLink = async (m, conn, spotifyUrl) => {
  await m.react('⏳')
  await m.reply('🎵 جاري تحميل الأغنية...')

  // جيب الـ track ID
  const trackId = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/)?.[1]
  if (!trackId) {
    await m.react('❌')
    return m.reply('❌ رابط غلط! تأكد إنه رابط track صح.')
  }

  // جرب spotdown الأول
  try {
    const sdResult = await downloadFromSpotdown(spotifyUrl)
    if (sdResult.image) {
      await conn.sendMessage(m.chat, {
        image: { url: sdResult.image },
        caption: `🎵 *${sdResult.title}*\n👤 ${sdResult.artist}`
      }, { quoted: m })
    }
    await conn.sendMessage(m.chat, {
      audio: sdResult.buffer,
      mimetype: 'audio/mpeg',
      fileName: `${sdResult.title}.mp3`,
    }, { quoted: m })
    await m.react('✅')
    return
  } catch (e) {
    console.log('[سبوتي] spotdown fail:', e.message)
  }

  try {
    // API 1 — spotifydown
    const res1 = await fetch(`https://spotifydown.com/api/download/${trackId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://spotifydown.com/',
        'Origin': 'https://spotifydown.com',
      }
    })
    const data1 = await res1.json()
    console.log('[سبوتي] spotifydown:', JSON.stringify(data1).slice(0, 200))

    if (data1?.success && data1?.link) {
      const audioRes = await fetch(data1.link, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      if (audioRes.ok) {
        const audioBuffer = Buffer.from(await audioRes.arrayBuffer())
        if (audioBuffer.length > 10000) {
          await conn.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${data1.metadata?.title || 'song'}.mp3`,
          }, { quoted: m })
          await m.react('✅')
          return
        }
      }
    }
  } catch (e) {
    console.log('[سبوتي] spotifydown fail:', e.message)
  }

  try {
    // API 2 — yank.g3v.co.uk
    const res2 = await fetch(`https://yank.g3v.co.uk/track/${trackId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const data2 = await res2.json()
    console.log('[سبوتي] yank:', JSON.stringify(data2).slice(0, 200))

    if (data2?.url) {
      const audioRes = await fetch(data2.url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (audioRes.ok) {
        const audioBuffer = Buffer.from(await audioRes.arrayBuffer())
        if (audioBuffer.length > 10000) {
          await conn.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${data2.name || 'song'}.mp3`,
          }, { quoted: m })
          await m.react('✅')
          return
        }
      }
    }
  } catch (e) {
    console.log('[سبوتي] yank fail:', e.message)
  }

  try {
    // API 3 — ابحث بالاسم باستخدام Spotify API metadata
    let title = '', artistName = ''
    try {
      const metaRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`)
      const meta = await metaRes.json()
      const raw = meta?.title || ''
      const parts = raw.split(' - ')
      title = parts[0]?.trim() || raw
      artistName = parts[1]?.trim() || ''
    } catch {}

    try {
      const spRes = await fetch(`https://api.fabdl.com/spotify/get?url=${encodeURIComponent(spotifyUrl)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      const spData = await spRes.json()
      if (spData?.result?.name) title = spData.result.name
      if (spData?.result?.artists) artistName = spData.result.artists
      console.log('[سبوتي] fabdl:', title, artistName)
    } catch {}

    const searchQuery = artistName ? `${title} ${artistName}` : title
    console.log('[سبوتي] searching:', searchQuery)

    if (searchQuery) {
      let result = await searchSaavn(searchQuery).catch(() => null)
      if (!result) result = await searchBackup(searchQuery).catch(() => null)

      if (result) {
        if (result.image) {
          await conn.sendMessage(m.chat, {
            image: { url: result.image },
            caption: `🎵 *${result.name}*\n👤 ${result.artist}`
          }, { quoted: m })
        }
        await conn.sendMessage(m.chat, {
          audio: { url: result.downloadUrl },
          mimetype: 'audio/mpeg',
          ptt: false
        }, { quoted: m })
        await m.react('✅')
        return
      }
    }
  } catch (e) {
    console.log('[سبوتي] oembed+search fail:', e.message)
  }

  await m.react('❌')
  await m.reply('❌ مش قادر أحمل الأغنية دي. جرب الاسم بدل الرابط:\n.سبوتي اسم الأغنية')
}

// ═══ تحميل بالرابط من spotdown.org ═══
const downloadFromSpotdown = async (spotifyUrl) => {
  const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
  const SESSION_TOKEN = '83e4830e173051cae5e5896321a5784bad251f0b6792b740eff176c0c295c2b3'
  const headers = {
    'authority': 'spotdown.org',
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
    'referer': 'https://spotdown.org/en',
    'user-agent': UA,
    'x-session-token': SESSION_TOKEN,
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  }

  // خطوة 1: جيب بيانات الأغنية
  const detailsRes = await fetch(
    `https://spotdown.org/apinew/song-details?url=${encodeURIComponent(spotifyUrl)}`,
    { headers, timeout: 15000 }
  )
  const details = await detailsRes.json()
  console.log('[spotdown] details:', JSON.stringify(details).slice(0, 200))

  if (!details || details.error) throw new Error('فشل جيب البيانات')

  // خطوة 2: ابدأ التحميل
  const dlRes = await fetch('https://spotdown.org/apinew/download', {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json', 'origin': 'https://spotdown.org' },
    body: JSON.stringify({ url: spotifyUrl })
  })
  const dlData = await dlRes.json()
  console.log('[spotdown] download:', JSON.stringify(dlData).slice(0, 200))

  const uuid = dlData?.id || dlData?.uuid || dlData?.download_id
  if (!uuid) throw new Error('مش لاقي UUID')

  // خطوة 3: حمل الملف
  const fileRes = await fetch(`https://spotdown.org/apinew/temp-download/${uuid}`, { headers })
  if (!fileRes.ok) throw new Error(`فشل التحميل: ${fileRes.status}`)

  const contentType = fileRes.headers.get('content-type') || ''
  if (contentType.includes('text/html') || contentType.includes('application/json'))
    throw new Error('الرابط أدى لصفحة مش ملف')

  const buffer = Buffer.from(await fileRes.arrayBuffer())
  if (buffer.length < 10000) throw new Error('الملف صغير جداً')

  return {
    buffer,
    title: details?.name || details?.title || 'song',
    artist: details?.artists?.[0] || details?.artist || '',
    image: details?.image || details?.thumbnail || null
  }
}

// ═══ Handler الرئيسي ═══
const handler = async (m, { conn, text, command }) => {
  if (!text || text.trim().length < 2) {
    return m.reply(`🎵 الاستخدام:\n.سبوتي اسم الأغنية\n.سبوتي_لينك https://open.spotify.com/track/xxx`)
  }

  const input = text.trim()

  if (command === 'سبوتي_لينك' || command === 'spotify_link') {
    if (!input.includes('spotify.com/track/')) {
      return m.reply('⚠️ ضيف رابط سبوتيفاي صح!\nمثال: .سبوتي_لينك https://open.spotify.com/track/xxx')
    }
    try {
      await downloadByLink(m, conn, input)
    } catch (e) {
      console.error('[سبوتي_لينك]', e.message)
      await m.react('❌')
      m.reply('❌ خطأ: ' + e.message)
    }
    return
  }

  // بحث بالاسم
  try {
    await m.reply('🔍 جاري البحث...')

    let result = await searchSaavn(input).catch(() => null)
    if (!result) {
      await m.reply('🔄 جاري البحث في مصدر آخر...')
      result = await searchBackup(input).catch(() => null)
    }

    if (!result) return m.reply('❌ لم يتم العثور على الأغنية، جرب اسم مختلف')

    const caption = `🎵 *${result.name}*\n👤 ${result.artist}\n💿 ${result.album}`

    if (result.image) {
      await conn.sendMessage(m.chat, {
        image: { url: result.image },
        caption
      }, { quoted: m })
    }

    await conn.sendMessage(m.chat, {
      audio: { url: result.downloadUrl },
      mimetype: 'audio/mpeg',
      ptt: false
    }, { quoted: m })

    await m.react('✅')

  } catch (e) {
    console.error('[سبوتي]', e.message)
    m.reply('❌ حدث خطأ: ' + e.message)
  }
}

handler.help = ['سبوتي', 'سبوتي_لينك']
handler.tags = ['download']
handler.command = ['سبوتي', 'spotify', 'سبوتيفاي', 'سبوتي_لينك', 'spotify_link']

export default handler