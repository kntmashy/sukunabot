import fetch from 'node-fetch'

const UA      = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36'
const BASE    = 'https://egibest.fan'
const HEADERS = {
  'user-agent': UA,
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'ar-EG,ar;q=0.9',
  'referer': BASE + '/'
}

// ✅ استخراج نص من HTML بين تاقين
const extract = (html, start, end) => {
  const i = html.indexOf(start)
  if (i === -1) return ''
  const j = html.indexOf(end, i + start.length)
  return j === -1 ? '' : html.slice(i + start.length, j).trim()
}

// ✅ استخراج كل المطابقات
const extractAll = (html, start, end) => {
  const results = []
  let pos = 0
  while (true) {
    const i = html.indexOf(start, pos)
    if (i === -1) break
    const j = html.indexOf(end, i + start.length)
    if (j === -1) break
    results.push(html.slice(i + start.length, j).trim())
    pos = j + end.length
  }
  return results
}

// ✅ بحث عن فيلم
const searchMovie = async (query) => {
  const url = `${BASE}/?s=${encodeURIComponent(query)}`
  const res  = await fetch(url, { headers: HEADERS })
  const html = await res.text()

  const results = []
  let pos = 0

  while (true) {
    const start = html.indexOf('class="postDiv"', pos)
    if (start === -1) break

    const block = html.slice(start, html.indexOf('</article>', start) + 10)

    const link  = extract(block, 'href="', '"')
    const title = extract(block, 'title="', '"') ||
                  extract(block, '<h3>', '</h3>') ||
                  extract(block, 'alt="', '"')
    const img   = extract(block, 'data-src="', '"') ||
                  extract(block, 'src="', '"')
    const year  = extract(block, 'class="year">', '<') ||
                  extract(block, 'class="postYear">', '<')

    if (link && link.startsWith('http')) {
      results.push({ link, title, img, year })
    }

    pos = start + 10
    if (results.length >= 5) break
  }

  return results
}

// ✅ جيب تفاصيل وروابط تحميل الفيلم
const getMovieDetails = async (url) => {
  const res  = await fetch(url, { headers: { ...HEADERS, referer: BASE + '/category/movies/' } })
  const html = await res.text()

  const title = extract(html, '<h1', '</h1>').replace(/<[^>]+>/g, '').trim() ||
                extract(html, 'property="og:title" content="', '"')

  const img   = extract(html, 'property="og:image" content="', '"') ||
                extract(html, 'class="postImg"', '/>').match(/src="([^"]+)"/)?.[1] || ''

  const desc  = extract(html, 'property="og:description" content="', '"') ||
                extract(html, 'class="postDesc">', '</div>').replace(/<[^>]+>/g, '').trim()

  const year  = extract(html, 'class="year">', '<') ||
                extract(html, '/release-year/', '/').replace(/\D/g, '')

  // ✅ استخراج روابط التحميل
  const links = []
  let dpos = 0

  while (true) {
    const di = html.indexOf('class="download"', dpos)
    if (di === -1) break

    const dblock = html.slice(di, html.indexOf('</div>', di + 100) + 6)
    const href   = extract(dblock, 'href="', '"')
    const label  = dblock.replace(/<[^>]+>/g, '').trim()

    if (href && href.startsWith('http')) {
      links.push({ url: href, label: label.slice(0, 50) })
    }

    dpos = di + 10
    if (links.length >= 10) break
  }

  // Fallback: دور على أي روابط تحميل
  if (links.length === 0) {
    const allLinks = extractAll(html, 'href="', '"')
    for (const l of allLinks) {
      if (l.includes('download') || l.includes('dl.') || l.includes('/d/')) {
        links.push({ url: l, label: 'تحميل' })
        if (links.length >= 5) break
      }
    }
  }

  return { title, img, desc, year, links, pageUrl: url }
}

// ════════════════════════════════════════════════════════
// 🎬 الهاندلر الرئيسي
// ════════════════════════════════════════════════════════
let handler = async (m, { conn, text }) => {
  const query = text?.trim()

  if (!query) {
    return m.reply(`╭─「 🎬 إيجي بست 」
│
│  📌 *طريقة الاستخدام:*
│  .ايجي اسم الفيلم
│
│  مثال:
│  .ايجي جنجستر
│
╰──────────────`)
  }

  await m.react('⏳')
  await m.reply(`🔍 جاري البحث عن: *${query}*`)

  try {
    // ✅ بحث
    const results = await searchMovie(query)

    if (results.length === 0) {
      await m.react('❌')
      return m.reply('❌ مش لاقي الفيلم ده على إيجي بست!')
    }

    // ✅ خد أول نتيجة
    const movie = results[0]

    await m.reply(`╭─「 🎬 نتائج البحث 」
│
│  🎥 *${movie.title || 'فيلم'}*
│  📅 ${movie.year || ''}
│  🔗 ${movie.link}
│
│  ⏳ جاري جيب روابط التحميل...
╰──────────────`)

    // ✅ جيب تفاصيل الفيلم
    const details = await getMovieDetails(movie.link)

    if (details.links.length === 0) {
      await m.react('❌')
      return m.reply(`╭─「 🎬 ${details.title || movie.title} 」
│
│  ❌ مش قادر أجيب روابط التحميل
│  📎 افتح الرابط مباشرةً:
│  ${movie.link}
│
╰──────────────`)
    }

    // ✅ ابعت الصورة مع التفاصيل
    const thumbBuffer = details.img
      ? await fetch(details.img, { headers: HEADERS }).then(r => r.ok ? r.arrayBuffer().then(Buffer.from) : null).catch(() => null)
      : null

    const linksText = details.links
      .slice(0, 8)
      .map((l, i) => `│  ${i + 1}. ${l.label || 'تحميل'}\n│     ${l.url}`)
      .join('\n│\n')

    const caption = `╭─「 🎬 ${details.title || movie.title} 」
│
│  📅 *السنة:* ${details.year || movie.year || 'غير محدد'}
${details.desc ? `│  📝 ${details.desc.slice(0, 100)}...\n` : ''}│
│  ⬇️ *روابط التحميل:*
│
${linksText}
│
│  🌐 الصفحة: ${movie.link}
╰──────────────`

    if (thumbBuffer) {
      await conn.sendMessage(m.chat, {
        image: thumbBuffer,
        caption
      }, { quoted: m })
    } else {
      await m.reply(caption)
    }

    await m.react('✅')

  } catch (e) {
    console.error('[EgyBest]', e.message)
    await m.react('❌')
    m.reply(`❌ خطأ: ${e.message}`)
  }
}

handler.help = ['ايجي']
handler.tags = ['download']
handler.command = ['ايجي', 'egybest', 'فيلم']

export default handler