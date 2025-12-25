"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  Phone,
  ArrowLeft,
  Clock,
  Navigation,
  User,
  MapPin,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// استيراد مكونات Redux و APIs
import { useAppDispatch } from "@/store/hooks";
import { ordersApi } from "@/services/ordersApi";
import { Order, Agent } from "@/types";
import { mapDeliveryOrderToOrder } from "@/domains/orders/utils/orderMappers";
import { AgentMapAlternate } from "@/domains/mapping/components/AgentMapAlternate";
import { DeliveryLocation } from "@/domains/mapping/types";
import { agentsApi } from "@/services/agentsApi";

// نقطة تتبع المندوب
interface TrackingPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

// معلومات المندوب
interface AgentInfo {
  id: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  status: string;
  location?: {
    lat: number;
    lng: number;
  };
}

// معلومات الموقع
interface LocationInfo {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'agent' | 'pickup' | 'delivery';
}

// تعريف نوع نقطة تتبع من قاعدة البيانات
interface TrackingPointDB {
  id: string;
  order_id: string;
  delivery_boy_id: string;
  latitude: string;
  longitude: string;
  speed?: string | number | null;
  heading?: string | number | null;
  timestamp: string;
  status?: string;
  
  // حقول إضافية من tracking_points_with_details
  customer_order_id?: string;
  customer_name?: string;
  customer_phone?: string;
  order_status?: string;
  pickup_location?: string;
  delivery_location?: string;
  estimated_distance?: number;
  estimated_time?: number;
  order_number?: string;
  delivery_boy_name?: string;
  delivery_boy_phone?: string;
}

