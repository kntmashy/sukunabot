let handler = m => m

handler.before = async function (m, { conn }) {
  if (!m.text) return

  const text = m.text
    .toLowerCase()
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()

  const words = [
    'صل على النبي',
    'صلي على النبي',
    'صلى على النبي',
    'صل ع النبي',
    'صلي ع النبي',
    'صلى ع النبي',
    'صل عالنبي',
    'صلي عالنبي',
    'صلى عالنبي'
  ]

  const found = words.some(word =>
    text.includes(
      word.toLowerCase()
        .replace(/[إأآ]/g, 'ا')
        .replace(/ى/g, 'ي')
    )
  )

  if (found) {
    await conn.reply(
      m.chat,
      'عليه أفضل الصلاة والسلام🤍',
      m
    )
  }
}

export default handler