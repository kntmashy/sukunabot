// plugins/groups-list.js
import { prepareWAMessageMedia, generateWAMessageFromContent } from 'angularsockets';

const GROUP_OWNER_ID = '201500564191@s.whatsapp.net';
const GROUP_DEVELOPERS = ['201500564191@s.whatsapp.net']; // أضف المعرف كاملاً مع @s.whatsapp.net

const imgUrl = 'https://files.catbox.moe/fk9ym6.jpg'; // صورة أوين (شغالة)

const handler = async (m, { text, conn, usedPrefix, command }) => {
  // ✅ إذا كان المستخدم ليس المطور، لا نستجيب
  // if (m.sender !== GROUP_OWNER_ID) return m.reply('❰ ❕ ❱ هذا الأمر للمطور فقط.');

  // ✅ جلب المجموعات التي البوت عضو فيها
  const groups = [];
  for (const [jid, chat] of Object.entries(conn.chats)) {
    if (jid.endsWith('@g.us') && chat.isChats) {
      try {
        const metadata = await conn.groupMetadata(jid).catch(() => null);
        if (metadata) {
          groups.push({
            jid: jid,
            subject: metadata.subject,
            participants: metadata.participants?.length || 0,
            isBotAdmin: metadata.participants?.some(p => p.id === conn.user.jid && p.admin) || false
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  // ✅ إذا لم تكن هناك مجموعات
  if (groups.length === 0) {
    return m.reply('❌ البوت ليس عضواً في أي مجموعة حالياً.');
  }

  // ✅ بناء الأزرار (قائمة منسدلة)
  const sections = [{
    title: '「 قائمة المجموعات 」',
    highlight_label: '📋',
    rows: groups.map(g => ({
      title: g.subject.length > 30 ? g.subject.slice(0, 27) + '...' : g.subject,
      description: `👥 ${g.participants} عضو | 🤖 ${g.isBotAdmin ? 'أدمن ✅' : 'عضو فقط ❌'}`,
      id: `${usedPrefix + command} ${g.jid}`
    }))
  }];

  const mediaMessage = await prepareWAMessageMedia({ image: { url: imgUrl } }, { upload: conn.waUploadToServer });
  
  const interactiveMessage = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: { hasMediaAttachment: true, ...mediaMessage },
          body: { text: `📊 *إجمالي المجموعات:* ${groups.length}` },
          footer: { text: `🕒 تاريخ: ${new Date().toLocaleString('ar-EG')}` },
          nativeFlowMessage: {
            buttons: [{
              name: 'single_select',
              buttonParamsJson: JSON.stringify({
                title: '📋 قائمة المجموعات',
                sections
              })
            }]
          }
        }
      }
    }
  };

  const msg = generateWAMessageFromContent(m.chat, interactiveMessage, { userJid: conn.user.jid });
  await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
};

handler.help = ['groups', 'grouplist'];
handler.tags = ['info'];
handler.command = ['المجموعات', 'الجروبات'];
handler.rowner = true; // ✅ تأكد من أنك المطور

export default handler;