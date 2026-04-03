# المرحلة 3: إعداد Hetzner VPS + Liquidsoap + Icecast

## 🎯 الهدف
إعداد سيرفر البث الصوتي على Hetzner وتشغيل Liquidsoap + Icecast

---

## الخطوة 1: التسجيل في Hetzner Cloud

### 1.1 إنشاء حساب

1. اذهب إلى: **https://www.hetzner.com/cloud**
2. اضغط **"Sign up"** أو **"Register"**
3. املأ البيانات:
   - البريد الإلكتروني
   - كلمة المرور
   - تأكيد كلمة المرور
4. تحقق من البريد الإلكتروني

### 1.2 إضافة طريقة الدفع

1. بعد تسجيل الدخول، اذهب إلى **"Billing"** أو **"Payment"**
2. أضف:
   - **بطاقة ائتمانية** أو
   - **PayPal**
3. سيخصم **4 يورو/شهر** فقط

---

## الخطوة 2: إنشاء VPS

### 2.1 إنشاء Server جديد

1. في Dashboard اضغط **"Add Server"** أو **"Create Server"**
2. اختر الإعدادات:

| الحقل | القيمة |
|-------|--------|
| **Location** | **Falkenstein** (أقرب لأوروبا) أو **Nuremberg** |
| **Image** | **Ubuntu 22.04** |
| **Type** | **CPX11** (2 vCPU, 4GB RAM, 40GB SSD) |
| **SSH Key** | (اختياري) يمكن إضافته لاحقاً |
| **Networks** | (افتراضي) |
| **Firewalls** | (افتراضي) |

3. **Name:** `radio-karmesh` (أو أي اسم تريده)
4. اضغط **"Create & Buy Now"**

### 2.2 الحصول على معلومات الاتصال

بعد إنشاء السيرفر:
- **IP Address:** سيكون مثل `123.45.67.89`
- **Root Password:** سيظهر في Dashboard (احفظه!)

---

## الخطوة 3: الاتصال بالسيرفر

### 3.1 Windows (PowerShell أو CMD)

```bash
ssh root@YOUR_IP_ADDRESS
```

مثال:
```bash
ssh root@123.45.67.89
```

- أدخل كلمة المرور عند الطلب
- اكتب `yes` عند السؤال عن Trust

### 3.2 أو استخدم Hetzner Console

1. في Dashboard، اضغط على السيرفر
2. اضغط **"Console"** أو **"VNC Console"**
3. سيفتح متصفح للاتصال مباشرة

---

## الخطوة 4: تحديث النظام

```bash
# تحديث قائمة الحزم
sudo apt update

# ترقية النظام
sudo apt upgrade -y

# إعادة التشغيل (إذا لزم الأمر)
sudo reboot
```

---

## الخطوة 5: تثبيت Liquidsoap

### 5.1 إضافة Repository

```bash
# إضافة Liquidsoap repository
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:savonet/liquidsoap
sudo apt update
```

### 5.2 تثبيت Liquidsoap

```bash
sudo apt install -y liquidsoap
```

### 5.3 التحقق من التثبيت

```bash
liquidsoap --version
```

يجب أن يظهر رقم الإصدار.

---

## الخطوة 6: تثبيت Icecast2

### 6.1 تثبيت Icecast2

```bash
sudo apt install -y icecast2
```

### 6.2 إعداد Icecast2

أثناء التثبيت، سيطلب منك:
- **Icecast hostname:** اتركه فارغاً أو ضع IP السيرفر
- **Icecast passwords:** اضغط Enter للقيم الافتراضية (يمكن تغييرها لاحقاً)

### 6.3 تعديل إعدادات Icecast

```bash
sudo nano /etc/icecast2/icecast.xml
```

**غيّر القيم التالية:**

```xml
<hostname>YOUR_SERVER_IP</hostname>
<source-password>hackme</source-password>  <!-- غيّر هذا -->
<relay-password>hackme</relay-password>     <!-- غيّر هذا -->
<admin-password>hackme</admin-password>    <!-- غيّر هذا -->
```

**مثال:**
```xml
<hostname>123.45.67.89</hostname>
<source-password>karmesh_radio_2024</source-password>
<relay-password>karmesh_radio_2024</relay-password>
<admin-password>karmesh_admin_2024</admin-password>
```

**احفظ:** `Ctrl+X` → `Y` → `Enter`

### 6.4 تفعيل Icecast2

```bash
sudo systemctl enable icecast2
sudo systemctl start icecast2
sudo systemctl status icecast2
```

يجب أن يظهر **"active (running)"**

### 6.6 فتح Ports في Firewall

```bash
# فتح Port 8000 (Icecast)
sudo ufw allow 8000/tcp

# فتح Port 8443 (HTTPS - اختياري)
sudo ufw allow 8443/tcp

# تفعيل Firewall
sudo ufw enable
```

---

## الخطوة 7: إنشاء مجلد للملفات

```bash
# إنشاء مجلد للراديو
sudo mkdir -p /var/radio
sudo chown -R $USER:$USER /var/radio
```

---

## الخطوة 8: كتابة Liquidsoap Script

### 8.1 إنشاء السكريبت

```bash
sudo nano /var/radio/radio_karmesh.liq
```

### 8.2 محتوى السكريبت

