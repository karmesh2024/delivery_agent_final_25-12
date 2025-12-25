'use client';

import React from 'react';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { StoreOrder, StoreOrderItem, StoreOrderStatus, StoreOrderFulfillmentStatus } from '../types';

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: StoreOrder;
  items: StoreOrderItem[];
  onStatusChange: (status: StoreOrderStatus) => void;
}

const statusLabels: Record<StoreOrderStatus, string> = {
  pending: 'قيد الانتظار',
  processing: 'قيد المعالجة',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  refunded: 'مسترد',
  completed: 'مكتمل',
};

const fulfillmentStatusLabels: Record<StoreOrderFulfillmentStatus, string> = {
  pending: 'في انتظار التجميع',
  collecting: 'قيد التجميع',
  verifying: 'قيد التحقق',
  packaging: 'قيد التغليف',
  ready: 'جاهز للتسليم',
  completed: 'تم التسليم',
};

const fulfillmentStatusColors: Record<StoreOrderFulfillmentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  collecting: 'bg-blue-100 text-blue-800 border-blue-300',
  verifying: 'bg-purple-100 text-purple-800 border-purple-300',
  packaging: 'bg-orange-100 text-orange-800 border-orange-300',
  ready: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300',
};

// تعريف مراحل التجميع بالترتيب
const FULFILLMENT_STAGES: {
  status: StoreOrderFulfillmentStatus;
  label: string;
  icon: string;
  completedBg: string;
  completedBorder: string;
  currentBg: string;
  currentBorder: string;
  textColor: string;
}[] = [
  {
    status: 'pending',
    label: 'في انتظار التجميع',
    icon: '⏳',
    completedBg: 'bg-yellow-500',
    completedBorder: 'border-yellow-600',
    currentBg: 'bg-yellow-100',
    currentBorder: 'border-yellow-500',
    textColor: 'text-yellow-700',
  },
  {
    status: 'collecting',
    label: 'قيد التجميع',
    icon: '📦',
    completedBg: 'bg-blue-500',
    completedBorder: 'border-blue-600',
    currentBg: 'bg-blue-100',
    currentBorder: 'border-blue-500',
    textColor: 'text-blue-700',
  },
  {
    status: 'verifying',
    label: 'قيد التحقق',
    icon: '✓',
    completedBg: 'bg-purple-500',
    completedBorder: 'border-purple-600',
    currentBg: 'bg-purple-100',
    currentBorder: 'border-purple-500',
    textColor: 'text-purple-700',
  },
  {
    status: 'packaging',
    label: 'قيد التغليف',
    icon: '📋',
    completedBg: 'bg-orange-500',
    completedBorder: 'border-orange-600',
    currentBg: 'bg-orange-100',
    currentBorder: 'border-orange-500',
    textColor: 'text-orange-700',
  },
  {
    status: 'ready',
    label: 'جاهز للتسليم',
    icon: '✅',
    completedBg: 'bg-green-500',
    completedBorder: 'border-green-600',
    currentBg: 'bg-green-100',
    currentBorder: 'border-green-500',
    textColor: 'text-green-700',
  },
  {
    status: 'completed',
    label: 'تم التسليم',
    icon: '🎉',
    completedBg: 'bg-gray-500',
    completedBorder: 'border-gray-600',
    currentBg: 'bg-gray-100',
    currentBorder: 'border-gray-500',
    textColor: 'text-gray-700',
  },
];

