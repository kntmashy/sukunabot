import fetch from 'node-fetch';

let handler = async (m, { text }) => {
  if (!text && !m.quoted?.text) {
    throw ' `مـرحـبـا انـا لـيـمـا 🍥`\nيـمـكـنـنـي ان اسـاعـدك فـي اي شـي فـقـط قـول لي مـاذا تـريـد ان اسـاعـدك فـيـه\n\n\n> اكـتـب نـص مـعـا اسـتـخـدام الـامـر مـثـال\n> .ليما صلي على النبي محمد';
  }
  const prompt = encodeURIComponent(text || m.quoted.text);
  const apiUrl = `https://bk9.fun/ai/llama?q=${prompt}`;
  try {
    let response = await fetch(apiUrl);
    let data = await response.json();
    let result = data.BK9; 
    if (!result) {
      throw 'لـم يـتـم الـعـثـور عـلـى اسـتـجـابـة مـن LILMA';
    }
    m.reply(result); 
  } catch (error) {
    console.error('خطأ:', error);
    throw 'حدث خطأ أثناء الاتصال بالـ API!';
  }
};
handler.help = ['gpt'];
handler.tags = ['AI'];
handler.command = ['لليما', 'ليما', 'ai'];

export default handler;