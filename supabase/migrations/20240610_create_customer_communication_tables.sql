-- إنشاء جدول إعدادات التواصل مع العملاء
CREATE TABLE IF NOT EXISTS "public"."customer_communication_settings" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "key" text NOT NULL,
    "value" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id"),
    UNIQUE ("key")
);

-- إضافة تعليقات على الجدول والحقول
COMMENT ON TABLE "public"."customer_communication_settings" IS 'جدول لتخزين إعدادات التواصل مع العملاء';
COMMENT ON COLUMN "public"."customer_communication_settings"."key" IS 'مفتاح الإعداد (مثل unregistered_customers_contact)';
COMMENT ON COLUMN "public"."customer_communication_settings"."value" IS 'قيمة الإعداد كـ JSON';

-- إنشاء جدول فيديوهات تعليمية للعملاء
CREATE TABLE IF NOT EXISTS "public"."customer_tutorial_videos" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "title" text NOT NULL,
    "description" text,
    "file_path" text NOT NULL,
    "file_type" text NOT NULL,
    "file_size" bigint NOT NULL,
    "duration" integer,
    "thumbnail_path" text,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);

-- إضافة تعليقات على الجدول والحقول
COMMENT ON TABLE "public"."customer_tutorial_videos" IS 'جدول لتخزين الفيديوهات التعليمية للعملاء';
COMMENT ON COLUMN "public"."customer_tutorial_videos"."title" IS 'عنوان الفيديو';
COMMENT ON COLUMN "public"."customer_tutorial_videos"."description" IS 'وصف الفيديو';
COMMENT ON COLUMN "public"."customer_tutorial_videos"."file_path" IS 'مسار الملف في التخزين';
COMMENT ON COLUMN "public"."customer_tutorial_videos"."file_type" IS 'نوع الملف (مثل video/mp4)';
COMMENT ON COLUMN "public"."customer_tutorial_videos"."file_size" IS 'حجم الملف بالبايت';
COMMENT ON COLUMN "public"."customer_tutorial_videos"."duration" IS 'مدة الفيديو بالثواني';
COMMENT ON COLUMN "public"."customer_tutorial_videos"."thumbnail_path" IS 'مسار الصورة المصغرة في التخزين';
COMMENT ON COLUMN "public"."customer_tutorial_videos"."is_active" IS 'هل الفيديو نشط؟';

-- إضافة حقل contact_status إلى جدول unregistered_customers
ALTER TABLE IF EXISTS "public"."unregistered_customers"
ADD COLUMN IF NOT EXISTS "contact_status" jsonb DEFAULT '{
    "contacted": false,
    "sent_whatsapp": false,
    "sent_app_link": false,
    "sent_video": false,
    "notes": "",
    "last_contact_date": null
}'::jsonb;

COMMENT ON COLUMN "public"."unregistered_customers"."contact_status" IS 'حالة التواصل مع العميل غير المسجل';

-- إنشاء سياسات الأمان للجداول الجديدة

-- سياسات الأمان لجدول customer_communication_settings
CREATE POLICY "Allow admins to read settings" ON "public"."customer_communication_settings"
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
            )
        )
    );

CREATE POLICY "Allow admins to insert settings" ON "public"."customer_communication_settings"
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
            )
        )
    );

CREATE POLICY "Allow admins to update settings" ON "public"."customer_communication_settings"
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
            )
        )
    );

-- سياسات الأمان لجدول customer_tutorial_videos
CREATE POLICY "Allow admins to read videos" ON "public"."customer_tutorial_videos"
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
            )
        )
    );

CREATE POLICY "Allow admins to insert videos" ON "public"."customer_tutorial_videos"
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
            )
        )
    );

CREATE POLICY "Allow admins to update videos" ON "public"."customer_tutorial_videos"
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
            )
        )
    );

CREATE POLICY "Allow admins to delete videos" ON "public"."customer_tutorial_videos"
    FOR DELETE USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
            )
        )
    );

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE "public"."customer_communication_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."customer_tutorial_videos" ENABLE ROW LEVEL SECURITY;

-- إنشاء مخزن للملفات
-- ملاحظة: يجب إنشاء المخزن من خلال واجهة Supabase أو باستخدام CLI
-- يجب تنفيذ الأمر التالي باستخدام Supabase CLI:
-- supabase storage create bucket customer_communication_files --public=false

-- إعداد سياسات الأمان للمخزن (يجب تنفيذها بعد إنشاء المخزن)
-- INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
-- VALUES ('customer_communication_files', 'customer_communication_files', false, false, 104857600, ARRAY['video/mp4', 'video/webm', 'image/png', 'image/jpeg']);

-- CREATE POLICY "Allow authenticated users to read customer files"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'customer_communication_files' AND auth.role() = 'authenticated');

-- CREATE POLICY "Allow admins to upload customer files"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'customer_communication_files' AND
--     auth.role() = 'authenticated' AND (
--         EXISTS (
--             SELECT 1 FROM user_roles ur
--             JOIN roles r ON ur.role_id = r.id
--             WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
--         )
--     )
-- );

-- CREATE POLICY "Allow admins to update customer files"
-- ON storage.objects FOR UPDATE
-- USING (
--     bucket_id = 'customer_communication_files' AND
--     auth.role() = 'authenticated' AND (
--         EXISTS (
--             SELECT 1 FROM user_roles ur
--             JOIN roles r ON ur.role_id = r.id
--             WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
--         )
--     )
-- );

-- CREATE POLICY "Allow admins to delete customer files"
-- ON storage.objects FOR DELETE
-- USING (
--     bucket_id = 'customer_communication_files' AND
--     auth.role() = 'authenticated' AND (
--         EXISTS (
--             SELECT 1 FROM user_roles ur
--             JOIN roles r ON ur.role_id = r.id
--             WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
--         )
--     )
-- );

-- إدخال البيانات الافتراضية
INSERT INTO "public"."customer_communication_settings" ("key", "value")
VALUES (
    'unregistered_customers_contact',
    '{
        "defaultVideoLink": "https://www.youtube.com/watch?v=example",
        "defaultAppLink": "https://play.google.com/store/apps/details?id=com.example.app",
        "defaultWhatsAppMessage": "مرحباً {customerName}،\n\nنود دعوتك لتجربة تطبيقنا الجديد الذي سيساعدك في إدارة طلباتك بكل سهولة.\n\nفيديو توضيحي: {videoLink}\n\nرابط التحميل: {appLink}\n\nنتطلع للتواصل معك قريباً!"
    }'::jsonb
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = now(); 