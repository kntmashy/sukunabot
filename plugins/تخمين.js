// plugins/تخمين.js

const rooms = new Map()
const playerRooms = new Map()

const checkWin = async (conn, roomName, room) => {
  clearTimeout(room.timer)

  const p1GuessedRight = room.player1.guess === room.player2.number
  const p2GuessedRight = room.player2.guess === room.player1.number

  let resultMsg = `🏁 *انتهت اللعبة!*\n\n`
  resultMsg += `👤 ${room.player1.name} — رقمه: *${room.player1.number}* | خمّن: *${room.player1.guess ?? '❌ لم يخمن'}*\n`
  resultMsg += `👤 ${room.player2.name} — رقمه: *${room.player2.number}* | خمّن: *${room.player2.guess ?? '❌ لم يخمن'}*\n\n`

  if (p1GuessedRight && p2GuessedRight) {
    resultMsg += `🤝 تعادل! الاتنين خمنوا صح!`
  } else if (p1GuessedRight) {
    resultMsg += `🏆 *${room.player1.name}* كسب وأخد 5000 XP! 🎉`
  } else if (p2GuessedRight) {
    resultMsg += `🏆 *${room.player2.name}* كسب وأخد 5000 XP! 🎉`
  } else {
    resultMsg += `💀 الاتنين غلطوا! مفيش فايز`
  }

  await conn.sendMessage(room.chatId, { text: resultMsg })

  rooms.delete(roomName)
  playerRooms.delete(room.player1.id)
  if (room.player2) playerRooms.delete(room.player2.id)
}

const handler = async (m, { conn, text, command }) => {
  const userId = m.sender
  const chatId = m.chat
  const isGroup = chatId.endsWith('@g.us')

  // ══════════════════════════════════
  // جروب — .تخمين
  // ══════════════════════════════════
  if (command === 'تخمين' && isGroup) {
    if (!text?.trim()) return m.reply('اكتب اسم الغرفة\nمثال: .تخمين احمد')
    const roomName = text.trim()

    if (!rooms.has(roomName)) {
      rooms.set(roomName, {
        chatId,
        roomName,
        player1: { id: userId, name: m.pushName || userId.split('@')[0], number: null, guess: null },
        player2: null,
        timer: null,
        timerStarted: false,
        waitingFor: {}
      })
      playerRooms.set(userId, roomName)

      return conn.sendMessage(chatId, {
        text: `🏠 *انفتحت غرفة: ${roomName}*\n\n👤 ${m.pushName || userId.split('@')[0]} فاتح الغرفة\n\n⏳ استنى خصمك يكتب:\n*.تخمين ${roomName}*\n\n🏆 الفايز بياخد *5000 XP*`
      })
    }

    const room = rooms.get(roomName)
    if (room.player1.id === userId) return m.reply('⚠️ انت اللي فتحت الغرفة، استنى حد تاني!')
    if (room.player2) return m.reply('⚠️ الغرفة ممتلية!')

    room.player2 = { id: userId, name: m.pushName || userId.split('@')[0], number: null, guess: null }
    playerRooms.set(userId, roomName)
    rooms.set(roomName, room)

    await conn.sendMessage(chatId, {
      text: `⚔️ *${room.player1.name}* vs *${room.player2.name}*\n🏠 الغرفة: ${roomName}\n\n📩 عشان تختار رقمك:\n1️⃣ ابعت للبوت في الخاص رسالة: *.*\n2️⃣ البوت هيطلب منك رقم من 1 لـ 100\n\n⚠️ لازم الاتنين يبعتوا للبوت في الخاص الأول`
    })
    return
  }

  // ══════════════════════════════════
  // جروب — .خمن
  // ══════════════════════════════════
  if (command === 'خمن' && isGroup) {
    const parts = text?.trim().split(' ')
    if (!parts || parts.length < 2) return m.reply('مثال: .خمن احمد 45')

    const roomName = parts[0]
    const guessNum = parseInt(parts[1])

    if (!rooms.has(roomName)) return m.reply('⚠️ الغرفة دي مش موجودة')
    if (isNaN(guessNum) || guessNum < 1 || guessNum > 100) return m.reply('⚠️ الرقم لازم يكون من 1 لـ 100')

    const room = rooms.get(roomName)
    if (!room.timerStarted) return m.reply('⚠️ اللعبة لسه مبدأتش')

    const isP1 = room.player1.id === userId
    const isP2 = room.player2?.id === userId
    if (!isP1 && !isP2) return m.reply('⚠️ انت مش في الغرفة دي')

    if (isP1) {
      if (room.player1.guess !== null) return m.reply(`✅ انت خمنت ${room.player1.guess} بالفعل`)
      room.player1.guess = guessNum
    } else {
      if (room.player2.guess !== null) return m.reply(`✅ انت خمنت ${room.player2.guess} بالفعل`)
      room.player2.guess = guessNum
    }

    rooms.set(roomName, room)
    await m.reply(`✅ تم حفظ تخمينك: *${guessNum}*`)

    if (room.player1.guess !== null && room.player2.guess !== null) {
      await checkWin(conn, roomName, room)
    }
    return
  }
}

