import React, { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface PriceSparklineProps {
  data: number[];
  width?: number | string;
  height?: number;
  color?: string;
}

export const PriceSparkline: React.FC<PriceSparklineProps> = ({ 
  data, 
  width = 80, 
  height = 30,
  color
}) => {
  const chartData = useMemo(() => {
    // إذا لم تكن هناك بيانات، نعرض خطاً مستقيماً وهمياً لضبط الـ Chart
    if (!data || data.length === 0) return [{ value: 0 }, { value: 0 }];
    
    // إذا كان هناك نقطة واحدة فقط، نكررها ليرسم الخط
    if (data.length === 1) return [{ value: data[0] }, { value: data[0] }];
    
    return data.map((val, index) => ({ value: val, index }));
  }, [data]);

  // تحديد اللون تلقائياً بناءً على الاتجاه إذا لم يتم تزويده
  const strokeColor = useMemo(() => {
    if (color) return color;
    if (data.length < 2) return '#94a3b8'; // gray-400
    
    const first = data[0];
    const last = data[data.length - 1];
    
    if (last > first) return '#10b981'; // emerald-500
    if (last < first) return '#f43f5e'; // rose-500
    return '#94a3b8'; // gray-400
  }, [data, color]);

  return (
    <div style={{ width, height }} className="sparkline-container overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={strokeColor} 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={true}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
