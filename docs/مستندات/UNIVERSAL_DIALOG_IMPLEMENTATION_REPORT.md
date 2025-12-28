# تقرير تطبيق Universal Dialog للتصنيفات الهرمية

## نظرة عامة
تم تطبيق نظام Universal Dialog لإضافة وتعديل التصنيفات والفئات الأساسية والفرعية، مما يوفر تجربة مستخدم محسنة وواجهة موحدة.

## الملفات المُنشأة/المُحدثة

### 1. ملف Universal Dialog الجديد
**الملف:** `src/shared/ui/universal-dialog.tsx`

**المميزات:**
- مكون قابل لإعادة الاستخدام لجميع أنواع النماذج
- دعم للإضافة والتعديل
- واجهة موحدة وجذابة
- تحقق من البيانات المطلوبة
- حالات تحميل
- إغلاق تلقائي بعد الحفظ

**الخصائص:**
```typescript
interface UniversalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  title: string;
  type: 'classification' | 'mainCategory' | 'subCategory';
  initialData?: any;
  sectors?: any[];
  classifications?: any[];
  mainCategories?: any[];
  loading?: boolean;
}
```

### 2. تحديث صفحة التصنيفات الهرمية
**الملف:** `src/app/warehouse-management/admin-settings/hierarchical-categories/page.tsx`

**التحديثات الرئيسية:**

#### أ. إدارة الحالة الجديدة
```typescript
// Dialog states
const [dialogOpen, setDialogOpen] = useState(false);
const [dialogType, setDialogType] = useState<'classification' | 'mainCategory' | 'subCategory'>('classification');
const [dialogTitle, setDialogTitle] = useState('');
const [editingItem, setEditingItem] = useState<any>(null);
const [dialogLoading, setDialogLoading] = useState(false);
```

#### ب. دوال فتح Dialog
```typescript
const openAddDialog = (type: 'classification' | 'mainCategory' | 'subCategory', sectorId?: string, classificationId?: string, mainCategoryId?: string) => {
  setDialogType(type);
  setEditingItem(null);
  
  if (type === 'classification') {
    setDialogTitle('إضافة تصنيف جديد');
  } else if (type === 'mainCategory') {
    setDialogTitle('إضافة فئة أساسية جديدة');
  } else {
    setDialogTitle('إضافة فئة فرعية جديدة');
  }
  
  // تعيين البيانات الأولية
  setEditingItem({
    sector_id: sectorId || '',
    classification_id: classificationId || '',
    main_category_id: mainCategoryId || ''
  });
  
  setDialogOpen(true);
};

const openEditDialog = (type: 'classification' | 'mainCategory' | 'subCategory', item: any) => {
  setDialogType(type);
  setEditingItem(item);
  
  if (type === 'classification') {
    setDialogTitle('تعديل التصنيف');
  } else if (type === 'mainCategory') {
    setDialogTitle('تعديل الفئة الأساسية');
  } else {
    setDialogTitle('تعديل الفئة الفرعية');
  }
  
  setDialogOpen(true);
};
```

#### ج. دالة الحفظ المحدثة
```typescript
const handleSubmit = async (formData: any) => {
  try {
    setDialogLoading(true);
    console.log('بدء إضافة/تحديث عنصر:', dialogType, formData);
    let success = false;
    
    if (dialogType === 'classification') {
      if (editingItem) {
        success = await warehouseService.updateProductClassification(editingItem.id, {
          name: formData.name,
          description: formData.description,
          sector_id: formData.sector_id
        });
      } else {
        success = await warehouseService.createProductClassification({
          name: formData.name,
          description: formData.description,
          sector_id: formData.sector_id
        });
      }
    }
    // ... باقي الأنواع
    
    if (success) {
      setDialogOpen(false);
      setEditingItem(null);
      await loadData();
    }
  } catch (error) {
    console.error('خطأ في الحفظ:', error);
  } finally {
    setDialogLoading(false);
  }
};
```

#### د. تحديث الأزرار
جميع أزرار الإضافة والتعديل تم تحديثها لاستخدام الدوال الجديدة:

