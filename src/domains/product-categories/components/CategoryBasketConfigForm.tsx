import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addCategoryBucketConfigThunk, fetchCategoryBucketConfigsThunk, updateCategoryBucketConfigThunk } from '@/domains/product-categories/store/productCategoriesSlice';
import { useToast } from '@/shared/ui/use-toast';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { basket_supplier_type, basket_size } from '@/domains/product-categories/api/basketConfigService';

interface CategoryBasketConfigFormProps {
  categoryId: string;
  onClose: () => void;
  initialConfig?: Partial<import('@/domains/product-categories/api/basketConfigService').CategoryBucketConfig>;
  isEdit?: boolean;
}

export const CategoryBasketConfigForm: React.FC<CategoryBasketConfigFormProps> = ({ categoryId, onClose, initialConfig, isEdit }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { loading, error } = useAppSelector(state => state.productCategories.categoryBucketConfigs);

  const [supplierType, setSupplierType] = useState<basket_supplier_type | ''>(initialConfig?.supplier_type || '');
  const [basketSize, setBasketSize] = useState<basket_size | ''>(initialConfig?.basket_size || '');
  const [basketEmptyWeight, setBasketEmptyWeight] = useState<number | null>(initialConfig?.basket_empty_weight_kg ?? null);
  const [maxNetWeight, setMaxNetWeight] = useState<number | null>(initialConfig?.max_net_weight_kg ?? null);
  const [maxVolume, setMaxVolume] = useState<number | null>(initialConfig?.max_volume_liters ?? null);
  const [minFillPercentage, setMinFillPercentage] = useState<number | null>(initialConfig?.min_fill_percentage ?? null);
  const [description, setDescription] = useState<string | null>(initialConfig?.description ?? null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierType || !basketSize || basketEmptyWeight === null || maxNetWeight === null || minFillPercentage === null) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع الحقول المطلوبة (باستثناء الحجم الأقصى والوصف).",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEdit && initialConfig?.id) {
        await dispatch(updateCategoryBucketConfigThunk({
          id: initialConfig.id,
          config: {
            supplier_type: supplierType as basket_supplier_type,
            basket_size: basketSize as basket_size,
            basket_empty_weight_kg: basketEmptyWeight,
            max_net_weight_kg: maxNetWeight,
            max_volume_liters: maxVolume,
            min_fill_percentage: minFillPercentage,
            description: description,
            is_active: true,
            category_id: categoryId,
          }
        })).unwrap();
        toast({ title: "تم التعديل", description: "تم تعديل التكوين بنجاح." });
      } else {
        await dispatch(addCategoryBucketConfigThunk({
          supplier_type: supplierType as basket_supplier_type,
          basket_size: basketSize as basket_size,
          basket_empty_weight_kg: basketEmptyWeight,
          max_net_weight_kg: maxNetWeight,
          max_volume_liters: maxVolume,
          min_fill_percentage: minFillPercentage,
          description: description,
          is_active: true,
          category_id: categoryId,
          allocated_net_weight_kg: 0,
          allocated_volume_liters: null,
        })).unwrap();
        toast({ title: "تم بنجاح", description: "تم إضافة تكوين سلة الفئة الرئيسية بنجاح." });
      }
      dispatch(fetchCategoryBucketConfigsThunk());
      onClose();
    } catch (err) {
      toast({
        title: "خطأ",
        description: `فشل في ${isEdit ? 'تعديل' : 'إضافة'} تكوين سلة الفئة الرئيسية: ${error || 'خطأ غير معروف'}`,
        variant: "destructive",
      });
      console.error(`Failed to ${isEdit ? 'update' : 'add'} category basket config:`, err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="supplierType" className="text-right">نوع المورد</Label>
        <Select onValueChange={(value: basket_supplier_type) => setSupplierType(value)} value={supplierType}>
          <SelectTrigger id="supplierType" className="col-span-3">
            <SelectValue placeholder="اختر نوع المورد" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AUTHORIZED_AGENT">وكيل معتمد</SelectItem>
            <SelectItem value="HOME_CLIENT">عميل منزلي</SelectItem>
            <SelectItem value="SCHOOL">مدرسة</SelectItem>
            <SelectItem value="RESTAURANT">مطعم</SelectItem>
            <SelectItem value="OFFICE">مكتب</SelectItem>
            <SelectItem value="OTHER">أخرى</SelectItem>
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
            <SelectItem value="SMALL">صغير</SelectItem>
            <SelectItem value="MEDIUM">متوسط</SelectItem>
            <SelectItem value="LARGE">كبير</SelectItem>
            <SelectItem value="EXTRA_LARGE">كبير جداً</SelectItem>
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
          placeholder="اختياري"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="minFillPercentage" className="text-right">الحد الأدنى لنسبة التعبئة (%)</Label>
        <Input
          id="minFillPercentage"
          type="number"
          value={minFillPercentage ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setMinFillPercentage(val === '' ? null : (isNaN(parseInt(val, 10)) ? null : parseInt(val, 10)));
          }}
          className="col-span-3"
          min="0"
          max="100"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">الوصف</Label>
        <Input
          id="description"
          type="text"
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value === '' ? null : e.target.value)}
          className="col-span-3"
          placeholder="اختياري"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? (isEdit ? 'جاري التعديل...' : 'جاري الإضافة...') : (isEdit ? 'حفظ التعديلات' : 'إضافة تكوين')}
      </Button>
    </form>
  );
};
