/**
 * أنواع بيانات نطاق التحليلات
 */

// تعريف نوع البيانات العام
export type DataPoint = {
  label: string;
  value: number;
};

// أنواع بيانات المخططات البيانية المشتركة
export interface ChartProps {
  title: string;
  description: string;
  data?: DataPoint[]; // استخدام نوع محدد بدلاً من any
}

// نوع بيانات مخطط الخط
export interface LineChartProps extends ChartProps {
  // خصائص إضافية لمخطط الخط
  xAxisLabels?: string[];
  yAxisLabels?: number[];
  color?: string;
}

// نوع بيانات مخطط الدائرة
export interface PieChartProps extends ChartProps {
  // خصائص إضافية لمخطط الدائرة
  segments?: PieChartSegment[];
  centerValue?: string;
  centerLabel?: string;
}

export interface PieChartSegment {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

// نوع بيانات مخطط الأعمدة
export interface BarChartProps extends ChartProps {
  // خصائص إضافية لمخطط الأعمدة
  categories?: string[];
  values?: number[];
  color?: string;
}

// نوع بيانات المقاييس الرئيسية
export interface PerformanceMetric {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  change: string;
  icon: React.ReactNode;
  description: string;
}

// أنواع بيانات أخرى تتعلق بالتحليلات
export interface AnalyticsState {
  period: 'day' | 'week' | 'month' | 'year';
  metrics: PerformanceMetric[];
  isLoading: boolean;
}