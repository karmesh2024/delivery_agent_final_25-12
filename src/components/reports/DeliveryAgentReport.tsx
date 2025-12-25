import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWallets } from '@/domains/payments/store/paymentsDashboardSlice';
import { WalletWithUserDetails, WalletType } from '@/domains/payments/types/paymentTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';

const DeliveryAgentReport: React.FC = () => {
  const dispatch = useAppDispatch();
  const { wallets, walletsStatus, walletsError } = useAppSelector((state) => state.paymentsDashboard);

  useEffect(() => {
    dispatch(fetchWallets({ 
      page: 1, 
      limit: 1000, 
      filters: { wallet_type: WalletType.DELIVERY_AGENT } 
    }));
  }, [dispatch]);

  const deliveryAgentWallets = useMemo(() => {
    return wallets.filter(wallet => wallet.wallet_type === WalletType.DELIVERY_AGENT);
  }, [wallets]);

  const summaryStats = useMemo(() => {
    const totalAgents = deliveryAgentWallets.length;
    const totalCashOnHand = deliveryAgentWallets.reduce((sum, wallet) => sum + (wallet.cash_on_hand || 0), 0);
    const totalCollectedMaterials = deliveryAgentWallets.reduce((sum, wallet) => sum + (wallet.collected_materials_value || 0), 0);
    return { totalAgents, totalCashOnHand, totalCollectedMaterials };
  }, [deliveryAgentWallets]);

  if (walletsStatus === 'loading') {
    return <p className="text-center p-8">جاري تحميل بيانات المناديب...</p>;
  }

  if (walletsStatus === 'failed') {
    return <p className="text-center p-8 text-red-600">حدث خطأ أثناء تحميل البيانات: {walletsError}</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">تقرير تسوية حسابات المناديب</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-md font-medium text-gray-600 dark:text-gray-400">إجمالي عدد المناديب</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{summaryStats.totalAgents}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-md font-medium text-gray-600 dark:text-gray-400">إجمالي العهدة النقدية</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summaryStats.totalCashOnHand)}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-md font-medium text-gray-600 dark:text-gray-400">إجمالي قيمة المواد المجمعة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(summaryStats.totalCollectedMaterials)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-700 dark:text-gray-300">تفاصيل محافظ المناديب</CardTitle>
        </CardHeader>
        <CardContent>
          {deliveryAgentWallets.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">لا توجد بيانات لعرضها.</p>
          ) : (
            <div className="space-y-4">
              {deliveryAgentWallets.map((wallet) => (
                <Card key={wallet.id} className="dark:bg-gray-700/50 p-4">
                  <CardHeader className="p-0 mb-2">
                     <CardTitle className="text-lg dark:text-gray-200">{wallet.auth_users?.full_name || wallet.user_id}</CardTitle>
                     <CardDescription className="text-xs dark:text-gray-400">معرف المحفظة: {wallet.id}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 text-sm dark:text-gray-300">
                    <p>الرصيد الحالي: {formatCurrency(wallet.balance)}</p>
                    <p>العهدة النقدية: {formatCurrency(wallet.cash_on_hand || 0)}</p>
                    <p>قيمة المواد المجمعة: {formatCurrency(wallet.collected_materials_value || 0)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryAgentReport; 