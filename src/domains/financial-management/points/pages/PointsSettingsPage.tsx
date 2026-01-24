'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchPointsConfigurations,
  createPointsConfiguration,
  updatePointsConfiguration,
  deletePointsConfiguration,
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
import { PointsConfigurationFormData } from '../types';
import { pointsService } from '../services/pointsService';
import { InfoTooltip } from '../components/InfoTooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

export default function PointsSettingsPage() {
  const dispatch = useAppDispatch();
  const { configurations, loading, error } = useAppSelector((state) => state.points);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Array<{ id: string; name: string; category_name?: string }>>([]);
  const [formData, setFormData] = useState<PointsConfigurationFormData>({
    subcategory_id: '',
    points_per_kg: 0,
    price_per_kg: 0,
    point_value: 0,
    is_active: true,
    min_weight: 0,
    max_weight: 999.99,
    bonus_multiplier: 1.0,
    description: '',
  });

  useEffect(() => {
    dispatch(fetchPointsConfigurations());
    loadSubcategories();
  }, [dispatch]);

  const loadSubcategories = async () => {
    try {
      const data = await pointsService.getSubcategories();
      setSubcategories(data);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    }
  };

  const handleOpenDialog = (config?: any) => {
    if (config) {
      setEditingId(config.id);
      setFormData({
        subcategory_id: config.subcategory_id,
        points_per_kg: config.points_per_kg,
        price_per_kg: Number(config.price_per_kg),
        point_value: Number(config.point_value),
        is_active: config.is_active,
        min_weight: config.min_weight || 0,
        max_weight: config.max_weight || 999.99,
        bonus_multiplier: config.bonus_multiplier || 1.0,
        description: config.description || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        subcategory_id: '',
        points_per_kg: 0,
        price_per_kg: 0,
        point_value: 0,
        is_active: true,
        min_weight: 0,
        max_weight: 999.99,
        bonus_multiplier: 1.0,
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await dispatch(updatePointsConfiguration({ id: editingId, config: formData })).unwrap();
        toast.success('تم تحديث إعدادات النقاط بنجاح');
      } else {
        await dispatch(createPointsConfiguration(formData)).unwrap();
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
              إدارة إعدادات النقاط لكل فئة فرعية من المخلفات
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة إعدادات جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'تعديل إعدادات النقاط' : 'إضافة إعدادات جديدة'}
                </DialogTitle>
                <DialogDescription>
                  قم بتحديد إعدادات النقاط للفئة الفرعية المحددة
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="subcategory_id">الفئة الفرعية *</Label>
                    <InfoTooltip
                      content="اختر الفئة الفرعية من المخلفات التي تريد إعداد النقاط لها. كل فئة فرعية يمكن أن يكون لها إعدادات نقاط مختلفة بناءً على قيمتها في السوق."
                      side="right"
                    />
                  </div>
                  <select
                    id="subcategory_id"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    value={formData.subcategory_id}
                    onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="points_per_kg">النقاط لكل كيلوجرام *</Label>
                      <InfoTooltip
                        content="عدد النقاط التي سيحصل عليها العميل لكل كيلوجرام من هذا النوع من المخلفات. مثال: إذا كان 10 نقاط/كجم، وقدم العميل 5 كجم، سيحصل على 50 نقطة."
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>قائمة إعدادات النقاط</CardTitle>
              <InfoTooltip
                content="هذه القائمة تعرض جميع إعدادات النقاط المكونة في النظام. يمكنك تعديل أو حذف أي إعدادات من هنا. كل صف يمثل إعدادات نقاط لفئة فرعية معينة."
                side="right"
              />
            </div>
            <CardDescription>
              جميع إعدادات النقاط المكونة للنظام
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
                        النقاط/كجم
                        <InfoTooltip content="عدد النقاط الممنوحة لكل كيلوجرام" side="top" />
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
                      <TableCell>{config.points_per_kg} نقطة</TableCell>
                      <TableCell>{Number(config.price_per_kg).toFixed(2)} ج.م</TableCell>
                      <TableCell>{Number(config.point_value).toFixed(4)} ج.م</TableCell>
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
      </div>
    </TooltipProvider>
  );
}
