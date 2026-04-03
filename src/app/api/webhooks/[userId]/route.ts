import { NextRequest, NextResponse } from 'next/server';
import { processWebhookEvent } from '@/domains/zoon-os/webhooks/webhook-processor';
import { verifyWebhookSignature } from '@/domains/zoon-os/webhooks/security';

/**
 * 🚀 مسار استقبال Webhooks الخارجية (Proactive Level) للمستخدمين
 * المسار المتوقع سيتم استدعاؤه كالتالي:
 * POST /api/webhooks/user-uuid
 * Headers: { "x-webhook-signature": "hmac_sha256_hash_here" }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> } | { params: { userId: string } }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'ملف JSON غير صالح المرسل.' }, { status: 400 });
    }

    // 1. التحقق من صحة الطلب (HMAC signature) للأمان ضد طلبات الاحتيال (Spoofing)
    const signature = req.headers.get('x-webhook-signature');
    const isValid = await verifyWebhookSignature(body, signature, userId);
    
    if (!isValid) {
      console.error(`[Webhook Route] 🚫 تم رفض طلب لـ User: ${userId} بسبب انعدام أو خطأ التوقيع.`);
      return NextResponse.json(
        { error: 'غير مصرح للوصول: توقيع Webhook غير متطابق.' },
        { status: 401 }
      );
    }

    // 2. التحقق من هيكلة الحدث الأولية
    if (!body.event || !body.data) {
      return NextResponse.json(
        { error: 'هيكل Webhook يجب أن يتضمن event و data.' },
        { status: 400 }
      );
    }

    // 3. معالجة الحدث بشكل غير متزامن (Asynchronous)
    // ⚠️ يتم هنا ترك الوكيل يعالج المهمة دون تعطيل استجابة السيرفر المرسل للحدث (Fire-and-forget)
    processWebhookEvent(userId, body).catch((e) => {
      console.error('[Webhook Async Execution] حدث خطأ اثناء معالجة:', e.message);
    });

    // الرد السريع للأنظمة المتصلة حتى يتأكدوا من وصول إشعارهم
    return NextResponse.json({ 
      received: true, 
      status: 'success', 
      message: 'تم استلام الحدث بنجاح، Zoon Agent يتولى العمل الآن.' 
    }, { status: 200 });

  } catch (err: any) {
    console.error('[Webhook Route] ❌ خطأ:', err);
    return NextResponse.json({ error: 'خطأ داخلي أثناء استلام Webhook' }, { status: 500 });
  }
}
