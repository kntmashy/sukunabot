import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const handler = async (m, { text, conn }) => {
  if (!text.includes('+') || !text.includes('=>')) {
    return m.reply(`❗ التنسيق الصحيح:\n.تعديل كود <اسم_الملف> + <السطر_القديم> => <السطر_الجديد>`);
  }

  const [fileNamePart, codePart] = text.split('+');
  const [oldLine, newLine] = codePart.split('=>').map(s => s.trim());
  const fileName = fileNamePart.trim();

  const fullPath = path.join(__dirname, '../plugins', fileName);

  if (!fs.existsSync(fullPath)) {
    return m.reply(`❌ الملف "${fileName}" غير موجود.`);
  }

  const originalContent = fs.readFileSync(fullPath, 'utf-8');

  if (!originalContent.includes(oldLine)) {
    return m.reply(`⚠️ السطر التالي غير موجود:\n\`\`\`\n${oldLine}\n\`\`\``);
  }

  // إنشاء نسخة احتياطية مضغوطة
  const compressed = zlib.gzipSync(originalContent);
  await conn.sendMessage(m.chat, {
    document: compressed,
    mimetype: 'application/gzip',
    fileName: `${fileName}.backup.gz`,
    caption: `📦 النسخة الاحتياطية من الملف قبل التعديل`,
  });

  // تعديل الكود
  const newContent = originalContent.replace(oldLine, newLine);
  fs.writeFileSync(fullPath, newContent);

  // إرسال الملف بعد التعديل
  await conn.sendMessage(m.chat, {
    document: Buffer.from(newContent, 'utf-8'),
    mimetype: 'application/javascript',
    fileName: fileName,
    caption: `✅ تم تعديل الملف "${fileName}" بنجاح!`,
  });

  // حذف الكاش
  delete import.meta.resolve?.cache?.[fullPath];
};

handler.command = ['تعديل', 'edit'];
handler.owner = true;

export default handler;