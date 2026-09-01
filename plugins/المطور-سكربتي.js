import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec); // ✅ حولنا exec لـ promise عشان يشتغل مع async/await

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const handler = async (m, { conn }) => {
    // ✅ عرّفنا initialMessage برا الـ try عشان تكون متاحة في الـ catch
    let statusMsg = null;

    try {
        const botFolderPath = path.join(__dirname, '../');
        const zipFilePath   = path.join(__dirname, '../bot_files.zip');

        // ── رسالة أولى ──
        statusMsg = await conn.sendMessage(m.chat, { text: `📂 جاري قراءة ملفات البوت...` }, { quoted: m });

        const files = fs.readdirSync(botFolderPath);
        if (files.length === 0) {
            return conn.sendMessage(m.chat, { text: `⚠️ لا توجد ملفات لضغطها.`, edit: statusMsg.key });
        }

        // ── تحديث الرسالة ──
        await conn.sendMessage(m.chat, {
            text: `🔄 تم العثور على ${files.length} ملف/مجلد. جاري الضغط...`,
            edit: statusMsg.key
        });

        // ── ضغط الملفات ✅ بـ await بدل callback ──
        const zipCommand = `zip -r "${zipFilePath}" . -x ".npm/*" "node_modules/*" ".cache/*" "bot_files.zip"`;
        await execAsync(zipCommand, { cwd: botFolderPath });

        // ── التحقق من وجود الـ ZIP ──
        if (!fs.existsSync(zipFilePath)) {
            return conn.sendMessage(m.chat, { text: `❌ لم يتم إنشاء ملف ZIP.`, edit: statusMsg.key });
        }

        const zipSize = (fs.statSync(zipFilePath).size / (1024 * 1024)).toFixed(2);

        // ── إرسال الملف ──
        await conn.sendMessage(m.chat, {
            text: `✅ تم الضغط (${zipSize} MB). جاري الإرسال...`,
            edit: statusMsg.key
        });

        await conn.sendMessage(m.chat, {
            document: fs.readFileSync(zipFilePath),
            mimetype: 'application/zip',
            fileName: 'bot_files.zip'
        }, { quoted: m });

        // ── حذف الـ ZIP بعد الإرسال ──
        fs.unlinkSync(zipFilePath);

        await conn.sendMessage(m.chat, {
            text: `🗑️ تم إرسال الملف وحذفه بنجاح.`,
            edit: statusMsg.key
        });

    } catch (err) {
        console.error(`[سكربتي] خطأ:`, err.message);

        const errText = `❌ حدث خطأ: ${err.message}`;

        // ✅ لو statusMsg متعرفتش هنبعت رسالة جديدة بدل ما نحاول نعدل واحدة مش موجودة
        if (statusMsg) {
            await conn.sendMessage(m.chat, { text: errText, edit: statusMsg.key });
        } else {
            await conn.sendMessage(m.chat, { text: errText }, { quoted: m });
        }
    }
};

handler.help    = ['سكربتي'];
handler.tags    = ['owner'];
handler.command = /^(سكربتي)$/i;
handler.owner   = true;

export default handler;