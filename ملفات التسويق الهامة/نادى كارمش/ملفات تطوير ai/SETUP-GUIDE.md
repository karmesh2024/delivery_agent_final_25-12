# 📚 دليل الإعداد والتنصيب الكامل
## Moharram Bey Content Automation System

---

## 🎯 نظرة عامة

هذا الدليل يشرح خطوة بخطوة كيفية إعداد نظام أتمتة المحتوى لمحرم بك من الصفر.

**⏱️ وقت الإعداد:** 30-60 دقيقة  
**💰 التكلفة:** $0-5/شهر  
**📊 المستوى:** متوسط (يحتاج خبرة تقنية بسيطة)

---

## 📋 المتطلبات الأساسية

### 1️⃣ الحسابات المطلوبة (كلها مجانية)

- [ ] حساب **Groq** (للـ AI - مجاني)
- [ ] حساب **Together AI** (للصور - $25 credit مجاني)
- [ ] حساب **Notion** (للتخزين - مجاني)
- [ ] حساب **Telegram** (للإشعارات - مجاني)
- [ ] حساب **GNews** (للأخبار - مجاني)
- [ ] **n8n** (Self-hosted أو Cloud)

### 2️⃣ المتطلبات التقنية

**للتشغيل المحلي (Local):**
```
• نظام التشغيل: Linux/Mac/Windows
• Docker: نسخة 20+
• RAM: 2GB على الأقل
• Storage: 5GB فاضي
```

**للتشغيل السحابي (VPS):**
```
• VPS مع Ubuntu 22.04
• 2GB RAM
• 20GB Storage
• مثال: Hetzner CX11 (€4/شهر)
```

---

## 🚀 الخطوة 1: إنشاء الحسابات والحصول على API Keys

### 1.1 Groq API (AI مجاني) 🤖

1. اذهب إلى: https://console.groq.com
2. سجل بالإيميل (مجاني تماماً)
3. اضغط **API Keys** من القائمة
4. اضغط **Create API Key**
5. انسخ المفتاح (يبدأ بـ `gsk_...`)
6. احفظه في ملف نصي

**📝 ملاحظة:** Free tier = 30 requests/minute (أكثر من كافي!)

---

### 1.2 Together AI API (للصور) 🎨

1. اذهب إلى: https://api.together.xyz
2. سجل بالإيميل
3. ستحصل على **$25 credit مجاني** 🎉
4. من Dashboard → **API Keys**
5. انسخ API Key
6. احفظه

**💰 التكلفة:**
- Flux Schnell: $0.002/صورة
- $25 = ~12,500 صورة!
- 450 صورة/شهر = $0.90 فقط

---

### 1.3 GNews API (للأخبار) 📰

1. اذهب إلى: https://gnews.io
2. سجل بالإيميل (مجاني)
3. اختر **Free Plan**:
   - 100 requests/يوم
   - يكفي لـ 3 تنفيذات يومية
4. انسخ API Key من Dashboard
5. احفظه

---

### 1.4 Notion Database 💾

#### الخطوة الأولى: إنشاء Integration

1. اذهب إلى: https://www.notion.so/my-integrations
2. اضغط **+ New integration**
3. الاسم: `Moharram Bey Automation`
4. Workspace: اختر workspace حسابك
5. Capabilities: 
   - ✅ Read content
   - ✅ Insert content
   - ✅ Update content
6. اضغط **Submit**
7. انسخ **Internal Integration Token**

#### الخطوة الثانية: إنشاء Database

1. افتح Notion
2. اعمل صفحة جديدة: `📱 Moharram Bek Content Queue`
3. اضف **Database - Table View**
4. أضف الأعمدة التالية:

