// commands/اقبل.js

export default {
  name: 'اقبل',
  alias: ['accept', 'acceptall'],
  description: 'قبول كل طلبات الانضمام للجروب',
  groupOnly: true,
  adminOnly: true, // بس الأدمن يقدر يستخدمه

  async execute(sock, msg, args) {
    const groupId = msg.key.remoteJid;

    // التأكد إن الرسالة من جروب
    if (!groupId.endsWith('@g.us')) {
      return await sock.sendMessage(groupId, {
        text: '❌ الأمر ده بيشتغل في الجروبات بس!',
      });
    }

    try {
      // جلب كل طلبات الانضمام المعلقة
      const requests = await sock.groupRequestParticipantsList(groupId);

      if (!requests || requests.length === 0) {
        return await sock.sendMessage(groupId, {
          text: '📭 مفيش طلبات انضمام معلقة دلوقتي.',
        });
      }

      // استخراج الـ JIDs بتاعة الناس اللي طالبين
      const participantIds = requests.map((r) => r.jid);

      // قبول كل الطلبات
      await sock.groupRequestParticipantsUpdate(
        groupId,
        participantIds,
        'approve' // أو 'reject' للرفض
      );

      await sock.sendMessage(groupId, {
        text: `✅ تم قبول *${participantIds.length}* طلب انضمام بنجاح!`,
      });
    } catch (err) {
      console.error('خطأ في قبول الطلبات:', err);
      await sock.sendMessage(groupId, {
        text: `❌ حصل خطأ: ${err.message}`,
      });
    }
  },
};