import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/db';

/**
 * 📊 نظام الإثراء السياقي (Context Enrichment Layer)
 * هذا الملف مسؤول عن تزويد وكيل Zoon ببيانات حية عن حالة النظام
 * مع كل رسالة كي يبدو حياً ومُدركاً لما يحدث في نفس اللحظة.
 */
export async function getEnrichedSystemContext(): Promise<string> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // بداية اليوم

    // جلب عدد طلبات اليوم كإحصائية سريعة
    const ordersCount = await prisma.delivery_orders.count({
      where: {
        created_at: {
          gte: today
        }
      }
    });

    // جلب إجمالي أرباح اليوم للطلبات المكتملة
    const totalRevenue = await prisma.delivery_orders.aggregate({
      _sum: { actual_total_amount: true },
      where: {
        created_at: { gte: today },
        status: { in: ['completed'] }
      }
    });

    const revenueAmount = totalRevenue._sum?.actual_total_amount?.toString() || "0";
    
    // تنسيق الوقت الحالي بتوقيت القاهرة ليكون الوكيل مُلماً بالوقت
    const currentTime = new Date().toLocaleString('ar-EG', { 
      timeZone: 'Africa/Cairo',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    // يمكنك في المستقبل جلب عدد المناديب النشطين، أو المشاكل الحالية هنا

    return `
    <system_status>
    حالة النظام الحية الآن:
    - الوقت والتاريخ: ${currentTime}
    - عدد الطلبات التي تم إنشاؤها اليوم: ${ordersCount} طلب
    - إجمالي المبيعات المكتملة اليوم: ${revenueAmount} ج.م
    </system_status>
    `;
  } catch (error) {
    console.error('[System Context] الخطأ أثناء جلب سياق النظام:', error);
    return `<system_status>الوقت الحالي: ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })} | حالة قاعدة البيانات: تتأخر قليلاً في الاستجابة.</system_status>`;
  }
}
