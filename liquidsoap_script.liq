#!/usr/bin/liquidsoap

# ============================================
# Karmesh Radio - Always-On Stream
# Liquidsoap Script for Radio Broadcasting
# ============================================

# ============================================
# Configuration
# ============================================

# روابط M3U من Supabase Storage
# ⚠️ استبدل هذه الروابط بروابطك الفعلية من Supabase Dashboard
playlist_url = "https://yytjguijpbahrltqjdks.supabase.co/storage/v1/object/public/radio-playlists/playlist.m3u"
ads_url = "https://yytjguijpbahrltqjdks.supabase.co/storage/v1/object/public/radio-playlists/scheduled_ads.m3u"

# إعدادات Icecast
icecast_host = "localhost"
icecast_port = 8000
icecast_password = "karmesh_radio_2024"  # ⚠️ استبدل بكلمة المرور من icecast.xml
icecast_mount = "/stream"

# إعدادات البث
stream_name = "Karmesh Radio"
stream_description = "البث العام المستمر - Karmesh Radio"
stream_genre = "Various"
stream_url = "https://radio.karmesh.eg"  # ⚠️ استبدل برابطك الفعلي

# ============================================
# Playlists
# ============================================

# Playlist الرئيسية (يتم تحديثها كل دقيقة من Cron)
playlist = playlist.safe(
  reload_mode="rounds",
  reload=60,  # إعادة تحميل كل 60 ثانية
  playlist_url
)

# الإعلانات المجدولة
ads = playlist.safe(
  reload_mode="rounds",
  reload=60,  # إعادة تحميل كل 60 ثانية
  ads_url
)

# ============================================
# Fallback Logic
# ============================================

# Fallback: Playlist → Ads → Silence (إذا لم يكن هناك محتوى)
radio = fallback(track_sensitive=false, [
  playlist,
  ads,
  single("/usr/share/liquidsoap/silence.mp3")  # ملف صمت احتياطي
])

# ============================================
# Audio Processing
# ============================================

# Crossfade بين الأغاني (انتقال سلس)
radio = crossfade(radio)

# Normalize الصوت (توحيد مستوى الصوت)
radio = normalize(radio)

# ============================================
# Output to Icecast
# ============================================

output.icecast(
  %mp3(bitrate=128, samplerate=44100, stereo=true),
  host=icecast_host,
  port=icecast_port,
  password=icecast_password,
  mount=icecast_mount,
  name=stream_name,
  description=stream_description,
  genre=stream_genre,
  url=stream_url,
  radio
)

# ============================================
# Logging
# ============================================

# تسجيل الأحداث
log.level = 3  # Info level
log.file.path = "/var/radio/liquidsoap.log"