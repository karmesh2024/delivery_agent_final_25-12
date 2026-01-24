#!/usr/bin/liquidsoap

# =====================================================
# راديو كارمش - سكريبت Liquidsoap
# Radio Karmesh - Liquidsoap Script
# =====================================================
# 
# التثبيت على السيرفر (Ubuntu/Debian):
# sudo apt-get install liquidsoap icecast2
#
# تشغيل:
# liquidsoap /etc/liquidsoap/radio_karmesh.liq
#
# أو كخدمة systemd:
# sudo systemctl enable liquidsoap
# sudo systemctl start liquidsoap
# =====================================================

# ====================
# إعدادات عامة
# ====================
set("log.file", true)
set("log.file.path", "/var/log/liquidsoap/radio_karmesh.log")
set("log.level", 3)

# ====================
# إعدادات Icecast
# ====================
icecast_host = "localhost"
icecast_port = 8000
icecast_password = "YOUR_ICECAST_PASSWORD"  # غيّر هذا!
icecast_mount = "/stream"

# ====================
# مسارات ملفات M3U
# ====================
# يمكن استخدام روابط HTTP مباشرة أو ملفات محلية

# الخيار 1: ملفات محلية (يُفضل للموثوقية)
playlist_path = "/var/radio/playlist.m3u"
ads_path = "/var/radio/scheduled_ads.m3u"
music_path = "/var/radio/music.m3u"

# الخيار 2: روابط HTTP (من Supabase Storage)
# playlist_url = "https://your-supabase-url.supabase.co/storage/v1/object/public/radio-playlists/playlist.m3u"
# ads_url = "https://your-supabase-url.supabase.co/storage/v1/object/public/radio-playlists/scheduled_ads.m3u"

# ====================
# ملف Fallback (صمت أو موسيقى احتياطية)
# ====================
fallback_path = "/var/radio/fallback.mp3"

# ====================
# مصادر الصوت
# ====================

# 1. البث المباشر (Live Input)
# يستقبل البث من تطبيق المذيع
live = input.http(
  "http://localhost:8001/live",
  max=30.0
)

# فحص حالة البث المباشر
live = strip_blank(
  live,
  max_blank=10.0,
  threshold=-40.0
)

# 2. قائمة التشغيل الرئيسية (Always-On Playlist)
# reload_mode="rounds" = إعادة تحميل بعد كل جولة
playlist = playlist.safe(
  reload_mode="rounds",
  reload=1,
  playlist_path
)

# 3. الإعلانات المجدولة
# تُحمّل من ملف منفصل ليسهل التحكم فيها
ads = playlist.safe(
  reload_mode="rounds",
  reload=1,
  ads_path
)

# 4. موسيقى الخلفية (اختياري - للمستقبل)
# music = playlist.safe(
#   reload_mode="rounds",
#   reload=1,
#   music_path
# )

# 5. Fallback (صمت أو موسيقى احتياطية)
fallback_source = single(fallback_path)

# ====================
# منطق Fallback
# ====================
# الأولوية: Live > Ads > Playlist > Fallback

# دمج الإعلانات مع Playlist
# الإعلانات تأتي أولاً إذا كانت متاحة
content = fallback(
  track_sensitive=true,
  [ads, playlist]
)

# البث المباشر يأخذ الأولوية القصوى
radio = fallback(
  track_sensitive=false,
  [live, content, fallback_source]
)

# ====================
# تحسينات الصوت
# ====================

# Crossfade بين المقاطع (انتقال سلس)
radio = crossfade(
  duration=3.0,
  fade_out=2.0,
  fade_in=1.0,
  radio
)

# تطبيع مستوى الصوت
radio = normalize(
  target=-14.0,
  radio
)

# ====================
# إخراج Icecast
# ====================

# إخراج MP3 (128kbps)
output.icecast(
  %mp3(
    bitrate=128,
    samplerate=44100,
    stereo=true
  ),
  host=icecast_host,
  port=icecast_port,
  password=icecast_password,
  mount=icecast_mount,
  name="راديو كارمش",
  description="راديو كارمش - البث المستمر",
  genre="Talk",
  url="https://karmesh.eg",
  public=true,
  radio
)

# ====================
# إخراج AAC (اختياري - جودة أعلى)
# ====================
# output.icecast(
#   %fdkaac(
#     bitrate=96,
#     samplerate=44100,
#     channels=2
#   ),
#   host=icecast_host,
#   port=icecast_port,
#   password=icecast_password,
#   mount="/stream-aac",
#   name="راديو كارمش AAC",
#   description="راديو كارمش - البث المستمر (AAC)",
#   radio
# )

# ====================
# Telnet للتحكم (اختياري)
# ====================
# set("server.telnet", true)
# set("server.telnet.bind_addr", "127.0.0.1")
# set("server.telnet.port", 1234)

# ====================
# نهاية السكريبت
# ====================
