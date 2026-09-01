// plugins/session-fix-only.js
// أمر: .جلسه
// وصف: إصلاح أخطاء ملفات الجلسة فقط (تحقق، إصلاح JSON تالف، ضبط صلاحيات، باكأب).
// لا ينشئ QR ولا يغير ملفات الجلسة الرئيسية إلا بعد أخذ باك أب.
// يسمح فقط للأرقام المصرح لها (قابل للتعديل).

import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// === إعدادات قابلة للتعديل ===
const BOT_SESSION_DIR = path.resolve(process.cwd(), "BotSession"); // مجلد جلسة البوت
const BACKUP_DIR = path.resolve(process.cwd(), "session_backups");
const ALLOWED_CALLERS = ["01002804195", "01026653639"].map(n => `2${String(n).replace(/\D+/g,"")}@s.whatsapp.net`);
// ===========================

async function ensureDirs() {
  await fs.ensureDir(BOT_SESSION_DIR).catch(()=>{});
  await fs.ensureDir(BACKUP_DIR).catch(()=>{});
}

// يعيد قائمة الملفات المهمة المحتملة داخل مجلد الجلسة
async function listSessionFiles() {
  try {
    const files = await fs.readdir(BOT_SESSION_DIR);
    // نختار ملفات json أو أي ملفات تحتوي كلمات دلالة
    return files.filter(f => /\.(json|db|dat|txt)$/i.test(f) || /auth|cred|session|key|state/i.test(f));
  } catch (e) {
    return [];
  }
}

async function makeFileBackup(file) {
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g,"-");
    const base = path.basename(file);
    const dest = path.join(BACKUP_DIR, `${base}.bak-${stamp}`);
    await fs.copy(file, dest);
    return dest;
  } catch (e) {
    return null;
  }
}

// يحاول إصلاح JSON تالف عن طريق التقليم إلى أول { وآخر }
function tryRepairJsonText(text) {
  try {
    // محاولة مباشرة أولاً
    JSON.parse(text);
    return { ok: true, text }; // سليمة
  } catch (_) {
    // ابحث عن أول { وآخر }
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const candidate = text.slice(first, last + 1);
      try {
        const obj = JSON.parse(candidate);
        const pretty = JSON.stringify(obj, null, 2);
        return { ok: true, text: pretty };
      } catch (e) {
        return { ok: false, error: "repair-parse-failed" };
      }
    }
    return { ok: false, error: "not-json-like" };
  }
}

async function repairFileIfJson(filePath) {
  const out = { file: filePath, repaired: false, action: null, error: null, backup: null };
  try {
    const stat = await fs.stat(filePath);
    if (!stat || !stat.isFile()) { out.action = "skip-not-file"; return out; }

    // باك أب
    const bak = await makeFileBackup(filePath);
    out.backup = bak || null;

    const raw = await fs.readFile(filePath, "utf8").catch(()=>null);
    if (raw === null) { out.action = "read-failed"; return out; }

    // لو الملف صغير جداً نتجاهل
    if (raw.trim().length === 0) { out.action = "empty"; return out; }

    // محاولة إصلاح إن كان ظاهرًا كـ JSON
    const attempt = tryRepairJsonText(raw);
    if (attempt.ok) {
      // لو النص المعدل يساوي الأصلي => لا تغيير
      if (attempt.text !== raw) {
        // اكتب النسخة المصححة
        await fs.writeFile(filePath, attempt.text, { encoding: "utf8" });
        out.repaired = true;
        out.action = "rewrote-fixed-json";
      } else {
        out.action = "valid-json";
      }
      // حاول ضبط صلاحيات
      try { await fs.chmod(filePath, 0o600); } catch(_) {}
      return out;
    } else {
      out.error = attempt.error || "unknown-repair-failure";
      return out;
    }
  } catch (e) {
    out.error = e && (e.message || String(e));
    return out;
  }
}

async function restoreLatestBackup() {
  try {
    if (!await fs.pathExists(BACKUP_DIR)) return null;
    const files = await fs.readdir(BACKUP_DIR);
    if (!files || files.length === 0) return null;
    // ملفات الباك اب مرتبة حسب الاسم (بما فيها الطابع الزمني)
    files.sort();
    const latest = files[files.length - 1];
    const src = path.join(BACKUP_DIR, latest);
    // استخراج اسم الاصل قبل .bak-
    const m = latest.match(/^(.+)\.bak-/);
    if (!m) return null;
    const originalName = m[1];
    const dest = path.join(BOT_SESSION_DIR, originalName);
    await fs.copy(src, dest, { overwrite: true });
    return { src, dest };
  } catch (e) {
    return null;
  }
}

