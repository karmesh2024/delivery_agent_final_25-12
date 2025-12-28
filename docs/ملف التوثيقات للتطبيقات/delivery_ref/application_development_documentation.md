# توثيق تفصيلي لبناء تطبيق مندوب التوصيل (Delivery Karmesh)

## 1. نظرة عامة على التطبيق

تطبيق مندوب التوصيل (Delivery Karmesh) هو تطبيق محمول مصمم خصيصًا لمندوبي توصيل وجمع المخلفات. يوفر التطبيق واجهة مستخدم سهلة الاستخدام تمكّن المندوبين من إدارة الطلبات، وجمع المخلفات، وإصدار الفواتير، وتتبع أدائهم، مع تكامل كامل مع خدمات Supabase كخلفية للتطبيق.

### الأهداف الرئيسية للتطبيق:
- تسهيل إدارة وتتبع طلبات جمع المخلفات
- تمكين المندوبين من تسجيل وتصنيف المخلفات المجمعة
- إنشاء وإدارة الفواتير والمدفوعات
- متابعة أداء المندوبين ومكافآتهم
- توفير خرائط وخدمات التتبع الجغرافي

## 2. التقنيات والأدوات المستخدمة

### 2.1 إطار العمل والبرمجة
- **Flutter**: إطار عمل متعدد المنصات لبناء تطبيقات الهاتف المحمول باستخدام لغة Dart
- **Dart**: لغة البرمجة الأساسية للتطبيق

### 2.2 إدارة الحالة
- **BLoC Pattern (Business Logic Component)**: نمط لإدارة حالة التطبيق وفصل المنطق التجاري عن واجهة المستخدم
- **flutter_bloc**: مكتبة لتنفيذ نمط BLoC في Flutter
- **Equatable**: مكتبة تساعد في مقارنة الكائنات عند التعامل مع BLoC

### 2.3 قاعدة البيانات والخلفية
- **Supabase**: منصة بديلة مفتوحة المصدر عن Firebase، توفر قاعدة بيانات بوستجريسكل مع واجهة برمجة تطبيقات سهلة
- **PostgreSQL**: قاعدة البيانات العلائقية المستخدمة من قبل Supabase

### 2.4 مكتبات وأدوات أخرى
- **Get_It**: لإدارة تبعيات التطبيق (Dependency Injection)
- **Dartz**: للتعامل مع البرمجة الوظيفية وإدارة الأخطاء
- **connectivity_plus**: لفحص حالة الاتصال بالإنترنت
- **internet_connection_checker_plus**: للتحقق من الاتصال بالإنترنت
- **shared_preferences**: لتخزين البيانات المحلية
- **twilio_flutter**: للتفاعل مع خدمة Twilio لإرسال الرسائل النصية
- **flutter_dotenv**: للتعامل مع متغيرات البيئة

## 3. الهيكل المعماري للتطبيق

تطبيق مندوب التوصيل تم بناؤه باستخدام **العمارة النظيفة (Clean Architecture)** مع مبادئ SOLID لتحقيق فصل واضح بين طبقات التطبيق المختلفة. يتكون الهيكل المعماري من ثلاث طبقات رئيسية:

### 3.1 طبقة العرض (Presentation Layer)
- تتعامل مع واجهة المستخدم وتفاعلاته
- تستخدم نمط BLoC لإدارة حالة التطبيق
- تتكون من الصفحات (Pages) والويدجيت (Widgets) والبلوك (BLoCs)

### 3.2 طبقة منطق الأعمال (Domain Layer)
- تحتوي على المنطق التجاري والقواعد الخاصة بالتطبيق
- تتكون من الكيانات (Entities) وحالات الاستخدام (UseCases) وواجهات المستودعات (Repository Interfaces)
- مستقلة عن أي إطار عمل أو تقنية محددة

### 3.3 طبقة البيانات (Data Layer)
- مسؤولة عن الحصول على البيانات من مصادر مختلفة (Supabase، التخزين المحلي، API)
- تتكون من تنفيذات المستودعات (Repository Implementations) ونماذج البيانات (Models) ومصادر البيانات (DataSources)

## 4. هيكل المشروع وتنظيم الملفات

تم تنظيم المشروع بطريقة تعكس كلاً من الهيكل المعماري والميزات الوظيفية للتطبيق:

