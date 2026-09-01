import fs from 'fs';
import path from 'path';
import axios from 'axios';

const allowedNumbers = ['201036547166@s.whatsapp.net', '201016855501@s.whatsapp.net'];

// ══════════════════════════════════════════
// 🔑 إعدادات GitHub - الحسابين
// ══════════════════════════════════════════
const GITHUB_TOKEN_1 = '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'
const GITHUB_REPO_1 = 'mohabhita/sukunabot'

const GITHUB_TOKEN_2 = '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'
const GITHUB_REPO_2 = 'hangermazen/SukunaBot'

const GITHUB_BRANCH = 'main'

const accounts = [
  { token: GITHUB_TOKEN_1, repo: GITHUB_REPO_1, label: 'الحساب الأول' },
  { token: GITHUB_TOKEN_2, repo: GITHUB_REPO_2, label: 'الحساب الثاني' }
]

// ══════════════════════════════════════════
// 📁 دوال GitHub
// ══════════════════════════════════════════
const getFileSha = async (filePath, token, repo) => {
  try {
    const res = await axios.get(
      `https://api.github.com/repos/${repo}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        },
        params: { ref: GITHUB_BRANCH }
      }
    )
    return res.data.sha
  } catch (err) {
    if (err.response?.status === 404) return null
    throw err
  }
}

const saveToGithub = async (filePath, content) => {
  const results = await Promise.allSettled(
    accounts.map(async ({ token, repo, label }) => {
      try {
        const sha = await getFileSha(filePath, token, repo)
        const body = {
          message: sha ? `update ${filePath} via bot` : `create ${filePath} via bot`,
          content: Buffer.from(content).toString('base64'),
          branch: GITHUB_BRANCH
        }
        if (sha) body.sha = sha

        await axios.put(
          `https://api.github.com/repos/${repo}/contents/${filePath}`,
          body,
          {
            headers: {
              Authorization: `token ${token}`,
              Accept: 'application/vnd.github.v3+json'
            }
          }
        )
        return { label, repo, status: 'success' }
      } catch (err) {
        const status = err.response?.status
        const msg = err.response?.data?.message || err.message
        throw new Error(`${label} (${repo}): [${status}] ${msg}`)
      }
    })
  )
  return results
}

// ══════════════════════════════════════════
// 🎮 الأمر
// ══════════════════════════════════════════
const handler = async (m, { conn, text }) => {
  if (!allowedNumbers.includes(m.sender)) {
    await conn.sendMessage(m.chat, { text: `❌ غير مسموح لك باستخدام هذا الأمر، يا عبد 🩸` }, { quoted: m });
    return;
  }

  if (!text || !text.includes('|')) {
    await conn.sendMessage(m.chat, {
      text: '⚠️ يرجى كتابة الأمر بالشكل التالي:\n\n`.بدل الكلمة_القديمة|الكلمة_الجديدة`'
    }, { quoted: m });
    return;
  }

  const [oldWord, newWord] = text.split('|').map(s => s.trim());

  if (!oldWord || !newWord) {
    await conn.sendMessage(m.chat, {
      text: '⚠️ تأكد من أنك أدخلت الكلمتين بشكل صحيح (قديم|جديد).'
    }, { quoted: m });
    return;
  }

  await m.react('⏳');

  const basePath = 'plugins';
  const files = fs.readdirSync(basePath).filter(file => file.endsWith('.js'));
  let changedFiles = [];
  let errors = [];
  let githubErrors = [];

  for (let file of files) {
    const filePath = path.join(basePath, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes(oldWord)) {
        const newContent = content.split(oldWord).join(newWord);
        
        // 1️⃣ حفظ محلياً
        fs.writeFileSync(filePath, newContent, 'utf-8');
        changedFiles.push(file);
        
        // 2️⃣ رفع التغيير إلى GitHub (الحسابين)
        try {
          const results = await saveToGithub(filePath, newContent);
          const failed = results.filter(r => r.status === 'rejected');
          if (failed.length > 0) {
            githubErrors.push({ 
              file, 
              errors: failed.map(f => f.reason.message).join('; ')
            });
          }
        } catch (gitErr) {
          githubErrors.push({ file, error: gitErr.message });
        }
      }
    } catch (err) {
      errors.push({ file, error: err.message });
    }
  }

  // بناء رسالة النتيجة
  let message = `✅ *تم استبدال "${oldWord}" بـ "${newWord}"*\n\n`;
  message += `📁 *عدد الملفات المعدلة:* ${changedFiles.length}\n\n`;
  
  if (changedFiles.length > 0) {
    message += `📄 *الملفات المعدلة:*\n`;
    changedFiles.forEach((file, i) => {
      message += `${i + 1}️⃣ ${file}\n`;
    });
    message += `\n`;
  }

  if (errors.length > 0) {
    message += `⚠️ *أخطاء محلية:*\n`;
    errors.forEach(({ file, error }) => {
      message += `- ${file}: ${error}\n`;
    });
    message += `\n`;
  }

  if (githubErrors.length > 0) {
    message += `⚠️ *أخطاء في GitHub:*\n`;
    githubErrors.forEach(({ file, errors }) => {
      message += `- ${file}: ${errors || 'فشل الرفع'}\n`;
    });
    message += `\n`;
  }

  if (changedFiles.length > 0 && githubErrors.length === 0) {
    message += `☁️ *تم رفع التعديلات إلى GitHub (الحسابين) بنجاح!*`;
  } else if (changedFiles.length === 0) {
    message += `⚠️ *لم يتم العثور على "${oldWord}" في أي ملف.*`;
  }

  await m.react('✅');
  await conn.sendMessage(m.chat, { text: message }, { quoted: m });
};

handler.help = ['بدل *<قديم>|<جديد>*'];
handler.tags = ['owner'];
handler.command = /^بدل$/i;

export default handler;