// ══════════════════════════════════
// خاص — بيشتغل على كل رسالة
// ══════════════════════════════════
handler.before = async (m, { conn }) => {
  const userId = m.sender
  const chatId = m.chat
  const isPrivate = !chatId.endsWith('@g.us')
  if (!isPrivate || !m.text) return false

  const text = m.text.trim()
  const roomName = playerRooms.get(userId)

  // لو بعت . عشان يبدأ
  if (text === '.') {
    if (!roomName) {
      await conn.sendMessage(chatId, { text: '⚠️ مش في لعبة دلوقتي' })
      return true
    }

    const room = rooms.get(roomName)
    if (!room) return true

    const isP1 = room.player1.id === userId
    const player = isP1 ? room.player1 : room.player2

    if (player.number !== null) {
      await conn.sendMessage(chatId, { text: `✅ انت اختارت رقم ${player.number} بالفعل` })
      return true
    }

    room.waitingFor = room.waitingFor || {}
    room.waitingFor[userId] = true
    rooms.set(roomName, room)

    await conn.sendMessage(chatId, {
      text: `🎮 *لعبة تخمين الأرقام*\n🏠 الغرفة: ${roomName}\n\n🔢 اختار رقمك من 1 لـ 100\nابعت الرقم بس مثلاً: *45*`
    })
    return true
  }

  // لو بعت رقم
  if (/^\d+$/.test(text) && roomName) {
    const room = rooms.get(roomName)
    if (!room || !room.waitingFor?.[userId]) return false

    const num = parseInt(text)
    if (num < 1 || num > 100) {
      await conn.sendMessage(chatId, { text: '⚠️ الرقم لازم يكون من 1 لـ 100' })
      return true
    }

    const isP1 = room.player1.id === userId
    if (isP1) room.player1.number = num
    else room.player2.number = num

    delete room.waitingFor[userId]
    rooms.set(roomName, room)

    await conn.sendMessage(chatId, {
      text: `✅ تم حفظ رقمك: *${num}*\n\nدلوقتي استنى اللعبة تبدأ وبعدين خمن رقم خصمك في الجروب:\n*.خمن ${roomName} (الرقم)*`
    })

    // لو الاتنين اختاروا
    if (room.player1.number !== null && room.player2.number !== null && !room.timerStarted) {
      room.timerStarted = true
      rooms.set(roomName, room)

      await conn.sendMessage(room.chatId, {
        text: `⚔️ *الاتنين اختاروا أرقامهم!*\n🏠 الغرفة: ${roomName}\n👤 ${room.player1.name} vs 👤 ${room.player2.name}\n\n🔢 خمن رقم خصمك في الجروب!\n*.خمن ${roomName} (الرقم)*\n\n⏱️ عندكم *5 دقائق* بالظبط!`
      })

      room.timer = setTimeout(async () => {
        const currentRoom = rooms.get(roomName)
        if (!currentRoom) return
        await conn.sendMessage(currentRoom.chatId, {
          text: `⏰ *انتهى الوقت!*\n🏠 الغرفة: ${roomName}`
        })
        await checkWin(conn, roomName, currentRoom)
      }, 5 * 60 * 1000)

      rooms.set(roomName, room)
    }
    return true
  }

  return false
}

handler.command = /^(تخمين|خمن)$/i
export default handler
