-- إنشاء جدول الشركاء الصناعيين (المصانع، الكسارات، التجار)
CREATE TABLE IF NOT EXISTS industrial_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('factory', 'crusher', 'merchant', 'other')) NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  commercial_register TEXT, -- السجل التجاري
  tax_card TEXT, -- البطاقة الضريبية
  credit_limit NUMERIC DEFAULT 0, -- الحد الائتماني (كم يمكنه الشراء بالآجل)
  current_balance NUMERIC DEFAULT 0, -- الرصيد الحالي
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول طلبات الشراء الواردة (من المصانع إلينا)
CREATE TABLE IF NOT EXISTS industrial_partner_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES industrial_partners(id),
  order_number SERIAL, -- رقم طلب مرجعي
  status TEXT CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'cancelled', 'rejected')) DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول تفاصيل الطلب (المنتجات المطلوبة في كل طلب)
CREATE TABLE IF NOT EXISTS industrial_partner_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES industrial_partner_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL, -- يربط مع جدول المواد/المنتجات
  product_name TEXT, -- للتسهيل حالياً
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'ton',
  agreed_price NUMERIC NOT NULL, -- السعر المتفق عليه للتنفيذ
  total_price NUMERIC GENERATED ALWAYS AS (quantity * agreed_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل RLS (Row Level Security) - سياسات أمان بسيطة للبدء
ALTER TABLE industrial_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE industrial_partner_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE industrial_partner_order_items ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة والكتابة للمصرح لهم (يمكنك تعديلها لاحقاً)
CREATE POLICY "Enable all access for authenticated users" ON industrial_partners FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON industrial_partner_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON industrial_partner_order_items FOR ALL USING (auth.role() = 'authenticated');
