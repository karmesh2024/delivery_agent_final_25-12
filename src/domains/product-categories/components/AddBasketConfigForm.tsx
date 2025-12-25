import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addSubCategoryBucketConfigThunk, fetchCategoryBucketConfigsThunk, updateSubCategoryBucketConfigThunk } from '@/domains/product-categories/store/productCategoriesSlice';
import { useToast } from '@/shared/ui/use-toast';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { 
  basket_supplier_type, 
  basket_size, 
  CategoryBucketConfig, 
  getSubcategoryById, 
  getExistingSubCategoryBucketConfig, 
  getDistinctSupplierTypes, 
  getDistinctBasketSizes,
  getCategoryNameById
} from '@/domains/product-categories/api/basketConfigService';

interface AddBasketConfigFormProps {
  subcategoryId: string;
  onClose: () => void;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  allCategoryBucketConfigs: CategoryBucketConfig[];
  distinctSupplierTypes: basket_supplier_type[];
  distinctBasketSizes: basket_size[];
  onConfigSubmitted: () => void;
  initialConfig?: Partial<import('@/domains/product-categories/api/basketConfigService').SubCategoryBucketConfig>;
  isEdit?: boolean;
}

export const AddBasketConfigForm: React.FC<AddBasketConfigFormProps> = ({
  subcategoryId,
  onClose,
  parentCategoryId,
  parentCategoryName,
  allCategoryBucketConfigs,
  distinctSupplierTypes,
  distinctBasketSizes,
  onConfigSubmitted,
  initialConfig,
  isEdit
}) => {
  console.log("AddBasketConfigForm: Component rendered. Received props:", {
    subcategoryId,
    parentCategoryId,
    parentCategoryName,
    allCategoryBucketConfigs,
  });
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  // const { loading, error } = useAppSelector(state => state.productCategories.subCategoryBucketConfigs);
  // const { data: allCategoryBucketConfigs } = useAppSelector(state => state.productCategories.categoryBucketConfigs);

  const [supplierType, setSupplierType] = useState<basket_supplier_type | ''>(initialConfig?.supplier_type || '');
  const [basketSize, setBasketSize] = useState<basket_size | ''>(initialConfig?.basket_size || '');
  const [basketEmptyWeight, setBasketEmptyWeight] = useState<number | null>(initialConfig?.basket_empty_weight_kg ?? null);
  const [maxNetWeight, setMaxNetWeight] = useState<number | null>(initialConfig?.max_net_weight_kg ?? null);
  const [maxVolume, setMaxVolume] = useState<number | null>(initialConfig?.max_volume_liters ?? null);
  const [minFillPercentage, setMinFillPercentage] = useState<number | null>(initialConfig?.min_fill_percentage ?? null);
  const [requiresSeparation, setRequiresSeparation] = useState<boolean>(initialConfig?.requires_separation ?? false);
  const [specialHandlingNotes, setSpecialHandlingNotes] = useState<string | null>(initialConfig?.special_handling_notes ?? null);
  const [maxItemsCount, setMaxItemsCount] = useState<number | null>(initialConfig?.max_items_count ?? null);
  const [mainCategoryConfig, setMainCategoryConfig] = useState<CategoryBucketConfig | null>(null);
  // const [distinctSupplierTypes, setDistinctSupplierTypes] = useState<basket_supplier_type[]>([]); // Moved to parent
  // const [distinctBasketSizes, setDistinctBasketSizes] = useState<basket_size[]>([]); // Moved to parent
  // const [mainCategoryName, setMainCategoryName] = useState<string | null>(null);

  // No need for a useEffect to fetch distinct values here, as they are passed as props
  // useEffect(() => {
  //   // ... (removed old fetchDistinctValues logic)
  // }, []); 

  useEffect(() => {
    const fetchAndSetMainCategoryConfig = async () => {
      console.log("AddBasketConfigForm useEffect: Recalculating mainCategoryConfig.");
      console.log("AddBasketConfigForm useEffect: Current allCategoryBucketConfigs (from props):", JSON.stringify(allCategoryBucketConfigs, null, 2));
      console.log("AddBasketConfigForm useEffect: Inputs - parentCategoryId:", parentCategoryId, "supplierType:", supplierType, "basketSize:", basketSize);
      // Only proceed if all necessary values are available and not empty strings
      if (!subcategoryId || !parentCategoryId || !supplierType || !basketSize || allCategoryBucketConfigs.length === 0) {
        console.log("AddBasketConfigForm useEffect: Missing required parameters or category configs not loaded, setting mainCategoryConfig to null");
        setMainCategoryConfig(null);
        return;
      }

      try {
        const matchingConfig = allCategoryBucketConfigs.find(
          config => {
            const match = config.category_id === parentCategoryId &&
                          config.supplier_type === supplierType &&
                          config.basket_size === basketSize;
            console.log(`AddBasketConfigForm useEffect: Checking config ${config.id}: category_id=${config.category_id}, supplier_type=${config.supplier_type}, basket_size=${config.basket_size} -> Match: ${match}`);
            return match;
          }
        );
        console.log("AddBasketConfigForm useEffect: Found matchingConfig:", matchingConfig);
        setMainCategoryConfig(matchingConfig || null);
      } catch (err) {
        console.error("AddBasketConfigForm: Failed to fetch main category config:", err); 
        setMainCategoryConfig(null);
      }
    };

    fetchAndSetMainCategoryConfig();
  }, [subcategoryId, supplierType, basketSize, allCategoryBucketConfigs, parentCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("AddBasketConfigForm: handleSubmit triggered.");
    console.log("AddBasketConfigForm: Checking fields for validation:", {
      supplierType,
      basketSize,
      basketEmptyWeight,
      maxNetWeight,
      minFillPercentage,
    });

    if (!supplierType || !basketSize || basketEmptyWeight === null || maxNetWeight === null || minFillPercentage === null) {
      console.log("AddBasketConfigForm: Validation failed - Missing required fields.");
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع الحقول المطلوبة (باستثناء الحجم الأقصى).",
        variant: "destructive",
      });
      return;
    }

    // Optional: Add client-side validation against mainCategoryConfig limits before dispatching
    if (mainCategoryConfig) {
      if (maxNetWeight !== null && maxNetWeight > mainCategoryConfig.max_net_weight_kg) {
        console.log("AddBasketConfigForm: Validation failed - Net weight exceeds main category limit.");
        toast({
          title: "خطأ",
          description: `الحد الأقصى للوزن الصافي (${maxNetWeight} كجم) يتجاوز الحد المسموح به للفئة الرئيسية (${mainCategoryConfig.max_net_weight_kg} كجم).`,
          variant: "destructive",
        });
        return;
      }
      if (maxVolume !== null && mainCategoryConfig.max_volume_liters !== null && maxVolume > mainCategoryConfig.max_volume_liters) {
        toast({
          title: "خطأ",
          description: `الحد الأقصى للحجم (${maxVolume} لتر) يتجاوز الحد المسموح به للفئة الرئيسية (${mainCategoryConfig.max_volume_liters} لتر).`,
          variant: "destructive",
        });
        return;
      }
      // No max_items_count check here as it's not on CategoryBucketConfig currently
    }

    try {
      const newConfig = {
        subcategory_id: subcategoryId,
        supplier_type: supplierType as basket_supplier_type,
        basket_size: basketSize as basket_size,
        basket_empty_weight_kg: basketEmptyWeight,
        max_net_weight_kg: maxNetWeight,
        max_volume_liters: maxVolume,
        min_fill_percentage: minFillPercentage,
        max_items_count: maxItemsCount,
        requires_separation: requiresSeparation,
        special_handling_notes: specialHandlingNotes,
        is_active: true,
      };

      if (isEdit && initialConfig?.id) {
        await dispatch(updateSubCategoryBucketConfigThunk({
          id: initialConfig.id,
          config: newConfig
        })).unwrap();
        toast({
          title: "تم التعديل",
          description: "تم تعديل تكوين السلة بنجاح.",
        });
      } else {
        // If not, add a new one
        await dispatch(addSubCategoryBucketConfigThunk(newConfig)).unwrap();
        toast({
          title: "تم بنجاح",
          description: "تم إضافة تكوين السلة بنجاح.",
        });
      }
      onConfigSubmitted();
      onClose();
    } catch (err) {
      toast({
        title: "خطأ",
        description: `فشل في ${isEdit ? 'تعديل' : 'إضافة'} تكوين السلة: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`,
        variant: "destructive",
      });
      console.error(`Failed to ${isEdit ? 'update' : 'add'} basket config:`, err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      {parentCategoryName && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">الفئة الرئيسية</Label>
          <Input value={parentCategoryName} readOnly className="col-span-3 font-semibold" />
        </div>
      )}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="supplierType" className="text-right">نوع المورد</Label>
        <Select onValueChange={(value: basket_supplier_type) => setSupplierType(value)} value={supplierType}>
          <SelectTrigger id="supplierType" className="col-span-3">
            <SelectValue placeholder="اختر نوع المورد" />
          </SelectTrigger>
          <SelectContent>
            {distinctSupplierTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="basketSize" className="text-right">حجم السلة</Label>
        <Select onValueChange={(value: basket_size) => setBasketSize(value)} value={basketSize}>
          <SelectTrigger id="basketSize" className="col-span-3">
            <SelectValue placeholder="اختر حجم السلة" />
          </SelectTrigger>
          <SelectContent>
            {distinctBasketSizes.map((size) => (
              <SelectItem key={size} value={size}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="basketEmptyWeight" className="text-right">الوزن الفارغ للسلة (كجم)</Label>
        <Input
          id="basketEmptyWeight"
          type="number"
          value={basketEmptyWeight ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setBasketEmptyWeight(val === '' ? null : (isNaN(parseFloat(val)) ? null : parseFloat(val)));
          }}
          className="col-span-3"
          min="0"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="maxNetWeight" className="text-right">الحد الأقصى للوزن الصافي (كجم)</Label>
        <Input
          id="maxNetWeight"
          type="number"
          value={maxNetWeight ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setMaxNetWeight(val === '' ? null : (isNaN(parseFloat(val)) ? null : parseFloat(val)));
          }}
          className="col-span-3"
          min="0"
          placeholder={mainCategoryConfig ? `الحد الأقصى المتاح: ${mainCategoryConfig.max_net_weight_kg - (mainCategoryConfig.allocated_net_weight_kg || 0)} كجم` : 'اختر نوع المورد وحجم السلة أولاً'}
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="maxVolume" className="text-right">الحد الأقصى للحجم (لتر)</Label>
        <Input
          id="maxVolume"
          type="number"
          value={maxVolume ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setMaxVolume(val === '' ? null : (isNaN(parseFloat(val)) ? null : parseFloat(val)));
          }}
          className="col-span-3"
          min="0"
          placeholder={mainCategoryConfig && mainCategoryConfig.max_volume_liters !== null ? `الحد الأقصى المتاح: ${mainCategoryConfig.max_volume_liters - (mainCategoryConfig.allocated_volume_liters || 0)} لتر` : 'اختياري'}
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="minFillPercentage" className="text-right">الحد الأدنى لنسبة الامتلاء (%)</Label>
        <Input
          id="minFillPercentage"
          type="number"
          value={minFillPercentage ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setMinFillPercentage(val === '' ? null : (isNaN(parseInt(val)) ? null : parseInt(val)));
          }}
          className="col-span-3"
          min="0"
          max="100"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="maxItemsCount" className="text-right">الحد الأقصى لعدد العناصر</Label>
        <Input
          id="maxItemsCount"
          type="number"
          value={maxItemsCount ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setMaxItemsCount(val === '' ? null : (isNaN(parseInt(val)) ? null : parseInt(val)));
          }}
          className="col-span-3"
          placeholder="اختياري"
          min="0"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="requiresSeparation" className="text-right">يتطلب فصل</Label>
        <Input
          id="requiresSeparation"
          type="checkbox"
          checked={requiresSeparation}
          onChange={(e) => setRequiresSeparation(e.target.checked)}
          className="col-span-3 w-4 h-4"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="specialHandlingNotes" className="text-right">ملاحظات خاصة</Label>
        <Input
          id="specialHandlingNotes"
          type="text"
          value={specialHandlingNotes ?? ''}
          onChange={(e) => setSpecialHandlingNotes(e.target.value)}
          className="col-span-3"
          placeholder="اختياري"
        />
      </div>
      <Button type="submit">
        {isEdit ? 'حفظ التعديلات' : 'إضافة تكوين'}
      </Button>
    </form>
  );
}; 