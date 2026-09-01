import { xpRange } from '../lib/levelling.js';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';

let handler = async (m, { conn }) => {
    // ✅ تحديد مين طلب البروفايل
    let who

    // لو في رقم في النص (من الزر .انا @رقم)
    const textMatch = m.text?.match(/@(\d+)/)
    if (textMatch) {
        who = textMatch[1] + '@s.whatsapp.net'
    } else if (m.quoted) {
        who = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        who = m.mentionedJid[0]
    } else {
        who = m.sender
    }

    if (!who || who.endsWith('@lid')) who = m.sender

    if (!(who in global.db.data.users)) throw `❪⛩️❫⇇ *المستخدم غير موجود في قاعدة البيانات* ⇇❪⛩️❫`;

    let user = global.db.data.users[who];
    let { exp = 0, level = 0, role = 'مواطن', warn = 0 } = user;
    let username = conn.getName(who) || user.name || who.split('@')[0];
    let prem = global.prems.includes(who.split('@')[0]);
    let link = `https://wa.me/${who.split('@')[0]}`;

    // جلب الصورة
    let ppBuffer
    try {
        const ppUrl = await conn.profilePictureUrl(who, 'image')
        const res = await fetch(ppUrl)
        ppBuffer = await res.buffer()
    } catch {
        try { ppBuffer = await fs.readFile('./src/sinfoto.jpg') } catch { ppBuffer = null }
    }

    let str = `
╮═━━━━━━✦⛩️✦━━━━━━═╭
┊   ｢⛩️SUKUNA⚡️BOT⛩️｣   ┊
╯═━━━━━━✦⛩️✦━━━━━━═╰
✦───────✿───────✦
🌟 *بروفايل المستخدم:*
⿻𓂃˖ ⛩️SUKUNA⚡️BOT⛩️ ˖ ⿻𓂃
┊:•⪼ *🪪 الإسم:* ｢${username}｣
┊:•⪼ *⚠️ التحذيرات:* ｢${warn}/3｣
┊:•⪼ *✨ المستوى:* ｢${level}｣
┊:•⪼ *⬆️ الخبرة:* إجمالي ｢${exp}｣
┊:•⪼ *🏆 الترتيب:* ｢${role}｣
┊:•⪼ *📱 رقم المستخدم:*( ${link} )

✦──────✿──────✦
📌 *إذا كنت تستمتع معنا، شاركنا رأيك!*
✦──────✿──────✦

⛩️🌀 *نتمنى لك أوقاتاً ممتعة ومليئة بالفائدة في حياتك!* ⚡️⛩️
    `.trim();

    await conn.sendMessage(m.chat, { react: { text: '⚜️', key: m.key } });

    await conn.sendMessage(m.chat, {
        ...(ppBuffer ? { image: ppBuffer } : { text: str }),
        ...(ppBuffer ? { caption: str } : {}),
        mentions: [who]
    }, { quoted: m });
};

handler.help = ['profile'];
handler.tags = ['group'];
handler.command = ['بروفايل', 'انا', 'بروفايلي'];

export default handler;