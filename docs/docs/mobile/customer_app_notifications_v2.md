# دليل استقبال الإشعارات لتطبيق العميل (Customer App v2)

هذا المستند يشرح آلية عمل نظام الإشعارات الجديد بعد إضافة "دورة الاعتماد"
(Approval Workflow) في لوحة التحكم، وكيف يجب على المطورين في Flutter استقبال هذه
الإشعارات.

## 1. دورة حياة الإشعار (Notification Lifecycle)

من المهم لمطوري الموبايل فهم أن الإشعارات تمر بمرحلتين:

1. **مرحلة الاقتراح (Proposal):** يتم إنشاؤها في لوحة التحكم وتخزن في جدول
   `notification_proposals`. (هذا الجدول لا يخص تطبيق الموبايل).
2. **مرحلة الاعتماد (Approval):** بمجرد موافقة المدير، يتم ترحيل البيانات تلقائياً
   إلى جدول `system_notifications`.

**قاعدة ذهبية:** تطبيق العميل يستمع فقط لجدول `system_notifications`.

## 2. استهداف العميل (Targeting Logic)

يتم إرسال الإشعارات للعملاء بطريقتين في الحقل `target_role` و `target_user_id`:

- **إشعار عام لكل العملاء:** يكون الحقل `target_role = 'customer'`.
- **إشعار لعميل محدد:** يكون الحقل `target_user_id` يحتوي على الـ UUID الخاص
  بالعميل.

## 3. كود استقبال الإشعارات (Dart/Flutter)

يجب استخدام `supabase_flutter` لمراقبة الجدول لحظياً. نوصي باستخدام `Stream` مع
فلترة مزدوجة:

```dart
// 1. تعريف مجمع الاستماع (Stream)
Stream<List<Map<String, dynamic>>> getCustomerNotifications(String currentUserId) {
  return supabase
      .from('system_notifications')
      .stream(primaryKey: ['id'])
      // فلترة لجلب الإشعارات الموجهة 'لكل العملاء' أو 'لهذا العميل تحديداً'
      .or('target_role.eq.customer,target_user_id.eq.$currentUserId') 
      .order('created_at', ascending: false)
      .limit(20);
}

// 2. استخدام StreamBuilder في الواجهة
StreamBuilder<List<Map<String, dynamic>>>(
  stream: getCustomerNotifications(currentUserId),
  builder: (context, snapshot) {
    if (snapshot.hasData) {
      final notifications = snapshot.data!;
      return ListView.builder(
        itemCount: notifications.length,
        itemBuilder: (context, index) {
          final item = notifications[index];
          return NotificationTile(
            title: item['title'],
            body: item['message'],
            isRead: item['is_read'],
            type: item['type'], // info, alert, price_update
          );
        },
      );
    }
    return CircularProgressIndicator();
  },
)
```

## 4. أنواع الإشعارات (Notification Types)

يأتي في حقل `type` قيم تحدد شكل الإشعار في التطبيق:

- `info`: إشعار عام (أيقونة زرقاء).
- `alert`: تنبيه هام (أيقونة حمراء/تحذير).
- `price_update`: تحديث في أسعار المخلفات (أيقونة عملة/سهم).
- `system`: تحديث تقني في التطبيق.

## 5. حالة القراءة (Badges)

لإظهار عدد الإشعارات الجديدة (النقطة الحمراء):

```dart
final unreadCount = await supabase
    .from('system_notifications')
    .select('id', const FetchOptions(count: CountOption.exact))
    .or('target_role.eq.customer,target_user_id.eq.$currentUserId')
    .eq('is_read', false);
```

## 6. ملاحظات هامة للمبرمجين:

1. **Realtime Priority:** نظام Supabase Realtime هو الطريقة الأساسية، وتأكد من
   تفعيل "Enable Realtime" لجدول `system_notifications` في السيرفر.
2. **Local Notifications:** عند استقبال بيانات جديدة عبر الـ Stream والتطبيق في
   الواجهة، استخدم مكتبة `flutter_local_notifications` لإظهار التنبيه العلوي.
3. **التاريخ:** استخدم `DateTime.parse(item['created_at']).toLocal()` لعرض
   التوقيت الصحيح للعميل.

---

**إعداد: فريق تطوير الأداء (Antigravity AI)** **توقيت التحديث:** 2026-02-09
