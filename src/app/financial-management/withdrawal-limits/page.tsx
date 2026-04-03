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
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { 
  FiShield, 
  FiRefreshCw,
  FiEdit,
  FiCheck,
  FiX,
  FiDollarSign,
  FiUsers,
  FiAlertTriangle
} from "react-icons/fi";
import { Loader2 } from "lucide-react";

interface WithdrawalLimit {
  id: number;
  limit_type: 'daily' | 'weekly' | 'monthly';
  max_amount_egp: number;
  max_transactions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function WithdrawalLimitsPage() {
  const [limits, setLimits] = useState<WithdrawalLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLimit, setEditingLimit] = useState<WithdrawalLimit | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    max_amount_egp: 0,
    max_transactions: 0,
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  const fetchLimits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/withdrawal-limits');
      const data = await response.json();
      
      if (data.success) {
        setLimits(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching limits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  const handleEdit = (limit: WithdrawalLimit) => {
    setEditingLimit(limit);
    setFormData({
      max_amount_egp: limit.max_amount_egp,
      max_transactions: limit.max_transactions,
      is_active: limit.is_active
    });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!editingLimit) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/withdrawal-limits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingLimit.id,
          ...formData
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowEditDialog(false);
        fetchLimits();
      } else {
        alert(data.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      console.error('Error saving limit:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const getLimitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <DashboardLayout title="حدود السحب">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="حدود السحب">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">حدود السحب النقدي</h1>
            <p className="text-gray-600 mt-1">إدارة الحدود اليومية والأسبوعية والشهرية للسحب</p>
          </div>
          <Button onClick={fetchLimits} variant="outline">
            <FiRefreshCw className="ml-2" />
            تحديث
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start">
              <FiShield className="text-blue-600 text-xl mt-1 ml-3" />
              <div>
                <h3 className="font-semibold text-blue-900">معلومات عن حدود السحب</h3>
                <p className="text-sm text-blue-700 mt-1">
                  تحدد هذه الحدود الحد الأقصى للمبلغ وعدد المعاملات المسموحة للعميل في فترة معينة.
                  هذه الحدود تساعد في حماية النظام من السحوبات الكبيرة غير المتوقعة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limits Table */}
        <Card>
          <CardHeader>
            <CardTitle>الحدود الحالية</CardTitle>
            <CardDescription>
              قائمة بجميع حدود السحب النقدي
            </CardDescription>
          </CardHeader>
          <CardContent>
            {limits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد حدود محددة
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النوع</TableHead>
                    <TableHead>الحد الأقصى للمبلغ</TableHead>
                    <TableHead>الحد الأقصى للمعاملات</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر تحديث</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {limits.map((limit) => (
                    <TableRow key={limit.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {getLimitTypeLabel(limit.limit_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">
                        {limit.max_amount_egp.toLocaleString('ar-EG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} ج.م
                      </TableCell>
                      <TableCell>
                        {limit.max_transactions} معاملة
                      </TableCell>
                      <TableCell>
                        <Badge variant={limit.is_active ? 'default' : 'secondary'}>
                          {limit.is_active ? (
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
                      <TableCell className="text-sm text-gray-500">
                        {new Date(limit.updated_at).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(limit)}
                        >
                          <FiEdit className="ml-1 h-4 w-4" />
                          تعديل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل حد السحب</DialogTitle>
              <DialogDescription>
                {editingLimit && `تعديل الحد ${getLimitTypeLabel(editingLimit.limit_type)}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="max_amount">الحد الأقصى للمبلغ (ج.م)</Label>
                <Input
                  id="max_amount"
                  type="number"
                  step="0.01"
                  value={formData.max_amount_egp}
                  onChange={(e) => setFormData({
                    ...formData,
                    max_amount_egp: parseFloat(e.target.value) || 0
                  })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="max_transactions">الحد الأقصى للمعاملات</Label>
                <Input
                  id="max_transactions"
                  type="number"
                  value={formData.max_transactions}
                  onChange={(e) => setFormData({
                    ...formData,
                    max_transactions: parseInt(e.target.value) || 0
                  })}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">تفعيل الحد</Label>
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
              <Button onClick={handleSave} disabled={saving}>
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
      </div>
    </DashboardLayout>
  );
}
