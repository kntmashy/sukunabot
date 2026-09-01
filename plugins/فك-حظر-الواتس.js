// plugins/فك-حظر-واتس.js
// 𖤐⃝𝚊𝚔𝚛𝚊𝚖

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return conn.sendMessage(m.chat, {
            text: `╭───━ 〘 طـريـقـة الاسـتـخـدام 〙 ━──►
*┃╻💡╹↵ اكتب:* \`${usedPrefix + command} +2127XXXXXXX\`
*┃╻📝╹↵ مثال:* \`${usedPrefix + command} +2127XXXXXXX\`
╰─────━─━───━───►
> 𓏲𝐷𝐸𝑅𝐾𝛩 𝐵𝛩𝑇⃝𓂀
        }, { quoted: m });
    }

    let phoneNumber = text.trim();
    
    // تنظيف الرقم
    let cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (cleanNumber.startsWith('00')) {
        cleanNumber = '+' + cleanNumber.substring(2);
    } else if (!cleanNumber.startsWith('+')) {
        cleanNumber = '+' + cleanNumber;
    }

    // ✅ البريد الإلكتروني الجديد
    const TARGET_EMAIL = 'android@support.whatsapp.com';
    
    // ✅ الموضوع الجديد
    const SUBJECT = 'Urgent: Unable to Verify Number – "Login is currently unavailable" Error';
    
    // ✅ الرسالة الجديدة (مع رقم المستخدم)
    const messageBody = `Уважаемая служба поддержки WhatsApp,
Я столкнулся с проблемой при попытке войти в свою учетную запись WhatsApp. Каждый раз, когда я пытаюсь подтвердить свой номер телефона, приложение выдает ошибку: «Login is currently unavailable». Я пробовал выполнять процедуру несколько раз, используя различные сети, но проблема сохраняется.
Я использую только официальное приложение WhatsApp, загруженное из официального магазина приложений. Я никогда не использовал модифицированные или сторонние версии приложения и не нарушал Условия использования WhatsApp. Эта проблема возникла внезапно, и теперь я не могу получить код подтверждения или получить доступ к своей учетную запись.
Мой аккаунт жизненно важен для общения с семьей, друзьями и деловыми контактами. Прошу вас проверить статус моей учетной записи и снять любые временные блокировки или системные ограничения, препятствующие верификации. Если от меня требуются дополнительные действия, пожалуйста, сообщите мне об этом.
Мой номер телефона: ${cleanNumber}`;

    const fullMessage = messageBody;
    const encodedMessage = encodeURIComponent(fullMessage);
    const encodedSubject = encodeURIComponent(SUBJECT);
    const mailtoLink = `mailto:${TARGET_EMAIL}?subject=${encodedSubject}&body=${encodedMessage}`;

    // ✅ رسالة المعاينة
    const previewText = `╭───━ 〘 📄 مـعـايـنـة الـرسـالـة 〙 ━──►

📧 *البريد:* ${TARGET_EMAIL}
📌 *الموضوع:* ${SUBJECT}

📝 *الرسالة:*
${messageBody}

╰─────━─━───━───►
> 𓏲𝐷𝐸𝑅𝐾𝛩 𝐵𝛩𝑇⃝𓂀;

    await conn.sendMessage(m.chat, { text: previewText }, { quoted: m });

    // ✅ الأزرار
    const msg = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: { hasMediaAttachment: false, title: '📱 فـك حـظـر واتـسـاب' },
                    body: {
                        text: `╭───━ 〘 تـم تـجـهـيـز الـرسـالـة 〙 ━──►
*┃╻📞╹↵ الـرقـم ⇦ ❮${cleanNumber}❯*
*┃╻📧╹↵ الإرسـال إلـى ⇦ ❮${TARGET_EMAIL}❯*
*┃╻⏱️╹↵ بعد الإرسال انتظر 30 ثانية ثم جرب الرقم*
╰─────━─━───━───►
> 𓏲𝐷𝐸𝑅𝐾𝛩 𝐵𝛩𝑇⃝𓂀
                    },
                    footer: { text: '𖤐⃝𝚊𝚔𝚛𝚊𝚖' },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '📧 افـتـح الـبـريـد للإرسـال',
                                    url: mailtoLink,
                                    merchant_url: mailtoLink
                                })
                            },
                            {
                                name: 'cta_copy',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '📋 نـسـخ الـرسـالـة',
                                    copy_code: fullMessage
                                })
                            },
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '🔍 فـتـح الـرقـم فـي واتـسـاب',
                                    url: `https://wa.me/${cleanNumber.replace('+', '')}`,
                                    merchant_url: `https://wa.me/${cleanNumber.replace('+', '')}`
                                })
                            }
                        ]
                    }
                }
            }
        }
    };

    await conn.relayMessage(m.chat, msg, {});
    
    // ✅ إرسال تعليمات إضافية
    setTimeout(async () => {
        await conn.sendMessage(m.chat, {
            text: `╭───━ 〘 📌 تـعـلـيـمـات 〙 ━──►
*┃╻💡╹↵ بعد ما تبعت الرسالة للشركة ويردوا عليك:*
*┃╻1.* جرب تسجيل الدخول
*┃╻2.* لو قال "تسجيل الدخول غير متوفر"
*┃╻3.* انتظر 30 ثانية بالظبط
*┃╻4.* جرب الرقم مرة تانية
*┃╻✅╹↵ هتلاقيه شغال ان شاء الله*
╰─────━─━───━───►
> Sukuna 𝐵𝛩𝑇⃝𓂀
        }, { quoted: m });
    }, 2000);
};

handler.command = /^(فك-حظر-واتس|unban-wa|رفع-حظر|حل-مشكلة-دخول)$/i;
handler.tags = ['tools'];
handler.help = ['فك-حظر-واتس'];

export default handler;