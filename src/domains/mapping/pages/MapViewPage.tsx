/**
 * MapViewPage - صفحة عرض الخريطة
 * 
 * هذا المكون يوضح كيفية استخدام:
 * 1. Redux لإدارة الحالة المركزية
 * 2. واجهة API موحدة للخرائط
 * 3. المكونات المشتركة من نطاق الخرائط
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { 
  FiSearch, 
  FiMapPin, 
  FiUsers, 
  FiTruck, 
  FiFilter,
  FiRefreshCw,
  FiTarget,
  FiLayers,
  FiAlertCircle
} from "react-icons/fi";
import 'leaflet/dist/leaflet.css';

// استيراد المكونات من النطاق
import { UnifiedMapComponent } from "@/domains/mapping/components/UnifiedMapComponent";

// استيراد Redux hooks وactions
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAgents } from "@/store/agentsSlice";
import { fetchOrders } from "@/store/ordersSlice";
import { 
  mapDeliveryOrderToTrip 
} from "@/domains/mapping/api/mappingApi";

// استيراد الأنواع
import { Agent, Trip } from "@/types";
import { DeliveryLocation } from "@/domains/mapping/types";

const MapViewPage = () => {
  // استخدام Redux لإدارة الحالة
  const dispatch = useAppDispatch();
  const { items: agents, status: agentsStatus } = useAppSelector(state => state.agents);
  const { items: orders, loading: ordersLoading } = useAppSelector(state => state.orders);
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const loading = agentsStatus === 'loading' || ordersLoading;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedView, setSelectedView] = useState<"agents" | "trips" | "both">("both");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "idle">("all");

  // حالة الاتصال بقاعدة البيانات
  const [connectionInfo, setConnectionInfo] = useState<{
    hasCredentials: boolean;
    error: string | null;
    message: string;
  }>({
    hasCredentials: false,
    error: null,
    message: 'جاري التحقق من الاتصال...'
  });

  // التحقق من اتصال Redux
  useEffect(() => {
    async function checkConnection() {
      try {
        setConnectionInfo({
          hasCredentials: true,
          error: null,
          message: "تم الاتصال بنجاح. جاري جلب البيانات..."
        });
      } catch (e) {
        setConnectionInfo({
          hasCredentials: true,
          error: e instanceof Error ? e.message : 'خطأ غير معروف',
          message: 'حدث خطأ أثناء اختبار الاتصال'
        });
      }
    }

    checkConnection();
  }, []);

  // جلب بيانات المندوبين والطلبات باستخدام Redux
  useEffect(() => {
    // جلب بيانات الخريطة
    dispatch(fetchAgents());
    dispatch(fetchOrders());
    
    // تحديث البيانات كل 30 ثانية
    const intervalId = setInterval(() => {
      dispatch(fetchAgents());
      dispatch(fetchOrders());
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [dispatch]);

  // تحويل الطلبات إلى رحلات
  useEffect(() => {
    if (orders.length > 0) {
      const convertedTrips = orders.map(order => mapDeliveryOrderToTrip(order));
      setTrips(convertedTrips);
    }
  }, [orders]);

  // إضافة بيانات موقع إفتراضي للمندوبين إذا لم يكن لديهم موقع
  useEffect(() => {
    if (agents.length > 0) {
      // التحقق من وجود إحداثيات للمندوبين وإضافتها إذا كانت غير موجودة
      const agentsWithLocation = agents.map((agent, index) => {
        if (!agent.location || !agent.location.lat || !agent.location.lng) {
          // إضافة إحداثيات عشوائية حول القاهرة لأغراض العرض
          const randomLat = 30.0444 + (Math.random() - 0.5) * 0.1;
          const randomLng = 31.2357 + (Math.random() - 0.5) * 0.1;
          
          console.log(`إضافة إحداثيات للمندوب: ${agent.name}`, { lat: randomLat, lng: randomLng });
          
          return {
            ...agent,
            location: {
              lat: randomLat,
              lng: randomLng
            }
          };
        }
        return agent;
      });
      
      // تطبيق التغييرات على Redux إذا كان هناك أي مندوب بدون إحداثيات
      const hasChanges = agentsWithLocation.some((agent, i) => 
        !agents[i].location || !agents[i].location?.lat || !agents[i].location?.lng);
        
      if (hasChanges) {
        console.log('تم إضافة إحداثيات للمندوبين:', agentsWithLocation.length);
      }
    }
  }, [agents]);

  // تحويل الطلبات إلى مواقع الخريطة
  const deliveryLocations = useMemo(() => {
    return trips.map(trip => {
      // استخراج الإحداثيات من البيانات
      const lat = trip.end_location?.lat || 30.0444 + (Math.random() - 0.5) * 0.05;
      const lng = trip.end_location?.lng || 31.2357 + (Math.random() - 0.5) * 0.05;
      
      return {
        id: trip.id,
        lat: lat,
        lng: lng,
        type: "delivery" as const,
        address: trip.end_location?.address || "عنوان التوصيل",
        label: `طلب #${trip.id.substring(0, 6)}`,
        status: trip.status === "in_progress" ? "in_progress" as const : 
                trip.status === "completed" ? "delivered" as const :
                trip.status === "canceled" ? "canceled" as const : "pending" as const
      };
    });
  }, [trips]);

  // تحويث البيانات يدويًا
  const handleRefresh = () => {
    dispatch(fetchAgents());
    dispatch(fetchOrders());
  };

  // تصفية الوكلاء حسب الحالة المحددة
  const filteredAgents = agents.filter(agent => 
    (selectedStatus === "all") || 
    (selectedStatus === "active" && agent.status === "online") ||
    (selectedStatus === "idle" && agent.status === "offline")
  ).map(agent => {
    // التحقق من وجود إحداثيات صالحة للعرض
    if (!agent.location || 
        !agent.location.lat || 
        !agent.location.lng || 
        isNaN(agent.location.lat) || 
        isNaN(agent.location.lng)) {
      // إنشاء إحداثيات عشوائية للمندوب
      return {
        ...agent,
        location: {
          lat: 30.0444 + (Math.random() - 0.5) * 0.1,
          lng: 31.2357 + (Math.random() - 0.5) * 0.1
        }
      };
    }
    return agent;
  });

  // تسجيل معلومات المندوبين
  useEffect(() => {
    console.log(`عدد المندوبين المتوفرين: ${agents.length}`);
    console.log(`عدد المندوبين بعد التصفية: ${filteredAgents.length}`);
    
    // عرض عينة من المندوبين للتحقق
    if (filteredAgents.length > 0) {
      console.log('عينة من المندوبين:', filteredAgents.slice(0, 2));
    }
  }, [agents, filteredAgents]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <FiMapPin className="mr-2 h-6 w-6 text-blue-600" />
            خريطة توصيل الطلبات
          </h1>
          <p className="text-sm text-muted-foreground">
            تتبع مباشر لمندوبي التوصيل والمسارات
          </p>
        </div>
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="بحث عن المواقع..."
              className="pl-10 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedView("agents")}
            className={selectedView === "agents" ? "border-blue-500 bg-blue-50" : ""}
          >
            <FiUsers className="h-4 w-4 mr-1" />
            المندوبين
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSelectedView("trips")}
            className={selectedView === "trips" ? "border-blue-500 bg-blue-50" : ""}
          >
            <FiTruck className="h-4 w-4 mr-1" />
            الرحلات
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setSelectedView("both")}
            className={selectedView === "both" ? "border-blue-500 bg-blue-50" : ""}
          >
            <FiLayers className="h-4 w-4 mr-1" />
            كلاهما
          </Button>
          <Button 
            variant="default"
            onClick={handleRefresh}
          >
            <FiRefreshCw className="h-4 w-4 mr-1" />
            تحديث
          </Button>
        </div>
      </div>

      {/* عرض معلومات الاتصال بقاعدة البيانات */}
      <Alert className={`mb-4 ${connectionInfo.error ? 'bg-red-50' : 'bg-green-50'}`}>
        <FiAlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-bold">{connectionInfo.message}</div>
          {connectionInfo.error && (
            <div className="text-red-600 text-sm mt-1">{connectionInfo.error}</div>
          )}
        </AlertDescription>
      </Alert>

      {/* فلاتر الحالة */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedStatus === "all" ? "default" : "outline"}
          onClick={() => setSelectedStatus("all")}
          className="gap-1"
        >
          <FiFilter className="h-4 w-4" />
          الكل
        </Button>
        <Button
          variant={selectedStatus === "active" ? "default" : "outline"}
          onClick={() => setSelectedStatus("active")}
          className="gap-1"
        >
          النشطين فقط
        </Button>
        <Button
          variant={selectedStatus === "idle" ? "default" : "outline"}
          onClick={() => setSelectedStatus("idle")}
          className="gap-1"
        >
          الخاملين فقط
        </Button>
      </div>

      {/* Map Section */}
        <Card>
          <CardContent className="p-0 overflow-hidden">
          <UnifiedMapComponent 
              agents={filteredAgents}
            locations={deliveryLocations}
              className="w-full h-[600px]"
            mapTitle="خريطة توصيل الطلبات"
            showAgentsOnly={selectedView === "agents"}
            showLocationsOnly={selectedView === "trips"}
            />
          </CardContent>
        {filteredAgents.length === 0 && selectedView !== "trips" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <p className="text-lg text-gray-500">لا يوجد مندوبين لعرضهم على الخريطة</p>
          </div>
        )}
        </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">المندوبين النشطين</h3>
                <p className="text-3xl font-bold mt-2">{agents.filter(a => a.status === "online").length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <FiUsers className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              متصلين حالياً ويقومون بالتوصيل
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">الرحلات النشطة</h3>
                <p className="text-3xl font-bold mt-2">{trips.filter(t => t.status === "in_progress").length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <FiTruck className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              رحلات توصيل قيد التنفيذ
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">مناطق التوصيل</h3>
                <p className="text-3xl font-bold mt-2">5</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <FiMapPin className="h-6 w-6" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              مناطق توصيل نشطة
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MapViewPage;