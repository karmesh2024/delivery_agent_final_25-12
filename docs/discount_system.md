# نظام الخصومات على المنتجات

## نظرة عامة

تم إضافة نظام شامل لإدارة الخصومات على المنتجات عبر جميع مستويات التطبيق:

- **إدارة التنظيم والتسلسل**: إضافة خصومات على مستوى الكتالوج
- **إدارة المتاجر الإلكترونية**: عرض وإدارة الخصومات على مستوى المتجر
- **إدارة النقاط والمكافآت**: ربط الخصومات بنظام النقاط

## البنية التقنية

### 1. قاعدة البيانات

#### جدول `store_catalog_products`

```sql
ALTER TABLE public.store_catalog_products
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2);
```

#### جدول `store_products`

```sql
ALTER TABLE public.store_products
ADD COLUMN IF NOT EXISTS is_on_sale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2);
```

#### جدول `store_product_prices`

الجدول موجود مسبقاً ويحتوي على:

- `is_on_sale`: حالة الخصم
- `sale_price`: سعر الخصم
- `max_discount_percentage`: أقصى نسبة خصم مسموحة
- `effective_from` و `effective_to`: فترة صلاحية الخصم

### 2. الواجهات (Interfaces)

#### StoreCatalogProduct

```typescript
export interface StoreCatalogProduct {
    // ... الحقول الموجودة
    is_on_sale?: boolean | null;
    sale_price?: number | null;
}
```

#### نموذج إضافة المنتج

```typescript
const [storeProductForm, setStoreProductForm] = useState({
    // ... الحقول الموجودة
    is_on_sale: false,
    sale_price: "",
});
```

### 3. المزامنة التلقائية

عند إضافة منتج في **إدارة التنظيم**، يتم تلقائياً:

1. حفظ بيانات الخصم في `store_catalog_products`
2. مزامنة الخصم إلى جميع المتاجر المرتبطة عبر `syncProductToLinkedStores`
3. تحديث `store_products` في كل متجر بنفس بيانات الخصم

```typescript
// في storeOrgLinkService.ts
await supabase!
    .from("store_products")
    .upsert({
        // ... الحقول الأخرى
        is_on_sale: catalogProduct.is_on_sale || false,
        sale_price: catalogProduct.sale_price || null,
    });
```

## واجهة المستخدم

### نموذج إضافة منتج (إدارة التنظيم)

```tsx
{/* حقول الخصم */}
<div className="border-t pt-3 mt-3">
    <div className="flex items-center space-x-2 mb-3">
        <Checkbox
            id="is-on-sale"
            checked={storeProductForm.is_on_sale}
            onCheckedChange={(checked) =>
                setStoreProductForm({
                    ...storeProductForm,
                    is_on_sale: checked as boolean,
                })}
        />
        <Label htmlFor="is-on-sale" className="cursor-pointer font-medium">
            المنتج عليه خصم
        </Label>
    </div>

    {storeProductForm.is_on_sale && (
        <div>
            <Label>سعر البيع بعد الخصم (ج) *</Label>
            <Input
                type="number"
                step="0.01"
                min="0"
                value={storeProductForm.sale_price}
                onChange={(e) =>
                    setStoreProductForm({
                        ...storeProductForm,
                        sale_price: e.target.value,
                    })}
                placeholder="السعر بعد الخصم"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
                يجب أن يكون أقل من السعر الأصلي
            </p>
        </div>
    )}
</div>;
```

## آلية العمل

### 1. إضافة منتج بخصم

```
المستخدم → إدارة التنظيم → إضافة منتج
  ↓
تحديد السعر الأصلي: 100 ج
  ↓
تفعيل "المنتج عليه خصم" ✓
  ↓
إدخال سعر الخصم: 80 ج
  ↓
حفظ → مزامنة تلقائية لجميع المتاجر
```

### 2. عرض المنتج في المتجر

```typescript
// في صفحة المنتجات
{
    product.is_on_sale
        ? (
            <div>
                <span className="line-through text-gray-500">
                    {product.default_selling_price} ج
                </span>
                <span className="text-red-600 font-bold ml-2">
                    {product.sale_price} ج
                </span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">
                    خصم {calculateDiscount(product)}%
                </span>
            </div>
        )
        : <span>{product.default_selling_price} ج</span>;
}
```

