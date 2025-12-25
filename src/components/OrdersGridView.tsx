/**
 * OrdersGridView Component
 * يعرض قائمة الطلبات في تنسيق شبكي متجاوب أو جدول تفاعلي
 * 
 * هذا المكون هو جزء من الهيكل الجديد للمشروع باستخدام Domain-Driven Design
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { DeliveryOrder, Order, OrderItem, OrderStatus, Agent } from '@/types';
import { FiEye, FiMapPin, FiFilter, FiArrowUp, FiArrowDown, FiMap } from "react-icons/fi";

// وظيفة مساعدة لتنسيق التاريخ
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

type OrdersGridViewProps = {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  viewType?: 'grid' | 'table';
  enableFilters?: boolean;
  enableSort?: boolean;
};

// تعريف أنواع البيانات للفلاتر
type StringFilter = string;
type RangeFilter = { min: string; max: string };
type DateFilter = { start: string; end: string };

type ColumnFilterValue = StringFilter | RangeFilter | DateFilter;

type ColumnFilters = {
  order_id: StringFilter;
  customer_name: StringFilter;
  address: StringFilter;
  created_at: DateFilter;
  total: RangeFilter;
};

export function OrdersGridView({ 
  orders, 
  onOrderClick, 
  viewType = 'grid',
  enableFilters = false,
  enableSort = false 
}: OrdersGridViewProps) {
  console.log("OrdersGridView: Received onOrderClick prop:", typeof onOrderClick, onOrderClick);
  // حالة الفلاتر والترتيب
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    order_id: "",
    customer_name: "",
    address: "",
    created_at: { start: "", end: "" },
    total: { min: "", max: "" }
  });

  // معالجة تغيير الفلتر
  const handleFilterChange = (column: keyof ColumnFilters, value: ColumnFilterValue) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  };

  // التحقق إذا كان الفلتر نشطًا
  const hasActiveFilter = (column: keyof ColumnFilters) => {
    const filter = columnFilters[column];
    if (typeof filter === 'string') {
      return !!filter;
    } else if (typeof filter === 'object') {
      return Object.values(filter).some(val => val !== "");
    }
    return false;
  };

  // تبديل مرئية الفلتر
  const toggleFilter = (column: keyof ColumnFilters | null) => {
    setActiveFilter(prev => prev === column ? null : column);
  };

  // تبديل اتجاه الترتيب
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "desc" ? "asc" : "desc");
  };

  // عرض الطلبات كشبكة بطاقات
  if (viewType === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
            <Card 
            key={order.id} 
            className="cursor-pointer hover:shadow-md transition-shadow bg-card text-card-foreground border-border"
            onClick={() => onOrderClick(order)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">#{order.id.substring(0, 8).toUpperCase()}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">العميل</p>
                  <p className="font-medium text-foreground">{order.customer_name || "غير معروف"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">العنوان</p>
                    <p className="font-medium text-foreground truncate">
                      {order.customer_address || "غير محدد"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">المبلغ</p>
                    <p className="font-medium text-foreground">${order.total_amount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
                
                {order.agent_id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">مندوب التوصيل</p>
                    <div className="flex items-center gap-2">
                      {order.agent && (
                        <>
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {order.agent.avatar_url ? (
                              <img 
                                src={order.agent.avatar_url} 
                                alt={order.agent.name}
                                className="h-full w-full rounded-full object-cover" 
                              />
                            ) : (
                              <span className="text-sm font-semibold text-primary">
                                {order.agent.name?.charAt(0) || "؟"}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-foreground">{order.agent.name}</p>
                        </>
                      )}
                      {!order.agent && (
                        <p className="text-muted-foreground">تم تعيين مندوب #{order.agent_id.substring(0, 6)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // عرض الطلبات كجدول تفاعلي
  return (
    <div className="overflow-x-auto rounded-lg bg-card text-card-foreground border border-border">
      <div className="min-w-full">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
          <thead>
            <tr>
              <th className="px-5 py-3 text-right font-bold text-sm text-muted-foreground">
                <div className="flex items-center justify-end gap-2">
                  <span>رقم الطلب</span>
                  {enableFilters && (
                    <button 
                      onClick={() => toggleFilter('order_id')} 
                      className={`p-1 rounded ${hasActiveFilter('order_id') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <FiFilter size={14} />
                    </button>
                  )}
                </div>
                {activeFilter === 'order_id' && (
                  <div className="absolute z-10 mt-2 p-2 bg-card shadow-lg rounded-md border border-border" style={{ minWidth: '200px' }}>
                    <label className="block text-sm font-medium text-foreground mb-1">رقم الطلب</label>
                    <div className="flex flex-col gap-2">
                      <Input 
                        value={columnFilters.order_id} 
                        onChange={(e) => handleFilterChange('order_id', e.target.value)} 
                        placeholder="بحث..." 
                        className="text-sm bg-background" 
                      />
                      <div className="flex justify-between mt-2">
                        <Button variant="outline" size="sm" onClick={() => handleFilterChange('order_id', '')}>مسح</Button>
                        <Button size="sm" onClick={() => setActiveFilter(null)}>تطبيق</Button>
                      </div>
                    </div>
                  </div>
                )}
              </th>
              
              <th style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: '#4b5563' }}>
                <div className="flex items-center justify-end gap-2">
                  <span>العميل</span>
                  {enableFilters && (
                    <button 
                      onClick={() => toggleFilter('customer_name')} 
                      className={`p-1 rounded ${hasActiveFilter('customer_name') ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <FiFilter size={14} />
                    </button>
                  )}
                </div>
                {activeFilter === 'customer_name' && (
                  <div className="absolute z-10 mt-2 p-2 bg-white shadow-lg rounded-md border border-gray-200" style={{ minWidth: '200px' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                    <div className="flex flex-col gap-2">
                      <Input 
                        value={columnFilters.customer_name} 
                        onChange={(e) => handleFilterChange('customer_name', e.target.value)} 
                        placeholder="بحث..." 
                        className="text-sm" 
                      />
                      <div className="flex justify-between mt-2">
                        <Button variant="outline" size="sm" onClick={() => handleFilterChange('customer_name', '')}>مسح</Button>
                        <Button size="sm" onClick={() => setActiveFilter(null)}>تطبيق</Button>
                      </div>
                    </div>
                  </div>
                )}
              </th>
              
              <th style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: '#4b5563' }}>
                <div className="flex items-center justify-end gap-2">
                  <span>العنوان</span>
                  {enableFilters && (
                    <button 
                      onClick={() => toggleFilter('address')} 
                      className={`p-1 rounded ${hasActiveFilter('address') ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <FiFilter size={14} />
                    </button>
                  )}
                </div>
                {activeFilter === 'address' && (
                  <div className="absolute z-10 mt-2 p-2 bg-white shadow-lg rounded-md border border-gray-200" style={{ minWidth: '200px' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                    <div className="flex flex-col gap-2">
                      <Input 
                        value={columnFilters.address} 
                        onChange={(e) => handleFilterChange('address', e.target.value)} 
                        placeholder="بحث..." 
                        className="text-sm" 
                      />
                      <div className="flex justify-between mt-2">
                        <Button variant="outline" size="sm" onClick={() => handleFilterChange('address', '')}>مسح</Button>
                        <Button size="sm" onClick={() => setActiveFilter(null)}>تطبيق</Button>
                      </div>
                    </div>
                  </div>
                )}
              </th>
              
              <th style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: '#4b5563' }}>
                <div className="flex items-center justify-end gap-2">
                  <span>تاريخ الإنشاء</span>
                  {enableSort && (
                    <button onClick={toggleSortDirection} className="p-1 text-gray-400 hover:text-gray-600">
                      {sortDirection === "desc" ? <FiArrowDown size={14} /> : <FiArrowUp size={14} />}
                    </button>
                  )}
                </div>
              </th>
              
              <th style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: '#4b5563' }}>
                <div className="flex items-center justify-end gap-2">
                  <span>المبلغ</span>
                  {enableFilters && (
                    <button 
                      onClick={() => toggleFilter('total')} 
                      className={`p-1 rounded ${hasActiveFilter('total') ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <FiFilter size={14} />
                    </button>
                  )}
                </div>
                {activeFilter === 'total' && (
                  <div className="absolute z-10 mt-2 p-2 bg-white shadow-lg rounded-md border border-gray-200" style={{ minWidth: '200px' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نطاق المبلغ</label>
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-xs text-gray-500">الحد الأدنى</label>
                        <Input 
                          type="number" 
                          value={columnFilters.total.min} 
                          onChange={(e) => handleFilterChange('total', {...columnFilters.total, min: e.target.value})} 
                          placeholder="0" 
                          className="text-sm" 
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">الحد الأقصى</label>
                        <Input 
                          type="number" 
                          value={columnFilters.total.max} 
                          onChange={(e) => handleFilterChange('total', {...columnFilters.total, max: e.target.value})} 
                          placeholder="100" 
                          className="text-sm" 
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <Button variant="outline" size="sm" onClick={() => handleFilterChange('total', {min: '', max: ''})}>مسح</Button>
                        <Button size="sm" onClick={() => setActiveFilter(null)}>تطبيق</Button>
                      </div>
                    </div>
                  </div>
                )}
              </th>
              
              <th style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: '#4b5563' }}>
                الحالة
              </th>
              
              <th style={{ padding: '10px 20px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: '#4b5563' }}>
                الإجراءات
              </th>
            </tr>
          </thead>
          
          <tbody>
            {orders.map((order) => (
              <tr 
                key={order.id} 
                className="bg-card text-card-foreground hover:bg-muted transition-all duration-200 cursor-pointer border border-border"
                onClick={() => onOrderClick(order)}
              >
                <td className="px-5 py-4 text-right rounded-r-lg">
                  <div className="font-medium text-foreground">#{order.id.substring(0, 8).toUpperCase()}</div>
                </td>
                
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {(order.customer_name || 'عميل').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-foreground">{order.customer_name || 'عميل'}</span>
                  </div>
                </td>
                
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="truncate max-w-[200px] text-muted-foreground">{order.customer_address || "غير محدد"}</span>
                    <FiMapPin className="h-3 w-3 text-muted-foreground" />
                  </div>
                </td>
                
                <td className="px-5 py-4 text-right text-sm text-muted-foreground">
                  {formatDate(order.created_at)}
                </td>
                
                <td className="px-5 py-4 text-right font-medium text-foreground">
                  ${(order.total_amount || 0).toFixed(2)}
                </td>
                
                <td className="px-5 py-4 text-right">
                  <StatusBadgeRow status={order.status} />
                </td>
                
                <td className="px-5 py-4 text-center rounded-l-lg">
                  <div className="flex gap-2 justify-center">
                    <ActionButton 
                      icon={<FiEye size={16} />} 
                      color="blue" 
                      title="عرض التفاصيل"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOrderClick(order);
                      }}
                    />
                    
                    <ActionButton 
                      icon={<FiMap size={16} />} 
                      color="blue" 
                      title="تتبع المسار"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/order-tracking/${order.id}`, '_blank');
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// مكون لعرض حالة الطلب كشارة
function StatusBadge({ status }: { status: OrderStatus }) {
  const getStatusDetails = () => {
    switch (status) {
      case "pending":
        return { label: "قيد الانتظار", className: "bg-yellow-100 text-yellow-800" };
      case "confirmed":
        return { label: "مؤكد", className: "bg-blue-100 text-blue-800" };
      case "in_progress":
        return { label: "جاري التوصيل", className: "bg-purple-100 text-purple-800" };
      case "delivered":
        return { label: "تم التوصيل", className: "bg-green-100 text-green-800" };
      case "canceled":
        return { label: "ملغي", className: "bg-red-100 text-red-800" };
      case "completed":
        return { label: "مكتمل", className: "bg-green-100 text-green-800" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-800" };
    }
  };

  const { label, className } = getStatusDetails();

  return (
    <Badge className={`${className} font-normal`}>
      {label}
    </Badge>
  );
}

// مكون لعرض حالة الطلب في صف الجدول
function StatusBadgeRow({ status }: { status: OrderStatus }) {
  const getStatusDetails = () => {
    switch (status) {
      case "pending":
        return { label: "قيد الانتظار", color: "#f59e0b" };
      case "confirmed":
        return { label: "مؤكد", color: "#3b82f6" };
      case "in_progress":
        return { label: "جاري التوصيل", color: "#8b5cf6" };
      case "delivered":
        return { label: "تم التوصيل", color: "#10b981" };
      case "canceled":
        return { label: "ملغي", color: "#ef4444" };
      case "completed":
        return { label: "مكتمل", color: "#10b981" };
      default:
        return { label: status, color: "#6b7280" };
    }
  };

  const { label, color } = getStatusDetails();

  return (
    <div className="flex items-center gap-2 justify-end">
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

// مكون زر الإجراء
function ActionButton({ 
  icon, 
  color = "gray", 
  title, 
  onClick 
}: { 
  icon: React.ReactNode; 
  color: "gray" | "blue" | "green" | "red"; 
  title: string;
  onClick: (e: React.MouseEvent) => void; 
}) {
  console.log('ActionButton rendered with title:', title);
  // تحديد الألوان بناءً على النوع
  let bgColor = "bg-gray-50 hover:bg-gray-100 border-gray-200";
  let textColor = "text-gray-600";
  
  if (color === "blue") {
    bgColor = "bg-blue-50 hover:bg-blue-100 border-blue-200";
    textColor = "text-blue-600";
  } else if (color === "green") {
    bgColor = "bg-green-50 hover:bg-green-100 border-green-200";
    textColor = "text-green-600";
  } else if (color === "red") {
    bgColor = "bg-red-50 hover:bg-red-100 border-red-200";
    textColor = "text-red-600";
  }

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center p-2 rounded-md border ${bgColor} ${textColor} transition-colors duration-200`}
      title={title}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}