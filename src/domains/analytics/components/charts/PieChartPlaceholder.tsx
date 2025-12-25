/**
 * مكون مخطط الدائرة البيانية
 * تم نقله من صفحة التحليلات إلى هيكل DDD
 */

import { FiDownload } from "react-icons/fi";
import { Button } from "@/shared/ui/button";
import { PieChartProps, PieChartSegment } from "../../types";

// الأقسام الافتراضية لمخطط الدائرة
const defaultSegments: PieChartSegment[] = [
  { label: "Plastic", value: 35, percentage: 35, color: "#3b82f6" },
  { label: "Paper", value: 25, percentage: 25, color: "#10b981" },
  { label: "Glass", value: 20, percentage: 20, color: "#f59e0b" },
  { label: "Metal", value: 20, percentage: 20, color: "#ef4444" },
];

const PieChartPlaceholder: React.FC<PieChartProps> = ({ 
  title, 
  description, 
  segments = defaultSegments,
  centerValue = "248",
  centerLabel = "Total Collections"
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
    
    <div className="h-[300px] w-full flex items-center justify-center">
      {/* Simulate pie chart */}
      <div className="relative w-[180px] h-[180px]">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="80" fill="#3b82f6" />
          <circle cx="90" cy="90" r="65" fill="#ffffff" />
          <path d="M90,10 A80,80 0 0,1 170,90 L90,90 Z" fill="#10b981" />
          <path d="M170,90 A80,80 0 0,1 90,170 L90,90 Z" fill="#f59e0b" />
          <path d="M90,170 A80,80 0 0,1 10,90 L90,90 Z" fill="#ef4444" />
        </svg>
        
        {/* Center statistics */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold">{centerValue}</p>
            <p className="text-xs text-gray-500">{centerLabel}</p>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="ml-8 space-y-3">
        {segments.map((segment, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
            <span className="text-sm">{segment.label} ({segment.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default PieChartPlaceholder;