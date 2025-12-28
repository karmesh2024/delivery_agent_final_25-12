# 🚀 دليل سريع لنسخ الملفات للمشروع النهائي

## الطريقة السريعة (PowerShell)

افتح PowerShell في المجلد الرئيسي وقم بتشغيل:

```powershell
.\copy-to-final.ps1
```

## الطريقة اليدوية

### الخطوة 1: الملفات الأساسية
انسخ هذه الملفات من المجلد الرئيسي إلى `delivery_agent_final_25-12`:

- `package.json`
- `package-lock.json`
- `next.config.mjs`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `eslint.config.mjs`
- `components.json`
- `.gitignore`

### الخطوة 2: المجلدات
انسخ هذه المجلدات بالكامل:

- `src/` → جميع الكود المصدري
- `public/` → الملفات العامة
- `migrations/` → ملفات قاعدة البيانات
- `prisma/` → (إن وجدت)

### الخطوة 3: ملفات التوثيق
انسخ:

- `README.md`
- `DEPLOYMENT_FINAL_GUIDE.md`
- `DEPLOYMENT_CHECKLIST.md`
- `SECURITY_IMPROVEMENTS_REPORT.md`

## ⚠️ لا تنسخ

- ❌ `node_modules/`
- ❌ `.next/`
- ❌ `.env*`
- ❌ `token_supabase.md`
- ❌ أي ملفات `.bak`, `.backup`, `.old`

## ✅ بعد النسخ

1. افتح GitHub Desktop
2. اختر repository: `delivery_agent_final_25-12`
3. تحقق من أن الملفات المضافة صحيحة
4. اضغط "Publish repository"

## 📝 ملاحظة

راجع ملف `COPY_INSTRUCTIONS.md` في مجلد `delivery_agent_final_25-12` للتفاصيل الكاملة.

