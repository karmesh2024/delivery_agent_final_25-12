# خطة بناء نادي Scope Zone - المستند الشامل

## تقييم عام (بصراحة مهنية)

النتيجة:
- ✅ معماريًا سليمة
- ✅ قابلة للتنفيذ على Supabase
- ✅ متوافقة مع البزنس الحالي
- ✅ ما فيهاش تعارض Auth أو نقاط
- ✅ تفكير Platform مش Feature

**أنت فعليًا عامل: Club-as-a-Layer Architecture**

وده مستوى متقدم جدًا مقارنة بتطبيقات تدوير أو Loyalty تقليدية.

---

## نظرة عامة

بناء نظام نادي Scope Zone كطبقة ذكية فوق البزنس الحالي، مع الحفاظ على:
- **Auth واحد**: Supabase Auth
- **Profile واحد**: `new_profiles` 
- **تكامل مع النظام الحالي**: النقاط، المحافظ، الطلبات

---

## المرحلة 1: قاعدة البيانات والهيكل الأساسي

### 1.1 إنشاء جداول قاعدة البيانات

#### أ. `club_memberships` (عضوية النادي)

```sql
CREATE TABLE club_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  membership_level VARCHAR(20) DEFAULT 'community' CHECK (membership_level IN ('community', 'active', 'ambassador', 'partner')),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Trigger: كل مستخدم جديد يحصل تلقائياً على community membership
CREATE OR REPLACE FUNCTION auto_create_club_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO club_memberships (user_id, membership_level)
  VALUES (NEW.id, 'community')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_profile_insert
AFTER INSERT ON new_profiles
FOR EACH ROW
EXECUTE FUNCTION auto_create_club_membership();
```

**الحقول:**
- `user_id`: ربط مع `new_profiles` (Auth واحد)
- `membership_level`: community (افتراضي) | active | ambassador | partner
- `start_date` / `end_date`: مدة العضوية
- `is_active`: حالة العضوية

#### ب. `club_points_wallet` (محفظة نقاط النادي)

```sql
CREATE TABLE club_points_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**الحقول:**
- `points_balance`: رصيد النقاط الحالي
- `lifetime_points`: إجمالي النقاط المكتسبة على مدار العمر

#### ج. `club_points_transactions` (معاملات نقاط النادي)

```sql
CREATE TABLE club_points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('EARNED', 'USED', 'EXPIRED', 'ADJUSTED', 'BONUS', 'CONVERTED')),
  points INTEGER NOT NULL,
  points_before INTEGER NOT NULL,
  points_after INTEGER NOT NULL,
  reason VARCHAR(100),
  source VARCHAR(50), -- 'waste_collection', 'ad_view', 'event_attendance', 'admin_bonus', 'reward_redeem'
  related_order_id UUID,
  related_offer_id UUID,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**أنواع المعاملات:**
- `EARNED`: كسب نقاط
- `USED`: استخدام نقاط (استبدال جائزة)
- `EXPIRED`: انتهاء صلاحية نقاط
- `ADJUSTED`: تعديل يدوي
- `BONUS`: مكافأة إضافية
- `CONVERTED`: تحويل من نقاط المخلفات

**المصادر (source):**
- `waste_collection`: من استبدال مخلفات
- `ad_view`: من مشاهدة إعلان
- `event_attendance`: من حضور فعالية
- `admin_bonus`: مكافأة إدارية
- `reward_redeem`: استبدال جائزة

#### د. `club_partners` (الرعاة/الشركاء)

