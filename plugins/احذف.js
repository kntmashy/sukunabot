import fs from 'fs';
import path from 'path';
import axios from 'axios';

const allowedNumbers = ['201036547166@s.whatsapp.net', '201016855501@s.whatsapp.net'];

const GITHUB_TOKEN_1 = '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';
const GITHUB_REPO_1  = 'mohabhita/sukunabot';
const GITHUB_TOKEN_2 = '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';
const GITHUB_REPO_2  = 'hangermazen/SukunaBot';
const GITHUB_BRANCH  = 'main';

const accounts = [
  { token: GITHUB_TOKEN_1, repo: GITHUB_REPO_1, label: 'الحساب الأول' },
  { token: GITHUB_TOKEN_2, repo: GITHUB_REPO_2, label: 'الحساب الثاني' }
];

const getFileSha = async (filePath, token, repo) => {
  try {
    const res = await axios.get(
      `https://api.github.com/repos/${repo}/contents/${filePath}`,
      {
        headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
        params: { ref: GITHUB_BRANCH }
      }
    );
    return res.data.sha;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

const saveToGithub = async (filePath, content) => {
  return Promise.allSettled(
    accounts.map(async ({ token, repo, label }) => {
      const sha  = await getFileSha(filePath, token, repo);
      const body = {
        message: sha ? `update ${filePath} via bot` : `create ${filePath} via bot`,
        content: Buffer.from(content).toString('base64'),
        branch:  GITHUB_BRANCH
      };
      if (sha) body.sha = sha;
      await axios.put(
        `https://api.github.com/repos/${repo}/contents/${filePath}`,
        body,
        { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
      );
      return { label, status: 'success' };
    })
  );
};

const handler = async (m, { conn, text }) => {
  if (!allowedNumbers.includes(m.sender)) {
    return conn.sendMessage(m.chat, { text: '❌ غير مسموح لك باستخدام هذا الأمر 🩸' }, { quoted: m });
  }

  const word = (text || '').trim();
  if (!word) {
    return conn.sendMessage(m.chat, {
      text: '⚠️ اكتب الكلمة اللي عايز تحذفها:\n\n`.احذف gojobot`'
    }, { quoted: m });
  }

  await m.react('⏳');

  const basePath    = 'plugins';
  const files       = fs.readdirSync(basePath).filter(f => f.endsWith('.js'));
  const changed     = [];
  const errors      = [];
  const githubErrs  = [];

  for (const file of files) {
    const filePath = path.join(basePath, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes(word)) {
        const newContent = content.split(word).join('');
        fs.writeFileSync(filePath, newContent, 'utf-8');
        changed.push(file);

        const results = await saveToGithub(filePath, newContent);
        const failed  = results.filter(r => r.status === 'rejected');
        if (failed.length) {
          githubErrs.push({ file, errors: failed.map(f => f.reason?.message).join('; ') });
        }
      }
    } catch (e) {
      errors.push({ file, error: e.message });
    }
  }

  let msg = `🗑️ *تم حذف "${word}"*\n\n📁 *الملفات المعدلة:* ${changed.length}\n\n`;

  if (changed.length) {
    msg += `📄 *الملفات:*\n` + changed.map((f, i) => `${i + 1}. ${f}`).join('\n') + '\n\n';
  }
  if (errors.length) {
    msg += `⚠️ *أخطاء:*\n` + errors.map(e => `- ${e.file}: ${e.error}`).join('\n') + '\n\n';
  }
  if (githubErrs.length) {
    msg += `⚠️ *أخطاء GitHub:*\n` + githubErrs.map(e => `- ${e.file}: ${e.errors}`).join('\n') + '\n\n';
  }
  if (!changed.length) {
    msg += `⚠️ *لم يتم العثور على "${word}" في أي ملف.*`;
  } else if (!githubErrs.length) {
    msg += `☁️ *تم الرفع على GitHub (الحسابين) بنجاح!*`;
  }

  await m.react('✅');
  await conn.sendMessage(m.chat, { text: msg }, { quoted: m });
};

handler.help    = ['احذف <كلمة>'];
handler.tags    = ['owner'];
handler.command = /^احذف$/i;
export default handler;