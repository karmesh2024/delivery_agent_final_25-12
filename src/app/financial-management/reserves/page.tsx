'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { Loader2 } from "lucide-react";

interface FinancialReserves {
  id: number;
  date: string;
  total_wallet_balance: number;
  pending_withdrawals: number;
  pending_sessions: number;
  total_liabilities: number;
  cash_on_hand: number;
  waste_inventory_value: number;
  accounts_receivable: number;
  total_assets: number;
  coverage_ratio: number;
  liquidity_ratio: number;
  daily_revenue: number;
  daily_profit: number;
}

export default function ReservesPage() {
  const [reserves, setReserves] = useState<FinancialReserves | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  const fetchReserves = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/reserves');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'فشل جلب الاحتياطيات');
      }
      
      setReserves(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateReserves = async () => {
    try {
      setCalculating(true);
      setError(null);
      
      const response = await fetch('/api/admin/reserves?action=calculate', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'فشل حساب الاحتياطيات');
      }
      
      setReserves(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    fetchReserves();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="الاحتياطيات المالية">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !reserves) {
    return (
      <DashboardLayout title="الاحتياطيات المالية">
        <div className="p-6">
          <Alert variant="destructive">
            <FiAlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchReserves} className="mt-4">
            إعادة المحاولة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const coverageStatus = reserves?.coverage_ratio 
    ? reserves.coverage_ratio >= 100 
      ? 'safe' 
      : reserves.coverage_ratio >= 80 
        ? 'warning' 
        : 'danger'
    : 'unknown';

  return (
    <DashboardLayout title="الاحتياطيات المالية">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">الاحتياطيات المالية</h1>
            <p className="text-gray-600 mt-2">
              آخر تحديث: {reserves?.date ? new Date(reserves.date).toLocaleDateString('ar-EG') : 'غير متاح'}
            </p>
          </div>
          <Button 
            onClick={calculateReserves} 
            disabled={calculating}
            variant="outline"
          >
            {calculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري الحساب...
              </>
            ) : (
              <>
                <FiRefreshCw className="mr-2 h-4 w-4" />
                حساب الاحتياطيات
              </>
            )}
          </Button>
        </div>

        {/* Alert إذا كانت نسبة التغطية منخفضة */}
        {coverageStatus === 'danger' && (
          <Alert variant="destructive">
            <FiAlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ تحذير: نسبة التغطية منخفضة ({reserves?.coverage_ratio.toFixed(2)}%). 
              الأصول غير كافية لتغطية الالتزامات.
            </AlertDescription>
          </Alert>
        )}

        {coverageStatus === 'warning' && (
          <Alert>
            <FiAlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ تحذير: نسبة التغطية أقل من 100% ({reserves?.coverage_ratio.toFixed(2)}%). 
              يُنصح بزيادة الأصول.
            </AlertDescription>
          </Alert>
        )}

        {/* الالتزامات */}
        <div>
          <h2 className="text-xl font-semibold mb-4">الالتزامات (Liabilities)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  إجمالي محافظ العملاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reserves?.total_wallet_balance.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  طلبات سحب معلقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reserves?.pending_withdrawals.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  جلسات معلقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reserves?.pending_sessions.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700">
                  إجمالي الالتزامات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">
                  {reserves?.total_liabilities.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* الأصول */}
        <div>
          <h2 className="text-xl font-semibold mb-4">الأصول (Assets)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  السيولة النقدية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reserves?.cash_on_hand.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  قيمة المخزون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reserves?.waste_inventory_value.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  المستحقات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reserves?.accounts_receivable.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700">
                  إجمالي الأصول
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {reserves?.total_assets.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* النسب المالية */}
        <div>
          <h2 className="text-xl font-semibold mb-4">النسب المالية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={coverageStatus === 'safe' ? 'bg-green-50' : coverageStatus === 'warning' ? 'bg-yellow-50' : 'bg-red-50'}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {coverageStatus === 'safe' ? (
                    <FiTrendingUp className="mr-2 text-green-600" />
                  ) : coverageStatus === 'warning' ? (
                    <FiAlertTriangle className="mr-2 text-yellow-600" />
                  ) : (
                    <FiTrendingDown className="mr-2 text-red-600" />
                  )}
                  نسبة التغطية
                </CardTitle>
                <CardDescription>
                  (الأصول / الالتزامات) × 100
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${
                  coverageStatus === 'safe' ? 'text-green-700' : 
                  coverageStatus === 'warning' ? 'text-yellow-700' : 
                  'text-red-700'
                }`}>
                  {reserves?.coverage_ratio.toFixed(2)}%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {coverageStatus === 'safe' 
                    ? '✅ الأصول كافية لتغطية الالتزامات'
                    : coverageStatus === 'warning'
                    ? '⚠️ الأصول أقل من الالتزامات'
                    : '🔴 الأصول غير كافية'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FiDollarSign className="mr-2 text-blue-600" />
                  نسبة السيولة
                </CardTitle>
                <CardDescription>
                  (النقد / الالتزامات) × 100
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">
                  {reserves?.liquidity_ratio.toFixed(2)}%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  نسبة السيولة النقدية المتاحة
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* الربحية اليومية */}
        <div>
          <h2 className="text-xl font-semibold mb-4">الربحية اليومية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  الإيرادات اليومية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reserves?.daily_revenue.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-green-700">
                  الربح اليومي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {reserves?.daily_profit.toLocaleString('ar-EG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
