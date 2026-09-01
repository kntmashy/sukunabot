let handler = m => m;

let canalId = ["120363423640155012@newsletter"];
let canalNombre = ["⛩️SUKUNA⚡️BOT⛩️"];

handler.all = async function (m, { conn }) {
  if (m.key.fromMe) return;

  let chat = global.db.data.chats[m.chat];
  if (chat?.isBanned) return;

  let isFromChannel = canalId.includes(m.chat);
  if (isFromChannel) {
    console.log("تم استقبال رسالة من قناة:", m.chat);
  }

  const sendAdReply = async (text) => {
    await conn.sendMessage(m.chat, {
      text,
      contextInfo: {
        externalAdReply: {
          title: "MOHAB",
          body: isFromChannel ? `مرسلة من ${canalNombre[canalId.indexOf(m.chat)]}` : "𝙵𝙾𝚁𝙸𝙽𝙰 𝙱𝙾𝚃",
          thumbnailUrl: "https://stitch-api.vercel.app/api/v3/upload/view/image5w7he.jpg",
          sourceUrl: "https://whatsapp.com/channel/0029VaENL4h1lD3MZsVEty",
          mediaType: 1,
          showAdAttribution: true,
          renderLargerThumbnail: false
        }
      }
    }, { quoted: m });
  };

  if (/^تجربه$/i.test(m.text)) await sendAdReply("*رد تجريبي على القناة أو الشات*");

  return !0;
};

export default handler;