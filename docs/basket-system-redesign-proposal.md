# 🧺 مقترح إعادة تصميم نظام السلة (Basket System Redesign)

**تاريخ الإنشاء:** يناير 2026  
**الإصدار:** 2.0 (Proposal - Phased Approach)  
**آخر تحديث:** يناير 2026 (بعد التقييم التقني)  
**الحالة:** ✅ جاهز للتنفيذ - Phase 1  
**الأولوية:** 🔴 عالية - يؤثر على تجربة المستخدم الأساسية

---

## ⚡ الخلاصة التنفيذية (Executive Summary)

### 🎯 التقييم التقني

**التصميم:** ✅ **مضبوط جداً** - لكن ثقيل على المرحلة الحالية

**الحل:** ✅ **خطة مرحلية** - 80% قيمة بـ 40% مجهود

### 📊 خطة المراحل (Phased Approach)

| المرحلة | المدة | القيمة | المجهود | الأولوية |
|---------|------|--------|---------|---------|
| **Phase 1** | 2-3 أسابيع | 80% | 40% | 🔴 **الآن** |
| **Phase 2** | بعد التشغيل | 15% | 30% | 🟡 لاحقاً |
| **Phase 3** | عند Volume | 5% | 30% | 🔵 مستقبلي |

### 💰 التأثير الإيجابي المباشر

- ✅ ↑ متوسط وزن الشحنة
- ✅ ↓ شحنات "لسه ناقصة"
- ✅ ↓ تكلفة اللوجستيات لكل كجم
- ✅ ↑ القدرة على البيع لمصانع بدل تجار

**النتيجة:** تحويل من **تاجر سيولة** → **منسق إمداد** (فرق ضخم في الهامش)

---

### 🎯 التقييم التقني (Technical Assessment)

#### ✅ **ما هو ممتاز:**

- ✅ `BasketType` + `BasketStatus` - أساس أي توسع محترم
- ✅ `CollectionBag` + `AgentBag` - فصل نظيف + قابل للتطوير
- ✅ Remote Config من Supabase - تفكير شركة مش MVP
- ✅ Self-reported full للوكيل - واقعي جداً ومش مثالي زيادة

#### ⚠️ **ما يحتاج تهدئة:**

- ⚠️ Density factors دقيقة زيادة بدري → **Phase 2**
- ⚠️ حساب effective load في كل change → **استخدم Calculator**
- ⚠️ Widget + icon update مع كل event → **فقط عند تغيير Status**

**الحل:** ✅ **Progressive Enablement** - تفعيل تدريجي

---

## 📋 جدول المحتويات

