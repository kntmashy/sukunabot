let handler = async (m, { conn, text }) => {
    if (!text) throw "*╮━━━══━━❪⛩️❫━━══━━━❍*\n*┊⇇منشن الشخص لمعرفت قد ايه هو بيض ورخيم*\n*╯━━━══━━❪🍬❫━━══━━━❍*"

    const mentionedUser = m.mentionedJid && m.mentionedJid[0]
        ? m.mentionedJid[0]
        : text.replace(/[@ .+-]/g, '') + '@s.whatsapp.net'

    const percentages = Array.from({ length: 100 }, (_, i) => `${i + 1}%`)
    const selected = percentages[Math.floor(Math.random() * percentages.length)]

    const num = parseInt(selected)
    let comment = ""
    if (num <= 20) comment = "مش بايظ خالص 😌"
    else if (num <= 40) comment = "شوية بس محتمل 😅"
    else if (num <= 60) comment = "بيبيض نص نص 😬"
    else if (num <= 80) comment = "بيض جداً ومزعج 😤"
    else if (num <= 95) comment = "بيض تقيل اوي يا عم 💀"
    else comment = "الرخامة الكاملة نفسها 🪦😂"

    let message = `*╮━━━══━━❪⛩️❫━━══━━━❍*\n*┊⇇المنشن↜｢@${mentionedUser.split("@")[0]}｣*\n*┊⇇نسبه بياضتـ❣ـہه↜｢${selected}｣*\n*┊⇇التقييم↜｢${comment}｣*\n*╯━━━══━━❪🍬❫━━══━━━❍*`

    conn.sendMessage(m.chat, { text: message, mentions: [mentionedUser] }, { quoted: m })
}

handler.help = ["ابيض @tag"]
handler.tags = ['fun']
handler.command = /^(بيض)/i

export default handler