```sql
CREATE TABLE club_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES new_profiles(id), -- الشريك قد يكون user
  company_name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(50) CHECK (partner_type IN ('merchant', 'sponsor', 'recycler', 'media')),
  logo_url TEXT,
  description TEXT,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  website TEXT,
  partnership_start_date DATE,
  partnership_end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**أنواع الشركاء:**
- `merchant`: تاجر (سوبرماركت، محل)
- `sponsor`: راعي (معلن)
- `recycler`: مُعاد تدوير
- `media`: إعلامي (راديو، إعلانات)

#### هـ. `club_rewards` (الهدايا والجوائز)

```sql
CREATE TABLE club_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES club_partners(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  reward_type VARCHAR(50) CHECK (reward_type IN ('wallet_credit', 'discount_code', 'product', 'service')),
  points_required INTEGER NOT NULL,
  quantity_available INTEGER,
  quantity_redeemed INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  redemption_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**أنواع الجوائز:**
- `wallet_credit`: رصيد محفظة (إضافة مبلغ للمحفظة)
- `discount_code`: كود خصم (للمعلنين/الشركاء)
- `product`: منتج مجاني (من متجر كرمش)
- `service`: خصم على خدمات الجمع

**ملاحظات:**
- `partner_id` قد يكون NULL للجوائز من النظام
- `quantity_available` قد يكون NULL للجوائز غير المحدودة

#### و. `club_reward_redemptions` (سجلات الاستبدال)

```sql
CREATE TABLE club_reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES new_profiles(id),
  reward_id UUID NOT NULL REFERENCES club_rewards(id),
  points_spent INTEGER NOT NULL,
  redemption_code VARCHAR(100) UNIQUE, -- QR أو كود للاستخدام
  redemption_type VARCHAR(50), -- 'wallet_credit', 'discount_code', etc.
  redemption_data JSONB, -- بيانات إضافية (مبلغ المحفظة، كود الخصم، إلخ)
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**حالات الاستبدال:**
- `pending`: معلق
- `completed`: مكتمل
- `cancelled`: ملغى
- `expired`: منتهي الصلاحية

**redemption_data (JSONB):**
- للـ `wallet_credit`: `{ "amount": 50, "currency": "EGP" }`
- للـ `discount_code`: `{ "code": "SCOPE20", "discount_percent": 20 }`

#### ز. `club_activities` (لاحقاً - الفعاليات/البث)

```sql
-- Placeholder للطور القادم
CREATE TABLE club_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type VARCHAR(50),
  title VARCHAR(255),
  scheduled_at TIMESTAMPTZ,
  partner_id UUID REFERENCES club_partners(id),
  points_reward INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 تحديث `new_profiles`

- إضافة حقل `role` (user | partner | admin) إن لم يكن موجوداً
- الحقل `points` الحالي يبقى للنقاط العادية (من المخلفات)
- نقاط النادي في `club_points_wallet` منفصلة منطقياً

---

## المرحلة 2: Backend Services & Redux

### 2.1 Domain Structure

```
src/domains/club-zone/
├── types/
│   └── index.ts
├── services/
│   ├── clubMembershipService.ts
│   ├── clubPointsService.ts
│   ├── clubPartnersService.ts
│   └── clubRewardsService.ts
├── store/
│   └── clubZoneSlice.ts
└── pages/
    ├── ClubDashboardPage.tsx
    ├── MembersPage.tsx
    ├── PointsPage.tsx
    ├── RewardsPage.tsx
    └── PartnersPage.tsx
```

### 2.2 Types & Interfaces

إنشاء `src/domains/club-zone/types/index.ts`:

```typescript
// Membership Types
export enum MembershipLevel {
  COMMUNITY = 'community',
  ACTIVE = 'active',
  AMBASSADOR = 'ambassador',
  PARTNER = 'partner',
}

export interface ClubMembership {
  id: string;
  user_id: string;
  membership_level: MembershipLevel;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  user_name?: string;
  user_phone?: string;
}

// Points Types
export interface ClubPointsWallet {
  id: string;
  user_id: string;
  points_balance: number;
  lifetime_points: number;
  updated_at: string;
}

export enum ClubPointsTransactionType {
  EARNED = 'EARNED',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  ADJUSTED = 'ADJUSTED',
  BONUS = 'BONUS',
  CONVERTED = 'CONVERTED',
}

export type PointsSource = 
  | 'waste_collection'
  | 'ad_view'
  | 'event_attendance'
  | 'admin_bonus'
  | 'reward_redeem';

export interface ClubPointsTransaction {
  id: string;
  user_id: string;
  transaction_type: ClubPointsTransactionType;
  points: number;
  points_before: number;
  points_after: number;
  reason?: string;
  source?: PointsSource;
  related_order_id?: string;
  related_offer_id?: string;
  description?: string;
  created_by?: string;
  created_at: string;
  // Joined data
  user_name?: string;
}

// Partners Types
export enum PartnerType {
  MERCHANT = 'merchant',
  SPONSOR = 'sponsor',
  RECYCLER = 'recycler',
  MEDIA = 'media',
}

export interface ClubPartner {
  id: string;
  user_id?: string;
  company_name: string;
  partner_type: PartnerType;
  logo_url?: string;
  description?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
  partnership_start_date?: string;
  partnership_end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Statistics
  total_rewards?: number;
  total_redemptions?: number;
}

// Rewards Types
export enum RewardType {
  WALLET_CREDIT = 'wallet_credit',
  DISCOUNT_CODE = 'discount_code',
  PRODUCT = 'product',
  SERVICE = 'service',
}

export interface ClubReward {
  id: string;
  partner_id?: string;
  title: string;
  description?: string;
  image_url?: string;
  reward_type: RewardType;
  points_required: number;
  quantity_available?: number;
  quantity_redeemed: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  is_featured: boolean;
  redemption_instructions?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  partner_name?: string;
}

export enum RedemptionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  redemption_code?: string;
  redemption_type: RewardType;
  redemption_data?: any; // JSONB
  status: RedemptionStatus;
  redeemed_at?: string;
  expires_at?: string;
  created_at: string;
  // Joined data
  reward_title?: string;
  user_name?: string;
}

// Dashboard Statistics
export interface ClubDashboardStats {
  total_members: number;
  active_members: number;
  total_points_balance: number;
  total_points_spent: number;
  active_rewards: number;
  active_partners: number;
  top_reward: {
    id: string;
    title: string;
    redemptions_count: number;
  };
  weekly_activity: {
    date: string;
    points_earned: number;
    redemptions: number;
  }[];
}
```

### 2.3 Services

#### `clubMembershipService.ts`
```typescript
- getMemberships(filters?)
- getMembershipByUserId(userId)
- updateMembershipLevel(userId, newLevel)
- getMembershipStats()
```

#### `clubPointsService.ts`
```typescript
- getPointsWallet(userId)
- getPointsTransactions(filters?)
- addPoints(userId, points, source, reason?)
- deductPoints(userId, points, reason?)
- convertWastePointsToClubPoints(userId, points, conversionRate?)
- getPointsStats(userId?)
```

#### `clubPartnersService.ts`
```typescript
- getPartners(filters?)
- getPartnerById(id)
- createPartner(data)
- updatePartner(id, updates)
- getPartnerStats(partnerId)
```

#### `clubRewardsService.ts`
```typescript
- getRewards(filters?)
- getRewardById(id)
- createReward(data)
- updateReward(id, updates)
- redeemReward(userId, rewardId)
- getRedemptions(filters?)
- getRedemptionById(id)
```

### 2.4 Redux Slice

إنشاء `src/domains/club-zone/store/clubZoneSlice.ts`:

- State: memberships, points, partners, rewards, redemptions, stats
- Async thunks: fetch, create, update, redeem, convert
- Actions: reset, setFilter

---

## المرحلة 3: UI Components & Pages

### 3.1 Dashboard الرئيسي

إنشاء `src/app/club-zone/page.tsx`:

**المكونات:**
- KPI Cards:
  - عدد أعضاء النادي
  - إجمالي النقاط المصروفة
  - عدد الجوائز النشطة
  - عدد الشركاء/الرعاة
- Chart: أكثر هدية تم استبدالها
- Chart: نشاط الأسبوع (points earned, redemptions)
- Recent Activity Table

### 3.2 إدارة الأعضاء

إنشاء `src/app/club-zone/members/page.tsx`:

**المكونات:**
- Table: قائمة الأعضاء
  - الاسم، الهاتف
  - مستوى العضوية (Badge)
  - رصيد نقاط النادي
  - تاريخ الانضمام
- Filters:
  - حسب المستوى
  - حسب النشاط
- Actions:
  - ترقية العضوية
  - عرض التفاصيل

### 3.3 إدارة النقاط

إنشاء `src/app/club-zone/points/page.tsx`:

**المكونات:**
- Stats Cards:
  - إجمالي النقاط
  - النقاط المكتسبة
  - النقاط المستخدمة
- Filters:
  - حسب النوع
  - حسب المصدر
  - حسب الفترة
- Table: معاملات النقاط
- Dialog: تحويل نقاط (من نقاط المخلفات)

### 3.4 إدارة الجوائز

إنشاء `src/app/club-zone/rewards/page.tsx`:

**المكونات:**
- Grid/List: عرض الجوائز
  - الصورة، العنوان
  - النقاط المطلوبة
  - الكمية المتاحة
  - الشريك الراعي
- Dialog: إنشاء/تعديل جائزة
- Filters:
  - حسب النوع
  - حسب الشريك
  - حسب الحالة
- Stats: عدد الاستبدالات لكل جائزة

### 3.5 إدارة الرعاة

إنشاء `src/app/club-zone/partners/page.tsx`:

**المكونات:**
- Table: قائمة الرعاة
  - اسم الشركة
  - النوع
  - اللوجو
  - حالة الشراكة
- Dialog: إنشاء/تعديل شريك
- Stats per Partner:
  - عدد الجوائز
  - عدد الاستبدالات
  - Cost per reward (لاحقاً)
- Filters: حسب النوع، الحالة

---

## المرحلة 4: التكامل مع Sidebar

### 4.1 تحديث Sidebar

في `src/shared/layouts/Sidebar.tsx`:

```typescript
import { FiAward } from 'react-icons/fi'; // أو أيقونة مناسبة

const mainRoutes = [
  // ... existing routes
  {
    name: "نادي Scope Zone",
    href: "/club-zone",
    icon: FiAward,
    subRoutes: [
      { name: "لوحة التحكم", href: "/club-zone" },
      { name: "الأعضاء", href: "/club-zone/members" },
      { name: "النقاط", href: "/club-zone/points" },
      { name: "الجوائز", href: "/club-zone/rewards" },
      { name: "الرعاة", href: "/club-zone/partners" },
    ],
  },
  // ... other routes
];
```

---

## المرحلة 5: المنطق البرمجي

### 5.1 آلية كسب نقاط النادي

#### أ. من استبدال مخلفات:
```typescript
// عند تأكيد الطلب (delivery_order confirmed)
// Trigger أو Function:
- حساب النقاط من الطلب
- تحويل نسبة (قابلة للإعداد) إلى club_points
- تسجيل المعاملة في club_points_transactions
```

#### ب. من مشاهدة إعلان:
```typescript
// API: POST /club-zone/points/earn-from-ad
{
  userId,
  partnerId,
  points,
  adId
}
```

#### ج. من فعالية:
```typescript
// API: POST /club-zone/points/earn-from-event
{
  userId,
  activityId,
  points
}
```

#### د. مكافأة عشوائية:
```typescript
// Admin action من Dashboard
{
  userId,
  points,
  reason: 'admin_bonus',
  description
}
```

### 5.2 آلية استبدال الجوائز

**Workflow:**
1. التحقق من الرصيد (`club_points_wallet.points_balance >= points_required`)
2. التحقق من الكمية (`quantity_available > quantity_redeemed` أو NULL)
3. التحقق من الصلاحية (`valid_until` > NOW)
4. خصم النقاط (`update_club_points_wallet` + transaction record)
5. إنشاء `reward_redemption`:
   - `redemption_code`: فريد (UUID أو custom code)
   - `redemption_data`: حسب نوع الجائزة
   - `status`: 'completed' للفورية، 'pending' للموافقة
6. إذا كانت `wallet_credit`:
   - إضافة المبلغ للمحفظة (`wallets.balance`)
   - تسجيل في `wallet_transactions`
7. تحديث `club_rewards.quantity_redeemed`

### 5.3 التحويل بين النقاط

**تحويل نقاط المخلفات إلى نقاط النادي:**

```typescript
// API: POST /club-zone/points/convert
{
  userId,
  pointsFromWaste,
  conversionRate: 1.0 // نسبة التحويل (افتراضياً 1:1)
}

// Logic:
1. التحقق من رصيد نقاط المخلفات (new_profiles.points)
2. خصم من new_profiles.points
3. إضافة إلى club_points_wallet.points_balance
4. تسجيل في points_transactions (USED)
5. تسجيل في club_points_transactions (EARNED, source: 'converted')
```

---

## المرحلة 6: Database Functions & Triggers

### 6.1 Function: تحديث رصيد نقاط النادي

```sql
CREATE OR REPLACE FUNCTION update_club_points_wallet(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type VARCHAR,
  p_reason VARCHAR DEFAULT NULL,
  p_source VARCHAR DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
BEGIN
  -- Get or create wallet
  INSERT INTO club_points_wallet (user_id, points_balance, lifetime_points)
  VALUES (p_user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current balance
  SELECT COALESCE(points_balance, 0) INTO v_balance_before
  FROM club_points_wallet
  WHERE user_id = p_user_id;
  
  -- Update balance based on transaction type
  IF p_transaction_type IN ('EARNED', 'BONUS', 'CONVERTED') THEN
    -- Add points
    UPDATE club_points_wallet
    SET points_balance = points_balance + p_points,
        lifetime_points = lifetime_points + p_points,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSIF p_transaction_type IN ('USED', 'EXPIRED', 'ADJUSTED') THEN
    -- Subtract points
    UPDATE club_points_wallet
    SET points_balance = GREATEST(0, points_balance - p_points),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Get new balance
  SELECT points_balance INTO v_balance_after
  FROM club_points_wallet
  WHERE user_id = p_user_id;
  
  -- Insert transaction record
  INSERT INTO club_points_transactions (
    user_id, transaction_type, points, points_before, points_after, reason, source
  ) VALUES (
    p_user_id, p_transaction_type, p_points, v_balance_before, v_balance_after, p_reason, p_source
  );
END;
$$ LANGUAGE plpgsql;
```

### 6.2 Trigger: إنشاء محفظة نقاط تلقائياً

```sql
CREATE OR REPLACE FUNCTION auto_create_club_points_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO club_points_wallet (user_id, points_balance, lifetime_points)
  VALUES (NEW.user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_club_membership_insert
AFTER INSERT ON club_memberships
FOR EACH ROW
EXECUTE FUNCTION auto_create_club_points_wallet();
```

---

## المرحلة 7: UI Enhancements

### 7.1 Tooltips (مثل نظام النقاط)

- إضافة `InfoTooltip` لكل قسم وحقل
- شرح آلية العمل للإداريين الجدد

### 7.2 Charts & Analytics

- استخدام مكتبة charts (Recharts أو Chart.js)
- عرض رسوم بيانية للنشاط والإحصائيات
- Weekly Activity Chart
- Top Rewards Chart
- Points Distribution Chart

---

## التكامل مع النظام الحالي

### لا تغييرات جذرية:

- ✅ `new_profiles` يبقى كما هو (إضافة trigger للعضوية فقط)
- ✅ `wallets` يبقى كما هو (للربح المالي)
- ✅ نظام النقاط الحالي (`points_configurations`) يبقى منفصلاً
- ✅ نقاط النادي (`club_points_wallet`) منفصلة منطقياً

### الربط:

- ✅ كل `club_membership` مربوط بـ `user_id` من `new_profiles`
- ✅ كل `reward_redemption` مربوط بـ `user_id`
- ✅ كل `club_reward` قد يكون مربوط بـ `partner_id`

---

## الهوية الموحدة (Single Identity)

### 🔐 Auth واحد (Supabase Auth)

- Email / Phone
- Login واحد
- Token واحد

سواء دخل من:
- تطبيق الموبايل 📱
- موقع النادي 🌐
- لوحة الشريك 🤝

### 💡 مفيش تعارض

- كل Partner هو User
- كل User هو Club Member افتراضيًا
- الفصل يتم فقط بالـ `role` و `membership_level`

---

## ملاحظات التنفيذ

1. **Auth واحد**: جميع الجداول تستخدم `user_id` من `new_profiles` (المرتبط بـ Supabase Auth)
2. **Trigger تلقائي**: كل مستخدم جديد يحصل على `community` membership تلقائياً
3. **فصل النقاط**: نقاط النادي منفصلة عن نقاط المخلفات لكن يمكن التحويل بينها
4. **القابلية للتوسع**: إضافة `club_activities` للطور القادم (البث/الفعاليات)
5. **التكامل الذكي**: لا كسر للنظام الحالي، فقط طبقة إضافية

---

## الملفات الرئيسية المطلوبة

### Database:
1. `supabase/migrations/XXXX_create_club_zone_tables.sql` - جميع الجداول والـ triggers

### Types & Interfaces:
2. `src/domains/club-zone/types/index.ts`

### Services:
3. `src/domains/club-zone/services/clubMembershipService.ts`
4. `src/domains/club-zone/services/clubPointsService.ts`
5. `src/domains/club-zone/services/clubPartnersService.ts`
6. `src/domains/club-zone/services/clubRewardsService.ts`

### Redux:
7. `src/domains/club-zone/store/clubZoneSlice.ts`
8. تحديث `src/store/index.ts` ليشمل `clubZone` reducer

### Pages:
9. `src/app/club-zone/page.tsx` (Dashboard)
10. `src/app/club-zone/members/page.tsx`
11. `src/app/club-zone/points/page.tsx`
12. `src/app/club-zone/rewards/page.tsx`
13. `src/app/club-zone/partners/page.tsx`

### UI Components:
14. `src/domains/club-zone/components/ClubStatsCard.tsx`
15. `src/domains/club-zone/components/MembershipBadge.tsx`
16. `src/domains/club-zone/components/RewardCard.tsx`

### Navigation:
17. تحديث `src/shared/layouts/Sidebar.tsx`

---

## مراحل التنفيذ (Roadmap)

### Phase 1 (MVP - أسبوعين):
- ✅ إنشاء جداول قاعدة البيانات
- ✅ Services & Redux الأساسية
- ✅ Dashboard الرئيسي
- ✅ إدارة الأعضاء (عرض + ترقية)
- ✅ إدارة النقاط (عرض المعاملات)
- ✅ إدارة الجوائز (CRUD)
- ✅ إدارة الرعاة (CRUD)

### Phase 2 (تحسينات - أسبوع):
- ✅ تحويل النقاط (من نقاط المخلفات)
- ✅ تقارير وإحصائيات
- ✅ Tooltips توضيحية
- ✅ Charts & Analytics

### Phase 3 (لاحقاً):
- ⏳ البث / الراديو
- ⏳ الفعاليات
- ⏳ المجتمع المصغر

---

## تحسينات ضرورية قبل التسليم النهائي

### 3.8 ERD النهائي (Entity Relationship Diagram)

العلاقات بين الجداول:

```
new_profiles (1)
 ├── club_memberships (1)          [1:1 إجبارية]
 ├── club_points_wallet (1)         [1:1 إجبارية]
 ├── club_points_transactions (∞)   [1:many]
 ├── club_reward_redemptions (∞)    [1:many]
 └── club_partners (0..1)           [1:1 اختيارية - إذا كان شريك]

club_partners (1)
 └── club_rewards (∞)               [1:many]

club_rewards (1)
 └── club_reward_redemptions (∞)    [1:many]
```

**ملاحظات ERD مهمة:**

- ✅ العلاقة User ↔ Club Member = **1:1 إجبارية** (كل user عضو تلقائياً)
- ✅ العلاقة User ↔ Partner = **1:1 اختيارية** (User قد يكون شريك)
- ✅ Partner = User + Role + Club Membership Level
- ✅ مفيش أي Table جديدة للـ Auth (نستخدم Supabase Auth مباشرة)

### 3.9 User Journey Diagrams (مسارات المستخدم)

#### 🎯 Journey 1: مستخدم جديد (App → Club)

```
Register / Login
  ↓
Create new_profiles
  ↓ (Trigger تلقائي)
Create club_membership (community)
  ↓ (Trigger تلقائي)
Create club_points_wallet (points_balance = 0)
  ↓
User sees:
  - رصيد نقاط المخلفات (new_profiles.points)
  - رصيد نقاط النادي (club_points_wallet.points_balance)
  - العضوية: Community
```

#### 🎯 Journey 2: كسب نقاط من المخلفات

```
User creates waste order
  ↓
Order confirmed (delivery_order.status = 'completed')
  ↓
System calculates waste points (from points_configurations)
  ↓
Split logic (قابل للإعداد):
  - Add to new_profiles.points (نقاط المخلفات)
  - Convert % → club_points_wallet (نقاط النادي)
    Example: 30% من نقاط المخلفات → نقاط النادي
  ↓
Insert records:
  - points_transactions (type: EARNED)
  - club_points_transactions (type: EARNED, source: 'waste_collection')
```

#### 🎯 Journey 3: استبدال جائزة

```
User opens rewards list
  ↓
Checks club_points_wallet.points_balance
  ↓
User selects reward
  ↓
System validates:
  - balance >= points_required ✅
  - quantity_available > quantity_redeemed (أو NULL) ✅
  - valid_until > NOW ✅
  ↓
Deduct points:
  - update_club_points_wallet (USED)
  - Insert club_points_transactions
  ↓
Create reward_redemption:
  - redemption_code (UUID أو custom code)
  - redemption_type = reward.reward_type
  - status = 'completed' (للفورية)
  ↓
Apply reward based on type:
  - wallet_credit → Add to wallets.balance + wallet_transactions
  - discount_code → Save in redemption_data JSONB
  - product → Create order or reserve product
  - service → Create service voucher
  ↓
Update club_rewards.quantity_redeemed
```

#### 🎯 Journey 4: Partner Onboarding

```
Admin creates Partner:
  - Insert club_partners
  - Update new_profiles.role = 'partner'
  - Update club_memberships.membership_level = 'partner'
  ↓
Partner logs in
  ↓
System checks:
  - role = 'partner' ✅
  - membership_level = 'partner' ✅
  ↓
Partner sees:
  - Partner dashboard (مخصص)
  - His rewards (partner_rewards_view)
  - Redemption stats (for his rewards)
  - Partner management tools
```

### 3.10 RLS Policies (Row Level Security) - ⚠️ ضروري جداً

**بدون RLS واضحة → المشروع هيقف!**

#### أ. RLS Policies للـ `club_points_wallet`

```sql
-- تفعيل RLS
ALTER TABLE club_points_wallet ENABLE ROW LEVEL SECURITY;

-- User can read his own wallet
CREATE POLICY "User can read own club wallet"
ON club_points_wallet
FOR SELECT
USING (user_id = auth.uid());

-- Admin can read all wallets
CREATE POLICY "Admin can read all club wallets"
ON club_points_wallet
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM new_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- System can insert/update (via service role)
CREATE POLICY "Service role can manage club wallets"
ON club_points_wallet
FOR ALL
USING (auth.role() = 'service_role');
```

#### ب. RLS Policies للـ `club_memberships`

```sql
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;

-- User can read his own membership
CREATE POLICY "User can read own membership"
ON club_memberships
FOR SELECT
USING (user_id = auth.uid());

-- Admin can manage all memberships
CREATE POLICY "Admin can manage all memberships"
ON club_memberships
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM new_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

#### ج. RLS Policies للـ `club_rewards`

```sql
ALTER TABLE club_rewards ENABLE ROW LEVEL SECURITY;

-- Everyone can read active rewards
CREATE POLICY "Everyone can read active rewards"
ON club_rewards
FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Admin can manage all rewards
CREATE POLICY "Admin can manage all rewards"
ON club_rewards
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM new_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Partner can manage his own rewards
CREATE POLICY "Partner can manage own rewards"
ON club_rewards
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM club_partners p
    JOIN new_profiles np ON p.user_id = np.id
    WHERE p.id = club_rewards.partner_id
    AND np.id = auth.uid()
    AND np.role = 'partner'
  )
);
```

#### د. RLS Policies للـ `club_reward_redemptions`

```sql
ALTER TABLE club_reward_redemptions ENABLE ROW LEVEL SECURITY;

