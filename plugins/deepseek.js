// Created by ABDO DEV — معدل بالكامل
import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return conn.sendMessage(m.chat, { 
            text: `⚠️ اكتب سؤالك مباشرة بعد الأمر.\n\n📝 مثال:\n*${usedPrefix + command} مَا هِيَ عَاصِمَةُ اَلْمَغْرِبِ؟*` 
        }, { quoted: m });
    }

    await conn.sendMessage(m.chat, { 
        text: '⏳ جارٍ معالجة طلبك، انتظر لحظة...' 
    }, { quoted: m });

    const maxRetries = 10;
    let success = false;
    let aiReply = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const apiUrl = `https://nour-deepseek-api.vercel.app/chat?message=${encodeURIComponent(text)}`;
            const response = await axios.get(apiUrl, { timeout: 10000 });

            if (response.data && response.data.success && response.data.reply) {
                aiReply = response.data.reply;
                success = true;
                break;
            } else {
                throw new Error("استجابة غير صالحة من الخادم");
            }
        } catch (error) {
            console.error(`❌ المحاولة رقم [${attempt}] فشلت:`, error.message);
        }
    }

    if (success) {
        const finalMessage = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
✨ *الجواب* ✨

${aiReply}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
🤖 *مساعدك:* DeepSeek الذكي
`;
        await conn.sendMessage(m.chat, { text: finalMessage }, { quoted: m });
    } else {
        await conn.sendMessage(m.chat, { 
            text: `❌ تعذر الحصول على إجابة.\nحدث خطأ في الاتصال بعد عدة محاولات، يرجى المحاولة لاحقاً.` 
        }, { quoted: m });
    }
};

handler.help = ['deepseek2', 'ديب2'];
handler.tags = ['ai'];
handler.command = /^(deepseek2|ds2|ديب2)$/i;

export default handler;