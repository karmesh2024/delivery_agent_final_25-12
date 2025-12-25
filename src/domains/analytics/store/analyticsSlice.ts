/**
 * شريحة Redux لنطاق التحليلات
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AnalyticsState, PerformanceMetric } from "../types";

// البيانات الافتراضية لمؤشرات الأداء
const defaultPerformanceMetrics: PerformanceMetric[] = [
  {
    title: "Total Collections",
    value: "1,248",
    trend: "up",
    change: "+12.5%",
    icon: null, // يتم تعيينه بواسطة المكون
    description: "Total waste collections completed"
  },
  {
    title: "Collection Efficiency",
    value: "92.3%",
    trend: "up",
    change: "+4.7%",
    icon: null,
    description: "Efficiency of waste collection operations"
  },
  {
    title: "Average Response Time",
    value: "28 min",
    trend: "down",
    change: "-14.2%",
    icon: null,
    description: "Average time to respond to collection requests"
  },
  {
    title: "Customer Satisfaction",
    value: "4.8/5",
    trend: "up",
    change: "+0.3",
    icon: null,
    description: "Overall customer satisfaction rating"
  }
];

// الحالة الأولية لنطاق التحليلات
const initialState: AnalyticsState = {
  period: "month",
  metrics: defaultPerformanceMetrics,
  isLoading: false
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    setPeriod: (state, action: PayloadAction<"day" | "week" | "month" | "year">) => {
      state.period = action.payload;
    },
    setMetrics: (state, action: PayloadAction<PerformanceMetric[]>) => {
      state.metrics = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    }
  }
});

export const { setPeriod, setMetrics, setLoading } = analyticsSlice.actions;
export default analyticsSlice.reducer;