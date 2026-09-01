import fs from 'fs';
import path from 'path';

let handler = async (m, { conn }) => {
  const mediaDir = './media';
  const files = fs.readdirSync(mediaDir).filter(f => f.endsWith('.txt') || f.endsWith('.json') || f.endsWith('.md'));

  let count = 0;

  for (const file of files) {
    const filePath = path.join(mediaDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    const replaced = content.replace(/https:\/\/stitch-api\.vercel\.app\/api\/v3\/upload\/view\/([a-zA-Z0-9\-_]+\.(jpg|png|gif|webp))/g,
      (match, filename) => `https://raw.githubusercontent.com/RADIOdemon6-alt/uploading-/main/uploads/${filename}`);

    if (replaced !== content) {
      fs.writeFileSync(filePath, replaced, 'utf-8');
      count++;
    }
  }

  m.reply(`✅ تم استبدال الروابط في ${count} ملف.`);
};
handler.command = ['تبديل'];
export default handler;