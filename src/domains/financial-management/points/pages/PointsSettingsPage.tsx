'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchPointsConfigurations,
  createPointsConfiguration,
  updatePointsConfiguration,
  deletePointsConfiguration,
  fetchStorePointsConfigurations,
  createStorePointsConfiguration,
  updateStorePointsConfiguration,
  deleteStorePointsConfiguration,
} from '../store/pointsSlice';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  PointsConfigurationFormData,
  ProductInSubcategory,
  StorePointsConfigurationFormData,
} from '../types';
import { pointsService } from '../services/pointsService';
import { storePointsConfigService } from '../services/storePointsConfigService';
import { InfoTooltip } from '../components/InfoTooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Package, ShoppingBag } from 'lucide-react';

const defaultStoreFormData: StorePointsConfigurationFormData = {
  store_subcategory_id: '',
  store_product_id: null,
  points_per_kg: 0,
  points_per_kg_applies_to: 'both',
  price_per_kg: 0,
  point_value: 0,
  points_per_piece: 0,
  point_value_per_piece: 0,
  points_strategy: 'WEIGHT_BASED',
  is_active: true,
  min_weight: 0,
  max_weight: 999.99,
  bonus_multiplier: 1.0,
  description: '',
  effective_from: null,
  effective_to: null,
};

