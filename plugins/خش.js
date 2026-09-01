// plugins/join-group.js
/**
 * زر .خش <رابط_الجروب|كود_الدعوة>
 * نسخة احترافية: Retry up to 5, logging, verification, smart handling of already-exists
 * - يحاول عدة واجهات للانضمام (groupAcceptInviteV4, groupAcceptInvite, acceptGroupInvite...)
 * - يتحقق قبل الانضمام إذا البوت داخل نفس الجروب
 * - يعيد المحاولة تلقائيًا مع exponential backoff
 * - يسجل كل محاولة في ملف data/join-attempts.json
 * - يبلّغ المستخدم بالخطوات والنتيجة النهائية
 *
 * حفظ: plugins/join-group.js
 */

import fs from 'fs';
import path from 'path';

const INVITE_RE = /(?:https?:\/\/)?(?:chat\.whatsapp\.com\/|whatsapp(?:\.com)?\/invite\/)?([0-9A-Za-z_-]{15,})/i;
const WELCOME_IMAGE_PATH = path.join(process.cwd(), 'media', 'welcome.jpg');
const DATA_DIR = path.join(process.cwd(), 'data');
const LOG_FILE = path.join(DATA_DIR, 'join-attempts.json');

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000; // backoff base (2s)

async function ensureData() {
  try { await fs.promises.mkdir(DATA_DIR, { recursive: true }); }
  catch (e) {}
  if (!fs.existsSync(LOG_FILE)) {
    try { fs.writeFileSync(LOG_FILE, JSON.stringify([])); } catch (e) {}
  }
}

function recordAttempt(entry) {
  try {
    const raw = fs.readFileSync(LOG_FILE, 'utf8');
    const arr = JSON.parse(raw || '[]');
    arr.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(arr, null, 2));
  } catch (e) {
    console.error('join-group log error:', e);
  }
}

function normalizeToGjid(idOrJid) {
  if (!idOrJid) return null;
  if (idOrJid.endsWith('@g.us')) return idOrJid;
  if (/^[0-9A-Za-z_-]{15,}$/.test(idOrJid)) return `${idOrJid}@g.us`;
  return idOrJid;
}

async function tryInviteInfo(conn, inviteCode) {
  const methods = ['groupInviteInfo', 'groupGetInviteInfo', 'groupQueryInvite', 'queryGroupInvite'];
  for (const m of methods) {
    try {
      if (typeof conn[m] === 'function') {
        const r = await conn[m](inviteCode).catch(()=>null);
        if (!r) continue;
        if (typeof r === 'string') return normalizeToGjid(r);
        if (r?.id) return normalizeToGjid(r.id);
        if (r?.jid) return normalizeToGjid(r.jid);
        if (r?.groupJid) return normalizeToGjid(r.groupJid);
        if (r?.groupId) return normalizeToGjid(r.groupId);
        if (Array.isArray(r) && r[0]) {
          const v = r[0];
          if (v?.id) return normalizeToGjid(v.id);
          if (v?.jid) return normalizeToGjid(v.jid);
        }
      }
    } catch (e) {
      // ignore and try next
    }
  }
  return null;
}

async function tryAcceptInvite(conn, inviteCode) {
  const methods = ['groupAcceptInviteV4', 'groupAcceptInvite', 'acceptGroupInvite', 'acceptInvite', 'groupAcceptInviteV3'];
  let lastErr = null;
  for (const m of methods) {
    try {
      if (typeof conn[m] === 'function') {
        const res = await conn[m](inviteCode).catch(err => { throw err; });
        if (!res) continue;
        if (typeof res === 'string') return { jid: normalizeToGjid(res), raw: res, method: m };
        if (res?.gid) return { jid: normalizeToGjid(res.gid), raw: res, method: m };
        if (res?.id) return { jid: normalizeToGjid(res.id), raw: res, method: m };
        if (res?.groupJid) return { jid: normalizeToGjid(res.groupJid), raw: res, method: m };
        if (res?.groupId) return { jid: normalizeToGjid(res.groupId), raw: res, method: m };
        if (res?.groups && Array.isArray(res.groups) && res.groups[0]) {
          return { jid: normalizeToGjid(res.groups[0]), raw: res, method: m };
        }
        // try to extract any string containing @g.us
        try {
          const s = JSON.stringify(res);
          const mfind = s.match(/([0-9]{4,}@g\.us)/);
          if (mfind) return { jid: mfind[1], raw: res, method: m };
        } catch {}
        return { raw: res, method: m }; // unknown shape
      }
    } catch (e) {
      lastErr = e;
      const msg = (e && e.message) ? e.message : String(e);
      if (msg.includes('already-exists') || msg.includes('already exists')) {
        const ex = new Error('already-exists');
        ex.original = e;
        throw ex;
      }
      // continue trying other methods
    }
  }
  if (lastErr) throw lastErr;
  return null;
}

