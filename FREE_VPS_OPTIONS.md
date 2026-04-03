# خيارات VPS مجانية أو رخيصة جداً للبث الصوتي

## ⚠️ Hetzner لا يقدم خطة مجانية

Hetzner Cloud **لا يقدم خطة مجانية دائمة**، لكن:
- ✅ قد يعطون **20 يورو كرصيد تجريبي** عند التسجيل (يكفي لعدة أشهر)
- ✅ أرخص خطة: **~4 يورو/شهر** (CPX11)

---

## 🆓 خيارات مجانية (Free Tier)

### 1. Oracle Cloud Free Tier ⭐ **الأفضل للمجانية**

**المميزات:**
- ✅ **مجاني تماماً** (دون انتهاء)
- ✅ 2 VMs مجانية:
  - 1/8 OCPU, 1GB RAM (Ampere ARM)
  - أو 1/8 OCPU, 1GB RAM (x86)
- ✅ 200GB Storage مجاني
- ✅ Bandwidth: 10TB/شهر مجاني

**العيوب:**
- ⚠️ قد يكون التسجيل صعب (يطلب بطاقة ائتمانية لكن لا يخصم)
- ⚠️ ARM قد يحتاج تعديلات في التثبيت

**الرابط:** https://www.oracle.com/cloud/free/

---

### 2. AWS Free Tier

**المميزات:**
- ✅ **EC2 t2.micro مجاني** لمدة 12 شهر
- ✅ 750 ساعة/شهر
- ✅ 1GB RAM, 1 vCPU

**العيوب:**
- ⚠️ مجاني فقط **12 شهر** (بعدها مدفوع)
- ⚠️ قد يكون معقد للمبتدئين

**الرابط:** https://aws.amazon.com/free/

---

### 3. Google Cloud Free Tier

**المميزات:**
- ✅ **$300 كرصيد مجاني** (يكفي لعدة أشهر)
- ✅ e2-micro مجاني (مع قيود)

**العيوب:**
- ⚠️ معقد قليلاً
- ⚠️ الرصيد ينتهي بعد الاستخدام

**الرابط:** https://cloud.google.com/free

---

### 4. Azure Free Tier

**المميزات:**
- ✅ **$200 كرصيد مجاني** لمدة 30 يوم
- ✅ بعدها B1s مجاني (مع قيود)

**العيوب:**
- ⚠️ الرصيد ينتهي بعد 30 يوم
- ⚠️ B1s محدود جداً

**الرابط:** https://azure.microsoft.com/free/

---

## 💰 خيارات رخيصة جداً (أقل من 5$/شهر)

### 1. Hetzner Cloud CPX11 ⭐ **موصى به**

**السعر:** ~4 يورو/شهر (~4.5$)
**المواصفات:**
- 2 vCPU
- 4GB RAM
- 40GB SSD
- 20TB Traffic

**الرابط:** https://www.hetzner.com/cloud

---

### 2. DigitalOcean Basic Droplet

**السعر:** $6/شهر
**المواصفات:**
- 1 vCPU
- 1GB RAM
- 25GB SSD
- 1TB Transfer

**الرابط:** https://www.digitalocean.com/pricing

---

### 3. Vultr Regular Performance

**السعر:** $6/شهر
**المواصفات:**
- 1 vCPU
- 1GB RAM
- 25GB SSD
- 1TB Bandwidth

**الرابط:** https://www.vultr.com/pricing/

---

### 4. Contabo VPS

**السعر:** ~4 يورو/شهر
**المواصفات:**
- 2 vCPU
- 4GB RAM
- 50GB SSD
- Unlimited Traffic

**الرابط:** https://contabo.com/en/vps/

---

## 🎯 التوصية حسب الميزانية

| الميزانية | الخيار الموصى به | السبب |
|-----------|------------------|-------|
| **0$ (مجاني)** | Oracle Cloud Free Tier | مجاني دائم، مواصفات جيدة |
| **4-5$/شهر** | Hetzner CPX11 | أرخص وأفضل أداء |
| **6$/شهر** | DigitalOcean | سهل الاستخدام |

---

## 📊 مقارنة سريعة

| Provider | السعر | RAM | CPU | Bandwidth | ملاحظات |
|----------|------|-----|-----|-----------|---------|
| **Oracle Free** | مجاني | 1GB | 1/8 | 10TB | ⭐ أفضل مجاني |
| **Hetzner CPX11** | 4€ | 4GB | 2 | 20TB | ⭐ أفضل مدفوع |
| **DigitalOcean** | $6 | 1GB | 1 | 1TB | سهل الاستخدام |
| **AWS Free** | مجاني (12 شهر) | 1GB | 1 | محدود | معقد |

---

## 🚀 خطوات البدء مع Oracle Cloud (مجاني)

1. **التسجيل:**
   - اذهب إلى: https://www.oracle.com/cloud/free/
   - سجل حساب جديد (يطلب بطاقة لكن لا يخصم)

2. **إنشاء VM:**
   - Compute → Instances → Create Instance
   - اختر: **Ampere A1** (ARM) أو **VM.Standard.E2.1.Micro** (x86)
   - OS: **Ubuntu 22.04**

3. **تثبيت Liquidsoap + Icecast:**
   ```bash
   sudo apt update
   sudo apt install -y liquidsoap icecast2
   ```

4. **إعداد البث:**
   - اتبع دليل المرحلة 3

---

## ⚠️ ملاحظات مهمة

### للمجانية:
- Oracle Cloud هو **الأفضل** للمجانية الدائمة
- AWS/Azure/GCP مجانية لفترة محدودة فقط

### للمدفوعة:
- Hetzner **أرخص وأفضل أداء**
- DigitalOcean **أسهل استخدام**

### للبث الصوتي:
- **1GB RAM** يكفي للبث الأساسي
- **2GB+ RAM** أفضل للأداء
- **Bandwidth:** تأكد من وجود ما يكفي (10TB في Oracle مجاني)

---

## 🎉 الخلاصة

**إذا ميزانيتك 0$:**
→ استخدم **Oracle Cloud Free Tier** (مجاني دائم)

**إذا ميزانيتك 4-5$/شهر:**
→ استخدم **Hetzner CPX11** (أفضل قيمة)

**إذا تريد سهولة:**
→ استخدم **DigitalOcean** ($6/شهر)

---

## 📞 الخطوة التالية

بعد اختيار VPS:
1. إنشاء VM
2. تثبيت Liquidsoap + Icecast
3. إعداد السكريبت
4. ربط مع Supabase

هل تريد المساعدة في:
- التسجيل في Oracle Cloud (مجاني)؟
- إعداد Hetzner (مدفوع)؟
- كتابة دليل تثبيت Liquidsoap + Icecast؟