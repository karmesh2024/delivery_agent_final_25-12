-- تعديل جدول عناصر الطلب لجعل product_id اختياري (Nullable)
-- هذا ضروري لأننا ننشئ طلبات يدوية بأسماء منتجات قد لا تكون موجودة في قاعدة بيانات المنتجات بعد.

ALTER TABLE industrial_partner_order_items
ALTER COLUMN product_id DROP NOT NULL;