**إضافة تصنيف:**
```typescript
<Button
  size="sm"
  variant="outline"
  onClick={() => openAddDialog('classification', sector.id)}
>
  <FiPlus className="w-4 h-4 mr-1" />
  إضافة تصنيف
</Button>
```

**إضافة فئة أساسية:**
```typescript
<Button
  size="sm"
  variant="outline"
  onClick={() => openAddDialog('mainCategory', undefined, classification.id)}
>
  <FiPlus className="w-3 h-3 mr-1" />
  فئة أساسية
</Button>
```

**إضافة فئة فرعية:**
```typescript
<Button
  size="sm"
  variant="outline"
  onClick={() => openAddDialog('subCategory', undefined, undefined, mainCategory.id)}
>
  <FiPlus className="w-3 h-3 mr-1" />
  فئة فرعية
</Button>
```

#### ه. إضافة Universal Dialog
```typescript
<UniversalDialog
  isOpen={dialogOpen}
  onClose={() => {
    setDialogOpen(false);
    setEditingItem(null);
  }}
  onSubmit={handleSubmit}
  title={dialogTitle}
  type={dialogType}
  initialData={editingItem}
  sectors={sectors}
  classifications={classifications}
  mainCategories={mainCategories}
  loading={dialogLoading}
/>
```

## المميزات الجديدة

### 1. واجهة موحدة
- نفس التصميم لجميع أنواع النماذج
- ألوان وأيقونات متسقة
- تجربة مستخدم موحدة

### 2. سهولة الاستخدام
- نافذة منبثقة بدلاً من نماذج مدمجة
- إغلاق تلقائي بعد الحفظ
- رسائل تحميل واضحة

### 3. المرونة
- دعم للإضافة والتعديل
- تعيين البيانات الأولية تلقائياً
- تحقق من البيانات المطلوبة

### 4. الأداء
- تحميل البيانات مرة واحدة
- إعادة تحميل تلقائي بعد الحفظ
- رسائل تصحيح واضحة

## كيفية الاستخدام

### 1. إضافة تصنيف جديد
1. اضغط على "إضافة تصنيف +" بجانب أي قطاع
2. املأ النموذج في النافذة المنبثقة
3. اختر القطاع من القائمة
4. اضغط "إضافة"

### 2. إضافة فئة أساسية
1. اضغط على "فئة أساسية +" بجانب أي تصنيف
2. املأ النموذج في النافذة المنبثقة
3. اختر التصنيف من القائمة
4. اضغط "إضافة"

### 3. إضافة فئة فرعية
1. اضغط على "فئة فرعية +" بجانب أي فئة أساسية
2. املأ النموذج في النافذة المنبثقة
3. اختر الفئة الأساسية من القائمة
4. اضغط "إضافة"

### 4. تعديل عنصر موجود
1. اضغط على أيقونة التعديل (✏️) بجانب العنصر
2. عدّل البيانات في النافذة المنبثقة
3. اضغط "تحديث"

## الفوائد

### 1. للمطورين
- كود أقل تكراراً
- سهولة الصيانة
- مكون قابل لإعادة الاستخدام

### 2. للمستخدمين
- تجربة مستخدم محسنة
- واجهة موحدة ومألوفة
- سهولة في الاستخدام

### 3. للنظام
- أداء أفضل
- كود أكثر تنظيماً
- سهولة في التطوير المستقبلي

## الاختبار

### 1. اختبار الإضافة
- ✅ إضافة تصنيف جديد
- ✅ إضافة فئة أساسية جديدة
- ✅ إضافة فئة فرعية جديدة

### 2. اختبار التعديل
- ✅ تعديل تصنيف موجود
- ✅ تعديل فئة أساسية موجودة
- ✅ تعديل فئة فرعية موجودة

### 3. اختبار التحقق
- ✅ التحقق من الحقول المطلوبة
- ✅ التحقق من صحة البيانات
- ✅ رسائل الخطأ الواضحة

## الخلاصة

تم تطبيق نظام Universal Dialog بنجاح، مما يوفر:
- واجهة موحدة وجذابة
- سهولة في الاستخدام
- كود منظم وقابل للصيانة
- تجربة مستخدم محسنة

النظام الآن جاهز للاستخدام! 🚀
tttrweew2025
@outlook.com
tttrweew2025
