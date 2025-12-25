/**
 * صفحة تتبع الطلب ضمن نطاق الطلبات
 * 
 * هذا المكون يوضح كيفية استخدام:
 * 1. النمط الموحد لصفحات النطاقات
 * 2. استيراد المكونات من نفس النطاق
 * 3. الاستفادة من Redux لإدارة الحالة
 */

"use client";

import { useState, useEffect } from "react";
import { OrderTrackingView } from "@/components/OrderTrackingView";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOrderById } from "@/store/ordersSlice";

type OrderTrackingPageProps = {
  orderId: string;
};

const OrderTrackingPage = ({ orderId }: OrderTrackingPageProps) => {
  const dispatch = useAppDispatch();
  const { selectedOrder, loading } = useAppSelector(state => state.orders);
  
  // حالة محلية للتعامل مع البيانات
  const [isReady, setIsReady] = useState(false);
  
  // جلب بيانات الطلب عند تحميل الصفحة
  useEffect(() => {
    if (orderId) {
      // استدعاء القطعة المناسبة من متجر Redux
      dispatch(fetchOrderById(orderId));
      setIsReady(true);
    }
  }, [dispatch, orderId]);

  // تنفيذ منطق معالجة البيانات هنا إذا لزم الأمر
  // على سبيل المثال، تحويل البيانات أو إعدادها قبل التمرير إلى المكون

  // استخدام المكون من نفس النطاق
  return <OrderTrackingView orderId={orderId} />;
};

export default OrderTrackingPage;