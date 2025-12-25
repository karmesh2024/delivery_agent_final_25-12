"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Agent } from "@/types";
import { Card } from "@/shared/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import { LeafletMapComponent } from './LeafletMapComponent';
import { 
  getOrderTrackingPoints, 
  getOrderDetails 
} from '@/lib/supabase';
import { Phone, MapPin, Clock, Package, Truck, RefreshCw } from 'lucide-react';
import { DeliveryLocation } from "../types";

interface AgentMapProps {
  className?: string;
  onAgentClick?: (agent: Agent) => void;
  refreshInterval?: number; // بالثواني
  initialCenter?: { lat: number, lng: number }; 
  initialZoom?: number;
  agents?: Agent[]; // خاصية اختيارية للمندوبين
  locations?: DeliveryLocation[]; // إضافة خاصية المواقع
  onLocationClick?: (location: DeliveryLocation) => void; // إضافة معالج النقر على الموقع
}

export function AgentMapAlternate({ 
  className, 
  onAgentClick,
  refreshInterval = 30,
  initialCenter,
  initialZoom = 12,
  agents: externalAgents,
  locations = [],
  onLocationClick
}: AgentMapProps) {
  const [agents, setAgents] = useState<Agent[]>(externalAgents || []);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(!externalAgents || externalAgents.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [isProcessingClick, setIsProcessingClick] = useState(false);

  interface GeoPoint {
    lat: number;
    lng: number;
    [key: string]: unknown; // للتوافق مع GeoLocationData
  }
  
  type PostGISGeometry = string;
  
  interface DbDeliveryOrder {
    id: string;
    delivery_boy_id?: string;
    customer_order_id?: string;
    order_number: string;
    pickup_location: PostGISGeometry;
    pickup_address: string;
    delivery_location?: PostGISGeometry;
    delivery_address?: string;
    customer_name?: string;
    customer_phone?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    category_name?: string;
    subcategory_name?: string;
  }
  
  interface GeoLocationData {
    lat?: number;
    lng?: number;
    latitude?: number | string;
    longitude?: number | string;
    coordinates?: [number, number];
    [key: string]: unknown; // للتعامل مع خصائص غير معروفة بأمان
  }
  
  interface TrackingPointData {
    latitude: string | number;
    longitude: string | number;
    timestamp: string;
    speed?: number;
    heading?: number;
    [key: string]: unknown; // للخصائص الإضافية
  }
  
  interface TrackingPoint {
    lat: number;
    lng: number;
    timestamp: string;
    speed?: number;
    heading?: number;
  }

  interface OrderDetails {
    id: string;
    order_number?: string;
    status: string;
    pickup_location?: PostGISGeometry | string;
    pickup_address?: string;
    delivery_location?: PostGISGeometry | string;
    delivery_address?: string;
    customer_name?: string;
  }
  
  type DeliveryOrder = {
    id: string;
    order_number?: string;
    status?: string;
    pickup_location?: PostGISGeometry | string | GeoLocationData;
    pickup_address?: string;
    delivery_location?: PostGISGeometry | string | GeoLocationData;
    delivery_address?: string;
    customer_name?: string;
  };

  useEffect(() => {
    if (externalAgents) {
      setAgents(externalAgents);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [externalAgents]);

  const loadAgentTracking = useCallback(async (agent: Agent) => {
    if (!agent.id || !agent.current_order_id) {
      setTrackingPoints([]);
      setOrderDetails(null);
      return;
    }
    setIsProcessingClick(true);
    setError(null);

    try {
      const order = await getOrderDetails(agent.current_order_id);

      if (!order) {
        console.warn('Order details not found for order ID:', agent.current_order_id);
        setOrderDetails(null);
        setTrackingPoints([]);
        return;
      }

      const processGeoLocation = (loc: Record<string, unknown> | string | undefined): string | undefined => {
        if (!loc) return undefined;
        if (typeof loc === 'string') return loc;
        if (typeof loc === 'object' && loc !== null) {
          const lng = typeof loc.lng === 'number' ? loc.lng : (typeof loc.longitude === 'number' ? loc.longitude : 0);
          const lat = typeof loc.lat === 'number' ? loc.lat : (typeof loc.latitude === 'number' ? loc.latitude : 0);
          return `POINT(${lng} ${lat})`;
        }
        return undefined;
      };
        
      const safeOrderDetails: OrderDetails = {
        id: order.id,
        order_number: order.order_number,
        status: order.status || 'pending',
        pickup_location: processGeoLocation(order.pickup_location as Record<string, unknown> | string | undefined),
        pickup_address: order.pickup_address,
        delivery_location: processGeoLocation(order.delivery_location as Record<string, unknown> | string | undefined),
        delivery_address: order.delivery_address,
        customer_name: order.customer_name
      };
      setOrderDetails(safeOrderDetails);

      const pointsData = await getOrderTrackingPoints(agent.current_order_id);
      
      const typedPoints = pointsData.map((point: TrackingPointData) => {
        if (!point || point.latitude == null || point.longitude == null) {
          return null;
        }
        
        const lat = typeof point.latitude === 'string' ? parseFloat(point.latitude) : Number(point.latitude);
        const lng = typeof point.longitude === 'string' ? parseFloat(point.longitude) : Number(point.longitude);
          
        if (isNaN(lat) || isNaN(lng)) return null;
          
        const trackingPoint: TrackingPoint = {
          lat: lat,
          lng: lng,
          timestamp: point.timestamp || new Date().toISOString(),
          ...(point.speed !== undefined && { speed: point.speed }),
          ...(point.heading !== undefined && { heading: point.heading })
        };
        
        return trackingPoint;
      }).filter(Boolean) as TrackingPoint[];
      
      setTrackingPoints(typedPoints);
    } catch (err) {
      console.error('خطأ في جلب بيانات التتبع:', err);
      setError(err instanceof Error ? err.message : 'فشل في جلب بيانات التتبع');
      setTrackingPoints([]);
      setOrderDetails(null);
    } finally {
      setIsProcessingClick(false);
    }
  }, []);

  const handleAgentClickInternal = useCallback(async (agent: Agent) => {
    if (isProcessingClick) return;

    if (selectedAgent && selectedAgent.id === agent.id) {
      setSelectedAgent(null);
      setTrackingPoints([]);
      setOrderDetails(null);
    } else {
      setSelectedAgent(agent);
      await loadAgentTracking(agent);
    }
    
    if (onAgentClick) {
      onAgentClick(agent);
    }
  }, [selectedAgent, onAgentClick, loadAgentTracking, isProcessingClick]);

  const getInitials = (name: string) => {
    if (!name) return "AG"; // قيمة افتراضية للمندوب مع حماية من undefined
    
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500 text-white";
      case "offline":
        return "bg-gray-400 text-white";
      case "busy":
        return "bg-amber-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case "online":
        return "متاح";
      case "offline":
        return "غير متصل";
      case "busy":
        return "مشغول";
      default:
        return status;
    }
  };

  const translateVehicle = (vehicle?: string) => {
    if (!vehicle) return "غير محدد";
    switch (vehicle) {
      case "tricycle":
        return "دراجة ثلاثية";
      case "pickup_truck":
        return "شاحنة بيك أب";
      case "light_truck":
        return "شاحنة خفيفة";
      default:
        return vehicle;
    }
  };

  const translateOrderStatus = (status?: string) => {
    if (!status) return "";
    switch (status) {
      case "pending":
        return "قيد الانتظار";
      case "assigned":
        return "تم التعيين";
      case "in_progress":
        return "قيد التنفيذ";
      case "completed":
        return "مكتمل";
      case "canceled":
        return "ملغي";
      default:
        return status;
    }
  };

  const getPath = () => {
    return trackingPoints.map(point => ({
      lat: point.lat,
      lng: point.lng
    }));
  };

  const formatTimeToArabic = (timestamp: string | Date) => {
    try {
    const date = new Date(timestamp);
      return new Intl.DateTimeFormat('ar', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      console.error("Error formatting time:", e);
      return "غير متوفر";
    }
  };

  const getLastLocation = () => {
    if (trackingPoints.length === 0) {
      return selectedAgent?.location;
    }
    return {
      lat: trackingPoints[trackingPoints.length - 1].lat,
      lng: trackingPoints[trackingPoints.length - 1].lng
    };
  };

  const handleRefresh = () => {
    if (selectedAgent) {
      loadAgentTracking(selectedAgent);
    }
  };

  const agentsWithLocation = agents.filter(agent => 
    agent.location && 
    typeof agent.location.lat === 'number' && 
    typeof agent.location.lng === 'number' &&
    agent.location.lat !== 0 && 
    agent.location.lng !== 0
  );

  const extractCoordinates = (postgisGeometry: PostGISGeometry | string | undefined): { lat: number, lng: number } | null => {
    if (!postgisGeometry) return null;
    
    try {
      if (postgisGeometry.includes('POINT')) {
        const coordStart = postgisGeometry.indexOf('(') + 1;
        const coordEnd = postgisGeometry.indexOf(')');
        
        if (coordStart > 0 && coordEnd > coordStart) {
          const coordsText = postgisGeometry.substring(coordStart, coordEnd);
          const [lngStr, latStr] = coordsText.split(' ');
          
          const lng = parseFloat(lngStr);
          const lat = parseFloat(latStr);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
        }
      } else if (postgisGeometry.startsWith('0101')) {
        return { lat: 30.0, lng: 31.0 };
      }
    } catch (error) {
      console.error('خطأ أثناء تحليل الإحداثيات الجغرافية:', error);
    }
    
    return null;
  };

  const calculatedLocations = orderDetails 
    ? [
        { 
          id: 'pickup',
          ...(extractCoordinates(orderDetails.pickup_location) || { lat: 0, lng: 0 }),
          status: 'pending' as 'pending' | 'in_progress' | 'delivered' | 'canceled',
          address: orderDetails.pickup_address || 'نقطة الالتقاط',
          type: 'pickup' as const,
          label: 'نقطة الالتقاط'
        },
        { 
          id: 'delivery',
          ...(extractCoordinates(orderDetails.delivery_location) || { lat: 0, lng: 0 }),
          status: orderDetails.status === 'completed' ? 'delivered' : 
                 orderDetails.status === 'cancelled' ? 'canceled' : 
                 'in_progress' as 'pending' | 'in_progress' | 'delivered' | 'canceled',
          address: orderDetails.delivery_address || 'نقطة التسليم',
          type: 'delivery' as const,
          label: 'نقطة التسليم'
        }
      ].filter(loc => loc.lat !== 0 && loc.lng !== 0)
    : [];

  const [displayTime, setDisplayTime] = useState('');
  useEffect(() => {
    const updateFormattedTime = () => {
      try {
        setDisplayTime(formatTimeToArabic(lastRefreshed));
      } catch (e) {
        console.error("Error formatting display time", e);
        setDisplayTime("وقت غير متوفر");
      }
    };
    updateFormattedTime();
    const timer = setInterval(updateFormattedTime, 1000);
    return () => clearInterval(timer);
  }, [lastRefreshed]);

  const formatTimeToArabicSafe = useCallback((timestamp: string | Date | undefined) => {
    if (!timestamp) return "غير متوفر";
    try {
      return new Intl.DateTimeFormat('ar', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: 'numeric',
        month: 'long',
        year: 'numeric', 
        hour12: true
      }).format(new Date(timestamp));
    } catch (e) {
      console.error("Error formatting date for display:", e);
      return "وقت غير صالح";
    }
  }, []);

  if (loading && agents.length === 0) {
    return <div className={cn("flex items-center justify-center w-full h-full", className)}>جاري تحميل المندوبين...</div>;
  }

  return (
    <Card className={cn("overflow-hidden relative shadow-lg h-full w-full", className)}>
      <div className="absolute top-2 left-2 right-2 z-20 bg-white/80 dark:bg-slate-800/80 rounded-md p-2 flex justify-between items-center shadow-md">
        <div className="text-sm flex items-center">
          <span className="mr-2">المندوبين:</span>
          <Badge className="bg-green-100 text-green-800 mr-1">
            متاح: {agents.filter(a => a.status === 'online').length}
          </Badge>
          <Badge className="bg-amber-100 text-amber-800 mr-1">
            مشغول: {agents.filter(a => a.status === 'busy').length}
          </Badge>
          <Badge className="bg-gray-100 text-gray-800">
            غير متصل: {agents.filter(a => a.status === 'offline').length}
          </Badge>
        </div>
        <div className="flex items-center" suppressHydrationWarning>
          <span className="text-xs text-gray-500 ml-2">
            آخر تحديث: {displayTime}
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="absolute top-14 left-2 right-2 z-20 bg-red-100 text-red-800 p-2 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="relative w-full h-full" style={{ minHeight: '500px' }}>
        <LeafletMapComponent
          key={`agent-map-${agents.length}-${locations.length}-${selectedAgent?.id || 'none'}-${refreshing}`}
          agents={agentsWithLocation}
          locations={locations.length > 0 ? locations : calculatedLocations} 
          onAgentClick={handleAgentClickInternal}
          onLocationClick={onLocationClick}
          className="w-full h-full min-h-[500px]"
        />
        
        {selectedAgent && (
          <div 
            className="absolute bottom-20 right-2 bg-white dark:bg-slate-800 rounded-md shadow-lg p-3 w-72 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                <AvatarImage src={selectedAgent.avatar_url || undefined} alt={selectedAgent.name} /> 
                <AvatarFallback className="bg-primary text-white">
                  {getInitials(selectedAgent.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{selectedAgent.name}</h3>
                <Badge
                  className={cn(
                    "rounded-full px-2 text-xs mt-1",
                    getStatusColor(selectedAgent.status)
                  )}
                >
                  {translateStatus(selectedAgent.status)}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 mt-3 text-sm">
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-500 ml-2" />
                <span className="text-gray-500 ml-1">الهاتف:</span>
                <span className="font-medium ml-1 flex-1">{selectedAgent.phone || 'غير متوفر'}</span>
              </div>
              
              <div className="flex items-center">
                <Truck className="h-4 w-4 text-gray-500 ml-2" />
                <span className="text-gray-500 ml-1">المركبة:</span>
                <span className="font-medium ml-1 flex-1">{translateVehicle(selectedAgent.preferred_vehicle)}</span>
              </div>
              
              <div className="flex items-center" suppressHydrationWarning>
                <Clock className="h-4 w-4 text-gray-500 ml-2" />
                <span className="text-gray-500 ml-1">آخر نشاط:</span>
                <span className="font-medium ml-1 flex-1 text-xs">
                  {selectedAgent.last_active ? formatTimeToArabic(new Date(selectedAgent.last_active)) : 'غير متوفر'}
                </span>
              </div>

              {selectedAgent.current_order_id && orderDetails && (
                <div className="mt-2 border-t pt-2">
                  <h4 className="font-medium mb-2">الطلب الحالي:</h4>
                  
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-500 ml-2" />
                    <span className="text-gray-500 ml-1">رقم الطلب:</span>
                    <span className="font-medium ml-1 flex-1">
                      {orderDetails.order_number || selectedAgent.current_order_id.substring(0, 8)}
                    </span>
                  </div>
                  
                  <div className="flex items-center mt-1">
                    <Badge className={cn(
                      "h-5 rounded-full text-xs",
                      orderDetails.status === 'completed' ? "bg-green-100 text-green-800" :
                      orderDetails.status === 'canceled' ? "bg-red-100 text-red-800" :
                      "bg-blue-100 text-blue-800"
                    )}>
                      {translateOrderStatus(orderDetails.status)}
                    </Badge>
                  </div>
                  
                  {orderDetails.delivery_address && (
                    <div className="flex items-start mt-1">
                      <MapPin className="h-4 w-4 text-gray-500 ml-2 mt-1" />
                      <span className="text-gray-500 ml-1">العنوان:</span>
                      <span className="font-medium ml-1 flex-1 text-xs line-clamp-2">
                        {orderDetails.delivery_address}
                      </span>
                    </div>
                  )}
                  
                  {orderDetails.customer_name && (
                    <div className="flex items-center mt-1">
                      <span className="text-gray-500 ml-1">العميل:</span>
                      <span className="font-medium ml-1 flex-1">
                        {orderDetails.customer_name}
                      </span>
                    </div>
                  )}
                  
                  <Button 
                    size="sm" 
                    className="w-full mt-2 text-xs"
                    onClick={() => window.open(`/order-tracking/${selectedAgent.current_order_id}`, '_blank')}
                  >
                    عرض تفاصيل التتبع
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-2 right-2 text-xs text-slate-500 dark:text-slate-400 z-10 bg-white/70 px-1 rounded">
        OpenStreetMap contributors
      </div>
    </Card>
  );
}