-- User can read his own redemptions
CREATE POLICY "User can read own redemptions"
ON club_reward_redemptions
FOR SELECT
USING (user_id = auth.uid());

-- Admin can read all redemptions
CREATE POLICY "Admin can read all redemptions"
ON club_reward_redemptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM new_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Partner can read redemptions for his rewards
CREATE POLICY "Partner can read own reward redemptions"
ON club_reward_redemptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM club_rewards r
    JOIN club_partners p ON r.partner_id = p.id
    JOIN new_profiles np ON p.user_id = np.id
    WHERE r.id = club_reward_redemptions.reward_id
    AND np.id = auth.uid()
    AND np.role = 'partner'
  )
);
```

### 3.11 فصل صلاحيات Partner (Views)

#### أ. View للشركاء - جوائزهم فقط

```sql
-- Partner Rewards View
CREATE VIEW partner_rewards_view AS
SELECT 
  r.*,
  p.company_name as partner_name,
  COUNT(rr.id) as total_redemptions
FROM club_rewards r
JOIN club_partners p ON r.partner_id = p.id
LEFT JOIN club_reward_redemptions rr ON r.id = rr.reward_id
WHERE p.user_id = auth.uid()
GROUP BY r.id, p.company_name;

-- RLS على View
ALTER VIEW partner_rewards_view OWNER TO authenticated;

