import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboardStats, fetchWallets } from '@/domains/payments/store/paymentsDashboardSlice';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  TooltipItem,
  ChartData,
  LineElement,
  PointElement,
  TimeScale,
  TimeSeriesScale,
  ChartOptions,
  Filler,
} from 'chart.js';
import { FaWallet, FaExchangeAlt, FaMoneyBillWave, FaUsers } from 'react-icons/fa';
import 'chartjs-adapter-date-fns';

// تسجيل المكونات التي يحتاجها المخطط
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  LineElement,
  PointElement,
  TimeScale,
  TimeSeriesScale,
  Filler
);

// Common Tooltip Options
const commonTooltipOptions = {
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
  callbacks: {},
};

// Doughnut Chart Options
const doughnutChartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      rtl: true,
      labels: {
        font: {
          family: 'Cairo, sans-serif',
          size: 13,
        },
        usePointStyle: true,
        boxWidth: 10,
        padding: 15,
      },
    },
    title: {
      display: true,
      text: 'توزيع المحافظ حسب النوع',
      font: {
        family: 'Cairo, sans-serif',
        size: 16,
        weight: 'bold' as const,
      },
      padding: {
        top: 10,
        bottom: 15,
      },
    },
    tooltip: {
      ...commonTooltipOptions,
      callbacks: {
        title: (tooltipItems: TooltipItem<'doughnut'>[]) => {
          return ''; // No title needed, label is enough
        },
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
  animation: {
    animateScale: true,
    animateRotate: true,
  },
};

// Bar Chart (Status Distribution) Options
const barChartOptions: ChartOptions<'bar'> = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      stacked: false,
      beginAtZero: true,
      title: {
        display: true,
        text: 'عدد المحافظ',
        font: { family: 'Cairo, sans-serif', size: 12 },
      },
      ticks: {
        font: { family: 'Cairo, sans-serif', size: 11 },
        stepSize: 1, 
      },
      grid: {
        display: true,
        color: 'rgba(0,0,0,0.05)',
      }
    },
    y: {
      stacked: false,
      ticks: {
        font: { family: 'Cairo, sans-serif', size: 12 },
      },
      grid: {
        display: false,
        color: 'rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: {
    legend: {
      display: false, 
    },
    title: {
      display: true,
      text: 'توزيع المحافظ حسب الحالة',
      font: {
        family: 'Cairo, sans-serif',
        size: 16,
        weight: 'bold' as const,
      },
      padding: {
        top: 10,
        bottom: 15,
      },
    },
    tooltip: {
      ...commonTooltipOptions,
      callbacks: {
        title: (tooltipItems: TooltipItem<'bar'>[]) => {
          return tooltipItems[0].label || '';
        },
        label: (context: TooltipItem<'bar'>) => {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.x !== null) {
            label += `${context.parsed.x}`;
          }
          return label;
        },
      },
    },
  },
  elements: {
    bar: {
      borderRadius: 4,
    }
  }
};

// Line Chart (Creation Trend) Options
const lineChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'time' as const,
      time: {
        unit: 'month' as const,
        tooltipFormat: 'MMM yyyy', 
        displayFormats: {
          month: 'MMM yy', 
        },
      },
      title: {
        display: true,
        text: 'التاريخ',
        font: { family: 'Cairo, sans-serif', size: 12 },
      },
      ticks: {
        font: { family: 'Cairo, sans-serif', size: 11 },
        maxRotation: 0,
        minRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6, 
      },
      grid: {
        display: false,
      }
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'العدد التراكمي للمحافظ',
        font: { family: 'Cairo, sans-serif', size: 12 },
      },
      ticks: {
        font: { family: 'Cairo, sans-serif', size: 11 },
        stepSize: 1, 
      },
      grid: {
        display: true,
        color: 'rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        font: { family: 'Cairo, sans-serif', size: 13 },
        usePointStyle: true,
        boxWidth: 10,
      },
    },
    title: {
      display: true,
      text: 'تطور عدد المحافظ عبر الزمن',
      font: {
        family: 'Cairo, sans-serif',
        size: 16,
        weight: 'bold' as const,
      },
      padding: {
        top: 10,
        bottom: 15,
      },
    },
    tooltip: {
      ...commonTooltipOptions,
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        title: (tooltipItems: TooltipItem<'line'>[]) => {
          const date = new Date(tooltipItems[0].parsed.x);
          return date.toLocaleDateString('ar-EG-u-nu-latn', { month: 'long', year: 'numeric' });
        },
        label: (context: TooltipItem<'line'>) => {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += `${context.parsed.y} محفظة`;
          }
          return label;
        },
      },
    },
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false,
  },
};


