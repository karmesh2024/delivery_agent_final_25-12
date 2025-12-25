'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserOrders } from '../store/storeOrdersSlice';
import { useEffect } from 'react';

export default function UserOrdersTab() {
  const dispatch = useAppDispatch();
  const { orders, loading, error, filters } = useAppSelector(
    (state) => state.storeOrders
  );

  useEffect(() => {
    dispatch(fetchUserOrders(filters));
  }, [dispatch, filters.status]);

  if (loading === 'pending') {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-8 text-center text-gray-500 border rounded-lg">
        <p className="text-lg font-medium mb-2">إدارة طلبات المستخدمين</p>
        <p className="text-sm">
          سيتم تطوير هذه الوظيفة قريباً. حالياً يمكنك إدارة طلبات الوكلاء
          المعتمدين من التاب الأول.
        </p>
        {orders.length > 0 && (
          <p className="text-sm mt-4">
            عدد الطلبات: {orders.length}
          </p>
        )}
      </div>
    </div>
  );
}

