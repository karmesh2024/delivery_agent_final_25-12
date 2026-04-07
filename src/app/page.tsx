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
import { getAgents, getOrderStats, getDeliveryOrders } from "@/lib/supabase";
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

  // تحديث الطلبات من Redux عندما تتغير
  useEffect(() => {
    if (ordersFromRedux.length > 0) {
      setOrders(ordersFromRedux as unknown as Order[]);
      setLoading(false);
    }
  }, [ordersFromRedux]);

  // استخدام حالة التحميل من Redux مباشرة
  if (reduxLoading && !reduxIsAuthenticated) {
    return (
      <ClientOnly>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">جاري التحقق من المصادقة...</p>
          </div>
        </div>
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
      title: "Delivery Agents",
      value: agentsFromRedux.length,
      icon: FiUsers,
      iconClassName: "bg-blue-500/10 text-blue-500",
      change: {
        value: agentStatusCounts.online,
        trend: "neutral"
      }
    },
    {
      title: "Avg. Delivery Time",
      value: `${stats.avg_delivery_time} min`,
      icon: FiClock,
      iconClassName: "bg-emerald-500/10 text-emerald-500",
      change: {
        value: 5,
        trend: "down"
      }
    },
    {
      title: "Pending Orders",
      value: stats.pending,
      icon: FiPackage,
      iconClassName: "bg-amber-500/10 text-amber-500",
      change: {
        value: 12,
        trend: "up"
      }
    },
    {
      title: "Delivered Today",
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
    { id: "all", label: "All Orders", count: stats.total },
    { id: "pending", label: "Pending", count: stats.pending, icon: <FiPackage className="h-4 w-4" /> },
    { id: "in_progress", label: "In Progress", count: stats.in_progress, icon: <FiTruck className="h-4 w-4" /> },
    { id: "delivered", label: "Delivered", count: stats.delivered, icon: <FiCheckCircle className="h-4 w-4" /> },
    { id: "canceled", label: "Canceled", count: stats.canceled, icon: <FiAlertTriangle className="h-4 w-4" /> }
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
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FiRefreshCw className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium">مزامنة الكتالوج الأولية (مؤقت)</span>
            </div>
            <div className="flex items-center gap-2">
              {syncResult && (
                <span className="text-xs text-muted-foreground">
                  مُزامَن: {syncResult.synced} | فشل: {syncResult.failed} | مُتخطّى: {syncResult.skipped}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncCatalog}
                disabled={syncLoading}
              >
                {syncLoading ? 'جاري المزامنة...' : 'تشغيل المزامنة'}
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
            <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold flex items-center">
                    <FiUsers className="mr-2 h-5 w-5 text-blue-600" />
                    Delivery Agents
                  </h2>
                  <p className="text-sm text-muted-foreground">Manage and track your delivery agents</p>
                </div>
                <AgentStatusFilter
                  statuses={agentStatuses}
                  activeStatus={selectedAgentStatus}
                  onStatusChange={setSelectedAgentStatus}
                />
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-muted-foreground">Loading agents...</p>
                </div>
              ) : filteredAgents.length > 0 ? (
                <AgentGridView 
                  agents={filteredAgents}
                  onAgentClick={handleAgentClick}
                />
              ) : (
                <div className="flex justify-center items-center h-40">
                  <p className="text-muted-foreground">No agents found with the selected status.</p>
                </div>
              )}
            </div>
          </div>

          {/* Map Section */}
          <div>
            <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiMap className="mr-2 h-5 w-5 text-green-600" />
                  {showAlternateMap ? "Delivery Locations" : "Agent Locations"}
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAlternateMap(!showAlternateMap)}
                >
                  {showAlternateMap ? "Show Agent Map" : "Show Location Map"}
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
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold flex items-center">
                <FiShoppingBag className="mr-2 h-5 w-5 text-purple-600" />
                Recent Orders
              </h2>
              <p className="text-sm text-muted-foreground">View and manage delivery orders</p>
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
                <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOrderClick(order)}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">Order #{order.id.substring(0, 6).toUpperCase()}</h3>
                        <ClientOnly fallback={<p className="text-sm text-gray-500">...</p>}>
                          <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                        </ClientOnly>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status ? order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown'}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-gray-500 truncate">{order.customer_address}</div>
                      <div className="mt-2">
                        <div className="flex justify-between text-gray-500">
                          <span>Items:</span>
                          <span>{order.order_details?.length || 0}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>{safeFormatCurrency(order.total_amount || 0)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                      <Button size="sm" variant="outline" className="text-xs h-7">View Details</Button>
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