export default function PointsSettingsPage() {
  const dispatch = useAppDispatch();
  const { configurations, storeConfigurations, loading, loadingStore, error } = useAppSelector(
    (state) => state.points
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; category_name?: string }>>([]);
  const [productsInSubcategory, setProductsInSubcategory] = useState<ProductInSubcategory[]>([]);
  const [formData, setFormData] = useState<PointsConfigurationFormData>({
    subcategory_id: '',
    product_id: null,
    points_per_kg: 0,
    points_per_kg_applies_to: 'both',
    price_per_kg: 0,
    point_value: 0,
    points_per_piece: 0,
    point_value_per_piece: 0,
    points_strategy: 'WEIGHT_BASED',
    is_active: true,
    min_weight: 0,
    max_weight: 999.99,
    bonus_multiplier: 1.0,
    description: '',
    effective_from: null,
    effective_to: null,
  });

  // Store tab state
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);
  const [storeEditingId, setStoreEditingId] = useState<string | null>(null);
  const [storeSubcategories, setStoreSubcategories] = useState<
    Array<{ id: string; name_ar: string; main_category_name?: string }>
  >([]);
  const [storeProducts, setStoreProducts] = useState<Array<{ id: string; name_ar: string }>>([]);
  const [storeFormData, setStoreFormData] = useState<StorePointsConfigurationFormData>(defaultStoreFormData);

  useEffect(() => {
    dispatch(fetchPointsConfigurations());
    dispatch(fetchStorePointsConfigurations());
    loadSubcategories();
    loadStoreSubcategories();
  }, [dispatch]);

  const loadSubcategories = async () => {
    try {
      const data = await pointsService.getSubcategories();
      setSubcategories(data);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const loadProductsBySubcategory = async (subcategoryId: string) => {
    if (!subcategoryId) {
      setProductsInSubcategory([]);
      return;
    }
    try {
      const data = await pointsService.getProductsBySubcategory(subcategoryId);
      setProductsInSubcategory(data);
    } catch (error) {
      console.error('Error loading products:', error);
      setProductsInSubcategory([]);
    }
  };

  const loadStoreSubcategories = async () => {
    try {
      const data = await storePointsConfigService.getStoreSubcategories();
      setStoreSubcategories(data);
    } catch (err) {
      console.error('Error loading store subcategories:', err);
    }
  };

  const loadStoreProductsBySubcategory = async (storeSubcategoryId: string) => {
    if (!storeSubcategoryId) {
      setStoreProducts([]);
      return;
    }
    try {
      const data = await storePointsConfigService.getStoreProductsBySubcategory(storeSubcategoryId);
      setStoreProducts(data);
    } catch (err) {
      console.error('Error loading store products:', err);
      setStoreProducts([]);
    }
  };

  const handleOpenStoreDialog = (config?: any) => {
    if (config) {
      setStoreEditingId(config.id);
      setStoreFormData({
        store_subcategory_id: config.store_subcategory_id,
        store_product_id: config.store_product_id ?? null,
        points_per_kg: config.points_per_kg ?? 0,
        points_per_kg_applies_to: config.points_per_kg_applies_to || 'both',
        price_per_kg: Number(config.price_per_kg ?? 0),
        point_value: Number(config.point_value ?? 0),
        points_per_piece: config.points_per_piece ?? 0,
        point_value_per_piece: Number(config.point_value_per_piece) ?? 0,
        points_strategy: (config.points_strategy as StorePointsConfigurationFormData['points_strategy']) || 'WEIGHT_BASED',
        is_active: config.is_active ?? true,
        min_weight: config.min_weight ?? 0,
        max_weight: config.max_weight ?? 999.99,
        bonus_multiplier: config.bonus_multiplier ?? 1.0,
        description: config.description ?? '',
        effective_from: config.effective_from ?? null,
        effective_to: config.effective_to ?? null,
      });
      loadStoreProductsBySubcategory(config.store_subcategory_id);
    } else {
      setStoreEditingId(null);
      setStoreFormData(defaultStoreFormData);
      setStoreProducts([]);
    }
    setStoreDialogOpen(true);
  };

  const handleCloseStoreDialog = () => {
    setStoreDialogOpen(false);
    setStoreEditingId(null);
  };

  const handleStoreSubmit = async () => {
    try {
      const payload = {
        ...storeFormData,
        store_product_id: storeFormData.store_product_id || null,
      };
      if (storeEditingId) {
        await dispatch(updateStorePointsConfiguration({ id: storeEditingId, config: payload })).unwrap();
        toast.success('تم تحديث إعدادات نقاط المتجر بنجاح');
      } else {
        await dispatch(createStorePointsConfiguration(payload)).unwrap();
        toast.success('تم إنشاء إعدادات نقاط المتجر بنجاح');
      }
      handleCloseStoreDialog();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleStoreDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف إعدادات نقاط المتجر هذه؟')) return;
    try {
      await dispatch(deleteStorePointsConfiguration(id)).unwrap();
      toast.success('تم حذف إعدادات نقاط المتجر بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحذف');
    }
  };

  const handleOpenDialog = (config?: any) => {
    if (config) {
      setEditingId(config.id);
      setFormData({
        subcategory_id: config.subcategory_id,
        product_id: config.product_id ?? null,
        points_per_kg: config.points_per_kg,
        points_per_kg_applies_to: config.points_per_kg_applies_to || 'both',
        price_per_kg: Number(config.price_per_kg),
        point_value: Number(config.point_value),
        points_per_piece: config.points_per_piece || 0,
        point_value_per_piece: Number(config.point_value_per_piece) || 0,
        points_strategy: (config.points_strategy as PointsConfigurationFormData['points_strategy']) || 'WEIGHT_BASED',
        is_active: config.is_active,
        min_weight: config.min_weight || 0,
        max_weight: config.max_weight || 999.99,
        bonus_multiplier: config.bonus_multiplier || 1.0,
        description: config.description || '',
        effective_from: config.effective_from || null,
        effective_to: config.effective_to || null,
      });
      loadProductsBySubcategory(config.subcategory_id);
    } else {
      setEditingId(null);
      setFormData({
        subcategory_id: '',
        product_id: null,
        points_per_kg: 0,
        points_per_kg_applies_to: 'both',
        price_per_kg: 0,
        point_value: 0,
        points_per_piece: 0,
        point_value_per_piece: 0,
        points_strategy: 'WEIGHT_BASED',
        is_active: true,
        min_weight: 0,
        max_weight: 999.99,
        bonus_multiplier: 1.0,
        description: '',
        effective_from: null,
        effective_to: null,
      });
      setProductsInSubcategory([]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const strategy = formData.points_strategy || 'WEIGHT_BASED';
    const selectedProductMeta = formData.product_id
      ? productsInSubcategory.find((p) => p.id === formData.product_id)
      : undefined;

    const hasPiecePoints = (formData.points_per_piece || 0) > 0;
    const effectiveAppliesTo = formData.points_per_kg_applies_to || 'both';
    const hasKgPointsForCustomers =
      (formData.points_per_kg || 0) > 0 &&
      (effectiveAppliesTo === 'customers_only' || effectiveAppliesTo === 'both');

    // عند "بدون نقاط" أو "مكافآت فقط" لا يلزم تعبئة النقاط/التسعير
    if (strategy === 'NO_POINTS' || strategy === 'BONUS_ONLY') {
      // لا تحقق من جمع وزن+قطعة؛ يُقبل الحفظ كما هو
    } else {
      // قاعدة 1: عند WEIGHT_BASED أو PIECE_BASED لا يجوز الجمع بين نقاط/كجم ونقاط/قطعة للمستخدمين
      if (strategy !== 'HYBRID' && hasPiecePoints && hasKgPointsForCustomers) {
        toast.error(
          'عند الإستراتيجية "حسب الوزن" أو "حسب القطعة" لا يمكن منح المستخدم نقاطاً على الكيلو والقطعة معاً. اختر "هجين" إن أردت الجمع بينهما.',
        );
        return;
      }

      // قاعدة 2: إن كان المنتج مضبوطاً كنظام نقاط بالقطعة للمستخدم → لا يسمح بنقاط/كجم للمستخدم (ما عدا هجين)
      if (
        strategy !== 'HYBRID' &&
        selectedProductMeta?.points_mode === 'per_piece' &&
        hasKgPointsForCustomers
      ) {
        toast.error(
          'هذا المنتج محدد كنظام نقاط بالقطعة للمستخدمين، لذلك لا يمكن تعيين نقاط لكل كيلوجرام للمستخدمين في هذا الإعداد (أو اختر إستراتيجية هجين).',
        );
        return;
      }

      // قاعدة 3: إن كان المنتج مضبوطاً كنظام نقاط بالكيلوجرام للمستخدم → لا يسمح بنقاط/قطعة (ما عدا هجين)
      if (
        strategy !== 'HYBRID' &&
        selectedProductMeta?.points_mode === 'per_kg' &&
        hasPiecePoints
      ) {
        toast.error(
          'هذا المنتج محدد كنظام نقاط بالكيلوجرام للمستخدمين، لذلك لا يمكن تعيين نقاط لكل قطعة لهذا المنتج (أو اختر إستراتيجية هجين).',
        );
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        product_id: formData.product_id || null,
      };
      if (editingId) {
        await dispatch(updatePointsConfiguration({ id: editingId, config: payload })).unwrap();
        toast.success('تم تحديث إعدادات النقاط بنجاح');
      } else {
        await dispatch(createPointsConfiguration(payload)).unwrap();
        toast.success('تم إنشاء إعدادات النقاط بنجاح');
      }
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف إعدادات النقاط هذه؟')) return;

    try {
      await dispatch(deletePointsConfiguration(id)).unwrap();
      toast.success('تم حذف إعدادات النقاط بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء الحذف');
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">إعدادات النقاط</h1>
              <InfoTooltip
                content="هذه الصفحة تتيح لك إدارة إعدادات النقاط لكل فئة فرعية من المخلفات. يمكنك تحديد عدد النقاط الممنوحة لكل كيلوجرام، السعر، وقيمة النقطة المالية. هذه الإعدادات تحدد كيفية حساب النقاط للعملاء عند استلامهم للمخلفات."
                side="right"
              />
            </div>
            <p className="text-gray-600 mt-2">
              إدارة إعدادات النقاط للمخلفات وللمتجر — فئات ومنتجات متجر منفصلة دون تداخل
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Tabs defaultValue="waste" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="waste" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              المخلفات
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              المتجر
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waste" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة إعدادات (المخلفات)
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'تعديل إعدادات النقاط' : 'إضافة إعدادات جديدة'}
                </DialogTitle>
                <DialogDescription>
                  حدّد إن كان الإعداد للفئة الفرعية ككل أو لمنتج محدد تحتها، ثم قيم النقاط.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="subcategory_id">الفئة الفرعية *</Label>
                    <InfoTooltip
                      content="اختر الفئة الفرعية من المخلفات التي تريد إعداد النقاط لها."
                      side="right"
                    />
                  </div>
                  <select
                    id="subcategory_id"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={formData.subcategory_id}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setFormData({ ...formData, subcategory_id: sid, product_id: null });
                      loadProductsBySubcategory(sid);
                    }}
                    disabled={!!editingId}
                  >
                    <option value="">اختر الفئة الفرعية</option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} {sub.category_name ? `(${sub.category_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label>تطبيق الإعداد على</Label>
                    <InfoTooltip
                      content="الفئة الفرعية ككل: يُطبق على جميع المنتجات تحت هذه الفئة. منتج محدد: يُطبق على هذا المنتج فقط ويتجاوز إعداد الفئة."
                      side="right"
                    />
                  </div>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={!formData.product_id}
                        onChange={() => setFormData({ ...formData, product_id: null })}
                        className="rounded-full"
                      />
                      <span>الفئة الفرعية ككل</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="scope"
                        checked={!!formData.product_id}
                        onChange={() => {}}
                        className="rounded-full"
                      />
                      <span>منتج محدد</span>
                    </label>
                  </div>
                  {formData.subcategory_id && (
                    <select
                      className="w-full mt-2 px-3 py-2 border rounded-md"
                      value={formData.product_id ?? ''}
                      onChange={(e) => setFormData({ ...formData, product_id: e.target.value || null })}
                      disabled={!!editingId}
                    >
                      <option value="">— اختر المنتج (اختياري) —</option>
                      {productsInSubcategory.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                  {formData.subcategory_id && productsInSubcategory.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      لا توجد منتجات مرتبطة بهذه الفئة بعد. احفظ إعداد &quot;الفئة ككل&quot; أولاً ثم أضف إعدادات لمنتجات محددة لاحقاً.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="points_per_kg">النقاط لكل كيلوجرام *</Label>
                      <InfoTooltip
                        content="عدد النقاط التي سيحصل عليها المستخدم أو الوكيل لكل كيلوجرام من هذا النوع من المخلفات. مثال: إذا كان 10 نقاط/كجم، وقدم 5 كجم، سيحصل على 50 نقطة."
                        side="right"
                      />
                    </div>
                    <Input
                      id="points_per_kg"
                      type="number"
                      value={formData.points_per_kg}
                      onChange={(e) => setFormData({ ...formData, points_per_kg: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="price_per_kg">السعر لكل كيلوجرام (جنيه) *</Label>
                      <InfoTooltip
                        content="السعر الذي يدفعه النظام للعميل مقابل كل كيلوجرام من هذا النوع من المخلفات. هذا السعر يُستخدم لحساب المبلغ المالي المدفوع للعميل بالإضافة إلى النقاط."
                        side="right"
                      />
                    </div>
                    <Input
                      id="price_per_kg"
                      type="number"
                      step="0.01"
                      value={formData.price_per_kg}
                      onChange={(e) => setFormData({ ...formData, price_per_kg: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                {/* إستراتيجية النقاط */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="points_strategy">إستراتيجية النقاط</Label>
                      <InfoTooltip
                        content="حدد الطريقة العامة لحساب النقاط: حسب الوزن، حسب القطعة، هجين، مكافآت فقط، أو بدون نقاط (للتوثيق وتعطيل الإعداد مستقبلاً)."
                        side="right"
                      />
                    </div>
                    <select
                      id="points_strategy"
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.points_strategy || 'WEIGHT_BASED'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          points_strategy: e.target.value as PointsConfigurationFormData['points_strategy'],
                        }))
                      }
                    >
                      <option value="WEIGHT_BASED">WEIGHT_BASED (حسب الوزن)</option>
                      <option value="PIECE_BASED">PIECE_BASED (حسب القطعة)</option>
                      <option value="HYBRID">HYBRID (هجين وزن + قطعة)</option>
                      <option value="BONUS_ONLY">BONUS_ONLY (مكافآت فقط)</option>
                      <option value="NO_POINTS">NO_POINTS (بدون نقاط)</option>
                    </select>
                  </div>

                  {/* فترة الصلاحية */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="effective_from">ساري من</Label>
                      <Input
                        id="effective_from"
                        type="datetime-local"
                        value={formData.effective_from ? formData.effective_from.slice(0, 16) : ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            effective_from: e.target.value ? new Date(e.target.value).toISOString() : null,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="effective_to">ساري إلى (اختياري)</Label>
                      <Input
                        id="effective_to"
                        type="datetime-local"
                        value={formData.effective_to ? formData.effective_to.slice(0, 16) : ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            effective_to: e.target.value ? new Date(e.target.value).toISOString() : null,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <Label>تطبيق نقاط الكيلو جرام على</Label>
                    <InfoTooltip
                      content="حدد من يحصل على نقاط الكيلو جرام: الوكلاء فقط، المستخدمين فقط، أو الاثنين معاً."
                      side="right"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, points_per_kg_applies_to: 'agents_only' })}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.points_per_kg_applies_to === 'agents_only'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      الوكلاء فقط
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, points_per_kg_applies_to: 'both' })}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.points_per_kg_applies_to === 'both'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      الوكلاء والمستخدمين
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, points_per_kg_applies_to: 'customers_only' })}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.points_per_kg_applies_to === 'customers_only'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      المستخدمين فقط
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ملاحظة: نقاط القطعة (points_per_piece) للمستخدمين فقط دائماً
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="point_value">قيمة النقطة (جنيه) *</Label>
                    <InfoTooltip
                      content="القيمة المالية للنقطة الواحدة بالجنيه المصري. هذه القيمة تحدد كم يساوي كل نقطة من النقاط بالمال. مثال: إذا كانت قيمة النقطة 0.05 جنيه، فإن 100 نقطة = 5 جنيه. هذه القيمة تُستخدم لحساب القيمة المالية الإجمالية للنقاط المتراكمة للعميل."
                      side="right"
                    />
                  </div>
                  <Input
                    id="point_value"
                    type="number"
                    step="0.0001"
                    value={formData.point_value}
                    onChange={(e) => setFormData({ ...formData, point_value: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    القيمة المالية للنقطة الواحدة بالجنيه المصري
                  </p>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">نقاط القطعة (للمستخدمين فقط)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="points_per_piece">النقاط لكل قطعة</Label>
                        <InfoTooltip
                          content="عدد النقاط التي سيحصل عليها المستخدم لكل قطعة من هذا النوع من المخلفات. مثال: علبة وزنها 14 جرام = 3 نقاط. هذا النظام للمستخدمين فقط وليس للوكلاء."
                          side="right"
                        />
                      </div>
                      <Input
                        id="points_per_piece"
                        type="number"
                        value={formData.points_per_piece || 0}
                        onChange={(e) => setFormData({ ...formData, points_per_piece: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        مثال: علبة 14 جرام = 3 نقاط
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="point_value_per_piece">قيمة النقطة لكل قطعة (جنيه)</Label>
                        <InfoTooltip
                          content="القيمة المالية للنقطة الواحدة لكل قطعة بالجنيه المصري. يحددها المستخدم. تُستخدم لحساب القيمة المالية الإجمالية لنقاط القطعة."
                          side="right"
                        />
                      </div>
                      <Input
                        id="point_value_per_piece"
                        type="number"
                        step="0.0001"
                        value={formData.point_value_per_piece || 0}
                        onChange={(e) => setFormData({ ...formData, point_value_per_piece: parseFloat(e.target.value) || 0 })}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        القيمة المالية للنقطة لكل قطعة
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="min_weight">الحد الأدنى للوزن (كجم)</Label>
                      <InfoTooltip
                        content="الحد الأدنى من الوزن بالكيلوجرام الذي يجب أن يقدمه العميل ليحصل على النقاط. إذا كان الوزن أقل من هذا الحد، قد لا يحصل العميل على النقاط أو يحصل على نقاط مخفضة."
                        side="right"
                      />
                    </div>
                    <Input
                      id="min_weight"
                      type="number"
                      step="0.01"
                      value={formData.min_weight || 0}
                      onChange={(e) => setFormData({ ...formData, min_weight: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="max_weight">الحد الأقصى للوزن (كجم)</Label>
                      <InfoTooltip
                        content="الحد الأقصى من الوزن بالكيلوجرام الذي يمكن للعميل تقديمه في عملية واحدة. إذا تجاوز الوزن هذا الحد، قد يتم تطبيق قواعد خاصة أو تقسيم الكمية على عمليات متعددة."
                        side="right"
                      />
                    </div>
                    <Input
                      id="max_weight"
                      type="number"
                      step="0.01"
                      value={formData.max_weight || 999.99}
                      onChange={(e) => setFormData({ ...formData, max_weight: parseFloat(e.target.value) || 999.99 })}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="bonus_multiplier">مضاعف المكافأة</Label>
                    <InfoTooltip
                      content="مضاعف إضافي يُطبق على النقاط المحسوبة. مثال: إذا كانت النقاط الأساسية 100 نقطة والمضاعف 1.5، سيحصل العميل على 150 نقطة (100 × 1.5). يمكن استخدامه لتشجيع العملاء في فترات معينة أو لأنواع معينة من المخلفات. القيمة الافتراضية هي 1.0 (لا يوجد مكافأة إضافية)."
                      side="right"
                    />
                  </div>
                  <Input
                    id="bonus_multiplier"
                    type="number"
                    step="0.01"
                    value={formData.bonus_multiplier || 1.0}
                    onChange={(e) => setFormData({ ...formData, bonus_multiplier: parseFloat(e.target.value) || 1.0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    مضاعف إضافي للنقاط (مثال: 1.5 = 50% مكافأة إضافية)
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="description">الوصف</Label>
                    <InfoTooltip
                      content="وصف إضافي أو ملاحظات حول إعدادات النقاط هذه. يمكن استخدامه لتوثيق سبب اختيار هذه القيم أو أي معلومات إضافية مهمة."
                      side="right"
                    />
                  </div>
                  <textarea
                    id="description"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="is_active">نشط</Label>
                    <InfoTooltip
                      content="عند تفعيل هذا الخيار، سيتم استخدام إعدادات النقاط هذه في حساب النقاط للعملاء. عند إلغاء التفعيل، لن يتم استخدام هذه الإعدادات حتى يتم إعادة تفعيلها."
                      side="right"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  <X className="ml-2 h-4 w-4" />
                  إلغاء
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ
                </Button>
              </DialogFooter>
            </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>قائمة إعدادات النقاط (المخلفات)</CardTitle>
              <InfoTooltip
                content="هذه القائمة تعرض جميع إعدادات النقاط المكونة في النظام. يمكنك تعديل أو حذف أي إعدادات من هنا. كل صف يمثل إعدادات نقاط لفئة فرعية معينة."
                side="right"
              />
            </div>
            <CardDescription>
                إعدادات النقاط لفئات المخلفات الفرعية والمنتجات
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : configurations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد إعدادات نقاط حالياً
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        الفئة الفرعية
                        <InfoTooltip content="اسم الفئة الفرعية من المخلفات" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        تطبيق على
                        <InfoTooltip content="الفئة ككل أو منتج محدد تحت الفئة" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        الإستراتيجية
                        <InfoTooltip content="نوع إستراتيجية النقاط (وزن، قطعة، هجين، مكافآت فقط، بدون نقاط)" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        النقاط/كجم
                        <InfoTooltip content="عدد النقاط الممنوحة لكل كيلوجرام" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        تطبيق نقاط/كجم على
                        <InfoTooltip content="من يحصل على نقاط الكيلو جرام: الوكلاء فقط، المستخدمين فقط، أو الاثنين" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        السعر/كجم
                        <InfoTooltip content="السعر المدفوع لكل كيلوجرام بالجنيه" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        قيمة النقطة
                        <InfoTooltip content="القيمة المالية للنقطة الواحدة بالجنيه" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        النقاط/قطعة
                        <InfoTooltip content="عدد النقاط لكل قطعة (للمستخدمين فقط)" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        الحد الأدنى
                        <InfoTooltip content="الحد الأدنى للوزن بالكيلوجرام" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        الحد الأقصى
                        <InfoTooltip content="الحد الأقصى للوزن بالكيلوجرام" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        المضاعف
                        <InfoTooltip content="مضاعف المكافأة الإضافية" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        الحالة
                        <InfoTooltip content="حالة الإعدادات (نشط/غير نشط)" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurations.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{config.subcategory_name || 'غير محدد'}</div>
                          {config.category_name && (
                            <div className="text-xs text-gray-500">{config.category_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {config.product_id ? (
                          <span className="text-blue-700" title="منتج محدد">{config.product_name || config.product_id}</span>
                        ) : (
                          <span className="text-gray-600">الفئة الفرعية ككل</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {config.points_strategy || 'WEIGHT_BASED'}
                        </Badge>
                      </TableCell>
                      <TableCell>{config.points_per_kg} نقطة</TableCell>
                      <TableCell>
                        {config.points_per_kg_applies_to === 'agents_only' && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                            الوكلاء فقط
                          </Badge>
                        )}
                        {config.points_per_kg_applies_to === 'customers_only' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            المستخدمين فقط
                          </Badge>
                        )}
                        {(config.points_per_kg_applies_to === 'both' || !config.points_per_kg_applies_to) && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            الوكلاء والمستخدمين
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{Number(config.price_per_kg).toFixed(2)} ج.م</TableCell>
                      <TableCell>{Number(config.point_value).toFixed(4)} ج.م</TableCell>
                      <TableCell>
                        {config.points_per_piece ? `${config.points_per_piece} نقطة` : '-'}
                      </TableCell>
                      <TableCell>{config.min_weight || 0} كجم</TableCell>
                      <TableCell>{config.max_weight || 999.99} كجم</TableCell>
                      <TableCell>{Number(config.bonus_multiplier || 1.0).toFixed(2)}x</TableCell>
                      <TableCell>
                        <Badge variant={config.is_active ? 'default' : 'secondary'}>
                          {config.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(config)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(config.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="store" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={storeDialogOpen} onOpenChange={setStoreDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenStoreDialog()}>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة إعدادات (المتجر)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-90vh overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {storeEditingId ? 'تعديل إعدادات نقاط المتجر' : 'إضافة إعدادات نقاط المتجر'}
                    </DialogTitle>
                    <DialogDescription>
                      إعدادات النقاط والتسعير لفئات المتجر الفرعية أو لمنتج محدد — منفصلة عن إعدادات المخلفات.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>الفئة الفرعية (المتجر) *</Label>
                      <select
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        value={storeFormData.store_subcategory_id}
                        onChange={(e) => {
                          const sid = e.target.value;
                          setStoreFormData({ ...storeFormData, store_subcategory_id: sid, store_product_id: null });
                          loadStoreProductsBySubcategory(sid);
                        }}
                        disabled={!!storeEditingId}
                      >
                        <option value="">اختر الفئة الفرعية للمتجر</option>
                        {storeSubcategories.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name_ar} {s.main_category_name ? `(${s.main_category_name})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>تطبيق الإعداد على</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="store-scope"
                            checked={!storeFormData.store_product_id}
                            onChange={() => setStoreFormData({ ...storeFormData, store_product_id: null })}
                            className="rounded-full"
                          />
                          <span>الفئة الفرعية ككل</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="store-scope"
                            checked={!!storeFormData.store_product_id}
                            onChange={() => {}}
                            className="rounded-full"
                          />
                          <span>منتج محدد</span>
                        </label>
                      </div>
                      {storeFormData.store_subcategory_id && (
                        <select
                          className="w-full mt-2 px-3 py-2 border rounded-md"
                          value={storeFormData.store_product_id ?? ''}
                          onChange={(e) =>
                            setStoreFormData({ ...storeFormData, store_product_id: e.target.value || null })
                          }
                          disabled={!!storeEditingId}
                        >
                          <option value="">— اختر المنتج (اختياري) —</option>
                          {storeProducts.map((p) => (
                            <option key={p.id} value={p.id}>{p.name_ar}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>النقاط لكل كيلوجرام</Label>
                        <Input
                          type="number"
                          value={storeFormData.points_per_kg}
                          onChange={(e) =>
                            setStoreFormData({ ...storeFormData, points_per_kg: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div>
                        <Label>السعر لكل كيلوجرام (جنيه)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={storeFormData.price_per_kg}
                          onChange={(e) =>
                            setStoreFormData({ ...storeFormData, price_per_kg: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label>إستراتيجية النقاط</Label>
                      <select
                        className="w-full mt-1 rounded-md border px-3 py-2"
                        value={storeFormData.points_strategy || 'WEIGHT_BASED'}
                        onChange={(e) =>
                          setStoreFormData((prev) => ({
                            ...prev,
                            points_strategy: e.target.value as StorePointsConfigurationFormData['points_strategy'],
                          }))
                        }
                      >
                        <option value="WEIGHT_BASED">WEIGHT_BASED (حسب الوزن)</option>
                        <option value="PIECE_BASED">PIECE_BASED (حسب القطعة)</option>
                        <option value="HYBRID">HYBRID (هجين)</option>
                        <option value="BONUS_ONLY">BONUS_ONLY (مكافآت فقط)</option>
                        <option value="NO_POINTS">NO_POINTS (بدون نقاط)</option>
                      </select>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <Label className="mb-2 block">تطبيق نقاط الكيلو على (المتجر)</Label>
                      <p className="text-xs text-gray-500 mb-2">
                        حدد من يحصل على نقاط المتجر: الوكلاء، المستخدمين (العملاء)، أو كلاهما. (تجار الجملة يمكن إضافتهم لاحقاً إذا لزم.)
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setStoreFormData({ ...storeFormData, points_per_kg_applies_to: 'agents_only' })}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            storeFormData.points_per_kg_applies_to === 'agents_only'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          الوكلاء فقط
                        </button>
                        <button
                          type="button"
                          onClick={() => setStoreFormData({ ...storeFormData, points_per_kg_applies_to: 'both' })}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            storeFormData.points_per_kg_applies_to === 'both'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          الوكلاء والمستخدمين
                        </button>
                        <button
                          type="button"
                          onClick={() => setStoreFormData({ ...storeFormData, points_per_kg_applies_to: 'customers_only' })}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            storeFormData.points_per_kg_applies_to === 'customers_only'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          المستخدمين فقط
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label>قيمة النقطة (جنيه)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={storeFormData.point_value}
                        onChange={(e) =>
                          setStoreFormData({ ...storeFormData, point_value: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="store-bonus_multiplier">مضاعف المكافأة</Label>
                      <Input
                        id="store-bonus_multiplier"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={storeFormData.bonus_multiplier ?? 1}
                        onChange={(e) =>
                          setStoreFormData({ ...storeFormData, bonus_multiplier: parseFloat(e.target.value) || 1 })
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        مضاعف إضافي للنقاط (مثال: 1.5 = 50% مكافأة إضافية)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="store-description">الوصف</Label>
                      <textarea
                        id="store-description"
                        className="w-full mt-1 px-3 py-2 border rounded-md min-h-[80px]"
                        rows={3}
                        value={storeFormData.description ?? ''}
                        onChange={(e) => setStoreFormData({ ...storeFormData, description: e.target.value || null })}
                        placeholder="ملاحظات أو وصف لهذا الإعداد (اختياري)"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="store-is_active"
                        checked={storeFormData.is_active}
                        onChange={(e) =>
                          setStoreFormData({ ...storeFormData, is_active: e.target.checked })
                        }
                        className="rounded"
                      />
                      <Label htmlFor="store-is_active">نشط</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseStoreDialog}>
                      <X className="ml-2 h-4 w-4" />
                      إلغاء
                    </Button>
                    <Button onClick={handleStoreSubmit} disabled={loadingStore}>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>قائمة إعدادات النقاط (المتجر)</CardTitle>
                <CardDescription>
                  إعدادات النقاط والتسعير لفئات ومنتجات المتجر فقط — لا تتداخل مع إعدادات المخلفات.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStore ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : storeConfigurations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">لا توجد إعدادات نقاط للمتجر حالياً</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الفئة الفرعية (المتجر)</TableHead>
                        <TableHead>تطبيق على</TableHead>
                        <TableHead>الإستراتيجية</TableHead>
                        <TableHead>تطبيق نقاط/كجم على</TableHead>
                        <TableHead>النقاط/كجم</TableHead>
                        <TableHead>السعر/كجم</TableHead>
                        <TableHead>قيمة النقطة</TableHead>
                        <TableHead>المضاعف</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storeConfigurations.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{config.store_subcategory_name || '—'}</div>
                              {config.store_main_category_name && (
                                <div className="text-xs text-gray-500">{config.store_main_category_name}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {config.store_product_id ? (
                              <span className="text-blue-700">{config.store_product_name || config.store_product_id}</span>
                            ) : (
                              <span className="text-gray-600">الفئة الفرعية ككل</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{config.points_strategy || 'WEIGHT_BASED'}</Badge>
                          </TableCell>
                          <TableCell>
                            {config.points_per_kg_applies_to === 'agents_only' && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                الوكلاء فقط
                              </Badge>
                            )}
                            {config.points_per_kg_applies_to === 'customers_only' && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                المستخدمين فقط
                              </Badge>
                            )}
                            {(config.points_per_kg_applies_to === 'both' || !config.points_per_kg_applies_to) && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                الوكلاء والمستخدمين
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{config.points_per_kg} نقطة</TableCell>
                          <TableCell>{Number(config.price_per_kg).toFixed(2)} ج.م</TableCell>
                          <TableCell>{Number(config.point_value).toFixed(4)} ج.م</TableCell>
                          <TableCell>{Number(config.bonus_multiplier ?? 1).toFixed(2)}x</TableCell>
                          <TableCell>
                            <Badge variant={config.is_active ? 'default' : 'secondary'}>
                              {config.is_active ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenStoreDialog(config)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleStoreDelete(config.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
