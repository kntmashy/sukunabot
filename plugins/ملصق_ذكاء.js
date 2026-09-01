import { sticker } from '../lib/sticker.js'
import fetch from 'node-fetch'

// استخدمت Pollinations AI مجاني بدون API
async function generateAI(prompt) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', sticker, transparent background, high quality')}`
    const res = await fetch(url)
    return Buffer.from(await res.arrayBuffer())
}

let handler = async (m, { conn, text }) => {
    if (!text) return m.reply(`مثال: .ملصق_ذكاء قطة لابسة نضارة شمسية`)

    await conn.sendMessage(m.chat, { react: { text: '🎨', key: m.key } })
    
    try {
        m.reply(`⏳ جاري توليد: *${text}*`)
        
        // 1. توليد الصورة بالذكاء
        let buffer = await generateAI(text)
        
        // 2. تحويلها ملصق
        let stiker = await sticker(buffer, false, 'AI Pack', '')
        
        // 3. ارسال
        await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m })
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
        
    } catch (e) {
        console.log(e)
        m.reply('❌ فشل التوليد. جرب وصف تاني')
    }
}

handler.command = ['ملصق_ذكاء', 'ai_sticker', 'aistk']
handler.help = ['ملصق_ذكاء الوصف']
handler.tags = ['sticker']

export default handler