```
lib/
├── app.dart                   # تكوين التطبيق الرئيسي
├── init_dependencies.main.dart # تهيئة التبعيات وتسجيلها
├── main.dart                  # نقطة دخول التطبيق
├── core/                      # المكونات الأساسية المشتركة
│   ├── constants/             # الثوابت (ألوان، أنماط، نصوص)
│   ├── error/                 # معالجة الأخطاء
│   ├── network/               # خدمات الشبكة والاتصال
│   ├── route/                 # إدارة التنقل
│   ├── services/              # الخدمات الأساسية
│   ├── supabase_client.dart   # تهيئة وإدارة Supabase
│   └── utils/                 # أدوات مساعدة
└── futures/                   # ميزات التطبيق المختلفة
    ├── auth/                  # المصادقة وإدارة الحساب
    ├── dashboard/             # لوحة التحكم الرئيسية
    ├── delivery_card/         # بطاقة معلومات التوصيل
    ├── onboarding/            # شاشات الترحيب والتعريف
    ├── orders_v2/             # إدارة الطلبات (الإصدار الثاني)
    ├── profile/               # إدارة ملف المندوب
    ├── rewards/               # نظام المكافآت والحوافز
    └── waste_collection/      # إدارة جمع وفرز المخلفات
```

كل ميزة (feature) في مجلد `futures/` تتبع نفس الهيكل الداخلي المعتمد على العمارة النظيفة:

```
future_name/
├── data/                      # طبقة البيانات
│   ├── datasources/           # مصادر البيانات
│   ├── models/                # نماذج البيانات
│   └── repositories/          # تنفيذات المستودعات
├── domain/                    # طبقة منطق الأعمال
│   ├── entities/              # الكيانات
│   ├── repositories/          # واجهات المستودعات
│   └── usecases/              # حالات الاستخدام
└── presentation/              # طبقة العرض
    ├── bloc/                  # مكونات BLoC
    ├── pages/                 # صفحات
    └── widgets/               # ويدجيت
```

## 5. آلية عمل التطبيق وتدفق البيانات

### 5.1 نقطة البداية: تهيئة التطبيق

تبدأ عملية تشغيل التطبيق في ملف `main.dart` الذي يقوم بالمهام التالية:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load();  // تحميل متغيرات البيئة
  await initDependencies();  // تهيئة التبعيات
  
  runApp(const App());
}
```

تتم تهيئة التبعيات في `init_dependencies.main.dart` باستخدام مكتبة Get_It:

```dart
final GetIt serviceLocator = GetIt.I;

Future<void> initDependencies() async {
  try {
    if (!serviceLocator.isRegistered<SupabaseClient>()) {
      await _initSupabase();
      _initConnectionChecker();
      _initExternal();
      await _initAuth();
      _initOrdersV2();
      _initOrdersdetails();
      _initOnboarding();
      _initOrderTracking();
      _initWasteCollection();
      _initProfile();
    }
  } catch (e) {
    print('Error initializing dependencies: $e');
    rethrow;
  }
}
```

يتم تهيئة Supabase كخدمة أساسية:

```dart
Future<void> _initSupabase() async {
  final supabase = await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL']!,
    anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
  );
  serviceLocator.registerLazySingleton<SupabaseClient>(() => supabase.client);
}
```

### 5.2 تسجيل الخدمات والمكونات

يتم تسجيل المكونات المختلفة للتطبيق باستخدام Get_It وفقًا للعمارة النظيفة:

**تسجيل مصادر البيانات:**

```dart
// مثال من _initOrdersV2
serviceLocator.registerLazySingleton<OrdersRemoteDataSource>(
  () => OrdersRemoteDataSourceImpl(serviceLocator<SupabaseClient>()),
);

serviceLocator.registerLazySingleton<OrdersLocalDataSource>(
  () => OrdersLocalDataSourceImpl(serviceLocator<SharedPreferences>()),
);
```

**تسجيل المستودعات:**

```dart
// مثال من _initOrdersV2
serviceLocator.registerLazySingleton<OrdersRepository>(
  () => OrdersRepositoryImpl(
    serviceLocator<OrdersRemoteDataSource>(),
    serviceLocator<OrdersLocalDataSource>(),
    serviceLocator<Connectivity>(),
  ),
);
```

**تسجيل حالات الاستخدام:**

```dart
// مثال من _initOrdersV2
serviceLocator.registerLazySingleton<GetOrdersUseCase>(
  () => GetOrdersUseCase(serviceLocator<OrdersRepository>()),
);

