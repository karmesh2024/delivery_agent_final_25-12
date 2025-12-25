"use client";

import React from 'react';
import { Order, OrderDetailItem } from '@/types';
import { safeFormatCurrency } from '@/lib/utils';
import { MapPin, User, Phone, Calendar, Package, List, CheckSquare, CreditCard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

interface OrderDetailProps {
  order: Order | null;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ order }) => {
  if (!order) {
    return <div className="p-6 text-center text-gray-500">الرجاء تحديد طلب لعرض التفاصيل.</div>;
  }

  const items: OrderDetailItem[] = order.order_details || [];
  const agent = order.agent;

  return (
    <div className="p-6 space-y-6">
      {/* Order Header */}
      <div className="flex justify-between items-center pb-4 border-b">
        <h2 className="text-2xl font-semibold text-gray-800">
          تفاصيل الطلب: #{(order.order_number || order.id).substring(0, 8).toUpperCase()}
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
          order.status === 'canceled' ? 'bg-red-100 text-red-800' :
          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {order.status}
        </span>
      </div>

      {/* Customer & Delivery Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-700 flex items-center">
            <User className="w-5 h-5 mr-2 text-gray-500" /> معلومات العميل
          </h3>
          <p className="text-sm text-gray-600 flex items-center">
            <User className="w-4 h-4 mr-2 opacity-0" /> {order.customer_name || 'غير متوفر'}
          </p>
          <p className="text-sm text-gray-600 flex items-center">
            <Phone className="w-4 h-4 mr-2 text-gray-500" /> {order.customer_phone || 'غير متوفر'}
          </p>
          <p className="text-sm text-gray-600 flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" /> {order.pickup_address || order.customer_address || 'غير متوفر'}
          </p>
        </div>

        {/* Delivery Info */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border">
           <h3 className="text-lg font-medium text-gray-700 flex items-center">
             <Package className="w-5 h-5 mr-2 text-gray-500" /> معلومات الطلب والتوصيل
           </h3>
          {agent && (
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
               <Avatar className="h-10 w-10">
                  <AvatarImage src={agent.avatar_url || undefined} alt={agent.name} />
                  <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
               </Avatar>
               <div>
                  <p className="text-sm font-medium text-gray-800">المندوب: {agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.phone || 'لا يوجد هاتف'}</p>
               </div>
            </div>
          )}
           {!agent && order.agent_id && (
               <p className="text-sm text-gray-500">معرف المندوب: {order.agent_id}</p>
           )}
           {!agent && !order.agent_id && (
               <p className="text-sm text-gray-500">لم يتم تعيين مندوب بعد.</p>
           )}
          <p className="text-sm text-gray-600 flex items-center">
             <Calendar className="w-4 h-4 mr-2 text-gray-500" /> تاريخ الإنشاء: {new Date(order.created_at).toLocaleString('ar-EG')}
           </p>
          <p className="text-sm text-gray-600 flex items-center">
            <CheckSquare className="w-4 h-4 mr-2 text-gray-500" /> الحالة: {order.status}
          </p>
          <p className="text-sm text-gray-600 flex items-center">
            <CreditCard className="w-4 h-4 mr-2 text-gray-500" /> طريقة الدفع: {order.payment_method || 'غير محدد'}
          </p>
        </div>
      </div>

      <hr className="my-6 border-gray-200" />

      {/* Order Items */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
          <List className="w-5 h-5 mr-2 text-gray-500" /> تفاصيل الأصناف
        </h3>
        {items && items.length > 0 ? (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الصنف</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية/الوزن</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النقاط</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item: OrderDetailItem, index: number) => (
                  <tr key={item.productId || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName || 'غير متوفر'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity ?? item.totalWeight ?? 'N/A'} {item.quantity ? 'وحدة' : 'كجم'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormatCurrency(item.price || 0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.points || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{safeFormatCurrency((item.price || 0) * (item.quantity ?? item.totalWeight ?? 0))}</td>
                  </tr>
                ))}
              </tbody>
               <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-700 uppercase">الإجمالي العام</td>
                  <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">{safeFormatCurrency(order.total_amount || 0)}</td>
                </tr>
               </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">لا توجد تفاصيل أصناف لهذا الطلب.</div>
        )}
      </div>

       {/* Notes */}
      {order.notes && (
        <>
          <hr className="my-6 border-gray-200" />
           <div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">ملاحظات الطلب</h3>
             <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">{order.notes}</p>
           </div>
         </>
       )}
    </div>
  );
};

export default OrderDetail;