```
┌─────────────────────────────────────────────────┐
│ اسم العمود      │ النوع         │ الإعدادات    │
├─────────────────────────────────────────────────┤
│ العنوان         │ Title         │ -            │
│ نص البوست       │ Text          │ Long text    │
│ الأسلوب         │ Select        │ رسمي،شبابي،  │
│                 │               │ تفاعلي       │
│ الهاشتاجات      │ Text          │ -            │
│ رابط الصورة     │ URL           │ -            │
│ المصدر          │ Text          │ -            │
│ رابط الخبر      │ URL           │ -            │
│ الحالة          │ Select        │ للمراجعة،    │
│                 │               │ معتمد،مرفوض  │
│ التاريخ         │ Date          │ -            │
└─────────────────────────────────────────────────┘
```

5. اضغط **⋯** (ثلاث نقاط) بجانب اسم الـ Database
6. اختر **Add connections**
7. اختر الـ Integration اللي أنشأته
8. انسخ **Database ID** من الرابط:
   ```
   https://notion.so/workspace/DATABASE_ID?v=...
                              ^^^^^^^^^^^^
   ```

---

### 1.5 Telegram Bot 📲

1. افتح Telegram
2. ابحث عن: `@BotFather`
3. أرسل: `/newbot`
4. اكتب اسم البوت: `Moharram Bey Content Bot`
5. اكتب username: `moharrambey_content_bot`
6. انسخ **Bot Token** (مثل: `123456:ABC-DEF...`)
7. للحصول على Chat ID:
   - ابحث عن: `@userinfobot`
   - أرسل أي رسالة
   - انسخ الـ **Id** (مثل: `987654321`)

---

## 🔧 الخطوة 2: تنصيب n8n

### الطريقة 1: Docker (الأسهل - موصى بها) 🐳

#### على جهازك المحلي:

```bash
# إنشاء مجلد للبيانات
mkdir ~/.n8n
chmod 777 ~/.n8n

# تشغيل n8n
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n

# التحقق من التشغيل
docker logs n8n
```

**🌐 افتح المتصفح:** http://localhost:5678

#### على VPS (Ubuntu):

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تنصيب Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# إنشاء مجلد البيانات
mkdir -p ~/n8n-data
chmod 777 ~/n8n-data

# تشغيل n8n
docker run -d \
  --name n8n \
  --restart always \
  -p 5678:5678 \
  -e N8N_HOST="your-ip-or-domain" \
  -e N8N_PROTOCOL="http" \
  -e WEBHOOK_URL="http://your-ip:5678/" \
  -v ~/n8n-data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n

# فتح البورت في Firewall
sudo ufw allow 5678/tcp
```

**🌐 افتح المتصفح:** http://YOUR_VPS_IP:5678

---

### الطريقة 2: n8n Cloud (الأسهل لكن مدفوع) ☁️

1. اذهب إلى: https://n8n.io/cloud
2. سجل حساب
3. اختر **Starter Plan** ($20/شهر)
4. انتهى! ✅

**🎯 مميزات:**
- ✅ بدون إعداد
- ✅ صيانة تلقائية
- ✅ Backups
- ✅ SSL مجاني

---

## 📥 الخطوة 3: استيراد الـ Workflow

### 3.1 تحميل ملف JSON

1. احفظ الملف: `moharram-bey-content-automation.json`
2. افتح n8n في المتصفح
3. من القائمة العلوية → **Workflows**
4. اضغط **Import from File**
5. اختر الملف الذي حفظته
6. اضغط **Import**

---

### 3.2 إعداد Credentials

#### أ) Groq API Credential

1. في الـ Workflow، اضغط على Node **"Qwen Analysis (Groq)"**
2. اضغط **Create New Credential**
3. اختر نوع: **HTTP Request - Custom Auth**
4. Name: `Groq API`
5. في Authentication:
   - Method: **Header Auth**
   - Name: `Authorization`
   - Value: `Bearer YOUR_GROQ_API_KEY`
6. Save

**أو الطريقة الأسهل:**
- اختر **Generic Credential Type** → **HTTP Header Auth**
- Header Name: `Authorization`
- Header Value: `Bearer gsk_your_actual_key_here`

---

#### ب) Together AI Credential

1. اضغط على Node **"Generate Image (Together AI)"**
2. Create New Credential
3. نفس الطريقة:
   - Header Name: `Authorization`
   - Value: `Bearer YOUR_TOGETHER_API_KEY`

---

#### ج) Notion Credential

1. اضغط على Node **"Save to Notion"**
2. Create New Credential
3. اختر **Notion API**
4. API Key: (الـ Internal Integration Token من Notion)
5. Save

**ثم في الـ Node:**
- Database ID: (الـ ID اللي نسخته من Notion)

---

#### د) Telegram Credential

1. اضغط على Node **"Send Telegram Notification"**
2. Create New Credential
3. اختر **Telegram API**
4. Access Token: (الـ Bot Token من BotFather)
5. Save

**ثم في الـ Node:**
- Chat ID: (الـ ID اللي حصلت عليه من @userinfobot)

---

#### هـ) GNews API

في Node **"GNews API"**:
- استبدل `YOUR_API_KEY` بالمفتاح الحقيقي
- URL: `https://gnews.io/api/v4/search?q=الإسكندرية محرم بك&lang=ar&country=eg&max=10&apikey=YOUR_ACTUAL_KEY`

