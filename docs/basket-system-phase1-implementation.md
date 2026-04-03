# 🚀 خطة تنفيذ Phase 1: نظام السلة (Basket System)

**تاريخ الإنشاء:** يناير 2026  
**الإصدار:** 1.0 (Phase 1 Only)  
**الحالة:** ✅ جاهز للتنفيذ  
**المدة المتوقعة:** 2-3 أسابيع

---

## 📋 نظرة عامة

هذا المستند يوضح **خطة تنفيذ Phase 1 فقط** - الأساسيات التي نحتاجها للإطلاق.

**الهدف:** فصل سلة العميل عن سلة الوكيل + حساب أساسي للامتلاء + UI واضح

**المبدأ:** 80% قيمة بـ 40% مجهود

---

## ✅ ما سننفذه (Phase 1)

### 1. فصل أنواع السلال

- ✅ `BasketType` enum (client, agent)
- ✅ كل سلة تعرف نوعها

### 2. Client Basket (مبسط)

- ✅ Bag واحد افتراضي (5 كجم)
- ✅ Density مبسطة (قيم ثابتة في الكود)
- ✅ Status + ألوان (empty, filling, almostFull, readyToShip)
- ✅ Progress Bar واضح

### 3. Agent Basket

- ✅ صنف واحد فقط
- ✅ وزن مباشر (بدون density)
- ✅ زر "الكيس ممتلئ" (Self-reported)
- ✅ Progress Bar تقديري

### 4. UI الأساسي

- ✅ Progress Bar لكل نوع
- ✅ "Ready to Ship" واضح
- ✅ ألوان بسيطة (أخضر، برتقالي، أحمر)

---

## ❌ ما لن ننفذه (Phase 1)

- ❌ Remote Config من Supabase (Phase 2)
- ❌ QR codes (Phase 3)
- ❌ Analytics متقدم (Phase 3)
- ❌ Density factors دقيقة (Phase 2)

---

## 📂 الملفات المطلوبة

### 1. Enums

**ملف:** `lib/models/basket_types.dart`

```dart
enum BasketType {
  client,
  agent,
}

enum BasketStatus {
  empty,
  filling,
  almostFull,
  readyToShip,
}

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

### 2. Config Class

**ملف:** `lib/config/basket_config.dart`

```dart
class BasketConfig {
  // Thresholds (قيم ثابتة في Phase 1)
  static const double almostFullThreshold = 0.70;  // 70%
  static const double readyToShipThreshold = 0.85; // 85%
  
  // Default bag capacity
  static const double defaultBagCapacityKg = 5.0;  // 5 كجم للعميل
  static const double defaultAgentBagCapacityKg = 20.0; // 20 كجم للوكيل
  
  // Density factors (قيم ثابتة في Phase 1)
  static const Map<WasteType, double> densityFactors = {
    WasteType.plastic: 0.6,
    WasteType.paper: 0.7,
    WasteType.cans: 0.8,
    WasteType.metal: 1.2,
    WasteType.glass: 1.0,
    WasteType.other: 1.0,
  };
}
```

---

### 3. Collection Bag Model (مبسط)

**ملف:** `lib/models/collection_bag.dart`

```dart
class CollectionBag {
  final String id;
  final String name;
  final double maxCapacityKg;
  
  CollectionBag({
    required this.id,
    required this.name,
    required this.maxCapacityKg,
  });
  
  /// حساب Effective Load (مع density)
  double calculateEffectiveLoad(List<WasteRecycling> items) {
    double effectiveLoad = 0.0;
    
    for (var item in items) {
      final wasteType = _getWasteType(item);
      final densityFactor = BasketConfig.densityFactors[wasteType] ?? 1.0;
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
    
    if (fillPercentage >= BasketConfig.readyToShipThreshold) {
      return BasketStatus.readyToShip;
    }
    if (fillPercentage >= BasketConfig.almostFullThreshold) {
      return BasketStatus.almostFull;
    }
    return BasketStatus.filling;
  }
  
  WasteType _getWasteType(WasteRecycling item) {
    // TODO: Map from waste_data_admin to WasteType
    return WasteType.other;
  }
  
  /// Default bag للعميل
  factory CollectionBag.defaultBag() {
    return CollectionBag(
      id: 'default',
      name: 'كيس متوسط',
      maxCapacityKg: BasketConfig.defaultBagCapacityKg,
    );
  }
}
```

---

### 4. Agent Bag Model (مبسط)

**ملف:** `lib/models/agent_bag.dart`

```dart
class AgentBag {
  final String id;
  final String name;
  final WasteType wasteType;
  final double maxCapacityKg;
  
  AgentBag({
    required this.id,
    required this.name,
    required this.wasteType,
    required this.maxCapacityKg,
  });
  
  /// حساب نسبة الامتلاء التقديرية (للمساعدة فقط)
  double calculateEstimatedFillPercentage(double totalWeight) {
    return (totalWeight / maxCapacityKg).clamp(0.0, 1.0);
  }
  