1. [المشكلة الحالية](#المشكلة-الحالية)
2. [الوضع الحالي في الكود](#الوضع-الحالي-في-الكود)
3. [المتطلبات الجديدة](#المتطلبات-الجديدة)
4. [الحل المقترح](#الحل-المقترح)
5. [المعمارية الجديدة](#المعمارية-الجديدة)
6. [التعديلات المطلوبة](#التعديلات-المطلوبة)
7. [خطة التنفيذ](#خطة-التنفيذ)
8. [الأسئلة المفتوحة](#الأسئلة-المفتوحة)
9. [🚀 خطة المراحل التنفيذية](#-خطة-المراحل-التنفيذية)
10. [⚠️ ملاحظات تقنية مهمة](#️-ملاحظات-تقنية-مهمة)

---

## 🚀 خطة المراحل التنفيذية (Phased Implementation Plan)

### ⚠️ لماذا المراحل؟

**المشكلة:**
- ❌ التنفيذ الكامل مرة واحدة → يبطئ الإطلاق
- ❌ يزيد Bugs
- ❌ يصعب UX في البداية

**الحل:**
- ✅ **Progressive Enablement** - تفعيل تدريجي
- ✅ 80% قيمة بـ 40% مجهود في المرحلة الأولى
- ✅ الباقي بعد جمع بيانات فعلية

---

### 🟢 Phase 1: الأساسيات (الآن - 2-3 أسابيع)

**الهدف:** فصل السلال + حساب أساسي + UI واضح

#### ✅ المهام الإلزامية:

1. **فصل BasketType**
   - ✅ `BasketType` enum (client, agent)
   - ✅ كل سلة تعرف نوعها

2. **Client Basket (مبسط)**
   - ✅ Bag واحد افتراضي (5 كجم)
   - ✅ Density مبسطة (قيم ثابتة في الكود)
   - ✅ Status + ألوان (empty, filling, almostFull, readyToShip)
   - ✅ Progress Bar واضح

3. **Agent Basket**
   - ✅ صنف واحد فقط
   - ✅ وزن مباشر (بدون density)
   - ✅ زر "الكيس ممتلئ" (Self-reported)
   - ✅ Progress Bar تقديري

4. **UI الأساسي**
   - ✅ Progress Bar لكل نوع
   - ✅ "Ready to Ship" واضح
   - ✅ ألوان بسيطة (أخضر، برتقالي، أحمر)

#### 📊 النتيجة المتوقعة:

```
✅ فصل كامل بين العميل والوكيل
✅ حساب أساسي للامتلاء
✅ تجربة مستخدم واضحة
✅ جاهز للإطلاق
```

#### ⏱️ المدة: **2-3 أسابيع**

---

### 🟡 Phase 2: التحسينات (بعد أول تشغيل فعلي)

**الهدف:** Remote Config + تحسينات بناءً على البيانات

#### ✅ المهام:

1. **Remote Config من Supabase**
   - ✅ جدول `collection_bags`
   - ✅ جدول `basket_settings`
   - ✅ تعديل thresholds من لوحة التحكم
   - ✅ Fallback للقيم الافتراضية

2. **تحسين Density Factors**
   - ✅ تعديل القيم بناءً على البيانات الفعلية
   - ✅ مقارنة estimated vs actual
   - ✅ تحسين تدريجي

3. **Analytics بسيط**
   - ✅ تسجيل estimated vs actual
   - ✅ تقرير بسيط للتحسين

#### 📊 النتيجة المتوقعة:

```
✅ مرونة عالية في الإعدادات
✅ تحسينات بناءً على البيانات
✅ لا حاجة لتحديث الكود لكل تعديل
```

#### ⏱️ المدة: **3-4 أسابيع** (بعد Phase 1)

---

### 🔵 Phase 3: الميزات المتقدمة (عند Volume)

**الهدف:** QR codes + تتبع + تحليلات متقدمة

#### ✅ المهام:

1. **QR Bags**
   - ✅ جدول `user_bags`
   - ✅ QR code لكل كيس
   - ✅ ربط الكيس بالعميل

2. **Analytics متقدم**
   - ✅ تقارير تفصيلية
   - ✅ تحليل patterns
   - ✅ توقعات

3. **Dynamic Pricing**
   - ✅ تسعير ديناميكي بناءً على البيانات
   - ✅ تفاوض أفضل مع المصانع

#### 📊 النتيجة المتوقعة:

```
✅ تتبع كامل للأكياس
✅ بيانات ثرية للقرارات
✅ تحسين مستمر
```

#### ⏱️ المدة: **2-3 أشهر** (عند وجود Volume)

---

## ⚠️ ملاحظات تقنية مهمة (Technical Notes)

### 1. الأداء (Performance)

#### ❌ خطأ شائع:

```dart
// ❌ Recompute تقيل في copyWith
BasketWasteState copyWith({...}) {
  return BasketWasteState.client(
    items: items ?? this.items,  // ⚠️ يحسب كل شيء من جديد
    bag: bag ?? this.bag,
  );
}
```

#### ✅ الحل الصحيح:

```dart
// ✅ Service / Calculator class
class BasketCalculator {
  static BasketWasteState calculateState({
    required BasketType type,
    required List<WasteRecycling> items,
    CollectionBag? bag,
  }) {
    // حساب مرة واحدة فقط
    final totalWeight = items.fold(0.0, (sum, item) => sum + item.weight);
    
    if (type == BasketType.client) {
      final effectiveLoad = bag?.calculateEffectiveLoad(items) ?? totalWeight;
      final fillPercentage = bag?.calculateFillPercentage(items) ?? 0.0;
      final status = bag?.getStatus(items) ?? BasketStatus.empty;
      
      return BasketWasteState(
        basketType: type,
        items: items,
        bag: bag,
        totalWeight: totalWeight,
        effectiveLoad: effectiveLoad,
        fillPercentage: fillPercentage,
        status: status,
        // ...
      );
    } else {
      // Agent logic
    }
  }
}

// في copyWith
BasketWasteState copyWith({...}) {
  // ✅ حساب فقط إذا تغيرت items
  if (items != null && items != this.items) {
    return BasketCalculator.calculateState(
      type: basketType,
      items: items!,
      bag: bag ?? this.bag,
    );
  }
  
  // ✅ تحديث بسيط إذا لم تتغير items
  return BasketWasteState(...);
}
```

---

### 2. Configuration (لا تربط في الكود)

#### ❌ خطأ شائع:

```dart
// ❌ Thresholds مكتوبة في الكود
if (fillPercentage >= 0.85) {  // ⚠️ صعب التعديل
  status = BasketStatus.readyToShip;
}
```

#### ✅ الحل الصحيح:

```dart
// ✅ Config class
class BasketConfig {
  static const double almostFullThreshold = 0.70;
  static const double readyToShipThreshold = 0.85;
  
  // يمكن جلبها من Remote Config لاحقاً
  static Future<BasketConfig> fromRemote() async {
    // جلب من Supabase
  }
}

// في الكود
if (fillPercentage >= BasketConfig.readyToShipThreshold) {
  status = BasketStatus.readyToShip;
}
```

---

### 3. UI/UX للعميل (مبسط)

#### ❌ خطأ شائع:

```dart
// ❌ مصطلحات تقنية
Text('Effective Load: ${state.effectiveLoad} kg')
Text('Density Factor: ${item.densityFactor}')
```

#### ✅ الحل الصحيح:

```dart
// ✅ مصطلحات بسيطة
Text('الكيس قرب يخلص 👍')
Text('${(state.fillPercentage * 100).toStringAsFixed(0)}% ممتلئ')

// ✅ ألوان واضحة
Container(
  color: state.status == BasketStatus.readyToShip 
    ? Colors.red[50] 
    : Colors.green[50],
  child: Text(
    state.status == BasketStatus.readyToShip
      ? 'جاهز للشحن 🚚'
      : 'قيد التعبئة...',
  ),
)
```

---

### 4. UI/UX للوكيل (واضح)

#### ❌ خطأ شائع:

```dart
// ❌ زر معقد
ElevatedButton(
  child: Text('تأكيد امتلاء الكيس بناءً على التقدير'),
)
```

#### ✅ الحل الصحيح:

```dart
// ✅ زر بسيط وواضح
ElevatedButton.icon(
  icon: Icon(Icons.check_circle),
  label: Text('جاهز للشحن'),
  style: ElevatedButton.styleFrom(
    backgroundColor: Colors.green,
    minimumSize: Size(double.infinity, 50),
  ),
)

// ✅ Progress Bar تقديري مع توضيح
Column(
  children: [
    Text('تقدير: ~${(fillPercentage * 100).toStringAsFixed(0)}%'),
    LinearProgressIndicator(value: fillPercentage),
    Text(
      '💡 هذا تقدير فقط - أنت من يحدد متى الكيس جاهز',
      style: TextStyle(fontSize: 12, color: Colors.grey),
    ),
  ],
)
```

---

### 5. Widget Update (لا تحدث مع كل Event)

#### ❌ خطأ شائع:

```dart
// ❌ تحديث Widget مع كل event
Future<void> _onAddWasteItem(...) async {
  // ...
  await HomeWidgetService.updateBasketIcon(...);  // ⚠️ كثير جداً
}
```

#### ✅ الحل الصحيح:

```dart
// ✅ تحديث فقط عند تغيير Status
Future<void> _onAddWasteItem(...) async {
  final newState = state.copyWith(items: updatedItems);
  
  // ✅ تحديث Widget فقط إذا تغير Status
  if (newState.status != state.status) {
    await HomeWidgetService.updateBasketIcon(
      status: newState.status,
      fillPercentage: newState.fillPercentage,
    );
  }
  
  emit(newState);
}
```

---

### 6. Density Factors (قيم ثابتة في Phase 1)

#### ✅ Phase 1 (مبسط):

```dart
// ✅ قيم ثابتة في الكود
class CollectionBag {
  static const Map<WasteType, double> defaultDensityFactors = {
    WasteType.plastic: 0.6,
    WasteType.paper: 0.7,
    WasteType.cans: 0.8,
    WasteType.metal: 1.2,
    WasteType.glass: 1.0,
    WasteType.other: 1.0,
  };
}
```

#### ✅ Phase 2 (مرن):

```dart
// ✅ جلب من Supabase
final densityFactors = await remoteDataSource.getDensityFactors();
```

---

## 🔴 المشكلة الحالية

### 1. عدم الفصل بين أنواع السلال

**الوضع الحالي:**
- ❌ نفس الباسكت يُستخدم للعميل والوكيل
- ❌ لا يوجد تمييز بين:
  - **باسكت العميل**: يجمع كل الأصناف معاً في كيس واحد
  - **باسكت الوكيل**: يجمع صنف واحد فقط حتى الامتلاء

**المشكلة:**
```
العميل يريد:
├─ بلاستيك: 2 كجم
├─ ورق: 1.5 كجم
├─ معادن: 0.5 كجم
└─ المجموع: 4 كجم في كيس واحد ✅

الوكيل يريد:
├─ بلاستيك فقط: 20 كجم
└─ كيس واحد مخصص للبلاستيك ✅
```

**النتيجة:** النظام الحالي لا يدعم هذا الفصل.

---

### 2. عدم وجود حساب ذكي للامتلاء

**الوضع الحالي:**
- ❌ الحساب يعتمد على الوزن المباشر فقط
- ❌ لا يوجد `density factor` للمخلفات المختلفة
- ❌ لا يوجد ربط بالكيس الفعلي (Bag) الذي يستخدمه العميل

**المشكلة الواقعية:**
```
مثال:
├─ بلاستيك: 3 كجم → حجم كبير (يملأ الكيس)
├─ حديد: 3 كجم → حجم صغير (لا يملأ الكيس)
└─ نفس الوزن، لكن تأثير مختلف على الكيس!
```

**النتيجة:** العميل قد يملأ الكيس قبل الوصول للوزن المحدد، أو العكس.

---

### 3. عدم وجود إعدادات قابلة للتخصيص

**الوضع الحالي:**
- ❌ القيم ثابتة في الكود
- ❌ لا يمكن تعديل:
  - سعة الكيس
  - `density factors`
  - نسبة الامتلاء للتحذير (85%، 90%، إلخ)

**المشكلة:**
- إذا تغير نوع الكيس → يحتاج تحديث الكود
- إذا اكتشفنا `density factor` جديد → يحتاج تحديث الكود

---

## 📂 الوضع الحالي في الكود

### 1. هيكل البيانات الحالي

#### ملف: `basket_waste_bloc.dart`

```dart
class BasketWasteState {
  final List<WasteRecycling> items;
  final int totalQuantity;
  final double totalPrice;
  final int totalPoints;
  final double totalWeight;  // ⚠️ وزن مباشر فقط
  // ❌ لا يوجد basketType
  // ❌ لا يوجد bag reference
  // ❌ لا يوجد effectiveLoad
  // ❌ لا يوجد fillPercentage
}
```

#### ملف: `basket_local_data_source.dart`

```dart
class BasketLocalDataSource {
  static const String _basketKey = 'persistent_waste_basket';
  
  // ❌ لا يوجد فصل بين client/agent basket
  // ❌ لا يوجد حفظ bag info
  // ❌ لا يوجد حفظ density factors
}
```

---

### 2. آلية الحساب الحالية

```dart
// في BasketWasteBloc
double _calculateTotalWeight(List<WasteRecycling> items) {
  return items.fold(0.0, (sum, item) => sum + item.weight);
}

// ❌ حساب مباشر بدون density factor
// ❌ لا يوجد ربط بالكيس
// ❌ لا يوجد حساب effective load
```

---

### 3. عدم وجود آلية تغيير اللون

**الوضع الحالي:**
- ❌ لا يوجد `BasketStatus` enum
- ❌ لا يوجد منطق لتحديد الحالة (empty, filling, almostFull, readyToShip)
- ❌ لا يوجد تحديث ديناميكي للأيقونة

**الكود الحالي:**
```dart
// في HomeWidgetService
// ❌ لا يوجد updateBasketIcon() function
// ❌ لا يوجد منطق لتغيير اللون
```

---

## 🎯 المتطلبات الجديدة

### 1. فصل أنواع السلال

**المتطلبات:**
- ✅ `BasketType` enum (client, agent)
- ✅ كل سلة تعرف نوعها
- ✅ منطق مختلف لكل نوع

---

### 2. سلة العميل الذكية

**المتطلبات:**
- ✅ ربط بالكيس الفعلي (Bag/Container)
- ✅ حساب `effective load` بناءً على `density factor`
- ✅ حساب `fill percentage` دقيق
- ✅ حالات واضحة (empty, filling, almostFull, readyToShip)
- ✅ تغيير لون ديناميكي حسب الحالة

---

### 3. سلة الوكيل (مع تقدير مبدئي)

**المتطلبات:**
- ✅ صنف واحد فقط في كل كيس
- ✅ كيس كبير (20-50 كجم) مخصص للصنف
- ✅ حساب مباشر (وزن فقط)
- ✅ تقدير مبدئي للامتلاء (غير إلزامي)
- ✅ الوكيل يؤكد الامتلاء يدوياً (زر "الكيس ممتلئ")
- ✅ مقارنة التقدير vs الفعلي للتحسين المستقبلي

---

### 4. إعدادات قابلة للتخصيص

**المتطلبات:**
- ✅ جدول `collection_bags` في Supabase
- ✅ جدول `basket_settings` في Supabase
- ✅ جلب الإعدادات من قاعدة البيانات
- ✅ Fallback للقيم الافتراضية

---

## 💡 الحل المقترح

### 🎯 الفرق الجوهري بين سلة العميل والوكيل

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         سلة العميل (Client Basket)                      │
├─────────────────────────────────────────────────────────────────────────┤
│ • يجمع أصناف متعددة في كيس واحد                                        │
│ • الكيس: صغير (3-5 كجم) - منزلي                                        │
│ • الحساب: ذكي بناءً على density factors                                │
│ • السبب: كل صنف يأخذ حجم مختلف في نفس الكيس                            │
│ • الامتلاء: يحسب النظام تلقائياً                                       │
│ • المؤشر: تقدير دقيق للامتلاء الفعلي                                   │
│                                                                         │
│ مثال:                                                                   │
│ ├─ بلاستيك: 2 كجم (يأخذ 60% من الكيس - density 0.6)                    │
│ ├─ ورق: 1 كجم (يأخذ 20% من الكيس)                                      │
│ ├─ حديد: 0.5 كجم (يأخذ 10% من الكيس)                                   │
│ └─ الإجمالي: 3.5 كجم لكن الكيس 90% ممتلئ! ⚠️                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         سلة الوكيل (Agent Basket)                       │
├─────────────────────────────────────────────────────────────────────────┤
│ • يجمع صنف واحد فقط في كل كيس                                          │
│ • الكيس: كبير (20-50 كجم) - تجاري                                      │
│ • الحساب: مباشر (وزن فقط) + تقدير مبدئي                                │
│ • السبب: صنف واحد = لا حاجة لـ density                                 │
│ • الامتلاء: الوكيل يؤكد يدوياً (Self-reported)                         │
│ • المؤشر: تقدير مبدئي للمساعدة                                         │
│                                                                         │
│ مثال:                                                                   │
│ ├─ بلاستيك فقط: 15 كجم                                                 │
│ ├─ التقدير: 75% من سعة الكيس (20 كجم)                                  │
│ ├─ الوكيل: "أعتقد الكيس شبه ممتلئ"                                     │
│ └─ زر: "الكيس ممتلئ - جاهز للشحن" ✅                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 📊 جدول المقارنة

| الخاصية | سلة العميل | سلة الوكيل |
|---------|------------|------------|
| **عدد الأصناف** | متعددة | صنف واحد |
| **حجم الكيس** | 3-5 كجم | 20-50 كجم |
| **طريقة الحساب** | ذكي (density) | مباشر + تقدير |
| **تحديد الامتلاء** | تلقائي | يدوي (Self-reported) |
| **مستوى الدقة** | عالي | تقديري |
| **المؤشر** | إلزامي | مساعد |
| **زر الشحن** | يظهر تلقائياً | يدوي دائماً |

### 🏗️ المعمارية الجديدة

```
┌─────────────────────────────────────────┐
│   Basket Type Layer                     │
│   - BasketType enum                     │
│   - BasketStatus enum                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Bag/Container Layer                  │
│   - CollectionBag model                │
│   - Density factors                    │
│   - Capacity calculation               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   BLoC Layer (Enhanced)                 │
│   - ClientBasketBloc                   │
│   - AgentBasketBloc                    │
│   - Shared Basket Logic                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Data Layer                            │
│   - Local Storage (SharedPreferences)   │
│   - Remote Config (Supabase)            │
└─────────────────────────────────────────┘
```

---

### 1️⃣ تعريف الأنواع والحالات

#### ملف جديد: `basket_types.dart`

```dart
/// نوع السلة
enum BasketType {
  client,  // سلة عميل - متعددة الأصناف
  agent,   // سلة وكيل - صنف واحد
}

/// حالة السلة
enum BasketStatus {
  empty,        // فارغة
  filling,      // قيد التعبئة (أخضر)
  almostFull,   // شبه ممتلئة (برتقالي)
  readyToShip,  // جاهزة للشحن (أحمر)
}

/// نوع المخلفات (لحساب density factor)
enum WasteType {
  plastic,
  paper,
  cans,
  metal,
  glass,
  other,
}
```

---

### 2️⃣ نموذج الكيس (Bag Model)

#### ملف جديد: `collection_bag.dart`

```dart
/// كيان الكيس/الحاوية
class CollectionBag {
  final String id;
  final String name;              // "كيس متوسط"
  final String bagType;            // "small" / "medium" / "heavy"
  final double maxCapacityKg;      // السعة القصوى بالكيلوجرام
  final Map<WasteType, double> densityFactors;  // عوامل الكثافة
  
  CollectionBag({
    required this.id,
    required this.name,
    required this.bagType,
    required this.maxCapacityKg,
    required this.densityFactors,
  });
  
  /// حساب Effective Load من قائمة المخلفات
  double calculateEffectiveLoad(List<WasteRecycling> items) {
    double effectiveLoad = 0.0;
    
    for (var item in items) {
      final wasteType = _getWasteType(item);
      final densityFactor = densityFactors[wasteType] ?? 1.0;
      effectiveLoad += item.weight * densityFactor;
    }
    
    return effectiveLoad;
  }
  
  /// حساب نسبة الامتلاء
  double calculateFillPercentage(List<WasteRecycling> items) {
    final effectiveLoad = calculateEffectiveLoad(items);
    return (effectiveLoad / maxCapacityKg).clamp(0.0, 1.0);
  }
  
  /// تحديد حالة السلة
  BasketStatus getStatus(List<WasteRecycling> items) {
    if (items.isEmpty) return BasketStatus.empty;
    
    final fillPercentage = calculateFillPercentage(items);
    
    if (fillPercentage >= 0.85) return BasketStatus.readyToShip;
    if (fillPercentage >= 0.70) return BasketStatus.almostFull;
    return BasketStatus.filling;
  }
  
  WasteType _getWasteType(WasteRecycling item) {
    // تحويل من waste_data_admin إلى WasteType
    // يمكن إضافة mapping هنا
    return WasteType.other;
  }
  
  factory CollectionBag.fromJson(Map<String, dynamic> json) {
    return CollectionBag(
      id: json['id'] as String,
      name: json['name'] as String,
      bagType: json['bag_type'] as String,
      maxCapacityKg: (json['max_capacity_kg'] as num).toDouble(),
      densityFactors: _parseDensityFactors(json['density_factors']),
    );
  }
  
  static Map<WasteType, double> _parseDensityFactors(dynamic factors) {
    // Parse من JSON
    return {
      WasteType.plastic: (factors['plastic'] ?? 0.6) as double,
      WasteType.paper: (factors['paper'] ?? 0.7) as double,
      WasteType.cans: (factors['cans'] ?? 0.8) as double,
      WasteType.metal: (factors['metal'] ?? 1.2) as double,
      WasteType.glass: (factors['glass'] ?? 1.0) as double,
      WasteType.other: (factors['other'] ?? 1.0) as double,
    };
  }
  
  /// القيم الافتراضية (Fallback)
  factory CollectionBag.defaultBag() {
    return CollectionBag(
      id: 'default',
      name: 'كيس متوسط',
      bagType: 'medium',
      maxCapacityKg: 5.0,  // 5 كجم
      densityFactors: {
        WasteType.plastic: 0.6,  // البلاستيك يملأ الكيس أسرع
        WasteType.paper: 0.7,
        WasteType.cans: 0.8,
        WasteType.metal: 1.2,     // الحديد يأخذ مساحة أقل
        WasteType.glass: 1.0,
        WasteType.other: 1.0,
      },
    );
  }
}
```

---

### 2.5 نموذج كيس الوكيل (Agent Bag Model)

#### ملف جديد: `agent_bag.dart`

```dart
/// كيان كيس الوكيل
/// الفرق عن CollectionBag:
/// - صنف واحد فقط
/// - لا density factors (لأنه صنف واحد)
/// - سعة أكبر (20-50 كجم)
/// - التقدير مبدئي وغير إلزامي
class AgentBag {
  final String id;
  final String name;              // "كيس بلاستيك كبير"
  final WasteType wasteType;      // الصنف المخصص للكيس
  final double maxCapacityKg;     // السعة القصوى بالكيلوجرام
  final double estimatedDensity;  // كثافة تقديرية للصنف (اختياري)
  
  AgentBag({
    required this.id,
    required this.name,
    required this.wasteType,
    required this.maxCapacityKg,
    this.estimatedDensity = 1.0,
  });
  
  /// حساب نسبة الامتلاء التقديرية (للمساعدة فقط)
  double calculateEstimatedFillPercentage(double totalWeight) {
    return (totalWeight / maxCapacityKg).clamp(0.0, 1.0);
  }
  
  /// هل يجب اقتراح "الكيس ممتلئ"؟
  bool shouldSuggestFull(double totalWeight) {
    return calculateEstimatedFillPercentage(totalWeight) >= 0.85;
  }
  
  factory AgentBag.fromJson(Map<String, dynamic> json) {
    return AgentBag(
      id: json['id'] as String,
      name: json['name'] as String,
      wasteType: WasteType.values.firstWhere(
        (e) => e.name == json['waste_type'],
        orElse: () => WasteType.other,
      ),
      maxCapacityKg: (json['max_capacity_kg'] as num).toDouble(),
      estimatedDensity: (json['estimated_density'] as num?)?.toDouble() ?? 1.0,
    );
  }
  
  /// القيم الافتراضية حسب الصنف
  factory AgentBag.defaultForWasteType(WasteType wasteType) {
    final configs = {
      WasteType.plastic: (name: 'كيس بلاستيك', capacity: 20.0),
      WasteType.paper: (name: 'كيس ورق/كرتون', capacity: 30.0),
      WasteType.cans: (name: 'كيس علب ألومنيوم', capacity: 25.0),
      WasteType.metal: (name: 'كيس معادن', capacity: 50.0),
      WasteType.glass: (name: 'كيس زجاج', capacity: 40.0),
      WasteType.other: (name: 'كيس عام', capacity: 20.0),
    };
    
    final config = configs[wasteType] ?? configs[WasteType.other]!;
    
    return AgentBag(
      id: 'default_${wasteType.name}',
      name: config.name,
      wasteType: wasteType,
      maxCapacityKg: config.capacity,
    );
  }
}
```

---

### 3️⃣ State الجديد (Enhanced)

#### ملف محدث: `basket_waste_state.dart`

```dart
class BasketWasteState {
  // الأساسيات
  final BasketType basketType;
  final List<WasteRecycling> items;
  
  // الكيس (للسلة العميل فقط)
  final CollectionBag? bag;
  
  // الحسابات الذكية
  final double totalWeight;          // الوزن المباشر
  final double effectiveLoad;        // الحمل الفعلي (مع density للعميل، مباشر للوكيل)
  final double fillPercentage;       // نسبة الامتلاء (0.0 - 1.0)
  
  // الحالة
  final BasketStatus status;
  
  // الإجماليات (للعرض)
  final int totalQuantity;
  final double totalPrice;
  final int totalPoints;
  
  // للوكيل: هل تم التأكيد يدوياً؟
  final bool isManuallyMarkedFull;   // الوكيل ضغط "الكيس ممتلئ"
  
  // UI State
  final bool isLoading;
  final String? errorMessage;
  
  BasketWasteState({
    required this.basketType,
    this.items = const [],
    this.bag,
    this.totalWeight = 0.0,
    this.effectiveLoad = 0.0,
    this.fillPercentage = 0.0,
    this.status = BasketStatus.empty,
    this.totalQuantity = 0,
    this.totalPrice = 0.0,
    this.totalPoints = 0,
    this.isLoading = false,
    this.errorMessage,
  });
  
  /// Factory للعميل
  factory BasketWasteState.client({
    List<WasteRecycling> items = const [],
    CollectionBag? bag,
  }) {
    final effectiveBag = bag ?? CollectionBag.defaultBag();
    
    final totalWeight = items.fold(0.0, (sum, item) => sum + item.weight);
    final effectiveLoad = effectiveBag.calculateEffectiveLoad(items);
    final fillPercentage = effectiveBag.calculateFillPercentage(items);
    final status = effectiveBag.getStatus(items);
    
    return BasketWasteState(
      basketType: BasketType.client,
      items: items,
      bag: effectiveBag,
      totalWeight: totalWeight,
      effectiveLoad: effectiveLoad,
      fillPercentage: fillPercentage,
      status: status,
      totalQuantity: items.length,
      totalPrice: items.fold(0.0, (sum, item) => sum + item.price),
      totalPoints: items.fold(0, (sum, item) => sum + item.points),
    );
  }
  
  /// Factory للوكيل
  /// ملاحظة: الوكيل يجمع صنف واحد فقط، والتقدير مبدئي
  /// الوكيل هو من يؤكد الامتلاء يدوياً (Self-reported)
  factory BasketWasteState.agent({
    List<WasteRecycling> items = const [],
    AgentBag? bag,  // كيس الوكيل (كبير، مخصص للصنف)
    bool isManuallyMarkedFull = false,  // الوكيل ضغط "الكيس ممتلئ"
  }) {
    final totalWeight = items.fold(0.0, (sum, item) => sum + item.weight);
    final maxWeight = bag?.maxCapacityKg ?? 20.0;  // افتراضي 20 كجم
    
    // للوكيل: الحساب مباشر + تقدير
    BasketStatus status;
    
    if (isManuallyMarkedFull) {
      // الوكيل أكد الامتلاء يدوياً → جاهز للشحن
      status = BasketStatus.readyToShip;
    } else if (items.isEmpty) {
      status = BasketStatus.empty;
    } else {
      // تقدير مبدئي (للمساعدة فقط، ليس إلزامي)
      final estimatedFill = totalWeight / maxWeight;
      if (estimatedFill >= 0.85) {
        status = BasketStatus.almostFull;  // اقتراح: "ربما الكيس ممتلئ؟"
      } else if (estimatedFill >= 0.50) {
        status = BasketStatus.filling;
      } else {
        status = BasketStatus.filling;
      }
    }
    
    return BasketWasteState(
      basketType: BasketType.agent,
      items: items,
      bag: null,  // الوكيل يستخدم AgentBag منفصل
      totalWeight: totalWeight,
      effectiveLoad: totalWeight,  // للوكيل: نفس الوزن (صنف واحد)
      fillPercentage: (totalWeight / maxWeight).clamp(0.0, 1.0),
      status: status,
      totalQuantity: items.length,
      totalPrice: items.fold(0.0, (sum, item) => sum + item.price),
      totalPoints: items.fold(0, (sum, item) => sum + item.points),
      isManuallyMarkedFull: isManuallyMarkedFull,
    );
  }
  
  BasketWasteState copyWith({
    List<WasteRecycling>? items,
    CollectionBag? bag,
    bool? isLoading,
    String? errorMessage,
  }) {
    // إعادة حساب الحالة بناءً على items الجديدة
    if (basketType == BasketType.client) {
      return BasketWasteState.client(
        items: items ?? this.items,
        bag: bag ?? this.bag,
      );
    } else {
      return BasketWasteState.agent(
        items: items ?? this.items,
        maxWeightForWasteType: bag?.maxCapacityKg,
      );
    }
  }
}
```

---

### 4️⃣ BLoC المحدث

#### ملف محدث: `basket_waste_bloc.dart`

```dart
class BasketWasteBloc extends Bloc<BasketWasteEvent, BasketWasteState> {
  final BasketLocalDataSource localDataSource;
  final BasketRemoteDataSource remoteDataSource;  // جديد
  final BasketType basketType;
  
  BasketWasteBloc({
    required this.basketType,
    required this.localDataSource,
    required this.remoteDataSource,
  }) : super(
    basketType == BasketType.client
        ? BasketWasteState.client()
        : BasketWasteState.agent(),
  ) {
    on<LoadBasketWaste>(_onLoadBasketWaste);
    on<LoadBagConfig>(_onLoadBagConfig);  // جديد - للعميل
    on<AddWasteItem>(_onAddWasteItem);
    on<UpdateWasteItem>(_onUpdateWasteItem);
    on<DeleteWasteItem>(_onDeleteWasteItem);
    on<ClearBasket>(_onClearBasket);
    
    // أحداث خاصة بالوكيل
    on<MarkBasketAsFull>(_onMarkBasketAsFull);
    on<UnmarkBasketAsFull>(_onUnmarkBasketAsFull);
  }
  
  /// الوكيل أكد أن الكيس ممتلئ (Self-reported)
  Future<void> _onMarkBasketAsFull(
    MarkBasketAsFull event,
    Emitter<BasketWasteState> emit,
  ) async {
    if (basketType != BasketType.agent) return;
    
    final newState = BasketWasteState.agent(
      items: state.items,
      isManuallyMarkedFull: true,  // ✅ تحديد يدوي
    );
    
    emit(newState);
    
    // تحديث أيقونة السلة
    await _updateBasketIcon(newState);
    
    // حفظ الحالة
    await localDataSource.saveBasketStatus(
      basketType: basketType,
      isMarkedFull: true,
    );
  }
  
  /// الوكيل تراجع عن التحديد
  Future<void> _onUnmarkBasketAsFull(
    UnmarkBasketAsFull event,
    Emitter<BasketWasteState> emit,
  ) async {
    if (basketType != BasketType.agent) return;
    
    final newState = BasketWasteState.agent(
      items: state.items,
      isManuallyMarkedFull: false,  // ❌ إلغاء التحديد
    );
    
    emit(newState);
    
    await _updateBasketIcon(newState);
    
    await localDataSource.saveBasketStatus(
      basketType: basketType,
      isMarkedFull: false,
    );
  }
  
  /// جلب إعدادات الكيس من Supabase
  Future<void> _onLoadBagConfig(
    LoadBagConfig event,
    Emitter<BasketWasteState> emit,
  ) async {
    if (basketType != BasketType.client) return;
    
    emit(state.copyWith(isLoading: true));
    
    try {
      final bag = await remoteDataSource.getBagConfig(
        bagId: event.bagId,
      );
      
      final newState = BasketWasteState.client(
        items: state.items,
        bag: bag,
      );
      
      emit(newState.copyWith(isLoading: false));
      
      // تحديث أيقونة السلة
      await _updateBasketIcon(newState);
      
    } catch (e) {
      emit(state.copyWith(
        isLoading: false,
        errorMessage: 'فشل تحميل إعدادات الكيس',
      ));
    }
  }
  
  /// إضافة عنصر
  Future<void> _onAddWasteItem(
    AddWasteItem event,
    Emitter<BasketWasteState> emit,
  ) async {
    final updatedItems = List<WasteRecycling>.from(state.items)
      ..add(event.item);
    
    await localDataSource.saveBasket(
      updatedItems,
      basketType: basketType,
    );
    
    final newState = state.copyWith(items: updatedItems);
    emit(newState);
    
    // تحديث أيقونة السلة
    await _updateBasketIcon(newState);
  }
  
  /// تحديث أيقونة السلة بناءً على الحالة
  Future<void> _updateBasketIcon(BasketWasteState state) async {
    if (basketType != BasketType.client) return;
    
    final iconColor = _getIconColorForStatus(state.status);
    
    await HomeWidgetService.updateBasketIcon(
      status: state.status,
      fillPercentage: state.fillPercentage,
      color: iconColor,
    );
  }
  
  String _getIconColorForStatus(BasketStatus status) {
    switch (status) {
      case BasketStatus.empty:
      case BasketStatus.filling:
        return 'green';
      case BasketStatus.almostFull:
        return 'orange';
      case BasketStatus.readyToShip:
        return 'red';
    }
  }
}
```

---

### 5️⃣ Data Sources المحدثة

#### ملف محدث: `basket_local_data_source.dart`

```dart
class BasketLocalDataSource {
  final SharedPreferences prefs;
  
  // مفاتيح منفصلة لكل نوع
  String _getBasketKey(BasketType type) {
    return type == BasketType.client
        ? 'persistent_waste_basket_client'
        : 'persistent_waste_basket_agent';
  }
  
  String _getBagKey() {
    return 'current_collection_bag';
  }
  
  /// حفظ السلة
  Future<void> saveBasket(
    List<WasteRecycling> items, {
    required BasketType basketType,
  }) async {
    final key = _getBasketKey(basketType);
    final jsonString = jsonEncode(
      items.map((item) => item.toMap()).toList(),
    );
    await prefs.setString(key, jsonString);
  }
  
  /// جلب السلة
  List<WasteRecycling> getBasket(BasketType basketType) {
    final key = _getBasketKey(basketType);
    final jsonString = prefs.getString(key);
    if (jsonString == null || jsonString.isEmpty) return [];
    
    final List<dynamic> jsonList = jsonDecode(jsonString);
    return jsonList.map((j) => WasteRecycling.fromJson(j)).toList();
  }
  
  /// حفظ الكيس الحالي
  Future<void> saveCurrentBag(CollectionBag bag) async {
    final key = _getBagKey();
    await prefs.setString(key, jsonEncode(bag.toJson()));
  }
  
  /// جلب الكيس الحالي
  CollectionBag? getCurrentBag() {
    final key = _getBagKey();
    final jsonString = prefs.getString(key);
    if (jsonString == null || jsonString.isEmpty) {
      return CollectionBag.defaultBag();
    }
    
    final json = jsonDecode(jsonString);
    return CollectionBag.fromJson(json);
  }
  
  /// تصفير السلة
  Future<void> clearBasket(BasketType basketType) async {
    final key = _getBasketKey(basketType);
    await prefs.remove(key);
  }
}
```

#### ملف جديد: `basket_remote_data_source.dart`

```dart
class BasketRemoteDataSource {
  final SupabaseClient supabase;
  
  BasketRemoteDataSource(this.supabase);
  
  /// جلب إعدادات الكيس من Supabase
  Future<CollectionBag> getBagConfig({String? bagId}) async {
    try {
      // جلب الكيس المحدد أو الافتراضي
      final query = supabase
          .from('collection_bags')
          .select();
      
      if (bagId != null) {
        query.eq('id', bagId);
      } else {
        query.eq('is_default', true);
      }
      
      final response = await query.single();
      
      return CollectionBag.fromJson(response);
      
    } catch (e) {
      // Fallback للقيم الافتراضية
      return CollectionBag.defaultBag();
    }
  }
  
  /// جلب إعدادات السلة العامة
  Future<BasketSettings> getBasketSettings() async {
    try {
      final response = await supabase
          .from('basket_settings')
          .select()
          .eq('is_active', true)
          .single();
      
      return BasketSettings.fromJson(response);
      
    } catch (e) {
      return BasketSettings.defaultSettings();
    }
  }
}

/// إعدادات السلة العامة
class BasketSettings {
  final double almostFullThreshold;  // 0.70
  final double readyToShipThreshold; // 0.85
  
  BasketSettings({
    required this.almostFullThreshold,
    required this.readyToShipThreshold,
  });
  
  factory BasketSettings.fromJson(Map<String, dynamic> json) {
    return BasketSettings(
      almostFullThreshold: (json['almost_full_threshold'] ?? 0.70) as double,
      readyToShipThreshold: (json['ready_to_ship_threshold'] ?? 0.85) as double,
    );
  }
  
  factory BasketSettings.defaultSettings() {
    return BasketSettings(
      almostFullThreshold: 0.70,
      readyToShipThreshold: 0.85,
    );
  }
}
```

---

### 6️⃣ تحديث HomeWidgetService

#### ملف محدث: `home_widget_service.dart`

```dart
class HomeWidgetService {
  /// تحديث أيقونة السلة بناءً على الحالة
  static Future<void> updateBasketIcon({
    required BasketStatus status,
    required double fillPercentage,
    required String color,  // 'green', 'orange', 'red'
  }) async {
    try {
      // تحديد مسار الصورة بناءً على اللون
      final String iconPath = _getIconPathForColor(color);
      
      // تحميل الصورة
      final byteData = await rootBundle.load(iconPath);
      final directory = await getTemporaryDirectory();
      final filePath = '${directory.path}/basket-current-${color}.png';
      final file = File(filePath);
      await file.writeAsBytes(byteData.buffer.asUint8List());
      
      // حفظ في SharedPreferences للويدجت
      await HomeWidget.saveWidgetData<String>('widget_basket_path', filePath);
      await HomeWidget.saveWidgetData<double>('widget_fill_percentage', fillPercentage);
      await HomeWidget.saveWidgetData<String>('widget_basket_status', status.name);
      
      // تحديث الويدجت
      await HomeWidget.updateWidget(
        name: 'QuickCollectionWidgetProvider',
      );
      
    } catch (e) {
      print('Error updating basket icon: $e');
    }
  }
  
  static String _getIconPathForColor(String color) {
    switch (color) {
      case 'red':
        return 'assets/icons/rb-icon-red.png';
      case 'orange':
        return 'assets/icons/rb-icon-orange.png';
      case 'green':
      default:
        return 'assets/icons/rb-icon.png';
    }
  }
}
```

---

## 🗄️ قاعدة البيانات (Supabase)

### 1. جدول `collection_bags`

```sql
CREATE TABLE collection_bags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bag_type VARCHAR(20) NOT NULL CHECK (bag_type IN ('small', 'medium', 'heavy')),
  max_capacity_kg DECIMAL(10, 2) NOT NULL,
  
  -- Density factors (JSON)
  density_factors JSONB NOT NULL DEFAULT '{
    "plastic": 0.6,
    "paper": 0.7,
    "cans": 0.8,
    "metal": 1.2,
    "glass": 1.0,
    "other": 1.0
  }'::jsonb,
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_collection_bags_default ON collection_bags(is_default) WHERE is_default = true;
CREATE INDEX idx_collection_bags_active ON collection_bags(is_active) WHERE is_active = true;

-- القيمة الافتراضية
INSERT INTO collection_bags (name, bag_type, max_capacity_kg, is_default) 
VALUES ('كيس متوسط', 'medium', 5.0, true);

COMMENT ON TABLE collection_bags IS 
'إعدادات الكيس/الحاوية - يحدد السعة وعوامل الكثافة لكل نوع مخلفات';
```

---

### 2. جدول `agent_bags` (أكياس الوكيل)

```sql
CREATE TABLE agent_bags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  waste_type VARCHAR(20) NOT NULL,  -- plastic, paper, cans, metal, glass, other
  max_capacity_kg DECIMAL(10, 2) NOT NULL,
  estimated_density DECIMAL(4, 2) DEFAULT 1.0,
  
  -- للتقدير المستقبلي
  avg_actual_weight DECIMAL(10, 2),  -- متوسط الوزن الفعلي عند الشحن
  total_shipments INT DEFAULT 0,     -- عدد الشحنات للتحليل
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_agent_bags_waste_type ON agent_bags(waste_type);
CREATE INDEX idx_agent_bags_active ON agent_bags(is_active) WHERE is_active = true;

-- القيم الافتراضية
INSERT INTO agent_bags (name, waste_type, max_capacity_kg, is_default) VALUES
  ('كيس بلاستيك كبير', 'plastic', 20.0, true),
  ('كيس ورق/كرتون', 'paper', 30.0, true),
  ('كيس علب ألومنيوم', 'cans', 25.0, true),
  ('كيس معادن', 'metal', 50.0, true),
  ('كيس زجاج', 'glass', 40.0, true);

COMMENT ON TABLE agent_bags IS 
'أكياس الوكيل - صنف واحد لكل كيس، سعة كبيرة، تقدير مبدئي';
COMMENT ON COLUMN agent_bags.avg_actual_weight IS 
'متوسط الوزن الفعلي عند الشحن - للتحسين المستقبلي';
```

---

### 3. جدول `basket_settings`

```sql
CREATE TABLE basket_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Thresholds (نسب الامتلاء)
  almost_full_threshold DECIMAL(3, 2) DEFAULT 0.70,  -- 70%
  ready_to_ship_threshold DECIMAL(3, 2) DEFAULT 0.85,  -- 85%
  
  -- Agent basket settings
  agent_max_weight_per_type DECIMAL(10, 2) DEFAULT 20.0,  -- 20 كجم للوكيل
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- القيمة الافتراضية
INSERT INTO basket_settings (is_active) VALUES (true);

COMMENT ON TABLE basket_settings IS 
'إعدادات عامة لنظام السلة - نسب التحذير والحدود';
```

---

### 3. جدول `user_bags` (اختياري - للمستقبل)

```sql
CREATE TABLE user_bags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  bag_id UUID NOT NULL REFERENCES collection_bags(id),
  qr_code TEXT,  -- QR code للكيس
  received_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(user_id, bag_id, is_active) WHERE is_active = true
);

COMMENT ON TABLE user_bags IS 
'الأكياس التي استلمها العميل - يمكن ربطها بـ QR code';
```

---

## 🎨 تحديثات UI

### 1. صفحة السلة (BasketWastePage)

```dart
class BasketWastePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<BasketWasteBloc, BasketWasteState>(
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(
            title: Text('سلة المخلفات'),
            // عرض حالة السلة في AppBar
            actions: [
              _BasketStatusIndicator(status: state.status),
            ],
          ),
          body: Column(
            children: [
              // مؤشر الامتلاء (Progress Bar)
              _FillPercentageIndicator(
                fillPercentage: state.fillPercentage,
                status: state.status,
              ),
              
              // قائمة العناصر
              Expanded(
                child: _BasketItemsList(items: state.items),
              ),
              
              // جدول الإجماليات
              _TotalsTable(state: state),
              
              // أزرار الإجراءات
              _ActionButtons(
                status: state.status,
                onRequestCollection: () {
                  // طلب التجميع
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

/// مؤشر حالة السلة
class _BasketStatusIndicator extends StatelessWidget {
  final BasketStatus status;
  
  Widget build(BuildContext context) {
    final color = _getColorForStatus(status);
    final text = _getTextForStatus(status);
    
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color),
      ),
      child: Row(
        children: [
          Icon(Icons.circle, size: 8, color: color),
          SizedBox(width: 4),
          Text(text, style: TextStyle(color: color)),
        ],
      ),
    );
  }
  
  Color _getColorForStatus(BasketStatus status) {
    switch (status) {
      case BasketStatus.empty:
      case BasketStatus.filling:
        return Colors.green;
      case BasketStatus.almostFull:
        return Colors.orange;
      case BasketStatus.readyToShip:
        return Colors.red;
    }
  }
  
  String _getTextForStatus(BasketStatus status) {
    switch (status) {
      case BasketStatus.empty:
        return 'فارغة';
      case BasketStatus.filling:
        return 'قيد التعبئة';
      case BasketStatus.almostFull:
        return 'شبه ممتلئة';
      case BasketStatus.readyToShip:
        return 'جاهزة للشحن';
    }
  }
}

/// مؤشر نسبة الامتلاء
class _FillPercentageIndicator extends StatelessWidget {
  final double fillPercentage;
  final BasketStatus status;
  
  Widget build(BuildContext context) {
    final color = _getColorForStatus(status);
    
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('نسبة الامتلاء'),
              Text(
                '${(fillPercentage * 100).toStringAsFixed(1)}%',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          SizedBox(height: 8),
          LinearProgressIndicator(
            value: fillPercentage,
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
          ),
        ],
      ),
    );
  }
  
  Color _getColorForStatus(BasketStatus status) {
    switch (status) {
      case BasketStatus.empty:
      case BasketStatus.filling:
        return Colors.green;
      case BasketStatus.almostFull:
        return Colors.orange;
      case BasketStatus.readyToShip:
        return Colors.red;
    }
  }
}
```

---

### 2. صفحة سلة الوكيل (AgentBasketPage)

```dart
class AgentBasketPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<BasketWasteBloc, BasketWasteState>(
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(
            title: Text('سلة ${_getWasteTypeName(state)}'),
          ),
          body: Column(
            children: [
              // معلومات الكيس
              _AgentBagInfo(
                wasteType: state.currentWasteType,
                totalWeight: state.totalWeight,
                estimatedFill: state.fillPercentage,
              ),
              
              // مؤشر تقديري (للمساعدة)
              _EstimatedFillIndicator(
                fillPercentage: state.fillPercentage,
                isEstimate: true,  // تأكيد أنه تقدير فقط
              ),
              
              // اقتراح إذا التقدير عالي
              if (state.fillPercentage >= 0.85 && !state.isManuallyMarkedFull)
                _SuggestionBanner(
                  message: 'ربما الكيس ممتلئ؟ اضغط الزر أدناه للتأكيد',
                ),
              
              // قائمة العناصر
              Expanded(
                child: _BasketItemsList(items: state.items),
              ),
              
              // جدول الإجماليات
              _AgentTotalsTable(state: state),
              
              // زر "الكيس ممتلئ" - المهم!
              _MarkFullButton(
                isMarkedFull: state.isManuallyMarkedFull,
                onPressed: () {
                  context.read<BasketWasteBloc>().add(
                    MarkBasketAsFull(),
                  );
                },
              ),
              
              // أزرار الإجراءات
              if (state.isManuallyMarkedFull)
                _ShipButton(
                  onPressed: () {
                    // طلب الشحن
                  },
                ),
            ],
          ),
        );
      },
    );
  }
}

/// مؤشر الامتلاء التقديري للوكيل
class _EstimatedFillIndicator extends StatelessWidget {
  final double fillPercentage;
  final bool isEstimate;
  
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text('نسبة الامتلاء التقديرية'),
                  SizedBox(width: 4),
                  // أيقونة توضيحية
                  Tooltip(
                    message: 'هذا تقدير مبدئي. أنت من يحدد متى الكيس ممتلئ',
                    child: Icon(Icons.info_outline, size: 16, color: Colors.grey),
                  ),
                ],
              ),
              Text(
                '~${(fillPercentage * 100).toStringAsFixed(0)}%',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[600],  // لون محايد لأنه تقدير
                ),
              ),
            ],
          ),
          SizedBox(height: 8),
          LinearProgressIndicator(
            value: fillPercentage,
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(Colors.grey[500]!),
            minHeight: 6,
          ),
          SizedBox(height: 4),
          Text(
            '💡 هذا تقدير مبدئي - أنت من يحدد متى الكيس جاهز للشحن',
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}

/// زر "الكيس ممتلئ"
class _MarkFullButton extends StatelessWidget {
  final bool isMarkedFull;
  final VoidCallback onPressed;
  
  Widget build(BuildContext context) {
    if (isMarkedFull) {
      return Container(
        padding: EdgeInsets.all(16),
        color: Colors.green[50],
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle, color: Colors.green),
            SizedBox(width: 8),
            Text(
              'تم تحديد الكيس كممتلئ ✓',
              style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
            ),
            TextButton(
              onPressed: () {
                // إلغاء التحديد
              },
              child: Text('تراجع'),
            ),
          ],
        ),
      );
    }
    
    return Container(
      padding: EdgeInsets.all(16),
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(Icons.inventory_2),
        label: Text('الكيس ممتلئ - جاهز للشحن'),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.orange,
          foregroundColor: Colors.white,
          minimumSize: Size(double.infinity, 50),
        ),
      ),
    );
  }
}
```

---

## 📋 خطة التنفيذ التفصيلية (Detailed Implementation Plan)

> **ملاحظة:** هذه الخطة محدثة بناءً على التقييم التقني. راجع قسم [خطة المراحل التنفيذية](#-خطة-المراحل-التنفيذية) للتفاصيل.

---

### 🟢 Phase 1: الأساسيات (الآن - 2-3 أسابيع)

#### Week 1: الأساسيات التقنية

**المهام:**
1. ✅ إنشاء `BasketType` و `BasketStatus` enums
2. ✅ إنشاء `CollectionBag` model (قيم ثابتة)
3. ✅ إنشاء `AgentBag` model (مبسط)
4. ✅ تحديث `BasketWasteState` لدعم الأنواع الجديدة
5. ✅ إنشاء `BasketCalculator` service (لتحسين الأداء)
6. ✅ فصل `BasketLocalDataSource` للعميل والوكيل

**المخرجات:**
- الكود الأساسي جاهز
- Models محدثة
- Data sources منفصلة

---

#### Week 2: الحسابات والمنطق

**المهام:**
1. ✅ تطبيق `calculateEffectiveLoad()` (قيم ثابتة)
2. ✅ تطبيق `calculateFillPercentage()`
3. ✅ تطبيق `getStatus()` بناءً على النسب
4. ✅ تحديث BLoC لحساب الحالة تلقائياً
5. ✅ إضافة `BasketConfig` class (قيم ثابتة)

**المخرجات:**
- الحسابات الأساسية تعمل
- الحالة تُحدد تلقائياً
- Config منفصل عن الكود

---

#### Week 3: UI والتكامل

**المهام:**
1. ✅ تحديث `BasketWastePage` للعميل (مبسط)
2. ✅ تحديث `AgentBasketPage` للوكيل
3. ✅ إضافة `_FillPercentageIndicator` (بسيط)
4. ✅ إضافة `_BasketStatusIndicator`
5. ✅ تحديث `HomeWidgetService` (تحديث فقط عند تغيير Status)
6. ✅ إضافة الصور الجديدة (أخضر، برتقالي، أحمر)

**المخرجات:**
- واجهة المستخدم محدثة
- الأيقونة تتغير ديناميكياً
- **جاهز للإطلاق** ✅

---

### 🟡 Phase 2: التحسينات (بعد أول تشغيل - 3-4 أسابيع)

#### Week 1-2: Remote Config

**المهام:**
1. ✅ إنشاء جدول `collection_bags` في Supabase
2. ✅ إنشاء جدول `basket_settings` في Supabase
3. ✅ إنشاء `BasketRemoteDataSource`
4. ✅ تطبيق جلب الإعدادات من Supabase
5. ✅ تطبيق Fallback للقيم الافتراضية

**المخرجات:**
- الإعدادات قابلة للتخصيص من لوحة التحكم

---

#### Week 3-4: Analytics والتحسين

**المهام:**
1. ✅ تسجيل estimated vs actual
2. ✅ تقرير بسيط للتحسين
3. ✅ تعديل density factors بناءً على البيانات
4. ✅ تحسين thresholds

**المخرجات:**
- تحسينات بناءً على البيانات الفعلية

---

### 🔵 Phase 3: الميزات المتقدمة (عند Volume - 2-3 أشهر)

**المهام:**
1. ✅ QR codes للأكياس
2. ✅ جدول `user_bags`
3. ✅ Analytics متقدم
4. ✅ Dynamic pricing

**المخرجات:**
- نظام متكامل للتتبع والتحليل

---

## ❓ الأسئلة المفتوحة

### 1. ربط الكيس بالعميل

**السؤال:**
- كيف يتم ربط الكيس بالعميل؟
- هل العميل يستخدم أكياسه الخاصة في البداية؟
- متى يتم تسليم الكيس المعتمد من كارمش؟

**الاقتراحات:**
1. **البداية:** العميل يستخدم أكياسه → التطبيق يستخدم `defaultBag`
2. **أول تجميعة:** المندوب يسلم كيس مع QR code → ربط في `user_bags`
3. **بعد كده:** السلة مرتبطة بالكيس المسجل

---

### 2. Density Factors

**السؤال:**
- ما هي القيم الدقيقة لـ `density factors`؟
- هل نحتاج اختبارات عملية لتحديدها؟

**الاقتراح:**
- البدء بالقيم المقترحة (0.6 للبلاستيك، 1.2 للحديد)
- جمع بيانات من الاستخدام الفعلي
- تعديل القيم بناءً على البيانات

---

### 3. النسب (Thresholds)

**السؤال:**
- هل 70% و 85% مناسبان؟
- أم نحتاج نسب مختلفة؟

**الاقتراح:**
- البدء بـ 70% و 85%
- إمكانية التعديل من لوحة التحكم
- مراقبة الاستخدام وتعديل النسب

---

### 4. سلة الوكيل

**السؤال:**
- الوكيل أيضاً يملأ كيس من أول يوم
- لكن لا يوجد تصور دقيق لحجم الكيس
- الاعتماد الأساسي على الوكيل نفسه (Self-reported)
- هل نحتاج تقدير مبدئي؟

**الاقتراح:**
- الوكيل يجمع صنف واحد فقط
- إضافة تقدير مبدئي بناءً على الصنف
- الوكيل يؤكد الامتلاء يدوياً (زر "الكيس ممتلئ")
- المقارنة بين التقدير والفعلي للتحسين المستقبلي

---

### 5. التزامن (Sync)

**السؤال:**
- هل نحتاج حفظ السلة في Supabase؟
- أم التخزين المحلي كافٍ؟

**الاقتراح الحالي:**
- التخزين المحلي كافٍ (كما هو الآن)
- السلة تُحفظ في Supabase فقط عند إنشاء الطلب
- يمكن إضافة Sync اختياري لاحقاً

---

## ✅ الخلاصة والتوصيات النهائية

### 🎯 المزايا الرئيسية:

1. ✅ **فصل واضح** بين سلة العميل والوكيل
2. ✅ **حساب ذكي** للامتلاء (مبسط في Phase 1، متقدم في Phase 2)
3. ✅ **إعدادات قابلة للتخصيص** (Phase 2)
4. ✅ **تجربة مستخدم محسّنة** مع مؤشرات واضحة
5. ✅ **جاهزية للتوسع** (QR codes، تتبع الأكياس - Phase 3)

### 💰 التأثير الإيجابي:

- ✅ ↑ متوسط وزن الشحنة
- ✅ ↓ شحنات "لسه ناقصة"
- ✅ ↓ تكلفة اللوجستيات لكل كجم
- ✅ ↑ القدرة على البيع لمصانع بدل تجار

**النتيجة:** تحويل من **تاجر سيولة** → **منسق إمداد** (فرق ضخم في الهامش)

---

### 📋 التوصيات النهائية:

#### ✅ **ابدأ بـ Phase 1 فقط**

**الأسباب:**
- 80% قيمة بـ 40% مجهود
- جاهز للإطلاق بسرعة
- لا تعقيد زائد
- يمكن التحسين لاحقاً

#### ⚠️ **تجنب في Phase 1:**

- ❌ Remote Config (Phase 2)
- ❌ QR codes (Phase 3)
- ❌ Analytics متقدم (Phase 3)
- ❌ Density factors دقيقة (Phase 2)

#### ✅ **ركز على:**

- ✅ فصل BasketType
- ✅ حساب أساسي للامتلاء
- ✅ UI واضح وبسيط
- ✅ تجربة مستخدم ممتازة

---

### 🚀 الخطوات التالية:

1. **✅ المراجعة:** مراجعة المقترح مع الفريق
2. **✅ الموافقة:** الموافقة على Phase 1
3. **✅ البدء:** البدء بالتنفيذ (Week 1)
4. **✅ الإطلاق:** إطلاق Phase 1 بعد 2-3 أسابيع
5. **✅ جمع البيانات:** جمع بيانات فعلية
6. **✅ Phase 2:** البدء في Phase 2 بعد جمع البيانات

---

### 📊 خارطة الطريق (Roadmap)

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 1 (الآن)                          │
│  ────────────────────────────────────────────────────────  │
│  ✅ فصل BasketType                                         │
│  ✅ حساب أساسي                                             │
│  ✅ UI واضح                                                 │
│  ⏱️ 2-3 أسابيع                                             │
│  💰 80% قيمة                                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Phase 2 (بعد أول تشغيل)                       │
│  ────────────────────────────────────────────────────────  │
│  ✅ Remote Config                                           │
│  ✅ تحسين Density Factors                                   │
│  ✅ Analytics بسيط                                          │
│  ⏱️ 3-4 أسابيع                                             │
│  💰 15% قيمة                                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Phase 3 (عند Volume)                          │
│  ────────────────────────────────────────────────────────  │
│  ✅ QR Codes                                                │
│  ✅ Analytics متقدم                                         │
│  ✅ Dynamic Pricing                                         │
│  ⏱️ 2-3 أشهر                                               │
│  💰 5% قيمة                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

### ⚠️ تحذيرات مهمة:

1. **لا تبدأ بـ Phase 2 أو 3**
   - ❌ سيبطئ الإطلاق
   - ❌ يزيد التعقيد
   - ❌ لا قيمة إضافية كبيرة

2. **ركز على البساطة في Phase 1**
   - ✅ قيم ثابتة في الكود
   - ✅ UI بسيط وواضح
   - ✅ مصطلحات بسيطة (لا تقنية)

3. **استخدم BasketCalculator**
   - ✅ لا Recompute في copyWith
   - ✅ Service class منفصل
   - ✅ أداء أفضل

4. **Widget Update فقط عند تغيير Status**
   - ✅ لا تحدث مع كل event
   - ✅ أداء أفضل
   - ✅ تجربة مستخدم أفضل

---

---

## 📊 ملخص الفروقات الرئيسية

### سلة العميل vs سلة الوكيل

```
┌────────────────────────────────────────────────────────────────────┐
│                    🏠 سلة العميل (Client)                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  📦 الكيس: صغير (3-5 كجم)                                         │
│  🎨 الأصناف: متعددة في نفس الكيس                                  │
│  🧮 الحساب: ذكي (density factors)                                 │
│  📊 التقدير: دقيق ومطلوب                                          │
│  🔴 التحديد: تلقائي (النظام يحسب)                                 │
│  🚚 الشحن: يظهر زر الشحن تلقائياً عند 85%                        │
│                                                                    │
│  المعادلة:                                                         │
│  effective_load = Σ(weight × density_factor)                       │
│  fill% = effective_load / max_capacity                             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                    🏭 سلة الوكيل (Agent)                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  📦 الكيس: كبير (20-50 كجم)                                       │
│  🎨 الأصناف: صنف واحد فقط لكل كيس                                │
│  🧮 الحساب: مباشر (وزن فقط)                                       │
│  📊 التقدير: مبدئي وغير إلزامي                                    │
│  🟠 التحديد: يدوي (الوكيل يقرر)                                   │
│  🚚 الشحن: الوكيل يضغط "الكيس ممتلئ"                              │
│                                                                    │
│  المعادلة:                                                         │
│  fill% = total_weight / max_capacity (تقدير فقط)                   │
│  ready_to_ship = user_confirmed (يدوي)                             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### لماذا الفصل مهم؟

| السبب | العميل | الوكيل |
|-------|--------|--------|
| **الدقة** | مطلوبة (density) | غير مطلوبة |
| **المسؤولية** | النظام | الوكيل |
| **الحجم** | صغير (منزلي) | كبير (تجاري) |
| **الخبرة** | مستخدم عادي | محترف |
| **التحكم** | تلقائي | يدوي |

### آلية تحسين تقديرات الوكيل (مستقبلي)

```sql
-- عند كل شحن للوكيل، نسجل:
UPDATE agent_bags
SET 
  avg_actual_weight = (
    (avg_actual_weight * total_shipments + :actual_weight) 
    / (total_shipments + 1)
  ),
  total_shipments = total_shipments + 1
WHERE waste_type = :waste_type;

-- مع الوقت، التقديرات تصبح أدق بناءً على البيانات الفعلية
```

---

**آخر تحديث:** يناير 2026  
**الإصدار:** 1.1 (Proposal - Updated)  
**الحالة:** 📋 للمناقشة
