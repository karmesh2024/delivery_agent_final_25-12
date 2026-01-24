"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLeafletMap } from '../hooks/useLeafletMap';
import L from 'leaflet';
import { Agent } from "@/types";
import { DeliveryLocation } from "../types";

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Get typed Leaflet instance to fix TypeScript errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const leaflet = L as any;

// Helper functions for colors
const getAgentStatusColor = (status: string): string => {
  switch (status) {
    case "online":
    case "available": return "#10B981"; // green-500
    case "busy": return "#3B82F6"; // blue-500
    case "offline": return "#9CA3AF"; // gray-400
    default: return "#9CA3AF"; // gray-400
  }
};

const getLocationStatusColor = (status: string): string => {
  switch (status) {
    case "pending": return "#EAB308"; // yellow-500
    case "in_progress": return "#3B82F6"; // blue-500
    case "delivered": return "#10B981"; // green-500
    case "canceled": return "#EF4444"; // red-500
    default: return "#9CA3AF"; // gray-400
  }
};

// Extract initials from name
const getInitials = (name?: string): string => {
  if (!name) return "AG"; // Default value with protection from undefined
  
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  agents: Agent[];
  locations: DeliveryLocation[];
  onAgentClick?: (agent: Agent) => void;
  onLocationClick?: (location: DeliveryLocation) => void;
  className?: string;
  showAgentsOnly?: boolean;
  showLocationsOnly?: boolean;
  mapId?: string;
}

