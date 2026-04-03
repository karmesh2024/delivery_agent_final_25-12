import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addCategoryBucketConfigThunk, fetchCategoryBucketConfigsThunk, updateCategoryBucketConfigThunk } from '@/domains/product-categories/store/productCategoriesSlice';
import { useToast } from '@/shared/ui/use-toast';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Checkbox } from '@/shared/ui/checkbox';
import { basket_supplier_type, basket_size, getAgentsForBasketConfig, AgentForBasket } from '@/domains/product-categories/api/basketConfigService';

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
  const [calcWidth, setCalcWidth] = useState<string>('');
  const [calcHeight, setCalcHeight] = useState<string>('');
  const [calcDepth, setCalcDepth] = useState<string>('');
  const [agentId, setAgentId] = useState<string | null>(initialConfig?.agent_id ?? null);
  const [agents, setAgents] = useState<AgentForBasket[]>([]);

  useEffect(() => {
    getAgentsForBasketConfig().then(setAgents).catch(() => setAgents([]));
  }, []);

  useEffect(() => {
    if (supplierType !== 'AUTHORIZED_AGENT') setAgentId(null);
  }, [supplierType]);

  const calcVolumeLiters =
    calcWidth && calcHeight && calcDepth &&
    !isNaN(parseFloat(calcWidth)) && !isNaN(parseFloat(calcHeight)) && !isNaN(parseFloat(calcDepth))
      ? (parseFloat(calcWidth) * parseFloat(calcHeight) * parseFloat(calcDepth)) / 1000
      : null;

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
            agent_id: supplierType === 'AUTHORIZED_AGENT' ? agentId : null,
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
          agent_id: supplierType === 'AUTHORIZED_AGENT' ? agentId : null,
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
      const errMsg = typeof err === 'string' ? err : (err as Error)?.message || error || 'خطأ غير معروف';
      toast({
        title: "خطأ",
        description: `فشل في ${isEdit ? 'تعديل' : 'إضافة'} تكوين سلة الفئة الرئيسية: ${errMsg}`,
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
      {supplierType === 'AUTHORIZED_AGENT' && (
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right pt-2">الوكلاء</Label>
          <div className="col-span-3 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">اختر الكل أو وكيلاً محدداً</p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agent-all"
                checked={agentId === null}
                onCheckedChange={(checked) => {
                  if (checked) setAgentId(null);
                }}
              />
              <Label htmlFor="agent-all" className="cursor-pointer font-medium text-base">
                الكل (لجميع الوكلاء)
              </Label>
            </div>
            {agents.map((a) => (
              <div key={a.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`agent-${a.id}`}
                  checked={agentId === a.id}
                  onCheckedChange={(checked) => {
                    if (checked) setAgentId(a.id);
                    else if (agentId === a.id) setAgentId(null);
                  }}
                />
                <Label htmlFor={`agent-${a.id}`} className="cursor-pointer flex-1">
                  {a.full_name || a.email || a.id}
                </Label>
              </div>
            ))}
            {agents.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">لا يوجد وكلاء مسجلين</p>
            )}
          </div>
        </div>
      )}
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
        <Label htmlFor="basketEmptyWeight" className="text-right">الوزن الفارغ للسلة (كجم / جرام)</Label>
        <div className="col-span-3 space-y-1">
          <Input
            id="basketEmptyWeight"
            type="number"
            min="0"
            step="0.001"
            value={basketEmptyWeight ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setBasketEmptyWeight(val === '' ? null : (isNaN(parseFloat(val)) ? null : parseFloat(val)));
            }}
            placeholder="مثال: 0.3 لـ 300 جرام، 1.2 لـ كيلو و200 جرام"
          />
          <p className="text-xs text-muted-foreground">يمكن إدخال الكسور: 0.3 = 300 جرام، 1.2 = كيلو و200 جرام</p>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="maxNetWeight" className="text-right">الحد الأقصى للوزن الصافي (كجم / جرام)</Label>
        <div className="col-span-3 space-y-1">
          <Input
            id="maxNetWeight"
            type="number"
            min="0"
            step="0.001"
            value={maxNetWeight ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setMaxNetWeight(val === '' ? null : (isNaN(parseFloat(val)) ? null : parseFloat(val)));
            }}
            placeholder="مثال: 0.3 لـ 300 جرام، 1.2 لـ كيلو و200 جرام"
          />
          <p className="text-xs text-muted-foreground">يمكن إدخال الكسور: 0.3 = 300 جرام، 1.2 = كيلو و200 جرام</p>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="maxVolume" className="text-right">الحد الأقصى للحجم (لتر)</Label>
        <div className="col-span-3 space-y-2">
          <Input
            id="maxVolume"
            type="number"
            min="0"
            step="0.001"
            value={maxVolume ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setMaxVolume(val === '' ? null : (isNaN(parseFloat(val)) ? null : parseFloat(val)));
            }}
            placeholder="اختياري"
          />
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">حاسبة الحجم من أبعاد الكيس (سم)</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">العرض (سم)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={calcWidth}
                  onChange={(e) => setCalcWidth(e.target.value)}
                  placeholder="50"
                />
              </div>
              <div>
                <Label className="text-xs">الارتفاع (سم)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={calcHeight}
                  onChange={(e) => setCalcHeight(e.target.value)}
                  placeholder="150"
                />
              </div>
              <div>
                <Label className="text-xs">العمق (سم)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={calcDepth}
                  onChange={(e) => setCalcDepth(e.target.value)}
                  placeholder="50"
                />
              </div>
            </div>
            {calcVolumeLiters != null && calcVolumeLiters > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-sm">
                  الحجم = <strong>{calcVolumeLiters.toFixed(2)}</strong> لتر،
                  السعة التقريبية ≈ <strong>{calcVolumeLiters.toFixed(2)}</strong> كجم (تقريباً — تختلف حسب المادة: بلاستيك مكرمش، كانز، حديد، إلخ)
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setMaxVolume(calcVolumeLiters)}
                >
                  استخدم هذا الحجم
                </Button>
              </div>
            )}
          </div>
        </div>
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
