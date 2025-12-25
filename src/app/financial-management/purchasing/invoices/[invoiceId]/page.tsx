'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { PurchaseInvoice, PurchaseInvoiceStatus } from '@/domains/purchasing/types';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Edit, Send, CheckCircle, XCircle, Package, DollarSign, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import Link from 'next/link';

const statusLabels: Record<PurchaseInvoiceStatus, string> = {
  draft: 'مسودة',
  pending: 'قيد المراجعة',
  pending_approval: 'بانتظار الاعتماد',
  approved: 'معتمدة',
  assigned_to_warehouse: 'مُسندة للمخازن',
  partially_received: 'استلام جزئي',
  received_in_warehouse: 'تم الاستلام بالمخزن',
  ready_for_pricing: 'جاهزة للتسعير',
  received: 'مستلمة',
  priced: 'تم التسعير',
  rejected: 'مرفوضة',
  cancelled: 'ملغاة',
};

const statusColors: Record<PurchaseInvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-800',
  pending_approval: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  assigned_to_warehouse: 'bg-sky-100 text-sky-800',
  partially_received: 'bg-orange-100 text-orange-800',
  received_in_warehouse: 'bg-blue-100 text-blue-800',
  ready_for_pricing: 'bg-indigo-100 text-indigo-800',
  received: 'bg-cyan-100 text-cyan-800',
  priced: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-200 text-slate-700',
};