serviceLocator.registerLazySingleton<UpdateOrderUseCase>(
  () => UpdateOrderUseCase(serviceLocator<OrdersRepository>()),
);
```

**تسجيل BLoCs:**

```dart
// مثال من _initOrdersV2
serviceLocator.registerFactory<OrdersBlocV2>(
  () => OrdersBlocV2(
    getOrdersUseCase: serviceLocator<GetOrdersUseCase>(),
    updateOrderUseCase: serviceLocator<UpdateOrderUseCase>(),
    createOrderUseCase: serviceLocator<CreateOrderUseCase>(),
    // المزيد من حالات الاستخدام...
  ),
);
```

### 5.3 إدارة الحالة باستخدام BLoC

يستخدم التطبيق نمط BLoC لإدارة حالة التطبيق وفصل منطق الأعمال عن واجهة المستخدم. 

**مثال: ProfileBloc**

```dart
// من ملف profile_bloc.dart
class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {
  final GetCurrentProfileUseCase _getCurrentProfileUseCase;
  final UpdateOnlineStatusUseCase _updateOnlineStatusUseCase;
  final UpdateDeliveryBoyAvailabilityUseCase _updateAvailabilityUseCase;

  ProfileBloc({
    required GetCurrentProfileUseCase getCurrentProfileUseCase,
    required UpdateOnlineStatusUseCase updateOnlineStatusUseCase,
    required UpdateDeliveryBoyAvailabilityUseCase updateAvailabilityUseCase,
  }) : _getCurrentProfileUseCase = getCurrentProfileUseCase,
       _updateOnlineStatusUseCase = updateOnlineStatusUseCase,
       _updateAvailabilityUseCase = updateAvailabilityUseCase,
       super(const ProfileInitial()) {
    on<GetProfileEvent>(_onGetProfile);
    on<UpdateOnlineStatusEvent>(_onUpdateOnlineStatus);
    on<UpdateAvailabilityEvent>(_onUpdateAvailability);
  }

  // معالجة الأحداث...
}
```

هذا البلوك يتعامل مع ثلاثة أحداث مختلفة متعلقة بملف المندوب الشخصي:
1. جلب البروفايل
2. تحديث حالة الاتصال عبر الإنترنت
3. تحديث حالة التوفر لاستلام الطلبات

### 5.4 تدفق البيانات في التطبيق

يتبع تدفق البيانات في التطبيق النمط التالي:

1. **واجهة المستخدم (UI)**: تقوم بإرسال أحداث إلى BLoC
2. **BLoC**: يعالج الأحداث ويستدعي حالات الاستخدام المناسبة
3. **حالة الاستخدام (UseCase)**: تنفذ منطق الأعمال وتتفاعل مع المستودع
4. **المستودع (Repository)**: يتعامل مع مصادر البيانات المختلفة
5. **مصدر البيانات (DataSource)**: يتعامل مع API أو التخزين المحلي
6. **النتيجة تعود في الاتجاه المعاكس**: DataSource -> Repository -> UseCase -> BLoC -> UI

**مثال: تحديث حالة توفر المندوب**

```dart
// 1. في واجهة المستخدم
Switch(
  value: isAvailable,
  onChanged: (value) {
    context.read<ProfileBloc>().add(UpdateAvailabilityEvent(value));
  },
)

// 2. في BLoC (profile_bloc.dart)
Future<void> _onUpdateAvailability(
  UpdateAvailabilityEvent event,
  Emitter<ProfileState> emit,
) async {
  if (state is ProfileLoaded) {
    final currentProfile = (state as ProfileLoaded).profile;
    emit(ProfileLoading());

    final result = await _updateAvailabilityUseCase(
      AvailabilityParams(isAvailable: event.isAvailable),
    );

    result.fold(
      (failure) => emit(ProfileError(_mapFailureToMessage(failure))),
      (updatedProfile) => emit(ProfileLoaded(updatedProfile)),
    );
  } else {
    emit(const ProfileError('تحتاج إلى تحميل البروفايل أولاً قبل تحديث حالة التوفر'));
  }
}

