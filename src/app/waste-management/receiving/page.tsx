'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/shared/components/ui/table";
import { 
  FiTruck, 
  FiPackage, 
  FiUser, 
  FiFileText, 
  FiCheck, 
  FiX, 
  FiEye,
  FiRefreshCw,
  FiPlus
} from "react-icons/fi";
import { receivingApprovalService, ReceivingApprovalRequest, ReceivingSource } from '@/domains/waste-management/services/receivingApprovalService';
import { canManageReceiving } from '@/domains/waste-management/services/wasteManagementPermissions';
import { getCurrentUserId } from '@/lib/logger-safe';
import { useToast } from '@/shared/ui/use-toast';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import { ReceivingDetailsDialog } from '@/domains/waste-management/components/ReceivingDetailsDialog';
import { ReceivingVerificationDialog } from '@/domains/waste-management/components/ReceivingVerificationDialog';

const sourceLabels: Record<ReceivingSource, { label: string; icon: any; color: string }> = {
  delivery_boy: { label: 'دليفري بوي', icon: FiTruck, color: 'bg-blue-100 text-blue-800' },
  supplier: { label: 'مورد', icon: FiPackage, color: 'bg-green-100 text-green-800' },
  agent: { label: 'وكيل', icon: FiUser, color: 'bg-purple-100 text-purple-800' },
  direct: { label: 'مباشر', icon: FiFileText, color: 'bg-gray-100 text-gray-800' },
};

export default function ReceivingRequestsPage() {
  const [requests, setRequests] = useState<ReceivingApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ReceivingApprovalRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await receivingApprovalService.getPendingReceivingRequests();
      setRequests(data);
    } catch (error) {
      console.error('خطأ في جلب طلبات الاستلام:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب طلبات الاستلام",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: ReceivingApprovalRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const handleVerify = (request: ReceivingApprovalRequest) => {
    setSelectedRequest(request);
    setShowVerificationDialog(true);
  };

  const handleApprove = async (requestId: string) => {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    const permission = await canManageReceiving(userId, 'approve');
    if (!permission.allowed) {
      toast({
        title: "خطأ",
        description: permission.reason || 'ليس لديك صلاحية للموافقة على الاستلام',
        variant: "destructive",
      });
      return;
    }

    if (window.confirm('هل أنت متأكد من الموافقة على استلام هذه المخلفات؟')) {
      const success = await receivingApprovalService.approveReceiving(requestId, userId, 'تمت الموافقة');
      if (success) {
        loadRequests();
      }
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = window.prompt('يرجى إدخال سبب الرفض:');
    if (!reason) return;

    const userId = await getCurrentUserId();
    if (!userId) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    const success = await receivingApprovalService.rejectReceiving(requestId, userId, reason);
    if (success) {
      loadRequests();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending_verification: { label: 'في انتظار التحقق', variant: 'secondary' },
      verified: { label: 'تم التحقق', variant: 'default' },
      approved: { label: 'تمت الموافقة', variant: 'default' },
      rejected: { label: 'مرفوض', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout title="طلبات استلام المخلفات">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">طلبات استلام المخلفات</h1>
            <p className="text-gray-500 mt-2">
              مراقبة والتحقق من استلام المخلفات من جميع المصادر
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadRequests} variant="outline">
              <FiRefreshCw className="h-4 w-4 mr-2" />
              تحديث
            </Button>
            <Button onClick={() => window.location.href = '/waste-management/receiving/new'}>
              <FiPlus className="h-4 w-4 mr-2" />
              طلب استلام جديد
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">جاري تحميل طلبات الاستلام...</p>
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500">لا توجد طلبات استلام معلقة حالياً</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>الطلبات المعلقة ({requests.length})</CardTitle>
              <CardDescription>
                طلبات الاستلام التي تحتاج إلى التحقق أو الموافقة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المصدر</TableHead>
                    <TableHead>المخزن</TableHead>
                    <TableHead>الكمية الإجمالية</TableHead>
                    <TableHead>القيمة الإجمالية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => {
                    const sourceInfo = sourceLabels[request.source];
                    const SourceIcon = sourceInfo.icon;
                    
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <SourceIcon className="h-4 w-4" />
                            <Badge className={sourceInfo.color}>
                              {sourceInfo.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.warehouse_id ? `مخزن #${request.warehouse_id}` : '-'}
                        </TableCell>
                        <TableCell>
                          {request.total_weight ? `${request.total_weight} كجم` : '-'}
                        </TableCell>
                        <TableCell>
                          {request.total_value ? `${request.total_value} ج.م` : '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          {request.created_at 
                            ? new Date(request.created_at).toLocaleDateString('ar-EG')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                            >
                              <FiEye className="h-4 w-4 mr-1" />
                              التفاصيل
                            </Button>
                            {request.status === 'pending_verification' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleVerify(request)}
                              >
                                <FiCheck className="h-4 w-4 mr-1" />
                                التحقق
                              </Button>
                            )}
                            {request.status === 'verified' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApprove(request.id!)}
                                >
                                  <FiCheck className="h-4 w-4 mr-1" />
                                  موافقة
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleReject(request.id!)}
                                >
                                  <FiX className="h-4 w-4 mr-1" />
                                  رفض
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Dialog للتفاصيل */}
        {selectedRequest && (
          <ReceivingDetailsDialog
            request={selectedRequest}
            isOpen={showDetailsDialog}
            onClose={() => {
              setShowDetailsDialog(false);
              setSelectedRequest(null);
            }}
          />
        )}

        {/* Dialog للتحقق */}
        {selectedRequest && (
          <ReceivingVerificationDialog
            request={selectedRequest}
            isOpen={showVerificationDialog}
            onClose={() => {
              setShowVerificationDialog(false);
              setSelectedRequest(null);
            }}
            onSuccess={() => {
              loadRequests();
              setShowVerificationDialog(false);
              setSelectedRequest(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

