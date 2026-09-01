import fs from 'fs';

const mutedPath = './data/muted.json';
const normalizeJid = (jid) => jid?.replace(/:[\d]+@/, '@').trim() ?? '';

const loadMuted = () => {
  try { return JSON.parse(fs.readFileSync(mutedPath, 'utf8')); }
  catch { return {}; }
};

export async function all(m, { conn }) {
  if (!m.chat?.endsWith('@g.us')) return;
  if (m.isBaileys) return;
  if (m.fromMe) return;

  const senderJid = normalizeJid(m.sender);
  if (!senderJid) return;

  const muted = loadMuted();
  const mutedInGroup = (muted[m.chat] || []).map(normalizeJid);
  if (!mutedInGroup.includes(senderJid)) return;

  try {
    await conn.sendMessage(m.chat, { delete: m.key });
  } catch (e) {
    console.error('autoDelete error:', e.message);
  }
}

const handler = async () => {};
handler.command = [];

export default handler;