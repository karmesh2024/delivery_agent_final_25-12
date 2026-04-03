# دليل إعداد رفع الصور في نادي زوون

## Supabase Storage Setup Guide

---

## 📋 الخطوات المطلوبة

### الخطوة 1️⃣: إنشاء Bucket في Supabase

1. افتح **Supabase Dashboard** الخاص بمشروعك
2. انتقل إلى قسم **Storage** من القائمة الجانبية
3. اضغط على زر **"Create a new bucket"**
4. أدخل التفاصيل التالية:
   - **Name**: `zoon-media`
   - **Public bucket**: ✅ نعم (حدد هذا الخيار)
   - **File size limit**: `10 MB` (اختياري)
   - **Allowed MIME types**: `image/*, video/*` (اختياري)
5. اضغط **Create bucket**

---

### الخطوة 2️⃣: إعداد سياسات الأمان (RLS Policies)

انتقل إلى **SQL Editor** في Supabase وقم بتنفيذ الكود التالي:

```sql
-- السماح برفع الملفات للمستخدمين المصادق عليهم
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'zoon-media');

-- السماح بقراءة الملفات للجميع (Public Read)
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'zoon-media');

-- السماح بحذف الملفات لأصحابها فقط
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'zoon-media' AND auth.uid() = owner);
```

---

### الخطوة 3️⃣: التحقق من الإعداد

1. ارجع إلى **Storage > zoon-media**
2. تأكد من أن الـ Bucket يظهر كـ **Public**
3. جرب رفع صورة تجريبية يدوياً من الواجهة للتأكد من عمل الـ Bucket

---

## 🎯 كيفية الاستخدام في التطبيق

### رفع صورة من نموذج المنشور:

1. افتح صفحة **إدارة الغرف** (`/club-zone/rooms/management`)
2. اضغط على زر **"منشور جديد"** (الأخضر)
3. اختر الغرفة التي تريد النشر فيها
4. اكتب محتوى المنشور
5. اضغط على منطقة **"اضغط لرفع الصور"**
6. اختر صورة أو أكثر من جهازك
7. انتظر حتى يكتمل الرفع (سترى شريط التقدم)
8. ستظهر الصور المرفوعة أسفل منطقة الرفع
9. يمكنك حذف أي صورة بالضغط على زر ❌ عليها
10. اضغط **"نشر الآن"** لحفظ المنشور

---

## 🔧 الملفات المعنية

### 1. `src/lib/uploadImage.ts`

يحتوي على دالتين رئيسيتين:

- `uploadImage(file, bucket)`: لرفع الصورة وإرجاع الرابط العام
- `deleteImage(url, bucket)`: لحذف الصورة من Storage

### 2. `src/domains/zoon-club/components/PostDialog.tsx`

تم تحديثه ليشمل:

- منطقة رفع الصور بـ Drag & Drop
- شريط تقدم الرفع
- معاينة الصور المرفوعة
- إمكانية حذف الصور قبل النشر

---

## ⚠️ ملاحظات هامة

1. **الحد الأقصى لحجم الملف**: 10 ميجابايت (يمكن تعديله من إعدادات الـ Bucket)
2. **الصيغ المدعومة**:
   - الصور: PNG, JPG, JPEG, GIF, WebP
   - الفيديو: MP4, WebM
3. **الأمان**:
   - يمكن لأي مستخدم مصادق عليه رفع الصور
   - يمكن للجميع قراءة الصور (Public Read)
   - يمكن للمستخدم حذف صوره فقط
4. **التخزين**: تأكد من أن لديك مساحة كافية في خطة Supabase الخاصة بك

---

## 🐛 استكشاف الأخطاء

### مشكلة: "فشل رفع الصورة"

**الحلول المحتملة:**

1. تأكد من إنشاء الـ Bucket بنجاح
2. تحقق من تنفيذ سياسات RLS بشكل صحيح
3. تأكد من أن الـ Bucket مضبوط كـ **Public**
4. تحقق من حجم الملف (يجب أن يكون أقل من 10MB)

### مشكلة: "الصورة لا تظهر بعد الرفع"

**الحلول المحتملة:**

1. تحقق من سياسة "Allow public read access"
2. تأكد من أن الرابط المُرجع صحيح
3. افتح رابط الصورة في متصفح جديد للتأكد من الوصول

---

## 📊 البيانات المخزنة

عند رفع صورة، يتم:

1. رفع الملف إلى `zoon-media` bucket
2. توليد اسم فريد للملف: `{random}-{timestamp}.{ext}`
3. إرجاع الرابط العام:
   `https://{project}.supabase.co/storage/v1/object/public/zoon-media/{filename}`
4. حفظ الرابط في حقل `media_urls` في جدول `zoon_posts`

---

## ✅ الخطوة التالية

بعد إعداد Storage بنجاح، يمكنك:

- إنشاء منشورات مع صور
- عرض المنشورات في صفحة المعاينة
- إدارة المحتوى المرئي لكل غرفة

**الآن جرب رفع أول صورة! 🎉**