  /// Default bag للوكيل
  factory AgentBag.defaultForWasteType(WasteType wasteType) {
    return AgentBag(
      id: 'default_${wasteType.name}',
      name: 'كيس ${_getWasteTypeName(wasteType)}',
      wasteType: wasteType,
      maxCapacityKg: BasketConfig.defaultAgentBagCapacityKg,
    );
  }
  
  static String _getWasteTypeName(WasteType type) {
    switch (type) {
      case WasteType.plastic:
        return 'بلاستيك';
      case WasteType.paper:
        return 'ورق/كرتون';
      case WasteType.cans:
        return 'علب ألومنيوم';
      case WasteType.metal:
        return 'معادن';
      case WasteType.glass:
        return 'زجاج';
      default:
        return 'عام';
    }
  }
}
```

---

### 5. Basket Calculator Service

**ملف:** `lib/services/basket_calculator.dart`

```dart
class BasketCalculator {
  /// حساب State للعميل
  static BasketWasteState calculateClientState({
    required List<WasteRecycling> items,
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
  
  /// حساب State للوكيل
  static BasketWasteState calculateAgentState({
    required List<WasteRecycling> items,
    AgentBag? bag,
    bool isManuallyMarkedFull = false,
  }) {
    final totalWeight = items.fold(0.0, (sum, item) => sum + item.weight);
    
    BasketStatus status;
    if (isManuallyMarkedFull) {
      status = BasketStatus.readyToShip;
    } else if (items.isEmpty) {
      status = BasketStatus.empty;
    } else {
      final effectiveBag = bag ?? AgentBag.defaultForWasteType(WasteType.other);
      final estimatedFill = effectiveBag.calculateEstimatedFillPercentage(totalWeight);
      
      if (estimatedFill >= BasketConfig.readyToShipThreshold) {
        status = BasketStatus.almostFull;  // اقتراح فقط
      } else {
        status = BasketStatus.filling;
      }
    }
    
    final maxWeight = bag?.maxCapacityKg ?? BasketConfig.defaultAgentBagCapacityKg;
    final fillPercentage = (totalWeight / maxWeight).clamp(0.0, 1.0);
    
    return BasketWasteState(
      basketType: BasketType.agent,
      items: items,
      totalWeight: totalWeight,
      effectiveLoad: totalWeight,  // للوكيل: نفس الوزن
      fillPercentage: fillPercentage,
      status: status,
      totalQuantity: items.length,
      totalPrice: items.fold(0.0, (sum, item) => sum + item.price),
      totalPoints: items.fold(0, (sum, item) => sum + item.points),
      isManuallyMarkedFull: isManuallyMarkedFull,
    );
  }
}
```

---

### 6. Updated State

**ملف:** `lib/bloc/basket_waste_state.dart`

```dart
class BasketWasteState {
  final BasketType basketType;
  final List<WasteRecycling> items;
  final CollectionBag? bag;  // للعميل فقط
  final double totalWeight;
  final double effectiveLoad;
  final double fillPercentage;
  final BasketStatus status;
  final int totalQuantity;
  final double totalPrice;
  final int totalPoints;
  final bool isManuallyMarkedFull;  // للوكيل فقط
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
    this.isManuallyMarkedFull = false,
    this.isLoading = false,
    this.errorMessage,
  });
  
