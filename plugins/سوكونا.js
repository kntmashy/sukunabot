import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const GROQ_KEY = "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";

async function askAI(question) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: `أنت "سكونا" شخصية قوية شريرة.
ردودك قصيرة جداً (جملة أو اتنين بالحد الأقصى)، عربية فصحى بسيطة، فيها سخرية وهيبة.
لا تقول أنك AI. لا تستخدم رموز أو إيموجي.`,
        },
        { role: "user", content: question },
      ],
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "...";
}

async function textToSpeech(text) {
  const ts = Date.now();
  const wavFile = path.join('/tmp', `voice_${ts}.wav`);
  const oggFile = path.join('/tmp', `voice_${ts}.ogg`);

  // جيب الـ WAV من Groq
  const res = await fetch("https://api.groq.com/openai/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "canopylabs/orpheus-arabic-saudi",
      input: text,
      voice: "fahad",
      response_format: "wav",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[فويس] TTS error:', err);
    throw new Error(`TTS فشل: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(wavFile, buffer);
  console.log('[فويس] WAV size:', fs.statSync(wavFile).size);

  // حوّل WAV لـ OGG Opus باستخدام ffmpeg
  await execAsync(`ffmpeg -i ${wavFile} -c:a libopus -b:a 64k -ar 48000 ${oggFile}`, { timeout: 30000 });

  if (!fs.existsSync(oggFile) || fs.statSync(oggFile).size < 1000) {
    throw new Error('فشل تحويل الصوت');
  }

  console.log('[فويس] OGG size:', fs.statSync(oggFile).size);

  // امسح الـ WAV
  try { fs.unlinkSync(wavFile); } catch {}

  return oggFile;
}

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply("اكتب سؤالك يا ضعيف 😈");

  await m.react('⛩️');
  await m.reply("⛩️ جاري تحويل كلامك لصوت الملك...");

  let tmpFile = null;
  try {
    const reply = await askAI(text);
    console.log('[فويس] AI reply:', reply);

    tmpFile = await textToSpeech(reply);

    const audioBuffer = fs.readFileSync(tmpFile);
    await conn.sendMessage(m.chat, {
      audio: audioBuffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true,
    }, { quoted: m });

    await m.react('✅');

  } catch (e) {
    console.error('[فويس]', e.message);
    await m.react('❌');
    m.reply(`❌ فشل: ${e.message}`);
  } finally {
    try { if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
  }
};

handler.command = /^(فويس|voice|صوت)$/i;
export default handler;