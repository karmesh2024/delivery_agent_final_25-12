"use client";

// استيراد أنماط Leaflet
import 'leaflet/dist/leaflet.css';
import React, { useState, useEffect, useMemo, useId } from "react";
import { Agent } from "@/types";
import { DeliveryLocation } from "../types";
import { cn } from "@/lib/utils";
// استيراد أنواع المناطق الجغرافية
import { GeographicZone } from "@/domains/settings/types/index";
// استخدام next/dynamic لتحميل المكون فقط في جانب العميل وليس في الخادم
import dynamic from 'next/dynamic';

// استيراد مكون الخريطة بشكل ديناميكي مع تعطيل SSR
// يمنع تهيئة الخريطة أثناء تصيير الخادم ويمنع مشاكل عدم توافق العميل/الخادم
const MapComponent = dynamic(() => import("./MapWrapper"), {
  ssr: false, // منع التحميل في جانب الخادم
  loading: () => (
    <div className="bg-gray-100 rounded-lg p-6 text-center flex items-center justify-center min-h-[600px]">
      <p className="text-gray-500">جاري تحميل الخريطة...</p>
    </div>
  )
});

// --- المكون الرئيسي للخريطة ---
export function LeafletMapComponent({
  agents = [],
  locations = [],
  geographicZones = [], // إضافة المناطق الجغرافية
  className = "",
  onLocationClick,
  onAgentClick,
  onZoneClick,
}: {
  agents?: Agent[];
  locations?: DeliveryLocation[];
  geographicZones?: GeographicZone[]; // إضافة دعم المناطق الجغرافية
  className?: string;
  onLocationClick?: (location: DeliveryLocation) => void;
  onAgentClick?: (agent: Agent) => void;
  onZoneClick?: (zoneId: string) => void; // إضافة معالج النقر على المنطقة
}) {
  // حالة المكون
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null); // إضافة حالة المنطقة المحددة
  const [isMounted, setIsMounted] = useState(false);
  
  // استخدام معرّف فريد ثابت لكل نسخة من المكون
  const componentId = useId();
  
  // محددات القاهرة كموقع افتراضي
  const center: [number, number] = useMemo(() => [30.0444, 31.2357], []);
  const defaultZoom = 11;
  
  // إنشاء مفتاح يتغير مع كل تغيير في البيانات لإجبار الخريطة على إعادة الرسم
  const mapKey = useMemo(() => {
    const agentsStr = agents.map(a => a.id).join('-');
    const locationsStr = locations.map(l => l.id).join('-');
    const zonesStr = geographicZones.map(z => z.id).join('-'); // إضافة المناطق للمفتاح
    return `map-${componentId}-${agentsStr.length}-${locationsStr.length}-${zonesStr.length}-${isMounted ? 'mounted' : 'unmounting'}`;
  }, [agents, locations, geographicZones, componentId, isMounted]);
  
  // تجنب المشاكل في تهيئة المكون (خاصة في Next.js مع SSR و هيدرة العميل)
  useEffect(() => {
    // تعيين المكون كمحمل بعد التحديث
    setIsMounted(true);
    
    // تنظيف المكون عند إلغاء التحميل
    return () => {
      setIsMounted(false);
    };
  }, []);

  // --- معالجات الأحداث ---
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(prev => prev?.id === agent.id ? null : agent);
    setSelectedLocation(null);
    setSelectedZoneId(null); // إلغاء تحديد المنطقة
    if (onAgentClick) onAgentClick(agent);
  };

  const handleLocationClick = (location: DeliveryLocation) => {
    setSelectedLocation(prev => prev?.id === location.id ? null : location);
    setSelectedAgent(null);
    setSelectedZoneId(null); // إلغاء تحديد المنطقة
    if (onLocationClick) onLocationClick(location);
  };

  // إضافة معالج النقر على المنطقة
  const handleZoneClick = (zoneId: string) => {
    setSelectedZoneId(prev => prev === zoneId ? null : zoneId);
    setSelectedAgent(null);
    setSelectedLocation(null);
    if (onZoneClick) onZoneClick(zoneId);
  };

  // --- تصفية البيانات ---
  const validAgents = useMemo(() => 
    agents.filter(agent =>
      agent.location &&
      typeof agent.location.lat === 'number' &&
      typeof agent.location.lng === 'number' &&
      agent.location.lat !== 0 &&
      agent.location.lng !== 0
    ), 
    [agents]
  );

  const validLocations = useMemo(() => 
    locations.filter(location =>
      typeof location.lat === 'number' &&
      typeof location.lng === 'number' &&
      location.lat !== 0 &&
      location.lng !== 0
    ),
    [locations]
  );

  // تصفية المناطق الجغرافية التي لها مضلع صالح
  const validZones = useMemo(() => 
    geographicZones.filter(zone => 
      zone.area_polygon && 
      zone.area_polygon.coordinates && 
      zone.area_polygon.coordinates.length > 0
    ),
    [geographicZones]
  );

  // إرجاع عنصر التحميل إذا لم نكن في جانب العميل بعد
  if (!isMounted) {
    return (
      <div className={cn("bg-gray-100 rounded-lg p-6 text-center flex items-center justify-center min-h-[600px]", className)}>
        <p className="text-gray-500">جاري تحميل الخريطة...</p>
      </div>
    );
  }

  return (
    <div 
      className={cn("rounded-lg overflow-hidden relative", className)} 
      style={{ width: "100%", height: "100%", minHeight: "600px" }}
      id={`map-container-${componentId}`}
    >
      <MapComponent 
        // key={mapKey}
        center={center}
        zoom={defaultZoom}
        validAgents={validAgents}
        validLocations={validLocations}
        selectedAgent={selectedAgent}
        selectedLocation={selectedLocation}
        onAgentClick={handleAgentClick}
        onLocationClick={handleLocationClick}
        // إضافة المناطق الجغرافية
        geographicZones={validZones}
        selectedZoneId={selectedZoneId}
        onZoneClick={handleZoneClick}
      />
      
      <div className="absolute bottom-1 right-1 text-[10px] text-gray-600 bg-white/70 px-1 rounded z-10">
        OpenStreetMap | © المساهمون في OpenStreetMap
      </div>
    </div>
  );
}

// للتوافق مع الكود القديم
export const VISGoogleMapsComponent = LeafletMapComponent; 