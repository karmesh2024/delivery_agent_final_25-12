'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { 
  FiGift, 
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiX,
  FiEye,
  FiCalendar
} from "react-icons/fi";
import { Loader2 } from "lucide-react";

interface StorePointsRule {
  id: number;
  name: string;
  rule_type: 'multiplier' | 'welcome' | 'tier' | 'seasonal' | 'fixed';
  min_base_points?: number;
  customer_tier?: string;
  is_new_customer?: boolean;
  bonus_percentage?: number;
  bonus_fixed?: number;
  start_date?: string;
  end_date?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function StorePointsRulesPage() {
  const [rules, setRules] = useState<StorePointsRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<StorePointsRule | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewData, setPreviewData] = useState({ base_points: 10000, bonus_points: 0 });
  const [formData, setFormData] = useState({
    name: '',
    rule_type: 'fixed' as StorePointsRule['rule_type'],
    min_base_points: undefined as number | undefined,
    customer_tier: '',
    is_new_customer: false,
    bonus_percentage: undefined as number | undefined,
    bonus_fixed: undefined as number | undefined,
    start_date: '',
    end_date: '',
    priority: 0,
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/store-points-rules');
      const data = await response.json();
      
      if (data.success) {
        setRules(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleAdd = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      rule_type: 'fixed',
      min_base_points: undefined,
      customer_tier: '',
      is_new_customer: false,
      bonus_percentage: undefined,
      bonus_fixed: undefined,
      start_date: '',
      end_date: '',
      priority: 0,
      is_active: true
    });
    setShowEditDialog(true);
  };

  const handleEdit = (rule: StorePointsRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      rule_type: rule.rule_type,
      min_base_points: rule.min_base_points,
      customer_tier: rule.customer_tier || '',
      is_new_customer: rule.is_new_customer || false,
      bonus_percentage: rule.bonus_percentage,
      bonus_fixed: rule.bonus_fixed,
      start_date: rule.start_date ? rule.start_date.split('T')[0] : '',
      end_date: rule.end_date ? rule.end_date.split('T')[0] : '',
      priority: rule.priority,
      is_active: rule.is_active
    });
    setShowEditDialog(true);
  };

  const handlePreview = async (rule: StorePointsRule) => {
    try {
      const response = await fetch('/api/admin/store-points-rules/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rule_id: rule.id,
          base_points: 10000,
          customer_tier: rule.customer_tier,
          is_new_customer: rule.is_new_customer
        })
      });

      const data = await response.json();
      if (data.success) {
        setPreviewData(data.data);
        setShowPreviewDialog(true);
      }
    } catch (error) {
      console.error('Error previewing rule:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return;

    try {
      const response = await fetch(`/api/admin/store-points-rules?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchRules();
      } else {
        alert(data.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...formData,
        min_base_points: formData.min_base_points || null,
        customer_tier: formData.customer_tier || null,
        bonus_percentage: formData.bonus_percentage || null,
        bonus_fixed: formData.bonus_fixed || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };

      const url = '/api/admin/store-points-rules';
      const method = editingRule ? 'PUT' : 'POST';
      const body = editingRule ? { id: editingRule.id, ...payload } : payload;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowEditDialog(false);
        fetchRules();
      } else {
        alert(data.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      multiplier: 'مضاعف',
      welcome: 'ترحيب',
      tier: 'فئة',
      seasonal: 'موسمي',
      fixed: 'ثابت'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <DashboardLayout title="قواعد نقاط المتجر">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="قواعد نقاط المتجر">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">قواعد نقاط المتجر</h1>
            <p className="text-gray-600 mt-1">إدارة قواعد منح نقاط البونص للعملاء</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchRules} variant="outline">
              <FiRefreshCw className="ml-2" />
              تحديث
            </Button>
            <Button onClick={handleAdd}>
              <FiPlus className="ml-2" />
              إضافة قاعدة
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <FiGift className="text-purple-600 text-xl mt-1 ml-3" />
              <div>
                <h3 className="font-semibold text-purple-900">معلومات عن قواعد نقاط المتجر</h3>
                <p className="text-sm text-purple-700 mt-1">
                  قواعد نقاط المتجر تحدد كيفية منح نقاط البونص للعملاء. يمكنك إنشاء قواعد مختلفة مثل:
                  نقاط ترحيبية للعملاء الجدد، بونص حسب فئة العميل، عروض موسمية، أو قيم ثابتة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle>القواعد الحالية</CardTitle>
            <CardDescription>
              قائمة بجميع قواعد نقاط المتجر
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد قواعد محددة
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>البونص</TableHead>
                    <TableHead>الشروط</TableHead>
                    <TableHead>الفترة</TableHead>
                    <TableHead>الأولوية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRuleTypeLabel(rule.rule_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.bonus_percentage ? (
                          <span>{rule.bonus_percentage}%</span>
                        ) : rule.bonus_fixed ? (
                          <span>{rule.bonus_fixed.toLocaleString('ar-EG')} نقطة</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {rule.min_base_points && (
                          <div>الحد الأدنى: {rule.min_base_points.toLocaleString('ar-EG')} نقطة</div>
                        )}
                        {rule.customer_tier && (
                          <div>الفئة: {rule.customer_tier}</div>
                        )}
                        {rule.is_new_customer && (
                          <div>عملاء جدد فقط</div>
                        )}
                        {!rule.min_base_points && !rule.customer_tier && !rule.is_new_customer && (
                          <span className="text-gray-400">لا توجد شروط</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {rule.start_date || rule.end_date ? (
                          <div>
                            {rule.start_date && (
                              <div>من: {new Date(rule.start_date).toLocaleDateString('ar-EG')}</div>
                            )}
                            {rule.end_date && (
                              <div>إلى: {new Date(rule.end_date).toLocaleDateString('ar-EG')}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">دائم</span>
                        )}
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? (
                            <>
                              <FiCheck className="ml-1 h-3 w-3" />
                              نشط
                            </>
                          ) : (
                            <>
                              <FiX className="ml-1 h-3 w-3" />
                              غير نشط
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(rule)}
                          >
                            <FiEye className="ml-1 h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(rule)}
                          >
                            <FiEdit className="ml-1 h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(rule.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FiTrash2 className="ml-1 h-4 w-4" />
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

        {/* Edit/Create Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'تعديل القاعدة' : 'إضافة قاعدة جديدة'}</DialogTitle>
              <DialogDescription>
                {editingRule ? 'تعديل قاعدة نقاط المتجر' : 'إنشاء قاعدة جديدة لمنح نقاط البونص'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">اسم القاعدة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  placeholder="مثال: ترحيب عملاء جدد"
                />
              </div>

              <div>
                <Label htmlFor="rule_type">نوع القاعدة *</Label>
                <Select
                  value={formData.rule_type}
                  onValueChange={(value: StorePointsRule['rule_type']) => 
                    setFormData({ ...formData, rule_type: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">ترحيب</SelectItem>
                    <SelectItem value="tier">فئة</SelectItem>
                    <SelectItem value="multiplier">مضاعف</SelectItem>
                    <SelectItem value="seasonal">موسمي</SelectItem>
                    <SelectItem value="fixed">ثابت</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_base_points">الحد الأدنى من النقاط الأساسية</Label>
                  <Input
                    id="min_base_points"
                    type="number"
                    value={formData.min_base_points || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      min_base_points: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="mt-1"
                    placeholder="اختياري"
                  />
                </div>

                <div>
                  <Label htmlFor="priority">الأولوية</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 0
                    })}
                    className="mt-1"
                  />
                </div>
              </div>

              {(formData.rule_type === 'tier' || formData.rule_type === 'welcome') && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.rule_type === 'tier' && (
                    <div>
                      <Label htmlFor="customer_tier">فئة العميل</Label>
                      <Input
                        id="customer_tier"
                        value={formData.customer_tier}
                        onChange={(e) => setFormData({ ...formData, customer_tier: e.target.value })}
                        className="mt-1"
                        placeholder="مثال: gold, platinum"
                      />
                    </div>
                  )}
                  {formData.rule_type === 'welcome' && (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_new_customer">للعملاء الجدد فقط</Label>
                      <Switch
                        id="is_new_customer"
                        checked={formData.is_new_customer}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          is_new_customer: checked
                        })}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bonus_percentage">نسبة البونص (%)</Label>
                  <Input
                    id="bonus_percentage"
                    type="number"
                    step="0.01"
                    value={formData.bonus_percentage || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bonus_percentage: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    className="mt-1"
                    placeholder="مثال: 10"
                  />
                </div>

                <div>
                  <Label htmlFor="bonus_fixed">قيمة ثابتة (نقطة)</Label>
                  <Input
                    id="bonus_fixed"
                    type="number"
                    value={formData.bonus_fixed || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      bonus_fixed: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="mt-1"
                    placeholder="مثال: 1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">تاريخ البدء</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">تاريخ الانتهاء</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">تفعيل القاعدة</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    is_active: checked
                  })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={saving}
              >
                إلغاء
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.name}>
                {saving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <FiCheck className="ml-2 h-4 w-4" />
                    حفظ
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>معاينة تأثير القاعدة</DialogTitle>
              <DialogDescription>
                تأثير القاعدة على 10,000 نقطة أساسية
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">النقاط الأساسية:</span>
                <span className="text-lg font-bold">{previewData.base_points.toLocaleString('ar-EG')} نقطة</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <span className="font-medium">نقاط البونص:</span>
                <span className="text-lg font-bold text-purple-600">
                  {previewData.bonus_points.toLocaleString('ar-EG')} نقطة
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="font-medium">الإجمالي:</span>
                <span className="text-lg font-bold text-green-600">
                  {(previewData.base_points + previewData.bonus_points).toLocaleString('ar-EG')} نقطة
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
