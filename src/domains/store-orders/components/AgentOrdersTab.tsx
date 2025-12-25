'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchAgentOrders,
  fetchStoreOrderById,
  fetchOrderItems,
  updateOrderStatus,
  setFilters,
  setSelectedOrder,
  clearError,
} from '../store/storeOrdersSlice';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import { StoreOrder, StoreOrderStatus, StoreOrderFulfillmentStatus } from '../types';
import { Eye, Search } from 'lucide-react';
import OrderDetailsDialog from './OrderDetailsDialog';

const statusLabels: Record<StoreOrderStatus, string> = {
  pending: 'قيد الانتظار',
  processing: 'قيد المعالجة',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  refunded: 'مسترد',
  completed: 'مكتمل',
};

const statusColors: Record<StoreOrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  completed: 'bg-green-100 text-green-800',
};

const fulfillmentStatusLabels: Record<StoreOrderFulfillmentStatus, string> = {
  pending: 'في انتظار التجميع',
  collecting: 'قيد التجميع',
  verifying: 'قيد التحقق',
  packaging: 'قيد التغليف',
  ready: 'جاهز للتسليم',
  completed: 'تم التسليم',
};

const fulfillmentStatusColors: Record<StoreOrderFulfillmentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  collecting: 'bg-blue-100 text-blue-800 border-blue-300',
  verifying: 'bg-purple-100 text-purple-800 border-purple-300',
  packaging: 'bg-orange-100 text-orange-800 border-orange-300',
  ready: 'bg-green-100 text-green-800 border-green-300',
  completed: 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function AgentOrdersTab() {
  const dispatch = useAppDispatch();
  const {
    orders,
    filteredOrders,
    selectedOrder,
    selectedOrderItems,
    loading,
    error,
    filters,
  } = useAppSelector((state) => state.storeOrders);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAgentOrders(filters));
  }, [dispatch, filters.status]);

  useEffect(() => {
    if (selectedOrder) {
      dispatch(fetchOrderItems(selectedOrder.id));
    }
  }, [dispatch, selectedOrder]);

  const handleStatusFilter = (status: string) => {
    dispatch(
      setFilters({
        status: status === 'all' ? 'all' : (status as StoreOrderStatus),
      })
    );
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    dispatch(setFilters({ search: value || undefined }));
  };

  const handleViewDetails = async (order: StoreOrder) => {
    await dispatch(fetchStoreOrderById(order.id));
    setIsDetailsDialogOpen(true);
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: StoreOrderStatus
  ) => {
    await dispatch(updateOrderStatus({ orderId, status: newStatus }));
    // إعادة جلب الطلبات بعد التحديث
    dispatch(fetchAgentOrders(filters));
  };

  const handleCloseDetails = () => {
    setIsDetailsDialogOpen(false);
    dispatch(setSelectedOrder(null));
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
        <Button
          onClick={() => {
            dispatch(clearError());
            dispatch(fetchAgentOrders(filters));
          }}
          className="mt-2"
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* الفلاتر والبحث */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="البحث برقم الطلب أو اسم المتجر..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="فلترة حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="processing">قيد المعالجة</SelectItem>
            <SelectItem value="shipped">تم الشحن</SelectItem>
            <SelectItem value="delivered">تم التسليم</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* جدول الطلبات */}
      {loading === 'pending' ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          لا توجد طلبات لعرضها
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>الوكيل المعتمد</TableHead>
                <TableHead>المتجر</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>حالة الدفع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>حالة التجميع</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    {order.agent ? (
                      <div className="space-y-1">
                        <p className="font-medium">{order.agent.full_name}</p>
                        <p className="text-xs text-gray-500">{order.agent.phone}</p>
                        {order.agent.location && (
                          <p className="text-xs text-blue-600">
                            📍 {order.agent.location.lat.toFixed(4)}, {order.agent.location.lng.toFixed(4)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.shop?.name_ar || order.shop_id}
                  </TableCell>
                  <TableCell>{order.final_amount} EGP</TableCell>
                  <TableCell>
                    {order.payment_method === 'cash_on_delivery'
                      ? 'الدفع عند الاستلام'
                      : order.payment_method === 'wallet'
                      ? 'المحفظة'
                      : order.payment_method || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        order.payment_status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {order.payment_status === 'completed'
                        ? 'مكتمل'
                        : order.payment_status === 'pending'
                        ? 'قيد الانتظار'
                        : order.payment_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) =>
                        handleStatusChange(order.id, value as StoreOrderStatus)
                      }
                    >
                      <SelectTrigger
                        className={`w-[140px] h-8 text-xs ${
                          statusColors[order.status]
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {order.fulfillment_status ? (
                      <span
                        className={`px-2 py-1 rounded text-xs border ${
                          fulfillmentStatusColors[order.fulfillment_status]
                        }`}
                        title={`حالة التجميع في المخزن: ${fulfillmentStatusLabels[order.fulfillment_status]}`}
                      >
                        {fulfillmentStatusLabels[order.fulfillment_status]}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(order)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      تفاصيل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* نافذة تفاصيل الطلب */}
      {selectedOrder && (
        <OrderDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={handleCloseDetails}
          order={selectedOrder}
          items={selectedOrderItems}
          onStatusChange={(newStatus) =>
            handleStatusChange(selectedOrder.id, newStatus)
          }
        />
      )}
    </div>
  );
}

