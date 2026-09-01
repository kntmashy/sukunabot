import axios from 'axios'

let handler = async (m, { conn, usedPrefix, command }) => {
  let res = (await axios.get(`https://raw.githubusercontent.com/BrunoSobrino/TheMystic-Bot-MD/master/src/JSON/anime-hinata.json`)).data
  let url = res[Math.floor(res.length * Math.random())]
  conn.sendButton(m.chat, "⛩️SUKUNA⚡️BOT⛩️", '', url, [['⚽ التالي', `${usedPrefix + command}`]], m)
}

handler.help = ['hinata']
handler.tags = ['internet']
handler.command = /^(hinata|هيناتا)$/i

export default handler