### 3. حساب نسبة الخصم

```typescript
function calculateDiscount(product: Product): number {
    if (!product.is_on_sale || !product.sale_price) return 0;
    const original = parseFloat(product.default_selling_price);
    const sale = parseFloat(product.sale_price);
    return Math.round(((original - sale) / original) * 100);
}
```

## التكامل مع نظام النقاط

### إضافة نقاط إضافية للمنتجات المخفضة

```typescript
// يمكن إضافة منطق لمنح نقاط إضافية عند شراء منتج مخفض
const calculateLoyaltyPoints = (product: Product): number => {
    let points = product.loyalty_points_earned || 0;

    if (product.is_on_sale) {
        // مثال: مضاعفة النقاط للمنتجات المخفضة
        points = points * 1.5;
    }

    return Math.round(points);
};
```

## ملفات التعديل

### الملفات المعدلة:

1. `src/domains/warehouse-management/pages/OrganizationStructurePage.tsx`
   - إضافة حقول الخصم للنموذج
   - تحديث دالة الحفظ

2. `src/domains/warehouse-management/services/storeOrgLinkService.ts`
   - تحديث `syncProductToLinkedStores` لمزامنة الخصومات

3. `src/services/storeCatalogProductService.ts`
   - إضافة `is_on_sale` و `sale_price` للواجهة

### الملفات الجديدة:

1. `src/migrations/add_discount_to_catalog.sql`
2. `src/migrations/add_discount_to_store_products.sql`

## خطوات التنفيذ

### 1. تطبيق Migrations

```bash
# في Supabase SQL Editor
-- تنفيذ add_discount_to_catalog.sql
-- تنفيذ add_discount_to_store_products.sql
```

### 2. تحديث Prisma Schema (اختياري)

```prisma
model store_catalog_products {
  // ... الحقول الموجودة
  is_on_sale    Boolean?  @default(false)
  sale_price    Decimal?  @db.Decimal(10, 2)
}

model store_products {
  // ... الحقول الموجودة
  is_on_sale    Boolean?  @default(false)
  sale_price    Decimal?  @db.Decimal(10, 2)
}
```

### 3. إعادة توليد Prisma Client

```bash
npx prisma generate
```

## الاستخدام

### إضافة منتج بخصم:

1. اذهب إلى **إدارة التنظيم**
2. اختر القطاع → التصنيف → الفئة الأساسية → الفئة الفرعية
3. اضغط "إضافة منتج للمتجر"
4. أدخل بيانات المنتج والسعر الأصلي
5. فعّل "المنتج عليه خصم"
6. أدخل سعر الخصم
7. احفظ → سيتم المزامنة تلقائياً

### عرض المنتجات المخفضة:

- في صفحة المنتجات بالمتجر، ستظهر المنتجات المخفضة بـ:
  - السعر الأصلي مشطوب
  - السعر المخفض بلون مميز
  - شارة "خصم X%"

## ملاحظات مهمة

1. **التحقق من الصحة**: يجب أن يكون سعر الخصم أقل من السعر الأصلي
2. **المزامنة التلقائية**: أي تغيير في الكتالوج يتطلب مزامنة يدوية للمنتجات
   القديمة
3. **الأمان**: التحقق من الصلاحيات قبل السماح بتعديل الخصومات
4. **الأداء**: استخدام Indexes على `is_on_sale` لتسريع الاستعلامات

## التطوير المستقبلي

### ميزات مقترحة:

1. **جدولة الخصومات**: تحديد تاريخ بداية ونهاية للخصم
2. **خصومات متعددة**: دعم أكثر من نوع خصم (نسبة مئوية، مبلغ ثابت، اشتر X واحصل
   على Y)
3. **خصومات حسب الفئة**: تطبيق خصم على فئة كاملة
4. **تقارير الخصومات**: تحليل أداء الخصومات والمبيعات
5. **إشعارات الخصومات**: إرسال إشعارات للعملاء عند إضافة خصومات جديدة

## الدعم الفني

للمزيد من المعلومات أو المساعدة، راجع:

- `src/domains/warehouse-management/services/storeOrgLinkService.ts`
- `src/services/storeCatalogProductService.ts`
- `src/migrations/`
