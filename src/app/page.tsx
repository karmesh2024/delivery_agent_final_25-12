'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import ClientOnly from "@/core/components/ClientOnly";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { StatCard } from "@/shared/components/dashboard/StatCard";
import { FilterTabs } from "@/shared/components/filters/FilterTabs";
import { AgentGridView } from "@/components/AgentGridView";
import { AgentStatusFilter } from "@/components/AgentStatusFilter";
import { UnifiedMapComponent } from "@/domains/mapping/components/UnifiedMapComponent";
import { DeliveryLocation } from "@/domains/mapping/types";
import { AgentDetail } from "@/components/AgentDetail";
import OrderDetail from "@/components/OrderDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Agent, AgentStatus, Order, OrderStats } from "@/types";
import { toast } from "sonner";
import {
  FiClock,
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiCheckCircle,
  FiAlertTriangle,
  FiUsers,
  FiMap,
  FiDollarSign,
  FiBox,
  FiTrendingUp,
  FiSettings,
  FiRefreshCw
} from "react-icons/fi";
import { IconType } from "react-icons";
import { safeFormatCurrency } from "@/lib/utils";

import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/shared/components/ui/table";
import { OrderStats as OrderStatsType } from '@/types/index';
import { Order as OrderType } from '@/types/index';
import { RootState } from '@/store';
import { fetchAgents } from '@/store/agentsSlice';
import { fetchOrders } from '@/store/ordersSlice';
import Link from 'next/link';
import DiscoveryFeed from "@/domains/zoon-os/components/DiscoveryFeed";

