
import sys
import requests

query = sys.argv[1]

# Spotify public API أو scraping (مثال عبر https://api.spotify.com/v1/search يتطلب Token)
# هنا مجرد مثال باستخدام Spotify Web Search Scraping
search_url = f"https://api.spotify.com/v1/search?q={query}&type=track&limit=3"
headers = {
    "Authorization": "Bearer INSERT_YOUR_SPOTIFY_TOKEN"  # تحتاج تحصل على Access Token من Spotify ༒⫷ 𝙍𝘼𝙂𝙉𝘼 • 𝘾𝙍𝙄𝙈𝙎𝙊𝙉 ⫸༒
}
resp = requests.get(search_url, headers=headers).json()

tracks = resp.get("tracks", {}).get("items", [])
if not tracks:
    print("❌ لم يتم العثور على أي نتيجة")
else:
    for t in tracks:
        print(f"{t['name']} - {t['artists'][0]['name']}\n{t['external_urls']['spotify']}")
