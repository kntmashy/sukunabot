import fs from 'fs';
import path from 'path';

const handler = async (m, { conn, text }) => {
  if (!text) {
    await conn.sendMessage(m.chat, { text: '⚠️ يرجى إدخال الكلمة المطلوبة للبحث عنها.' }, { quoted: m });
    return;
  }

  await conn.sendMessage(m.chat, { text: '🔍 جاري البحث...' }, { quoted: m });

  const basePath = 'plugins';
  const files    = fs.readdirSync(basePath).filter(f => f.endsWith('.js'));
  const results  = [];
  const errors   = [];

  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = path.join(basePath, fileName);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines   = content.split('\n');

      lines.forEach((line, idx) => {
        if (!line.includes(text)) return;
        const trimmed = line.trim();

        // اكتشاف نوع الأمر
        const isCommand = (
          trimmed.includes('handler.command') ||
          trimmed.includes('handler.customPrefix') ||
          trimmed.includes('handler.help') ||
          trimmed.includes('audioCommands') ||
          trimmed.includes('commands') ||
          /^\s*(const|let|var)\s+\w*(command|cmd|commands)\s*=/.test(trimmed)
        );

        if (isCommand) {
          results.push({
            num: i + 1,
            fileName,
            line: idx + 1,
            content: trimmed,
          });
        }
      });
    } catch (e) {
      errors.push({ fileName, error: e.message });
    }
  }

  if (results.length > 0) {
    let msg = `✅ تم العثور على *"${text}"* في:\n\n`;
    results.forEach(({ num, fileName, line, content }) => {
      msg += `📄 *رقم:* ${num}\n📁 *الملف:* ${fileName}\n🔢 *السطر:* ${line}\n➡️ \`${content}\`\n\n`;
    });
    await conn.sendMessage(m.chat, { text: msg }, { quoted: m });
  } else {
    await conn.sendMessage(m.chat, {
      text: `❌ لم يتم العثور على *"${text}"* في أي ملف.\n\n` +
            (errors.length ? `⚠️ أخطاء:\n${errors.map(e => `- ${e.fileName}: ${e.error}`).join('\n')}` : '')
    }, { quoted: m });
  }
};

handler.help    = ['كشف <كلمة>'];
handler.tags    = ['owner'];
handler.command = /^(كشف)$/i;
handler.rowner  = true;

export default handler;