/**
 * الصفحة الرئيسية للتطبيق (لوحة القيادة)
 * تتحقق من مصادقة المستخدم وتعرض لوحة القيادة للمستخدم المصادق
 * أو توجه المستخدم غير المصادق إلى صفحة تسجيل الدخول
 */
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated: reduxIsAuthenticated, loading: reduxLoading } = useAppSelector((state) => state.auth);
  const { items: agentsFromRedux } = useAppSelector((state) => state.agents);
  const { items: ordersFromRedux } = useAppSelector((state) => state.orders);
  
  // تعريف جميع حالات المكون في الأعلى (قبل أي return)
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    avg_delivery_time: 0,
    pending: 0,
    total: 0,
    in_progress: 0,
    delivered: 0,
    canceled: 0,
    excellent_trips: 0
  });
  const [selectedAgentStatus, setSelectedAgentStatus] = useState<AgentStatus>("all");
  const [activeOrderTab, setActiveOrderTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAlternateMap, setShowAlternateMap] = useState(false);
  // زر مؤقت - مزامنة الكتالوج الأولية - احذف هذا السطر والسطر التالي بعد المزامنة
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number; skipped: number } | null>(null);

  const dispatch = useAppDispatch();

  // تحديد المندوبين المصفاة
  const filteredAgents = useMemo(() => {
    if (!agentsFromRedux) return [];
    return agentsFromRedux.filter(agent => {
      if (selectedAgentStatus === "all") return true;
      return agent.status === selectedAgentStatus;
    });
  }, [agentsFromRedux, selectedAgentStatus]);

  // تحديد الطلبات المصفاة
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    return orders.filter(order => {
      if (activeOrderTab === "all") return true;
      
      // التحقق من حالة الطلب بطريقة أكثر مرونة
      const orderStatus = String(order.status || '').toLowerCase();
      
      if (activeOrderTab === "pending") return orderStatus.includes('pending') || orderStatus.includes('انتظار');
      if (activeOrderTab === "in_progress") return orderStatus.includes('progress') || orderStatus.includes('تنفيذ');
      if (activeOrderTab === "delivered") return orderStatus.includes('delivered') || orderStatus.includes('توصيل');
      if (activeOrderTab === "canceled") return orderStatus.includes('canceled') || orderStatus.includes('ملغي');
      
      return true;
    });
  }, [orders, activeOrderTab]);

  // هذا useEffect سيعالج التوجيه بمجرد تحديث حالة المصادقة في Redux
  useEffect(() => {
    if (!reduxLoading) { // تأكد من أن التحقق الأولي قد تم بواسطة AuthProvider
      if (!reduxIsAuthenticated) {
        router.push('/login');
      }
    }
  }, [reduxIsAuthenticated, reduxLoading, router]);

  // جلب البيانات فقط إذا كان المستخدم مصادقًا
  useEffect(() => {
    if (reduxIsAuthenticated) {
      setLoading(true);
      dispatch(fetchAgents());
      dispatch(fetchOrders());
    }
  }, [reduxIsAuthenticated, dispatch]);

  // تحديث حالة التحميل عندما تصل بيانات المندوبين
  useEffect(() => {
    if (agentsFromRedux.length > 0) {
      setLoading(false);
    }
  }, [agentsFromRedux]);

  // تحديث الطلبات من Redux عندما تتغير وحساب الإحصائيات
  useEffect(() => {
    if (ordersFromRedux && ordersFromRedux.length > 0) {
      const typedOrders = ordersFromRedux as unknown as Order[];
      setOrders(typedOrders);
      
      // حساب الإحصائيات من الطلبات مباشرة
      const newStats: OrderStats = {
        total: typedOrders.length,
        pending: typedOrders.filter(o => o.status === 'pending').length,
        in_progress: typedOrders.filter(o => o.status === 'in_progress').length,
        delivered: typedOrders.filter(o => o.status === 'delivered').length,
        canceled: typedOrders.filter(o => o.status === 'canceled').length,
        avg_delivery_time: 25, // قيمة افتراضية أو يمكن حسابها إذا توفرت البيانات
        excellent_trips: typedOrders.filter(o => o.status === 'delivered').length // مجرد مثال
      };
      setStats(newStats);
      setLoading(false);
    }
  }, [ordersFromRedux]);

  // استخدام حالة التحميل من Redux مباشرة
  // تحسين وضع التحميل ليكون متوافقاً مع الاختبارات الآلية (TC004)
  if (reduxLoading && !reduxIsAuthenticated) {
    return (
      <ClientOnly>
        <DashboardLayout title="لوحة القيادة">
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card h-32 animate-pulse-slow rounded-3xl" />
              ))}
            </div>
            <div className="flex items-center justify-center h-96 glass-card rounded-3xl border-dashed border-2">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-t-primary border-primary/20 rounded-full animate-spin mx-auto mb-6 shadow-[0_0_20px_rgba(var(--glow-primary))]"></div>
                <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">جاري تفعيل لوحة القيادة الفاخرة...</p>
                <p className="text-muted-foreground mt-2">نحن نجهز لك تجربة استثنائية</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ClientOnly>
    );
  }

  // إذا لم يكن المستخدم مصادقًا ولا يوجد تحميل، سيتم التوجيه بواسطة AuthProvider
  if (!reduxIsAuthenticated && !reduxLoading) {
    return null; // أو أي عنصر احتياطي إذا كنت ترغب في عرض شيء آخر مؤقتًا
  }

  // تحويل حالة الطلب إلى حالة موقع التوصيل
  function mapOrderStatusToLocationStatus(status: string): 'pending' | 'in_progress' | 'delivered' | 'canceled' {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 'pending';
      case 'in_progress':
        return 'in_progress';
      case 'delivered':
        return 'delivered';
      case 'canceled':
        return 'canceled';
      default:
        return 'pending';
    }
  }

  // تحويل الطلبات إلى مواقع للخريطة - استخدام إحداثيات ثابتة دائمًا للتوافق بين الخادم والعميل
  const deliveryLocations: DeliveryLocation[] = orders.map(order => {
    // محاولة استخراج الإحداثيات من البيانات إن وجدت
    if (order.delivery_location && typeof order.delivery_location === 'string') {
      try {
        const locString = order.delivery_location as string; // Explicit cast
        const match = locString.match(/POINT\\(([0-9.-]+) ([0-9.-]+)\\)/);
        if (match && match.length === 3) {
          return {
            id: order.id,
            lat: parseFloat(match[2]),
            lng: parseFloat(match[1]),
            status: mapOrderStatusToLocationStatus(order.status),
            address: order.customer_address || order.delivery_address || "",
            type: "delivery" as const,
            label: `Order #${order.id.substring(0, 6).toUpperCase()}`
          };
        }
      } catch (e) {
        console.error("Error extracting coordinates:", e);
      }
    }
    
    // استخدام إحداثيات ثابتة دائمًا للتوافق بين الخادم والعميل
    return {
      id: order.id,
      lat: 30.0444,
      lng: 31.2357,
      status: mapOrderStatusToLocationStatus(order.status),
      address: order.customer_address || order.delivery_address || "",
      type: "delivery" as const,
      label: `Order #${order.id.substring(0, 6).toUpperCase()}`
    };
  });

  const agentStatusCounts = {
    all: agentsFromRedux.length,
    online: agentsFromRedux.filter(agent => agent.status === "online").length,
    offline: agentsFromRedux.filter(agent => agent.status === "offline").length,
    busy: agentsFromRedux.filter(agent => agent.status === "busy").length,
  };

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  // زر مؤقت - مزامنة الكتالوج الأولية - احذف هذه الدالة بعد المزامنة
  const handleSyncCatalog = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/sync-catalog', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncResult({ synced: data.synced, failed: data.failed, skipped: data.skipped });
        toast.success(data.message || `مُزامَن: ${data.synced}، فشل: ${data.failed}، مُتخطّى: ${data.skipped}`);
      } else {
        toast.error(data.error || 'فشلت المزامنة');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء المزامنة');
    } finally {
      setSyncLoading(false);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-gray-100 text-gray-800"; // حالة افتراضية إذا كانت الحالة غير محددة
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('pending') || statusLower.includes('انتظار')) {
      return "bg-yellow-100 text-yellow-800";
    }
    if (statusLower.includes('progress') || statusLower.includes('تنفيذ')) {
      return "bg-blue-100 text-blue-800";
    }
    if (statusLower.includes('delivered') || statusLower.includes('توصيل')) {
      return "bg-green-100 text-green-800";
    }
    if (statusLower.includes('canceled') || statusLower.includes('ملغي')) {
      return "bg-red-100 text-red-800";
    }
    
    return "bg-gray-100 text-gray-800"; // حالة افتراضية لأي حالة غير معروفة
  };

  // تنسيق التاريخ بطريقة آمنة
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  // Define explicit type for key metrics
  type KeyMetric = {
    title: string;
    value: string | number;
    icon: IconType;
    iconClassName: string;
    change: {
      value: number;
      trend: "up" | "down" | "neutral";
    };
  };

  // Key metrics for the dashboard with proper typing
  const keyMetrics: KeyMetric[] = [
    {
      title: "مناديب التوصيل",
      value: agentsFromRedux.length,
      icon: FiUsers,
      iconClassName: "bg-blue-500/10 text-blue-500",
      change: {
        value: agentStatusCounts.online,
        trend: "neutral"
      }
    },
    {
      title: "متوسط وقت التوصيل",
      value: `${stats.avg_delivery_time} دقيقة`,
      icon: FiClock,
      iconClassName: "bg-emerald-500/10 text-emerald-500",
      change: {
        value: 5,
        trend: "down"
      }
    },
    {
      title: "طلبات بانتظار التأكيد",
      value: stats.pending,
      icon: FiPackage,
      iconClassName: "bg-amber-500/10 text-amber-500",
      change: {
        value: 12,
        trend: "up"
      }
    },
    {
      title: "تم تسليمه اليوم",
      value: stats.delivered,
      icon: FiCheckCircle,
      iconClassName: "bg-cyan-500/10 text-cyan-500",
      change: {
        value: 8,
        trend: "up"
      }
    }
  ];

  // Order tabs for filtering
  const orderTabs = [
    { id: "all", label: "الكل", count: stats.total },
    { id: "pending", label: "بانتظار التأكيد", count: stats.pending, icon: <FiPackage className="h-4 w-4" /> },
    { id: "in_progress", label: "قيد التنفيذ", count: stats.in_progress, icon: <FiTruck className="h-4 w-4" /> },
    { id: "delivered", label: "تم التوصيل", count: stats.delivered, icon: <FiCheckCircle className="h-4 w-4" /> },
    { id: "canceled", label: "ملغي", count: stats.canceled, icon: <FiAlertTriangle className="h-4 w-4" /> }
  ];

  // Agent status tabs
  const agentStatuses = [
    { id: "all" as AgentStatus, label: "All Agents", count: agentStatusCounts.all },
    { id: "online" as AgentStatus, label: "Online", count: agentStatusCounts.online },
    { id: "busy" as AgentStatus, label: "Busy", count: agentStatusCounts.busy },
    { id: "offline" as AgentStatus, label: "Offline", count: agentStatusCounts.offline }
  ];

  // Add dummy references if lines 485 or 489 errors persist without clear location
  const dummyItems = selectedOrder?.order_details;
  const dummyTotal = selectedOrder?.total_amount;

  return (
    <ClientOnly>
      <DashboardLayout
        title="Dashboard"
      >

        <div className="space-y-6">
        {/* زر مؤقت - مزامنة الكتالوج الأولية - احذف هذا القسم بالكامل بعد تشغيل المزامنة */}
        <Card className="glass-card overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                <FiRefreshCw className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-sm font-bold">مزامنة الكتالوج الذكية</span>
              <p className="text-xs text-muted-foreground hidden sm:block">قم بتحديث حالة الكتالوج لضمان تزامن الأسعار والمنتجات</p>
            </div>
            <div className="flex items-center gap-4">
              {syncResult && (
                <div className="text-xs font-medium px-3 py-1 bg-white/5 rounded-full border border-white/5">
                  تمت المزامنة: {syncResult.synced}
                </div>
              )}
              <Button
                size="sm"
                variant="default"
                onClick={handleSyncCatalog}
                disabled={syncLoading}
                className="premium-hover premium-gradient shadow-lg shadow-blue-500/20 border-0"
              >
                {syncLoading ? 'جاري المزامنة...' : 'مزامنة الآن'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyMetrics.map((metric, index) => (
            <StatCard
              key={index}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              iconClassName={metric.iconClassName}
              change={metric.change}
            />
          ))}
        </div>

        {/* Proactive Intelligence - Zoon OS Pulse */}
        <div className="mb-6">
          <DiscoveryFeed />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Delivery Agent Section */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 mb-6 group">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-bold flex items-center glow-text">
                    <FiUsers className="ml-3 h-6 w-6 text-primary" />
                    مناديب التوصيل النشطين
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">تتبع حالة ومواقع المناديب في الوقت الفعلي</p>
                </div>
                <AgentStatusFilter
                  statuses={agentStatuses}
                  activeStatus={selectedAgentStatus}
                  onStatusChange={setSelectedAgentStatus}
                />
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-64 border-2 border-dashed border-white/5 rounded-3xl">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredAgents.length > 0 ? (
                <AgentGridView 
                  agents={filteredAgents}
                  onAgentClick={handleAgentClick}
                />
              ) : (
                <div className="flex flex-col justify-center items-center h-64 border-2 border-dashed border-white/5 rounded-3xl">
                  <FiUsers className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground font-medium">لا يوجد مناديب بهذه الحالة حالياً</p>
                </div>
              )}
            </div>
          </div>

          {/* Map Section */}
          <div>
            <div className="glass-card p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center glow-text">
                  <FiMap className="ml-3 h-6 w-6 text-emerald-500" />
                  {showAlternateMap ? "خارطة التوصيل" : "مواقع المناديب"}
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAlternateMap(!showAlternateMap)}
                  className="rounded-xl border-white/10 hover:bg-white/5"
                >
                  {showAlternateMap ? "عرض المندوبين" : "عرض الطلبات"}
                </Button>
              </div>
              
              <div className="h-[400px]">
                <ClientOnly>
                  {showAlternateMap && (
                    <UnifiedMapComponent 
                      key="delivery-locations-map-view"
                      agents={filteredAgents}
                      locations={deliveryLocations}
                      className="h-full rounded-md overflow-hidden"
                      onAgentClick={handleAgentClick}
                      onLocationClick={(location) => {
                        const order = orders.find(o => o.id === location.id);
                        if (order) handleOrderClick(order);
                      }}
                      showLocationsOnly={true}
                      mapTitle="مواقع التوصيل"
                    />
                  )}
                  {!showAlternateMap && (
                    <UnifiedMapComponent 
                      key="agent-only-map-view"
                      agents={filteredAgents}
                      locations={[]}
                      className="h-full rounded-md overflow-hidden"
                      onAgentClick={handleAgentClick}
                      showAgentsOnly={true}
                      mapTitle="مواقع المندوبين"
                    />
                  )}
                </ClientOnly>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-bold flex items-center glow-text">
                <FiShoppingBag className="ml-3 h-6 w-6 text-purple-500" />
                الطلبات الأخيرة
              </h2>
              <p className="text-sm text-muted-foreground mt-1">متابعة وإدارة عمليات التوصيل الحالية</p>
            </div>
          </div>

          <FilterTabs
            items={orderTabs}
            activeTab={activeOrderTab}
            onTabChange={setActiveOrderTab}
            className="mb-6"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <p className="text-center col-span-full py-6">Loading orders...</p>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.slice(0, 6).map((order) => (
                <Card 
                  key={order.id} 
                  className="glass-card premium-hover cursor-pointer border-white/5 overflow-hidden" 
                  onClick={() => handleOrderClick(order)}
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-base">طلب #{order.id.substring(0, 6).toUpperCase()}</h3>
                        <ClientOnly fallback={<p className="text-xs text-muted-foreground">...</p>}>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.created_at)}</p>
                        </ClientOnly>
                      </div>
                      <Badge className={`${getStatusColor(order.status)} rounded-full px-3 border-0`}>
                        {order.status ? order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'غير محدد'}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <div className="font-bold text-sm">{order.customer_name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{order.customer_address}</div>
                      
                      <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">الإجمالي:</div>
                        <div className="font-bold text-primary">{safeFormatCurrency(order.total_amount || 0)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center col-span-full py-6">No orders found with the selected status.</p>
            )}
          </div>
        </div>
        
        {/* Unregistered Customers Section */}
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center">
                <FiUsers className="mr-2 h-5 w-5 text-orange-600" />
                العملاء غير المسجلين
              </h2>
              <p className="text-sm text-muted-foreground">عرض وإدارة العملاء غير المسجلين في النظام</p>
            </div>
            <Button 
              onClick={() => router.push('/unregistered-customers')}
              variant="outline"
            >
              عرض الكل
            </Button>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-orange-500/20 p-3 rounded-full mr-4">
                <FiUsers className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-medium text-lg">العملاء غير المسجلين</h3>
                <p className="text-sm text-muted-foreground">عملاء قاموا بمعاملات مع الوكلاء المعتمدين ولكن ليس لديهم حسابات مسجلة</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/unregistered-customers')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              إدارة العملاء غير المسجلين
            </Button>
          </div>
        </div>
        
        {/* Detail Component Dialogs */}
        <div className="mt-6">
          {selectedAgent && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تفاصيل المندوب</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAgent(null)}>إغلاق</Button>
              </CardHeader>
              <CardContent>
                <AgentDetail agent={selectedAgent as Agent} onClose={() => setSelectedAgent(null)} />
              </CardContent>
            </Card>
          )}
          {selectedOrder && (
            <Card className="mt-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تفاصيل الطلب #{selectedOrder.order_number || selectedOrder.id.substring(0, 6).toUpperCase()}</CardTitle>
                <p className="text-sm text-muted-foreground">الإجمالي: {safeFormatCurrency(selectedOrder.total_amount || 0)}</p>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>إغلاق</Button>
              </CardHeader>
              <CardContent>
                <OrderDetail order={selectedOrder} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Card for Store Product Management */}
        <Link href="/settings/product-types">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إدارة أنواع المنتجات</CardTitle>
              <FiSettings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">الضبط والأنواع</div>
              <p className="text-xs text-muted-foreground">
                إدارة أنواع المنتجات وإضافة سمات ديناميكية.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </DashboardLayout>
    </ClientOnly>
  );
}