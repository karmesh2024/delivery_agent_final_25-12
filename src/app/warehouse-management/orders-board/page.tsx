'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { FiPackage, FiCheckCircle, FiClock, FiTruck, FiFilter, FiVolume2, FiSettings } from 'react-icons/fi';
import { StoreOrder, StoreOrderFulfillmentStatus } from '@/domains/store-orders/types';
import OrderCard from '@/domains/warehouse-management/components/OrderCard';
import OrderDetailsModal from '@/domains/warehouse-management/components/OrderDetailsModal';
import { useToast } from '@/shared/ui/use-toast';

const FULFILLMENT_STATUSES: { value: StoreOrderFulfillmentStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'جميع الطلبات', color: 'bg-gray-500' },
  { value: 'pending', label: 'في انتظار التجميع', color: 'bg-yellow-500' },
  { value: 'collecting', label: 'قيد التجميع', color: 'bg-blue-500' },
  { value: 'verifying', label: 'قيد التحقق', color: 'bg-purple-500' },
  { value: 'packaging', label: 'قيد التغليف', color: 'bg-orange-500' },
  { value: 'ready', label: 'جاهز للتسليم', color: 'bg-green-500' },
];

export default function OrdersBoardPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StoreOrderFulfillmentStatus | 'all'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { toast } = useToast();
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef<number>(0);

  // جلب الطلبات مع حماية من الطلبات المتعددة
  const fetchOrders = useCallback(async (force = false) => {
    // منع الطلبات المتزامنة
    if (fetchingRef.current && !force) {
      return;
    }

    // Throttle: منع الطلبات المتكررة في أقل من ثانيتين
    const now = Date.now();
    if (now - lastFetchRef.current < 2000 && !force) {
      return;
    }

    fetchingRef.current = true;
    lastFetchRef.current = now;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('fulfillment_status', selectedStatus);
      }

      const response = await fetch(`/api/warehouse/orders-board?${params.toString()}`);
      
      if (response.status === 429) {
        // Too Many Requests - انتظر أكثر
        console.warn('Too many requests, waiting before retry...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
        fetchingRef.current = false;
        return;
      }

      if (!response.ok) {
        throw new Error('فشل في جلب الطلبات');
      }

      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);

      // تشغيل صوت عند وجود طلبات جديدة
      if (soundEnabled && data.length > 0) {
        // يمكن إضافة صوت تنبيه هنا
        // new Audio('/notification.mp3').play().catch(() => {});
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // استخدام toast مباشرة بدون إضافتها للـ dependencies
      toast({
        title: 'خطأ',
        description: 'فشل في جلب الطلبات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, soundEnabled]);

  // تحديث حالة التجميع
  const updateFulfillmentStatus = useCallback(async (orderId: string, status: StoreOrderFulfillmentStatus) => {
    try {
      const response = await fetch(`/api/warehouse/orders-board/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fulfillment_status: status }),
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث الحالة');
      }

      toast({
        title: 'نجاح',
        description: 'تم تحديث حالة التجميع بنجاح',
      });

      // إعادة جلب الطلبات
      await fetchOrders();
    } catch (error) {
      console.error('Error updating fulfillment status:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الحالة',
        variant: 'destructive',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOrders]);

  // جلب الطلبات عند تحميل الصفحة
  useEffect(() => {
    fetchOrders(true); // force fetch on mount

    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // فقط عند التحميل الأول

  // جلب الطلبات عند تغيير الحالة المحددة
  useEffect(() => {
    // انتظر قليلاً قبل الجلب لتجنب الطلبات المتعددة
    const timeoutId = setTimeout(() => {
      fetchOrders(true);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  // فلترة الطلبات حسب الحالة
  useEffect(() => {
    if (selectedStatus === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.fulfillment_status === selectedStatus));
    }
  }, [orders, selectedStatus]);

  // تجميع الطلبات حسب الحالة
  const ordersByStatus = filteredOrders.reduce((acc, order) => {
    const status = order.fulfillment_status || 'pending';
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(order);
    return acc;
  }, {} as Record<StoreOrderFulfillmentStatus, StoreOrder[]>);

  return (
    <DashboardLayout title="لوحة الطلبيات">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">لوحة الطلبيات</h1>
            <p className="text-gray-600 mt-2">متابعة وتنفيذ طلبات التجميع والتغليف</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={soundEnabled ? 'bg-green-50' : ''}
            >
              <FiVolume2 className="mr-2" />
              {soundEnabled ? 'الصوت مفعل' : 'الصوت معطل'}
            </Button>
            <Button variant="outline" size="sm">
              <FiFilter className="mr-2" />
              فلترة
            </Button>
            <Button variant="outline" size="sm">
              <FiSettings className="mr-2" />
              إعدادات
            </Button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {FULFILLMENT_STATUSES.map((status) => (
            <Button
              key={status.value}
              variant={selectedStatus === status.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(status.value)}
              className={selectedStatus === status.value ? `bg-${status.color.replace('bg-', '')}` : ''}
            >
              {status.label}
              {status.value !== 'all' && (
                <Badge variant="secondary" className="mr-2">
                  {orders.filter((o) => o.fulfillment_status === status.value).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Orders Count */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold">
                {filteredOrders.length} طلب في قائمة الانتظار
              </span>
              {soundEnabled && (
                <Badge variant="outline" className="bg-green-50">
                  <FiVolume2 className="mr-1" size={12} />
                  الصوت مفعل
                </Badge>
              )}
            </div>
            <Button onClick={() => fetchOrders(true)} variant="outline" size="sm">
              تحديث
            </Button>
          </div>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل الطلبات...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <FiPackage className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-600 text-lg">لا توجد طلبات لعرضها</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setSelectedOrder(order)}
                onStatusUpdate={updateFulfillmentStatus}
              />
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            open={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusUpdate={updateFulfillmentStatus}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

