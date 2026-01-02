# أمثلة الكود لتكامل تسعير السلة مع البورصة

## 1. إضافة منتج للسلة

```typescript
// src/services/basketService.ts
import { supabase } from '@/lib/supabase';

export async function addItemToBasket(
  basketId: string,
  wasteDataId: string,
  quantity: number
) {
  // 1. جلب معلومات المنتج
  const { data: wasteData, error: wasteError } = await supabase
    .from('waste_data_admin')
    .select('id, name, weight, catalog_waste_id, price')
    .eq('id', wasteDataId)
    .single();

  if (wasteError || !wasteData) {
    throw new Error('المنتج غير موجود');
  }

  // 2. حساب الوزن الإجمالي
  const totalWeightKg = (wasteData.weight / 1000) * quantity; // weight بالجرام

  // 3. إضافة المنتج للسلة
  const { data: basketContent, error: addError } = await supabase
    .from('basket_contents')
    .insert({
      basket_id: basketId,
      waste_data_id: wasteDataId,
      quantity: quantity,
      total_weight_kg: totalWeightKg
    })
    .select()
    .single();

  if (addError) {
    throw new Error('فشل في إضافة المنتج للسلة');
  }

  return basketContent;
}
```

## 2. التحقق من الحد الأدنى للشحن

```typescript
// src/services/basketService.ts
export async function checkMinimumWeight(basketId: string) {
  const { data, error } = await supabase.rpc('check_minimum_weight_for_basket', {
    basket_id_param: basketId
  });

  if (error) {
    throw new Error('فشل في التحقق من الحد الأدنى');
  }

  // التحقق من أن جميع الأنواع تفي بالحد الأدنى
  const allValid = data.every((item: any) => item.is_valid);
  const invalidItems = data.filter((item: any) => !item.is_valid);

  return {
    allValid,
    invalidItems,
    details: data
  };
}

// استخدام في المكون
const handleCheckMinimum = async () => {
  const result = await checkMinimumWeight(basketId);
  
  if (!result.allValid) {
    toast.error('الوزن غير كافٍ للشحن');
    result.invalidItems.forEach((item: any) => {
      toast.warning(item.message);
    });
    return false;
  }
  
  return true;
};
```

## 3. حساب السعر عند استلام السلة

```typescript
// src/services/deliveryService.ts
export async function calculateBasketPriceOnDelivery(
  basketId: string,
  deliveryOrderId: string
) {
  const { data, error } = await supabase.rpc('calculate_basket_price_on_delivery', {
    basket_id_param: basketId,
    delivery_order_id_param: deliveryOrderId
  });

  if (error) {
    throw new Error('فشل في حساب السعر');
  }

  // حساب الإجمالي
  const totalPrice = data.reduce((sum: number, item: any) => sum + Number(item.total_price), 0);
  const totalPoints = data.reduce((sum: number, item: any) => sum + Number(item.total_points), 0);

  return {
    items: data,
    totalPrice,
    totalPoints
  };
}

// استخدام في صفحة استلام الطلب
const handleReceiveBasket = async (basketId: string, deliveryOrderId: string) => {
  try {
    // 1. التحقق من الحد الأدنى
    const minCheck = await checkMinimumWeight(basketId);
    if (!minCheck.allValid) {
      toast.error('الوزن غير كافٍ للشحن');
      return;
    }

    // 2. حساب السعر
    const priceCalculation = await calculateBasketPriceOnDelivery(basketId, deliveryOrderId);

    // 3. تحديث delivery_order
    await supabase
      .from('delivery_orders')
      .update({
        actual_total_amount: priceCalculation.totalPrice,
        status: 'completed'
      })
      .eq('id', deliveryOrderId);

    toast.success(`تم حساب السعر: ${priceCalculation.totalPrice} ج.م`);
  } catch (error) {
    console.error('خطأ في استلام السلة:', error);
    toast.error('فشل في استلام السلة');
  }
};
```

## 4. تحديث السعر في البورصة (يحدث تلقائياً)

```typescript
// src/domains/waste-management/services/exchangeService.ts
export async function updateExchangePrice(
  catalogWasteId: number,
  newBuyPrice: number
) {
  // تحديث السعر في stock_exchange
  const { data, error } = await supabase
    .from('stock_exchange')
    .update({
      buy_price: newBuyPrice,
      last_update: new Date().toISOString()
    })
    .eq('catalog_waste_id', catalogWasteId)
    .select()
    .single();

  if (error) {
    throw new Error('فشل في تحديث السعر');
  }

  // ✅ المزامنة التلقائية: trigger sync_waste_data_admin_price_from_stock_exchange
  // سيقوم تلقائياً بتحديث جميع waste_data_admin التي لها نفس catalog_waste_id

  return data;
}
```

## 5. جلب أسعار البورصة مع catalog_waste_id

```typescript
// src/domains/waste-management/services/exchangeService.ts
export async function getExchangePricesByCatalog() {
  const { data, error } = await supabase
    .from('stock_exchange')
    .select(`
      *,
      catalog_waste:catalog_waste_materials(
        id,
        waste_no,
        name,
        main_category_id,
        sub_category_id
      )
    `)
    .not('catalog_waste_id', 'is', null);

  if (error) {
    throw new Error('فشل في جلب أسعار البورصة');
  }

  return data;
}
```

## 6. جلب المنتجات لنوع مخلف معين

```typescript
// src/services/wasteDataService.ts
export async function getProductsByCatalogWaste(catalogWasteId: number) {
  const { data, error } = await supabase
    .from('waste_data_admin')
    .select('*')
    .eq('catalog_waste_id', catalogWasteId);

  if (error) {
    throw new Error('فشل في جلب المنتجات');
  }

  return data;
}
```