export function OrderTrackingView({ orderId }: { orderId: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>([]);
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [hasAgentData, setHasAgentData] = useState(false);

  // تحويل بيانات التتبع من قاعدة البيانات إلى كائنات نقاط التتبع
  const convertToTrackingPoints = (dbPoints: TrackingPointDB[]): TrackingPoint[] => {
    return dbPoints
      .filter(point => point.latitude && point.longitude)
      .map(point => ({
        lat: parseFloat(point.latitude),
        lng: parseFloat(point.longitude),
        timestamp: point.timestamp,
        speed: point.speed ? (typeof point.speed === 'number' ? point.speed : parseFloat(point.speed as string)) : undefined,
        heading: point.heading ? (typeof point.heading === 'number' ? point.heading : parseFloat(point.heading as string)) : undefined
      }));
  };

  // تحويل AgentInfo إلى النوع Agent المطلوب (مع تصحيح الأنواع)
  const mapAgentInfoToAgentType = (agentInfo: AgentInfo): Agent => ({
    id: agentInfo.id,
    name: agentInfo.name,
    status: agentInfo.status === 'online' ? 'online' : agentInfo.status === 'busy' ? 'busy' : 'offline',
    location: agentInfo.location,
    phone: agentInfo.phone || undefined, // استخدام undefined
    avatar_url: agentInfo.avatar_url || undefined, // استخدام undefined
    rating: undefined, // استخدام undefined
    preferred_vehicle: undefined,
    current_order_id: orderId,
    last_active: undefined, // استخدام undefined
  });

  // تحويل LocationInfo إلى DeliveryLocation (تصحيح النوع)
  const mapLocationInfoToDeliveryLocationType = (locationInfo: LocationInfo): DeliveryLocation => ({
    id: locationInfo.id,
    lat: locationInfo.lat,
    lng: locationInfo.lng,
    address: locationInfo.address,
    label: locationInfo.name,
    type: locationInfo.type === 'pickup' ? 'pickup' : 'delivery',
    status: locationInfo.type === 'delivery' && order?.status === 'completed' ? 'delivered' : 'pending',
  });

  // تحديث معلومات المندوب وموقعه بناء على نقاط التتبع المستلمة
  const processTrackingPoints = (points: TrackingPoint[]): void => {
    if (points.length === 0) return;
    
    // استخدام آخر نقطة تتبع لتحديث موقع المندوب
    const latestPoint = points[points.length - 1];
    
    setAgent(prev => ({
      ...(prev || {
        id: order?.agent_id || '0',
        name: 'مندوب التوصيل',
        status: 'busy'
      }),
      location: {
        lat: latestPoint.lat,
        lng: latestPoint.lng
      }
    }));
    
    setHasAgentData(true);
    
    // إضافة موقع المندوب الحالي إلى قائمة المواقع
    updateAgentLocation(latestPoint.lat, latestPoint.lng);
    
    // تحديث نقاط التتبع وتاريخ آخر تحديث
    setTrackingPoints(points);
    setLastUpdated(new Date());
  };

  // تحديث موقع المندوب في قائمة المواقع
  const updateAgentLocation = (lat: number, lng: number) => {
    setLocations(prevLocations => {
      // إزالة أي موقع مندوب سابق
      const filteredLocations = prevLocations.filter(loc => loc.type !== 'agent');
      
      // إضافة موقع المندوب الجديد
      return [
        {
          id: 'agent',
          name: agent?.name || 'مندوب التوصيل',
          address: 'الموقع الحالي للمندوب',
          lat: lat,
          lng: lng,
          type: 'agent'
        },
        ...filteredLocations
      ];
    });
  };

  // جلب نقاط التتبع والموقع الحالي للمندوب
  const fetchTrackingPoints = async () => {
    if (!orderId || !order?.agent_id) return;
    
    try {
      console.log("جلب نقاط التتبع للطلب:", orderId);
      
      // التحقق من وجود اتصال بقاعدة البيانات
      if (!supabase) {
        console.error("خطأ: لا يوجد اتصال بقاعدة البيانات");
        return;
      }
      
      // محاولة استخدام جدول tracking_points_with_details أولاً
      const { data: trackingData, error: trackingError } = await supabase
        .from('tracking_points_with_details')
        .select('*')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: true });
      
      if (trackingError) {
        console.error("خطأ في جلب نقاط التتبع:", trackingError);
        return;
      }
      
      if (trackingData && trackingData.length > 0) {
        console.log("تم جلب نقاط التتبع:", trackingData.length);
        
        // تحويل ومعالجة البيانات
        const points = convertToTrackingPoints(trackingData);
        processTrackingPoints(points);
      }
      // إذا لم يتم العثور على نقاط تتبع، نحاول استخدام جدول order_tracking
      else {
        const { data: orderTrackingData, error: orderTrackingError } = await supabase
          .from('order_tracking')
          .select('*')
          .eq('order_id', orderId)
          .order('timestamp', { ascending: true });
        
        if (orderTrackingError) {
          console.error("خطأ في جلب نقاط التتبع من order_tracking:", orderTrackingError);
          return;
        }
        
        if (orderTrackingData && orderTrackingData.length > 0) {
          console.log("تم جلب نقاط التتبع من order_tracking:", orderTrackingData.length);
          
          // تحويل ومعالجة البيانات
          const points = convertToTrackingPoints(orderTrackingData);
          processTrackingPoints(points);
        }
      }
    } catch (err: Error | unknown) {
      console.error("خطأ في جلب نقاط التتبع:", err);
    }
  };

  // تحديث البيانات يدويًا
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrackingPoints();
    setRefreshing(false);
  };

  // ترجمة حالة الطلب إلى العربية
  const getOrderStatusText = (status?: string) => {
    if (!status) return "غير معروفة";
    
    switch (status.toLowerCase()) {
      case 'pending': return "قيد الانتظار";
      case 'confirmed': return "مؤكد";
      case 'in_progress': return "قيد التنفيذ";
      case 'picked_up': return "تم الالتقاط";
      case 'completed': return "مكتمل";
      case 'delivered': return "تم التوصيل";
      case 'cancelled': case 'canceled': return "ملغي";
      default: return status;
    }
  };

  // الحصول على لون حالة الطلب
  const getOrderStatusColor = (status?: string) => {
    if (!status) return "bg-gray-500";
    
    switch (status.toLowerCase()) {
      case 'pending': return "bg-yellow-500";
      case 'confirmed': return "bg-blue-500";
      case 'in_progress': return "bg-blue-700";
      case 'picked_up': return "bg-indigo-500";
      case 'completed': return "bg-green-500";
      case 'delivered': return "bg-green-500";
      case 'cancelled': case 'canceled': return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  // الحصول على أحرف الاسم الأولى
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // حساب الوقت المنقضي منذ بدء الطلب
  const getElapsedTime = () => {
    if (!order?.created_at) return "-";
    const orderTime = new Date(order.created_at).getTime();
    const now = new Date().getTime();
    const diff = now - orderTime;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes} د ${seconds} ث`;
  };

  // فتح تطبيق الخرائط للملاحة
  const openNavigation = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  // الاتصال بالمندوب أو العميل
  const callPhone = (phone: string | undefined) => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  // جلب بيانات الطلب
  useEffect(() => {
    const fetchOrderDataAndSetup = async () => {
      setLoading(true);
      setError(null);
      setAgent(null); // إعادة تعيين المندوب
      setLocations([]); // إعادة تعيين المواقع
      setTrackingPoints([]);
      setHasAgentData(false);
      
      if (!supabase) {
        setError("فشل الاتصال بقاعدة البيانات.");
        setLoading(false);
        return;
      }
      
      try {
        // جلب البيانات من العرض المفصل
        const { data: orderData, error: orderError } = await supabase
          .from('order_details')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        
        // التحقق من خطأ Supabase أولاً
        if (orderError) {
          // رمي الخطأ لمسكته في كتلة catch
          throw orderError;
        }
        
        // التحقق مما إذا تم العثور على الطلب
        if (!orderData) {
          // رمي خطأ مخصص إذا لم يتم العثور على الطلب
          throw new Error("لم يتم العثور على الطلب بالمعرف المحدد.");
        }

        // استخدام بيانات orderData مباشرة حيث أنها تحتوي على التفاصيل
        setOrder({
          id: orderData.id,
          order_number: orderData.order_number,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          status: orderData.status,
          created_at: orderData.created_at,
          updated_at: orderData.updated_at,
          total_amount: orderData.total_amount || 0,
          payment_method: orderData.payment_method || 'cash',
          pickup_address: orderData.pickup_address, // موجود في detailed_orders
          delivery_address: orderData.delivery_address, // موجود في detailed_orders
          pickup_location: orderData.pickup_location, // افترض أنه بالصيغة الصحيحة مؤقتًا
          delivery_location: orderData.delivery_location, // افترض أنه بالصيغة الصحيحة مؤقتًا
          agent_id: orderData.delivery_boy_id, // من detailed_orders
        });
        
        // إعداد معلومات المندوب من orderData
        if (orderData.delivery_boy_id && orderData.delivery_boy_name) {
          const currentAgentInfo: AgentInfo = {
            id: orderData.delivery_boy_id,
            name: orderData.delivery_boy_name,
            phone: orderData.delivery_boy_phone || undefined,
            avatar_url: undefined, // أو محاولة جلبه إذا أمكن
            status: orderData.delivery_boy_status || 'offline',
            location: undefined,
          };
          setAgent(currentAgentInfo);
          setHasAgentData(true);
        } else {
          setHasAgentData(false);
          setAgent(null); // التأكد من إعادة تعيينه إذا لم يعد موجودًا
        }

        // إعداد المواقع الأولية من orderData (مع التحقق من الصيغة)
        const initialLocations: LocationInfo[] = [];
        // التحقق من أن pickup_location هو كائن ويحتوي على lat/lng
        if (orderData.pickup_location && typeof orderData.pickup_location === 'object' && 'lat' in orderData.pickup_location && 'lng' in orderData.pickup_location) {
          initialLocations.push({
          id: 'pickup',
          name: 'نقطة الالتقاط',
            address: orderData.pickup_address || 'عنوان الالتقاط غير متوفر',
            lat: orderData.pickup_location.lat,
            lng: orderData.pickup_location.lng,
          type: 'pickup'
        });
        }
        // التحقق من أن delivery_location هو كائن ويحتوي على lat/lng
        if (orderData.delivery_location && typeof orderData.delivery_location === 'object' && 'lat' in orderData.delivery_location && 'lng' in orderData.delivery_location) {
          initialLocations.push({
          id: 'delivery',
            name: 'نقطة التسليم',
            address: orderData.delivery_address || 'عنوان التسليم غير متوفر',
            lat: orderData.delivery_location.lat,
            lng: orderData.delivery_location.lng,
          type: 'delivery'
        });
        }
        setLocations(initialLocations);
        
        // جلب نقاط التتبع
        if (orderData.delivery_boy_id) { // فقط إذا كان هناك مندوب معين
        await fetchTrackingPoints();
        }
        
      } catch (err: Error | unknown) {
        console.error("Error fetching order details:", err);
        setError(err instanceof Error ? err.message : "فشل في جلب تفاصيل الطلب.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDataAndSetup();
  }, [orderId]);

  // التحقق من وجود نقاط تتبع
  const hasTrackingData = trackingPoints.length > 0;
  
  // آخر موقع معروف للمندوب
  const lastLocation = hasTrackingData 
    ? { lat: trackingPoints[trackingPoints.length-1].lat, lng: trackingPoints[trackingPoints.length-1].lng }
    : agent?.location;

  // عرض شاشة التحميل
  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg text-center">جاري تحميل بيانات التتبع...</p>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (error) {
    return (
      <div className="p-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="text-red-500 text-center">
              <h3 className="text-lg font-bold">حدث خطأ</h3>
              <p>{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض رسالة عدم وجود الطلب
  if (!order) {
    return (
      <div className="p-8">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="text-amber-700 text-center">
              <h3 className="text-lg font-bold">الطلب غير موجود</h3>
              <p>لم يتم العثور على الطلب المطلوب. يرجى التحقق من الرابط والمحاولة مرة أخرى.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // عرض واجهة تتبع الطلب الرئيسية
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge className={cn(getOrderStatusColor(order.status), "text-white")}>
            {getOrderStatusText(order.status)}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {getElapsedTime()}
          </Badge>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>تتبع الطلب #{order.id.substring(0, 6).toUpperCase()}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2 text-gray-800">تفاصيل الطلب</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <dt className="w-24 flex-shrink-0 text-gray-500">العميل:</dt>
                      <dd className="flex-grow font-medium">{order.customer_name || 'غير متوفر'}</dd>
                    </div>
                    <div className="flex items-start">
                      <dt className="w-24 flex-shrink-0 text-gray-500">الهاتف:</dt>
                      <dd className="flex-grow font-medium flex items-center gap-1">
                        {order.customer_phone || 'غير متوفر'}
                        {order.customer_phone && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                            if (order.customer_phone) {
                              callPhone(order.customer_phone);
                            }
                          }}>
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start">
                      <dt className="w-24 flex-shrink-0 text-gray-500">التكلفة:</dt>
                      <dd className="flex-grow font-medium">
                        {order.total_amount ? `${order.total_amount} ج.م` : 'غير متوفر'}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 text-gray-800">العناوين</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <dt className="w-24 flex-shrink-0 text-gray-500 pt-1">
                        <Badge className="bg-blue-500">التقاط</Badge>
                      </dt>
                      <dd className="flex-grow">
                        <div className="font-medium">{order.pickup_address || 'غير متوفر'}</div>
                        {locations.find(loc => loc.type === 'pickup') && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-6 p-0 text-xs"
                            onClick={() => {
                              const loc = locations.find(loc => loc.type === 'pickup');
                              if (loc) openNavigation(loc.lat, loc.lng);
                            }}
                          >
                            فتح في الخرائط
                          </Button>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-start">
                      <dt className="w-24 flex-shrink-0 text-gray-500 pt-1">
                        <Badge className="bg-red-500">توصيل</Badge>
                      </dt>
                      <dd className="flex-grow">
                        <div className="font-medium">{order.delivery_address || order.customer_address || 'غير متوفر'}</div>
                        {locations.find(loc => loc.type === 'delivery') && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-6 p-0 text-xs"
                            onClick={() => {
                              const loc = locations.find(loc => loc.type === 'delivery');
                              if (loc) openNavigation(loc.lat, loc.lng);
                            }}
                          >
                            فتح في الخرائط
                          </Button>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-50 border">
          <CardHeader>
            <CardTitle className="text-base">مندوب التوصيل</CardTitle>
          </CardHeader>
          <CardContent>
            {hasAgentData ? (
              <div className="flex flex-col items-center">
                <Avatar className="h-16 w-16 mb-3">
                  <AvatarImage src={agent?.avatar_url || undefined} alt={agent?.name} />
                  <AvatarFallback className="bg-primary text-white text-lg">
                    {agent?.name ? getInitials(agent.name) : 'DB'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-medium text-lg mb-1">{agent?.name || 'مندوب التوصيل'}</h3>
                <Badge className={cn(
                  "mb-3",
                  agent?.status === "online" ? "bg-green-500" : 
                  agent?.status === "busy" ? "bg-blue-500" : "bg-gray-500"
                )}>
                  {agent?.status === "online" ? "متاح" : 
                   agent?.status === "busy" ? "مشغول" : "غير متصل"}
                </Badge>
                
                <div className="grid grid-cols-2 gap-2 w-full">
                  {agent?.phone && (
                    <Button 
                      className="flex items-center justify-center gap-1"
                      onClick={() => callPhone(agent.phone)}
                    >
                      <Phone className="h-4 w-4" />
                      اتصال
                    </Button>
                  )}
                  
                  {lastLocation && (
                    <Button 
                      variant="outline"
                      className="flex items-center justify-center gap-1"
                      onClick={() => openNavigation(lastLocation.lat, lastLocation.lng)}
                    >
                      <Navigation className="h-4 w-4" />
                      الملاحة
                    </Button>
                  )}
                </div>
                
                {trackingPoints.length > 0 && (
                  <p className="mt-4 text-xs text-gray-500 text-center">
                    آخر تحديث للموقع: {new Date(trackingPoints[trackingPoints.length-1].timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>لا يوجد مندوب معين للطلب حالياً</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>خريطة التتبع المباشر</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          {(locations.length > 0 || (hasAgentData && agent)) ? (
            <AgentMapAlternate
              agents={hasAgentData && agent ? [mapAgentInfoToAgentType(agent)] : []}
              locations={locations
                .filter(loc => loc.type !== 'agent')
                .map(mapLocationInfoToDeliveryLocationType)}
              className="w-full h-[500px]"
            />
          ) : loading ? (
            <div className="h-[500px] flex items-center justify-center bg-gray-100">
              <p className="text-muted-foreground">جاري تحميل بيانات الخريطة...</p>
            </div>
          ) : (
            <div className="h-[500px] flex items-center justify-center bg-gray-100">
              <p className="text-muted-foreground">لا توجد بيانات مواقع لعرضها على الخريطة.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        آخر تحديث: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}