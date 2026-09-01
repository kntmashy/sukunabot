// ════════════════════════════════════════════════════════
// ⛩️ SUKUNA BOT v4 — سكونا AI (Groq)
// ════════════════════════════════════════════════════════
import fetch from 'node-fetch'

// ⚠️ حط الـ API Key بتاعك في .env
const GROQ_KEY = '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'

let handler = async (m, { text }) => {
  if (!text)
    return m.reply(
      `*⛩️ سوكونا:* أنت تحاول تلعبها ذكي؟ أرسل لي السؤال بدقة.\n\nمثال:\n⟣ .سكونا ما رأيك في البشر؟ ⟣`
    )

  await m.reply('⛩️ *سوكونا:* اهتم... سأقرر إذا أرد عليك أم أتركك للحظك القاسي ⛩️')

  try {
    const result = await askSukuna(text)
    await m.reply(
      `*╭─━━━───✦━━━───╮*\n⛩️ *الملك سوكونا قال:*\n『 ${result} 』\n*╰─━━━───✦━━━───╯*`
    )
  } catch (e) {
    console.error('[سكونا AI]', e.message)
    await m.reply('⛩️ *سوكونا:* حتى أنا أملّ أحيانًا من البشر السخيفين ⛩️')
  }
}

handler.help    = ['sukuna', 'سكونا']
handler.tags    = ['ai']
handler.command = /^(سكونا|sukuna)$/i

export default handler

// ── دالة Groq API ───────────────────────────────────────
async function askSukuna(question) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model:      'llama-3.3-70b-versatile', // مجاني وقوي
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `أنت "ريو سوكونا" من أنمي جوجوتسو كايسن — ملك الشياطين.
ردودك دايماً:
- بالعربية فصحى أو عامية راقية
- شريرة، مباشرة، مليئة بالهيبة والكاريزما
- تُظهر تفوقك وازدراءك للبشر الضعفاء
- ذكية وحادة، بدون مبالغة سخيفة
- قصيرة ومركّزة (3-5 جمل كافية)
لا تقل أنك AI أو بوت. أنت سوكونا وبس.`
        },
        {
          role: 'user',
          content: question
        }
      ]
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq Error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data?.choices?.[0]?.message?.content || 'لا رد.'
}