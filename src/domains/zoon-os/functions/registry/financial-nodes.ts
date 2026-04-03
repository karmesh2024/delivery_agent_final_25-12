import { FunctionNode } from '../registry';

export const FINANCIAL_NODES: Record<string, FunctionNode> = {
  'financial-calc-earnings': {
    id: 'financial-calc-earnings',
    label: 'حساب مستحقات مندوب',
    description: 'تحسب إجمالي أرباح مندوب محدد خلال فترة زمنية من واقع الطلبات المكتملة.',
    category: 'financial',
    icon: '💰',
    handler: 'handleCalcDriverEarnings',
    params: [
      {
        key: 'driverId',
        label: 'معرف المندوب',
        type: 'text',
        required: true,
        description: 'UUID الخاص بالمندوب (delivery_boy_id)'
      },
      {
        key: 'startDate',
        label: 'بداية الفترة',
        type: 'date',
        required: false,
        description: 'تاريخ بداية البحث (اختياري)'
      },
      {
        key: 'endDate',
        label: 'نهاية الفترة',
        type: 'date',
        required: false,
        description: 'تاريخ نهاية البحث (اختياري)'
      }
    ],
    outputs: [
      { key: 'total_orders', type: 'number', description: 'عدد الطلبات' },
      { key: 'total_earnings', type: 'number', description: 'إجمالي الأرباح' },
      { key: 'currency', type: 'string', description: 'العملة' }
    ]
  },
  'financial-list-pending-settlements': {
    id: 'financial-list-pending-settlements',
    label: 'قائمة الطلبات غير المسواة',
    description: 'تستخرج قائمة بالطلبات التي تم توصيلها ولم يتم سداد مستحقاتها للمندوب أو الوكيل.',
    category: 'financial',
    icon: '📋',
    handler: 'handleListPendingSettlements',
    params: [
      {
        key: 'limit',
        label: 'الحد الأقصى',
        type: 'number',
        required: false,
        default: 50
      }
    ],
    outputs: [
      { key: 'orders', type: 'object', description: 'قائمة الطلبات' },
      { key: 'total_count', type: 'number', description: 'عدد الطلبات' },
      { key: 'total_value', type: 'number', description: 'القيمة الإجمالية' }
    ]
  },
  'financial-calc-agent-profit': {
    id: 'financial-calc-agent-profit',
    label: 'حساب صافي ربح الوكيل',
    description: 'تحسب صافي ربح الوكيل من عمولات التوصيل بعد استقطاع مستحقات المناديب.',
    category: 'financial',
    icon: '📈',
    handler: 'handleCalcAgentProfit',
    params: [
      {
        key: 'period',
        label: 'الفترة',
        type: 'select',
        options: ['today', 'yesterday', 'this_week', 'this_month'],
        default: 'today',
        required: true
      }
    ],
    outputs: [
      { key: 'gross_revenue', type: 'number', description: 'إجمالي الإيرادات' },
      { key: 'driver_costs', type: 'number', description: 'مستحقات المناديب' },
      { key: 'net_profit', type: 'number', description: 'صافي الربح' }
    ]
  }
};