// دالة لحساب الوقت المستغرق
const calculateDuration = (startTime: Date, endTime: Date): string => {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} يوم ${diffHours % 24} ساعة`;
  } else if (diffHours > 0) {
    return `${diffHours} ساعة ${diffMins % 60} دقيقة`;
  } else if (diffMins > 0) {
    return `${diffMins} دقيقة`;
  } else {
    return 'أقل من دقيقة';
  }
};

// مكون لعرض خطوات المعالجة
const FulfillmentTimeline = ({ order }: { order: StoreOrder }) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  
  // تحديث الوقت كل دقيقة
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // كل دقيقة

    return () => clearInterval(interval);
  }, []);

  const currentStatus = order.fulfillment_status || 'pending';
  const currentStageIndex = FULFILLMENT_STAGES.findIndex(
    (stage) => stage.status === currentStatus
  );
  const orderCreatedAt = new Date(order.created_at);
  const orderUpdatedAt = new Date(order.updated_at);
  const now = currentTime;
  const totalDuration = calculateDuration(orderCreatedAt, now);

  // الحصول على وقت بدء كل مرحلة من البيانات الفعلية
  const getStageTimestamp = (stageIndex: number): Date | null => {
    const stage = FULFILLMENT_STAGES[stageIndex];
    if (!stage) return null;

    const timestampMap: Record<string, string | null | undefined> = {
      pending: order.pending_at,
      collecting: order.collecting_at,
      verifying: order.verifying_at,
      packaging: order.packaging_at,
      ready: order.ready_at,
      completed: order.completed_at,
    };

    const timestamp = timestampMap[stage.status];
    return timestamp ? new Date(timestamp) : null;
  };

  // حساب الوقت المستغرق في كل مرحلة بناءً على التوقيتات الفعلية
  const getStageDuration = (stageIndex: number): string | null => {
    if (stageIndex > currentStageIndex) {
      return null; // المرحلة لم تبدأ بعد
    }

    const stageStartTime = getStageTimestamp(stageIndex);
    
    if (!stageStartTime) {
      // إذا لم يكن هناك وقت محدد، نستخدم تقدير
      if (stageIndex === 0) {
        return calculateDuration(orderCreatedAt, orderUpdatedAt);
      }
      return null;
    }

    if (stageIndex === currentStageIndex) {
      // المرحلة الحالية - الوقت من بداية المرحلة حتى الآن
      return calculateDuration(stageStartTime, now);
    }

    // المراحل السابقة - نحتاج وقت بداية المرحلة التالية
    const nextStageIndex = stageIndex + 1;
    const nextStageStartTime = getStageTimestamp(nextStageIndex);
    
    if (nextStageStartTime) {
      // الوقت الفعلي المستغرق في هذه المرحلة
      return calculateDuration(stageStartTime, nextStageStartTime);
    }

    // إذا لم تكن هناك مرحلة تالية، نستخدم وقت آخر تحديث
    return calculateDuration(stageStartTime, orderUpdatedAt);
  };

  // الحصول على وقت بدء المرحلة لعرضه
  const getStageStartTime = (stageIndex: number): string | null => {
    const timestamp = getStageTimestamp(stageIndex);
    if (!timestamp) return null;
    
    return timestamp.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">خطوات المعالجة</h3>
        <div className="text-sm text-gray-600">
          <span className="font-medium">الوقت الإجمالي:</span>{' '}
          <span className="text-blue-700 font-semibold">{totalDuration}</span>
        </div>
      </div>

      <div className="relative">
        {/* الخط الرأسي */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5">
          {/* الجزء المكتمل */}
          <div 
            className="w-full bg-gradient-to-b from-blue-400 to-blue-300 transition-all duration-500"
            style={{
              height: currentStageIndex >= 0 ? `${((currentStageIndex + 1) / FULFILLMENT_STAGES.length) * 100}%` : '0%',
            }}
          ></div>
          {/* الجزء المتبقي */}
          <div 
            className="w-full bg-gray-300"
            style={{
              height: `${((FULFILLMENT_STAGES.length - currentStageIndex - 1) / FULFILLMENT_STAGES.length) * 100}%`,
            }}
          ></div>
        </div>

        {/* المراحل */}
        <div className="space-y-6">
          {FULFILLMENT_STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isPending = index > currentStageIndex;
            const stageDuration = getStageDuration(index);

            return (
              <div key={stage.status} className="relative flex items-start gap-4">
                {/* الدائرة */}
                <div
                  className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    isCompleted
                      ? `${stage.completedBg} ${stage.completedBorder}`
                      : isCurrent
                      ? `${stage.currentBg} ${stage.currentBorder} animate-pulse`
                      : 'bg-gray-100 border-gray-300'
                  }`}
                >
                  <span className="text-xl">{stage.icon}</span>
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>

                {/* المحتوى */}
                <div className="flex-1 pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4
                      className={`font-semibold ${
                        isCompleted
                          ? stage.textColor
                          : isCurrent
                          ? stage.textColor.replace('700', '600')
                          : 'text-gray-400'
                      }`}
                    >
                      {stage.label}
                    </h4>
                    {stageDuration && (
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                        {stageDuration}
                      </span>
                    )}
                  </div>
                  {(() => {
                    const startTime = getStageStartTime(index);
                    if (startTime) {
                      return (
                        <p className="text-xs text-gray-500">
                          بدء: {startTime}
                        </p>
                      );
                    }
                    if (isCurrent) {
                      return (
                        <p className="text-xs text-gray-500 italic">قيد التنفيذ...</p>
                      );
                    }
                    if (isPending) {
                      return (
                        <p className="text-xs text-gray-400">في الانتظار</p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ملخص الوقت */}
      <div className="mt-6 pt-4 border-t border-blue-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">وقت البدء:</span>{' '}
            <span className="font-medium">
              {orderCreatedAt.toLocaleString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div>
            <span className="text-gray-600">آخر تحديث:</span>{' '}
            <span className="font-medium">
              {orderUpdatedAt.toLocaleString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OrderDetailsDialog({
  isOpen,
  onClose,
  order,
  items,
  onStatusChange,
}: OrderDetailsDialogProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // معالجة عنوان الشحن لعرض جميع الحقول المتاحة
  const getAddressDisplay = () => {
    if (!order.shipping_address) return null;

    const address = order.shipping_address;
    const addressParts: string[] = [];

    // جمع جميع أجزاء العنوان
    const fields = [
      { key: 'street', label: 'الشارع' },
      { key: 'address', label: 'العنوان' },
      { key: 'address_line', label: 'سطر العنوان' },
      { key: 'street_address', label: 'عنوان الشارع' },
      { key: 'city', label: 'المدينة' },
      { key: 'area', label: 'المنطقة' },
      { key: 'district', label: 'الحي' },
      { key: 'postal_code', label: 'الرمز البريدي' },
      { key: 'zip_code', label: 'الرمز البريدي' },
      { key: 'country', label: 'الدولة' },
      { key: 'state', label: 'المحافظة' },
      { key: 'province', label: 'المحافظة' },
    ];

    fields.forEach(({ key }) => {
      const value = (address as any)[key];
      if (
        value &&
        typeof value === 'string' &&
        value !== 'غير محدد' &&
        value.trim() !== '' &&
        value.toLowerCase() !== 'undefined' &&
        value.toLowerCase() !== 'null'
      ) {
        addressParts.push(value);
      }
    });

    return addressParts;
  };

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`تفاصيل الطلب: ${order.order_number}`}
      className="max-w-4xl max-h-[90vh] overflow-y-auto"
      footer={
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      }
    >
      <div className="space-y-6">
        {/* معلومات الوكيل المعتمد */}
        {order.agent && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-3 text-blue-900">معلومات الوكيل المعتمد</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">الاسم</p>
                <p className="text-base font-semibold">{order.agent.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">رقم الهاتف</p>
                <p className="text-base">{order.agent.phone}</p>
              </div>
              {order.agent.email && (
                <div>
                  <p className="text-sm font-medium text-gray-600">البريد الإلكتروني</p>
                  <p className="text-base">{order.agent.email}</p>
                </div>
              )}
              {order.agent.location && (
                <div>
                  <p className="text-sm font-medium text-gray-600">الموقع الجغرافي</p>
                  <p className="text-base">
                    📍 {order.agent.location.lat.toFixed(6)}, {order.agent.location.lng.toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${order.agent.location.lat},${order.agent.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                  >
                    عرض على الخريطة
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* معلومات الطلب الأساسية */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">المتجر</p>
            <p className="text-base">{order.shop?.name_ar || order.shop_id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">المبلغ الإجمالي</p>
            <p className="text-base font-semibold">{order.final_amount} EGP</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">طريقة الدفع</p>
            <p className="text-base">
              {order.payment_method === 'cash_on_delivery'
                ? 'الدفع عند الاستلام'
                : order.payment_method === 'wallet'
                ? 'المحفظة'
                : order.payment_method || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">حالة الدفع</p>
            <p className="text-base">
              {order.payment_status === 'completed'
                ? 'مكتمل'
                : order.payment_status === 'pending'
                ? 'قيد الانتظار'
                : order.payment_status}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">الحالة</p>
            <Select
              value={order.status}
              onValueChange={(value) =>
                onStatusChange(value as StoreOrderStatus)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">حالة التجميع في المخزن</p>
            {order.fulfillment_status ? (
              <span
                className={`inline-block px-3 py-1 rounded text-sm border font-medium ${
                  fulfillmentStatusColors[order.fulfillment_status]
                }`}
              >
                {fulfillmentStatusLabels[order.fulfillment_status]}
              </span>
            ) : (
              <p className="text-base text-gray-400">غير محدد</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">تاريخ الإنشاء</p>
            <p className="text-base">
              {new Date(order.created_at).toLocaleString('ar-EG')}
            </p>
          </div>
        </div>

        {/* خطوات المعالجة */}
        {order.fulfillment_status && (
          <FulfillmentTimeline order={order} />
        )}

        {/* عنوان الشحن */}
        {order.shipping_address && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-3">
              عنوان الشحن
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              {/* العنوان الكامل كسطر واحد */}
              {(() => {
                const addressParts = getAddressDisplay();
                
                // إذا لم يكن هناك عنوان محدد، استخدم موقع الوكيل كبديل
                if ((!addressParts || addressParts.length === 0) && order.agent?.location) {
                  return (
                    <div className="mb-4 pb-4 border-b border-gray-300">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        العنوان (من موقع الوكيل)
                      </p>
                      <p className="text-sm font-semibold text-gray-800">
                        📍 الموقع الجغرافي: {order.agent.location.lat.toFixed(6)},{' '}
                        {order.agent.location.lng.toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ملاحظة: العنوان التفصيلي غير متوفر، يتم استخدام موقع الوكيل الجغرافي
                      </p>
                    </div>
                  );
                }

                return addressParts && addressParts.length > 0 ? (
                  <div className="mb-4 pb-4 border-b border-gray-300">
                    <p className="text-xs font-medium text-gray-500 mb-2">العنوان الكامل</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {addressParts.join('، ')}
                    </p>
                  </div>
                ) : null;
              })()}

              {/* تفاصيل العنوان */}
              {(() => {
                const address = order.shipping_address;
                const addressFields = [
                  { key: 'street', label: 'الشارع' },
                  { key: 'address', label: 'العنوان' },
                  { key: 'address_line', label: 'سطر العنوان' },
                  { key: 'street_address', label: 'عنوان الشارع' },
                  { key: 'city', label: 'المدينة' },
                  { key: 'area', label: 'المنطقة' },
                  { key: 'district', label: 'الحي' },
                  { key: 'state', label: 'المحافظة' },
                  { key: 'province', label: 'المحافظة' },
                  { key: 'postal_code', label: 'الرمز البريدي' },
                  { key: 'zip_code', label: 'الرمز البريدي' },
                  { key: 'country', label: 'الدولة' },
                  { key: 'building_number', label: 'رقم المبنى' },
                  { key: 'floor_number', label: 'رقم الطابق' },
                  { key: 'apartment_number', label: 'رقم الشقة' },
                  { key: 'landmark', label: 'معلم بارز' },
                  { key: 'additional_directions', label: 'إرشادات إضافية' },
                ];

                const validFields = addressFields.filter(({ key }) => {
                  const value = (address as any)[key];
                  return (
                    value &&
                    typeof value === 'string' &&
                    value !== 'غير محدد' &&
                    value.trim() !== '' &&
                    value.toLowerCase() !== 'undefined' &&
                    value.toLowerCase() !== 'null'
                  );
                });

                return validFields.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {validFields.map(({ key, label }) => {
                      const value = (address as any)[key];
                      return (
                        <div key={key}>
                          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                          <p className="text-sm">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    لا توجد تفاصيل عنوان متاحة
                  </div>
                );
              })()}

              {/* الموقع الجغرافي */}
              {(() => {
                // استخدام موقع العنوان أولاً، وإذا لم يكن متوفراً، استخدم موقع الوكيل
                const coordinates =
                  order.shipping_address?.coordinates ||
                  (order.agent?.location
                    ? {
                        lat: order.agent.location.lat,
                        lng: order.agent.location.lng,
                      }
                    : null);

                return coordinates ? (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      {order.shipping_address?.coordinates
                        ? 'الموقع الجغرافي (من عنوان الشحن)'
                        : 'الموقع الجغرافي (من موقع الوكيل)'}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📍</span>
                        <p className="text-sm font-mono">
                          {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium inline-flex items-center gap-1"
                      >
                        <span>🗺️</span>
                        <span>فتح على Google Maps</span>
                      </a>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* عرض جميع الحقول الإضافية */}
              {(() => {
                const excludedKeys = [
                  'street',
                  'address',
                  'address_line',
                  'street_address',
                  'city',
                  'area',
                  'district',
                  'state',
                  'province',
                  'postal_code',
                  'zip_code',
                  'country',
                  'building_number',
                  'floor_number',
                  'apartment_number',
                  'landmark',
                  'additional_directions',
                  'coordinates',
                ];
                const additionalFields = Object.entries(order.shipping_address).filter(
                  ([key, value]) =>
                    !excludedKeys.includes(key) &&
                    value !== null &&
                    value !== undefined &&
                    value !== '' &&
                    value !== 'غير محدد' &&
                    (typeof value !== 'string' || value.trim() !== '')
                );

                return additionalFields.length > 0 ? (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-xs font-medium text-gray-500 mb-2">معلومات إضافية</p>
                    <div className="space-y-2">
                      {additionalFields.map(([key, value]) => (
                        <div key={key}>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm">
                            {typeof value === 'object'
                              ? JSON.stringify(value, null, 2)
                              : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* عرض البيانات الخام للتحقق (في وضع التطوير) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <details className="cursor-pointer">
                    <summary className="text-xs font-medium text-gray-500 mb-2">
                      عرض البيانات الخام (للتطوير)
                    </summary>
                    <pre className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                      {JSON.stringify(order.shipping_address, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ملاحظات */}
        {order.notes && (
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">ملاحظات</p>
            <p className="text-base bg-gray-50 p-3 rounded-lg">{order.notes}</p>
          </div>
        )}

        {/* عناصر الطلب */}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">
            عناصر الطلب ({totalItems} عنصر)
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>سعر الوحدة</TableHead>
                  <TableHead>الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      لا توجد عناصر
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {item.product_data?.name_ar ||
                              item.product_data?.name_en ||
                              item.product_id}
                          </p>
                          {item.product_data?.sku && (
                            <p className="text-xs text-gray-500">
                              SKU: {item.product_data.sku}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit_price} EGP</TableCell>
                      <TableCell className="font-medium">
                        {(item.quantity * parseFloat(item.unit_price.toString())).toFixed(2)}{' '}
                        EGP
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </CustomDialog>
  );
}

