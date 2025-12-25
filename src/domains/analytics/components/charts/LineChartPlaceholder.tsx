/**
 * مكون مخطط الخط البياني
 * تم نقله من صفحة التحليلات إلى هيكل DDD
 */

import { FiDownload } from "react-icons/fi";
import { Button } from "@/shared/ui/button";
import { LineChartProps } from "../../types";

const LineChartPlaceholder: React.FC<LineChartProps> = ({ 
  title, 
  description, 
  xAxisLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  yAxisLabels = [100, 75, 50, 25, 0]
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
      {/* Placeholder for line chart */}
      <div className="absolute bottom-0 left-0 right-0 h-[200px]">
        {/* Simulate line chart */}
        <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
          <path 
            d="M0,180 C50,120 100,160 150,100 C200,40 250,80 300,60 C350,40 400,20 500,10" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="3"
          />
          <path 
            d="M0,180 C50,120 100,160 150,100 C200,40 250,80 300,60 C350,40 400,20 500,10" 
            fill="url(#blueGradient)" 
            strokeWidth="0" 
            opacity="0.2"
          />
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* X and Y axis labels */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-between text-xs text-gray-500 px-4">
        {xAxisLabels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
      
      <div className="absolute top-0 bottom-0 left-2 flex flex-col justify-between text-xs text-gray-500 py-4">
        {yAxisLabels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
    </div>
  </div>
);

export default LineChartPlaceholder;