import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const surahNames = [
  'الفاتحة', 'البقرة', 'آل عمران', 'النساء', 'المائدة', 'الأنعام', 'الأعراف', 'الأنفال', 'التوبة', 'يونس',
  'هود', 'يوسف', 'الرعد', 'إبراهيم', 'الحجر', 'النحل', 'الإسراء', 'الكهف', 'مريم', 'طه',
  'الأنبياء', 'الحج', 'المؤمنون', 'النور', 'الفرقان', 'الشعراء', 'النمل', 'القصص', 'العنكبوت', 'الروم',
  'لقمان', 'السجدة', 'الأحزاب', 'سبأ', 'فاطر', 'يس', 'الصافات', 'ص', 'الزمر', 'غافر',
  'فصلت', 'الشورى', 'الزخرف', 'الدخان', 'الجاثية', 'الأحقاف', 'محمد', 'الفتح', 'الحجرات', 'ق',
  'الذاريات', 'الطور', 'النجم', 'القمر', 'الرحمن', 'الواقعة', 'الحديد', 'المجادلة', 'الحشر', 'الممتحنة',
  'الصف', 'الجمعة', 'المنافقون', 'التغابن', 'الطلاق', 'التحريم', 'الملك', 'القلم', 'الحاقة', 'المعارج',
  'نوح', 'الجن', 'المزمل', 'المدثر', 'القيامة', 'الإنسان', 'المرسلات', 'النبأ', 'النازعات', 'عبس',
  'التكوير', 'الإنفطار', 'المطففين', 'الإنشقاق', 'البروج', 'الطارق', 'الأعلى', 'الغاشية', 'الفجر', 'البلد',
  'الشمس', 'الليل', 'الضحى', 'الشرح', 'التين', 'العلق', 'القدر', 'البينة', 'الزلزلة', 'العاديات',
  'القارعة', 'التكاثر', 'العصر', 'الهمزة', 'الفيل', 'قريش', 'الماعون', 'الكوثر', 'الكافرون', 'النصر',
  'المسد', 'الإخلاص', 'الفلق', 'الناس',
];

const MAX_DURATION_SECONDS = 45 * 60;
const BITRATE_BPS = 128000;
const FALLBACK_AYAH_THRESHOLD = 100;
const MAX_RANGE_SIZE = 30;

const normalizeArabic = (str = '') =>
  str
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, '')
    .trim();

const findSurahNumber = (name) => {
  const target = normalizeArabic(name);
  if (!target) return null;
  let idx = surahNames.findIndex((s) => normalizeArabic(s) === target);
  if (idx === -1) idx = surahNames.findIndex((s) => normalizeArabic(s) === normalizeArabic('ال' + name));
  if (idx === -1) idx = surahNames.findIndex((s) => normalizeArabic(s).includes(target));
  return idx === -1 ? null : idx + 1;
};

const fetchSurahText = async (surahNumber) => {
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const json = await response.json();
  if (json.code !== 200 || !json.data) throw new Error('BAD_RESPONSE');
  return json.data;
};

const fetchSurahAudio = async (surahNumber) => {
  const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/ar.alafasy`);
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const json = await response.json();
  if (json.code !== 200 || !json.data) throw new Error('BAD_RESPONSE');
  return json.data.ayahs;
};

const getFullSurahAudioUrl = (surahNumber) =>
  `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;

const getAudioDurationSeconds = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const len = res.headers.get('content-length');
    if (!len) return null;
    const bytes = parseInt(len, 10);
    if (!bytes) return null;
    return (bytes * 8) / BITRATE_BPS;
  } catch {
    return null;
  }
};

const downloadFile = async (url, destPath) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buffer);
};

const mergeAudioFiles = async (audioUrls, tag) => {
  const tmpDir = path.join(os.tmpdir(), `surah_${tag}_${Date.now()}`);
  await fs.mkdir(tmpDir, { recursive: true });

  const localFiles = [];
  for (let i = 0; i < audioUrls.length; i++) {
    const filePath = path.join(tmpDir, `part_${i}.mp3`);
    await downloadFile(audioUrls[i], filePath);
    localFiles.push(filePath);
  }

  const listFilePath = path.join(tmpDir, 'list.txt');
  const listContent = localFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n');
  await fs.writeFile(listFilePath, listContent);

  const outputPath = path.join(tmpDir, 'merged.mp3');
  await execFileAsync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFilePath, '-c', 'copy', outputPath]);

  return { outputPath, tmpDir };
};

const cleanupTmpDir = async (tmpDir) => {
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {}
};