---

## ✅ الخطوة 4: اختبار الـ Workflow

### 4.1 اختبار يدوي

1. في n8n، اضغط **Execute Workflow** (زر التشغيل ▶️)
2. راقب الـ Nodes وهي تشتغل واحدة تلو الأخرى
3. تحقق من:
   - ✅ جمع الأخبار من RSS
   - ✅ جمع الأخبار من GNews API
   - ✅ تحليل Qwen
   - ✅ توليد الصورة
   - ✅ الحفظ في Notion
   - ✅ إشعار Telegram

### 4.2 التحقق من النتائج

**في Notion:**
- افتح Database
- يجب أن تجد 15 entry جديدة (5 أخبار × 3 بوستات)

**في Telegram:**
- يجب أن تستلم 15 رسالة
- كل رسالة تحتوي على تفاصيل بوست واحد

---

### 4.3 حل المشاكل الشائعة

#### Problem: "Authentication failed" في Groq
```
الحل:
1. تأكد أن API Key صحيح
2. تحقق أنه يبدأ بـ gsk_
3. تأكد من كتابة Bearer قبل المفتاح
```

#### Problem: "Database not found" في Notion
```
الحل:
1. تأكد من إضافة Integration للـ Database
2. تحقق من Database ID
3. جرب Copy ID مرة ثانية
```

#### Problem: "Rate limit exceeded"
```
الحل:
1. Groq: انتظر دقيقة (30 req/min)
2. GNews: قلل عدد التنفيذات (100/day)
3. Together AI: تحقق من Credits
```

---

## 🔄 الخطوة 5: جدولة التشغيل التلقائي

### 5.1 تفعيل الـ Workflow

1. في n8n، اضغط **Active** (مفتاح التفعيل أعلى اليمين)
2. الآن الـ Workflow يشتغل تلقائياً كل 8 ساعات

### 5.2 تخصيص الجدولة

إذا تريد تغيير الأوقات:

1. اضغط على Node **"Every 8 Hours"**
2. في Settings:
   - **Interval**: Hours
   - **Hours Between Triggers**: غيّر من 8 إلى أي رقم تريده
3. أو استخدم **Cron Expression** لأوقات محددة:

```cron
# مثال: كل يوم الساعة 9 صباحاً، 3 عصراً، 9 مساءً
0 9,15,21 * * *
```

---

## 📊 الخطوة 6: المراقبة والصيانة

### 6.1 Dashboard Notion

أنشئ View في Notion Database:

