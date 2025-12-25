import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWallets } from '@/domains/payments/store/paymentsDashboardSlice';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartData,
  ChartOptions,
  TooltipItem,
} from 'chart.js';
// WalletType and WalletStatus are part of the Wallet interface, not separate exports
import { translateWalletType, translateWalletStatus } from '@/services/paymentsService';
// import { WalletWithUserDetails } from '@/domains/payments/types/paymentTypes'; // Not directly used here
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import FilteredWalletTransactionsTable from './FilteredWalletTransactionsTable';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// Common Tooltip Options (can be shared or adapted from WalletStats if needed)
const commonReportTooltipOptions = {
  rtl: true,
  bodyFont: {
    family: 'Cairo, sans-serif',
    size: 13,
  },
  titleFont: {
    family: 'Cairo, sans-serif',
    size: 14,
    weight: 'bold' as const,
  },
  padding: 10,
  cornerRadius: 4,
  displayColors: true,
  borderColor: 'rgba(0,0,0,0.1)',
  borderWidth: 1,
  callbacks: {}, // Basic callbacks, to be overridden per chart
};

// Define filter types locally for clarity within this component, aligning with service expectations
interface ReportFilters {
  wallet_type?: string; 
  status?: string;      
  startDate?: string;
  endDate?: string;
}

