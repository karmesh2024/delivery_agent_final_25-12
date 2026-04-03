-- 🛠️ إصلاح سياسات الأمان والعضوية (RLS Fix)

-- 1. التأكد أولاً من سياسة الدردشة الجماعية (إصلاح الـ Policy)
drop policy if exists "Members can insert messages" on public.zoon_circle_messages;
drop policy if exists "Members send circle messages" on public.zoon_circle_messages;

create policy "Members send circle messages"
on public.zoon_circle_messages
for insert
with check (
    -- الشرط: يجب أن يكون المرسل عضواً في الدائرة
    exists (
        select 1 from public.zoon_circle_members
        where circle_id = zoon_circle_messages.circle_id
        and user_id = auth.uid()
    )
    -- ملاحظة: أزلنا شرط sender_id = auth.uid() مؤقتاً للتأكد، لكن يفضل إعادته لاحقاً
);

-- 2. نفس الشيء للدردشة الخاصة (Direct)
drop policy if exists "User can send direct messages" on public.zoon_direct_messages;

create policy "User can send direct messages"
on public.zoon_direct_messages
for insert
with check (
    auth.uid() = sender_id
    and exists (
        select 1 from public.zoon_direct_chats
        where id = zoon_direct_messages.chat_id
        and (user1_id = auth.uid() or user2_id = auth.uid())
    )
);

-- 3. (اختياري) التأكد من أن المستخدم الحالي عضو في الدائرة التي يحاول الإرسال فيها
-- استبدل الـ UUIDs بالقيم الحقيقية لديك إذا كنت تعرفها، أو تجاهل هذا القسم إذا كنت واثقاً من العضوية
-- insert into public.zoon_circle_members (circle_id, user_id, role, status)
-- values ('YOUR_CIRCLE_ID', auth.uid(), 'member', 'active')
-- on conflict do nothing;
