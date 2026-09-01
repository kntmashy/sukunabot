let handler = async (m, { conn, command, text, usedPrefix, participants }) => {
    if (!text) throw "*╮━━━══━━❪⛩️❫━━══━━━❍*\n*┊⇇منشن الشخص لمعرفت قد ايه هو محظوظ*\n*╯━━━══━━❪🍬❫━━══━━━❍*"
    const mentionedUser = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : args[2] ? (args[2].replace(/[@ .+-]/g, '') + '@s.whatsapp.net') : ''

    const userChar = []
    for (let i = 1; i <= 100; i++) userChar.push(i + "%")

    const userCharacterSeletion = userChar[Math.floor(Math.random() * userChar.length)]

    let message = `*╮━━━══━━❪⛩️❫━━══━━━❍*\n*┊⇇المنشن↜｢@${mentionedUser.split("@")[0]}｣*\n*┊⇇نسبه حظه اليوم↜｢${userCharacterSeletion}｣*\n*╯━━━══━━❪🍬❫━━══━━━❍*`

    conn.sendMessage(m.chat, { text: message, mentions: [mentionedUser] }, { quoted: m })
}
handler.help = ["حظ @tag"]
handler.tags = ['fun']
handler.command = /^(حظ)/i

export default handler