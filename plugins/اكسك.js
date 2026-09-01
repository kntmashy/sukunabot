import syntaxerror from 'syntax-error';
import { format } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)

let fuckRepley = {
    key: {
        remoteJid: 'status@broadcast',
        participant: '0@s.whatsapp.net'
    },
    message: {
        documentMessage: {
            title: 'E X E C E - C O D E R'
        }
    }
}

class CustomArray extends Array {
    constructor(...args) {
        if (typeof args[0] === 'number') return super(Math.min(args[0], 10000));
        else return super(...args);
    }
}

const handler = async (m, _2) => {
    const { conn, usedPrefix, noPrefix, args, groupMetadata } = _2;

    let _return;
    let _syntax = '';
    const _text = (/^=/.test(usedPrefix) ? 'return ' : '') + noPrefix;
    const oldExp = m.exp * 1;

    // 🔍 DEBUG — هيتطبع في الكونسول بتاع البوت
    console.log('=== EVAL DEBUG ===')
    console.log('usedPrefix:', JSON.stringify(usedPrefix))
    console.log('noPrefix:', JSON.stringify(noPrefix))
    console.log('_text:', JSON.stringify(_text))

    try {
        let executionLimit = 15;
        const f = { exports: {} };

        const exec = new (Object.getPrototypeOf(async function () {}).constructor)(
            'print', 'm', 'handler', 'require', 'conn', 'Array', 'process', 'args',
            'groupMetadata', 'module', 'exports', 'argument',
            _text
        );

        console.log('exec.toString():', exec.toString())

        _return = await exec.call(
            conn,
            (...a) => {
                if (--executionLimit < 1) return;
                console.log(...a);
                return conn.reply(m.chat, format(...a), fuckRepley);
            },
            m, handler, require, conn, CustomArray, process, args, groupMetadata, f, f.exports, [conn, _2]
        );

        console.log('_return:', _return)
    } catch (e) {
        console.log('CAUGHT ERROR:', e)
        const err = syntaxerror(_text, 'Execution Function', {
            allowReturnOutsideFunction: true,
            allowAwaitOutsideFunction: true,
            sourceType: 'module',
        });

        if (err) _syntax = '```' + err + '```\n\n';
        _return = e;
    } finally {
        conn.reply(m.chat, _syntax + format(_return), fuckRepley);
        m.exp = oldExp;
    }
};

handler.help = ['>', '=>']
handler.tags = ['owner']
handler.customPrefix = /^=?> /
handler.command = /(?:)/i
handler.owner = true

export default handler