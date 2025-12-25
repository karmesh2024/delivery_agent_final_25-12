'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { supabase } from '@/lib/supabase';

interface AssignmentItem {
  id: string;
  catalog_product_id: string | null;
  product_id: string | null;
  sku: string | null;
  name: string | null;
  image_url: string | null;
  ordered_quantity: number;
  received_quantity: number | null;
  damaged_quantity: number | null;
  status: 'pending' | 'received' | 'shortage' | 'damaged';
  notes: string | null;
}

interface WarehouseAssignment {
  id: string;
  invoice_id: string | null;
  invoice_number: string | null;
  supplier_name: string | null;
  warehouse_id: number;
  warehouse_name: string | null;
  expected_date: string | null;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string | null;
  items: AssignmentItem[];
}

const statusLabels = {
  pending: 'قيد الانتظار',
  partial: 'استلام جزئي',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};

const itemStatusLabels = {
  pending: 'قيد الانتظار',
  received: 'مستلم',
  shortage: 'نقص',
  damaged: 'تالف',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function WarehouseAssignmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;
  const token = useAppSelector((state) => state.auth.token);

  const [assignment, setAssignment] = useState<WarehouseAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Record<string, { received_quantity: number; damaged_quantity: number; status: string; notes: string }>>({});

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const getHeaders = async (): Promise<HeadersInit> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // الحصول على التوكن من Redux store أو من Supabase مباشرة
    let authToken = token;
    
    if (!authToken && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || null;
      } catch (sessionError) {
        console.warn('Error getting session from Supabase:', sessionError);
      }
    }
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
  };

  const fetchAssignment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/warehouse/assignments/${assignmentId}`, {
        headers: await getHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل تحميل أمر الإسناد');
      }
      
      const data = await response.json();
      setAssignment(data.assignment);
      
      // تهيئة البيانات للبنود
      const itemsData: Record<string, { received_quantity: number; damaged_quantity: number; status: string; notes: string }> = {};
      data.assignment.items.forEach((item: AssignmentItem) => {
        itemsData[item.id] = {
          received_quantity: item.received_quantity || 0,
          damaged_quantity: item.damaged_quantity || 0,
          status: item.status,
          notes: item.notes || '',
        };
      });
      setItems(itemsData);
    } catch (error: any) {
      console.error('Error fetching assignment:', error);
      toast.error('فشل تحميل أمر الإسناد');
      router.push('/warehouse-management/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (itemId: string, field: string, value: any) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!assignment) return;

    setSaving(true);
    try {
      const itemsToUpdate = assignment.items.map((item) => ({
        id: item.id,
        received_quantity: Number(items[item.id]?.received_quantity || 0),
        damaged_quantity: Number(items[item.id]?.damaged_quantity || 0),
        status: items[item.id]?.status || 'pending',
        notes: items[item.id]?.notes || null,
      }));

      const response = await fetch(`/api/warehouse/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ items: itemsToUpdate }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل تحديث أمر الإسناد');
      }

      toast.success('تم تحديث أمر الإسناد بنجاح');
      fetchAssignment();
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      toast.error(error?.message || 'فشل تحديث أمر الإسناد');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="تفاصيل أمر الإسناد">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout title="تفاصيل أمر الإسناد">
        <div className="p-6">
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500">أمر الإسناد غير موجود</p>
              <Link href="/warehouse-management/assignments">
                <Button variant="outline" className="mt-4">
                  العودة للقائمة
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const canEdit = assignment.status !== 'completed' && assignment.status !== 'cancelled';

  return (
    <DashboardLayout title="تفاصيل أمر الإسناد">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/warehouse-management/assignments">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">أمر الإسناد #{assignment.invoice_number || assignment.id.slice(0, 8)}</h1>
              <p className="text-gray-600 mt-1">تسجيل الكميات المستلمة</p>
            </div>
          </div>
          <Badge className={cn(statusColors[assignment.status], 'font-semibold text-base px-3 py-1')}>
            {statusLabels[assignment.status]}
          </Badge>
        </div>

        {/* Assignment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>بيانات أمر الإسناد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">رقم الفاتورة</p>
                  <p className="font-semibold">{assignment.invoice_number || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">المورد</p>
                  <p className="font-semibold">{assignment.supplier_name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">المخزن</p>
                  <p className="font-semibold">{assignment.warehouse_name || `مخزن #${assignment.warehouse_id}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">تاريخ متوقع</p>
                  <p className="font-semibold">
                    {assignment.expected_date
                      ? new Date(assignment.expected_date).toLocaleDateString('ar-EG')
                      : '—'}
                  </p>
                </div>
              </div>
              {assignment.notes && (
                <div>
                  <p className="text-sm text-gray-600">ملاحظات</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{assignment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص الاستلام</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">إجمالي البنود:</span>
                <span className="font-semibold">{assignment.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">مستلم بالكامل:</span>
                <span className="font-semibold text-green-600">
                  {assignment.items.filter((item) => item.status === 'received').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">قيد الانتظار:</span>
                <span className="font-semibold text-yellow-600">
                  {assignment.items.filter((item) => item.status === 'pending').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">نقص:</span>
                <span className="font-semibold text-orange-600">
                  {assignment.items.filter((item) => item.status === 'shortage').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">تالف:</span>
                <span className="font-semibold text-red-600">
                  {assignment.items.filter((item) => item.status === 'damaged').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Items */}
        <Card>
          <CardHeader>
            <CardTitle>بنود أمر الإسناد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {assignment.items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <div className="flex items-center gap-4">
                    {/* صورة المنتج */}
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name || ''}
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.png';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{item.name || '—'}</h4>
                      <p className="text-sm text-gray-500">SKU: {item.sku || '—'}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        الكمية المطلوبة: <span className="font-semibold">{item.ordered_quantity.toLocaleString('ar-EG')}</span>
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        item.status === 'received' ? 'bg-green-100 text-green-800' :
                        item.status === 'shortage' ? 'bg-orange-100 text-orange-800' :
                        item.status === 'damaged' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800',
                        'font-semibold'
                      )}
                    >
                      {itemStatusLabels[item.status]}
                    </Badge>
                  </div>

                  {canEdit && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div>
                        <Label>الكمية المستلمة</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={items[item.id]?.received_quantity || 0}
                          onChange={(e) => handleItemChange(item.id, 'received_quantity', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>الكمية التالفة</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={items[item.id]?.damaged_quantity || 0}
                          onChange={(e) => handleItemChange(item.id, 'damaged_quantity', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>حالة البند</Label>
                        <Select
                          value={items[item.id]?.status || 'pending'}
                          onValueChange={(value) => handleItemChange(item.id, 'status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">قيد الانتظار</SelectItem>
                            <SelectItem value="received">مستلم</SelectItem>
                            <SelectItem value="shortage">نقص</SelectItem>
                            <SelectItem value="damaged">تالف</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>ملاحظات</Label>
                        <Textarea
                          value={items[item.id]?.notes || ''}
                          onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                          rows={2}
                          placeholder="ملاحظات على البند..."
                        />
                      </div>
                    </div>
                  )}

                  {!canEdit && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">الكمية المستلمة</p>
                        <p className="font-semibold">{item.received_quantity?.toLocaleString('ar-EG') || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">الكمية التالفة</p>
                        <p className="font-semibold">{item.damaged_quantity?.toLocaleString('ar-EG') || 0}</p>
                      </div>
                      {item.notes && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">ملاحظات</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {canEdit && (
              <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                <Link href="/warehouse-management/assignments">
                  <Button variant="outline">إلغاء</Button>
                </Link>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

