// plugins/getpp.js

const handler = async (m, { conn, text }) => {
    let who

    // لو في منشن
    if (m.mentionedJid?.[0]) {
        who = m.mentionedJid[0]
    }
    // لو في رد على رسالة
    else if (m.quoted) {
        who = m.quoted.sender
    }
    // لو في رقم في النص
    else if (text) {
        const num = text.replace(/\D/g, '')
        if (num) who = num + '@s.whatsapp.net'
    }

    if (!who) return m.reply(`❌ اكتب رقم أو منشن شخص\nمثال: .بروفايل 201xxxxxxxxx`)

    // تأكد إن الرقم على واتساب
    try {
        const [exists] = await conn.onWhatsApp(who)
        if (!exists?.exists) return m.reply('❌ الرقم ده مش على واتساب!')
        who = exists.jid
    } catch {}

    // جيب الصورة
    try {
        const ppUrl = await conn.profilePictureUrl(who, 'image')
        await conn.sendMessage(m.chat, {
            image: { url: ppUrl },
            caption: `📸 صورة بروفايل *@${who.split('@')[0]}*`,
            mentions: [who]
        }, { quoted: m })
    } catch {
        await conn.sendMessage(m.chat, {
            image: { url: 'https://i.imgur.com/d4Bq9Wq.png' },
            caption: `⚠️ *@${who.split('@')[0]}* مش عنده صورة بروفايل أو مخفياها`,
            mentions: [who]
        }, { quoted: m })
    }
}

handler.help = ['بروفايل']
handler.tags = ['tools']
handler.command = /^(بروفايل|pp|صورة)$/i

export default handler