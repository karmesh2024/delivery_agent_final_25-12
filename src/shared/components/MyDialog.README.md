# مكون MyDialog

مكون مخصص لمربعات الحوار يضمن متطلبات إمكانية الوصول (accessibility).

## مشكلة قمنا بحلها

في مكتبة Radix UI، يتطلب مكون DialogContent وجود DialogTitle لضمان إمكانية الوصول لمستخدمي قارئات الشاشة. يظهر الخطأ التالي عند استخدام DialogContent بدون DialogTitle:

```
`DialogContent` requires a `DialogTitle` for the component to be accessible for screen reader users.
```

## الحل

مكوننا المخصص `MyDialog` يضمن دائمًا وجود عنوان وتعريف مناسبين مع سمات ARIA الصحيحة، ويوفر واجهة بسيطة وسهلة الاستخدام. الإصدار الأخير يستخدم معرفات فريدة لكل مربع حوار لتجنب تضارب المعرفات عند وجود أكثر من مربع حوار في نفس الصفحة.

## التحسينات الأخيرة

- استخدام `useId` من React لإنشاء معرفات فريدة لكل مربع حوار
- معالجة سليمة لسمة `aria-describedby` عندما لا يكون هناك وصف
- توافق أفضل مع متطلبات إمكانية الوصول من Radix UI

## كيفية الاستخدام

### استيراد المكون

```tsx
import { MyDialog, MyDialogClose, MyDialogFooter } from "@/shared/components/MyDialog";
```

### استخدام أساسي

```tsx
<MyDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="عنوان الحوار"
  description="وصف إضافي للحوار"
>
  <p>محتوى الحوار يأتي هنا...</p>
</MyDialog>
```

### حوار مع زر إغلاق

```tsx
<MyDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="عنوان الحوار"
  description="وصف إضافي للحوار"
>
  <p>محتوى الحوار...</p>
  
  <MyDialogFooter>
    <MyDialogClose asChild>
      <Button variant="outline">إغلاق</Button>
    </MyDialogClose>
  </MyDialogFooter>
</MyDialog>
```

### إخفاء العنوان مع الحفاظ على إمكانية الوصول

في بعض الأحيان، قد ترغب في إنشاء واجهة مخصصة مع إخفاء العنوان الأصلي. يمكنك استخدام خاصية `showTitle`:

```tsx
<MyDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="عنوان مخفي للقارئات فقط"
  description="وصف مخفي أيضًا"
  showTitle={false}
>
  <div className="text-center">
    <h3 className="text-2xl font-bold">محتوى مخصص</h3>
    <p>هذا المحتوى يظهر بدلاً من العنوان القياسي</p>
  </div>
</MyDialog>
```

## الخصائص (Props)

| الخاصية | النوع | الافتراضي | الوصف |
|---------|------|---------|---------|
| `open` | `boolean` | - | حالة فتح الحوار |
| `onOpenChange` | `(open: boolean) => void` | - | دالة للتحكم بحالة الحوار |
| `title` | `string` | **مطلوب** | عنوان الحوار (مطلوب لإمكانية الوصول) |
| `description` | `string` | - | وصف إضافي للحوار |
| `children` | `ReactNode` | - | محتوى الحوار |
| `maxWidth` | `string` | `"3xl"` | عرض الحوار الأقصى. يمكن استخدام قيم مثل: "sm"، "md"، "lg"، "3xl" أو قيمة CSS مثل "500px" |
| `className` | `string` | - | فئات CSS إضافية لتخصيص النمط |
| `showTitle` | `boolean` | `true` | خيار لإظهار أو إخفاء العنوان (سيظل متاحًا لقارئات الشاشة) |

## صفحة الأمثلة

للاطلاع على أمثلة متنوعة لاستخدام هذا المكون، يمكنك زيارة:
```
/example
```

## ملاحظات إضافية

- هذا المكون يُغلف مكون `Dialog` من Radix UI ويضمن توافقه مع متطلبات إمكانية الوصول.
- يستخدم المكون معرفات فريدة لكل مربع حوار لتجنب تضارب المعرفات عند استخدام أكثر من مربع حوار في نفس الصفحة.
- استخدم `maxWidth` للتحكم في عرض الحوار، مع دعم مقاسات Tailwind أو قيم CSS مخصصة.
- في حالة الرغبة في واجهة مخصصة تمامًا، استخدم `showTitle={false}` مع توفير العنوان كمحتوى مخصص. 