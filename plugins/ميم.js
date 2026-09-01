let links = [
"https://i.postimg.cc/DyX9BsBw/Screenshot-20260503-063811-Tik-Tok.jpg",
"https://i.postimg.cc/cJX2rc4F/Screenshot-20260503-055652-Facebook.jpg",
"https://i.postimg.cc/85YYbPvy/Screenshot-20260503-055602-Facebook.jpg",
"https://i.postimg.cc/tTLj4zBj/Screenshot-20260503-055544-Facebook.jpg",
"https://i.postimg.cc/mkCGzFn8/Screenshot-20260503-055244-Facebook.jpg",
"https://i.postimg.cc/jdYTVZWc/Screenshot-20260503-055322-Facebook.jpg",
"https://i.postimg.cc/zXwrqKWQ/Screenshot-20260503-055510-Facebook.jpg",
"https://i.postimg.cc/9FPhcZZ4/Screenshot-20260503-055522-Facebook.jpg",
"https://i.postimg.cc/R0YrgR56/Screenshot-20260503-055230-Facebook.jpg",
"https://i.postimg.cc/KYWX0NS9/Screenshot-20260503-055213-Facebook.jpg",
"https://i.postimg.cc/SsYB3MkT/Screenshot-20260503-041729-Facebook.jpg",
"https://i.postimg.cc/9Mw6K7cX/Screenshot-20260503-041537-Facebook.jpg",
"https://i.postimg.cc/C5y3gxKd/Screenshot-20260503-041514-Facebook.jpg",
"https://i.postimg.cc/Fzj2sXf2/Screenshot-20260503-041501-Facebook.jpg",
"https://i.postimg.cc/44VC1V85/Screenshot-20260503-041451-Facebook.jpg",
"https://i.postimg.cc/Kv26pjwc/Screenshot-20260503-041438-Facebook.jpg",
"https://i.postimg.cc/HnChNvS4/Screenshot-20260503-041403-Facebook.jpg",
"https://i.postimg.cc/G3kNDrt0/Screenshot-20260503-041345-Facebook.jpg",
"https://i.postimg.cc/wTgrcPR1/Screenshot-20260503-041327-Facebook.jpg",
"https://i.postimg.cc/Sxtt4xZv/Screenshot-20260503-041314-Facebook.jpg",
"https://i.postimg.cc/CKBrxpXR/Screenshot-20260503-041300-Facebook.jpg",
"https://i.postimg.cc/TPz7yHvk/Screenshot-20260503-041246-Facebook.jpg",
"https://i.postimg.cc/63CHCL95/Screenshot-20260503-041213-Facebook.jpg",
"https://i.postimg.cc/MHx95MTN/Screenshot-20260503-041146-Facebook.jpg",
"https://i.postimg.cc/BZcY6gYg/Screenshot-20260503-064811-Tik-Tok.jpg"
];

let handler = async (m, { conn }) => {
  // ريأكت 😂
  await conn.sendMessage(m.chat, {
    react: { text: "😂", key: m.key }
  });

  let pick = links[Math.floor(Math.random() * links.length)];

  await conn.sendMessage(m.chat, {
    image: { url: pick }
  }, { quoted: m });
};

handler.command = /^ميم$/i;

export default handler;