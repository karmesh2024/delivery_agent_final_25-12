"use client";
import { useState, useEffect } from "react";
import ClientOnly from "@/core/components/ClientOnly";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { StatCard } from "@/shared/components/dashboard/StatCard";
import { FilterTabs } from "@/shared/components/filters/FilterTabs";
import { AgentGridView } from "@/domains/agents/components/AgentGridView";
import { AgentStatusFilter } from "@/domains/agents/components/AgentStatusFilter";
import { AgentMapAlternate } from "@/domains/mapping/components/AgentMapAlternate";
import { MapViewAlternate } from "@/domains/mapping/components/MapViewAlternate";
import { DeliveryLocation } from "@/domains/mapping/types";
import { AgentDetail } from "@/domains/agents/components/AgentDetail";
import { OrderDetail } from "@/domains/orders/components/OrderDetail";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Agent, AgentStatus, Order, OrderStats, TaskStatus } from "@/types";
import { getAgents, getOrderStats, getDeliveryOrders } from "@/lib/supabase";
import { toast } from "sonner";
import {
  FiClock,
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiCheckCircle,
  FiAlertTriangle,
  FiAward,
  FiUsers,
  FiMap
} from "react-icons/fi";
import { IconType } from "react-icons";

export default function HomePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
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

  useEffect(() => {
    // تحويل حالة الطلب من نظام التوصيل إلى حالات نظام الإدارة
    function mapDeliveryStatusToOrderStatus(status: string): 'pending' | 'in_progress' | 'delivered' | 'canceled' | 'confirmed' {
      switch (status?.toLowerCase()) {
        case 'pending':
          return 'pending';
        case 'confirmed':
          return 'confirmed';
        case 'assigned':
        case 'in_progress':
          return 'in_progress';
        case 'completed':
        case 'delivered':
          return 'delivered';
        case 'cancelled':
        case 'canceled':
          return 'canceled';
        default:
          return 'pending';
      }
    }
    
    async function loadDashboardData() {
      try {
        setLoading(true);
        // جلب بيانات المندوبين
        const agentsData = await getAgents();
        setAgents(agentsData);
        
        // جلب إحصائيات الطلبات
        const orderStatsData = await getOrderStats();
        setStats(orderStatsData);
        
        // جلب بيانات الطلبات الحقيقية باستخدام getDeliveryOrders
        const deliveryOrdersData = await getDeliveryOrders();
        console.log("تم جلب الطلبات من قاعدة البيانات:", deliveryOrdersData.length);
        
        // تحويل DeliveryOrder إلى Order
        const mappedOrders = deliveryOrdersData.map(order => ({
          id: order.id,
          status: mapDeliveryStatusToOrderStatus(order.status || "pending"),
          created_at: order.created_at,
          updated_at: order.updated_at,
          customer_name: order.customer_name || "العميل",
          customer_address: order.pickup_address || "",
          customer_phone: order.customer_phone || "",
          items: [], // سيتم ملؤها لاحقاً إذا لزم الأمر
          total: order.expected_total_amount || 0,
          agent_id: order.delivery_boy_id || null,
          delivery_time: order.estimated_time,
          delivery_location: order.delivery_location,
          delivery_address: order.delivery_address,
          pickup_address: order.pickup_address
        }));
        
        setOrders(mappedOrders);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    
    loadDashboardData();
  }, []);

  // تحويل حالة الطلب من نظام الطلبات إلى نظام المواقع على الخريطة
  const mapOrderStatusToDeliveryLocationStatus = (status: Order['status']): 'pending' | 'in_progress' | 'delivered' | 'canceled' => {
    if (status === 'pending' || status === 'confirmed' || status === 'scheduled') {
      return 'pending';
    } else if (status === 'in_progress' || status === 'pickedUp' || status === 'inReceipt') {
      return 'in_progress';
    } else if (status === 'completed' || status === 'delivered') {
      return 'delivered';
    } else if (status === 'canceled' || status === 'cancelled' || status === 'returned') {
      return 'canceled';
    }
    return 'pending'; // الحالة الافتراضية
  };

  const filteredAgents = agents.filter(agent => {
    if (selectedAgentStatus === "all") return true;
    return agent.status === selectedAgentStatus;
  });

  const filteredOrders = orders.filter(order => {
    if (activeOrderTab === "all") return true;
    if (activeOrderTab === "pending") return order.status === "pending";
    if (activeOrderTab === "in_progress") return order.status === "in_progress";
    if (activeOrderTab === "delivered") return order.status === "delivered";
    if (activeOrderTab === "canceled") return order.status === "canceled";
    return true;
  });

  // تحويل الطلبات إلى مواقع للخريطة باستخدام إحداثيات حقيقية إن وجدت
  const deliveryLocations: DeliveryLocation[] = orders.map(order => {
    // إذا كان الطلب يحتوي على إحداثيات تسليم حقيقية، نستخدمها
    if (order.delivery_location && typeof order.delivery_location === 'string') {
      // محاولة استخراج الإحداثيات من النص
      try {
        // نموذج الإحداثيات: "POINT(31.2357 30.0444)"
        const match = order.delivery_location.match(/POINT\(([0-9.-]+) ([0-9.-]+)\)/);
        if (match && match.length === 3) {
          return {
            id: order.id,
            lat: parseFloat(match[2]), // الترتيب معكوس في PostgreSQL: lng ثم lat
            lng: parseFloat(match[1]),
            status: mapOrderStatusToDeliveryLocationStatus(order.status),
            address: order.customer_address || order.delivery_address || "",
            type: "delivery" as const,
            label: `Order #${order.id.substring(0, 6).toUpperCase()}`
          };
        }
      } catch (e) {
        console.error("خطأ في استخراج الإحداثيات:", e);
      }
    }
    
    // إذا لم يكن لدينا إحداثيات أو حدث خطأ في استخراجها، نستخدم إحداثيات ثابتة + مؤشر الصف
    const orderIndex = parseInt(order.id.substring(0, 8), 16) % 100 / 1000; 
    return {
      id: order.id,
      lat: 30.0444 + orderIndex,
      lng: 31.2357 + orderIndex,
      status: mapOrderStatusToDeliveryLocationStatus(order.status),
      address: order.customer_address || order.delivery_address || "",
      type: "delivery" as const,
      label: `Order #${order.id.substring(0, 6).toUpperCase()}`
    };
  });
  const agentStatusCounts = {
    all: agents.length,
    online: agents.filter(agent => agent.status === "online").length,
    offline: agents.filter(agent => agent.status === "offline").length,
    busy: agents.filter(agent => agent.status === "busy").length,
  };
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500 text-white";
      case "in_progress": return "bg-blue-500 text-white";
      case "delivered": return "bg-green-500 text-white";
      case "canceled": return "bg-red-500 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  // تنسيق التاريخ فقط على جانب العميل لتجنب مشاكل عدم التوافق بين الخادم والعميل
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // تنفيذ تنسيق التاريخ فقط على جانب العميل
    const formatDateClient = (dateStr: string) => {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };
    
    // تنسيق تواريخ الطلبات
    const dates: Record<string, string> = {};
    orders.forEach(order => {
      dates[order.id] = formatDateClient(order.created_at);
    });
    
    setFormattedDates(dates);
  }, [orders]);

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
  
  // تعريف متغير للقيم المبدئية بدون بيانات متغيرة لتجنب أخطاء Hydration
  const initialMetrics: KeyMetric[] = [
    {
      title: "Delivery Agents",
      value: "...",
      icon: FiUsers,
      iconClassName: "bg-indigo-100 text-indigo-600"
      // حذف خاصية change تماماً
    },
    {
      title: "Avg. Delivery Time",
      value: "...",
      icon: FiClock,
      iconClassName: "bg-blue-100 text-blue-600"
      // حذف خاصية change تماماً
    },
    {
      title: "Pending Orders",
      value: "...",
      icon: FiPackage,
      iconClassName: "bg-amber-100 text-amber-600"
      // حذف خاصية change تماماً
    },
    {
      title: "Delivered Today",
      value: "...",
      icon: FiCheckCircle,
      iconClassName: "bg-green-100 text-green-600"
      // حذف خاصية change تماماً
    }
  ];
  
  // متغير حالة لتخزين قيم الإحصائيات النهائية
  const [keyMetrics, setKeyMetrics] = useState<KeyMetric[]>(initialMetrics);
  
  // تحديث الإحصائيات على جانب العميل فقط
  useEffect(() => {
    if (agents.length > 0 || stats.total > 0) {
      setKeyMetrics([
    {
      title: "Delivery Agents",
      value: agents.length,
      icon: FiUsers,
      iconClassName: "bg-indigo-100 text-indigo-600",
      change: {
        value: agentStatusCounts.online,
        trend: "neutral"
      }
    },
    {
      title: "Avg. Delivery Time",
      value: `${stats.avg_delivery_time} min`,
      icon: FiClock,
      iconClassName: "bg-blue-100 text-blue-600",
      change: {
        value: 5,
        trend: "down"
      }
    },
    {
      title: "Pending Orders",
      value: stats.pending,
      icon: FiPackage,
      iconClassName: "bg-amber-100 text-amber-600",
      change: {
        value: 12,
        trend: "up"
      }
    },
    {
      title: "Delivered Today",
      value: stats.delivered,
      icon: FiCheckCircle,
      iconClassName: "bg-green-100 text-green-600",
      change: {
        value: 8,
        trend: "up"
      }
    }
      ]);
    }
  }, [agents.length, stats, agentStatusCounts.online]);

  // القيم الافتراضية للتبويبات بدون عدادات لتجنب عدم التوافق بين الخادم والعميل
  const initialOrderTabs = [
    { id: "all", label: "All Orders", count: 0 },
    { id: "pending", label: "Pending", count: 0, icon: <FiPackage className="h-4 w-4" /> },
    { id: "in_progress", label: "In Progress", count: 0, icon: <FiTruck className="h-4 w-4" /> },
    { id: "delivered", label: "Delivered", count: 0, icon: <FiCheckCircle className="h-4 w-4" /> },
    { id: "canceled", label: "Canceled", count: 0, icon: <FiAlertTriangle className="h-4 w-4" /> }
  ];

  // القيم الافتراضية لتبويبات حالة المندوبين
  const initialAgentStatuses = [
    { id: "all" as AgentStatus, label: "All Agents", count: 0 },
    { id: "online" as AgentStatus, label: "Online", count: 0 },
    { id: "busy" as AgentStatus, label: "Busy", count: 0 },
    { id: "offline" as AgentStatus, label: "Offline", count: 0 }
  ];
  
  // متغيرات الحالة للتبويبات
  const [orderTabs, setOrderTabs] = useState(initialOrderTabs);
  const [agentStatuses, setAgentStatuses] = useState(initialAgentStatuses);
  
  // تحديث تبويبات الطلبات وحالة المندوبين بعد تحميل البيانات على جانب العميل فقط
  useEffect(() => {
    if (stats.total > 0 || agents.length > 0) {
      setOrderTabs([
        { id: "all", label: "All Orders", count: stats.total },
        { id: "pending", label: "Pending", count: stats.pending, icon: <FiPackage className="h-4 w-4" /> },
        { id: "in_progress", label: "In Progress", count: stats.in_progress, icon: <FiTruck className="h-4 w-4" /> },
        { id: "delivered", label: "Delivered", count: stats.delivered, icon: <FiCheckCircle className="h-4 w-4" /> },
        { id: "canceled", label: "Canceled", count: stats.canceled, icon: <FiAlertTriangle className="h-4 w-4" /> }
      ]);
      
      setAgentStatuses([
        { id: "all" as AgentStatus, label: "All Agents", count: agentStatusCounts.all },
        { id: "online" as AgentStatus, label: "Online", count: agentStatusCounts.online },
        { id: "busy" as AgentStatus, label: "Busy", count: agentStatusCounts.busy },
        { id: "offline" as AgentStatus, label: "Offline", count: agentStatusCounts.offline }
      ]);
    }
  }, [stats, agents.length, agentStatusCounts]);

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8" suppressHydrationWarning>
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

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Delivery Agent Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
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
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiMap className="mr-2 h-5 w-5 text-green-600" />
                  Agent Locations
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAlternateMap(!showAlternateMap)}
                >
                  {showAlternateMap ? "Simple Map" : "Detailed Map"}
                </Button>
              </div>
              
              <div className="h-[400px]">
                {showAlternateMap ? (
                  <MapViewAlternate 
                    agents={filteredAgents}
                    locations={deliveryLocations}
                    className="h-full rounded-md overflow-hidden"
                    onAgentClick={handleAgentClick}
                    onLocationClick={(location) => {
                      const order = orders.find(o => o.id === location.id);
                      if (order) handleOrderClick(order);
                    }}
                  />
                ) : (
                  <AgentMapAlternate 
                    agents={filteredAgents}
                    className="h-full rounded-md overflow-hidden"
                    onAgentClick={handleAgentClick}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow p-6">
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
                          <p className="text-sm text-gray-500">{formattedDates[order.id] || order.created_at}</p>
                        </ClientOnly>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-gray-500 truncate">{order.customer_address}</div>
                      <div className="mt-2">
                        <div className="flex justify-between text-gray-500">
                          <span>Items:</span>
                          <span>{order.items?.length || 0}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>${order.total?.toFixed(2) || '0.00'}</span>
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
        
        {/* Detail Component Dialogs */}
        {selectedAgent && (
          <AgentDetail 
            agent={selectedAgent} 
            open={!!selectedAgent} 
            onClose={() => setSelectedAgent(null)} 
          />
        )}
        
        {selectedOrder && (
          <OrderDetail 
            order={selectedOrder} 
            open={!!selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </div>
    </DashboardLayout>
  );
}