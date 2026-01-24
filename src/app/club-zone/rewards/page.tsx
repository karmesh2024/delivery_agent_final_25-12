'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchRewards, createReward, updateReward, deleteReward } from '@/domains/club-zone/store/clubZoneSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { FiGift, FiPlusCircle, FiEdit, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { ClubRewardFormData, RewardType } from '@/domains/club-zone/types';
import { clubPartnersService } from '@/domains/club-zone/services/clubPartnersService';
import { ClubPartner } from '@/domains/club-zone/types';

export default function ClubRewardsPage() {
  const dispatch = useAppDispatch();
  const { rewards, rewardsCount, loading } = useAppSelector((state) => state.clubZone);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [partners, setPartners] = useState<ClubPartner[]>([]);
  const [formData, setFormData] = useState<ClubRewardFormData>({
    title: '',
    description: '',
    image_url: '',
    reward_type: RewardType.WALLET_CREDIT,
    points_required: 0,
    quantity_available: undefined,
    valid_from: undefined,
    valid_until: undefined,
    is_active: true,
    is_featured: false,
    redemption_instructions: '',
  });

  useEffect(() => {
    dispatch(fetchRewards({ is_active: true }));
    loadPartners();
  }, [dispatch]);

  const loadPartners = async () => {
    try {
      const { data } = await clubPartnersService.getPartners({ is_active: true });
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
    }
  };

  const handleOpenDialog = (reward?: any) => {
    if (reward) {
      setEditingId(reward.id);
      setFormData({
        partner_id: reward.partner_id || undefined,
        title: reward.title,
        description: reward.description || '',
        image_url: reward.image_url || '',
        reward_type: reward.reward_type,
        points_required: reward.points_required,
        quantity_available: reward.quantity_available || undefined,
        valid_from: reward.valid_from || undefined,
        valid_until: reward.valid_until || undefined,
        is_active: reward.is_active,
        is_featured: reward.is_featured || false,
        redemption_instructions: reward.redemption_instructions || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        reward_type: RewardType.WALLET_CREDIT,
        points_required: 0,
        quantity_available: undefined,
        valid_from: undefined,
        valid_until: undefined,
        is_active: true,
        is_featured: false,
        redemption_instructions: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value === 'undefined' ? undefined : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || formData.points_required <= 0) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة.');
      return;
    }

    try {
      if (editingId) {
        await dispatch(updateReward({ id: editingId, updates: formData })).unwrap();
        toast.success('تم تحديث الجائزة بنجاح!');
      } else {
        await dispatch(createReward(formData)).unwrap();
        toast.success('تم إنشاء الجائزة بنجاح!');
      }
      handleCloseDialog();
      dispatch(fetchRewards({ is_active: true }));
    } catch (error: any) {
      toast.error(`فشل في حفظ الجائزة: ${error.message || error.toString()}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد أنك تريد حذف هذه الجائزة؟')) {
      try {
        await dispatch(deleteReward(id)).unwrap();
        toast.success('تم حذف الجائزة بنجاح!');
        dispatch(fetchRewards({ is_active: true }));
      } catch (error: any) {
        toast.error(`فشل في حذف الجائزة: ${error.message || error.toString()}`);
      }
    }
  };

  const getRewardTypeLabel = (type: RewardType) => {
    const labels: Record<RewardType, string> = {
      wallet_credit: 'رصيد محفظة',
      discount_code: 'كود خصم',
      product: 'منتج',
      service: 'خدمة',
    };
    return labels[type] || type;
  };

  return (
    <DashboardLayout title="إدارة الجوائز">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">إدارة الجوائز</h1>
            <p className="text-gray-600 mt-2">
              إدارة الجوائز والهدايا المتاحة للاستبدال
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="flex items-center">
            <FiPlusCircle className="ml-2" />
            إضافة جائزة جديدة
          </Button>
        </div>

        {/* Rewards Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الجوائز ({rewardsCount})</CardTitle>
            <CardDescription>
              جميع الجوائز المتاحة في نادي Scope Zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد جوائز
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الصورة</TableHead>
                    <TableHead>العنوان</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>النقاط المطلوبة</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>الشريك</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>مميز</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell>
                        {reward.image_url ? (
                          <img src={reward.image_url} alt={reward.title} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <FiGift className="text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{reward.title}</TableCell>
                      <TableCell>{getRewardTypeLabel(reward.reward_type)}</TableCell>
                      <TableCell>{reward.points_required}</TableCell>
                      <TableCell>
                        {reward.quantity_available !== null
                          ? `${reward.quantity_available - reward.quantity_redeemed} / ${reward.quantity_available}`
                          : 'غير محدود'}
                      </TableCell>
                      <TableCell>{reward.partner_name || 'النظام'}</TableCell>
                      <TableCell>
                        <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                          {reward.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {reward.is_featured && <Badge variant="outline">مميز</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(reward)}>
                            <FiEdit className="text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(reward.id)}>
                            <FiTrash2 className="text-red-500" />
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

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {editingId ? 'تعديل الجائزة' : 'إضافة جائزة جديدة'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  العنوان *
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="partner_id" className="text-right">
                  الشريك
                </Label>
                <Select
                  value={formData.partner_id || 'undefined'}
                  onValueChange={(value) => handleSelectChange('partner_id', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="اختر شريك (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="undefined">النظام (لا يوجد شريك)</SelectItem>
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reward_type" className="text-right">
                  نوع الجائزة *
                </Label>
                <Select
                  value={formData.reward_type}
                  onValueChange={(value) => handleSelectChange('reward_type', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RewardType.WALLET_CREDIT}>رصيد محفظة</SelectItem>
                    <SelectItem value={RewardType.DISCOUNT_CODE}>كود خصم</SelectItem>
                    <SelectItem value={RewardType.PRODUCT}>منتج</SelectItem>
                    <SelectItem value={RewardType.SERVICE}>خدمة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="points_required" className="text-right">
                  النقاط المطلوبة *
                </Label>
                <Input
                  id="points_required"
                  name="points_required"
                  type="number"
                  value={formData.points_required}
                  onChange={handleChange}
                  className="col-span-3"
                  min="1"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity_available" className="text-right">
                  الكمية المتاحة
                </Label>
                <Input
                  id="quantity_available"
                  name="quantity_available"
                  type="number"
                  value={formData.quantity_available || ''}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="اتركه فارغاً للغير محدود"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  الوصف
                </Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="col-span-3 p-2 border rounded"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image_url" className="text-right">
                  رابط الصورة
                </Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valid_from" className="text-right">
                  تاريخ البدء
                </Label>
                <Input
                  id="valid_from"
                  name="valid_from"
                  type="datetime-local"
                  value={formData.valid_from ? new Date(formData.valid_from).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleSelectChange('valid_from', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valid_until" className="text-right">
                  تاريخ الانتهاء
                </Label>
                <Input
                  id="valid_until"
                  name="valid_until"
                  type="datetime-local"
                  value={formData.valid_until ? new Date(formData.valid_until).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleSelectChange('valid_until', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="redemption_instructions" className="text-right">
                  تعليمات الاستبدال
                </Label>
                <textarea
                  id="redemption_instructions"
                  name="redemption_instructions"
                  value={formData.redemption_instructions}
                  onChange={handleChange}
                  className="col-span-3 p-2 border rounded"
                  rows={2}
                  placeholder="كيف يستخدم المستخدم هذه الجائزة..."
                />
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="rounded"
                />
                <Label htmlFor="is_active">نشط</Label>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="rounded"
                />
                <Label htmlFor="is_featured">مميز</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                <FiX className="ml-2" />
                إلغاء
              </Button>
              <Button onClick={handleSubmit}>
                <FiSave className="ml-2" />
                {editingId ? 'حفظ التعديلات' : 'إضافة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
