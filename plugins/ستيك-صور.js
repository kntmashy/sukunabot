import axios from 'axios';
import * as cheerio from 'cheerio';
import { Sticker } from 'wa-sticker-formatter';

async function gifsSearch(query) {
  try {
    const url = `https://tenor.com/search/${encodeURIComponent(query)}-gifs`;
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(data);
    const results = [];

    $('figure.UniversalGifListItem img').each((i, el) => {
      const imgUrl = $(el).attr('src');
      if (imgUrl && imgUrl.endsWith('.gif')) {
        results.push(imgUrl.replace('.gif', '.jpg'))
      }
    });

    return results;
  } catch (e) {
    console.error('[ستيك-صور]', e.message);
    return [];
  }
}

const handler = async (m, { conn, text, command }) => {
  if (!text) return m.reply(
    `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
    `*┇⌗╎استخدم الأمر هكذا:*\n` +
    `*.${command} <الشخصية> <عدد الملصقات>*\n` +
    `*مثال: .${command} Gojo 4*\n` +
    `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
  )

  const [query, countStr] = text.split(/(?<=^\S+)\s/)
  const count = Math.min(Number(countStr) || 1, 30)

  await m.react('⏳')

  const images = await gifsSearch(query)
  if (!images.length) {
    await m.react('❌')
    return m.reply(
      `*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n` +
      `*┇⌗╎ما لقيتش صور لـ ${query}*\n` +
      `*╯✯≼══━━﹂⛩️﹁━━══≽✯*`
    )
  }

  const used     = new Set()
  const selected = []

  while (selected.length < count && used.size < images.length) {
    const i = Math.floor(Math.random() * images.length)
    if (!used.has(i)) { used.add(i); selected.push(images[i]) }
  }

  let sent = 0
  for (const img of selected) {
    try {
      const { data } = await axios.get(img, { responseType: 'arraybuffer' })
      const sticker  = new Sticker(Buffer.from(data), {
        type:    'full',
        pack:    '⛩️ SUKUNA BOT ⛩️',
        author:  'MOHAB',
        quality: 75
      })
      const buffer = await sticker.toBuffer()
      await conn.sendMessage(m.chat, { sticker: buffer }, { quoted: m })
      sent++
    } catch (e) {
      console.error('[ستيك-صور]', e.message)
    }
  }

  await m.react(sent > 0 ? '✅' : '❌')
}

handler.help    = ['ستيك-صور <الشخصية> <العدد>']
handler.tags    = ['sticker']
handler.command = ['ستيك-صور']
handler.limit   = 1
export default handler