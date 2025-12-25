"use client";

import React, { useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchTransactionTrends } from '@/domains/payments/store/paymentsDashboardSlice';
import { RootState } from '@/store';

// Dummy data for transaction trends - replace with actual data fetching
// const transactionTrendData = [
//   { name: 'يناير', transactions: 4000, revenue: 2400 },
//   { name: 'فبراير', transactions: 3000, revenue: 1398 },
//   { name: 'مارس', transactions: 2000, revenue: 9800 },
//   { name: 'أبريل', transactions: 2780, revenue: 3908 },
//   { name: 'مايو', transactions: 1890, revenue: 4800 },
//   { name: 'يونيو', transactions: 2390, revenue: 3800 },
//   { name: 'يوليو', transactions: 3490, revenue: 4300 },
// ];

export const TransactionCharts: React.FC = () => {
  const dispatch = useAppDispatch();
  const { transactionTrends, status, error } = useAppSelector(
    (state: RootState) => state.paymentsDashboard
  );

  useEffect(() => {
    dispatch(fetchTransactionTrends({ period: 'last_30_days' }));
  }, [dispatch]);

  if (status === 'loading') {
    return <div className="p-6 bg-white rounded-lg shadow-md text-center">جار تحميل بيانات الاتجاهات...</div>;
  }

  if (error) {
    return <div className="p-6 bg-white rounded-lg shadow-md text-center text-red-500">خطأ في تحميل بيانات الاتجاهات: {error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 text-right">اتجاهات المعاملات</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={transactionTrends}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" reversed={true} />
          <YAxis yAxisId="left" orientation="right" label={{ value: 'عدد المعاملات', angle: -90, position: 'insideRight' }} />
          <YAxis yAxisId="right" orientation="left" label={{ value: 'الإيرادات (ج.م)', angle: 90, position: 'insideLeft' }} />
          <Tooltip formatter={(value, name, props) => {
            if (props.dataKey === "revenue") {
              return [`${(value as number).toLocaleString()} ج.م`, name];
            }
            return [value, name];
          }} />
          <Legend formatter={(value) => <span className="text-gray-700">{value}</span>} />
          <Line yAxisId="left" type="monotone" dataKey="transactions" stroke="#3498db" activeDot={{ r: 8 }} name="عدد المعاملات" />
          <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#2ecc71" name="الإيرادات" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 