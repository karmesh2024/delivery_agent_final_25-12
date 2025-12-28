# توثيق إدارة وتتبع طلبات الوكلاء في تطبيق الداش بورد

## مقدمة
يهدف هذا الدليل لشرح كيفية بناء وتكامل لوحة تحكم الداش بورد (Next.js/React) لإدارة الطلبات القادمة من تطبيق الوكلاء المطور عبر Flutter وكامل بياناته موثقة في Supabase.

---

## 1. بنية قواعد البيانات (جداول Supabase)

#### جدول store_orders (الطلبات)
| الحقل            | النوع      | الوصف                                      |
|------------------|------------|---------------------------------------------|
| id               | UUID       | معرف الطلب                                  |
| order_number     | TEXT       | رقم الطلب (مثال: ORD-20251116-0001)         |
| customer_id      | UUID       | معرف الوكيل/العميل                          |
| shop_id          | UUID       | معرف المتجر                                 |
| status           | TEXT       | الحالة (pending, processing, delivered...)  |
| final_amount     | NUMERIC    | المبلغ الإجمالي                             |
| payment_method   | TEXT       | cash_on_delivery, wallet, ...                |
| payment_status   | TEXT       | pending, completed, ...                      |
| shipping_address | JSONB      | عنوان الشحن                                 |
| notes            | TEXT       | ملاحظات إضافية                              |
| created_at       | TIMESTAMP  | وقت الإنشاء                                 |
| updated_at       | TIMESTAMP  | وقت التعديل                                 |

#### جدول store_order_items (عناصر الطلب)
| الحقل         | النوع      | الوصف                      |
|---------------|------------|-----------------------------|
| id            | UUID       | معرف العنصر                 |
| order_id      | UUID       | معرف الطلب المرتبط          |
| product_id    | UUID       | معرف المنتج                  |
| quantity      | INTEGER    | الكمية                       |
| unit_price    | NUMERIC    | سعر الوحدة                  |
| product_data  | JSONB      | بيانات المنتج (اسم, صورة...) |
| created_at    | TIMESTAMP  | وقت الإضافة                 |

---

## 2. خطوات جلب الطلبات في React/Next.js

### إنشاء اتصال مع Supabase
```js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('SUPABASE_URL', 'SUPABASE_ANON_OR_SERVICE_ROLE_KEY');
```

### جلب قائمة الطلبات
```js
const { data: orders, error } = await supabase
  .from('store_orders')
  .select('*')
  .order('created_at', { ascending: false });
```

### جلب عناصر الطلب
```js
const { data: items, error } = await supabase
  .from('store_order_items')
  .select('*')
  .eq('order_id', orderId);
```

---

## 3. تغيير حالة الطلب
```js
const { data, error } = await supabase
  .from('store_orders')
  .update({ status: 'processing' }) // أو أي حالة مطلوبة
  .eq('id', orderId);
```

---

## 4. عرض البيانات في Next.js (مثال بسيط)
```jsx
// داخل صفحة أو مكون React
return (
  <table>
    <thead>
      <tr>
        <th>رقم الطلب</th>
        <th>الوكيل</th>
        <th>المتجر</th>
        <th>الحالة</th>
        <th>الإجمالي</th>
        <th>تاريخ الإنشاء</th>
        <th>إجراءات</th>
      </tr>
    </thead>
    <tbody>
      {orders?.map(order => (
        <tr key={order.id}>
          <td>{order.order_number}</td>
          <td>{order.customer_id}</td>
          <td>{order.shop_id}</td>
          <td>
            <select
              value={order.status}
              onChange={e => updateOrderStatus(order.id, e.target.value)}
              >
              <option value="pending">جديد</option>
              <option value="processing">تحت التنفيذ</option>
              <option value="shipped">شحن</option>
              <option value="delivered">مستلم</option>
              <option value="cancelled">ملغي</option>
            </select>
          </td>
          <td>{order.final_amount}</td>
          <td>{new Date(order.created_at).toLocaleString()}</td>
          <td>
            {/* زر تفاصيل وحذف... */}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)
```

---

## 5. اعتبارات أمنية
- استخدم Service Role Key لوصول مديري النظام فقط في الداش بورد (وليس نشر الـ anon key للعامة).
- فعل RLS policies لخصوصية البيانات إذا دعت الحاجة.

---

## 6. مثال كامل: صفحة إدارة الطلبات في Next.js

