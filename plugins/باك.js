// plugins/back-install.js
// أمر: .باك <package...>
// يكتشف أفضل package manager (pnpm -> yarn -> npm) بطريقة متينة
// يطبع تقدم التثبيت بشكل مُجمّع إلى واتساب، ويحفظ لوق.
// متوافق مع بيئة ESM (node >= 16+) وبوتات Baileys-style.
//
// ملاحظات: البوت يجب أن يكون مُشغّل بصلاحيات تسمح له تشغيل أوامر (spawn).
// ضع الملف في مجلد plugins وأعد تشغيل البوت.

import { spawn, spawnSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import Debug from "debug";

const debug = Debug("gojo-back-install");
const ROOT = process.cwd();
const LOG_DIR = path.join(ROOT, "install_logs");
await fs.ensureDir(LOG_DIR);

// basic sanitizer for package names (accepts scoped names and versions)
function isValidPkgName(n) {
  if (!n || typeof n !== "string") return false;
  // allow things like @scope/name, name, name@1.2.3, name/subpath
  return /^@?[\w\-\.]+(\/[\w\-\._]+)?(@[\w\.\-\+]+)?$/.test(n);
}

// detect package manager synchronously
function detectManagerSync() {
  try {
    const check = (cmd) => {
      try {
        const r = spawnSync(cmd, ["--version"], { stdio: "ignore" });
        return !!(r && r.status === 0);
      } catch (e) { return false; }
    };
    if (check("pnpm")) return "pnpm";
    if (check("yarn")) return "yarn";
    if (check("npm")) return "npm";
  } catch (e) {
    debug("detectManagerSync error:", e && e.message);
  }
  return null;
}

// تعديل هنا لحل مشاكل pnpm و npm
function buildInstallArgs(manager, packages) {
  if (manager === "pnpm") return ["add", ...packages]; // إزالة --no-fund و --no-audit
  if (manager === "yarn") return ["add", ...packages, "--silent"];
  // npm مع تجاوز مشاكل التعارضات
  return ["install", ...packages, "--legacy-peer-deps", "--force"];
}

function buildListArgs(manager, packages) {
  if (manager === "pnpm") return ["list", ...packages, "--depth", "0", "--json"];
  if (manager === "yarn") return ["list", "--pattern", packages.join("|"), "--json"];
  return ["ls", ...packages, "--depth", "0", "--json"];
}

// spawn installer and stream output
function runInstall(manager, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(manager, args, Object.assign({ cwd: ROOT }, opts));
    let stdout = "", stderr = "";

    proc.stdout.on("data", d => { stdout += d.toString(); });
    proc.stderr.on("data", d => { stderr += d.toString(); });

    proc.on("error", e => reject({ code: null, error: e, stdout, stderr }));
    proc.on("close", code => {
      if (code === 0) return resolve({ code, stdout, stderr });
      return reject({ code, stdout, stderr });
    });
  });
}

// helper to send progress updates (slices long output)
async function sendProgressChunks(conn, m, buffer, label = "تقدم التثبيت") {
  try {
    const out = String(buffer || "").trim();
    if (!out) return;
    const chunk = out.slice(-1500); // send last part
    await conn.sendMessage(m.chat, { text: `\`\`\`${label}\n${chunk}\n\`\`\`` }, { quoted: m });
  } catch (e) {
    debug("sendProgressChunks failed:", e && e.message);
  }
}

