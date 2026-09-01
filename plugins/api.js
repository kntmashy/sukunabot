import fetch from 'node-fetch';

let handler = async (m, { conn, text }) => {
  if (!text) {
    return conn.sendMessage(m.chat, { text: '❌ يرجى إدخال رابط أو نص للتحميل.' }, { quoted: m });
  }

  const apiUrl = `https://bk9.fun/download/alldownload?url=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(apiUrl);
    const json = await response.json();

    console.log("🔹 استجابة API:", JSON.stringify(json, null, 2));

    return conn.sendMessage(m.chat, { text: "🔍 هذه هي استجابة API:\n" + JSON.stringify(json, null, 2) }, { quoted: m });
  } catch (error) {
    console.error(error);
    return conn.sendMessage(m.chat, { text: `❌ حدث خطأ: ${error.message}` }, { quoted: m });
  }
};

handler.command = ['api'];
export default handler;