# ✅ قائمة التحقق قبل النشر على Vercel

## 🔒 الأمان (Security)

- [x] جميع ملفات `.env*` مستبعدة من Git (في `.gitignore`)
- [x] لا توجد مفاتيح سرية في الكود المصدري
- [x] ملف `token_supabase.md` مستبعد من Git
- [x] ملفات backup (`.bak`, `.backup`) مستبعدة من Git
- [ ] تم إلغاء/تغيير المفتاح في `token_supabase.md` من Supabase Dashboard

## 📦 الملفات والتبعيات

- [x] `node_modules` مستبعد من Git
- [x] ملفات البناء (`.next`, `build`) مستبعدة من Git
- [x] ملفات التثبيت الكبيرة (`node-portable`, `.zip`, `.msi`) مستبعدة
- [x] `package.json` و `package-lock.json` موجودة ومحدثة
- [x] ملف `.env.example` موجود كمرجع

## ⚙️ الإعدادات

- [x] `next.config.mjs` موجود ومضبوط
- [x] `tsconfig.json` موجود ومضبوط
- [x] `tailwind.config.ts` موجود ومضبوط
- [x] `eslint.config.mjs` موجود ومضبوط

## 🚀 خطوات النشر على Vercel

### 1. رفع المشروع على GitHub

```bash
# تأكد من أنك في المجلد الصحيح
cd "D:\karmesh_githup\بيكب بتاريخ 4-7\delivery-agent-dashboard"

# تحقق من حالة Git
git status

# أضف التغييرات
git add .

# احذف الملفات الحساسة من Git (إذا كانت مضافة سابقاً)
git rm --cached token_supabase.md temp_delivery_boy_data.json 2>$null
git rm -r --cached node-portable 2>$null
git rm --cached *.zip *.msi 2>$null

# اعمل commit
git commit -m "chore: prepare project for production deployment"

# ارفع على GitHub
git push origin main
```

### 2. إعداد Vercel

1. **سجل دخول إلى Vercel**: https://vercel.com
2. **أنشئ مشروع جديد**:
   - اضغط "Add New Project"
   - اختر المستودع من GitHub
   - اختر المشروع `delivery-agent-dashboard`

3. **إعداد Environment Variables**:
   - في صفحة المشروع، اذهب إلى **Settings** → **Environment Variables**
   - أضف المتغيرات التالية (من `.env.local` الخاص بك):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_ENV=production
   NODE_ENV=production
   ```

   ⚠️ **مهم**: استخدم القيم الصحيحة من Supabase Dashboard، وليس القيم من `.env.example`

4. **إعدادات البناء**:
   - **Framework Preset**: Next.js (يتم اكتشافه تلقائياً)
   - **Build Command**: `npm run build` (افتراضي)
   - **Output Directory**: `.next` (افتراضي)
   - **Install Command**: `npm install` (افتراضي)

5. **نشر المشروع**:
   - اضغط "Deploy"
   - انتظر حتى يكتمل البناء
   - تحقق من أن البناء نجح بدون أخطاء

### 3. التحقق بعد النشر

- [ ] الموقع يعمل على رابط Vercel
- [ ] تسجيل الدخول يعمل بشكل صحيح
- [ ] الاتصال بـ Supabase يعمل
- [ ] لا توجد أخطاء في Console
- [ ] الصور والموارد تُحمّل بشكل صحيح

## 🔧 استكشاف الأخطاء

### إذا فشل البناء:

1. **تحقق من Logs في Vercel**:
   - اذهب إلى المشروع → **Deployments** → اختر آخر deployment → **Build Logs**

2. **الأخطاء الشائعة**:
   - **Missing Environment Variables**: تأكد من إضافة جميع المتغيرات في Vercel
   - **Build Errors**: تحقق من `package.json` و `next.config.mjs`
   - **TypeScript Errors**: تأكد من أن `tsconfig.json` صحيح

### إذا فشل الاتصال بـ Supabase:

1. **تحقق من Environment Variables**:
   - تأكد من أن `NEXT_PUBLIC_SUPABASE_URL` صحيح
   - تأكد من أن `NEXT_PUBLIC_SUPABASE_ANON_KEY` صحيح

2. **تحقق من CORS في Supabase**:
   - اذهب إلى Supabase Dashboard → Project Settings → API
   - تأكد من إضافة رابط Vercel في **Allowed Origins**

## 📝 ملاحظات إضافية

- **النسخ الاحتياطي**: احتفظ بنسخة من `.env.local` في مكان آمن (لا ترفعها على Git)
- **المفاتيح السرية**: إذا تم تسريب أي مفتاح، قم بتغييره فوراً من Supabase Dashboard
- **التحديثات**: بعد أي تغيير في Environment Variables، يجب إعادة نشر المشروع

## ✅ بعد النشر الناجح

- [ ] قم بتحديث هذا الملف ووضع علامة ✅ على العناصر المكتملة
- [ ] احفظ نسخة من Environment Variables في مكان آمن
- [ ] قم بإعداد Domain مخصص (اختياري)
- [ ] قم بإعداد SSL Certificate (يتم تلقائياً في Vercel)

