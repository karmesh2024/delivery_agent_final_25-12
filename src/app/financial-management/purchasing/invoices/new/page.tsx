'use client';

import React from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { PurchaseInvoiceForm } from '@/domains/purchasing/components/PurchaseInvoiceForm';

export default function NewPurchasingInvoicePage() {
  return (
    <DashboardLayout title="إنشاء فاتورة مشتريات">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">فاتورة مشتريات جديدة</h1>
          <p className="text-gray-600">
            قم بإدخال بيانات فاتورة المورد ومراجعة البنود قبل إرسالها إلى التسعير.
          </p>
        </div>
        <PurchaseInvoiceForm />
      </div>
    </DashboardLayout>
  );
}