## 7. عرض محتويات السلة مع الأسعار

```typescript
// src/components/BasketContents.tsx
export function BasketContents({ basketId }: { basketId: string }) {
  const [contents, setContents] = useState<any[]>([]);

  useEffect(() => {
    loadBasketContents();
  }, [basketId]);

  async function loadBasketContents() {
    const { data, error } = await supabase
      .from('basket_contents')
      .select(`
        *,
        waste_data:waste_data_admin(
          id,
          name,
          weight,
          price,
          price_per_kg,
          catalog_waste_id,
          catalog_waste:catalog_waste_materials(
            id,
            waste_no,
            name
          )
        )
      `)
      .eq('basket_id', basketId);

    if (error) {
      console.error('خطأ في جلب محتويات السلة:', error);
      return;
    }

    setContents(data || []);
  }

  // تجميع حسب catalog_waste_id
  const groupedByCatalog = contents.reduce((acc, item) => {
    const catalogId = item.waste_data?.catalog_waste_id;
    if (!acc[catalogId]) {
      acc[catalogId] = {
        catalogWaste: item.waste_data?.catalog_waste,
        items: [],
        totalWeight: 0
      };
    }
    acc[catalogId].items.push(item);
    acc[catalogId].totalWeight += item.total_weight_kg;
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(groupedByCatalog).map(([catalogId, group]: [string, any]) => (
        <div key={catalogId}>
          <h3>{group.catalogWaste?.name || group.catalogWaste?.waste_no}</h3>
          <p>الوزن الإجمالي: {group.totalWeight.toFixed(2)} كجم</p>
          {/* عرض المنتجات */}
        </div>
      ))}
    </div>
  );
}
```

## 8. إعداد الحد الأدنى للشحن في basket_config

```typescript
// src/domains/product-categories/api/basketConfigService.ts
export async function updateBasketConfigMinimumWeight(
  configId: string,
  minimumWeights: Record<number, number> // { catalog_waste_id: minimum_weight_kg }
) {
  const { data, error } = await supabase
    .from('category_bucket_config') // أو subcategory_bucket_config
    .update({
      minimum_weight_per_category: minimumWeights
    })
    .eq('id', configId)
    .select()
    .single();

  if (error) {
    throw new Error('فشل في تحديث الحد الأدنى');
  }

  return data;
}

// مثال الاستخدام
await updateBasketConfigMinimumWeight(configId, {
  20: 0.5,  // كانزات: 0.5 كجم
  21: 2.0   // بلاستيك: 2.0 كجم
});
```

## 9. عرض السعر المتوقع قبل الشحن

```typescript
// src/components/BasketPricePreview.tsx
export function BasketPricePreview({ basketId }: { basketId: string }) {
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    calculatePreview();
  }, [basketId]);

  async function calculatePreview() {
    // جلب محتويات السلة
    const { data: contents } = await supabase
      .from('basket_contents')
      .select(`
        *,
        waste_data:waste_data_admin(
          catalog_waste_id
        )
      `)
      .eq('basket_id', basketId);

    // تجميع حسب catalog_waste_id
    const grouped = contents?.reduce((acc: any, item: any) => {
      const catalogId = item.waste_data?.catalog_waste_id;
      if (!acc[catalogId]) {
        acc[catalogId] = { totalWeight: 0 };
      }
      acc[catalogId].totalWeight += item.total_weight_kg;
      return acc;
    }, {});

    // جلب أسعار البورصة
    const { data: prices } = await supabase
      .from('stock_exchange')
      .select('catalog_waste_id, buy_price')
      .in('catalog_waste_id', Object.keys(grouped || {}).map(Number));

    // حساب السعر المتوقع
    const previewData = Object.entries(grouped || {}).map(([catalogId, group]: [string, any]) => {
      const price = prices?.find(p => p.catalog_waste_id === Number(catalogId));
      return {
        catalogWasteId: Number(catalogId),
        totalWeight: group.totalWeight,
        pricePerKg: price?.buy_price || 0,
        totalPrice: group.totalWeight * (price?.buy_price || 0)
      };
    });

    const totalPrice = previewData.reduce((sum, item) => sum + item.totalPrice, 0);

    setPreview({
      items: previewData,
      totalPrice
    });
  }

  if (!preview) return <div>جاري الحساب...</div>;

  return (
    <div>
      <h3>السعر المتوقع</h3>
      {preview.items.map((item: any) => (
        <div key={item.catalogWasteId}>
          <p>الوزن: {item.totalWeight.toFixed(2)} كجم</p>
          <p>سعر الكيلو: {item.pricePerKg} ج.م</p>
          <p>السعر: {item.totalPrice.toFixed(2)} ج.م</p>
        </div>
      ))}
      <p><strong>الإجمالي: {preview.totalPrice.toFixed(2)} ج.م</strong></p>
    </div>
  );
}
```

## ملاحظات مهمة

1. **الوزن بالجرام**: `waste_data_admin.weight` بالجرام، يجب تحويله للكيلو عند الحساب
2. **المزامنة التلقائية**: تحديث `buy_price` في `stock_exchange` يحدث تلقائياً جميع المنتجات المرتبطة
3. **الحد الأدنى**: يجب إعداد `minimum_weight_per_category` في `basket_config` قبل السماح بالشحن
4. **الحساب**: `price = (buy_price * weight) / 1000` حيث `weight` بالجرام