// Horizontal Bar Chart (Balance Distribution) Options
const balanceBarChartOptions: ChartOptions<'bar'> = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'إجمالي الرصيد',
        font: { family: 'Cairo, sans-serif', size: 12 },
      },
      ticks: {
        font: { family: 'Cairo, sans-serif', size: 11 },
        callback: function (value: string | number) {
          if (typeof value === 'number') {
            return `${value.toLocaleString('ar-EG', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
          }
          return value;
        },
      },
      grid: {
        display: true,
        color: 'rgba(0,0,0,0.05)',
      }
    },
    y: {
      ticks: {
        font: { family: 'Cairo, sans-serif', size: 12 },
      },
       grid: {
        display: false,
        color: 'rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: 'توزيع الأرصدة حسب نوع المحفظة',
      font: {
        family: 'Cairo, sans-serif',
        size: 16,
        weight: 'bold' as const,
      },
      padding: {
        top: 10,
        bottom: 15,
      },
    },
    tooltip: {
      ...commonTooltipOptions,
      callbacks: {
        title: (tooltipItems: TooltipItem<'bar'>[]) => {
          return tooltipItems[0].label || '';
        },
        label: (context: TooltipItem<'bar'>) => {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.x !== null) {
            label += `${context.parsed.x.toLocaleString('ar-EG', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
          return label;
        },
      },
    },
  },
   elements: {
    bar: {
      borderRadius: 4,
    }
  }
};