async function isBotInGroup(conn, groupJid) {
  try {
    // try several metadata fetchers
    const methods = ['groupMetadata', 'fetchGroupMetadata', 'groupFetchAllParticipating', 'groupFetchMetadata'];
    const botJid = conn.user?.id || conn.user?.jid || (conn?.user && conn.user.id) || null;
    for (const m of methods) {
      try {
        if (typeof conn[m] === 'function') {
          const meta = await conn[m](groupJid).catch(()=>null);
          if (!meta) continue;
          const participants = meta?.participants || meta?.participant || meta?.participants || null;
          if (Array.isArray(participants)) {
            for (const p of participants) {
              const id = typeof p === 'string' ? p : (p?.id || p?.jid || p?.participant || null);
              if (!id) continue;
              if (!botJid) {
                // best-effort: if our number substring exists
                if (conn.user && (id.includes(conn.user.id || '') || (conn.user.id || '').includes(id))) return true;
              } else {
                if (id === botJid || id.includes(botJid) || botJid.includes(id)) return true;
              }
            }
          }
          // some metadata shape contains 'participants' as objects
        }
      } catch (e) { /* ignore */ }
    }

    // fallback: check chats or conn.chats map
    try {
      if (conn.chats && (conn.chats.has && conn.chats.has(groupJid))) return true;
      if (conn.store && conn.store.chats && conn.store.chats[groupJid]) return true;
    } catch (e) {}
  } catch (e) {}
  return false;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const handler = async (m, { conn, text }) => {
  await ensureData();
  const startedAt = new Date().toISOString();
  const requester = m.sender || '';

  try {
    if (!text || !text.trim()) {
      await conn.sendMessage(m.chat, { text: '✳️ أرسل رابط الدعوة أو كودها بعد الأمر.\nمثال: `.خش https://chat.whatsapp.com/AbCdEfGhIjKlMnO`' }, { quoted: m });
      return;
    }

    const match = text.trim().match(INVITE_RE);
    if (!match) {
      await conn.sendMessage(m.chat, { text: '❌ لم أتمكن من استخراج كود الدعوة من النص. تأكد من الرابط وحاول مجددًا.' }, { quoted: m });
      return;
    }

    const inviteCode = match[1];
    await conn.sendMessage(m.chat, { text: '⏳ سوكونا يفحص الرابط ويبدأ المحاولات — لا تفسد مزاجه 😉' }, { quoted: m });

    // log entry starter
    const logBase = { time: startedAt, requester, inviteCode, attempts: [] };

    // 1) Try to get invite info first (may include groupJid)
    let inviteInfoJid = null;
    try {
      inviteInfoJid = await tryInviteInfo(conn, inviteCode);
    } catch (e) {
      inviteInfoJid = null;
    }

    if (inviteInfoJid) {
      const present = await isBotInGroup(conn, inviteInfoJid);
      if (present) {
        await conn.sendMessage(m.chat, { text: '⚠️ البوت موجود بالفعل في الجروب (تحققت من معلومات الدعوة).' }, { quoted: m });
        recordAttempt({ ...logBase, result: 'already-in-group', inviteInfoJid });
        return;
      }
    }

    // attempts loop with backoff
    let joinedJid = null;
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const attemptEntry = { attempt, time: new Date().toISOString(), status: 'started' };
      try {
        const res = await tryAcceptInvite(conn, inviteCode);
        attemptEntry.res = res;
        attemptEntry.status = 'accepted';
        if (res && res.jid) joinedJid = res.jid;
        // if no jid but inviteInfoJid exists, use it
        if (!joinedJid && inviteInfoJid) joinedJid = inviteInfoJid;
        // verify presence
        const inGroup = joinedJid ? await isBotInGroup(conn, joinedJid) : false;
        if (inGroup) {
          attemptEntry.status = 'confirmed-in-group';
          logBase.attempts.push(attemptEntry);
          recordAttempt({ ...logBase, result: 'joined', joinedJid });
          // send welcome inside group
          const welcomeText = 'تم اضافه العظمه فجروبك';
          try {
            if (fs.existsSync(WELCOME_IMAGE_PATH)) {
              const img = fs.readFileSync(WELCOME_IMAGE_PATH);
              await conn.sendMessage(joinedJid, { image: img, caption: welcomeText });
            } else {
              await conn.sendMessage(joinedJid, { text: welcomeText });
            }
          } catch (e) {
            // joined but cannot send message
            console.error('post-join send error:', e);
          }
          await conn.sendMessage(m.chat, { text: '✅ تم الانضمام والتأكيد — تم إضافة العظمة فجروبك.' }, { quoted: m });
          return;
        } else {
          // maybe accepted but not yet reflected — wait then retry
          attemptEntry.status = 'accepted-not-confirmed';
          logBase.attempts.push(attemptEntry);
          recordAttempt({ ...logBase, result: 'accepted-not-confirmed', joinedJid: joinedJid || null });
          // wait small time and re-check
          await sleep(1200 + attempt * 500);
          const recheck = joinedJid ? await isBotInGroup(conn, joinedJid) : false;
          if (recheck) {
            await conn.sendMessage(m.chat, { text: '✅ تم الانضمام والتأكيد بعد انتظار قصير.' }, { quoted: m });
            return;
          }
        }
      } catch (e) {
        lastError = e;
        const emsg = (e && e.message) ? e.message : String(e);
        attemptEntry.error = emsg;
        attemptEntry.status = 'error';
        logBase.attempts.push(attemptEntry);
        // special handling for already-exists
        if (emsg.includes('already-exists') || emsg.includes('already exists')) {
          // If already-exists, check inviteInfoJid and presence again
          if (!inviteInfoJid) {
            try { inviteInfoJid = await tryInviteInfo(conn, inviteCode); } catch {}
          }
          if (inviteInfoJid) {
            const present2 = await isBotInGroup(conn, inviteInfoJid);
            if (present2) {
              recordAttempt({ ...logBase, result: 'already-in-group-check', inviteInfoJid });
              await conn.sendMessage(m.chat, { text: '⚠️ البوت موجود بالفعل في الجروب (بعد فحص إضافي).' }, { quoted: m });
              return;
            } else {
              // used invite but bot not in group => present ambiguous state
              recordAttempt({ ...logBase, result: 'already-exists-but-not-in-group', inviteInfoJid });
              await conn.sendMessage(m.chat, {
                text: '❌ الدعوة مستخدمة سابقًا لكني لست داخل الجروب. الحل: اطلب من أدمن الجروب إضافة البوت يدويًا أو أرسل رابط دعوة جديد.' 
              }, { quoted: m });
              return;
            }
          } else {
            recordAttempt({ ...logBase, result: 'already-exists-no-info' });
            await conn.sendMessage(m.chat, {
              text: '❌ الدعوة مستخدمة سابقًا (already-exists) ولم أتمكن من الحصول على معلومات إضافية. أرسل رابط دعوة جديد أو اطلب إضافة البوت يدويًا.' 
            }, { quoted: m });
            return;
          }
        } else {
          // other error: retry with backoff until max
          const delay = BASE_DELAY_MS * Math.pow(1.7, attempt);
          await conn.sendMessage(m.chat, { text: `⚠️ محاولة ${attempt} فشلت: ${emsg}\n⏳ سأحاول مجددًا بعد ${Math.round(delay/1000)} ثانية.` }, { quoted: m });
          await sleep(delay);
          continue;
        }
      }
    } // end loop attempts

    // if reached here => all attempts exhausted
    recordAttempt({ ...logBase, result: 'failed-after-retries', lastError: (lastError && (lastError.message || String(lastError))) || null });
    await conn.sendMessage(m.chat, {
      text: `❌ استنزفت كل المحاولات (${MAX_RETRIES}) ولم أتمكن من الانضمام. التفاصيل سُجلت.\n\nالحلول المقترحة:\n1) اطلب من أدمن الجروب إضافة البوت يدويًا.\n2) أرسل لي رابط دعوة جديد وغير مستخدم.\n3) تحقق أن الرابط صالح ولم ينتهي.\n\nلو عايز، أبلغك أنا المالك بنتيجة اللوج؟ اكتب: .ابلاغ` 
    }, { quoted: m });

  } catch (err) {
    console.error('Join command unexpected error:', err);
    recordAttempt({ time: new Date().toISOString(), requester: m.sender, inviteCode: (text||'').trim(), result: 'fatal-error', error: (err && (err.message || String(err))) });
    await conn.sendMessage(m.chat, { text: `❌ حدث خطأ غير متوقع أثناء تنفيذ الأمر:\n${(err && err.message) ? err.message : String(err)}` }, { quoted: m });
  }
};

handler.help = ['خش <رابط_الجروب>'];
handler.tags = ['group'];
handler.command = /^خش$/i;

export default handler;