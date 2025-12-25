-- بيانات أولية لملء جداول الرسائل
-- يمكن تشغيل هذا الملف لإنشاء بيانات اختبار في قاعدة البيانات

-- إضافة بيانات المندوبين (delivery_boys) أولاً
INSERT INTO delivery_boys (id, phone, full_name, status, total_deliveries, total_earnings, rating, is_available, created_at, updated_at)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac140001', '+966500111222', 'محمد علي', 'active', 150, 5000.00, 4.8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac140002', '+966500222333', 'أحمد خالد', 'active', 75, 3200.00, 4.5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac140003', '+966500333444', 'عبدالله محمد', 'active', 120, 4500.00, 4.7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac140004', '+966500444555', 'سارة أحمد', 'active', 90, 3800.00, 4.9, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- إضافة بيانات المشرفين (admins) (بعد تحديث هيكل الجدول بملف update-admins-table.sql)
INSERT INTO admins (
  id, 
  user_id,
  email, 
  username, 
  full_name, 
  role, 
  phone, 
  profile_image_url, 
  is_active, 
  created_at, 
  updated_at
)
VALUES 
  (
    'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 
    NULL, -- user_id (قم بإضافة معرف مستخدم حقيقي من auth.users إذا كان متاحًا)
    'admin1@example.com', 
    'admin1', 
    'مشرف النظام', 
    'super_admin', 
    '+966500000000', 
    'https://example.com/profiles/admin.jpg', 
    true, 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
  );

-- إضافة محادثات
INSERT INTO conversations (id, title, conversation_type, last_message, last_message_time, is_active, created_by, created_by_type, created_at, updated_at)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac120001', 'محادثة مع محمد علي', 'order_related', 'سأصل إلى موقع الاستلام خلال 15 دقيقة', CURRENT_TIMESTAMP - INTERVAL '15 minutes', true, 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac120002', 'محادثة مع أحمد خالد', 'order_related', 'تم تسليم الطلب بنجاح، شكراً لكم', CURRENT_TIMESTAMP - INTERVAL '3 hours', true, 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac120003', 'محادثة مع عبدالله محمد', 'support', 'أحتاج إلى مساعدة في تحديث معلومات حسابي', CURRENT_TIMESTAMP - INTERVAL '1 day', true, 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140003', 'delivery_boy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac120004', 'محادثة مع سارة أحمد', 'support', 'هل يمكنني الحصول على مزيد من المعلومات حول برنامج المكافآت؟', CURRENT_TIMESTAMP - INTERVAL '15 minutes', true, 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140004', 'delivery_boy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- إضافة مشاركين في المحادثات (بعد أن تم إنشاء المندوبين والمشرفين والمحادثات)
INSERT INTO conversation_participants (id, conversation_id, delivery_boy_id, participant_type, unread_count, is_active, joined_at)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac160001', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120001', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140001', 'delivery_boy', 0, true, CURRENT_TIMESTAMP);

INSERT INTO conversation_participants (id, conversation_id, admin_id, participant_type, unread_count, is_active, joined_at)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac160002', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120001', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 1, true, CURRENT_TIMESTAMP),
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac160003', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120002', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 0, true, CURRENT_TIMESTAMP),
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac160004', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120003', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 0, true, CURRENT_TIMESTAMP),
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac160005', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 1, true, CURRENT_TIMESTAMP);

INSERT INTO conversation_participants (id, conversation_id, delivery_boy_id, participant_type, unread_count, is_active, joined_at)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac160006', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120002', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140002', 'delivery_boy', 0, true, CURRENT_TIMESTAMP),
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac160007', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120003', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140003', 'delivery_boy', 0, true, CURRENT_TIMESTAMP),
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac160008', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140004', 'delivery_boy', 0, true, CURRENT_TIMESTAMP);