const WalletStats: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, wallets, walletsStatus } = useAppSelector((state) => state.paymentsDashboard);

  useEffect(() => {
    // Fetch general dashboard statistics
    dispatch(fetchDashboardStats({ adminId: 'current' }));
    
    // Fetch a comprehensive list of wallets for detailed stats calculations
    // We only fetch if wallets haven't been loaded or are not currently loading to avoid redundant calls
    if (walletsStatus === 'idle' || walletsStatus === 'failed') {
      dispatch(fetchWallets({ page: 1, limit: 1000, filters: {}, searchQuery: '' }));
    }
  }, [dispatch, walletsStatus]);

  const calculateWalletTypeDistribution = (): ChartData<'doughnut', number[], string> | null => {
    if (!wallets || wallets.length === 0) return null;
    const typeDistribution: Record<string, number> = {};
    wallets.forEach(wallet => {
      typeDistribution[wallet.wallet_type] = (typeDistribution[wallet.wallet_type] || 0) + 1;
    });
    return {
      labels: Object.keys(typeDistribution).map(type => {
        switch (type) {
          case 'CUSTOMER_HOME': return 'عميل منزل';
          case 'DELIVERY_BOY': return 'مندوب توصيل';
          case 'AGENT': return 'وكيل';
          case 'COMPANY': return 'شركة';
          case 'SYSTEM_FLOAT': return 'سيولة النظام';
          case 'SYSTEM_REVENUE': return 'إيرادات النظام';
          case 'SYSTEM_FEES': return 'رسوم خدمة';
          default: return type;
        }
      }),
      datasets: [
        {
          data: Object.values(typeDistribution),
          backgroundColor: [
            '#4f46e5', // Indigo
            '#06b6d4', // Cyan
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#8b5cf6', // Violet
            '#ec4899', // Pink
            '#6366f1', // Indigo Alt
            '#0891b2', // Cyan Alt
            '#059669', // Emerald Alt
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const ALL_WALLET_STATUSES = [
    { key: 'ACTIVE', label: 'نشط', color: '#22c55e' },        // Green
    { key: 'INACTIVE', label: 'غير نشط', color: '#94a3b8' },    // Slate
    { key: 'PENDING_VERIFICATION', label: 'بانتظار التحقق', color: '#f59e0b' }, // Amber
    { key: 'VERIFIED', label: 'تم التحقق', color: '#3b82f6' },      // Blue
    { key: 'REJECTED', label: 'مرفوض', color: '#ef4444' },       // Red
    { key: 'FROZEN', label: 'مجمد', color: '#f97316' },         // Orange
    { key: 'SUSPENDED', label: 'معلق', color: '#eab308' },      // Yellow
    { key: 'CLOSED', label: 'مغلق', color: '#64748b' },         // Slate Dark
  ];

  const calculateWalletStatusDistribution = (): ChartData<'bar', number[], string> | null => {
    if (!wallets || wallets.length === 0) return null;

    const statusCounts = ALL_WALLET_STATUSES.reduce((acc, statusType) => {
      acc[statusType.key] = 0;
      return acc;
    }, {} as Record<string, number>);

    wallets.forEach(wallet => {
      if (statusCounts.hasOwnProperty(wallet.status)) {
        statusCounts[wallet.status]++;
      }
    });
    
    const filteredStatuses = ALL_WALLET_STATUSES.filter(s => statusCounts[s.key] > 0);

    if (filteredStatuses.length === 0) return null; // لا توجد بيانات لعرضها

    return {
      labels: filteredStatuses.map(s => s.label),
      datasets: [
        {
          label: 'عدد المحافظ',
          data: filteredStatuses.map(s => statusCounts[s.key]),
          backgroundColor: filteredStatuses.map(s => s.color),
          borderColor: filteredStatuses.map(s => s.color),
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 50,
        },
      ],
    };
  };

  const calculateTotalBalance = () => {
    if (!wallets || wallets.length === 0) return 0;
    return wallets.reduce((total, wallet) => total + (wallet.balance || 0), 0);
  };
  
  const walletTypeData = calculateWalletTypeDistribution();
  const walletStatusData = calculateWalletStatusDistribution();
  const totalBalance = calculateTotalBalance();

  const calculateWalletCreationTrend = (): ChartData<'line', { x: string; y: number }[], string> | null => {
    if (!wallets || wallets.length === 0) return null;

    const monthlyCounts: Record<string, number> = {};

    wallets.forEach(wallet => {
      if (wallet.created_at) {
        const date = new Date(wallet.created_at);
        const monthYear = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 7); // YYYY-MM
        monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
      }
    });

    const sortedMonths = Object.keys(monthlyCounts).sort();
    if (sortedMonths.length === 0) return null;

    let cumulativeCount = 0;
    const dataPoints = sortedMonths.map(monthYear => {
      cumulativeCount += monthlyCounts[monthYear];
      return { x: monthYear, y: cumulativeCount };
    });

    return {
      datasets: [
        {
          label: 'العدد التراكمي للمحافظ',
          data: dataPoints,
          fill: true,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.2,
          pointRadius: 3,
          pointBackgroundColor: '#3b82f6',
        },
      ],
    };
  };

  const walletCreationData = calculateWalletCreationTrend();

  const calculateBalanceDistributionByWalletType = (): ChartData<'bar', number[], string> | null => {
    if (!wallets || wallets.length === 0) return null;

    const balanceDistribution: Record<string, number> = {};
    const walletTypes: Record<string, string> = {
      CUSTOMER_HOME: 'عميل منزل',
      DELIVERY_BOY: 'مندوب توصيل',
      AGENT: 'وكيل',
      COMPANY: 'شركة',
      SYSTEM_FLOAT: 'سيولة النظام',
      SYSTEM_REVENUE: 'إيرادات النظام',
      SYSTEM_FEES: 'رسوم خدمة',
    };

    wallets.forEach(wallet => {
      const typeLabel = walletTypes[wallet.wallet_type] || wallet.wallet_type;
      balanceDistribution[typeLabel] = (balanceDistribution[typeLabel] || 0) + (wallet.balance || 0);
    });

    const labels = Object.keys(balanceDistribution);
    const data = Object.values(balanceDistribution);

    if (labels.length === 0) return null;

    return {
      labels: labels,
      datasets: [
        {
          label: 'إجمالي الرصيد',
          data: data,
          backgroundColor: [
            '#8b5cf6', // Violet
            '#ec4899', // Pink
            '#f59e0b', // Amber
            '#10b981', // Emerald
            '#06b6d4', // Cyan
            '#4f46e5', // Indigo
            '#ef4444', // Red
          ],
          borderColor: [
            '#8b5cf6', 
            '#ec4899', 
            '#f59e0b', 
            '#10b981', 
            '#06b6d4', 
            '#4f46e5', 
            '#ef4444', 
          ],
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 50,
        },
      ],
    };
  };

  const balanceDistributionData = calculateBalanceDistributionByWalletType();

  return (
    <div className="mb-8 p-1">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">إحصائيات المحافظ</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6 flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <FaWallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">إجمالي المحافظ</p>
              <h3 className="text-2xl font-bold text-gray-800">{wallets?.length || 0}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <FaMoneyBillWave className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">إجمالي الرصيد</p>
              <h3 className="text-2xl font-bold text-gray-800">{totalBalance.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <FaUsers className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">المحافظ النشطة</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats?.activeWalletsCount || 0}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg mr-4">
              <FaExchangeAlt className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">المعاملات الناجحة</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats?.successfulTransactionsCount || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {walletTypeData && (
          <Card>
            <CardContent className="pt-6 h-72">
              <Doughnut data={walletTypeData} options={doughnutChartOptions} />
            </CardContent>
          </Card>
        )}
        {walletStatusData && (
          <Card>
            <CardContent className="pt-6 h-72">
              <Bar data={walletStatusData} options={barChartOptions} />
            </CardContent>
          </Card>
        )}
        {walletCreationData && (
           <Card>
            <CardContent className="pt-6 h-72">
              <Line data={walletCreationData} options={lineChartOptions} />
            </CardContent>
          </Card>
        )}
        {balanceDistributionData && (
          <Card>
            <CardContent className="pt-6 h-72">
              <Bar data={balanceDistributionData} options={balanceBarChartOptions} />
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
};

export default WalletStats; 