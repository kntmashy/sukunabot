import fs from 'fs';
import path from 'path';
import axios from 'axios';

const allowedNumbers = ['201036547166@s.whatsapp.net', '201016855501@s.whatsapp.net'];

const GITHUB_TOKEN_1 = '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'
const GITHUB_REPO_1 = 'mohabhita/sukunabot'
const GITHUB_TOKEN_2 = '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'
const GITHUB_REPO_2 = 'hangermazen/SukunaBot'
const GITHUB_TOKEN_3 = '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'
const GITHUB_REPO_3 = 'mohab3mk/sukunabot'
const GITHUB_TOKEN_4 = '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'
const GITHUB_REPO_4 = 'ymatikonhach/Sukunabot'
const GITHUB_BRANCH = 'main'

const accounts = [
  { token: GITHUB_TOKEN_1, repo: GITHUB_REPO_1, label: 'الحساب الأول' },
  { token: GITHUB_TOKEN_2, repo: GITHUB_REPO_2, label: 'الحساب الثاني' },
  { token: GITHUB_TOKEN_3, repo: GITHUB_REPO_3, label: 'الحساب الثالث' },
  { token: GITHUB_TOKEN_4, repo: GITHUB_REPO_4, label: 'الحساب الرابع' }
]

const getFileSha = async (filePath, token, repo) => {
  try {
    const res = await axios.get(
      `https://api.github.com/repos/${repo}/contents/${filePath}`,
      { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }, params: { ref: GITHUB_BRANCH } }
    )
    return res.data.sha
  } catch (err) {
    if (err.response?.status === 404) return null
    throw err
  }
}

const saveToGithub = async (filePath, content) => {
  return Promise.allSettled(
    accounts.map(async ({ token, repo, label }) => {
      try {
        const sha = await getFileSha(filePath, token, repo)
        const body = {
          message: sha ? `update ${filePath} via bot` : `create ${filePath} via bot`,
          content: Buffer.from(content).toString('base64'),
          branch: GITHUB_BRANCH
        }
        if (sha) body.sha = sha
        await axios.put(`https://api.github.com/repos/${repo}/contents/${filePath}`, body, {
          headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
        })
        return { label, repo, status: 'success' }
      } catch (err) {
        throw new Error(`${label} (${repo}): [${err.response?.status}] ${err.response?.data?.message || err.message}`)
      }
    })
  )
}

const handler = async (m, { conn, text }) => {
  if (!allowedNumbers.includes(m.sender)) {
    return conn.sendMessage(m.chat, { text: `❌ غير مسموح لك باستخدام هذا الأمر، يا عبد 🩸` }, { quoted: m });
  }

  const q = m.quoted
  const newCode = text?.trim()

  if (!q || !newCode) {
    return m.reply(
      '⚠️ *طريقة الاستخدام:*\n\n' +
      '1️⃣ ابعت الكود القديم كرسالة\n' +
      '2️⃣ رد عليه بـ `.بدل` وبعدها الكود الجديد\n\n' +
      'مثال:\n`.بدل <الكود الجديد هنا>`'
    )
  }

  const oldCode = (q.text || q.body || '').trim()
  if (!oldCode) return m.reply('❌ الرسالة المردود عليها فارغة أو مش نص!')

  await m.react('⏳')

  const basePath = 'plugins'
  const files = fs.readdirSync(basePath).filter(f => f.endsWith('.js'))
  let changedFiles = [], errors = [], githubErrors = []

  for (const file of files) {
    const filePath = path.join(basePath, file)
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      if (content.includes(oldCode)) {
        const newContent = content.split(oldCode).join(newCode)
        fs.writeFileSync(filePath, newContent, 'utf-8')
        changedFiles.push(file)
        try {
          const results = await saveToGithub(filePath, newContent)
          const failed = results.filter(r => r.status === 'rejected')
          if (failed.length) githubErrors.push({ file, errors: failed.map(f => f.reason.message).join('; ') })
        } catch (e) {
          githubErrors.push({ file, error: e.message })
        }
      }
    } catch (e) {
      errors.push({ file, error: e.message })
    }
  }

  let message = changedFiles.length === 0
    ? `⚠️ *لم يتم العثور على الكود القديم في أي ملف.*`
    : `✅ *تم الاستبدال بنجاح*\n\n📁 *عدد الملفات المعدلة:* ${changedFiles.length}\n\n📄 *الملفات:*\n${changedFiles.map((f,i) => `${i+1}️⃣ ${f}`).join('\n')}`

  if (githubErrors.length) message += `\n\n⚠️ *أخطاء GitHub:*\n${githubErrors.map(e => `- ${e.file}: ${e.errors||e.error}`).join('\n')}`
  else if (changedFiles.length) message += `\n\n☁️ *تم رفع التعديلات إلى GitHub (4 حسابات) بنجاح!*`

  await m.react('✅')
  await m.reply(message)
}

handler.help = ['بدل']
handler.tags = ['owner']
handler.command = /^بدل$/i

export default handler;