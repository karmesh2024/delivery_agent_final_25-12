'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiEye, 
  FiFilter,
  FiSend
} from "react-icons/fi";
import { toast } from "sonner";

export default function NotificationsCenterPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب المقترحات الحقيقية من قاعدة البيانات
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch('/api/notifications/proposals');
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        }
      } catch (error) {
        toast.error('فشل في تحميل المقترحات من القاعدة');
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  const handleApprove = async (request: any) => {
    try {
      // 1. إرسال الإشعار الفعلي للمستخدمين
      const sendResponse = await fetch('/api/notifications/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: request.title,
          message: request.message,
          type: request.type,
          target_user_id: request.target_user_id,
          target_role: request.target_role
        }),
      });

      if (!sendResponse.ok) throw new Error('فشل في إرسال الإشعار الرئيسي');

      // 2. تحديث حالة المقترح في قاعدة البيانات (تمت الموافقة)
      await fetch(`/api/notifications/proposals?id=${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      toast.success('تم اعتماد الإشعار وإرساله بنجاح');
      setRequests(requests.filter(req => req.id !== request.id));
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة الطلب');
    }
  };

  const handleReject = async (id: string) => {
    try {
      // تحديث الحالة في القاعدة إلى مرفوض
      await fetch(`/api/notifications/proposals?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      toast.info('تم رفض المقترح وإزالته من القائمة');
      setRequests(requests.filter(req => req.id !== id));
    } catch (error) {
      toast.error('حدث خطأ أثناء رفض الطلب');
    }
  };

  return (
    <DashboardLayout title="مركز إدارة الإشعارات">
      <div className="p-6 space-y-6 text-right" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">مركز إدارة الإشعارات</h1>
            <p className="text-gray-500 mt-1">مراجعة واعتماد الإشعارات المقترحة من الإدارات المختلفة</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <FiFilter /> تصفية
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <FiSend /> إشعار سريع
            </Button>
          </div>
        </div>

        {/* ملخص الحالات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-amber-600 font-medium">بانتظار المراجعة</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <FiClock className="text-2xl text-amber-500" />
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">تمت الموافقة (اليوم)</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <FiCheckCircle className="text-2xl text-green-500" />
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-red-600 font-medium">تم رفضها (اليوم)</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <FiXCircle className="text-2xl text-red-500" />
            </CardContent>
          </Card>
        </div>

        {/* جدول الطلبات المنتظرة */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">طلبات الإشعارات المنتظرة</CardTitle>
            <CardDescription>هذه الإشعارات لن تصل للمستخدمين إلا بعد الضغط على "موافقة"</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الإدارة</TableHead>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">المستهدف</TableHead>
                    <TableHead className="text-right">الأولوية</TableHead>
                    <TableHead className="text-right">صاحب الطلب</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50">
                          {req.department === 'waste_mgmt' ? 'إدارة المخلفات' : 'إدارة النظام'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{req.title}</TableCell>
                      <TableCell>{req.target}</TableCell>
                      <TableCell>
                        <Badge className={
                          req.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }>
                          {req.priority === 'high' ? 'عالية' : 'متوسطة'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{req.created_by}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 h-8 gap-1"
                            onClick={() => handleApprove(req)}
                          >
                            <FiCheckCircle className="w-4 h-4" /> موافقة
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-red-600 hover:bg-red-700 h-8 gap-1"
                            onClick={() => handleReject(req.id)}
                          >
                            <FiXCircle className="w-4 h-4" /> رفض
                          </Button>
                          <Button size="sm" variant="outline" className="h-8">
                            <FiEye />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-gray-500">
                لا توجد طلبات معلقة حالياً.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