let handler = async (m, { conn }) => {
  try {
    const chatId = m.chat;
    const sender = m.sender || (m.key && m.key.participant) || "";

    if (!ALLOWED_CALLERS.includes(sender)) {
      return await conn.sendMessage(chatId, { text: "❌ غير مصرح لك. الأمر مقيَّد لمالكي البوت." }, { quoted: m });
    }

    await ensureDirs();

    // تحقق من وجود مجلد الجلسة
    if (!await fs.pathExists(BOT_SESSION_DIR)) {
      return await conn.sendMessage(chatId, { text: `ℹ️ مجلد الجلسة غير موجود في:\n${BOT_SESSION_DIR}\nلا يوجد ما أصلحه.` }, { quoted: m });
    }

    const files = await listSessionFiles();
    if (!files.length) {
      return await conn.sendMessage(chatId, { text: `ℹ️ لا توجد ملفات جلسة قابلة للفحص في:\n${BOT_SESSION_DIR}` }, { quoted: m });
    }

    await conn.sendMessage(chatId, { text: `⏳ جاري فحص ${files.length} ملف جلسة...` }, { quoted: m });

    const results = [];
    for (const f of files) {
      const full = path.join(BOT_SESSION_DIR, f);
      const res = await repairFileIfJson(full);
      results.push(res);
    }

    // تجميع النتائج
    const repaired = results.filter(r => r.repaired);
    const valid = results.filter(r => r.action === "valid-json");
    const failed = results.filter(r => !r.repaired && r.action && !["valid-json","empty","skip-not-file"].includes(r.action));
    const empties = results.filter(r => r.action === "empty");

    let summary = `🛠️ نتيجة محاولة الإصلاح:\n\n`;
    summary += `✔️ ملفات صُلحت: ${repaired.length}\n`;
    if (repaired.length) summary += repaired.map(r => ` • ${path.basename(r.file)} (باك: ${r.backup ? path.basename(r.backup) : "—"})\n`).join("");
    summary += `\nℹ️ ملفات صحيحة من قبل: ${valid.length}\n`;
    summary += `\n⚠️ ملفات لم تُصلح: ${failed.length}\n`;
    if (failed.length) summary += failed.map(r => ` • ${path.basename(r.file)} → ${r.error||r.action}\n`).join("");
    if (empties.length) summary += `\n🗑️ ملفات فارغة: ${empties.map(r=>path.basename(r.file)).join(", ")}\n`;

    // لو لم يتم إصلاح شيء إطلاقاً حاول اقتراح استرجاع باك اب آخر
    if (repaired.length === 0 && failed.length > 0) {
      const latest = await restoreLatestBackup();
      if (latest) {
        summary += `\n🔁 حاولت استرجاع أحدث باك أب:\nمن: ${path.basename(latest.src)}\nإلى: ${latest.dest}\n`;
        summary += `رجاءً أعد تشغيل البوت الآن.`;
        await conn.sendMessage(chatId, { text: summary }, { quoted: m });
        return;
      } else {
        summary += `\n❌ لم أتمكن من إصلاح الملفات تلقائيًا ولا يوجد باك أب لاسترجاعه.\nالخيار التالي: إعادة ربط الجلسة (QR) يدويًا أو استرجاع نسخة يدوية من باك أب.\n(لم أجرِ أي إجراءات مدمرة).`;
        await conn.sendMessage(chatId, { text: summary }, { quoted: m });
        return;
      }
    }

    summary += `\n\n✅ انتهت عملية الفحص. إذا صُلحت ملفات فالأفضل إعادة تشغيل البوت الآن.`;
    await conn.sendMessage(chatId, { text: summary }, { quoted: m });

  } catch (err) {
    console.error("[session-fix-only] error:", err);
    try { await conn.sendMessage(m.chat, { text: `❌ فشل أثناء محاولة الإصلاح: ${err && err.message ? err.message : String(err)}` }, { quoted: m }); } catch(_) {}
  }
};

handler.help = ["جلسه"];
handler.tags = ["owner","dev"];
handler.command = /^جلسه$/i;

export default handler;