### 6.1 إنشاء ملف `lib/supabase.js`
```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 6.2 صفحة `pages/orders/index.js` أو `app/orders/page.js`
```jsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])

  // جلب جميع الطلبات
  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('store_orders')
        .select(`
          *,
          shop:store_shops(name_ar, name_en)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      alert('حدث خطأ في جلب الطلبات')
    } finally {
      setLoading(false)
    }
  }

  // جلب تفاصيل طلب معين
  const fetchOrderDetails = async (orderId) => {
    try {
      // جلب عناصر الطلب
      const { data: items, error: itemsError } = await supabase
        .from('store_order_items')
        .select('*')
        .eq('order_id', orderId)

      if (itemsError) throw itemsError

      // جلب بيانات الطلب
      const { data: order, error: orderError } = await supabase
        .from('store_orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      setSelectedOrder(order)
      setOrderItems(items || [])
    } catch (error) {
      console.error('Error fetching order details:', error)
      alert('حدث خطأ في جلب تفاصيل الطلب')
    }
  }

  // تحديث حالة الطلب
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('store_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // تحديث القائمة المحلية
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ))

      alert('تم تحديث حالة الطلب بنجاح')
    } catch (error) {
      console.error('Error updating order:', error)
      alert('حدث خطأ في تحديث حالة الطلب')
    }
  }

  // فلترة الطلبات حسب الحالة
  const filterOrdersByStatus = async (status) => {
    try {
      setLoading(true)
      let query = supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error filtering orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>جاري التحميل...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">إدارة الطلبات</h1>

      {/* فلتر حسب الحالة */}
      <div className="mb-4">
        <button 
          onClick={() => filterOrdersByStatus('all')}
          className="px-4 py-2 bg-gray-200 rounded mr-2"
        >
          الكل
        </button>
        <button 
          onClick={() => filterOrdersByStatus('pending')}
          className="px-4 py-2 bg-yellow-200 rounded mr-2"
        >
          قيد الانتظار
        </button>
        <button 
          onClick={() => filterOrdersByStatus('processing')}
          className="px-4 py-2 bg-blue-200 rounded mr-2"
        >
          قيد المعالجة
        </button>
        <button 
          onClick={() => filterOrdersByStatus('delivered')}
          className="px-4 py-2 bg-green-200 rounded"
        >
          تم التسليم
        </button>
      </div>

      {/* جدول الطلبات */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">رقم الطلب</th>
              <th className="px-4 py-2 border">المتجر</th>
              <th className="px-4 py-2 border">المبلغ</th>
              <th className="px-4 py-2 border">طريقة الدفع</th>
              <th className="px-4 py-2 border">الحالة</th>
              <th className="px-4 py-2 border">تاريخ الإنشاء</th>
              <th className="px-4 py-2 border">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="px-4 py-2 border">{order.order_number}</td>
                <td className="px-4 py-2 border">
                  {order.shop?.name_ar || order.shop_id}
                </td>
                <td className="px-4 py-2 border">{order.final_amount} EGP</td>
                <td className="px-4 py-2 border">{order.payment_method}</td>
                <td className="px-4 py-2 border">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="processing">قيد المعالجة</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="delivered">تم التسليم</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </td>
                <td className="px-4 py-2 border">
                  {new Date(order.created_at).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => fetchOrderDetails(order.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    تفاصيل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* نافذة تفاصيل الطلب */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              تفاصيل الطلب: {selectedOrder.order_number}
            </h2>
            
            <div className="mb-4">
              <p><strong>المبلغ الإجمالي:</strong> {selectedOrder.final_amount} EGP</p>
              <p><strong>الحالة:</strong> {selectedOrder.status}</p>
              <p><strong>طريقة الدفع:</strong> {selectedOrder.payment_method}</p>
              <p><strong>حالة الدفع:</strong> {selectedOrder.payment_status}</p>
            </div>

            <h3 className="font-bold mb-2">عنوان الشحن:</h3>
            <pre className="bg-gray-100 p-2 rounded mb-4">
              {JSON.stringify(selectedOrder.shipping_address, null, 2)}
            </pre>

            <h3 className="font-bold mb-2">عناصر الطلب:</h3>
            <table className="w-full border">
              <thead>
                <tr>
                  <th className="border px-2 py-1">المنتج</th>
                  <th className="border px-2 py-1">الكمية</th>
                  <th className="border px-2 py-1">السعر</th>
                  <th className="border px-2 py-1">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map(item => (
                  <tr key={item.id}>
                    <td className="border px-2 py-1">
                      {item.product_data?.name_ar || item.product_id}
                    </td>
                    <td className="border px-2 py-1">{item.quantity}</td>
                    <td className="border px-2 py-1">{item.unit_price} EGP</td>
                    <td className="border px-2 py-1">
                      {(item.quantity * parseFloat(item.unit_price)).toFixed(2)} EGP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedOrder.notes && (
              <div className="mt-4">
                <h3 className="font-bold mb-2">ملاحظات:</h3>
                <p>{selectedOrder.notes}</p>
              </div>
            )}

            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 7. Real-time Updates (التحديثات الفورية)

للتحديث الفوري عند تغيير حالة الطلب:

```jsx
useEffect(() => {
  // الاشتراك في التحديثات الفورية
  const channel = supabase
    .channel('orders_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'store_orders'
      },
      (payload) => {
        console.log('Order updated:', payload.new)
        // تحديث القائمة تلقائياً
        setOrders(orders.map(order => 
          order.id === payload.new.id 
            ? payload.new 
            : order
        ))
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [orders])
```

---

## 8. Pagination (التصفح)

```jsx
const [page, setPage] = useState(0)
const [pageSize] = useState(20)

const fetchOrdersPaginated = async (pageNum) => {
  const from = pageNum * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('store_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return data
}
```

---

## 9. البحث والفلترة المتقدمة

```jsx
const searchOrders = async (searchTerm, filters) => {
  let query = supabase
    .from('store_orders')
    .select('*')

  // البحث في رقم الطلب
  if (searchTerm) {
    query = query.ilike('order_number', `%${searchTerm}%`)
  }

  // فلترة حسب الحالة
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  // فلترة حسب نطاق المبلغ
  if (filters.minAmount) {
    query = query.gte('final_amount', filters.minAmount)
  }
  if (filters.maxAmount) {
    query = query.lte('final_amount', filters.maxAmount)
  }

  // فلترة حسب التاريخ
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

---

## 10. معالجة الأخطاء

```jsx
const handleError = (error) => {
  if (error.code === 'PGRST116') {
    // لا توجد نتائج
    return 'لا توجد طلبات'
  } else if (error.code === '23505') {
    // انتهاك القيد الفريد
    return 'رقم الطلب موجود مسبقاً'
  } else if (error.message.includes('JWT')) {
    // مشكلة في المصادقة
    return 'يرجى تسجيل الدخول مرة أخرى'
  }
  return error.message || 'حدث خطأ غير متوقع'
}
```

---

## 11. Export البيانات (تصدير Excel/CSV)

```jsx
const exportOrdersToCSV = (orders) => {
  const headers = ['رقم الطلب', 'المتجر', 'المبلغ', 'الحالة', 'التاريخ']
  const rows = orders.map(order => [
    order.order_number,
    order.shop_id,
    order.final_amount,
    order.status,
    new Date(order.created_at).toLocaleDateString('ar-EG')
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
```

---

## 12. متغيرات البيئة (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# للعمليات الحساسة، استخدم Service Role Key في Server-side فقط
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 13. الأمان والصلاحيات

### 13.1 استخدام Service Role Key في Server-side فقط
```js
// pages/api/orders/update.js (API Route)
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // التحقق من المصادقة
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // استخدام Service Role Key للعمليات الحساسة
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { orderId, status } = req.body

  const { data, error } = await supabaseAdmin
    .from('store_orders')
    .update({ status })
    .eq('id', orderId)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true, data })
}
```

---

## 14. المصادر والروابط

- [توثيق قاعدة البيانات الكامل](./الوكلاء%20المعتمدين%20ريأكت/المتاجر/agent_full_database_documentation%20copy.md)
- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/select)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## 15. ملاحظات مهمة

1. **الأداء**: استخدم `limit()` و `range()` للتصفح لتجنب تحميل جميع الطلبات دفعة واحدة
2. **التخزين المؤقت**: يمكن استخدام React Query أو SWR لتحسين الأداء
3. **الصلاحيات**: تأكد من تفعيل RLS (Row Level Security) في Supabase لحماية البيانات
4. **التواريخ**: استخدم مكتبة مثل `date-fns` أو `moment.js` لتنسيق التواريخ بالعربية

---

## 16. مثال على استخدام React Query

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_orders')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ orderId, status }) => {
      const { data, error } = await supabase
        .from('store_orders')
        .update({ status })
        .eq('id', orderId)
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders'])
    }
  })
}
```

---
