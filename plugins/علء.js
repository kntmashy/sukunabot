let handler = async (m, { conn, text }) => {
    if (!text) throw "*╮━━━══━━❪⛩️❫━━══━━━❍*\n*┊⇇منشن الشخص لمعرفت قد ايه هو علء*\n*╯━━━══━━❪🍬❫━━══━━━❍*"

    const mentionedUser = m.mentionedJid && m.mentionedJid[0]
        ? m.mentionedJid[0]
        : text.replace(/[@ .+-]/g, '') + '@s.whatsapp.net'

    const percentages = Array.from({ length: 100 }, (_, i) => `${i + 1}%`)
    const selected = percentages[Math.floor(Math.random() * percentages.length)]

    const num = parseInt(selected)
    let comment = ""
    if (num <= 20) comment = "نظيف ومحترم 😇"
    else if (num <= 40) comment = "شوية علء بس محتمل 😅"
    else if (num <= 60) comment = "علء نص نص 😬"
    else if (num <= 80) comment = "علء جداً ده عم 😤"
    else if (num <= 95) comment = "اكبر علق في روبلوكس زون 💀"
    else comment = "وصل للماكس في العلوءيه 🪦😂"

    let message = `*╮━━━══━━❪⛩️❫━━══━━━❍*\n*┊⇇المنشن↜｢@${mentionedUser.split("@")[0]}｣*\n*┊⇇نسبه علءيتـ❣ـہه↜｢${selected}｣*\n*┊⇇التقييم↜｢${comment}｣*\n*╯━━━══━━❪🍬❫━━══━━━❍*`

    conn.sendMessage(m.chat, { text: message, mentions: [mentionedUser] }, { quoted: m })
}

handler.help = ["علء @tag"]
handler.tags = ['fun']
handler.command = /^(علء)/i

export default handler