// Handler (Baileys-style)
let handler = async (m, { conn, text, usedPrefix }) => {
  try {
    const prefix = usedPrefix || ".";
    if (!text || !text.trim()) {
      return conn.sendMessage(m.chat, { text: `🔴 استخدام: ${prefix}باك <package1> <package2> ...\nمثال:\n${prefix}باك soundcloud-downloader soundcloud-scraper node-fetch@3` }, { quoted: m });
    }

    // parse packages
    const parts = text.split(/[\s,]+/).filter(Boolean);
    const pkgs = parts.filter(isValidPkgName);
    const bad = parts.filter(p => !isValidPkgName(p));
    if (!pkgs.length) return conn.sendMessage(m.chat, { text: `❌ لم تُدخل أسماء حزم صحيحة.` }, { quoted: m });
    if (bad.length) {
      await conn.sendMessage(m.chat, { text: `⚠️ تجاهلت أسماء غير صالحة: ${bad.join(", ")}` }, { quoted: m });
    }

    // detect manager
    const manager = detectManagerSync();
    if (!manager) return conn.sendMessage(m.chat, { text: `❌ لم أجد npm أو yarn أو pnpm مثبت على السيرفر.` }, { quoted: m });

    await conn.sendMessage(m.chat, { text: `⏳ جاري تثبيت: ${pkgs.join(" ")} باستخدام ${manager}` }, { quoted: m });

    // prepare logfile
    const logfile = path.join(LOG_DIR, `install-${Date.now()}.log`);
    const logStream = fs.createWriteStream(logfile, { flags: "a" });

    // start install using spawn but stream stdout/stderr live to log and send periodically
    const args = buildInstallArgs(manager, pkgs);
    const proc = spawn(manager, args, { cwd: ROOT });

    let buffOut = "";
    let buffErr = "";
    let lastSend = Date.now();

    proc.stdout.on("data", d => {
      const s = d.toString();
      buffOut += s;
      logStream.write(s);
      if (Date.now() - lastSend > 1500) {
        lastSend = Date.now();
        sendProgressChunks(conn, m, buffOut + buffErr, "تقدم التثبيت (جزئي)").catch(()=>{});
      }
    });

    proc.stderr.on("data", d => {
      const s = d.toString();
      buffErr += s;
      logStream.write(s);
    });

    proc.on("error", async (err) => {
      logStream.end();
      await conn.sendMessage(m.chat, { text: `❌ فشل تشغيل أمر التثبيت: ${err && err.message ? err.message : String(err)}` }, { quoted: m });
    });

    proc.on("close", async (code) => {
      logStream.end();
      const full = (buffOut + "\n" + buffErr).trim();
      const short = full.slice(0, 3500) || "(لا ناتج)";
      if (code === 0) {
        await conn.sendMessage(m.chat, { text: `✅ انتهى التثبيت بنجاح.\nملخص:\n\`\`\`\n${short}\n\`\`\`` }, { quoted: m });
      } else {
        await conn.sendMessage(m.chat, { text: `❌ التثبيت فشل (exit ${code}). لوج مختصر:\n\`\`\`\n${short}\n\`\`\`\nالتحقق من الملف على السيرفر: ${logfile}` }, { quoted: m });
      }

      // attempt to send small log file if small
      try {
        const st = await fs.stat(logfile);
        if (st.size > 0 && st.size < (2 * 1024 * 1024)) {
          const buf = await fs.readFile(logfile);
          await conn.sendMessage(m.chat, { document: buf, fileName: path.basename(logfile), mimetype: "text/plain" }, { quoted: m });
        } else {
          await conn.sendMessage(m.chat, { text: `📁 لوج محفوظ: ${logfile} (${Math.round(st.size/1024)} KB)` }, { quoted: m });
        }
      } catch (e) {
        debug("send log error:", e && e.message);
      }

      // try to list installed packages (best-effort)
      try {
        const listArgs = buildListArgs(manager, pkgs);
        const listProc = spawnSync(manager, listArgs, { cwd: ROOT, encoding: "utf8", stdio: ["ignore","pipe","pipe"], maxBuffer: 10 * 1024 * 1024 });
        const out = (listProc.stdout || "").toString().slice(0, 3500) || "(لا توجد بيانات)";
        await conn.sendMessage(m.chat, { text: `ℹ️ تقرير التثبيت:\n\`\`\`\n${out}\n\`\`\`` }, { quoted: m });
      } catch (e) {
        debug("list installed failed:", e && e.message);
      }
    });

  } catch (err) {
    debug("handler error:", err && err.message);
    try { await conn.sendMessage(m.chat, { text: `⚠️ خطأ داخلي: ${err && err.message ? err.message : String(err)}` }, { quoted: m }); } catch(_) {}
  }
};

handler.command = /^باك$/i;
handler.tags = ["owner","dev"];
handler.help = ["باك <package1> <package2> ..."];

export default handler;