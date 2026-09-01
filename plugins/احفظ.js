import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import axios from 'axios';

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
        return { label, repo, status: 'success', sha: sha || 'created' }
      } catch (err) {
        throw new Error(`${label} (${repo}): [${err.response?.status}] ${err.response?.data?.message || err.message}`)
      }
    })
  )
}

const deleteFromGithub = async (filePath) => {
  return Promise.allSettled(
    accounts.map(async ({ token, repo, label }) => {
      try {
        const sha = await getFileSha(filePath, token, repo)
        if (!sha) return { label, repo, status: 'not_found' }
        await axios.delete(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
          headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
          data: { message: `delete ${filePath} via bot`, sha, branch: GITHUB_BRANCH }
        })
        return { label, repo, status: 'success' }
      } catch (err) {
        throw new Error(`${label} (${repo}): [${err.response?.status}] ${err.response?.data?.message || err.message}`)
      }
    })
  )
}

const handler = async (m, { text, usedPrefix, command }) => {
  if (!text) throw `〘 ❗ 〙 يرجى إدخال اسم الملف`

  const q = m.quoted || m
  const mime = q.mimetype || ''
  const isTextMessage = q.text
  const path = `plugins/${text}.js`
  let fileContent = ''

  switch (command) {
    case 'احفظ':
      if (!q || (!isTextMessage && !mime)) throw `〘 ❗ 〙 يرجى الرد على رسالة نصية أو مستند ليتم حفظه كملف`
      try {
        if (isTextMessage) {
          fileContent = isTextMessage.trim()
          if (!fileContent) throw `〘 ❗ 〙 النص المستلم فارغ.`
        } else if (mime === 'application/javascript') {
          const buffer = await q.download()
          fileContent = buffer.toString('utf8')
          if (!fileContent.trim()) throw `〘 ❗ 〙 الملف المرفق فارغ أو لا يحتوي على نصوص صالحة.`
        } else {
          throw `〘 ❗ 〙 الملف المرفق غير مدعوم.`
        }
        fs.writeFileSync(path, fileContent, 'utf8')
        const results = await saveToGithub(path, fileContent)
        const failed = results.filter(r => r.status === 'rejected')
        const success = results.filter(r => r.status === 'fulfilled')
        let msg = `〘 ✅ 〙 تم حفظ الملف محلياً: "${path}"\n`
        msg += `✅ تم الرفع على ${success.length} حساب\n`
        if (failed.length) msg += `\n〘 ⚠️ 〙 فشل الرفع على ${failed.length} حساب:\n${failed.map(f => f.reason.message).join('\n')}`
        m.reply(msg)
      } catch (error) {
        throw `〘 ❗ 〙 حدث خطأ: ${error.message || error}`
      }
      break

    case 'امسح':
      if (!fs.existsSync(path)) throw `〘 ❗ 〙 الملف "${path}" غير موجود لحذفه`
      try {
        fs.unlinkSync(path)
        const results = await deleteFromGithub(path)
        const failed = results.filter(r => r.status === 'rejected')
        const success = results.filter(r => r.status === 'fulfilled' || r.value?.status === 'not_found')
        let msg = `〘 ✅ 〙 تم حذف الملف محلياً: "${path}"\n`
        msg += `✅ تم الحذف من ${success.length} حساب\n`
        if (failed.length) msg += `\n〘 ⚠️ 〙 فشل الحذف من ${failed.length} حساب:\n${failed.map(f => f.reason.message).join('\n')}`
        m.reply(msg)
      } catch (error) {
        throw `〘 ❗ 〙 حدث خطأ أثناء الحذف: ${error.message || error}`
      }
      break

    default:
      throw `〘 ❗ 〙 الأمر غير معروف\nاستخدم:\n- ${usedPrefix}احفظ\n- ${usedPrefix}امسح`
  }
}

handler.help = ['احفظ', 'امسح']
handler.tags = ['owner']
handler.command = ['احفظ', 'امسح']
handler.owner = true

export default handler;