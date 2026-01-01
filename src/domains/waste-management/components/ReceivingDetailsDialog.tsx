'use client';

import React from 'react';
import { CustomDialog } from '@/shared/ui/custom-dialog';
import { ReceivingApprovalRequest, ReceivingSource } from '../services/receivingApprovalService';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { FiTruck, FiPackage, FiUser, FiFileText } from 'react-icons/fi';

const sourceLabels: Record<ReceivingSource, { label: string; icon: any }> = {
  delivery_boy: { label: 'دليفري بوي', icon: FiTruck },
  supplier: { label: 'مورد', icon: FiPackage },
  agent: { label: 'وكيل', icon: FiUser },
  direct: { label: 'مباشر', icon: FiFileText },
};

interface ReceivingDetailsDialogProps {
  request: ReceivingApprovalRequest;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceivingDetailsDialog({ request, isOpen, onClose }: ReceivingDetailsDialogProps) {
  const sourceInfo = sourceLabels[request.source];
  const SourceIcon = sourceInfo.icon;

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title="تفاصيل طلب الاستلام"
      description={`عرض تفاصيل طلب استلام المخلفات #${request.id?.substring(0, 8)}`}
    >
      <div className="space-y-4 p-4">
        {/* معلومات المصدر */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معلومات المصدر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <SourceIcon className="h-5 w-5" />
              <Badge>{sourceInfo.label}</Badge>
            </div>
            {request.source === 'delivery_boy' && request.delivery_agent_id && (
              <p className="text-sm text-gray-600">معرف الدليفري بوي: {request.delivery_agent_id}</p>
            )}
            {request.source === 'supplier' && request.supplier_id && (
              <p className="text-sm text-gray-600">معرف المورد: {request.supplier_id}</p>
            )}
            {request.source === 'agent' && request.agent_id && (
              <p className="text-sm text-gray-600">معرف الوكيل: {request.agent_id}</p>
            )}
            {request.collection_session_id && (
              <p className="text-sm text-gray-600">معرف جلسة التجميع: {request.collection_session_id}</p>
            )}
            {request.supplier_invoice_id && (
              <p className="text-sm text-gray-600">معرف فاتورة المورد: {request.supplier_invoice_id}</p>
            )}
          </CardContent>
        </Card>

        {/* معلومات المخزن */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المخزن المستلم</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">معرف المخزن: {request.warehouse_id}</p>
          </CardContent>
        </Card>

        {/* المخلفات المستلمة */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المخلفات المستلمة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {request.waste_items && Array.isArray(request.waste_items) && request.waste_items.length > 0 ? (
                request.waste_items.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm font-medium mb-1">
                      <strong>المخلفات:</strong> {item.waste_material_id}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>الكمية:</strong> {item.quantity} {item.unit || 'كجم'}
                    </p>
                    {item.quality_grade && (
                      <p className="text-sm text-gray-600">
                        <strong>الجودة:</strong> {item.quality_grade}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>ملاحظات:</strong> {item.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">لا توجد مخلفات مسجلة</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* الإجماليات */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الإجماليات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">الوزن الإجمالي</p>
                <p className="text-lg font-semibold">{request.total_weight || 0} كجم</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">القيمة الإجمالية</p>
                <p className="text-lg font-semibold">{request.total_value || 0} ج.م</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* حالة التحقق */}
        {request.status === 'verified' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات التحقق</CardTitle>
            </CardHeader>
            <CardContent>
              {request.verification_notes && (
                <p className="text-sm text-gray-600 mb-2">{request.verification_notes}</p>
              )}
              {request.verified_at && (
                <p className="text-sm text-gray-500">
                  تم التحقق في: {new Date(request.verified_at).toLocaleString('ar-EG')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* حالة الموافقة */}
        {request.status === 'approved' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات الموافقة</CardTitle>
            </CardHeader>
            <CardContent>
              {request.approval_notes && (
                <p className="text-sm text-gray-600 mb-2">{request.approval_notes}</p>
              )}
              {request.approved_at && (
                <p className="text-sm text-gray-500">
                  تمت الموافقة في: {new Date(request.approved_at).toLocaleString('ar-EG')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* حالة الرفض */}
        {request.status === 'rejected' && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-lg text-red-600">سبب الرفض</CardTitle>
            </CardHeader>
            <CardContent>
              {request.rejection_reason && (
                <p className="text-sm text-red-600 mb-2">{request.rejection_reason}</p>
              )}
              {request.rejected_at && (
                <p className="text-sm text-gray-500">
                  تم الرفض في: {new Date(request.rejected_at).toLocaleString('ar-EG')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* معلومات إضافية */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معلومات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                <strong>الحالة:</strong> {getStatusLabel(request.status)}
              </p>
              {request.created_at && (
                <p className="text-gray-600">
                  <strong>تاريخ الإنشاء:</strong> {new Date(request.created_at).toLocaleString('ar-EG')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </CustomDialog>
  );
}

function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    pending_verification: 'في انتظار التحقق',
    verified: 'تم التحقق',
    approved: 'تمت الموافقة',
    rejected: 'مرفوض',
  };
  return statusLabels[status] || status;
}