const WalletBalancesReport = () => {
  const dispatch = useAppDispatch();
  const { wallets, walletsStatus } = useAppSelector((state) => state.paymentsDashboard);

  const [selectedWalletType, setSelectedWalletType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isChartsExpanded, setIsChartsExpanded] = useState(false);
  const [expandedTransactionType, setExpandedTransactionType] = useState<string | null>(null);

  const toggleTransactionsDisplay = (walletType: string) => {
    setExpandedTransactionType(prev => prev === walletType ? null : walletType);
    // Here, you would typically dispatch an action to fetch transactions for this walletType if not already loaded
    // For now, we'll just toggle visibility
  };

  useEffect(() => {
    const filters: ReportFilters = {}; 
    if (selectedWalletType) filters.wallet_type = selectedWalletType;
    if (selectedStatus) filters.status = selectedStatus;
    if (startDate) filters.startDate = startDate.toISOString().split('T')[0];
    if (endDate) {
      const adjustedEndDate = new Date(endDate);
      filters.endDate = adjustedEndDate.toISOString().split('T')[0];
    }
    
    dispatch(fetchWallets({ page: 1, limit: 1000, filters, searchQuery: '' }));
  }, [dispatch, selectedWalletType, selectedStatus, startDate, endDate]);

  const isLoading = walletsStatus === 'loading' || walletsStatus === 'idle';

  // --- Calculations ---
  const totalWalletsCount = wallets.length;
  const totalBalanceAllWallets = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
  const averageBalance = totalWalletsCount > 0 ? totalBalanceAllWallets / totalWalletsCount : 0;

  const customerWallets = wallets.filter(w => w.wallet_type === 'CUSTOMER_HOME');
  const customerWalletsCount = customerWallets.length;
  const customerWalletsTotalBalance = customerWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

  const driverWallets = wallets.filter(w => w.wallet_type === 'DELIVERY_BOY');
  const driverWalletsCount = driverWallets.length;
  const driverWalletsTotalBalance = driverWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
  // Display 0 for these fields until their reliable retrieval is confirmed
  const driverTotalCashOnHand = driverWallets.reduce((sum, wallet) => sum + (wallet.cash_on_hand || 0), 0); // Assuming it might come as undefined/null
  const driverTotalCollectedMaterials = driverWallets.reduce((sum, wallet) => sum + (wallet.collected_materials_value || 0), 0); // Assuming it might come as undefined/null


  const agentWallets = wallets.filter(w => w.wallet_type === 'AGENT');
  const agentWalletsCount = agentWallets.length;
  const agentWalletsTotalBalance = agentWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

  const companyWallets = wallets.filter(w => w.wallet_type === 'COMPANY');
  const companyWalletsCount = companyWallets.length;
  const companyWalletsTotalBalance = companyWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

  const systemFloatWallets = wallets.filter(w => w.wallet_type === 'SYSTEM_FLOAT');
  const systemFloatWalletsCount = systemFloatWallets.length;
  const systemFloatWalletsTotalBalance = systemFloatWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

  const systemRevenueWallets = wallets.filter(w => w.wallet_type === 'SYSTEM_REVENUE');
  const systemRevenueWalletsCount = systemRevenueWallets.length;
  const systemRevenueWalletsTotalBalance = systemRevenueWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

  const systemFeesWallets = wallets.filter(w => w.wallet_type === 'SYSTEM_FEES');
  const systemFeesWalletsCount = systemFeesWallets.length;
  const systemFeesWalletsTotalBalance = systemFeesWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

  // --- Chart Data Calculations ---

  const calculateWalletTypeDistributionForReport = (): ChartData<'doughnut', number[], string> | null => {
    if (!wallets || wallets.length === 0) return null;

    const typeCounts: { [key: string]: number } = {};
    wallets.forEach(wallet => {
      typeCounts[wallet.wallet_type] = (typeCounts[wallet.wallet_type] || 0) + 1;
    });

    const labels = Object.keys(typeCounts).map(type => translateWalletType(type));
    const data = Object.values(typeCounts);

    return {
      labels,
      datasets: [
        {
          label: 'توزيع المحافظ حسب النوع',
          data,
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',   // Blue
            'rgba(255, 99, 132, 0.8)',   // Red
            'rgba(255, 206, 86, 0.8)',  // Yellow
            'rgba(75, 192, 192, 0.8)',  // Green
            'rgba(153, 102, 255, 0.8)', // Purple
            'rgba(255, 159, 64, 0.8)',  // Orange
            'rgba(100, 100, 100, 0.8)', // Grey
            'rgba(200, 50, 50, 0.8)',   // Dark Red
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(100, 100, 100, 1)',
            'rgba(200, 50, 50, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const calculateWalletStatusDistributionForReport = (): ChartData<'bar', number[], string> | null => {
    if (!wallets || wallets.length === 0) return null;

    const statusCounts: { [key: string]: number } = {};
    wallets.forEach(wallet => {
      statusCounts[wallet.status] = (statusCounts[wallet.status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts).map(status => translateWalletStatus(status));
    const data = Object.values(statusCounts);
    
    return {
      labels,
      datasets: [
        {
          label: 'عدد المحافظ',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  const calculateBalanceDistributionByTypeForReport = (): ChartData<'bar', number[], string> | null => {
    if (!wallets || wallets.length === 0) return null;

    const typeBalances: { [key: string]: number } = {};
    wallets.forEach(wallet => {
      typeBalances[wallet.wallet_type] = (typeBalances[wallet.wallet_type] || 0) + (wallet.balance || 0);
    });
    
    const labels = Object.keys(typeBalances).map(type => translateWalletType(type));
    const data = Object.values(typeBalances);

    return {
      labels,
      datasets: [
        {
          label: 'إجمالي الرصيد',
          data,
          backgroundColor: 'rgba(255, 159, 64, 0.7)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
        }
      ]
    }
  };


  const doughnutData = calculateWalletTypeDistributionForReport();
  const statusBarData = calculateWalletStatusDistributionForReport();
  const balanceByTypeBarData = calculateBalanceDistributionByTypeForReport();

  // --- Chart Options ---
  const doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        rtl: true,
        labels: { font: { family: 'Cairo, sans-serif', size: 13 }, usePointStyle: true, boxWidth: 10, padding: 15 },
      },
      title: { display: true, text: 'توزيع المحافظ حسب النوع (تقرير)', font: { family: 'Cairo, sans-serif', size: 16, weight: 'bold' as const }, padding: { top: 10, bottom: 15 } },
      tooltip: {
        ...commonReportTooltipOptions,
        callbacks: {
          label: (context: TooltipItem<'doughnut'>) => {
            const label = context.chart.data.labels?.[context.dataIndex] || '';
            const value = context.parsed;
            const total = context.chart.data.datasets[0].data.reduce((a, b) => (a as number) + (b as number), 0) as number;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    animation: { animateScale: true, animateRotate: true },
  };

  const barChartOptionsStatus: ChartOptions<'bar'> = {
    indexAxis: 'y' as const, // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'عدد المحافظ', font: { family: 'Cairo, sans-serif', size: 12 } }, ticks: { font: { family: 'Cairo, sans-serif', size: 11 }, stepSize: 1 }, grid: { display: true, color: 'rgba(0,0,0,0.05)'} },
      y: { ticks: { font: { family: 'Cairo, sans-serif', size: 12 } }, grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'توزيع المحافظ حسب الحالة (تقرير)', font: { family: 'Cairo, sans-serif', size: 16, weight: 'bold' as const }, padding: { top: 10, bottom: 15 } },
      tooltip: {
        ...commonReportTooltipOptions,
        callbacks: {
          title: (tooltipItems: TooltipItem<'bar'>[]) => tooltipItems[0].label || '',
          label: (context: TooltipItem<'bar'>) => `${context.dataset.label || ''}: ${context.parsed.x}`,
        },
      },
    },
    elements: { bar: { borderRadius: 4 } }
  };
  
  const barChartOptionsBalanceType: ChartOptions<'bar'> = {
    indexAxis: 'y' as const, // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'إجمالي الرصيد (ج.م)', font: { family: 'Cairo, sans-serif', size: 12 } }, ticks: { font: { family: 'Cairo, sans-serif', size: 11 }, callback: value => `${Number(value).toLocaleString('ar-EG')}` }, grid: { display: true, color: 'rgba(0,0,0,0.05)'} },
      y: { ticks: { font: { family: 'Cairo, sans-serif', size: 12 } }, grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'توزيع الأرصدة حسب نوع المحفظة (تقرير)', font: { family: 'Cairo, sans-serif', size: 16, weight: 'bold' as const }, padding: { top: 10, bottom: 15 } },
      tooltip: {
        ...commonReportTooltipOptions,
        callbacks: {
          title: (tooltipItems: TooltipItem<'bar'>[]) => tooltipItems[0].label || '',
          label: (context: TooltipItem<'bar'>) => `${context.dataset.label || ''}: ${Number(context.parsed.x).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}`,
        },
      },
    },
    elements: { bar: { borderRadius: 4 } }
  };

  if (isLoading && wallets.length === 0) { // Show loading only if no data is present yet
    return <div className="p-6 text-center">جارٍ تحميل بيانات التقرير...</div>;
  }
  
  if (walletsStatus === 'failed') {
    return <div className="p-6 text-center text-red-500">فشل تحميل بيانات المحافظ.</div>;
  }

  // Wallet type options (should match WalletType definition)
  const walletTypeOptions: { value: string; label: string }[] = [
    { value: '', label: 'الكل' },
    { value: 'CUSTOMER_HOME', label: translateWalletType('CUSTOMER_HOME') },
    { value: 'DELIVERY_BOY', label: translateWalletType('DELIVERY_BOY') },
    { value: 'AGENT', label: translateWalletType('AGENT') },
    { value: 'COMPANY', label: translateWalletType('COMPANY') },
    { value: 'SYSTEM_FLOAT', label: translateWalletType('SYSTEM_FLOAT') },
    { value: 'SYSTEM_REVENUE', label: translateWalletType('SYSTEM_REVENUE') },
    { value: 'SYSTEM_FEES', label: translateWalletType('SYSTEM_FEES') },
    // Add other types if needed
  ];

  // Wallet status options (should match WalletStatus definition)
  const walletStatusOptions: { value: string; label: string }[] = [
    { value: '', label: 'الكل' },
    { value: 'ACTIVE', label: translateWalletStatus('ACTIVE') },
    { value: 'INACTIVE', label: translateWalletStatus('INACTIVE') },
    { value: 'SUSPENDED', label: translateWalletStatus('SUSPENDED') },
    { value: 'CLOSED', label: translateWalletStatus('CLOSED') },
    // Add other statuses if relevant for filtering balances
  ];

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow-md" dir="rtl">
      <h3 className="text-xl font-semibold text-gray-700 mb-6 border-b pb-2">تقرير أرصدة وحركات المحافظ</h3>
      
      {/* Filters Section */}
      <div className="p-4 border rounded-lg mb-6 bg-gray-50">
        <h4 className="text-md font-semibold text-gray-600 mb-3">الفلاتر</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="walletTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">نوع المحفظة</label>
            <select
              id="walletTypeFilter"
              value={selectedWalletType}
              onChange={(e) => setSelectedWalletType(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {walletTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">حالة المحفظة</label>
            <select
              id="statusFilter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {walletStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <DatePicker 
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="yyyy/MM/dd"
              placeholderText="اختر تاريخ البدء"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              wrapperClassName="w-full"
              isClearable
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate || undefined}
              dateFormat="yyyy/MM/dd"
              placeholderText="اختر تاريخ الانتهاء"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              wrapperClassName="w-full"
              isClearable
            />
          </div>
        </div>
      </div>
      
      {isLoading && wallets.length > 0 && (
        <div className="text-center p-4 text-sm text-gray-500">جارٍ تحديث البيانات بناءً على الفلاتر...</div>
      )}

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">إجمالي عدد المحافظ <span className="text-xs text-blue-500">(حسب الفلتر)</span></h4>
          <p className="text-2xl font-bold text-gray-800">{totalWalletsCount}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">إجمالي الرصيد الكلي <span className="text-xs text-blue-500">(حسب الفلتر)</span></h4>
          <p className="text-2xl font-bold text-gray-800">{totalBalanceAllWallets.toLocaleString('ar-EG')} ج.م</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">متوسط الرصيد <span className="text-xs text-blue-500">(حسب الفلتر)</span></h4>
          <p className="text-2xl font-bold text-gray-800">{averageBalance.toLocaleString('ar-EG', {maximumFractionDigits: 2})} ج.م</p>
        </div>
      </div>

      {/* Detailed Breakdown Section */}
      <div className="space-y-4">
        {wallets.length === 0 && !isLoading && (
          <div className="p-4 border rounded-lg text-center text-gray-500">
            لا توجد محافظ لعرضها تطابق شروط الفلترة الحالية.
          </div>
        )}
        {customerWalletsCount > 0 && (
            <div className="p-4 border rounded-lg">
            <h4 className="text-md font-semibold text-gray-600 mb-2">محافظ العملاء (CUSTOMER_HOME)</h4>
            <p className="text-sm text-gray-700">العدد: <span className="font-semibold">{customerWalletsCount}</span></p>
            <p className="text-sm text-gray-700">إجمالي الرصيد: <span className="font-semibold">{customerWalletsTotalBalance.toLocaleString('ar-EG')} ج.م</span></p>
            <button 
              onClick={() => toggleTransactionsDisplay('CUSTOMER_HOME')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
            >
              {expandedTransactionType === 'CUSTOMER_HOME' ? <ChevronUpIcon className="h-4 w-4 rtl:ml-1" /> : <ChevronDownIcon className="h-4 w-4 rtl:ml-1" />}
              {expandedTransactionType === 'CUSTOMER_HOME' ? 'إخفاء الحركات' : 'عرض الحركات'}
            </button>
            {expandedTransactionType === 'CUSTOMER_HOME' && (
              <div className="mt-3 p-3 border-t border-gray-200">
                <FilteredWalletTransactionsTable 
                  walletIds={customerWallets.map(w => w.id)}
                  walletTypeLabel="محافظ العملاء"
                  filters={{ startDate: startDate?.toISOString().split('T')[0], endDate: endDate?.toISOString().split('T')[0] }}
                  isVisible={expandedTransactionType === 'CUSTOMER_HOME'}
                />
              </div>
            )}
            </div>
        )}

        {/* Driver Wallets */}
        {driverWalletsCount > 0 && (
            <div className="p-4 border rounded-lg">
            <h4 className="text-md font-semibold text-gray-600 mb-2">محافظ المناديب (DELIVERY_BOY)</h4>
            <p className="text-sm text-gray-700">العدد: <span className="font-semibold">{driverWalletsCount}</span></p>
            <p className="text-sm text-gray-700">إجمالي الرصيد (العام): <span className="font-semibold">{driverWalletsTotalBalance.toLocaleString('ar-EG')} ج.م</span></p>
            <p className="text-sm text-gray-700">إجمالي العهدة النقدية: <span className="font-semibold">{driverTotalCashOnHand.toLocaleString('ar-EG')} ج.م</span></p>
            <p className="text-sm text-gray-700">إجمالي قيمة المواد المجمعة: <span className="font-semibold">{driverTotalCollectedMaterials.toLocaleString('ar-EG')} ج.م</span></p>
            <button 
              onClick={() => toggleTransactionsDisplay('DELIVERY_BOY')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
            >
              {expandedTransactionType === 'DELIVERY_BOY' ? <ChevronUpIcon className="h-4 w-4 rtl:ml-1" /> : <ChevronDownIcon className="h-4 w-4 rtl:ml-1" />}
              {expandedTransactionType === 'DELIVERY_BOY' ? 'إخفاء الحركات' : 'عرض الحركات'}
            </button>
            {expandedTransactionType === 'DELIVERY_BOY' && (
              <div className="mt-3 p-3 border-t border-gray-200">
                <FilteredWalletTransactionsTable 
                  walletIds={driverWallets.map(w => w.id)}
                  walletTypeLabel="محافظ المناديب"
                  filters={{ startDate: startDate?.toISOString().split('T')[0], endDate: endDate?.toISOString().split('T')[0] }}
                  isVisible={expandedTransactionType === 'DELIVERY_BOY'}
                />
              </div>
            )}
            </div>
        )}
        
        {/* Agent Wallets */}
        { agentWalletsCount > 0 && (
            <div className="p-4 border rounded-lg">
                <h4 className="text-md font-semibold text-gray-600 mb-2">محافظ الوكلاء (AGENT)</h4>
                <p className="text-sm text-gray-700">العدد: <span className="font-semibold">{agentWalletsCount}</span></p>
                <p className="text-sm text-gray-700">إجمالي الرصيد: <span className="font-semibold">{agentWalletsTotalBalance.toLocaleString('ar-EG')} ج.م</span></p>
                <button 
                  onClick={() => toggleTransactionsDisplay('AGENT')}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {expandedTransactionType === 'AGENT' ? <ChevronUpIcon className="h-4 w-4 rtl:ml-1" /> : <ChevronDownIcon className="h-4 w-4 rtl:ml-1" />}
                  {expandedTransactionType === 'AGENT' ? 'إخفاء الحركات' : 'عرض الحركات'}
                </button>
                {expandedTransactionType === 'AGENT' && (
                  <div className="mt-3 p-3 border-t border-gray-200">
                    <FilteredWalletTransactionsTable 
                      walletIds={agentWallets.map(w => w.id)}
                      walletTypeLabel="محافظ الوكلاء"
                      filters={{ startDate: startDate?.toISOString().split('T')[0], endDate: endDate?.toISOString().split('T')[0] }}
                      isVisible={expandedTransactionType === 'AGENT'}
                    />
                  </div>
                )}
            </div>
        )}

        {/* Company Wallets */}
        { companyWalletsCount > 0 && (
            <div className="p-4 border rounded-lg">
                <h4 className="text-md font-semibold text-gray-600 mb-2">محافظ الشركة (COMPANY)</h4>
                <p className="text-sm text-gray-700">العدد: <span className="font-semibold">{companyWalletsCount}</span></p>
                <p className="text-sm text-gray-700">إجمالي الرصيد: <span className="font-semibold">{companyWalletsTotalBalance.toLocaleString('ar-EG')} ج.م</span></p>
                <button 
                  onClick={() => toggleTransactionsDisplay('COMPANY')}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {expandedTransactionType === 'COMPANY' ? <ChevronUpIcon className="h-4 w-4 rtl:ml-1" /> : <ChevronDownIcon className="h-4 w-4 rtl:ml-1" />}
                  {expandedTransactionType === 'COMPANY' ? 'إخفاء الحركات' : 'عرض الحركات'}
                </button>
                {expandedTransactionType === 'COMPANY' && (
                  <div className="mt-3 p-3 border-t border-gray-200">
                    <FilteredWalletTransactionsTable 
                      walletIds={companyWallets.map(w => w.id)}
                      walletTypeLabel="محافظ الشركة"
                      filters={{ startDate: startDate?.toISOString().split('T')[0], endDate: endDate?.toISOString().split('T')[0] }}
                      isVisible={expandedTransactionType === 'COMPANY'}
                    />
                  </div>
                )}
            </div>
        )}

        {/* System Float Wallets */}
        { systemFloatWalletsCount > 0 && (
            <div className="p-4 border rounded-lg">
                <h4 className="text-md font-semibold text-gray-600 mb-2">محافظ سيولة النظام (SYSTEM_FLOAT)</h4>
                <p className="text-sm text-gray-700">العدد: <span className="font-semibold">{systemFloatWalletsCount}</span></p>
                <p className="text-sm text-gray-700">إجمالي الرصيد: <span className="font-semibold">{systemFloatWalletsTotalBalance.toLocaleString('ar-EG')} ج.م</span></p>
                <button 
                  onClick={() => toggleTransactionsDisplay('SYSTEM_FLOAT')}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {expandedTransactionType === 'SYSTEM_FLOAT' ? <ChevronUpIcon className="h-4 w-4 rtl:ml-1" /> : <ChevronDownIcon className="h-4 w-4 rtl:ml-1" />}
                  {expandedTransactionType === 'SYSTEM_FLOAT' ? 'إخفاء الحركات' : 'عرض الحركات'}
                </button>
                {expandedTransactionType === 'SYSTEM_FLOAT' && (
                  <div className="mt-3 p-3 border-t border-gray-200">
                    <FilteredWalletTransactionsTable 
                      walletIds={systemFloatWallets.map(w => w.id)}
                      walletTypeLabel="محافظ سيولة النظام"
                      filters={{ startDate: startDate?.toISOString().split('T')[0], endDate: endDate?.toISOString().split('T')[0] }}
                      isVisible={expandedTransactionType === 'SYSTEM_FLOAT'}
                    />
                  </div>
                )}
            </div>
        )}

        {/* System Revenue Wallets */}
        { systemRevenueWalletsCount > 0 && (
            <div className="p-4 border rounded-lg">
                <h4 className="text-md font-semibold text-gray-600 mb-2">محافظ إيرادات النظام (SYSTEM_REVENUE)</h4>
                <p className="text-sm text-gray-700">العدد: <span className="font-semibold">{systemRevenueWalletsCount}</span></p>
                <p className="text-sm text-gray-700">إجمالي الرصيد: <span className="font-semibold">{systemRevenueWalletsTotalBalance.toLocaleString('ar-EG')} ج.م</span></p>
                <button 
                  onClick={() => toggleTransactionsDisplay('SYSTEM_REVENUE')}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {expandedTransactionType === 'SYSTEM_REVENUE' ? <ChevronUpIcon className="h-4 w-4 rtl:ml-1" /> : <ChevronDownIcon className="h-4 w-4 rtl:ml-1" />}
                  {expandedTransactionType === 'SYSTEM_REVENUE' ? 'إخفاء الحركات' : 'عرض الحركات'}
                </button>
                {expandedTransactionType === 'SYSTEM_REVENUE' && (
                  <div className="mt-3 p-3 border-t border-gray-200">
                    <FilteredWalletTransactionsTable 
                      walletIds={systemRevenueWallets.map(w => w.id)}
                      walletTypeLabel="محافظ إيرادات النظام"
                      filters={{ startDate: startDate?.toISOString().split('T')[0], endDate: endDate?.toISOString().split('T')[0] }}
                      isVisible={expandedTransactionType === 'SYSTEM_REVENUE'}
                    />
                  </div>
                )}
            </div>
        )}

        {/* System Fees Wallets */}
        { systemFeesWalletsCount > 0 && (
            <div className="p-4 border rounded-lg">
                <h4 className="text-md font-semibold text-gray-600 mb-2">محافظ رسوم الخدمة (SYSTEM_FEES)</h4>
                <p className="text-sm text-gray-700">العدد: <span className="font-semibold">{systemFeesWalletsCount}</span></p>
                <p className="text-sm text-gray-700">إجمالي الرصيد: <span className="font-semibold">{systemFeesWalletsTotalBalance.toLocaleString('ar-EG')} ج.م</span></p>
                <button 
                  onClick={() => toggleTransactionsDisplay('SYSTEM_FEES')}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {expandedTransactionType === 'SYSTEM_FEES' ? <ChevronUpIcon className="h-4 w-4 rtl:ml-1" /> : <ChevronDownIcon className="h-4 w-4 rtl:ml-1" />}
                  {expandedTransactionType === 'SYSTEM_FEES' ? 'إخفاء الحركات' : 'عرض الحركات'}
                </button>
                {expandedTransactionType === 'SYSTEM_FEES' && (
                  <div className="mt-3 p-3 border-t border-gray-200">
                    <FilteredWalletTransactionsTable 
                      walletIds={systemFeesWallets.map(w => w.id)}
                      walletTypeLabel="محافظ رسوم الخدمة"
                      filters={{ startDate: startDate?.toISOString().split('T')[0], endDate: endDate?.toISOString().split('T')[0] }}
                      isVisible={expandedTransactionType === 'SYSTEM_FEES'}
                    />
                  </div>
                )}
            </div>
        )}
      </div>

      {/* Charts Section - Placeholder */}
      <div className="p-4 border rounded-lg mt-6">
        <div className="flex justify-between items-center mb-3 pb-2 border-b">
          <h4 className="text-md font-semibold text-gray-600">الرسوم البيانية <span className="text-xs text-blue-500">(حسب الفلتر)</span></h4>
          <button 
            onClick={() => setIsChartsExpanded(!isChartsExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            {isChartsExpanded ? (
              <ChevronUpIcon className="h-5 w-5 ltr:mr-1 rtl:ml-1" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 ltr:mr-1 rtl:ml-1" />
            )}
            {isChartsExpanded ? 'إخفاء الرسوم' : 'عرض الرسوم'}
          </button>
        </div>

        {isChartsExpanded && wallets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {doughnutData && (
              <div className="p-4 bg-gray-50 rounded-lg shadow h-80">
                <Doughnut data={doughnutData} options={doughnutChartOptions} />
              </div>
            )}
            {statusBarData && (
              <div className="p-4 bg-gray-50 rounded-lg shadow h-80">
                <Bar data={statusBarData} options={barChartOptionsStatus} />
              </div>
            )}
             {balanceByTypeBarData && (
              <div className="p-4 bg-gray-50 rounded-lg shadow h-80 md:col-span-2"> {/* Spans 2 cols on md for better layout */}
                <Bar data={balanceByTypeBarData} options={barChartOptionsBalanceType} />
              </div>
            )}
          </div>
        )}
        {isChartsExpanded && wallets.length === 0 && !isLoading && (
           <p className="text-sm text-gray-500 mt-2">لا توجد بيانات كافية لعرض الرسوم البيانية بناءً على الفلاتر الحالية.</p>
        )}
         {!isChartsExpanded && (
          <p className="text-sm text-gray-500 mt-2">انقر على "عرض الرسوم" لإظهار المخططات.</p>
        )}
      </div>

    </div>
  );
};

export default WalletBalancesReport; 

// Helper function to get wallet type display name - not used in this version but kept for reference
/*
const getWalletTypeDisplayName = (type: string): string => {
  switch (type) {
    case 'CUSTOMER_HOME': return 'عميل منزل';
    case 'DELIVERY_BOY': return 'مندوب توصيل';
    case 'AGENT': return 'وكيل';
    // Add other types as needed
    default: return type;
  }
};
*/ 