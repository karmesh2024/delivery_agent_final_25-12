import { prisma } from '@/lib/prisma';
import { FunctionHandler } from './index';

/**
 * معالج حساب مستحقات المندوب
 */
export const handleCalcDriverEarnings: FunctionHandler = async (params) => {
  const { driverId, startDate, endDate } = params;

  if (!driverId) throw new Error('يجب توفير معرف المندوب (driverId)');

  const where: any = {
    delivery_boy_id: driverId,
    status: 'completed' // أو الحالة المعبرة عن التمام في السيستم
  };

  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at.gte = new Date(startDate);
    if (endDate) where.created_at.lte = new Date(endDate);
  }

  const orders = await prisma.delivery_orders.findMany({
    where,
    select: {
      actual_total_amount: true,
      // نفترض وجود حقل عمولة المندوب أو نحسبه بناءً على نسبة
    }
  });

  // حساب تجريبي: لنفترض أن عمولة المندوب هي 80% من قيمة التوصيل 
  // (هذا مثال، يجب تعديله حسب منطق العمل الحقيقي)
  const totalValue = orders.reduce((acc, curr) => acc + (Number(curr.actual_total_amount) || 0), 0);
  const driverEarnings = totalValue * 0.8; 

  return {
    success: true,
    data: {
      total_orders: orders.length,
      total_volume: totalValue,
      total_earnings: driverEarnings,
      currency: 'EGP',
      period: { startDate, endDate }
    },
    summary: `💰 تم حساب مستحقات المندوب: ${driverEarnings.toFixed(2)} ج.م لـ ${orders.length} طلب.`
  };
};

/**
 * معالج قائمة الطلبات غير المسواة
 */
export const handleListPendingSettlements: FunctionHandler = async (params) => {
  const { limit = 50 } = params;

  // جلب الطلبات التي تمت ولم يتم ربطها بعملية تسوية (financial_transactions)
  // ملاحظة: هذا الاستعلام يعتمد على فرضية وجود علاقة أو حالة معينة
  const pendingOrders = await prisma.delivery_orders.findMany({
    where: {
      status: 'completed',
      // هنا قد نحتاج لفلتر إضافي للطلبات غير المدفوعة
    },
    take: Number(limit),
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      actual_total_amount: true,
      created_at: true,
      // customer: { select: { full_name: true } }
    }
  });

  const totalValue = pendingOrders.reduce((acc, curr) => acc + (Number(curr.actual_total_amount) || 0), 0);

  return {
    success: true,
    data: {
      orders: pendingOrders,
      total_count: pendingOrders.length,
      total_value: totalValue
    },
    summary: `📋 وُجد ${pendingOrders.length} طلب مكتمل بانتظار التحصيل المالي.`
  };
};

/**
 * معالج حساب صافي ربح الوكيل
 */
export const handleCalcAgentProfit: FunctionHandler = async (params) => {
  const { period = 'today' } = params;

  let startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (period === 'yesterday') {
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'this_week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'this_month') {
    startDate.setMonth(startDate.getMonth() - 1);
  }

  const result = await prisma.delivery_orders.aggregate({
    where: {
      status: 'completed',
      created_at: { gte: startDate }
    },
    _sum: {
      actual_total_amount: true
    },
    _count: {
      _all: true
    }
  });

  const grossRevenue = Number(result._sum.actual_total_amount) || 0;
  // لنفترض أن ربح الوكيل هو 20% والباقي للمناديب
  const driverCosts = grossRevenue * 0.8;
  const netProfit = grossRevenue - driverCosts;

  return {
    success: true,
    data: {
      gross_revenue: grossRevenue,
      driver_costs: driverCosts,
      net_profit: netProfit,
      orders_count: result._count._all,
      period
    },
    summary: `📈 صافي ربح الوكيل عن ${period}: ${netProfit.toFixed(2)} ج.م من إجمالي ${grossRevenue.toFixed(2)} ج.م.`
  };
};
