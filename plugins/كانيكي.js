import axios from 'axios'

let handler = async (m, { conn, usedPrefix, command }) => {
  let res = (await axios.get(`https://raw.githubusercontent.com/BrunoSobrino/TheMystic-Bot-MD/master/src/JSON/anime-keneki.json`)).data
  let url = res[Math.floor(res.length * Math.random())]
  conn.sendButton(m.chat, "⛩️SUKUNA⚡️BOT⛩️", "MOHAB", url, [['⚽ التالي', `${usedPrefix + command}`]], m)
}

handler.help = ['keneki']
handler.tags = ['internet']
handler.command = /^(keneki|كانيكي)$/i

export default handler