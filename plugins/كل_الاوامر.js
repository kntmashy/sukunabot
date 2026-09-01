import fs from 'fs';
import path from 'path';

const ownerNumbers = ['201016855501', '201036547166'];

const handler = async (m, { conn, usedPrefix }) => {
  try {
    await conn.sendMessage(m.chat, { react: { text: '⚡️', key: m.key } });

    const isOwner = ownerNumbers.includes(m.sender.split('@')[0]);
    const pluginsDir = './plugins';
    const files = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));

    const sections = {
      'ق1':    { emoji: '🎮', name: 'الألعاب',           cmds: [] },
      'ق2':    { emoji: '⚙️', name: 'المشرفين',          cmds: [] },
      'ق3':    { emoji: '🧰', name: 'الأدوات',           cmds: [] },
      'ق4':    { emoji: '⬇️', name: 'التحميل',           cmds: [] },
      'ق6':    { emoji: '🤖', name: 'الذكاء الاصطناعي', cmds: [] },
      'ق7':    { emoji: '😂', name: 'التسلية',           cmds: [] },
      'ق8':    { emoji: '🕌', name: 'الدين',             cmds: [] },
      'ق11':   { emoji: '🖼️', name: 'الصور',            cmds: [] },
      'ق20':   { emoji: '🤲', name: 'الأدعية',           cmds: [] },
      'owner': { emoji: '👑', name: 'أوامر المالك',      cmds: [], ownerOnly: true },
    };

    const tagMap = {
      game: 'ق1', games: 'ق1', العاب: 'ق1', quiz: 'ق1',
      group: 'ق2', مشرفين: 'ق2',
      tools: 'ق3', ادوات: 'ق3', 'أدوات': 'ق3', internet: 'ق3',
      xp: 'ق3', economy: 'ق3', econ: 'ق3', 'اقتصاد': 'ق3',
      start: 'ق3', rg: 'ق3', info: 'ق3', main: 'ق3',
      General: 'ق3', nable: 'ق3', 'الإعدادات': 'ق3',
      downloader: 'ق4', download: 'ق4', 'تحميل': 'ق4',
      music: 'ق4', search: 'ق4', 'بحث': 'ق4', audio: 'ق4',
      ai: 'ق6', AI: 'ق6',
      fun: 'ق7', frasss: 'ق7', anime: 'ق7', vivi: 'ق7', تسلية: 'ق7',
      'X V I I T A C H I': 'ق7',
      islam: 'ق8', religion: 'ق8',
      image: 'ق11', img: 'ق11', sticker: 'ق11', maker: 'ق11',
      'لـوجـو': 'ق11',
      doaa: 'ق20', ad3ya: 'ق20', ادعية: 'ق20', 'أدعية': 'ق20', dua: 'ق20',
      owner: 'owner', 'المالك': 'owner',
    };

    // ✅ إضافة أوامر مخصصة يدوياً مع إيموجياتها
    const manualCommands = {
      'ق2': [
        { cmd: '.انتيشتايم', emoji: '🛡️' },
        { cmd: '.تفعيل_شتايم', emoji: '🔒' },
        { cmd: '.ايقاف-شتايم', emoji: '🔓' }
      ],
      'ق7': [
        { cmd: '.علء', emoji: '🎯' },
        { cmd: '.ض1', emoji: '🎲' },
        { cmd: '.ض2', emoji: '🎪' }
      ],
    };

    // ✅ إضافة الأوامر المخصصة للأقسام
    for (let [key, cmds] of Object.entries(manualCommands)) {
      if (sections[key]) {
        for (let item of cmds) {
          sections[key].cmds.push({ cmd: item.cmd, emoji: item.emoji });
        }
      }
    }

    for (let file of files) {
      try {
        const code = fs.readFileSync(path.join(pluginsDir, file), 'utf-8');

        const tagMatch = code.match(/handler\.tags\s*=\s*\[['"`](.+?)['"`]\]/);
        const tag = tagMatch ? tagMatch[1] : '';

        const isOwnerCmd = /handler\.(owner|rowner)\s*=\s*true/.test(code);

        let cmds = [];

        const regexMatch = code.match(/handler\.command\s*=\s*\/\^?\(?([^/\)$]+)\)?\$?\//);
        if (regexMatch) {
          cmds = regexMatch[1].split('|').map(c => c.trim()).filter(Boolean).slice(0, 3);
        }

        const arrayMatch = code.match(/handler\.command\s*=\s*\[([^\]]+)\]/);
        if (arrayMatch) {
          cmds = [...cmds, ...arrayMatch[1].match(/['"`]([^'"`]+)['"`]/g)
            ?.map(s => s.replace(/['"`]/g, '')) || []];
        }

        const strMatch = code.match(/handler\.command\s*=\s*['"`]([^'"`]+)['"`]/);
        if (strMatch) cmds.push(strMatch[1]);

        const helpMatch = code.match(/handler\.help\s*=\s*\[([^\]]+)\]/);
        if (helpMatch) {
          const helpCmds = helpMatch[1].match(/['"`]([^'"`]+)['"`]/g)
            ?.map(s => s.replace(/['"`]/g, '')) || [];
          cmds = [...new Set([...cmds, ...helpCmds])];
        }

        cmds = cmds.filter(c => c && c.length > 0 && !c.includes('?') && !c.includes('*'))
          .map(c => `${usedPrefix}${c}`);

        if (!cmds.length) continue;

        const isOwnerOnly = isOwnerCmd && tag !== 'group';

        // ✅ إضافة إيموجي لكل أمر حسب القسم
        const sectionKey = isOwnerOnly ? 'owner' : (tagMap[tag] || null);
        const emoji = sectionKey && sections[sectionKey] ? sections[sectionKey].emoji : '⚡️';

        for (let cmd of cmds) {
          if (sectionKey && sections[sectionKey]) {
            sections[sectionKey].cmds.push({ cmd, emoji });
          }
        }
      } catch {
        continue;
      }
    }

    // إزالة التكرار من كل قسم
    for (let key of Object.keys(sections)) {
      const unique = new Map();
      for (let item of sections[key].cmds) {
        if (!unique.has(item.cmd)) {
          unique.set(item.cmd, item);
        }
      }
      sections[key].cmds = Array.from(unique.values());
    }

    // 🎨 الزخرفة الجديدة مع إيموجيات جمب الأوامر
    let text = `╔═══━━━══━━━❪⛩️❫━━━══━━━═══╗\n`;
    text += `║  ❪📜❫ *سِجِلُّ القُوَّةِ الكَامِل*  ║\n`;
    text += `║  ❪⚡️❫ *مَلْحَمَةُ الأَوَامِر*       ║\n`;
    text += `╚═══━━━══━━━❪⛩️❫━━━══━━━═══╝\n`;
    text += `╔═══━━━══━━━❪⚔️❫━━━══━━━═══╗\n`;

    for (let [key, sec] of Object.entries(sections)) {
      if (sec.ownerOnly && !isOwner) continue;
      if (!sec.cmds.length) continue;

      const unique = sec.cmds;
      
      const border = '║  ──━━━══━━━──';
      text += `║ ❪${sec.emoji}❫ *${sec.name}*\n`;
      text += `${border}\n`;
      
      const cmdsText = unique.map((item, index) => {
        const prefix = index === unique.length - 1 ? '╚═' : '║ ';
        return `${prefix} ❪${item.emoji}❫ ${item.cmd}`;
      }).join('\n');
      
      text += cmdsText;
      text += `\n║\n`;
    }

    text += `╚═══━━━══━━━❪⛩️❫━━━══━━━═══╝\n`;
    text += `╔═══━━━══━━━❪👑❫━━━══━━━═══╗\n`;
    text += `║  ❪🩸❫ *صَانِعُ اللَّعْنَة*      ║\n`;
    text += `║  ❪⚡️❫ *SUKUNA BOT*              ║\n`;
    text += `╚═══━━━══━━━❪⛩️❫━━━══━━━═══╝\n\n`;
    
    // ✅ زر التواصل مع المطور
    text += `▎➣ *للتَّوَاصُلِ مَعَ الصَّانِعِ* 💬\n`;
    text += `▎➣ *اِضْغَطْ عَلَى الزِّرِّ أَدْنَاهُ* 👇\n\n`;
    
    // ✅ إرسال الرسالة مع الأزرار
    await conn.sendMessage(m.chat, {
      text: text,
      buttons: [
        {
          buttonId: '.تواصل',
          buttonText: { displayText: '☠️ تَوَاصَلْ مَعَ المُطَوِّر' },
          type: 1
        },
        {
          buttonId: '.المطورين',
          buttonText: { displayText: '👑 المطورين' },
          type: 1
        }
      ],
      headerType: 1,
      viewOnce: true
    }, { quoted: m });

  } catch (err) {
    console.error('خطأ في أمر الأوامر:', err);
    m.reply('🩸 *حَتَّى مَلِكُ اللَّعَنَات يَوَاجِهُ عَقَبَات…*\n⚠️ حدث خطأ أثناء جلب الأوامر!');
  }
};

handler.help = ['cmds'];
handler.tags = ['main'];
handler.command = /^(كل_الاوامر|cmds|allcmds)$/i;

export default handler;