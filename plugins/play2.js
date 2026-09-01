import fetch from 'node-fetch';
import yts from 'yt-search';

const apiBaseUrl = "https://p.oceansaver.in/ajax";
const apiKey = "dfcb6d76f2f6a9894gjkege8a4ab232222";

const handler = async (m, { command, conn, args, text }) => {
    if (!text) {
        await conn.sendMessage(m.chat, { text: '> *\`『 اكتب اسم الي هتشغلو معا الامر يا عثل  』\`*' }, { quoted: m });
        return;
    }

    await m.react('🕓'); // التفاعل عند البداية

    try {
        const ytResult = await search(args.join(' ')); // البحث عن الفيديو
        const videoUrl = ytResult[0].url;
        const thumbnail = ytResult[0].thumbnail;

        if (command === 'فيديو') {
            await sendVideo(videoUrl, thumbnail, m, conn);
        } else if (command === 'اغنيه' || command === 'اغنية' || command === 'صوت') {
            await sendAudio(videoUrl, thumbnail, m, conn);
        }
    } catch (error) {
        console.error(error);
        await conn.sendMessage(m.chat, { text: '> *\`『 الرابط غير صحيح. حاول مرة أخرى. 』\`*' }, { quoted: m });
    }
};

handler.command = /^(فيديو|اغنية|صوت|اغنيه)$/i;
export default handler;

// البحث عن الفيديوهات باستخدام yt-search
async function search(query) {
    const searchResult = await yts.search({ query, hl: 'ar', gl: 'AR' });
    return searchResult.videos;
}

// إرسال الفيديو
async function sendVideo(url, thumbnail, m, conn) {
    try {
        await m.react('🕓'); // التفاعل عند البداية
        const downloadUrl = await downloadMedia(url);
        await conn.sendMessage(
            m.chat,
            {
                video: { url: downloadUrl },
                caption: `*فيديو:* ${url}`,
                mimetype: 'video/mp4',
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: true,
                        mediaType: 2,
                        mediaUrl: url,
                        title: "الفيديو الخاص بك",
                        body: "تم تحميل الفيديو بنجاح",
                        thumbnail: await (await conn.getFile(thumbnail)).data,
                    }
                }
            },
            { quoted: m }
        );
        await m.react('✅');
    } catch (error) {
        await conn.sendMessage(m.chat, { text: '> *\`『 ايرور جرب مره تاني ❌ 』\`* ' }, { quoted: m });
    }
}

// إرسال الصوت
async function sendAudio(url, thumbnail, m, conn) {
    try {
        await m.react('🕓'); // التفاعل عند البداية
        const downloadUrl = await downloadMedia(url);
        await conn.sendMessage(
            m.chat,
            {
                audio: { url: downloadUrl },
                mimetype: 'audio/mpeg',
                fileName: 'download.mp3',
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: true,
                        mediaType: 2,
                        mediaUrl: url,
                        title: "الصوت الخاص بك",
                        body: "تم تحميل الصوت بنجاح",
                        thumbnail: await (await conn.getFile(thumbnail)).data,
                    }
                }
            },
            { quoted: m }
        );
        await m.react('✅');
    } catch (error) {
        await conn.sendMessage(m.chat, { text: '> *\`『 ايرور جرب مره تاني ❌ 』\`*' }, { quoted: m });
    }
}


async function downloadMedia(url) {
    const apiUrl = `${apiBaseUrl}/download.php?format=mp3&url=${encodeURIComponent(url)}&api=${apiKey}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data && data.success) {
            return await checkProgress(data.id);
        }
        throw new Error('فشل الحصول على تفاصيل الفيديو.');
    } catch (error) {
        throw new Error(`خطأ أثناء التنزيل: ${error.message}`);
    }
}

// متابعة تقدم التحميل
async function checkProgress(id) {
    const progressUrl = `${apiBaseUrl}/progress.php?id=${id}`;
    while (true) {
        const response = await fetch(progressUrl);
        const data = await response.json();
        if (data && data.success && data.progress === 1000) {
            return data.download_url;
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // انتظار 2 ثانية
    }
}