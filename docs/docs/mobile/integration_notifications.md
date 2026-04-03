# دليل تكامل نظام الإشعارات لتطبيق Flutter (Mobile Integration Guide)

هذا المستند موجه لمبرمجي تطبيق الهاتف (العميل والمندوب) المطور بـ Flutter، ليوضح
آلية استقبال الإشعارات من جدول `system_notifications` وتحديث حالتها.

## 1. هيكل البيانات في قاعدة البيانات (Supabase Schema)

يجب على التطبيق مراقبة جدول `public.system_notifications`. الحقول الأساسية التي
ستحتاجها:

| الحقل            | النوع     | الوصف                  | الاستخدام في Flutter                        |
| :--------------- | :-------- | :--------------------- | :------------------------------------------ |
| `id`             | `uuid`    | المعرف الفريد للإشعار  | يستخدم عند تحديث حالة القراءة               |
| `title`          | `text`    | عنوان الإشعار          | يظهر في التنبيه (Notification Header)       |
| `message`        | `text`    | نص الرسالة             | يظهر في محتوى التنبيه (Body)                |
| `type`           | `text`    | نوع الإشعار            | يستخدم لتغيير الأيقونة أو التوجيه (Routing) |
| `metadata`       | `jsonb`   | بيانات إضافية          | تحتوي على روابط الطلبات أو أكواد الخصم      |
| `is_read`        | `boolean` | حالة القراءة           | لتحديد الإشعارات الجديدة في الواجهة         |
| `target_user_id` | `uuid`    | معرف المستخدم المستهدف | للفلترة وضمان وصول الإشعار لصاحبه           |

## 2. مراقبة الإشعارات لحظياً (Real-time Subscription)

بما أن لوحة التحكم تقوم بترحيل الإشعار للجدول فور الاعتماد، يجب على تطبيق Flutter
استخدام الـ Streams:

```dart
// استماع للإشعارات الجديدة الخاصة بالمستخدم الحالي فقط
final subscription = supabase
    .from('system_notifications')
    .stream(primaryKey: ['id'])
    .eq('target_user_id', currentUserId)
    .order('created_at', ascending: false)
    .listen((List<Map<String, dynamic>> data) {
      // تحديث قائمة الإشعارات في واجهة التطبيق
      // تنبيه: الإشعارات الجديدة ستظهر هنا تلقائياً
    });
```

## 3. تحديث حالة الإشعار إلى "مقروء" (Mark as Read)

يجب تنفيذ الكود التالي بمجرد فتح المستخدم لصفحة الإشعارات أو الضغط على إشعار
معين:

```dart
Future<void> markAsRead(String notificationId) async {
  try {
    await supabase
        .from('system_notifications')
        .update({'is_read': true})
        .match({'id': notificationId});
    print('Notification $notificationId marked as read');
  } catch (e) {
    print('Error updating notification status: $e');
  }
}
```

## 4. التوجيه الذكي (Deep Linking) باستخدام Metadata

الحقل `metadata` يحتوي على معلومات تقنية للربط. مثال لمحتوى الحقل:
`{"order_id": "123", "action": "view_order"}`.

```dart
void handleNotificationTap(Map<String, dynamic> notification) {
  final type = notification['type'];
  final metadata = notification['metadata'];

  if (type == 'order_update' && metadata != null) {
    final orderId = metadata['order_id'];
    // الانتقال لصفحة تفاصيل الطلب
    Navigator.pushNamed(context, '/order_details', arguments: orderId);
  }
}
```

## 5. توصيات فريق لوحة التحكم (Best Practices):

1. **العدد الإجمالي**: استخدم `select(count)` لجلب عدد الإشعارات غير المقروءة
   لعرضها كنقطة حمراء (Badge) على أيقونة الإشعارات.
2. **الخلفية (Background)**: تأكد من ربط نظام الإشعارات بـ FCM (Firebase Cloud
   Messaging) لإظهار التنبيهات حتى لو كان التطبيق مغلقاً.
3. **التاريخ والوقت**: يتم تخزين التاريخ بتنسيق `Timestamptz` العالمي، يرجى
   تحويله لتوقيت المستخدم المحلي في التطبيق.

---

**إعداد: فريق تطوير لوحة التحكم (Dashboard Team)**
