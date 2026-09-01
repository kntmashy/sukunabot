import fetch from 'node-fetch'

let handler = async (m, { conn }) => {
  try {
    let audioUrl     = 'https://raw.githubusercontent.com/RADIOdemon6-alt/uploading-/main/uploads/upload-1749647493385.opus'
    let thumbnailUrl = 'https://raw.githubusercontent.com/RADIOdemon6-alt/uploading-/main/uploads/upload-1749647683251.jpg'

    let [audioRes, thumbRes] = await Promise.all([
      fetch(audioUrl),
      fetch(thumbnailUrl)
    ])

    if (!audioRes.ok) throw new Error(`فشل تحميل الصوت: ${audioRes.statusText}`)
    if (!thumbRes.ok) throw new Error(`فشل تحميل الصورة: ${thumbRes.statusText}`)

    let audio     = Buffer.from(await audioRes.arrayBuffer())
    let thumbnail = Buffer.from(await thumbRes.arrayBuffer())

    await conn.sendMessage(m.chat, {
      audio,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
      fileName: 'RADIO-DEMON.opus',
      contextInfo: {
        externalAdReply: {
          title:                 '🚫┇≡ ◡̈⃝⚰️•⪼ 𝑅𝐴𝐷𝐼𝛩 𝐷𝐸𝑀𝛩𝑁',
          body:                  '🎤┇≡ ◡̈⃝🎼•⪼ 𝙵𝙾𝚁𝙸𝙽𝙰 𝙱𝙾𝚃',
          thumbnail,
          mediaType:             1,
          renderLargerThumbnail: true,
          mediaUrl:              'https://wa.me/201500564191',
          sourceUrl:             'https://wa.me/201500564191'
        }
      }
    }, { quoted: m })

  } catch (err) {
    console.error('[بوت]', err.message)
    m.reply('❌ حدث خطأ: ' + err.message)
  }
}

handler.customPrefix = /^(بوت|يا بوت)$/i
handler.command      = new RegExp()
export default handler