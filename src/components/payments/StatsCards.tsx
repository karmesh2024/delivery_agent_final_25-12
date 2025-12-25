"use client"; // Required for hooks like useEffect, useAppDispatch, useAppSelector

import React, { useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiActivity, FiCheckCircle, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboardStats } from '@/domains/payments/store/paymentsDashboardSlice';
import { RootState } from '@/store';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  bgColor?: string;
  textColor?: string;
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, bgColor = 'bg-blue-500', textColor = 'text-white', isLoading }) => {
  return (
    <div className={`p-6 rounded-lg shadow-lg ${bgColor} ${textColor} min-h-[120px]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider">{title}</p>
          {isLoading ? (
            <FiLoader className="animate-spin h-8 w-8 mt-1" />
          ) : (
            <p className="text-3xl font-bold">{value}</p>
          )}
        </div>
        {!isLoading && <div className="p-3 bg-black bg-opacity-20 rounded-full">
          <Icon className="w-6 h-6" />
        </div>}
      </div>
    </div>
  );
};

export const PaymentsStats: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, statsStatus, statsError } = useAppSelector((state: RootState) => state.paymentsDashboard);

  useEffect(() => {
    if (statsStatus === 'idle') {
      dispatch(fetchDashboardStats({ adminId: 'temp-admin-id' })); // Pass adminId here
    }
  }, [statsStatus, dispatch]);

  if (statsStatus === 'loading' && !stats) { // Show loading state for all cards if stats is null initially
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="إجمالي الإيرادات" value="" icon={FiDollarSign} bgColor="bg-green-500" isLoading={true} />
        <StatsCard title="طلبات سحب معلقة" value="" icon={FiActivity} bgColor="bg-yellow-500" isLoading={true} />
        <StatsCard title="معاملات ناجحة" value="" icon={FiCheckCircle} bgColor="bg-blue-500" isLoading={true} />
        <StatsCard title="المحافظ النشطة" value="" icon={FiTrendingUp} bgColor="bg-purple-500" isLoading={true} />
      </div>
    );
  }

  if (statsStatus === 'failed') {
    return (
      <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <FiAlertTriangle className="inline w-5 h-5 mr-2" />
        <strong className="font-bold">خطأ!</strong>
        <span className="block sm:inline"> فشل في تحميل إحصائيات لوحة التحكم: {statsError}</span>
      </div>
    );
  }
  
  // Even if loading, if stats is already populated, show data with individual loading indicators if needed or just show current data.
  // For simplicity, we'll show current data if available, or empty if not yet loaded and not in initial full loading state.
  const isLoadingStats = statsStatus === 'loading';

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard 
        title="إجمالي الإيرادات"
        value={stats ? `${stats.totalRevenue.toLocaleString()} ج.م` : '...'}
        icon={FiDollarSign} 
        bgColor="bg-green-500" 
        isLoading={isLoadingStats && typeof stats?.totalRevenue !== 'number'}
      />
      <StatsCard 
        title="طلبات سحب معلقة"
        value={stats ? stats.pendingPayoutsCount : '...'}
        icon={FiActivity} 
        bgColor="bg-yellow-500" 
        isLoading={isLoadingStats && !stats?.pendingPayoutsCount}
      />
      <StatsCard 
        title="معاملات ناجحة"
        value={stats ? stats.successfulTransactionsCount.toLocaleString() : '...'}
        icon={FiCheckCircle} 
        bgColor="bg-blue-500" 
        isLoading={isLoadingStats && !stats?.successfulTransactionsCount}
      />
      <StatsCard 
        title="المحافظ النشطة"
        value={stats ? stats.activeWalletsCount.toLocaleString() : '...'}
        icon={FiTrendingUp} 
        bgColor="bg-purple-500" 
        isLoading={isLoadingStats && !stats?.activeWalletsCount}
      />
    </div>
  );
}; 