-- Grant permissions
GRANT SELECT ON partner_rewards_view TO authenticated;
```

**الاستخدام:**
```typescript
// في service
const { data } = await supabase
  .from('partner_rewards_view')
  .select('*');
// الشريك يشوف جوائزه فقط
```

#### ب. View لإحصائيات الشركاء

```sql
-- Partner Stats View
CREATE VIEW partner_stats_view AS
SELECT 
  p.id as partner_id,
  p.company_name,
  COUNT(DISTINCT r.id) as total_rewards,
  COUNT(rr.id) as total_redemptions,
  SUM(rr.points_spent) as total_points_redeemed,
  COUNT(DISTINCT rr.user_id) as unique_customers
FROM club_partners p
LEFT JOIN club_rewards r ON p.id = r.partner_id
LEFT JOIN club_reward_redemptions rr ON r.id = rr.reward_id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.company_name;
```

### 3.12 جدول الإعدادات (Club Settings) - اختياري لكن ذكي

```sql
CREATE TABLE club_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES new_profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إعدادات افتراضية
INSERT INTO club_settings (key, value, description) VALUES
('waste_to_club_conversion', '{"rate": 0.3, "enabled": true}', 'نسبة تحويل نقاط المخلفات إلى نقاط النادي (30%)'),
('daily_ad_points_limit', '{"points": 50, "enabled": true}', 'الحد الأقصى للنقاط اليومية من الإعلانات'),
('membership_upgrade_thresholds', '{"active": 1000, "ambassador": 5000}', 'حدود الترقية للمستويات'),
('reward_expiry_days', '{"default": 30, "wallet_credit": null}', 'مدة صلاحية الجوائز باليوم'),
('points_expiry_enabled', '{"enabled": false, "days": null}', 'تفعيل انتهاء صلاحية النقاط');
```

**الاستخدام:**
```typescript
// في service
async function getClubSetting(key: string) {
  const { data } = await supabase
    .from('club_settings')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value;
}

// مثال: الحصول على نسبة التحويل
const conversionRate = await getClubSetting('waste_to_club_conversion');
// { rate: 0.3, enabled: true }
```

**الفوائد:**
- ✅ تغيير السياسات بدون Deploy (تغيير القيم في Database مباشرة)
- ✅ إمكانية إعدادات مختلفة لكل شريك لاحقاً
- ✅ تتبع من قام بتغيير الإعدادات (`updated_by`)

---

## الخلاصة

نحن لا نبني نادي اجتماعي تقليدي. نحن نبني **Layer ذكي فوق البزنس**:
- ✅ يحفّز
- ✅ يربح
- ✅ يبني ولاء
- ✅ بدون مخاطرة قانونية
- ✅ **هوية موحدة** (Single Identity)

---

_تم إعداد هذا المستند كمرجع شامل لبناء نادي Scope Zone داخل نظام كارمش._
