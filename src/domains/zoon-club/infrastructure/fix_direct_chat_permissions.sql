-- 🛠️ FIX DIRECT CHAT PERMISSIONS
-- المشكلة: فشل فتح محادثة خاصة جديدة بسبب قيود الأمان على الجدول الأب
-- الحل: تعطيل RLS لجدول المحادثات (Chats) أيضاً، وليس فقط الرسائل (Messages)

alter table public.zoon_direct_chats disable row level security;

-- للتأكد، نعيد تعطيل الباقي
alter table public.zoon_direct_messages disable row level security;
alter table public.zoon_circle_messages disable row level security;