**Board View (Kanban):**
```
Columns:
├─ للمراجعة (Pending Review)
├─ معتمد (Approved)
└─ مرفوض (Rejected)
```

**Workflow:**
1. تستلم إشعار تليجرام
2. تفتح Notion
3. تراجع البوست
4. تسحبه لـ "معتمد" أو "مرفوض"
5. تنسخ البوست المعتمد
6. تنشره على Facebook/Instagram

---

### 6.2 تتبع التكاليف

أنشئ جدول بسيط:

```
| الشهر      | Together AI Credits | GNews Calls | Total |
|-----------|---------------------|-------------|-------|
| فبراير    | $1.20 (600 صورة)   | Free        | $1.20 |
| مارس      | $0.90 (450 صورة)   | Free        | $0.90 |
```

---

### 6.3 Backup

#### Backup Notion:
- Notion → Settings → Export all workspace content
- كل أسبوع

#### Backup n8n Workflow:
```bash
# من n8n interface
Workflows → ⋯ → Download

# أو من Docker
docker exec n8n n8n export:workflow --all --output=/backup/
docker cp n8n:/backup/ ~/n8n-backups/
```

---

## 🎨 الخطوة 7: التخصيص المتقدم

### 7.1 تحسين Prompts

عدّل الـ Prompt في Node **"Qwen Analysis"**:

```javascript
// Prompt الحالي
`أنت محلل محتوى لمحرم بك...`

// أضف تخصيصات:
`أنت محلل محتوى لمحرم بك.
الجمهور المستهدف: شباب 18-35 سنة
الأسلوب: عصري، بسيط، جذاب
الهدف: زيادة التفاعل

قواعد:
- استخدم اللغة العامية المصرية البسيطة
- أضف emojis مناسبة
- اجعل البوست قصير (150 حرف max)
- ركز على الجانب الإيجابي
...`
```

---

### 7.2 إضافة مصادر أخبار جديدة

1. أضف Node جديد: **HTTP Request**
2. الرابط: `https://newsdata.io/api/1/news?apikey=YOUR_KEY&q=محرم بك&language=ar`
3. وصّله بـ Node **"Merge & Filter News"**

**مصادر مقترحة:**
- NewsData.io (200 req/day free)
- Bing News API (مجاني)
- Custom RSS من مواقع محلية

---

### 7.3 تحسين جودة الصور

في Node **"Generate Image"**:

```javascript
// Prompt محسّن
prompt: `Professional photo of ${description},
Moharram Bek Alexandria Egypt,
Urban street photography, 
Golden hour lighting,
Cinematic composition,
High resolution 4K,
Vibrant Egyptian colors,
Social media optimized,
--ar 1:1 --style photography`

// زيادة الـ Steps (أبطأ لكن أجود)
steps: 8  // بدل 4

// استخدام Model أقوى (أغلى)
model: "black-forest-labs/FLUX.1-dev"  // $0.025/صورة
```

---

### 7.4 إضافة فلتر Spam

في Node **"Merge & Filter News"**:

```javascript
// أضف فلتر لاستبعاد أخبار معينة
const blockedKeywords = ['جريمة', 'حادث', 'وفاة'];

const filteredNews = allNews.filter(news => {
  const title = news.title.toLowerCase();
  return !blockedKeywords.some(word => title.includes(word));
});
```

---

## 🚀 الخطوة 8: التوسع (اختياري)

### 8.1 نشر تلقائي على Facebook

1. أضف Node: **Facebook Graph API**
2. احصل على Access Token من Facebook Developers
3. وصّله بعد Node **"Save to Notion"**

```javascript
// Facebook Post Node
POST https://graph.facebook.com/v18.0/PAGE_ID/feed

Body:
{
  "message": "{{ $json.post_text }}\n\n{{ $json.hashtags }}",
  "link": "{{ $json.news_url }}",
  "access_token": "YOUR_FB_TOKEN"
}
```

