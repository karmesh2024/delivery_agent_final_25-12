'use client';

import React from 'react';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import { PriceApprovalRequest } from '../services/priceApprovalService';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface PriceApprovalDetailsDialogProps {
  request: PriceApprovalRequest;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export function PriceApprovalDetailsDialog({ 
  request, 
  isOpen, 
  onClose, 
  onApprove, 
  onReject 
}: PriceApprovalDetailsDialogProps) {
  const changePercentage = request.price_change_percentage;
  const isIncrease = changePercentage > 0;

  return (
    <UniversalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="تفاصيل طلب الموافقة على تغيير السعر"
      description="عرض تفاصيل طلب تغيير السعر"
    >
      <div className="space-y-4">
        {/* معلومات المخلفات */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-2">المخلفات</h3>
          <p className="text-sm text-gray-600">معرف المخلفات: {request.waste_material_id}</p>
        </div>

        {/* الأسعار */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-2">مقارنة الأسعار</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">السعر القديم</p>
              <p className="text-lg font-semibold">{request.old_price || 0} ج.م</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">السعر الجديد</p>
              <p className="text-lg font-semibold text-blue-600">{request.new_price} ج.م</p>
            </div>
          </div>
        </div>

        {/* نسبة التغيير */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-2">نسبة التغيير</h3>
          <div className="flex items-center gap-2">
            {isIncrease ? (
              <FiTrendingUp className="h-5 w-5 text-red-600" />
            ) : (
              <FiTrendingDown className="h-5 w-5 text-green-600" />
            )}
            <span className={`text-2xl font-bold ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
              {isIncrease ? '+' : ''}{changePercentage.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* السبب */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-2">سبب التغيير</h3>
          <p className="text-sm text-gray-600">{request.reason}</p>
        </div>

        {/* الحالة */}
        <div className="border-b pb-4">
          <h3 className="font-semibold mb-2">الحالة</h3>
          <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
            {request.status === 'pending' ? 'في انتظار الموافقة' : request.status}
          </Badge>
        </div>

        {/* التواريخ */}
        <div>
          <h3 className="font-semibold mb-2">التواريخ</h3>
          {request.created_at && (
            <p className="text-sm text-gray-600">
              تاريخ الإنشاء: {new Date(request.created_at).toLocaleString('ar-EG')}
            </p>
          )}
          {request.approved_at && (
            <p className="text-sm text-gray-600">
              تاريخ الموافقة: {new Date(request.approved_at).toLocaleString('ar-EG')}
            </p>
          )}
          {request.rejected_at && (
            <p className="text-sm text-red-600">
              تاريخ الرفض: {new Date(request.rejected_at).toLocaleString('ar-EG')}
            </p>
          )}
        </div>

        {/* الإجراءات */}
        {request.status === 'pending' && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => onReject(request.id!)}
            >
              رفض
            </Button>
            <Button 
              variant="default" 
              onClick={() => onApprove(request.id!)}
            >
              موافقة
            </Button>
          </div>
        )}
      </div>
    </UniversalDialog>
  );
}


