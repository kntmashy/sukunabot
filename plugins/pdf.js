import fetch from 'node-fetch'

let handler = async (m, { conn, text }) => {
  await m.react('⏳')

  if (!text) {
    await m.react('❌')
    return conn.reply(m.chat,
      '*╮═≼『⛩️┃تنبيه┃⛩️』≽═╭*\n*┇⌗╎اكتب النص بعد الأمر*\n*مثال: .pdf مرحبا*\n*╯✯≼══━━﹂⛩️﹁━━══≽✯*', m)
  }

  const html = `<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: Arial, sans-serif;
    font-size: 18px;
    padding: 40px;
    direction: rtl;
    text-align: right;
  }
</style>
</head>
<body>${text.replace(/\n/g, '<br>')}</body>
</html>`

  try {
    const res = await fetch('https://api.html2pdf.app/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        apiKey: 'LP11H3WI3y1dKBrTk0db3xUcNqvngt4Oi4pzc4eXhRyiH7TjlKLbWXlPUvSsyx29'
      })
    })

    if (!res.ok) {
      const err = await res.text()
      console.log('[PDF]', res.status, err)
      await m.react('❌')
      return conn.reply(m.chat,
        `*╮═≼『⛩️┃خطأ┃⛩️』≽═╭*\n*┇⌗╎${res.status} — ${err.slice(0, 100)}*\n*╯✯≼══━━﹂⛩️﹁━━══≽✯*`, m)
    }

    const buffer = Buffer.from(await res.arrayBuffer())

    if (!buffer || buffer.length < 100) {
      console.log('[PDF] buffer فارغ أو صغير جداً:', buffer?.length)
      await m.react('❌')
      return conn.reply(m.chat, '*┇⌗╎فشل تحويل النص، حاول مرة أخرى*', m)
    }

    await conn.sendMessage(m.chat, {
      document: buffer,
      mimetype: 'application/pdf',
      fileName: 'document.pdf',
      caption: '*╮═≼『⛩️┃PDF┃⛩️』≽═╭*\n*┇⌗╎تم تحويل النص إلى PDF ✅*\n*╯✯≼══━━﹂⛩️﹁━━══≽✯*'
    }, { quoted: m })

    await m.react('✅')

  } catch (e) {
    console.log('[PDF] error:', e.message)
    await m.react('❌')
    return conn.reply(m.chat,
      `*╮═≼『⛩️┃خطأ┃⛩️』≽═╭*\n*┇⌗╎${e.message.slice(0, 100)}*\n*╯✯≼══━━﹂⛩️﹁━━══≽✯*`, m)
  }
}

handler.help    = ['pdf <نص>']
handler.tags    = ['tools']
handler.command = /^pdf$/i
export default handler