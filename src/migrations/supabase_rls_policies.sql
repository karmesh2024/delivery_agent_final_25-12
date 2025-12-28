-- ==============================================================================
-- سكربت تفعيل حماية Row Level Security (RLS)
-- المشروع: Delivery Agent Dashboard (بيكب)
-- التاريخ: 27 نوفمبر 2025
-- ==============================================================================

-- 1. تفعيل RLS على جميع الجداول الحساسة
-- ------------------------------------------------------------------------------
ALTER TABLE delivery_boys ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

-- 2. سياسات جدول المسؤولين (Admins)
-- ------------------------------------------------------------------------------
-- السماح للمسؤولين برؤية قائمة المسؤولين (للتحقق من الصلاحيات)
CREATE POLICY "Admins can view all admins" ON admins
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admins));

-- 3. سياسات جدول مندوبي التوصيل (Delivery Boys)
-- ------------------------------------------------------------------------------
-- السماح للمستخدم برؤية ملفه الشخصي فقط
CREATE POLICY "Users can view own delivery profile" ON delivery_boys
  FOR SELECT
  USING (auth.uid() = user_id);

-- السماح للمستخدم بتحديث حالته (online/offline) وموقعه
CREATE POLICY "Users can update own delivery profile" ON delivery_boys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- السماح للمسؤولين بإدارة كل المندوبين
CREATE POLICY "Admins can manage all delivery boys" ON delivery_boys
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admins));

-- 4. سياسات جدول الطلبات (Delivery Orders)
-- ------------------------------------------------------------------------------
-- السماح للمندوب برؤية الطلبات المسندة إليه فقط
CREATE POLICY "Delivery boys can view assigned orders" ON delivery_orders
  FOR SELECT
  USING (delivery_boy_id IN (SELECT id FROM delivery_boys WHERE user_id = auth.uid()));

-- السماح للمندوب بتحديث حالة الطلبات المسندة إليه
CREATE POLICY "Delivery boys can update assigned orders" ON delivery_orders
  FOR UPDATE
  USING (delivery_boy_id IN (SELECT id FROM delivery_boys WHERE user_id = auth.uid()));

-- السماح للمسؤولين بإدارة كل الطلبات
CREATE POLICY "Admins can manage all orders" ON delivery_orders
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admins));

-- 5. سياسات جدول المحافظ (Wallets)
-- ------------------------------------------------------------------------------
-- السماح للمستخدم برؤية محفظته فقط
CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- السماح للمسؤولين برؤية كل المحافظ
CREATE POLICY "Admins can view all wallets" ON wallets
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admins));

-- 6. سياسات جدول معاملات المحفظة (Wallet Transactions)
-- ------------------------------------------------------------------------------
-- السماح للمستخدم برؤية معاملاته فقط
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT
  USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));

-- السماح للمسؤولين برؤية كل المعاملات
CREATE POLICY "Admins can view all transactions" ON wallet_transactions
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admins));

-- 7. سياسات جدول طلبات السحب (Payouts)
-- ------------------------------------------------------------------------------
-- السماح للمستخدم برؤية طلبات السحب الخاصة به
CREATE POLICY "Users can view own payouts" ON payouts
  FOR SELECT
  USING (auth.uid() = user_id);

-- السماح للمستخدم بإنشاء طلب سحب لنفسه
CREATE POLICY "Users can create payouts" ON payouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- السماح للمسؤولين بإدارة كل طلبات السحب
CREATE POLICY "Admins can manage payouts" ON payouts
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admins));

-- 8. سياسات طرق الدفع (User Payment Methods)
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can manage own payment methods" ON user_payment_methods
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment methods" ON user_payment_methods
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admins));