-- إضافة رسائل للمحادثة الأولى (بعد إنشاء المحادثات والمشاركين)
INSERT INTO messages (id, conversation_id, sender_admin_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150001', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120001', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 'مرحباً محمد، هل يمكنك تأكيد موعد وصولك إلى العميل؟', 'text', CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_delivery_boy_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150002', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120001', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140001', 'delivery_boy', 'نعم، أنا الآن في الطريق وسأصل خلال 15-20 دقيقة تقريباً', 'text', CURRENT_TIMESTAMP - INTERVAL '25 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_admin_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150003', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120001', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 'ممتاز، هل هناك أي تحديات في الطريق؟', 'text', CURRENT_TIMESTAMP - INTERVAL '20 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_delivery_boy_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150004', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120001', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140001', 'delivery_boy', 'سأصل إلى موقع الاستلام خلال 15 دقيقة', 'text', CURRENT_TIMESTAMP - INTERVAL '15 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

-- إضافة رسائل للمحادثة الثانية
INSERT INTO messages (id, conversation_id, sender_delivery_boy_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150005', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120002', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140002', 'delivery_boy', 'لقد وصلت إلى عنوان العميل ولكن لا يوجد أحد للاستلام', 'text', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_admin_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150006', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120002', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 'سأتصل بالعميل وأتأكد من وجوده، انتظر لحظات', 'text', CURRENT_TIMESTAMP - INTERVAL '3.9 hours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_admin_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150007', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120002', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 'العميل في الطريق، سيصل خلال 5 دقائق', 'text', CURRENT_TIMESTAMP - INTERVAL '3.8 hours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_delivery_boy_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150008', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120002', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140002', 'delivery_boy', 'تم تسليم الطلب بنجاح، شكراً لكم', 'text', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

-- إضافة رسائل للمحادثة الثالثة
INSERT INTO messages (id, conversation_id, sender_delivery_boy_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150009', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120003', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140003', 'delivery_boy', 'مرحباً، أحتاج إلى تحديث رقم هاتفي في النظام', 'text', CURRENT_TIMESTAMP - INTERVAL '1.2 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_admin_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150010', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120003', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 'مرحباً عبدالله، يمكنني مساعدتك في ذلك. ما هو رقم الهاتف الجديد؟', 'text', CURRENT_TIMESTAMP - INTERVAL '1.15 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_delivery_boy_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150011', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120003', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140003', 'delivery_boy', '+966501122334', 'text', CURRENT_TIMESTAMP - INTERVAL '1.1 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_admin_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150012', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120003', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 'تم تحديث رقم الهاتف بنجاح! هل هناك أي شيء آخر تحتاج مساعدة به؟', 'text', CURRENT_TIMESTAMP - INTERVAL '1.05 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_delivery_boy_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150013', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120003', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140003', 'delivery_boy', 'أحتاج إلى مساعدة في تحديث معلومات حسابي', 'text', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

-- إضافة رسائل للمحادثة الرابعة
INSERT INTO messages (id, conversation_id, sender_delivery_boy_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150014', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140004', 'delivery_boy', 'مرحباً، لدي سؤال حول برنامج المكافآت الجديد', 'text', CURRENT_TIMESTAMP - INTERVAL '45 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_admin_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150015', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 'مرحباً سارة، بالتأكيد يمكنني مساعدتك. ما هو سؤالك؟', 'text', CURRENT_TIMESTAMP - INTERVAL '40 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_delivery_boy_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150016', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140004', 'delivery_boy', 'أرى أنني حصلت على نقاط مكافآت، لكن لا أعرف كيف يمكنني استخدامها', 'text', CURRENT_TIMESTAMP - INTERVAL '35 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

-- رسالة صورة
INSERT INTO messages (id, conversation_id, sender_admin_id, sender_type, content, message_type, metadata, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150017', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 'إليك معلومات حول برنامج المكافآت', 'image', 
   '{"imageUrl": "https://via.placeholder.com/400x300?text=Rewards+Program"}', 
   CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_delivery_boy_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150018', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140004', 'delivery_boy', 'شكراً لك! هل يمكنني استبدال النقاط بخصومات على الطلبات؟', 'text', CURRENT_TIMESTAMP - INTERVAL '25 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_admin_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150019', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac130001', 'admin', 'نعم، يمكنك ذلك. كل 100 نقطة تعادل خصم 10 جنيه مصري على طلباتك القادمة. يمكنك استخدام النقاط عبر قسم "المكافآت" في التطبيق.', 'text', CURRENT_TIMESTAMP - INTERVAL '20 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

INSERT INTO messages (id, conversation_id, sender_delivery_boy_id, sender_type, content, message_type, sent_at, created_at, updated_at, is_edited, is_deleted)
VALUES 
  ('a1b2c3d4-e5f6-11ec-8ea0-0242ac150020', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004', 'a1b2c3d4-e5f6-11ec-8ea0-0242ac140004', 'delivery_boy', 'هل يمكنني الحصول على مزيد من المعلومات حول برنامج المكافآت؟', 'text', CURRENT_TIMESTAMP - INTERVAL '15 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, false);

-- تحديث عدد الرسائل غير المقروءة
UPDATE conversation_participants
SET unread_count = 
  CASE 
    WHEN conversation_id = 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120001' AND participant_type = 'admin' THEN 1
    WHEN conversation_id = 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004' AND participant_type = 'admin' THEN 1
    ELSE 0
  END
WHERE (conversation_id = 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120001' OR conversation_id = 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004') AND participant_type = 'admin';

-- تحديث حالة القراءة للرسائل المرسلة من المندوبين إلى المشرفين
WITH latest_messages AS (
  SELECT m.id
  FROM messages m
  WHERE (conversation_id = 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120001' AND sender_type = 'delivery_boy') 
     OR (conversation_id = 'a1b2c3d4-e5f6-11ec-8ea0-0242ac120004' AND sender_type = 'delivery_boy')
  ORDER BY sent_at DESC
  LIMIT 2
)
UPDATE messages m
SET is_read = false
WHERE m.id IN (SELECT id FROM latest_messages);

-- ملاحظة: يمكنك تعديل هذا السكريبت لإضافة جداول جديدة أو تعديل الهيكل الحالي حسب الحاجة

-- الاستخدام:
-- 1. تنفيذ هذا السكريبت مباشرة في قاعدة البيانات لإنشاء بيانات التجربة
-- 2. التطبيق يدعم وضعين:
--    - وضع التطوير: يستخدم البيانات الوهمية من 'mock-data.ts' عند تعيين NEXT_PUBLIC_USE_MOCK_DATA=true
--    - وضع الإنتاج: يستخدم بيانات قاعدة البيانات الحقيقية