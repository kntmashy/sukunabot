// plugins/لصحف.js
// امر لصق الكود من ملفات GitHub

import fetch from 'node-fetch';

const handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply(
      `📌 *طريقة الاستخدام:*\n\n` +
      `.لصحف <اسم الملف>\n\n` +
      `💡 *مثال:*\n` +
      `.لصحف احفظ`
    );
  }

  const fileName = text.trim().replace(/\.js$/, '');
  const repoOwner = 'mohabhita';
  const repoName = 'sukunabot';
  const branch = 'main';
  const filePath = `plugins/${fileName}.js`;

  try {
    const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${filePath}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`الملف "${fileName}" غير موجود`);
    }

    const code = await res.text();
    
    // قراءة المحتوى
    const message = `📄 *ملف:* ${fileName}.js\n` +
                    `📂 *المسار:* ${filePath}\n` +
                    `📊 *الحجم:* ${(code.length / 1024).toFixed(2)} KB\n\n` +
                    `\`\`\`javascript\n${code}\n\`\`\``;

    // تقسيم لو كبير
    if (code.length > 4000) {
      const chunks = [];
      for (let i = 0; i < code.length; i += 4000) {
        chunks.push(code.slice(i, i + 4000));
      }
      await m.reply(`📄 *ملف:* ${fileName}.js\n📊 *الحجم:* ${(code.length / 1024).toFixed(2)} KB\n\n${chunks[0]}`);
      for (let i = 1; i < chunks.length; i++) {
        await m.reply(`\`\`\`javascript\n${chunks[i]}\n\`\`\``);
      }
      await m.react('✅');
    } else {
      await m.reply(message);
      await m.react('✅');
    }

  } catch (error) {
    console.error('[لصحف]', error);
    await m.react('❌');
    await m.reply(`❌ *فشل جلب الملف*\n\n${error.message}`);
  }
};

handler.help = ['لصحف <اسم الملف>'];
handler.tags = ['tools'];
handler.command = /^(لصحف|lspf)$/i;

export default handler;
