'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPointsConfigurations } from '../store/pointsSlice';
import { pointsPricingService } from '../services/pointsPricingService';
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
import { Edit, Save, X, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import { PointsValueHistory } from '../types';
import { InfoTooltip } from '../components/InfoTooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

export default function PointsPricingPage() {
  const dispatch = useAppDispatch();
  const { configurations, loading } = useAppSelector((state) => state.points);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newValue, setNewValue] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [history, setHistory] = useState<PointsValueHistory[]>([]);
  const [averageValue, setAverageValue] = useState<number>(0);

  useEffect(() => {
    dispatch(fetchPointsConfigurations());
    loadHistory();
    loadAverageValue();
  }, [dispatch]);

  const loadHistory = async () => {
    try {
      const data = await pointsPricingService.getPointsValueHistory();
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadAverageValue = async () => {
    try {
      const avg = await pointsPricingService.getAveragePointValue();
      setAverageValue(avg);
    } catch (error) {
      console.error('Error loading average value:', error);
    }
  };

  const handleOpenEditDialog = (config: any) => {
    setEditingId(config.id);
    setNewValue(Number(config.point_value));
    setReason('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setNewValue(0);
    setReason('');
  };

  const handleUpdateValue = async () => {
    if (!editingId) return;

    try {
      await pointsPricingService.updatePointValue(editingId, newValue, reason);
      toast.success('تم تحديث قيمة النقطة بنجاح');
      dispatch(fetchPointsConfigurations());
      loadHistory();
      loadAverageValue();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء التحديث');
    }
  };

  const calculateFinancialValue = (points: number, pointValue: number) => {
    return pointsPricingService.calculateFinancialValue(points, pointValue);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">تسعير النقاط</h1>
            <InfoTooltip
              content="هذه الصفحة تتيح لك إدارة القيمة المالية للنقاط. يمكنك تحديث قيمة النقطة لكل فئة فرعية بناءً على ظروف السوق. يتم حفظ جميع التغييرات في سجل التاريخ للمراجعة لاحقاً."
              side="right"
            />
          </div>
          <p className="text-gray-600 mt-2">
            إدارة قيمة النقاط المالية وتحديثها
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="ml-2 h-4 w-4" />
                <span>متوسط قيمة النقطة</span>
                <InfoTooltip
                  content="متوسط القيمة المالية للنقطة عبر جميع إعدادات النقاط النشطة. يتم حسابه بقسمة مجموع قيم النقاط على عدد الإعدادات النشطة."
                  side="top"
                  className="mr-2"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averageValue.toFixed(4)} ج.م
              </div>
              <p className="text-xs text-gray-500 mt-1">
                عبر جميع الإعدادات النشطة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="ml-2 h-4 w-4" />
                <span>إجمالي القيمة المالية</span>
                <InfoTooltip
                  content="مجموع قيم النقاط لجميع الإعدادات النشطة. يمثل القيمة الإجمالية المالية للنقاط في النظام."
                  side="top"
                  className="mr-2"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {configurations
                  .filter(c => c.is_active)
                  .reduce((sum, c) => sum + Number(c.point_value), 0)
                  .toFixed(2)} ج.م
              </div>
              <p className="text-xs text-gray-500 mt-1">
                مجموع قيم النقاط
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                عدد الإعدادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {configurations.filter(c => c.is_active).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                إعدادات نشطة
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Points Configurations Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>قيمة النقاط لكل فئة فرعية</CardTitle>
                <InfoTooltip
                  content="هذه القائمة تعرض قيمة النقطة الحالية لكل فئة فرعية. يمكنك النقر على 'تعديل القيمة' لتحديث قيمة النقطة. يتم حفظ جميع التغييرات في سجل التاريخ."
                  side="right"
                />
              </div>
              <CardDescription>
                قم بتحديث قيمة النقطة لكل فئة فرعية
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
                        قيمة النقطة الحالية
                        <InfoTooltip content="القيمة المالية الحالية للنقطة الواحدة بالجنيه المصري" side="top" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        القيمة المالية (1000 نقطة)
                        <InfoTooltip content="القيمة المالية لـ 1000 نقطة بناءً على قيمة النقطة الحالية. يساعد في فهم القيمة الإجمالية للنقاط." side="top" />
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
                      <TableCell className="font-semibold">
                        {Number(config.point_value).toFixed(4)} ج.م
                      </TableCell>
                      <TableCell>
                        {calculateFinancialValue(1000, Number(config.point_value)).toFixed(2)} ج.م
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(config)}
                        >
                          <Edit className="ml-2 h-4 w-4" />
                          تعديل القيمة
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* History */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>سجل تغييرات قيمة النقاط</CardTitle>
                <InfoTooltip
                  content="هذا السجل يحتوي على تاريخ جميع التغييرات التي تمت على قيمة النقاط. يساعد في تتبع التطورات واتخاذ قرارات مستقبلية."
                  side="right"
                />
              </div>
              <CardDescription>
                تاريخ جميع التغييرات في قيمة النقاط
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الفئة الفرعية</TableHead>
                    <TableHead>القيمة القديمة</TableHead>
                    <TableHead>القيمة الجديدة</TableHead>
                    <TableHead>السبب</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.subcategory_name || 'عام'}</TableCell>
                      <TableCell>{Number(item.old_value).toFixed(4)} ج.م</TableCell>
                      <TableCell className="font-semibold">
                        {Number(item.new_value).toFixed(4)} ج.م
                      </TableCell>
                      <TableCell>{item.change_reason || '-'}</TableCell>
                      <TableCell>
                        {new Date(item.changed_at).toLocaleDateString('ar-EG')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تحديث قيمة النقطة</DialogTitle>
              <DialogDescription>
                قم بتحديث القيمة المالية للنقطة
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="new_value">القيمة الجديدة (جنيه) *</Label>
                  <InfoTooltip
                    content="أدخل القيمة المالية الجديدة للنقطة بالجنيه المصري. يجب أن تكون قيمة إيجابية. مثال: 0.05 يعني أن كل نقطة تساوي 5 قروش."
                    side="right"
                  />
                </div>
                <Input
                  id="new_value"
                  type="number"
                  step="0.0001"
                  value={newValue}
                  onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  القيمة المالية للنقطة الواحدة بالجنيه المصري
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="reason">سبب التغيير</Label>
                  <InfoTooltip
                    content="قم بتوثيق سبب تغيير قيمة النقطة. هذا يساعد في فهم السياق عند مراجعة السجل لاحقاً. مثال: 'تحديث بناءً على تغيرات السوق' أو 'تعديل بناءً على قرار الإدارة'."
                    side="right"
                  />
                </div>
                <textarea
                  id="reason"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: تحديث بناءً على السوق..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                <X className="ml-2 h-4 w-4" />
                إلغاء
              </Button>
              <Button onClick={handleUpdateValue} disabled={loading}>
                <Save className="ml-2 h-4 w-4" />
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