export function LeafletMap({
  center,
  zoom,
  agents,
  locations,
  onAgentClick,
  onLocationClick,
  className = "",
  showAgentsOnly = false,
  showLocationsOnly = false,
  mapId = "main-map"
}: LeafletMapProps) {
  // Use custom hook for map management
  const { containerRef, mapInstance, isMapReady } = useLeafletMap({
    center,
    zoom,
    id: mapId
  });

  // Selected element state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  
  // Map markers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agentMarkers, setAgentMarkers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [locationMarkers, setLocationMarkers] = useState<any[]>([]);
  
  // Refs لتخزين markers للتنظيف
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentMarkersRef = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const locationMarkersRef = useRef<any[]>([]);
  
  // تحديث refs عند تغيير markers
  useEffect(() => {
    agentMarkersRef.current = agentMarkers;
  }, [agentMarkers]);
  
  useEffect(() => {
    locationMarkersRef.current = locationMarkers;
  }, [locationMarkers]);
  
  // إنشاء أيقونة للمندوب
  const createAgentIcon = useCallback((status: string) => {
    return leaflet.divIcon({
      className: "custom-div-icon",
      html: `
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: ${getAgentStatusColor(status)};
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 0.75rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }, []);

  // إنشاء أيقونة للموقع
  const createLocationIcon = useCallback((status: string) => {
    return leaflet.divIcon({
      className: "custom-div-icon",
      html: `
        <div style="
          width: 15px;
          height: 15px;
          background-color: ${getLocationStatusColor(status)};
          border: 1px solid white;
          transform: rotate(45deg);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
      `,
      iconSize: [15, 15],
      iconAnchor: [7.5, 7.5]
    });
  }, []);

  // إنشاء محتوى نافذة المندوب
  const createAgentPopupContent = useCallback((agent: Agent) => {
    // استخدام اسم آمن للمندوب
    const safeName = agent.name || "مندوب";
    
    return `
      <div class="p-2 max-w-60 font-sans">
        <div class="flex items-center gap-2 mb-2">
          <div class="h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
            ${getInitials(agent.name)}
          </div>
          <div>
            <h3 class="font-medium text-sm">${safeName}</h3>
            <div class="text-xs mt-1 px-2 py-0.5 rounded-full text-white"
                 style="background-color: ${getAgentStatusColor(agent.status)}">
              ${agent.status === "online" ? "متصل" : 
                agent.status === "busy" ? "مشغول" : 
                agent.status === "offline" ? "غير متصل" : "غير معروف"}
            </div>
          </div>
        </div>
        ${agent.phone ? `<p class="text-sm text-gray-600 mb-1">هاتف: ${agent.phone}</p>` : ''}
        ${agent.rating ? `<p class="text-sm text-gray-600 mb-1">تقييم: ${agent.rating}/5</p>` : ''}
        <div class="flex gap-1 mt-2">
          <button class="flex-1 text-xs py-0.5 px-2 border rounded">
            اتصال
          </button>
          <button class="flex-1 text-xs py-0.5 px-2 border rounded">
            تفاصيل
          </button>
        </div>
      </div>
    `;
  }, []);

  // إنشاء محتوى نافذة الموقع
  const createLocationPopupContent = useCallback((location: DeliveryLocation) => {
    // استخدام حالة آمنة للموقع
    const safeStatus = location.status || "unknown";
    
    return `
      <div class="p-2 max-w-60 font-sans">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-medium text-sm">طلب #${location.id.substring(0, 6)}</h3>
          <div class="text-xs px-2 py-0.5 rounded-full text-white"
               style="background-color: ${getLocationStatusColor(safeStatus)}">
            ${safeStatus === "pending" ? "قيد الانتظار" : 
              safeStatus === "in_progress" ? "قيد التنفيذ" : 
              safeStatus === "delivered" ? "تم التوصيل" : 
              safeStatus === "canceled" ? "ملغي" : "غير معروف"}
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-1">
          العنوان: ${location.address || "غير متوفر"}
        </p>
        <div class="flex gap-1 mt-2">
          <button class="flex-1 text-xs py-0.5 px-2 border rounded">
            تتبع
          </button>
          <button class="flex-1 text-xs py-0.5 px-2 border rounded">
            تفاصيل
          </button>
        </div>
      </div>
    `;
  }, []);

  // إضافة علامات المندوبين إلى الخريطة
  useEffect(() => {
    if (!mapInstance || !isMapReady || showLocationsOnly) {
      return;
    }

    // إزالة العلامات الحالية
    agentMarkersRef.current.forEach(marker => {
      if (marker) marker.remove();
    });
    
    // إضافة سجلات تصحيح لفحص بيانات المندوبين
    console.log(`LeafletMap (${mapId}): إجمالي المندوبين قبل التصفية: ${agents.length}`);
    
    // فحص بيانات المندوبين
    agents.forEach((agent, index) => {
      if (index < 5) { // فحص أول 5 مندوبين فقط لتجنب سجلات كثيرة
        console.log(`LeafletMap (${mapId}): مندوب #${index + 1}:`, {
          id: agent.id,
          name: agent.name,
          hasLocation: !!agent.location,
          location: agent.location,
        });
      }
    });
    
    // تعديل الفلتر ليكون أكثر تساهلاً
    const validAgents = agents.filter(agent => 
      agent && agent.location &&
      typeof agent.location.lat === 'number' &&
      typeof agent.location.lng === 'number' &&
      // تخفيف شرط الإحداثيات الصفرية للتجربة
      (agent.location.lat !== 0 || agent.location.lng !== 0)
    );
    
    console.log(`LeafletMap (${mapId}): قبل التصفية: ${agents.length}, بعد التصفية: ${validAgents.length} مندوب صالح`);
    
    // إذا كان هناك مندوبون صالحون، طباعة بياناتهم
    if (validAgents.length > 0) {
      console.log(`LeafletMap (${mapId}): أول مندوب صالح:`, validAgents[0]);
    } else {
      console.log(`LeafletMap (${mapId}): لا يوجد مندوبون صالحون بعد التصفية`);
    }
    
    // انتظر حتى تكون الخريطة جاهزة تماماً قبل إضافة markers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapInstance as any).whenReady(() => {
      // استخدام requestAnimationFrame لضمان أن DOM جاهز تماماً
      requestAnimationFrame(() => {
        // تأخير إضافي لضمان أن map container موجود في DOM
        setTimeout(() => {
          // التحقق من أن الخريطة لا تزال موجودة وجاهزة
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!mapInstance || !(mapInstance as any).getContainer()) {
            console.warn(`LeafletMap (${mapId}): الخريطة غير جاهزة لإضافة markers`);
            return;
          }

          // التحقق من أن map container موجود في DOM
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const container = (mapInstance as any).getContainer();
          if (!container || !container.parentElement) {
            console.warn(`LeafletMap (${mapId}): حاوية الخريطة غير موجودة في DOM`);
            return;
          }

          // التحقق من أن map panes موجودة (مطلوبة لإضافة markers)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!(mapInstance as any).getPane('markerPane')) {
            console.warn(`LeafletMap (${mapId}): markerPane غير جاهز`);
            return;
          }

          // إنشاء علامات جديدة
          const newMarkers = validAgents.map(agent => {
            // التأكد من وجود إحداثيات صالحة
            const lat = agent.location?.lat || 0;
            const lng = agent.location?.lng || 0;
            
            try {
              const marker = leaflet.marker(
                [lat, lng],
                { icon: createAgentIcon(agent.status || 'offline') }
              ).addTo(mapInstance);

              // إضافة مربع منبثق
              marker.bindPopup(createAgentPopupContent(agent), { closeButton: true });

              // إضافة معالج النقر
              marker.on('click', () => {
                setSelectedAgent(prevAgent => prevAgent?.id === agent.id ? null : agent);
                setSelectedLocation(null);
                if (onAgentClick) onAgentClick(agent);
              });

              return marker;
            } catch (error) {
              console.error(`LeafletMap (${mapId}): خطأ في إنشاء علامة للمندوب ${agent.id}:`, error);
              return null;
            }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }).filter(Boolean) as any[]; // استبعاد العلامات التي فشل إنشاؤها

          setAgentMarkers(newMarkers);
        }, 150); // تأخير 150ms بعد requestAnimationFrame
      });
    });

    // تنظيف عند إزالة المكون
    return () => {
      agentMarkersRef.current.forEach(marker => {
        if (marker) marker.remove();
      });
    };
  }, [mapInstance, isMapReady, agents, createAgentIcon, onAgentClick, createAgentPopupContent, showLocationsOnly, mapId]);

  // إضافة علامات المواقع إلى الخريطة
  useEffect(() => {
    if (!mapInstance || !isMapReady || showAgentsOnly) {
      return;
    }

    // إزالة العلامات الحالية
    locationMarkersRef.current.forEach(marker => {
      if (marker) marker.remove();
    });
    
    // تصفية المواقع ذات الإحداثيات الصالحة
    const validLocations = locations.filter(location => 
      typeof location.lat === 'number' && 
      typeof location.lng === 'number' &&
      location.lat !== 0 &&
      location.lng !== 0
    );
    
    // انتظر حتى تكون الخريطة جاهزة تماماً قبل إضافة markers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapInstance as any).whenReady(() => {
      // استخدام requestAnimationFrame لضمان أن DOM جاهز تماماً
      requestAnimationFrame(() => {
        // تأخير إضافي لضمان أن map container موجود في DOM
        setTimeout(() => {
          // التحقق من أن الخريطة لا تزال موجودة وجاهزة
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!mapInstance || !(mapInstance as any).getContainer()) {
            console.warn(`LeafletMap (${mapId}): الخريطة غير جاهزة لإضافة markers`);
            return;
          }

          // التحقق من أن map container موجود في DOM
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const container = (mapInstance as any).getContainer();
          if (!container || !container.parentElement) {
            console.warn(`LeafletMap (${mapId}): حاوية الخريطة غير موجودة في DOM`);
            return;
          }

          // التحقق من أن map panes موجودة (مطلوبة لإضافة markers)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!(mapInstance as any).getPane('markerPane')) {
            console.warn(`LeafletMap (${mapId}): markerPane غير جاهز`);
            return;
          }

          // إنشاء علامات جديدة
          const newMarkers = validLocations.map(location => {
            try {
              const marker = leaflet.marker(
                [location.lat, location.lng],
                { icon: createLocationIcon(location.status || 'unknown') }
              ).addTo(mapInstance);

              // إضافة مربع منبثق
              marker.bindPopup(createLocationPopupContent(location), { closeButton: true });

              // إضافة معالج النقر
              marker.on('click', () => {
                setSelectedLocation(prevLocation => prevLocation?.id === location.id ? null : location);
                setSelectedAgent(null);
                if (onLocationClick) onLocationClick(location);
              });

              return marker;
            } catch (error) {
              console.error(`LeafletMap (${mapId}): خطأ في إنشاء علامة للموقع ${location.id}:`, error);
              return null;
            }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).filter(Boolean) as any[];

          setLocationMarkers(newMarkers);
        }, 150); // تأخير 150ms بعد requestAnimationFrame
      });
    });

    // تنظيف عند إزالة المكون
    return () => {
      locationMarkersRef.current.forEach(marker => {
        if (marker) marker.remove();
      });
    };
  }, [mapInstance, isMapReady, locations, createLocationIcon, onLocationClick, createLocationPopupContent, showAgentsOnly, mapId]);

  // ✅ FIX: تحديث center و zoom بدون إعادة إنشاء الخريطة
  useEffect(() => {
    if (mapInstance && isMapReady) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapInstance as any).setView(center, zoom, { animate: false });
    }
  }, [mapInstance, isMapReady, center, zoom]);

  // سجل تصحيح عند تلقي البيانات (فقط عند تغيير البيانات فعلياً)
  const prevAgentsRef = useRef<string>('');
  useEffect(() => {
    const agentsKey = JSON.stringify(agents.map(a => ({ id: a.id, hasLocation: !!a.location })));
    if (agentsKey === prevAgentsRef.current) return; // لا تسجل إذا لم تتغير البيانات
    
    prevAgentsRef.current = agentsKey;
    console.log(`LeafletMap (${mapId}): تم استلام المندوبين:`, agents.length);
    console.log(`LeafletMap (${mapId}): المندوبون بمواقع صالحة:`, agents.filter(a => a.location).length);
    
    // إذا كانت الخريطة جاهزة وتم استلام بيانات المندوبين، قم بتحديث العلامات
    if (mapInstance && isMapReady && agents.length > 0 && !showLocationsOnly) {
      console.log(`LeafletMap (${mapId}): تحديث علامات المندوبين بعد تغيير البيانات`);
      
      // إزالة العلامات الحالية
      agentMarkersRef.current.forEach(marker => {
        if (marker) marker.remove();
      });
      
      // تصفية المندوبين ذوي الإحداثيات الصالحة
      const validAgents = agents.filter(agent => 
        agent && agent.location &&
        typeof agent.location.lat === 'number' &&
        typeof agent.location.lng === 'number' &&
        (agent.location.lat !== 0 || agent.location.lng !== 0)
      );
      
      // إنشاء علامات جديدة
      if (validAgents.length > 0) {
        const newMarkers = validAgents.map(agent => {
          try {
            const marker = leaflet.marker(
              [agent.location?.lat || 0, agent.location?.lng || 0],
              { icon: createAgentIcon(agent.status || 'offline') }
            ).addTo(mapInstance);
            
            marker.bindPopup(createAgentPopupContent(agent), { closeButton: true });
            
            marker.on('click', () => {
              setSelectedAgent(prevAgent => prevAgent?.id === agent.id ? null : agent);
              setSelectedLocation(null);
              if (onAgentClick) onAgentClick(agent);
            });
            
            return marker;
          } catch (error) {
            console.error(`LeafletMap (${mapId}): خطأ في إنشاء علامة للمندوب ${agent.id}:`, error);
            return null;
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).filter(Boolean) as any[];
        
        setAgentMarkers(newMarkers);
      }
    }
  }, [agents, mapInstance, isMapReady, mapId, showLocationsOnly, createAgentIcon, createAgentPopupContent, onAgentClick]);

  return (
    <div className={`w-full h-full relative ${className}`}>
      <div 
        ref={containerRef}
        className="w-full h-full leaflet-map-container"
        data-map-id={mapId}
        style={{ minHeight: '400px' }}
      />
    </div>
  );
} 