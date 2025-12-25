import React, { useEffect, useCallback, useRef, useState, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Agent } from "@/types";
import { DeliveryLocation } from "../types";
import { GeoJSONPolygon } from "@/domains/settings/types";

// تصحيح أيقونات Leaflet
const fixLeafletIcons = (): void => {
  if (typeof window === 'undefined') return;
  
  // @ts-expect-error - _getIconUrl غير معرّف في أنواط TypeScript
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Helper functions for marker colors
const getAgentStatusColor = (status: string = "offline"): string => {
  switch (status) {
    case "online":
    case "available": return "#10B981"; // green-500
    case "busy": return "#3B82F6"; // blue-500
    case "offline": return "#9CA3AF"; // gray-400
    default: return "#9CA3AF"; // gray-400
  }
};

const getLocationStatusColor = (status: string = "pending"): string => {
  switch (status) {
    case "pending": return "#EAB308"; // yellow-500
    case "in_progress": return "#3B82F6"; // blue-500
    case "delivered": return "#10B981"; // green-500
    case "canceled": return "#EF4444"; // red-500
    default: return "#9CA3AF"; // gray-400
  }
};

// Helper functions for status text
const getAgentStatusText = (status: string = "offline"): string => {
  switch (status) {
    case "online": return "متصل";
    case "busy": return "مشغول";
    case "offline": return "غير متصل";
    default: return "غير معروف";
  }
};

const getLocationStatusText = (status: string = "pending"): string => {
  switch (status) {
    case "pending": return "قيد الانتظار";
    case "in_progress": return "قيد التنفيذ";
    case "delivered": return "تم التوصيل";
    case "canceled": return "ملغي";
    default: return "غير معروف";
  }
};

// Get initials from name
const getInitials = (name?: string): string => {
  if (!name) return "AG"; // قيمة افتراضية للمندوب مع حماية من undefined
  
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// تعريف واجهة للمنطقة الجغرافية
interface GeographicZoneProps {
  id: string;
  name: string;
  area_polygon: GeoJSONPolygon;
  is_active: boolean;
}

// واجهات للنوافذ المنبثقة
interface AgentPopupProps {
  agent: Agent;
}

interface LocationPopupProps {
  location: DeliveryLocation;
}

interface MapWrapperProps {
  center: [number, number];
  zoom: number;
  validAgents: Agent[];
  validLocations: DeliveryLocation[];
  selectedAgent: Agent | null;
  selectedLocation: DeliveryLocation | null;
  onAgentClick: (agent: Agent) => void;
  onLocationClick: (location: DeliveryLocation) => void;
  geographicZones?: GeographicZoneProps[];
  selectedZoneId?: string | null;
  onZoneClick?: (zoneId: string) => void;
}

// مكون لضبط الخريطة والاستجابة للأحداث
const MapController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  
  // ضبط المركز والزوم
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  // تحسين الأداء عن طريق تقليل إعادة الرسم عند التكبير والتصغير
  useMapEvents({
    zoomend: () => {
      // يمكن إضافة منطق هنا للاستجابة لأحداث الزوم
    },
    moveend: () => {
      // يمكن إضافة منطق هنا للاستجابة لأحداث التحرك
    }
  });
  
  return null;
};

// تحويل بيانات المضلع الجغرافي من GeoJSON إلى تنسيق Leaflet
const convertGeoJSONPolygonToLeaflet = (geoJsonPolygon: GeoJSONPolygon): [number, number][] => {
  try {
    if (!geoJsonPolygon.coordinates || !geoJsonPolygon.coordinates[0]) {
      return [];
    }
    
    return geoJsonPolygon.coordinates[0].map(coord => [coord[1], coord[0]]);
  } catch (error) {
    console.error("خطأ في تحويل المضلع الجغرافي:", error);
    return [];
  }
};

// مكون للمنطقة الجغرافية
const ZonePolygon = memo(({ 
  zone, 
  selectedZoneId,
  onZoneClick
}: { 
  zone: GeographicZoneProps; 
  selectedZoneId?: string | null;
  onZoneClick?: (zoneId: string) => void;
}) => {
  const polygonPositions = useMemo(() => 
    convertGeoJSONPolygonToLeaflet(zone.area_polygon),
    [zone.area_polygon]
  );
  
  const zoneId = zone.id;
  const isSelected = selectedZoneId === zoneId;
  
  // معالج النقر على المنطقة
  const handleZoneClick = useCallback(() => {
    if (onZoneClick) {
      onZoneClick(zoneId);
    }
  }, [onZoneClick, zoneId]);
  
  if (polygonPositions.length === 0) {
    return null;
  }

  return (
    <Polygon
      positions={polygonPositions}
      pathOptions={{
        color: isSelected ? '#0891b2' : '#4b5563',
        fillColor: isSelected ? '#06b6d4' : '#9ca3af',
        fillOpacity: zone.is_active ? 0.3 : 0.1,
        weight: isSelected ? 3 : 2,
        dashArray: zone.is_active ? undefined : '5, 5',
      }}
      eventHandlers={{
        click: handleZoneClick
      }}
    >
      {isSelected && (
        <Popup closeButton={true} autoPan={false}>
          <div className="p-1 font-sans">
            <h3 className="font-medium text-sm">{zone.name || 'منطقة بدون اسم'}</h3>
            <div className="text-xs mt-1">
              {zone.is_active ? "نشطة" : "غير نشطة"}
            </div>
          </div>
        </Popup>
      )}
    </Polygon>
  );
});

ZonePolygon.displayName = 'ZonePolygon';

// تحسين أداء محتوى النافذة المنبثقة للمندوب
const AgentPopupContent = memo(({ agent }: AgentPopupProps) => (
  <div className="p-1 max-w-60 font-sans">
    <div className="flex items-center gap-2 mb-2">
      <div className="h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
        {getInitials(agent.name)}
      </div>
      <div>
        <h3 className="font-medium text-sm">{agent.name}</h3>
        <div className="text-xs mt-1 px-2 py-0.5 rounded-full text-white"
             style={{ backgroundColor: getAgentStatusColor(agent.status) }}>
          {getAgentStatusText(agent.status)}
        </div>
      </div>
    </div>
    {agent.phone && (
      <p className="text-sm text-gray-600 mb-1">هاتف: {agent.phone}</p>
    )}
    {agent.rating && (
      <p className="text-sm text-gray-600 mb-1">تقييم: {agent.rating}/5</p>
    )}
    <div className="flex gap-1 mt-2">
      <button className="flex-1 text-xs py-0.5 px-2 border rounded">
        اتصال
      </button>
      <button className="flex-1 text-xs py-0.5 px-2 border rounded">
        تفاصيل
      </button>
    </div>
  </div>
));

AgentPopupContent.displayName = 'AgentPopupContent';

// تحسين أداء محتوى النافذة المنبثقة للموقع
const LocationPopupContent = memo(({ location }: LocationPopupProps) => (
  <div className="p-1 max-w-60 font-sans">
    <div className="flex justify-between items-start mb-2">
      <h3 className="font-medium text-sm">طلب #{location.id?.substring(0, 6) || 'غير معروف'}</h3>
      <div className="text-xs px-2 py-0.5 rounded-full text-white"
           style={{ backgroundColor: getLocationStatusColor(location.status || 'pending') }}>
        {getLocationStatusText(location.status || 'pending')}
      </div>
    </div>
    <p className="text-sm text-gray-600 mb-1">
      العنوان: {location.address || "غير متوفر"}
    </p>
    <div className="flex gap-1 mt-2">
      <button className="flex-1 text-xs py-0.5 px-2 border rounded">
        تتبع
      </button>
      <button className="flex-1 text-xs py-0.5 px-2 border rounded">
        تفاصيل
      </button>
    </div>
  </div>
));

LocationPopupContent.displayName = 'LocationPopupContent';

// مكون لمحتوى الخريطة، يستخدم useMap للوصول إلى كائن الخريطة
const MapContent: React.FC<{
  center: [number, number];
  zoom: number;
  validAgents: Agent[];
  validLocations: DeliveryLocation[];
  selectedAgent: Agent | null;
  selectedLocation: DeliveryLocation | null;
  onAgentClick: (agent: Agent) => void;
  onLocationClick: (location: DeliveryLocation) => void;
  geographicZones?: GeographicZoneProps[];
  selectedZoneId?: string | null;
  onZoneClick?: (zoneId: string) => void;
}> = ({ 
  center,
  zoom,
  validAgents, 
  validLocations, 
  selectedAgent, 
  selectedLocation, 
  onAgentClick, 
  onLocationClick,
  geographicZones,
  selectedZoneId,
  onZoneClick
}) => {
  // تعريف الأيقونات المخصصة
  const createAgentIcon = useCallback((status: string): L.DivIcon => {
    return L.divIcon({
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

  const createLocationIcon = useCallback((status: string): L.DivIcon => {
    return L.divIcon({
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
  
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <ZoomControl position="topright" />
      
      <MapController center={center} zoom={zoom} />
      
      {/* Geographic Zones Polygons */}
      {geographicZones?.map((zone) => (
        <ZonePolygon 
          key={`zone-${zone.id}`}
          zone={zone} 
          selectedZoneId={selectedZoneId} 
          onZoneClick={onZoneClick} 
        />
      ))}
      
      {/* Agent Markers */}
      {validAgents.map((agent) => (
        <Marker
          key={`agent-${agent.id}`}
          position={[agent.location?.lat || 0, agent.location?.lng || 0]}
          icon={createAgentIcon(agent.status || 'offline')}
          eventHandlers={{ click: () => onAgentClick(agent) }}
        >
          {selectedAgent?.id === agent.id && (
            <Popup closeButton={true} autoPan={false} className="leaflet-popup-custom">
              <AgentPopupContent agent={agent} />
            </Popup>
          )}
        </Marker>
      ))}

      {/* Location Markers */}
      {validLocations.map((location) => (
        <Marker
          key={`location-${location.id}`}
          position={[location.lat, location.lng]}
          icon={createLocationIcon(location.status || 'pending')}
          eventHandlers={{ click: () => onLocationClick(location) }}
        >
          {selectedLocation?.id === location.id && (
            <Popup closeButton={true} autoPan={false} className="leaflet-popup-custom">
              <LocationPopupContent location={selectedLocation} />
            </Popup>
          )}
        </Marker>
      ))}
    </>
  );
};

// المكون الرئيسي للخريطة
const MapWrapper: React.FC<MapWrapperProps> = ({
  center,
  zoom,
  validAgents,
  validLocations,
  selectedAgent,
  selectedLocation,
  onAgentClick,
  onLocationClick,
  geographicZones,
  selectedZoneId,
  onZoneClick
}) => {
  // تصحيح الأيقونات عند التحميل (يجب أن يتم مرة واحدة)
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // إنشاء مفتاح فريد يتغير مع تغير البيانات لضمان إعادة التركيب
  const mapKey = useMemo(() => 
    `map-${Date.now()}-${validAgents.length}-${validLocations.length}`,
    [validAgents, validLocations]
  );
  
  return (
    <div className="h-full w-full relative overflow-hidden">
      <MapContainer
        key={mapKey} // استخدام المفتاح المتغير
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        className="z-0"
        preferCanvas={true} // تحسين الأداء باستخدام Canvas بدلاً من SVG
      >
        <MapContent 
          center={center}
          zoom={zoom}
          validAgents={validAgents}
          validLocations={validLocations}
          selectedAgent={selectedAgent}
          selectedLocation={selectedLocation}
          onAgentClick={onAgentClick}
          onLocationClick={onLocationClick}
          geographicZones={geographicZones}
          selectedZoneId={selectedZoneId}
          onZoneClick={onZoneClick}
        />
      </MapContainer>
    </div>
  );
};

export default MapWrapper; 