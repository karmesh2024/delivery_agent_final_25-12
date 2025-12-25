'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { PurchaseInvoiceForm } from '@/domains/purchasing/components/PurchaseInvoiceForm';
import { PurchaseInvoice } from '@/domains/purchasing/types';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditPurchaseInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/purchasing/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error('فشل تحميل الفاتورة');
      }
      const data = await response.json();
      
      if (data.invoice.status !== 'draft') {
        toast.error('يمكن تعديل الفاتورة فقط في حالة المسودة');
        router.push(`/financial-management/purchasing/invoices/${invoiceId}`);
        return;
      }
      
      setInvoice(data.invoice);
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      toast.error('فشل تحميل الفاتورة');
      router.push('/financial-management/purchasing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="تعديل فاتورة المشتريات">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout title="تعديل فاتورة المشتريات">
        <div className="p-6">
          <div className="text-center py-10 text-gray-500">الفاتورة غير موجودة</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`تعديل فاتورة المشتريات #${invoice.invoice_number}`}>
      <div className="p-6">
        <PurchaseInvoiceForm invoiceId={invoiceId} initialData={invoice} />
      </div>
    </DashboardLayout>
  );
}

