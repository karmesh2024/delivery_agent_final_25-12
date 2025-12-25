'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { StoreOrder, StoreOrderFulfillmentStatus } from '@/domains/store-orders/types';
import { FiClock, FiPackage, FiUser, FiMapPin, FiEye } from 'react-icons/fi';

interface OrderCardProps {
  order: StoreOrder;
  onClick: () => void;
  onStatusUpdate: (orderId: string, status: StoreOrderFulfillmentStatus) => void;
}

const STATUS_CONFIG: Record<StoreOrderFulfillmentStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'في انتظار التجميع', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  collecting: { label: 'قيد التجميع', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  verifying: { label: 'قيد التحقق', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  packaging: { label: 'قيد التغليف', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  ready: { label: 'جاهز للتسليم', color: 'text-green-700', bgColor: 'bg-green-100' },
  completed: { label: 'تم التسليم', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

const getStatusConfig = (status?: StoreOrderFulfillmentStatus) => {
  return STATUS_CONFIG[status || 'pending'];
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'م' : 'ص';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `${diffMins} دقيقة`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} يوم`;
};

export default function OrderCard({ order, onClick, onStatusUpdate }: OrderCardProps) {
  const status = order.fulfillment_status || 'pending';
  const statusConfig = getStatusConfig(status);
  const customerName = order.agent?.full_name || 'مستخدم عادي';
  const customerType = order.agent ? 'وكيل معتمد' : 'مستخدم عادي';
  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // تحديد لون البطاقة حسب الحالة
  const cardBorderColor = {
    pending: 'border-yellow-300',
    collecting: 'border-blue-300',
    verifying: 'border-purple-300',
    packaging: 'border-orange-300',
    ready: 'border-green-300',
    completed: 'border-gray-300',
  }[status];

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-shadow ${cardBorderColor} border-2`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{order.order_number}</h3>
              <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                {statusConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiClock size={14} />
              <span>{formatTime(order.created_at)}</span>
              <span className="text-gray-400">•</span>
              <span>{getTimeAgo(order.created_at)}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Customer Info */}
        <div className="flex items-center gap-2 text-sm">
          <FiUser size={16} className="text-gray-400" />
          <span className="font-medium">{customerName}</span>
          <Badge variant="outline" className="text-xs">
            {customerType}
          </Badge>
        </div>

        {/* Store Info */}
        {order.shop && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">المتجر:</span> {order.shop.name_ar}
          </div>
        )}

        {/* Items Count */}
        <div className="flex items-center gap-2 text-sm">
          <FiPackage size={16} className="text-gray-400" />
          <span>
            {totalItems} {totalItems === 1 ? 'منتج' : 'منتجات'} • {order.items?.length || 0} {order.items?.length === 1 ? 'نوع' : 'أنواع'}
          </span>
        </div>

        {/* Total Amount */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm text-gray-600">المبلغ الإجمالي:</span>
          <span className="font-bold text-lg">{parseFloat(order.final_amount.toString()).toFixed(2)} EGP</span>
        </div>

        {/* Payment Method */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            {order.payment_method === 'cash_on_delivery' ? 'الدفع عند الاستلام' : 'مدفوع'}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <FiEye className="mr-2" size={14} />
            التفاصيل
          </Button>
          {status !== 'completed' && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                // تحديث الحالة إلى المرحلة التالية
                const nextStatus: Record<StoreOrderFulfillmentStatus, StoreOrderFulfillmentStatus> = {
                  pending: 'collecting',
                  collecting: 'verifying',
                  verifying: 'packaging',
                  packaging: 'ready',
                  ready: 'completed',
                  completed: 'completed',
                };
                onStatusUpdate(order.id, nextStatus[status]);
              }}
            >
              التالي
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