export default function PurchaseInvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const token = useAppSelector((state) => state.auth.token);

  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<PurchaseInvoiceStatus | ''>('');
  
  // Payment states
  const [paymentInfo, setPaymentInfo] = useState<{
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    payment_status: string;
    payment_date: string | null;
    payment_method: string | null;
    payment_reference: string | null;
    payment_notes: string | null;
  } | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'cash',
    payment_reference: '',
    payment_notes: '',
    payment_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId, token]);

  useEffect(() => {
    if (invoice && invoiceId) {
      fetchPaymentInfo();
    }
  }, [invoice, invoiceId, token]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      // الحصول على التوكن من Redux store أو من Supabase مباشرة
      let authToken = token;
      
      console.log('[fetchInvoice] Token from Redux:', !!token, 'Supabase available:', !!supabase);
      
      if (!authToken && supabase) {
        try {
          console.log('[fetchInvoice] Attempting to get session from Supabase...');
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.warn('[fetchInvoice] Error getting session from Supabase:', sessionError);
          } else if (session?.access_token) {
            authToken = session.access_token;
            console.log('[fetchInvoice] Got token from Supabase session');
          } else {
            console.warn('[fetchInvoice] No session or access_token found in Supabase');
          }
        } catch (sessionError) {
          console.error('[fetchInvoice] Exception getting session from Supabase:', sessionError);
        }
      }

      if (!authToken) {
        console.error('[fetchInvoice] No auth token available');
        toast.error('يجب تسجيل الدخول أولاً');
        setLoading(false);
        return;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      };
      
      console.log('[fetchInvoice] Fetching invoice with headers:', {
        hasAuth: !!headers['Authorization'],
        authLength: headers['Authorization']?.length || 0,
      });
      
      const response = await fetch(`/api/purchasing/invoices/${invoiceId}`, {
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل تحميل الفاتورة');
      }
      const data = await response.json();
      setInvoice(data.invoice);
      setNewStatus(data.invoice.status);
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      toast.error(error?.message || 'فشل تحميل الفاتورة');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentInfo = async () => {
    try {
      let authToken = token;
      
      if (!authToken && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          authToken = session?.access_token || null;
        } catch (error) {
          console.warn('Error getting session:', error);
        }
      }

      if (!authToken) {
        return;
      }

      const response = await fetch(`/api/purchasing/invoices/${invoiceId}/payment`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[fetchPaymentInfo] Payment data received:', data);
        setPaymentInfo({
          total_amount: data.total_amount || 0,
          paid_amount: data.paid_amount || 0,
          remaining_amount: data.remaining_amount || (data.total_amount || 0) - (data.paid_amount || 0),
          payment_status: data.payment_status || 'pending',
          payment_date: data.payment_date || null,
          payment_method: data.payment_method || null,
          payment_reference: data.payment_reference || null,
          payment_notes: data.payment_notes || null,
        });
      } else {
        console.warn('[fetchPaymentInfo] Response not OK:', response.status);
        // إذا لم تكن هناك معلومات دفع، نعرض القيم الافتراضية من الفاتورة
        if (invoice) {
          setPaymentInfo({
            total_amount: Number(invoice.total_amount) || 0,
            paid_amount: 0,
            remaining_amount: Number(invoice.total_amount) || 0,
            payment_status: 'pending',
            payment_date: null,
            payment_method: null,
            payment_reference: null,
            payment_notes: null,
          });
        }
      }
    } catch (error) {
      console.error('[fetchPaymentInfo] Error:', error);
      // في حالة الخطأ، نعرض القيم الافتراضية من الفاتورة
      if (invoice) {
        setPaymentInfo({
          total_amount: Number(invoice.total_amount) || 0,
          paid_amount: 0,
          remaining_amount: Number(invoice.total_amount) || 0,
          payment_status: 'pending',
          payment_date: null,
          payment_method: null,
          payment_reference: null,
          payment_notes: null,
        });
      }
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      toast.error('يجب إدخال مبلغ الدفعة');
      return;
    }

    setRecordingPayment(true);
    try {
      let authToken = token;
      
      if (!authToken && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          authToken = session?.access_token || null;
        } catch (error) {
          console.warn('Error getting session:', error);
        }
      }

      if (!authToken) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      console.log('[handleRecordPayment] Sending payment data:', paymentForm);
      
      const response = await fetch(`/api/purchasing/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(paymentForm),
      });

      console.log('[handleRecordPayment] Response status:', response.status);
      console.log('[handleRecordPayment] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let error;
        try {
          const text = await response.text();
          console.log('[handleRecordPayment] Response text:', text);
          error = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('[handleRecordPayment] Error parsing response:', parseError);
          error = { error: `خطأ في الاستجابة من الخادم (${response.status})` };
        }
        
        console.error('[handleRecordPayment] Error response:', error);
        
        // عرض تفاصيل الخطأ إذا كانت متاحة
        if (error.details) {
          console.error('[handleRecordPayment] Error details:', error.details);
        }
        
        if (error.hint) {
          toast.error(`${error.error || 'فشل في تسجيل الدفعة'}\n${error.hint}`, {
            duration: 5000,
          });
        } else {
          toast.error(error.error || `فشل في تسجيل الدفعة (${response.status})`);
        }
        
        throw new Error(error.error || `فشل في تسجيل الدفعة (${response.status})`);
      }

      const data = await response.json();
      toast.success(data.message || 'تم تسجيل الدفعة بنجاح');
      
      // تحديث معلومات الدفع
      await fetchPaymentInfo();
      
      // إغلاق النموذج وإعادة تعيين الحقول
      setPaymentDialogOpen(false);
      setPaymentForm({
        amount: '',
        payment_method: 'cash',
        payment_reference: '',
        payment_notes: '',
        payment_date: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      console.error('[handleRecordPayment] Error:', error);
      toast.error(error?.message || 'فشل في تسجيل الدفعة');
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !invoice) return;

    setUpdating(true);
    try {
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

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`/api/purchasing/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل تحديث الحالة');
      }

      const data = await response.json();
      setInvoice(data.invoice);
      toast.success('تم تحديث حالة الفاتورة بنجاح');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error?.message || 'فشل تحديث حالة الفاتورة');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendToPricing = async () => {
    if (!invoice) return;

    setUpdating(true);
    try {
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

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`/api/purchasing/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'ready_for_pricing' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل إرسال الفاتورة');
      }

      const data = await response.json();
      setInvoice(data.invoice);
      toast.success('تم إرسال الفاتورة لإدارة التسعير بنجاح');
    } catch (error: any) {
      console.error('Error sending to pricing:', error);
      toast.error(error?.message || 'فشل إرسال الفاتورة');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendToWarehouse = async () => {
    if (!invoice) {
      toast.error('الفاتورة غير موجودة');
      return;
    }

    console.log('[handleSendToWarehouse] Invoice data:', {
      id: invoice.id,
      warehouse_id: invoice.warehouse_id,
      items_count: invoice.items?.length || 0,
      items: invoice.items,
    });

    // التحقق من البيانات المطلوبة
    if (!invoice.id) {
      toast.error('معرف الفاتورة غير موجود');
      return;
    }

    if (!invoice.warehouse_id) {
      toast.error('يرجى تحديد المخزن أولاً');
      return;
    }

    if (!invoice.items || invoice.items.length === 0) {
      toast.error('الفاتورة لا تحتوي على أي بنود');
      return;
    }

    setUpdating(true);
    try {
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

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // تحضير البيانات للإرسال
      const requestBody = {
        invoice_id: invoice.id,
        warehouse_id: invoice.warehouse_id,
        expected_date: invoice.received_date || null,
        items: invoice.items.map((item) => ({
          catalog_product_id: item.catalog_product_id || null,
          product_id: item.product_id || null,
          ordered_quantity: item.quantity || 0,
          notes: item.notes || null,
        })),
        notes: invoice.notes || null,
      };

      console.log('[handleSendToWarehouse] Sending request:', {
        invoice_id: requestBody.invoice_id,
        warehouse_id: requestBody.warehouse_id,
        items_count: requestBody.items.length,
        items: requestBody.items,
      });
      
      // إنشاء أمر إسناد
      const response = await fetch('/api/warehouse/assignments', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل إرسال الفاتورة للمخازن');
      }

      // تحديث حالة الفاتورة
      const updateResponse = await fetch(`/api/purchasing/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'assigned_to_warehouse' }),
      });

      if (!updateResponse.ok) {
        throw new Error('فشل تحديث حالة الفاتورة');
      }

      const data = await updateResponse.json();
      setInvoice(data.invoice);
      toast.success('تم إرسال الفاتورة للمخازن بنجاح');
    } catch (error: any) {
      console.error('Error sending to warehouse:', error);
      toast.error(error?.message || 'فشل إرسال الفاتورة للمخازن');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="تفاصيل فاتورة المشتريات">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout title="تفاصيل فاتورة المشتريات">
        <div className="p-6">
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500">الفاتورة غير موجودة</p>
              <Link href="/financial-management/purchasing">
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

  const canEdit = invoice.status === 'draft';
  const canChangeStatus = ['draft', 'pending', 'pending_approval', 'approved'].includes(invoice.status);
  const canSendToPricing = ['draft', 'pending', 'pending_approval', 'approved', 'assigned_to_warehouse', 'received_in_warehouse'].includes(
    invoice.status
  );

  return (
    <DashboardLayout title="تفاصيل فاتورة المشتريات">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/financial-management/purchasing">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">فاتورة المشتريات #{invoice.invoice_number}</h1>
              <p className="text-gray-600 mt-1">تفاصيل الفاتورة والبنود</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn(statusColors[invoice.status], 'font-semibold text-base px-3 py-1')}>
              {statusLabels[invoice.status]}
            </Badge>
            {canEdit && (
              <Link href={`/financial-management/purchasing/invoices/${invoiceId}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  تعديل
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>بيانات الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">رقم الفاتورة</p>
                  <p className="font-semibold">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">تاريخ الفاتورة</p>
                  <p className="font-semibold">
                    {new Date(invoice.invoice_date).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">المورد</p>
                  <p className="font-semibold">{invoice.supplier_name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">المخزن</p>
                  <p className="font-semibold">{invoice.warehouse_name || `مخزن #${invoice.warehouse_id}`}</p>
                </div>
                {invoice.received_date && (
                  <div>
                    <p className="text-sm text-gray-600">تاريخ الاستلام</p>
                    <p className="font-semibold">
                      {new Date(invoice.received_date).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">إجمالي الفاتورة</p>
                  <p className="font-semibold text-lg text-blue-700">
                    {Number(invoice.total_amount).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                  </p>
                </div>
              </div>
              {invoice.notes && (
                <div>
                  <p className="text-sm text-gray-600">ملاحظات</p>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>إدارة الحالة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canChangeStatus && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">تغيير الحالة</label>
                  <div className="flex gap-2">
                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as PurchaseInvoiceStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">مسودة</SelectItem>
                        <SelectItem value="pending">قيد المراجعة</SelectItem>
                        <SelectItem value="pending_approval">بانتظار الاعتماد</SelectItem>
                        <SelectItem value="approved">معتمدة</SelectItem>
                        <SelectItem value="assigned_to_warehouse">مُسندة للمخازن</SelectItem>
                        <SelectItem value="received_in_warehouse">تم الاستلام بالمخزن</SelectItem>
                        <SelectItem value="cancelled">ملغاة</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleStatusUpdate} disabled={updating || newStatus === invoice.status}>
                      {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تحديث'}
                    </Button>
                  </div>
                </div>
              )}

              {canSendToPricing && (
                <Button onClick={handleSendToPricing} disabled={updating} className="w-full" variant="default">
                  <Send className="h-4 w-4 mr-2" />
                  {updating ? 'جاري الإرسال...' : 'إرسال لإدارة التسعير'}
                </Button>
              )}

              {['draft', 'pending', 'pending_approval', 'approved'].includes(invoice.status) && (
                <Button 
                  onClick={handleSendToWarehouse} 
                  disabled={updating} 
                  className="w-full" 
                  variant="outline"
                >
                  <Package className="h-4 w-4 mr-2" />
                  {updating ? 'جاري الإرسال...' : 'إرسال للمخازن'}
                </Button>
              )}

              {invoice.assigned_to_pricing_at && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">تم الإرسال للتسعير</p>
                  <p className="text-sm font-semibold">
                    {new Date(invoice.assigned_to_pricing_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}

              {invoice.priced_at && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">تم التسعير</p>
                  <p className="text-sm font-semibold">
                    {new Date(invoice.priced_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                معلومات الدفع
              </CardTitle>
              {((paymentInfo && paymentInfo.remaining_amount > 0) || (invoice && Number(invoice.total_amount) > 0)) && (
                <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      تسجيل دفعة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
                      <DialogDescription>
                        قم بإدخال تفاصيل الدفعة لتسجيلها في النظام
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">مبلغ الدفعة *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={paymentInfo?.remaining_amount || (invoice ? Number(invoice.total_amount) : 0)}
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          placeholder={`الحد الأقصى: ${(paymentInfo?.remaining_amount || (invoice ? Number(invoice.total_amount) : 0)).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`}
                        />
                        {(paymentInfo?.remaining_amount || (invoice ? Number(invoice.total_amount) : 0)) > 0 && (
                          <p className="text-xs text-gray-500">
                            المبلغ المتبقي: {(paymentInfo?.remaining_amount || (invoice ? Number(invoice.total_amount) : 0)).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="payment_method">طريقة الدفع</Label>
                        <Select
                          value={paymentForm.payment_method}
                          onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">نقدي</SelectItem>
                            <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                            <SelectItem value="check">شيك</SelectItem>
                            <SelectItem value="credit">حساب ائتماني</SelectItem>
                            <SelectItem value="other">أخرى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="payment_reference">رقم المرجع (اختياري)</Label>
                        <Input
                          id="payment_reference"
                          value={paymentForm.payment_reference}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                          placeholder="رقم الشيك، رقم التحويل، إلخ"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="payment_date">تاريخ الدفعة</Label>
                        <Input
                          id="payment_date"
                          type="date"
                          value={paymentForm.payment_date}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="payment_notes">ملاحظات (اختياري)</Label>
                        <Textarea
                          id="payment_notes"
                          value={paymentForm.payment_notes}
                          onChange={(e) => setPaymentForm({ ...paymentForm, payment_notes: e.target.value })}
                          placeholder="أي ملاحظات إضافية حول الدفعة"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPaymentDialogOpen(false)}
                        disabled={recordingPayment}
                      >
                        إلغاء
                      </Button>
                      <Button
                        onClick={handleRecordPayment}
                        disabled={recordingPayment || !paymentForm.amount || Number(paymentForm.amount) <= 0}
                      >
                        {recordingPayment ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            جاري التسجيل...
                          </>
                        ) : (
                          'تسجيل الدفعة'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              // استخدام paymentInfo إذا كان موجوداً، وإلا استخدام بيانات الفاتورة
              const displayInfo = paymentInfo || (invoice ? {
                total_amount: Number(invoice.total_amount) || 0,
                paid_amount: 0,
                remaining_amount: Number(invoice.total_amount) || 0,
                payment_status: 'pending',
                payment_date: null,
                payment_method: null,
                payment_reference: null,
                payment_notes: null,
              } : null);

              if (!displayInfo) {
                return (
                  <div className="text-center py-4 text-gray-500">
                    <p>جاري تحميل معلومات الدفع...</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">إجمالي الفاتورة</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {displayInfo.total_amount.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">المبلغ المدفوع</p>
                      <p className="text-2xl font-bold text-green-700">
                        {displayInfo.paid_amount.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                      </p>
                    </div>
                    <div className={cn(
                      "p-4 rounded-lg",
                      displayInfo.remaining_amount > 0 ? "bg-orange-50" : "bg-gray-50"
                    )}>
                      <p className="text-sm text-gray-600 mb-1">المبلغ المتبقي</p>
                      <p className={cn(
                        "text-2xl font-bold",
                        displayInfo.remaining_amount > 0 ? "text-orange-700" : "text-gray-700"
                      )}>
                        {displayInfo.remaining_amount.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">حالة الدفع:</span>
                    <Badge
                      variant={
                        displayInfo.payment_status === 'paid' ? 'default' :
                        displayInfo.payment_status === 'partial' ? 'secondary' :
                        'outline'
                      }
                      className={
                        displayInfo.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        displayInfo.payment_status === 'partial' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {displayInfo.payment_status === 'paid' ? 'مدفوع بالكامل' :
                       displayInfo.payment_status === 'partial' ? 'دفع جزئي' :
                       'غير مدفوع'}
                    </Badge>
                  </div>
                  
                  {displayInfo.payment_date && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">تاريخ آخر دفعة:</span>{' '}
                      {new Date(displayInfo.payment_date).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                  
                  {displayInfo.payment_method && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">طريقة الدفع:</span>{' '}
                      {displayInfo.payment_method === 'cash' ? 'نقدي' :
                       displayInfo.payment_method === 'bank_transfer' ? 'تحويل بنكي' :
                       displayInfo.payment_method === 'check' ? 'شيك' :
                       displayInfo.payment_method === 'credit' ? 'حساب ائتماني' :
                       displayInfo.payment_method}
                    </div>
                  )}
                  
                  {displayInfo.payment_reference && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">رقم المرجع:</span> {displayInfo.payment_reference}
                    </div>
                  )}
                  
                  {displayInfo.payment_notes && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-600">ملاحظات:</span>
                      <p className="mt-1 bg-gray-50 p-3 rounded-lg">{displayInfo.payment_notes}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>بنود الفاتورة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>اسم المنتج</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>سعر الوحدة</TableHead>
                  <TableHead>الخصم</TableHead>
                  <TableHead className="text-left">الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      لا توجد بنود في هذه الفاتورة
                    </TableCell>
                  </TableRow>
                ) : (
                  invoice.items.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{item.sku || '—'}</TableCell>
                      <TableCell>{item.name || '—'}</TableCell>
                      <TableCell>{item.quantity.toLocaleString('ar-EG')}</TableCell>
                      <TableCell>{item.measurement_unit || 'قطعة'}</TableCell>
                      <TableCell>{Number(item.unit_price).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م</TableCell>
                      <TableCell>
                        {item.discount_value && item.discount_value > 0
                          ? Number(item.discount_value).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ج.م'
                          : '—'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {Number(item.total_price).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {invoice.items.length > 0 && (
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell colSpan={7} className="text-right">
                      إجمالي الفاتورة:
                    </TableCell>
                    <TableCell className="text-lg text-blue-700">
                      {Number(invoice.total_amount).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