```liquidsoap
#!/usr/bin/liquidsoap

# ============================================
# Karmesh Radio - Always-On Stream
# ============================================

# روابط M3U من Supabase Storage
playlist_url = "https://yytjguijpbahrltqjdks.supabase.co/storage/v1/object/public/radio-playlists/playlist.m3u"
ads_url = "https://yytjguijpbahrltqjdks.supabase.co/storage/v1/object/public/radio-playlists/scheduled_ads.m3u"

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

# Fallback: Playlist → Ads → Silence (إذا لم يكن هناك محتوى)
radio = fallback(track_sensitive=false, [
  playlist,
  ads,
  single("/usr/share/liquidsoap/silence.mp3")  # أو أي ملف صمت
])

# Crossfade بين الأغاني
radio = crossfade(radio)

# Normalize الصوت
radio = normalize(radio)

# Output إلى Icecast
output.icecast(
  %mp3(bitrate=128, samplerate=44100, stereo=true),
  host="localhost",
  port=8000,
  password="karmesh_radio_2024",  # نفس source-password من icecast.xml
  mount="/stream",
  name="Karmesh Radio",
  description="البث العام المستمر - Karmesh Radio",
  genre="Various",
  url="https://radio.karmesh.eg",
  radio
)
```

**احفظ:** `Ctrl+X` → `Y` → `Enter`

### 8.3 جعل السكريبت قابل للتنفيذ

```bash
chmod +x /var/radio/radio_karmesh.liq
```

---

## الخطوة 9: اختبار السكريبت

### 9.1 اختبار يدوي

```bash
liquidsoap /var/radio/radio_karmesh.liq
```

إذا ظهرت أخطاء، راجعها وأصلحها.

### 9.2 إيقاف الاختبار

اضغط `Ctrl+C`

---

## الخطوة 10: تشغيل كـ Service

### 10.1 إنشاء Systemd Service

```bash
sudo nano /etc/systemd/system/karmesh-radio.service
```

### 10.2 محتوى Service

```ini
[Unit]
Description=Karmesh Radio Always-On Stream
After=network.target icecast2.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/radio
ExecStart=/usr/bin/liquidsoap /var/radio/radio_karmesh.liq
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**احفظ:** `Ctrl+X` → `Y` → `Enter`

### 10.3 تفعيل وتشغيل Service

```bash
# إعادة تحميل systemd
sudo systemctl daemon-reload

# تفعيل Service
sudo systemctl enable karmesh-radio

# تشغيل Service
sudo systemctl start karmesh-radio

# التحقق من الحالة
sudo systemctl status karmesh-radio
```

يجب أن يظهر **"active (running)"**

---

## الخطوة 11: التحقق من البث

### 11.1 التحقق من Icecast

افتح المتصفح واذهب إلى:
```
http://YOUR_SERVER_IP:8000
```

يجب أن ترى صفحة Icecast.

### 11.2 الاستماع للبث

افتح أي مشغل صوتي واذهب إلى:
```
http://YOUR_SERVER_IP:8000/stream
```

أو استخدم VLC:
- File → Open Network Stream
- URL: `http://YOUR_SERVER_IP:8000/stream`

---

## الخطوة 12: تحديث روابط M3U في السكريبت

**⚠️ مهم:** استبدل روابط Supabase في السكريبت بروابطك الفعلية:

1. اذهب إلى Supabase Dashboard
2. Storage → radio-playlists
3. انسخ Public URL لكل ملف:
   - `playlist.m3u`
   - `scheduled_ads.m3u`
4. ضعها في السكريبت

---

## الخطوة 13: إعداد Domain (اختياري)

إذا كان لديك Domain (مثل `radio.karmesh.eg`):

1. أضف A Record في DNS:
   ```
   radio.karmesh.eg → YOUR_SERVER_IP
   ```

2. استخدم Domain في السكريبت:
   ```
   url="https://radio.karmesh.eg"
   ```

---

## 🔍 استكشاف الأخطاء

### المشكلة: Liquidsoap لا يبدأ
```bash
# تحقق من السجلات
sudo journalctl -u karmesh-radio -f

# تحقق من السكريبت
liquidsoap --check /var/radio/radio_karmesh.liq
```

### المشكلة: Icecast لا يعمل
```bash
# تحقق من الحالة
sudo systemctl status icecast2

# تحقق من السجلات
sudo tail -f /var/log/icecast2/error.log
```

### المشكلة: لا يمكن الوصول للبث
```bash
# تحقق من Firewall
sudo ufw status

# تحقق من Ports
sudo netstat -tulpn | grep 8000
```

---

## ✅ التحقق النهائي

- [ ] Hetzner VPS يعمل
- [ ] Liquidsoap مثبت
- [ ] Icecast2 مثبت ويعمل
- [ ] السكريبت يعمل
- [ ] Service يعمل تلقائياً
- [ ] البث يعمل على `http://YOUR_IP:8000/stream`
- [ ] M3U files تُحدث من Supabase

---

## 🎉 مبروك!

الآن لديك:
- ✅ سيرفر بث يعمل 24/7
- ✅ Liquidsoap يقرأ M3U من Supabase
- ✅ Icecast يبث للمستمعين
- ✅ Cron Jobs تحدث الملفات كل دقيقة

**البث يعمل الآن!** 🎵

---

## 📞 الخطوة التالية

بعد التأكد من عمل البث:
- ربط Dashboard مع Icecast (عرض المستمعين)
- إضافة إحصائيات
- تحسين جودة البث

هل تحتاج مساعدة في أي خطوة محددة؟