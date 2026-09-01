import fetch from 'node-fetch';

let handler = async (m, { conn, usedPrefix, command, text }) => {

    if (!text) throw `┏━━༺『 ⛩️ *تيك توك* ⛩️ 』༻━━┓
┃ ⚠️ الرجاء إرسال رابط فيديو تيك توك
┃ 
┃ 🧷 *مثال:* 
┃ ${usedPrefix + command} https://vt.tiktok.com/ZSr2Dvjoj/
┗━━━━━━━━━━━━━━━━━━━━┛
> ✦┇⛩️ 𝐒𝐔𝐊𝐔𝐍𝐀 |♕| 𝐁𝐎𝐓 ⛩️┇✦`;

    if (!text.match(/(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i)) {
        throw `┏━━༺『 ❌ *خطأ في الرابط* ❌ 』༻━━┓
┃ الرابط المدخل لا ينتمي لتطبيق TikTok!
┃ 
┃ ✅ تأكد من أن الرابط يحتوي على:
┃ - tiktok.com أو vm.tiktok.com
┗━━━━━━━━━━━━━━━━━━━━━━┛
> ✦┇⛩️ 𝐒𝐔𝐊𝐔𝐍𝐀 |♕| 𝐁𝐎𝐓 ⛩️┇✦`;
    }

    try {
        await conn.sendMessage(m.chat, { text: `┏━━༺『 ⏳ *جاري التحميل...* ⏳ 』༻━━┓
┃ 📥 يتم الآن جلب الفيديو من TikTok...
┃ ⚡ الرجاء الانتظار قليلاً
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛
> ✦┇⛩️ 𝐒𝐔𝐊𝐔𝐍𝐀 |♕| 𝐁𝐎𝐓 ⛩️┇✦` }, { quoted: m });

        // الطريقة 1: TikWM API
        try {
            const tikwmRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(text)}`);
            const tikwmData = await tikwmRes.json();

            if (tikwmData.data?.play) {
                const videoInfo = tikwmData.data;
                return await conn.sendMessage(m.chat, {
                    video: { url: videoInfo.play },
                    caption: `┏━━༺『 🎞️ *تفاصيل الفيديو* 🎞️ 』༻━━┓
┃ 👤 *الاسم:* ${videoInfo.author?.nickname || 'غير معروف'}
┃ 🆔 *المعرف:* @${videoInfo.author?.unique_id || 'غير معروف'}
┃ ⭐ *المتابعين:* ${videoInfo.author?.follower_count || 0}
┃ 📝 *الوصف:* ${videoInfo.title || 'بدون عنوان'}
┃ ❤️ *الإعجابات:* ${videoInfo.digg_count || 0}
┃ 🔁 *المشاركات:* ${videoInfo.share_count || 0}
┃ 💬 *التعليقات:* ${videoInfo.comment_count || 0}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
> ✦┇⛩️ 𝐒𝐔𝐊𝐔𝐍𝐀 |♕| 𝐁𝐎𝐓 ⛩️┇✦`,
                    mentions: [m.sender]
                }, { quoted: m });
            }
        } catch (e) {
            console.log('TikWM API failed:', e);
        }

        // الطريقة 2: Snaptik API
        try {
            const snaptikRes = await fetch(`https://snaptik.app/api?url=${encodeURIComponent(text)}`);
            const snaptikData = await snaptikRes.json();

            if (snaptikData.video?.download_url) {
                return await conn.sendMessage(m.chat, {
                    video: { url: snaptikData.video.download_url },
                    caption: `┏━━༺『 ✅ *تم التحميل بنجاح* ✅ 』༻━━┓
┃ 🎥 *الفيديو جاهز بدون علامة مائية*
┃ 📌 *تم التحميل بجودة عالية* 🔥
┗━━━━━━━━━━━━━━━━━━━━━━━━━┛
> ✦┇⛩️ 𝐒𝐔𝐊𝐔𝐍𝐀 |♕| 𝐁𝐎𝐓 ⛩️┇✦`,
                    mentions: [m.sender]
                }, { quoted: m });
            }
        } catch (e) {
            console.log('Snaptik API failed:', e);
        }

        throw `┏━━༺『 ⚠️ *فشل التحميل* ⚠️ 』༻━━┓
┃ قد تكون هناك مشكلة في الرابط أو
┃ الفيديو خاص أو محذوف أو الخادم غير متاح
┃ 🔁 حاول مجددًا لاحقًا
┗━━━━━━━━━━━━━━━━━━━━┛
> ✦┇⛩️ 𝐒𝐔𝐊𝐔𝐍𝐀 |♕| 𝐁𝐎𝐓 ⛩️┇✦`;

    } catch (error) {
        console.error('Error:', error);
        await conn.sendMessage(m.chat, {
            text: `┏━━༺『 🛑 *خطأ غير متوقع* 🛑 』༻━━┓
┃ حدث خلل أثناء المعالجة:
┃ ❗ ${error.message || 'غير معروف'}
┃ 🔁 يرجى المحاولة لاحقًا
┗━━━━━━━━━━━━━━━━━━━━┛
> ✦┇⛩️ 𝐒𝐔𝐊𝐔𝐍𝐀 |♕| 𝐁𝐎𝐓 ⛩️┇✦`
        }, { quoted: m });
    }
};

handler.help = ['tiktok <رابط>'];
handler.tags = ['downloader'];
handler.command = /^(تيك-فيديو|تيك|tiktok|ttdl)$/i;
handler.limit = true;

export default handler;