**⚠️ ملاحظة:** يحتاج موافقة صفحة + permissions

---

### 8.2 تحليل الأداء

أضف Node: **Google Sheets**

```javascript
// حفظ إحصائيات في Sheet
Columns:
- التاريخ
- عدد الأخبار
- عدد البوستات
- التكلفة
- الوقت المستغرق
```

---

### 8.3 A/B Testing

```javascript
// في Node "Prepare Posts"
// أضف variations إضافية
const variations = [
  { style: 'رسمي', emoji: '📰' },
  { style: 'شبابي', emoji: '🔥' },
  { style: 'تفاعلي', emoji: '💬' },
  { style: 'مضحك', emoji: '😂' },  // جديد
  { style: 'ملهم', emoji: '✨' }   // جديد
];
```

---

## 📱 الخطوة 9: Workflow للنشر

### 9.1 إنشاء Workflow ثاني للنشر

```
Notion Database Trigger
  → فلتر (Status = معتمد)
  → Facebook Post
  → تحديث Status في Notion (منشور)
  → إشعار Telegram (تم النشر)
```

---

## 🔒 الخطوة 10: الأمان

### 10.1 تأمين n8n

إذا على VPS:

```bash
# تنصيب Nginx
sudo apt install nginx

# إعداد SSL مع Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# الحصول على شهادة
sudo certbot --nginx -d your-domain.com

# إعادة توجيه n8n خلف Nginx
sudo nano /etc/nginx/sites-available/n8n
```

**ملف Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### 10.2 حماية API Keys

```bash
# استخدام Environment Variables
docker run -d \
  --name n8n \
  -e GROQ_API_KEY="gsk_..." \
  -e TOGETHER_API_KEY="..." \
  -e GNEWS_API_KEY="..." \
  docker.n8n.io/n8nio/n8n

# في Workflow، استخدم:
{{ $env.GROQ_API_KEY }}
```

---

## 📈 نصائح للنجاح

### ✅ Best Practices

1. **ابدأ صغير:**
   - شغّل مرة واحدة يدوياً يومياً أول أسبوع
   - راقب النتائج
   - عدّل حسب الحاجة

2. **راجع دائماً:**
   - لا تنشر بدون مراجعة بشرية
   - AI ممكن يخطئ
   - الجودة أهم من الكمية

3. **تفاعل مع الجمهور:**
   - رد على التعليقات
   - استخدم feedback لتحسين Prompts
   - اسأل جمهورك عن المواضيع المفضلة

4. **قيّم الأداء:**
   - تتبع engagement (likes, comments, shares)
   - أي أسلوب يشتغل أحسن؟
   - غيّر الاستراتيجية بناءً على النتائج

---

## 🆘 الدعم والمساعدة

### مشاكل شائعة:

**1. n8n لا يعمل:**
```bash
docker logs n8n  # شوف الـ logs
docker restart n8n  # أعد التشغيل
```

**2. Workflow يفشل:**
- شوف الـ Error في Node
- تحقق من Credentials
- جرب تنفيذ Node لوحده

**3. API Limits:**
- راقب الاستخدام في Dashboards
- قلل عدد التنفيذات
- upgrade للـ Paid tier إذا لزم

---

## 🎯 الخلاصة

**بعد اتباع هذا الدليل، يجب أن يكون عندك:**

✅ نظام يعمل تلقائياً كل 8 ساعات  
✅ يجمع أخبار محرم بك من مصادر متعددة  
✅ يحللها بالذكاء الاصطناعي  
✅ يولد 3 بوستات مختلفة لكل خبر  
✅ يصمم صورة لكل بوست  
✅ يحفظ كل شيء في Notion للمراجعة  
✅ يرسل إشعارات فورية  
✅ كل ده بتكلفة $0-5/شهر فقط!  

---

**🚀 جاهز للإطلاق؟**

ابدأ الآن ووفر ساعات من العمل اليدوي! 💪
