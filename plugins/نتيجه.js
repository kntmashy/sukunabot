let handler = async (m, { conn, command, text, usedPrefix, participants }) => {
    if (!text) throw `*╮━━━══━━❪📚❫━━══━━━❍*\n*┊⇇منشن الطالب لمعرفة نتيجته*\n*╯━━━══━━❪🎓❫━━══━━━❍*`

    const mentionedUser = m.mentionedJid && m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : args[2] 
        ? (args[2].replace(/[@ .+-]/g, '') + '@s.whatsapp.net') 
        : ''

    // قائمة النتائج المحتملة (تم التعديل هنا)
    const results = [
        { grade: "الناجح يرفع إيده 🖐️😂", percentage: "95% - 100%" },  // تعديل هنا
        { grade: "جيد جداً", percentage: "85% - 94%" },
        { grade: "جيد", percentage: "75% - 84%" },
        { grade: "مقبول", percentage: "65% - 74%" },
        { grade: "شايل تلات ملاحق 😅", percentage: "50% - 64%" },
        { grade: "شايل عشر ملاحق 😂", percentage: "أقل من 50%" },
    ]

    // اختيار نتيجة عشوائية
    const randomResult = results[Math.floor(Math.random() * results.length)]

    // نسبة مئوية عشوائية ضمن نطاق التقدير
    const getRandomPercentage = (range) => {
        const [min, max] = range.split(' - ').map(p => parseInt(p))
        if (isNaN(min) || isNaN(max)) return range
        return Math.floor(Math.random() * (max - min + 1)) + min + '%'
    }

    const finalPercentage = randomResult.percentage.includes('-') 
        ? getRandomPercentage(randomResult.percentage) 
        : randomResult.percentage

    let message = `*╮━━━══━━❪📊❫━━══━━━❍*\n` +
                  `*┊⇇الطالب↜｢@${mentionedUser.split("@")[0]}｣*\n` +
                  `*┊⇇التقدير↜｢${randomResult.grade}｣*\n` +
                  `*┊⇇النسبة↜｢${finalPercentage}｣*\n` +
                  `*╯━━━══━━❪🎯❫━━══━━━❍*`

    conn.sendMessage(m.chat, { text: message, mentions: [mentionedUser] }, { quoted: m })
}

handler.help = ["exam @tag"]
handler.tags = ['fun']
handler.command = /^(نتيجه|exam)/i

export default handler