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
  FiCheck, 
  FiX, 
  FiEye,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw
} from "react-icons/fi";
import { priceApprovalService, PriceApprovalRequest } from '@/domains/waste-management/services/priceApprovalService';
import {
  subcategoryPriceApprovalService,
  SubcategoryPriceApprovalRequest,
} from '@/domains/waste-management/services/subcategoryPriceApprovalService';
import { canManagePricing } from '@/domains/waste-management/services/wasteManagementPermissions';
import { getCurrentUserId } from '@/lib/logger-safe';
import { useToast } from '@/shared/ui/use-toast';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import { PriceApprovalDetailsDialog } from '@/domains/waste-management/components/PriceApprovalDetailsDialog';

export default function PriceApprovalsPage() {
  const [requests, setRequests] = useState<PriceApprovalRequest[]>([]);
  const [subcategoryRequests, setSubcategoryRequests] = useState<SubcategoryPriceApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PriceApprovalRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [productData, subcategoryData] = await Promise.all([
        priceApprovalService.getPendingApprovals(),
        subcategoryPriceApprovalService.getPending(),
      ]);
      setRequests(productData);
      setSubcategoryRequests(subcategoryData);
    } catch (error) {
      console.error('خطأ في جلب طلبات الموافقة:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب طلبات الموافقة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: PriceApprovalRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
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

    const permission = await canManagePricing(userId, 'approve');
    if (!permission.allowed) {
      toast({
        title: "خطأ",
        description: permission.reason || 'ليس لديك صلاحية للموافقة على تغييرات الأسعار',
        variant: "destructive",
      });
      return;
    }

    const notes = window.prompt('يرجى إدخال ملاحظات الموافقة (اختياري):');
    const success = await priceApprovalService.approveRequest(requestId, userId, notes || undefined);
    if (success) {
      loadRequests();
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

    const success = await priceApprovalService.rejectRequest(requestId, userId, reason);
    if (success) {
      loadRequests();
    }
  };

  const getChangeIndicator = (percentage: number) => {
    if (percentage > 0) {
      return (
        <div className="flex items-center text-red-600">
          <FiTrendingUp className="h-4 w-4 mr-1" />
          <span>+{percentage.toFixed(2)}%</span>
        </div>
      );
    } else if (percentage < 0) {
      return (
        <div className="flex items-center text-green-600">
          <FiTrendingDown className="h-4 w-4 mr-1" />
          <span>{percentage.toFixed(2)}%</span>
        </div>
      );
    }
    return <span className="text-gray-500">0%</span>;
  };

  return (
    <DashboardLayout title="طلبات الموافقة على الأسعار">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">طلبات الموافقة على تغيير الأسعار</h1>
            <p className="text-gray-500 mt-2">
              مراجعة والموافقة على تغييرات الأسعار الكبيرة (&gt;= 10%)
            </p>
          </div>
          <Button onClick={loadRequests} variant="outline">
            <FiRefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">جاري تحميل طلبات الموافقة...</p>
          </div>
        ) : requests.length === 0 && subcategoryRequests.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500">لا توجد طلبات موافقة معلقة حالياً</p>
            </CardContent>
          </Card>
        ) : (
          <>
          {/* طلبات أسعار المنتجات (stock_exchange) */}
          {requests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>طلبات أسعار المنتجات ({requests.length})</CardTitle>
              <CardDescription>
                طلبات تغيير أسعار المنتجات في البورصة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المخلفات</TableHead>
                    <TableHead>السعر القديم</TableHead>
                    <TableHead>السعر الجديد</TableHead>
                    <TableHead>نسبة التغيير</TableHead>
                    <TableHead>السبب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <span className="font-medium">{request.waste_material_id}</span>
                      </TableCell>
                      <TableCell>
                        {request.old_price ? `${request.old_price} ج.م` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{request.new_price} ج.م</span>
                      </TableCell>
                      <TableCell>
                        {getChangeIndicator(request.price_change_percentage)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{request.reason}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                          {request.status === 'pending' ? 'في انتظار الموافقة' : request.status}
                        </Badge>
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
                          {request.status === 'pending' && (
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          )}

          {/* طلبات أسعار الفئات الفرعية */}
          {subcategoryRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>طلبات أسعار الفئات الفرعية ({subcategoryRequests.length})</CardTitle>
              <CardDescription>
                تغيير سعر البورصة للفئة ≥10% — تحتاج موافقة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفئة الفرعية</TableHead>
                    <TableHead>السعر القديم</TableHead>
                    <TableHead>السعر الجديد</TableHead>
                    <TableHead>نسبة التغيير</TableHead>
                    <TableHead>السبب</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcategoryRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.subcategory_name ?? req.subcategory_id}</TableCell>
                      <TableCell>{req.old_price != null ? `${req.old_price} ج.م` : '-'}</TableCell>
                      <TableCell className="font-medium">{req.new_price} ج.م</TableCell>
                      <TableCell>
                        {req.price_change_percentage > 0 ? (
                          <span className="text-red-600">+{req.price_change_percentage.toFixed(1)}%</span>
                        ) : req.price_change_percentage < 0 ? (
                          <span className="text-green-600">{req.price_change_percentage.toFixed(1)}%</span>
                        ) : (
                          <span className="text-gray-500">0%</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{req.reason}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={async () => {
                              const uid = await getCurrentUserId();
                              if (!uid) {
                                toast({ title: "خطأ", description: "يجب تسجيل الدخول", variant: "destructive" });
                                return;
                              }
                              const notes = window.prompt('ملاحظات الموافقة (اختياري):');
                              const ok = await subcategoryPriceApprovalService.approve(req.id!, uid, notes ?? undefined);
                              if (ok) loadRequests();
                            }}
                          >
                            <FiCheck className="h-4 w-4 mr-1" />
                            موافقة
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              const reason = window.prompt('سبب الرفض:');
                              if (!reason) return;
                              const uid = await getCurrentUserId();
                              if (!uid) return;
                              const ok = await subcategoryPriceApprovalService.reject(req.id!, uid, reason);
                              if (ok) loadRequests();
                            }}
                          >
                            <FiX className="h-4 w-4 mr-1" />
                            رفض
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          )}
          </>
        )}

        {/* Dialog للتفاصيل */}
        {selectedRequest && (
          <PriceApprovalDetailsDialog
            request={selectedRequest}
            isOpen={showDetailsDialog}
            onClose={() => {
              setShowDetailsDialog(false);
              setSelectedRequest(null);
            }}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

