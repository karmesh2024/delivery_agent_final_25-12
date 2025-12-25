"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Agent } from "@/types";
import { DeliveryLocation } from "../types";
import { cn } from "@/lib/utils";
import { Card } from "@/shared/ui/card";
// استخدام next/dynamic لتحميل المكون فقط في جانب العميل وليس في الخادم
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// استيراد مكون الخريطة بشكل ديناميكي مع تعطيل SSR
const LeafletMapComponent = dynamic(
  () => import("./LeafletMap").then((mod) => mod.LeafletMap),
  {
    ssr: false, // منع التحميل في جانب الخادم
    loading: () => (
      <div className="bg-gray-100 rounded-lg p-6 text-center flex items-center justify-center min-h-[600px]">
        <p className="text-gray-500">جاري تحميل الخريطة...</p>
      </div>
    )
  }
);

interface UnifiedMapComponentProps {
  agents?: Agent[];
  locations?: DeliveryLocation[];
  className?: string;
  onLocationClick?: (location: DeliveryLocation) => void;
  onAgentClick?: (agent: Agent) => void;
  showAgentsOnly?: boolean; // إذا كان true، يتم عرض المندوبين فقط
  showLocationsOnly?: boolean; // إذا كان true، يتم عرض المواقع فقط
  mapTitle?: string; // عنوان الخريطة (اختياري)
}

export function UnifiedMapComponent({
  agents = [],
  locations = [],
  className = "",
  onLocationClick,
  onAgentClick,
  showAgentsOnly = false,
  showLocationsOnly = false,
  mapTitle = "خريطة"
}: UnifiedMapComponentProps) {
  // حالة المكون
  const [isMounted, setIsMounted] = useState(false);
  
  // محددات القاهرة كموقع افتراضي
  const center: [number, number] = useMemo(() => [30.0444, 31.2357], []);
  const defaultZoom = 11;
  
  // تجنب المشاكل في تهيئة المكون (خاصة في Next.js مع SSR و هيدرة العميل)
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // إضافة سجلات تصحيح لفحص بيانات المندوبين
  useEffect(() => {
    console.log('UnifiedMapComponent: عدد المندوبين المستلمة:', agents.length);
    console.log('UnifiedMapComponent: المندوبون بمواقع صالحة:', agents.filter(a => a.location).length);
    
    // طباعة تفاصيل أول 3 مندوبين (إن وجدوا)
    if (agents.length > 0) {
      agents.slice(0, 3).forEach((agent, index) => {
        console.log(`UnifiedMapComponent: مندوب #${index + 1}:`, {
          id: agent.id,
          name: agent.name,
          hasLocation: !!agent.location,
          location: agent.location,
        });
      });
    }
  }, [agents]);

  // إنشاء معرف فريد للخريطة - ثابت لدورة حياة هذا المكون
  const mapId = useMemo(() => 
    `map-${showAgentsOnly ? 'agents' : ''}${showLocationsOnly ? 'locations' : ''}-${Math.random().toString(36).substring(2, 9)}`, 
    [] // هام: مصفوفة تبعيات فارغة لتأكيد أن هذه القيمة تنشأ مرة واحدة فقط
  );

  // تحقق مما إذا كانت هناك بيانات للعرض
  const hasAgentsToShow = showAgentsOnly && agents.length > 0;
  const hasLocationsToShow = showLocationsOnly && locations.length > 0;
  const hasDataToShow = hasAgentsToShow || hasLocationsToShow || (!showAgentsOnly && !showLocationsOnly && (agents.length > 0 || locations.length > 0));
  
  // إرجاع عنصر التحميل إذا لم نكن في جانب العميل بعد أو لا توجد بيانات
  if (!isMounted || !hasDataToShow) {
    return (
      <div className={cn("bg-gray-100 rounded-lg p-6 text-center flex items-center justify-center min-h-[600px]", className)}>
        <p className="text-gray-500">
          {!isMounted ? "جاري تحميل الخريطة..." : "لا توجد بيانات لعرضها على الخريطة"}
        </p>
      </div>
    );
  }

  return (
    <Card className={`relative overflow-hidden shadow-md rounded-lg ${className}`}>
      <div className="w-full h-full" style={{ minHeight: '600px' }}>
        <LeafletMapComponent 
          center={center}
          zoom={defaultZoom}
          agents={agents}
          locations={locations}
          onAgentClick={onAgentClick}
          onLocationClick={onLocationClick}
          showAgentsOnly={showAgentsOnly}
          showLocationsOnly={showLocationsOnly}
          mapId={mapId}
          className="w-full h-full"
        />
      </div>
      
      <div className="absolute bottom-2 right-2 text-xs text-slate-500 dark:text-slate-400 z-10 bg-white/70 px-1 rounded">
        OpenStreetMap | © المساهمون في OpenStreetMap
      </div>
    </Card>
  );
} 