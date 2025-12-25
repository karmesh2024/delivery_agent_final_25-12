'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { StoreOrder, StoreOrderFulfillmentStatus } from '@/domains/store-orders/types';
import {
  FiX,
  FiPackage,
  FiUser,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiShoppingBag,
  FiDollarSign,
  FiPhone,
  FiMail,
} from 'react-icons/fi';
import Image from 'next/image';

interface OrderDetailsModalProps {
  order: StoreOrder;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: StoreOrderFulfillmentStatus) => void;
}

const FULFILLMENT_STAGES: {
  status: StoreOrderFulfillmentStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    status: 'pending',
    label: 'في انتظار التجميع',
    description: 'الطلب في انتظار البدء في التجميع',
    icon: <FiClock className="text-yellow-600" size={20} />,
  },
  {
    status: 'collecting',
    label: 'قيد التجميع',
    description: 'جارٍ تجميع المنتجات من المخزن',
    icon: <FiPackage className="text-blue-600" size={20} />,
  },
  {
    status: 'verifying',
    label: 'قيد التحقق',
    description: 'التحقق من الكميات والجودة',
    icon: <FiCheckCircle className="text-purple-600" size={20} />,
  },
  {
    status: 'packaging',
    label: 'قيد التغليف',
    description: 'تغليف المنتجات وإرفاق الفاتورة',
    icon: <FiShoppingBag className="text-orange-600" size={20} />,
  },
  {
    status: 'ready',
    label: 'جاهز للتسليم',
    description: 'الطلب جاهز وانتظار المندوب/الوكيل',
    icon: <FiCheckCircle className="text-green-600" size={20} />,
  },
  {
    status: 'completed',
    label: 'تم التسليم',
    description: 'تم تسليم الطلب بنجاح',
    icon: <FiCheckCircle className="text-gray-600" size={20} />,
  },
];

export default function OrderDetailsModal({
  order,
  open,
  onClose,
  onStatusUpdate,
}: OrderDetailsModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<StoreOrderFulfillmentStatus>(
    order.fulfillment_status || 'pending'
  );

  // تحديث selectedStatus عندما يتغير order
  React.useEffect(() => {
    if (order.fulfillment_status) {
      setSelectedStatus(order.fulfillment_status);
    }
  }, [order.fulfillment_status]);

  const currentStageIndex = FULFILLMENT_STAGES.findIndex((s) => s.status === selectedStatus);
  const customerName = order.agent?.full_name || 'مستخدم عادي';
  const customerType = order.agent ? 'وكيل معتمد' : 'مستخدم عادي';

  const handleStatusUpdate = () => {
    onStatusUpdate(order.id, selectedStatus);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تفاصيل الطلب: {order.order_number}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <FiX />
            </Button>
          </DialogTitle>
          <DialogDescription>معلومات الطلب وحالة التجميع</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Fulfillment Stages Progress */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">مراحل التجميع</h3>
            <div className="space-y-3">
              {FULFILLMENT_STAGES.map((stage, index) => {
                const isCompleted = index <= currentStageIndex;
                const isCurrent = index === currentStageIndex;
                return (
                  <div
                    key={stage.status}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-blue-50 border-2 border-blue-300'
                        : isCompleted
                        ? 'bg-green-50'
                        : 'bg-white'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 ${
                        isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {stage.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{stage.label}</div>
                      <div className="text-sm text-gray-600">{stage.description}</div>
                    </div>
                    {isCompleted && (
                      <FiCheckCircle className="text-green-600" size={20} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Update Status Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">تحديث حالة التجميع</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FULFILLMENT_STAGES.map((stage) => {
                const isSelected = selectedStatus === stage.status;
                return (
                  <button
                    key={stage.status}
                    onClick={() => setSelectedStatus(stage.status)}
                    className={`
                      flex flex-col items-center justify-center gap-2
                      p-4 rounded-lg border-2 transition-all
                      min-h-[100px] aspect-square
                      ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-lg scale-105'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                      }
                      cursor-pointer
                    `}
                  >
                    <div className={`text-2xl ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                      {stage.icon}
                    </div>
                    <span className={`text-sm font-medium text-center ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                      {stage.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={handleStatusUpdate}
              className="w-full mt-4 h-12 text-lg font-semibold"
              disabled={selectedStatus === (order.fulfillment_status || 'pending')}
            >
              حفظ التغييرات
            </Button>
          </div>

          <Separator />

          {/* Customer/Agent Info */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FiUser />
              {customerType === 'وكيل معتمد' ? 'معلومات الوكيل المعتمد' : 'معلومات العميل'}
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">الاسم:</span>
                <span>{customerName}</span>
              </div>
              {order.agent?.phone && (
                <div className="flex items-center gap-2">
                  <FiPhone size={16} className="text-gray-400" />
                  <span>{order.agent.phone}</span>
                </div>
              )}
              {order.agent?.email && (
                <div className="flex items-center gap-2">
                  <FiMail size={16} className="text-gray-400" />
                  <span>{order.agent.email}</span>
                </div>
              )}
              {order.agent?.location && (
                <div className="flex items-center gap-2">
                  <FiMapPin size={16} className="text-gray-400" />
                  <span>
                    {order.agent.location.lat.toFixed(6)}, {order.agent.location.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Info */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FiShoppingBag />
              معلومات الطلب
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">المتجر:</span>
                <p className="font-medium">{order.shop?.name_ar || 'غير محدد'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">تاريخ الإنشاء:</span>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">طريقة الدفع:</span>
                <p className="font-medium">
                  {order.payment_method === 'cash_on_delivery'
                    ? 'الدفع عند الاستلام'
                    : order.payment_method || 'غير محدد'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">حالة الدفع:</span>
                <Badge
                  variant={order.payment_status === 'completed' ? 'default' : 'secondary'}
                >
                  {order.payment_status === 'completed' ? 'مدفوع' : 'قيد الانتظار'}
                </Badge>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-gray-600">المبلغ الإجمالي:</span>
                <p className="font-bold text-xl text-green-600">
                  {parseFloat(order.final_amount.toString()).toFixed(2)} EGP
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FiPackage />
              منتجات الطلب ({order.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  {item.product?.image_url && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name_ar || 'Product'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.product?.name_ar || 'منتج غير معروف'}</p>
                    <p className="text-sm text-gray-600">
                      SKU: {item.product?.sku || 'غير متوفر'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">الكمية: {item.quantity}</p>
                    <p className="text-sm text-gray-600">
                      {parseFloat(item.unit_price.toString()).toFixed(2)} EGP
                    </p>
                    <p className="text-sm font-semibold">
                      الإجمالي: {(parseFloat(item.unit_price.toString()) * item.quantity).toFixed(2)} EGP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">ملاحظات:</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{order.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

