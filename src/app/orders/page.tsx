/**
 * صفحة الطلبات - معدلة لاستخدام هيكل DDD و Redux
 */

"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { Order, OrderStatus } from "@/types";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { FilterTabs } from "@/shared/components/filters/FilterTabs";
import { FiAlertCircle, FiSearch, FiFileText, FiRefreshCw, FiPackage, FiTruck, FiCheckCircle, FiAlertTriangle, FiShoppingBag, FiPlus } from "react-icons/fi";

// استيراد المكونات من الهيكل الجديد
import { OrdersGridView } from "@/components/OrdersGridView";
import OrderDetail from "@/components/OrderDetail";

// استيراد المكون المخصص للحوار
import OrderDetailsDialog from "@/shared/components/OrderDetailsDialog";

// استيراد Redux hooks وتحويلات البيانات
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOrders } from "@/store/ordersSlice";
import { mapDeliveryOrderToOrder } from "@/utils/orderMappers";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function OrdersPage() {
  // استخدام Redux لإدارة الحالة
  const dispatch = useAppDispatch();
  const { items: deliveryOrders, loading } = useAppSelector(state => state.orders);
  const isLoading = loading;

  // حالة محلية للتعامل مع التصفية والتفاصيل
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'grid' | 'table'>('grid');
  const [enableSort, setEnableSort] = useState(true);
  const [enableFilters, setEnableFilters] = useState(true);
  const [stats, setStats] = useState({
    delivered: 0,
    pending: 0,
    in_progress: 0,
    total: 0
  });
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

  // جلب بيانات الطلبات باستخدام Redux
  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // تحويل DeliveryOrder إلى Order
  useEffect(() => {
    if (deliveryOrders.length > 0) {
      const mappedOrders = deliveryOrders.map(order => mapDeliveryOrderToOrder(order));
      setOrders(mappedOrders);
    }
  }, [deliveryOrders]);

  // تحديث إحصائيات الطلبات
  useEffect(() => {
    if (orders.length > 0) {
      const delivered = orders.filter(order => order.status === 'delivered').length;
      const pending = orders.filter(order => order.status === 'pending').length;
      const inProgress = orders.filter(order => 
        order.status === 'in_progress' || 
        order.status === 'confirmed'
      ).length;
      
      setStats({
        delivered,
        pending,
        in_progress: inProgress,
        total: orders.length
      });
    } else {
      setStats({
        delivered: 0,
        pending: 0,
        in_progress: 0,
        total: 0
      });
    }
  }, [orders]);

  // تصفية الطلبات حسب الحالة والبحث
  useEffect(() => {
    let filtered = orders;
    
    // تصفية حسب الحالة
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }
    
    // تصفية حسب البحث
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        (order.id.toLowerCase().includes(query)) ||
        (order.customer_name?.toLowerCase().includes(query)) ||
        (order.customer_phone?.toLowerCase().includes(query)) ||
        (order.customer_address?.toLowerCase().includes(query))
      );
    }
    
    setFilteredOrders(filtered);
  }, [activeTab, orders, searchTerm]);

  // تحويل حالة التوصيل إلى حالة الطلب
  function mapDeliveryStatusToOrderStatus(status: string): 'pending' | 'in_progress' | 'delivered' | 'canceled' | 'confirmed' {
    switch (status) {
      case 'pending': return 'pending';
      case 'confirmed': return 'confirmed';
      case 'assigned': 
      case 'in_progress': return 'in_progress';
      case 'completed': return 'delivered';
      case 'canceled': return 'canceled';
      default: return 'pending';
    }
  }

  // معالجة اختيار طلب
  const handleOrderSelect = (order: Order) => {
    console.log("handleOrderSelect called with order:", order.id);
    console.log("Full order object being selected:", JSON.stringify(order, null, 2));
    setSelectedOrder(order);
    setIsDetailOpen(true);
    console.log("isDetailOpen set to:", true);
  };

  // معالجة تغيير التبويب مع حل مشكلة التوافق بين الأنواع
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as OrderStatus | 'all');
  };

  const orderTabs = [
    { id: "all", label: "جميع الطلبات", count: deliveryOrders.length },
    { id: "pending", label: "قيد الانتظار", count: deliveryOrders.filter(o => o.status === "pending").length, icon: <FiPackage className="h-4 w-4" /> },
    { id: "confirmed", label: "مؤكد", count: deliveryOrders.filter(o => o.status === "confirmed").length, icon: <FiCheckCircle className="h-4 w-4" /> },
    { id: "assigned", label: "تم التعيين", count: deliveryOrders.filter(o => o.status === "assigned").length, icon: <FiTruck className="h-4 w-4" /> },
    { id: "in_progress", label: "قيد التنفيذ", count: deliveryOrders.filter(o => o.status === "in_progress").length, icon: <FiTruck className="h-4 w-4" /> },
    { id: "completed", label: "مكتمل", count: deliveryOrders.filter(o => o.status === "completed").length, icon: <FiCheckCircle className="h-4 w-4" /> },
    { id: "canceled", label: "ملغي", count: deliveryOrders.filter(o => o.status === "canceled").length, icon: <FiAlertTriangle className="h-4 w-4" /> }
  ];

  return (
    <DashboardLayout title="الطلبات">
      <PermissionGuard 
        permissionCode="orders:view"
        fallback={<div>ليس لديك صلاحية لعرض الطلبات</div>}
      >
        <div className="space-y-8">
          {/* Header with Page Title and Description */}
          <div className="bg-gradient-to-l from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-6 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center text-blue-800 dark:text-blue-300">
                  <FiFileText className="mr-3 h-7 w-7 text-blue-600 dark:text-blue-400" />
                  طلبات التوصيل
                </h1>
                <p className="text-sm text-blue-700/70 dark:text-blue-400/70 mt-2 max-w-xl">
                  تتبع وإدارة جميع طلبات التوصيل بسهولة وكفاءة، مع إمكانية تصفية وترتيب البيانات حسب احتياجاتك
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="w-full sm:w-auto flex flex-wrap items-center gap-3">
                <div className="relative flex-1 sm:flex-initial">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
                  <Input 
                    placeholder="بحث عن طلبات..."
                    className="pl-10 pr-4 border-blue-200 dark:border-blue-800 focus:border-blue-500 min-w-[240px] bg-white/90 dark:bg-slate-900/90"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* View Toggle Button */}
                <Button 
                  variant="outline" 
                  onClick={() => setViewType(viewType === 'grid' ? 'table' : 'grid')}
                  className="gap-1 border-blue-200 hover:bg-blue-100 text-blue-700 dark:border-blue-800 dark:hover:bg-blue-900 dark:text-blue-300"
                  title={viewType === 'grid' ? 'عرض جدولي' : 'عرض شبكي'}
                >
                  {viewType === 'grid' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  )}
                  <span className="hidden sm:inline mr-1">
                    {viewType === 'grid' ? 'جدول' : 'شبكة'}
                  </span>
                </Button>
                
                {/* Refresh Button */}
                <Button 
                  variant="default" 
                  onClick={() => dispatch(fetchOrders())}
                  className="gap-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  <FiRefreshCw className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">تحديث</span>
                </Button>

                {/* Add Create Order Button */}
                <PermissionGuard permissionCode="orders:create">
                  <Button 
                    variant="default"
                    className="gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    // onClick={handleCreateOrderClick} // Placeholder for future action
                  >
                    <FiPlus className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">إنشاء طلب</span>
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </div>
          
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-100 dark:border-green-900 flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400">تم التوصيل</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">{stats.delivered}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-800/50 p-3 rounded-full">
                <FiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900 flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">قيد الانتظار</p>
                <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">{stats.pending}</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-800/50 p-3 rounded-full">
                <FiPackage className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900 flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400">قيد التنفيذ</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{stats.in_progress}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-800/50 p-3 rounded-full">
                <FiTruck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-100 dark:border-purple-900 flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-400">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{stats.total}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-800/50 p-3 rounded-full">
                <FiShoppingBag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          
          {/* عرض معلومات الاتصال بقاعدة البيانات */}
          {connectionInfo.error ? (
            <Alert className="bg-red-50 border border-red-200 text-red-800">
              <FiAlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription>
                <div className="font-bold">{connectionInfo.message}</div>
                <div className="text-red-600 text-sm mt-1">{connectionInfo.error}</div>
              </AlertDescription>
            </Alert>
          ) : null}
          
          {/* Order Tabs */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">تصفية الطلبات حسب الحالة</h2>
            <FilterTabs
              items={orderTabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>

          {/* Orders List */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <FiShoppingBag className="h-5 w-5 text-purple-600 mr-2" />
                {activeTab === 'all' ? 'جميع الطلبات' : 
                  orderTabs.find(tab => tab.id === activeTab)?.label || 'الطلبات'}
              </h2>
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 text-xs py-1">
                {filteredOrders.length} طلب
              </Badge>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col items-center">
                  <FiRefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">جاري تحميل بيانات الطلبات...</p>
                </div>
              </div>
            ) : filteredOrders.length > 0 ? (
              <OrdersGridView 
                orders={filteredOrders}
                onOrderClick={handleOrderSelect}
                viewType={viewType}
                enableFilters={enableFilters}
                enableSort={enableSort}
              />
            ) : (
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-8 text-center border border-gray-100 dark:border-gray-800">
                <FiAlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">لا توجد طلبات</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  لم يتم العثور على طلبات بالمعايير المحددة
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setActiveTab('all');
                    setSearchTerm('');
                  }}
                  className="mx-auto bg-white dark:bg-slate-900"
                >
                  عرض جميع الطلبات
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Order Detail Dialog (New Custom Dialog) */}
        <OrderDetailsDialog 
          isOpen={isDetailOpen} 
          onClose={() => setIsDetailOpen(false)} 
          title={`تفاصيل الطلب ${selectedOrder?.id.substring(0, 8).toUpperCase()}`}
        >
          {/* Pass only the selected order to the OrderDetail component */}
          <OrderDetail order={selectedOrder} /> 
        </OrderDetailsDialog>
      </PermissionGuard>
    </DashboardLayout>
  );
}