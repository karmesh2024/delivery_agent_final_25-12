import React from 'react';

export default function OrderTrackingPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">تتبع الطلبات</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">هذه الصفحة مخصصة لتتبع حالة الطلبات الحالية.</p>
        <div className="mt-4 p-4 border border-blue-100 bg-blue-50 rounded text-blue-800">
          جاري جلب بيانات التتبع...
        </div>
      </div>
    </div>
  );
}