// 3. في UseCase (update_availability_usecase.dart)
class UpdateDeliveryBoyAvailabilityUseCase implements UseCase<ProfileEntity, AvailabilityParams> {
  final ProfileRepository _repository;

  UpdateDeliveryBoyAvailabilityUseCase(this._repository);

  @override
  Future<Either<Failure, ProfileEntity>> call(AvailabilityParams params) {
    return _repository.updateAvailability(params.isAvailable);
  }
}

// 4. في Repository (profile_repository_impl.dart)
@override
Future<Either<Failure, ProfileEntity>> updateAvailability(bool isAvailable) async {
  try {
    final isConnected = await connectionChecker.isConnected();
    if (!isConnected) {
      return Left(NetworkFailure(message: 'تحقق من الاتصال بالإنترنت'));
    }

    final profile = await remoteDataSource.updateAvailability(isAvailable);
    return Right(profile);
  } on ServerException catch (e) {
    return Left(ServerFailure(message: e.message));
  } catch (e) {
    return Left(ServerFailure(message: e.toString()));
  }
}

// 5. في DataSource (profile_remote_datasource.dart)
@override
Future<ProfileEntity> updateAvailability(bool isAvailable) async {
  try {
    final currentUser = supabaseClient.auth.currentUser;
    if (currentUser == null) {
      throw ServerException(message: 'User not authenticated');
    }

    final response = await supabaseClient.rpc(
      'update_delivery_boy_availability',
      params: {
        'user_id': currentUser.id,
        'available': isAvailable,
      },
    );

    final profile = await getProfile();
    return profile;
  } catch (e) {
    throw ServerException(message: e.toString());
  }
}
```

## 6. تنفيذ الميزات الرئيسية

### 6.1 نظام المصادقة

نظام المصادقة في التطبيق يعتمد على خدمات Supabase ويدعم:
- تسجيل الدخول برقم الهاتف
- التحقق من رقم الهاتف عبر رمز OTP
- تسجيل مندوب جديد
- توليد رمز التوصيل الخاص بالمندوب
- تسجيل الخروج

ينفذ نظام المصادقة من خلال `AuthBloc` الذي يتعامل مع أحداث المصادقة المختلفة:

```dart
// أحداث المصادقة (auth/presentation/bloc/event.dart)
abstract class AuthEvent {}
class AuthLogin extends AuthEvent { /*...*/ }
class AuthRegister extends AuthEvent { /*...*/ }
class AuthGenerateDeliveryCode extends AuthEvent { /*...*/ }
class AuthSendPhoneVerification extends AuthEvent { /*...*/ }
class AuthVerifyPhone extends AuthEvent { /*...*/ }
class AuthLogout extends AuthEvent {}
class AuthIsUserLoggedIn extends AuthEvent {}

// BLoC المصادقة (auth/presentation/bloc/bloc.dart)
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  // حالات الاستخدام المختلفة للمصادقة
  final GenerateDeliveryCodeUseCase generateDeliveryCodeUseCase;
  final SendOtpUseCase sendOtpUseCase;
  // المزيد من حالات الاستخدام...

  AuthBloc({required this.generateDeliveryCodeUseCase, /*...*/ }) : super(AuthInitial()) {
    on<AuthLogin>(_onLogin);
    on<AuthRegister>(_onRegister);
    // المزيد من معالجات الأحداث...
  }

  // معالجات الأحداث...
}
```

### 6.2 إدارة الطلبات

يوفر التطبيق نظامًا شاملًا لإدارة الطلبات، بما في ذلك:
- عرض قائمة الطلبات المتاحة والمخصصة للمندوب
- تصفية الطلبات حسب الحالة والأولوية
- عرض تفاصيل الطلب
- تتبع موقع الطلب
- تحديث حالة الطلب
- جدولة الطلبات

يتم تنفيذ إدارة الطلبات من خلال عدة BLoCs:

```dart
// من ملف orders_bloc_v2.dart
class OrdersBlocV2 extends Bloc<OrdersEvent, OrdersState> {
  final GetOrdersUseCase getOrdersUseCase;
  final UpdateOrderUseCase updateOrderUseCase;
  final CreateOrderUseCase createOrderUseCase;
  final DeleteOrderUseCase deleteOrderUseCase;
  // المزيد من حالات الاستخدام...

