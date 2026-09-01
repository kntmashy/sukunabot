let handler = async (m, { conn, text }) => {
    if (!text) throw "*╮━━━══━━❪⛩️❫━━══━━━❍*\n*┊⇇منشن الشخص لمعرفت قد ايه بيلعب بيس*\n*╯━━━══━━❪🎮❫━━══━━━❍*"

    const mentionedUser = m.mentionedJid && m.mentionedJid[0]
        ? m.mentionedJid[0]
        : text.replace(/[@ .+-]/g, '') + '@s.whatsapp.net'

    const percentages = Array.from({ length: 100 }, (_, i) => `${i + 1}%`)
    const selected = percentages[Math.floor(Math.random() * percentages.length)]

    const num = parseInt(selected)
    let comment = ""
    if (num <= 10) comment = "انوب واحد في روبلوكس زون 😂"
    else if (num <= 25) comment = "منوب نص نص  😴"
    else if (num <= 40) comment = "بيلعب بس مش بيكسب 😅"
    else if (num <= 55) comment = "لاعب عادي، مش كتير مش قليل ⚽"
    else if (num <= 70) comment = "بيلعب كتير وبيتعصب أكتر 😤"
    else if (num <= 85) comment = "نص محترف 🎮💨"
    else if (num <= 95) comment = "موبايل في إيده حتى وهو بياكل 🕹️💀"
    else comment = "العب واحد في روبلوكس زون 🪦👑"

    let message = `*╮━━━══━━❪⛩️❫━━══━━━❍*\n*┊⇇المنشن↜｢@${mentionedUser.split("@")[0]}｣*\n*┊⇇نسبه لعب البيس↜｢${selected}｣*\n*┊⇇التقييم↜｢${comment}｣*\n*╯━━━══━━❪🎮❫━━══━━━❍*`

    conn.sendMessage(m.chat, { text: message, mentions: [mentionedUser] }, { quoted: m })
}

handler.help = ["بيس @tag"]
handler.tags = ['fun']
handler.command = /^(بيس|pes)/i

export default handler