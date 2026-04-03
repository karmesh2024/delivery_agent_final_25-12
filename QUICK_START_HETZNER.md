# 🚀 Quick Start Guide - Hetzner VPS Setup

## ⚡ الإعداد السريع (30 دقيقة)

---

## الخطوة 1: التسجيل وإنشاء VPS (10 دقائق)

1. **التسجيل:** https://www.hetzner.com/cloud
2. **إنشاء Server:**
   - Type: **CPX11** (4 يورو/شهر)
   - Image: **Ubuntu 22.04**
   - Location: **Falkenstein**
3. **احفظ:** IP Address و Root Password

---

## الخطوة 2: الاتصال (2 دقيقة)

```bash
ssh root@YOUR_IP_ADDRESS
```

---

## الخطوة 3: التثبيت (10 دقائق)

### نسخ ولصق هذا الأمر كاملاً:

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Liquidsoap
sudo apt install -y software-properties-common
sudo add-apt-repository -y ppa:savonet/liquidsoap
sudo apt update
sudo apt install -y liquidsoap

# تثبيت Icecast2
sudo apt install -y icecast2

# فتح Ports
sudo ufw allow 8000/tcp
sudo ufw enable

# إنشاء مجلد
sudo mkdir -p /var/radio
sudo chown -R $USER:$USER /var/radio
```

---

## الخطوة 4: إعداد Icecast (5 دقائق)

```bash
# تعديل الإعدادات
sudo nano /etc/icecast2/icecast.xml
```

**غيّر:**
- `<hostname>` → IP السيرفر
- `<source-password>` → `karmesh_radio_2024`
- `<admin-password>` → `karmesh_admin_2024`

**احفظ:** `Ctrl+X` → `Y` → `Enter`

```bash
# تشغيل Icecast
sudo systemctl enable icecast2
sudo systemctl start icecast2
```

---

## الخطوة 5: إنشاء Liquidsoap Script (3 دقائق)

```bash
sudo nano /var/radio/radio_karmesh.liq
```

**انسخ محتوى ملف `liquidsoap_script.liq`** (موجود في المشروع)

**⚠️ غيّر:**
- `playlist_url` → رابط Supabase الفعلي
- `ads_url` → رابط Supabase الفعلي
- `icecast_password` → نفس password من icecast.xml

**احفظ:** `Ctrl+X` → `Y` → `Enter`

```bash
chmod +x /var/radio/radio_karmesh.liq
```

---

## الخطوة 6: تشغيل كـ Service (2 دقيقة)

```bash
# نسخ service file
sudo cp karmesh-radio.service /etc/systemd/system/

# تفعيل وتشغيل
sudo systemctl daemon-reload
sudo systemctl enable karmesh-radio
sudo systemctl start karmesh-radio

# التحقق
sudo systemctl status karmesh-radio
```

---

## الخطوة 7: الاختبار (1 دقيقة)

افتح المتصفح:
```
http://YOUR_IP_ADDRESS:8000/stream
```

أو استخدم VLC:
- File → Open Network Stream
- URL: `http://YOUR_IP_ADDRESS:8000/stream`

---

## ✅ تم!

البث يعمل الآن! 🎵

---

## 🔍 إذا واجهت مشاكل

### Liquidsoap لا يعمل:
```bash
sudo journalctl -u karmesh-radio -f
```

### Icecast لا يعمل:
```bash
sudo systemctl status icecast2
sudo tail -f /var/log/icecast2/error.log
```

### لا يمكن الوصول:
```bash
sudo ufw status
sudo netstat -tulpn | grep 8000
```

---

## 📝 ملاحظات مهمة

1. **روابط Supabase:** تأكد من استبدالها بروابطك الفعلية
2. **كلمات المرور:** غيّرها في icecast.xml والسكريبت
3. **Domain:** إذا كان لديك domain، أضف A Record في DNS

---

## 📞 الخطوة التالية

بعد التأكد من عمل البث:
- ربط Dashboard مع Icecast
- إضافة إحصائيات
- تحسين الجودة

**راجع:** `PHASE_3_HETZNER_SETUP.md` للتفاصيل الكاملة