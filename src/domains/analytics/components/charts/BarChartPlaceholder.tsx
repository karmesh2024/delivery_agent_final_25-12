/**
 * مكون مخطط الأعمدة البيانية
 * تم نقله من صفحة التحليلات إلى هيكل DDD
 */

import { FiDownload } from "react-icons/fi";
import { Button } from "@/shared/ui/button";
import { BarChartProps } from "../../types";

// البيانات الافتراضية لمخطط الأعمدة
const defaultCategories = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const defaultValues = [40, 65, 85, 70, 90, 50, 30];

const BarChartPlaceholder: React.FC<BarChartProps> = ({ 
  title, 
  description, 
  categories = defaultCategories,
  values = defaultValues,
  color = "#3b82f6"
}) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Button variant="outline" size="sm">
        <FiDownload className="h-4 w-4 mr-1" />
        Export
      </Button>
    </div>
    
    <div className="h-[300px] w-full bg-gray-50 rounded-lg border relative overflow-hidden">
      {/* Placeholder for bar chart */}
      <div className="absolute inset-0 flex items-end justify-around p-10">
        {categories.map((category, idx) => {
          // حساب النسبة المئوية للارتفاع
          const heightPercentage = values[idx] ? Math.min(values[idx], 100) : 0;
          return (
            <div key={idx} className="flex flex-col items-center">
              <div 
                className="w-12 rounded-t" 
                style={{ 
                  height: `${heightPercentage}%`,
                  backgroundColor: color
                }}
              ></div>
              <span className="text-xs mt-2">{category}</span>
            </div>
          );
        })}
      </div>
      
      {/* Y axis labels */}
      <div className="absolute top-0 bottom-0 left-2 flex flex-col justify-between text-xs text-gray-500 py-4">
        <span>100</span>
        <span>75</span>
        <span>50</span>
        <span>25</span>
        <span>0</span>
      </div>
    </div>
  </div>
);

export default BarChartPlaceholder;