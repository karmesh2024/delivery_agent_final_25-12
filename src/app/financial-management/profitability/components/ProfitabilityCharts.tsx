'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { ar } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProfitabilityChartData {
  date: string;
  buy_total: number;
  sell_total: number;
  profit: number;
}

interface CategoryProfitability {
  category_name: string;
  total_profit: number;
}

interface ProfitabilityChartsProps {
  timeSeriesData?: ProfitabilityChartData[];
  categoryData?: CategoryProfitability[];
}

export function ProfitabilityCharts({ timeSeriesData = [], categoryData = [] }: ProfitabilityChartsProps) {
  // Line Chart - الربحية عبر الزمن
  const lineChartData = {
    labels: timeSeriesData.map(d => new Date(d.date).toLocaleDateString('ar-EG')),
    datasets: [
      {
        label: 'الشراء',
        data: timeSeriesData.map(d => d.buy_total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'البيع',
        data: timeSeriesData.map(d => d.sell_total),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'الربح',
        data: timeSeriesData.map(d => d.profit),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        rtl: true,
      },
      title: {
        display: true,
        text: 'الربحية عبر الزمن',
        font: {
          size: 16,
        },
      },
      tooltip: {
        rtl: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString('ar-EG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} ج.م`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString('ar-EG') + ' ج.م';
          }
        }
      }
    }
  };

  // Bar Chart - الربحية حسب الفئة
  const barChartData = {
    labels: categoryData.map(d => d.category_name),
    datasets: [
      {
        label: 'الربح',
        data: categoryData.map(d => d.total_profit),
        backgroundColor: categoryData.map((_, i) => {
          const colors = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ];
          return colors[i % colors.length];
        }),
        borderColor: categoryData.map((_, i) => {
          const colors = [
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)',
            'rgb(251, 146, 60)',
            'rgb(168, 85, 247)',
            'rgb(236, 72, 153)',
          ];
          return colors[i % colors.length];
        }),
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'الربحية حسب الفئة',
        font: {
          size: 16,
        },
      },
      tooltip: {
        rtl: true,
        callbacks: {
          label: function(context: any) {
            return `الربح: ${context.parsed.y.toLocaleString('ar-EG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} ج.م`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString('ar-EG') + ' ج.م';
          }
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>الربحية عبر الزمن</CardTitle>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length > 0 ? (
            <div style={{ height: '300px' }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              لا توجد بيانات للعرض
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>الربحية حسب الفئة</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <div style={{ height: '300px' }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              لا توجد بيانات للعرض
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