const handler = async (m, { conn }) => {
  const rawArgs = m.text.trim().split(/\s+/).slice(1);

  if (rawArgs.length === 0) {
    m.reply('❌ الصيغة غير صحيحة.\nمثال:\n.سوره الملك\n.سوره البقره 30 60');
    return;
  }

  let fromAyah = null;
  let toAyah = null;
  let nameParts = rawArgs;

  const last = rawArgs[rawArgs.length - 1];
  const secondLast = rawArgs[rawArgs.length - 2];

  if (rawArgs.length >= 3 && /^\d+$/.test(last) && /^\d+$/.test(secondLast)) {
    fromAyah = parseInt(secondLast, 10);
    toAyah = parseInt(last, 10);
    nameParts = rawArgs.slice(0, -2);
  }

  const surahName = nameParts.join(' ');
  const surahNumber = findSurahNumber(surahName);

  if (!surahNumber) {
    m.reply(`❌ لم أتعرف على اسم السورة "${surahName}".\nمثال صحيح:\n.سوره الملك`);
    return;
  }

  try {
    const surah = await fetchSurahText(surahNumber);
    const totalAyahs = surah.numberOfAyahs;

    let isLong;
    let durationMinutes = null;

    if (fromAyah === null) {
      const durationSeconds = await getAudioDurationSeconds(getFullSurahAudioUrl(surahNumber));
      if (durationSeconds !== null) {
        durationMinutes = Math.round(durationSeconds / 60);
        isLong = durationSeconds > MAX_DURATION_SECONDS;
      } else {
        isLong = totalAyahs > FALLBACK_AYAH_THRESHOLD;
      }
    } else {
      isLong = false;
    }

    if (isLong && fromAyah === null) {
      const durationNote = durationMinutes !== null ? ` (مدة التلاوة كاملة تقريباً ${durationMinutes} دقيقة)` : '';
      m.reply(
        `📖 سورة *${surahNames[surahNumber - 1]}*${durationNote} صوتها طويل جداً (أكتر من 45 دقيقة).\n` +
        `اختار أي نطاق آيات (مش لازم يبدأ من 1)، بصيغة:\n` +
        `\`.سوره ${surahNames[surahNumber - 1]} <من آية> <إلى آية>\`\n` +
        `أمثلة: \`.سوره ${surahNames[surahNumber - 1]} 1 30\` أو \`.سوره ${surahNames[surahNumber - 1]} 30 60\`\n` +
        `(أقصى نطاق مسموح ${MAX_RANGE_SIZE} آية في المرة الواحدة)`
      );
      return;
    }

    let startIdx = 0;
    let endIdx = totalAyahs - 1;

    if (fromAyah !== null) {
      if (fromAyah < 1 || toAyah > totalAyahs || fromAyah > toAyah) {
        m.reply(`❌ النطاق غلط، السورة فيها ${totalAyahs} آية بس.`);
        return;
      }
      if (toAyah - fromAyah + 1 > MAX_RANGE_SIZE) {
        m.reply(`❌ النطاق كبير أوي! أقصى حاجة مسموحة ${MAX_RANGE_SIZE} آية في المرة الواحدة.`);
        return;
      }
      startIdx = fromAyah - 1;
      endIdx = toAyah - 1;
    }

    const ayahsToShow = surah.ayahs.slice(startIdx, endIdx + 1);
    const ayahsText = ayahsToShow.map((a) => `${a.text} ﴿${a.numberInSurah}﴾`).join(' ');

    const rangeLabel = fromAyah !== null ? ` (من ${fromAyah} إلى ${toAyah})` : '';
    const caption = `📖 *سورة ${surahNames[surahNumber - 1]}*${rangeLabel}\n\n${ayahsText}`;

    await m.reply(caption);

    if (fromAyah === null && !isLong) {
      await conn.sendMessage(
        m.chat,
        {
          audio: { url: getFullSurahAudioUrl(surahNumber) },
          mimetype: 'audio/mpeg',
          filename: `surah_${surahNumber}.mp3`,
          ptt: false,
        },
        { quoted: m }
      );
      return;
    }

    const audioAyahs = await fetchSurahAudio(surahNumber);
    const audioSlice = audioAyahs.slice(startIdx, endIdx + 1);
    const audioUrls = audioSlice.map((a) => a.audio);

    let merged;
    try {
      merged = await mergeAudioFiles(audioUrls, `${surahNumber}_${fromAyah}_${toAyah}`);

      await conn.sendMessage(
        m.chat,
        {
          audio: { url: merged.outputPath },
          mimetype: 'audio/mpeg',
          filename: `surah_${surahNumber}_${fromAyah}-${toAyah}.mp3`,
          ptt: true,
        },
        { quoted: m }
      );
    } finally {
      if (merged) await cleanupTmpDir(merged.tmpDir);
    }
  } catch (err) {
    console.error(err);
    m.reply('❌ حصل خطأ أثناء جلب السورة، حاول تاني بعد شوية.');
  }
};

handler.help = ['سوره <اسم السورة>', 'سوره <اسم السورة> <من آية> <إلى آية>'];
handler.tags = ['islam'];
handler.command = /^سوره$/i;

export default handler;