  /// Copy with (استخدام Calculator)
  BasketWasteState copyWith({
    List<WasteRecycling>? items,
    CollectionBag? bag,
    bool? isManuallyMarkedFull,
    bool? isLoading,
    String? errorMessage,
  }) {
    // ✅ حساب فقط إذا تغيرت items
    if (items != null && items != this.items) {
      if (basketType == BasketType.client) {
        return BasketCalculator.calculateClientState(
          items: items,
          bag: bag ?? this.bag,
        );
      } else {
        return BasketCalculator.calculateAgentState(
          items: items,
          isManuallyMarkedFull: isManuallyMarkedFull ?? this.isManuallyMarkedFull,
        );
      }
    }
    
    // ✅ تحديث بسيط إذا لم تتغير items
    return BasketWasteState(
      basketType: basketType,
      items: items ?? this.items,
      bag: bag ?? this.bag,
      totalWeight: totalWeight,
      effectiveLoad: effectiveLoad,
      fillPercentage: fillPercentage,
      status: status,
      totalQuantity: totalQuantity,
      totalPrice: totalPrice,
      totalPoints: totalPoints,
      isManuallyMarkedFull: isManuallyMarkedFull ?? this.isManuallyMarkedFull,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}
```

---

### 7. Updated BLoC

**ملف:** `lib/bloc/basket_waste_bloc.dart`

```dart
class BasketWasteBloc extends Bloc<BasketWasteEvent, BasketWasteState> {
  final BasketLocalDataSource localDataSource;
  final BasketType basketType;
  BasketStatus? _lastStatus;  // لتتبع تغيير Status
  
  BasketWasteBloc({
    required this.basketType,
    required this.localDataSource,
  }) : super(
    basketType == BasketType.client
        ? BasketWasteState(basketType: BasketType.client)
        : BasketWasteState(basketType: BasketType.agent),
  ) {
    on<LoadBasketWaste>(_onLoadBasketWaste);
    on<AddWasteItem>(_onAddWasteItem);
    on<UpdateWasteItem>(_onUpdateWasteItem);
    on<DeleteWasteItem>(_onDeleteWasteItem);
    on<ClearBasket>(_onClearBasket);
    
    if (basketType == BasketType.agent) {
      on<MarkBasketAsFull>(_onMarkBasketAsFull);
      on<UnmarkBasketAsFull>(_onUnmarkBasketAsFull);
    }
  }
  
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
    
    // ✅ تحديث Widget فقط عند تغيير Status
    if (newState.status != _lastStatus) {
      _lastStatus = newState.status;
      await _updateBasketIcon(newState);
    }
  }
  
  Future<void> _onMarkBasketAsFull(
    MarkBasketAsFull event,
    Emitter<BasketWasteState> emit,
  ) async {
    final newState = state.copyWith(isManuallyMarkedFull: true);
    emit(newState);
    
    await localDataSource.saveBasketStatus(
      basketType: basketType,
      isMarkedFull: true,
    );
    
    if (newState.status != _lastStatus) {
      _lastStatus = newState.status;
      await _updateBasketIcon(newState);
    }
  }
  
  Future<void> _updateBasketIcon(BasketWasteState state) async {
    if (basketType != BasketType.client) return;
    
    final color = _getColorForStatus(state.status);
    
    await HomeWidgetService.updateBasketIcon(
      status: state.status,
      fillPercentage: state.fillPercentage,
      color: color,
    );
  }
  
  String _getColorForStatus(BasketStatus status) {
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

## 🎨 UI Components

### 1. Fill Percentage Indicator (للعميل)

```dart
class FillPercentageIndicator extends StatelessWidget {
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
                '${(fillPercentage * 100).toStringAsFixed(0)}%',
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

### 2. Estimated Fill Indicator (للوكيل)

```dart
class EstimatedFillIndicator extends StatelessWidget {
  final double fillPercentage;
  
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
                  Text('تقدير نسبة الامتلاء'),
                  SizedBox(width: 4),
                  Icon(Icons.info_outline, size: 16, color: Colors.grey),
                ],
              ),
              Text(
                '~${(fillPercentage * 100).toStringAsFixed(0)}%',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[600],
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
            '💡 هذا تقدير مبدئي - أنت من يحدد متى الكيس جاهز',
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}
```

### 3. Mark Full Button (للوكيل)

```dart
class MarkFullButton extends StatelessWidget {
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
          ],
        ),
      );
    }
    
    return Container(
      padding: EdgeInsets.all(16),
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(Icons.check_circle),
        label: Text('جاهز للشحن'),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          minimumSize: Size(double.infinity, 50),
        ),
      ),
    );
  }
}
```

---

## ✅ Checklist التنفيذ

### Week 1: الأساسيات

- [ ] إنشاء `BasketType` و `BasketStatus` enums
- [ ] إنشاء `BasketConfig` class
- [ ] إنشاء `CollectionBag` model (مبسط)
- [ ] إنشاء `AgentBag` model (مبسط)
- [ ] إنشاء `BasketCalculator` service
- [ ] تحديث `BasketWasteState`
- [ ] فصل `BasketLocalDataSource`

### Week 2: المنطق

- [ ] تطبيق `calculateEffectiveLoad()` (قيم ثابتة)
- [ ] تطبيق `calculateFillPercentage()`
- [ ] تطبيق `getStatus()`
- [ ] تحديث BLoC
- [ ] إضافة Events للوكيل (MarkBasketAsFull)

### Week 3: UI

- [ ] تحديث `BasketWastePage` للعميل
- [ ] تحديث `AgentBasketPage` للوكيل
- [ ] إضافة `FillPercentageIndicator`
- [ ] إضافة `EstimatedFillIndicator`
- [ ] إضافة `MarkFullButton`
- [ ] تحديث `HomeWidgetService`
- [ ] إضافة الصور (أخضر، برتقالي، أحمر)

---

## 🎯 النتيجة المتوقعة

بعد Phase 1:

- ✅ فصل كامل بين سلة العميل والوكيل
- ✅ حساب أساسي للامتلاء
- ✅ تجربة مستخدم واضحة
- ✅ جاهز للإطلاق

**المدة:** 2-3 أسابيع  
**القيمة:** 80% من القيمة الكاملة

---

**آخر تحديث:** يناير 2026  
**الإصدار:** 1.0 (Phase 1 Only)