  OrdersBlocV2({
    required this.getOrdersUseCase,
    required this.updateOrderUseCase,
    /*...*/
  }) : super(OrdersInitial()) {
    on<LoadOrdersEvent>(_onLoadOrders);
    on<UpdateOrderEvent>(_onUpdateOrder);
    // المزيد من معالجات الأحداث...
  }

  // معالجات الأحداث...
}
```

عرض بطاقة الطلب في واجهة المستخدم:

```dart
// من ملف order_card.dart
class OrderCard extends StatelessWidget {
  final OrderEntity order;
  final List<OrderDetailEntity> orderDetails;
  final Function(OrderEntity) onOrderUpdated;

  const OrderCard({
    Key? key,
    required this.order,
    required this.orderDetails,
    required this.onOrderUpdated,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showDetailsModal(context),
      child: Card(
        // UI بطاقة الطلب...
      ),
    );
  }

  // المزيد من وسائط العرض...
}
```

### 6.3 تتبع الموقع الجغرافي

يوفر التطبيق خدمة تتبع الموقع الجغرافي للمندوبين والطلبات:
- تسجيل موقع المندوب أثناء التوصيل
- عرض موقع المندوب على الخريطة
- حساب المسافات والأوقات المقدرة
- تتبع مسار التوصيل

```dart
// من OrderTrackingBloc
class OrderTrackingBloc extends Bloc<OrderTrackingEvent, OrderTrackingState> {
  final GetOrderTrackingHistoryUseCase getOrderTrackingHistoryUseCase;
  final AddTrackingLocationUseCase addTrackingLocationUseCase;
  // المزيد من حالات الاستخدام...

  OrderTrackingBloc({
    required this.getOrderTrackingHistoryUseCase,
    required this.addTrackingLocationUseCase,
    /*...*/
  }) : super(OrderTrackingInitial()) {
    on<GetOrderTrackingEvent>(_onGetOrderTracking);
    on<AddTrackingPointEvent>(_onAddTrackingPoint);
    // المزيد من معالجات الأحداث...
  }

  // معالجات الأحداث...
}
```

### 6.4 جمع المخلفات وإدارة الفواتير

يوفر التطبيق نظامًا متكاملًا لجمع المخلفات وإدارة الفواتير:
- تسجيل أنواع وكميات المخلفات المجمعة
- حساب الأسعار والنقاط
- إنشاء فواتير وإرسالها للعملاء
- متابعة حالة موافقة العميل على الفاتورة

```dart
// من WasteCollectionBloc
class WasteCollectionBloc extends Bloc<WasteCollectionEvent, WasteCollectionState> {
  final CreateSessionUseCase createSessionUseCase;
  final AddWasteItemUseCase addWasteItemUseCase;
  final GenerateInvoiceUseCase generateInvoiceUseCase;
  // المزيد من حالات الاستخدام...

  WasteCollectionBloc({
    required this.createSessionUseCase,
    required this.addWasteItemUseCase,
    required this.generateInvoiceUseCase,
    /*...*/
  }) : super(WasteCollectionInitial()) {
    on<CreateSessionEvent>(_onCreateSession);
    on<AddWasteItemEvent>(_onAddWasteItem);
    on<GenerateInvoiceEvent>(_onGenerateInvoice);
    // المزيد من معالجات الأحداث...
  }

  // معالجات الأحداث...
}
```

### 6.5 إدارة ملف المندوب

يوفر التطبيق واجهة لإدارة ملف المندوب الشخصي:
- عرض وتحديث المعلومات الشخصية
- تحديث حالة التوفر وحالة الاتصال
- عرض إحصائيات الأداء والتقييمات
- إدارة المناطق المفضلة

```dart
// من profile_bloc.dart
class ProfileBloc extends Bloc<ProfileEvent, ProfileState> {
  // تم شرحه سابقًا
}
```

## 7. معالجة الأخطاء والسيناريوهات غير المتوقعة

التطبيق يستخدم نهجًا موحدًا لمعالجة الأخطاء باستخدام مكتبة Dartz للتعامل مع النتائج المحتملة (Either):

```dart
// تعريف أنواع الفشل في core/error/failures.dart
abstract class Failure {
  final String? message;
  const Failure({this.message});
}

class ServerFailure extends Failure {
  const ServerFailure({String? message}) : super(message: message);
}

