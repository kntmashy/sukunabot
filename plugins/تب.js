import fs from 'fs';
import path from 'path';

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const pluginDir = './plugins'; // مجلد البلوجنات
  const language = 'javascript'; // لأن كل البلوجنات مكتوبة بجافاسكربت غالبًا

  try {
    const files = fs.readdirSync(pluginDir).filter(file => file.endsWith('.js'));
    if (files.length === 0) return m.reply('🧞 لا يوجد أي بلوجنات للتنفيذ.');

    m.reply(`🧞 جاري تنفيذ جميع بلوجنات البوت (${files.length} ملف)...\nقد يستغرق ذلك بعض الوقت...`);

    for (const file of files) {
      const filePath = path.join(pluginDir, file);
      const code = fs.readFileSync(filePath, 'utf-8');

      try {
        const output = await Execute(code, language);
        m.reply(`🧞 *[ ${file} ]*\n${output || 'لا يوجد مخرجات'}\n`);
      } catch (err) {
        m.reply(`🧞 خطأ في الملف ${file}:\n${err}`);
      }
    }

    m.reply('🧞 تم تنفيذ جميع الأكواد بنجاح.');

  } catch (err) {
    m.reply(`🧞 خطأ في قراءة ملفات البلوجن:\n${err.message}`);
  }
};

handler.help = ['تشغيل_البلوجنات'];
handler.command = ['تب'];
handler.tags = ['tools'];

export default handler;