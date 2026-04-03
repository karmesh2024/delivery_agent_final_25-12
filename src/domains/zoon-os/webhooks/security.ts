import crypto from 'crypto';

/**
 * التحقق من صحة توقيع Webhook (HMAC) لضمان أن الطلب قادم من مصدر موثوق
 */
export async function verifyWebhookSignature(
  payload: any,
  signature: string | null,
  userId: string
): Promise<boolean> {
  // مفتاح سري للتطوير، وفي الإنتاج يفضل جلبه من جدول user_webhooks في قاعدة البيانات
  const secretKey = process.env.WEBHOOK_SECRET || 'zoon-default-secret';
  
  // إذا كنا في بيئة التطوير، نتجاوز التحقق من التوقيع مؤقتاً لتسهيل الاختبار من الـ Terminal
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ [Security] تجاوز التحقق من توقيع Webhook (وضع التطوير نشط).');
    return true;
  }

  if (!signature) return false;

  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    // إنشاء التوقيع المتوقع
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payloadString)
      .digest('hex');

    // مقارنة التوقيعين بشكل آمن لمنع هجمات التوقيت (Timing Attacks)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error('❌ [Security] فشل التحقق من توقيع Webhook:', err);
    return false;
  }
}