class NetworkFailure extends Failure {
  const NetworkFailure({String? message}) : super(message: message);
}

// تعريف الاستثناءات في core/error/exceptions.dart
class ServerException implements Exception {
  final String message;
  ServerException({required this.message});
}

class CacheException implements Exception {
  final String message;
  CacheException({required this.message});
}
```

استخدام Either للتعامل مع النجاح أو الفشل:

```dart
// مثال من مستودع
@override
Future<Either<Failure, ProfileEntity>> getProfile() async {
  try {
    final isConnected = await connectionChecker.isConnected();
    if (!isConnected) {
      return Left(NetworkFailure(message: 'تحقق من الاتصال بالإنترنت'));
    }

    final profile = await remoteDataSource.getProfile();
    return Right(profile);
  } on ServerException catch (e) {
    return Left(ServerFailure(message: e.message));
  } catch (e) {
    return Left(ServerFailure(message: e.toString()));
  }
}
```

معالجة الأخطاء في BLoC:

```dart
// من BLoC
final result = await _getCurrentProfileUseCase(NoParams());

result.fold(
  (failure) => emit(ProfileError(_mapFailureToMessage(failure))),
  (profile) => emit(ProfileLoaded(profile)),
);
```

## 8. اختبار التطبيق

التطبيق يدعم مختلف أنواع الاختبارات:

### 8.1 اختبارات الوحدة (Unit Tests)
- اختبار المستودعات وحالات الاستخدام وBLoCs بمعزل
- استخدام Mockito لتقليد التبعيات

### 8.2 اختبارات التكامل (Integration Tests)
- اختبار التفاعل بين المكونات المختلفة
- التحقق من تدفق البيانات الصحيح

### 8.3 اختبارات واجهة المستخدم (Widget Tests)
- اختبار عناصر واجهة المستخدم
- التحقق من صحة عرض البيانات والتفاعلات

## 9. بناء وتوزيع التطبيق

### 9.1 بناء التطبيق للإنتاج
```
flutter build apk --release  # لنظام Android
flutter build ios --release  # لنظام iOS
```

### 9.2 متغيرات البيئة
التطبيق يستخدم ملف `.env` لتخزين متغيرات البيئة مثل:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_NUMBER`

## 10. أفضل الممارسات المطبقة

- **تطبيق مبادئ SOLID**
  - Single Responsibility: كل صف له مسؤولية واحدة محددة
  - Open/Closed: الكود مفتوح للتوسعة ومغلق للتعديل
  - Liskov Substitution: الأنواع الفرعية قابلة للتبديل بالأنواع الأساسية
  - Interface Segregation: واجهات صغيرة ومحددة الغرض
  - Dependency Inversion: الاعتماد على التجريد وليس التنفيذ

- **نمط Repository**
  - فصل منطق التعامل مع مصادر البيانات
  - تسهيل استبدال مصادر البيانات دون التأثير على باقي التطبيق

- **استخدام Dependency Injection**
  - تسهيل الاختبار
  - تقليل الاقتران بين المكونات

- **كود نظيف ومقروء**
  - أسماء متغيرات ودوال واضحة
  - وحدات صغيرة ذات مسؤولية محددة
  - توثيق مناسب للكود

## 11. الخلاصة

تطبيق مندوب التوصيل (Delivery Karmesh) تم بناؤه باستخدام أحدث التقنيات وأفضل الممارسات في تطوير تطبيقات الهاتف المحمول. يوفر التطبيق واجهة مستخدم سهلة الاستخدام مع بنية برمجية متينة تسمح بالصيانة والتوسعة السهلة.

الاعتماد على العمارة النظيفة ونمط BLoC لإدارة الحالة ومبادئ SOLID يجعل التطبيق قابلاً للاختبار والتوسيع والصيانة بسهولة. كما أن استخدام Supabase كخلفية للتطبيق يوفر قاعدة بيانات قوية وخدمات المصادقة وإدارة المستخدمين.

هذا التوثيق يقدم نظرة شاملة على كيفية بناء التطبيق، بدءًا من الهيكل المعماري العام وحتى تنفيذ الميزات المحددة وتفاصيل التنفيذ الفنية. يمكن استخدام هذا التوثيق كمرجع للمطورين الجدد أو لتطوير المزيد من الميزات في المستقبل.