'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchPartners, createPartner, updatePartner, deletePartner } from '@/domains/club-zone/store/clubZoneSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { FiBriefcase, FiPlusCircle, FiEdit, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { ClubPartnerFormData, PartnerType } from '@/domains/club-zone/types';

export default function ClubPartnersPage() {
  const dispatch = useAppDispatch();
  const { partners, partnersCount, loading } = useAppSelector((state) => state.clubZone);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClubPartnerFormData>({
    company_name: '',
    partner_type: PartnerType.MERCHANT,
    logo_url: '',
    description: '',
    contact_person: '',
    phone: '',
    email: '',
    website: '',
    partnership_start_date: undefined,
    partnership_end_date: undefined,
    is_active: true,
  });

  useEffect(() => {
    dispatch(fetchPartners({ is_active: true }));
  }, [dispatch]);

  const handleOpenDialog = (partner?: any) => {
    if (partner) {
      setEditingId(partner.id);
      setFormData({
        user_id: partner.user_id || undefined,
        company_name: partner.company_name,
        partner_type: partner.partner_type,
        logo_url: partner.logo_url || '',
        description: partner.description || '',
        contact_person: partner.contact_person || '',
        phone: partner.phone || '',
        email: partner.email || '',
        website: partner.website || '',
        partnership_start_date: partner.partnership_start_date || undefined,
        partnership_end_date: partner.partnership_end_date || undefined,
        is_active: partner.is_active,
      });
    } else {
      setEditingId(null);
      setFormData({
        company_name: '',
        partner_type: PartnerType.MERCHANT,
        logo_url: '',
        description: '',
        contact_person: '',
        phone: '',
        email: '',
        website: '',
        partnership_start_date: undefined,
        partnership_end_date: undefined,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value === 'undefined' ? undefined : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.company_name) {
      toast.error('الرجاء إدخال اسم الشركة.');
      return;
    }

    try {
      if (editingId) {
        await dispatch(updatePartner({ id: editingId, updates: formData })).unwrap();
        toast.success('تم تحديث الشريك بنجاح!');
      } else {
        await dispatch(createPartner(formData)).unwrap();
        toast.success('تم إنشاء الشريك بنجاح!');
      }
      handleCloseDialog();
      dispatch(fetchPartners({ is_active: true }));
    } catch (error: any) {
      toast.error(`فشل في حفظ الشريك: ${error.message || error.toString()}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد أنك تريد حذف هذا الشريك؟')) {
      try {
        await dispatch(deletePartner(id)).unwrap();
        toast.success('تم حذف الشريك بنجاح!');
        dispatch(fetchPartners({ is_active: true }));
      } catch (error: any) {
        toast.error(`فشل في حذف الشريك: ${error.message || error.toString()}`);
      }
    }
  };

  const getPartnerTypeLabel = (type: PartnerType) => {
    const labels: Record<PartnerType, string> = {
      merchant: 'تاجر',
      sponsor: 'راعي',
      recycler: 'مُعاد تدوير',
      media: 'إعلامي',
    };
    return labels[type] || type;
  };

  return (
    <DashboardLayout title="إدارة الرعاة">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">إدارة الرعاة</h1>
            <p className="text-gray-600 mt-2">
              إدارة الشركاء والرعاة التجاريين
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="flex items-center">
            <FiPlusCircle className="ml-2" />
            إضافة شريك جديد
          </Button>
        </div>

        {/* Partners Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الرعاة ({partnersCount})</CardTitle>
            <CardDescription>
              جميع الشركاء والرعاة في نادي Scope Zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : partners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد شركاء
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اللوجو</TableHead>
                    <TableHead>اسم الشركة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>جهة الاتصال</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>مدة الشراكة</TableHead>
                    <TableHead>الإحصائيات</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        {partner.logo_url ? (
                          <img src={partner.logo_url} alt={partner.company_name} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <FiBriefcase className="text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{partner.company_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getPartnerTypeLabel(partner.partner_type)}</Badge>
                      </TableCell>
                      <TableCell>{partner.contact_person || '-'}</TableCell>
                      <TableCell>{partner.phone || '-'}</TableCell>
                      <TableCell>{partner.email || '-'}</TableCell>
                      <TableCell>
                        {partner.partnership_start_date
                          ? `${new Date(partner.partnership_start_date).toLocaleDateString('ar-EG')} - ${
                              partner.partnership_end_date ? new Date(partner.partnership_end_date).toLocaleDateString('ar-EG') : 'مستمر'
                            }`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>الجوائز: {partner.total_rewards || 0}</div>
                          <div>الاستبدالات: {partner.total_redemptions || 0}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={partner.is_active ? 'default' : 'secondary'}>
                          {partner.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(partner)}>
                            <FiEdit className="text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(partner.id)}>
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
                {editingId ? 'تعديل الشريك' : 'إضافة شريك جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company_name" className="text-right">
                  اسم الشركة *
                </Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="partner_type" className="text-right">
                  نوع الشريك *
                </Label>
                <Select
                  value={formData.partner_type}
                  onValueChange={(value) => handleSelectChange('partner_type', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PartnerType.MERCHANT}>تاجر</SelectItem>
                    <SelectItem value={PartnerType.SPONSOR}>راعي</SelectItem>
                    <SelectItem value={PartnerType.RECYCLER}>مُعاد تدوير</SelectItem>
                    <SelectItem value={PartnerType.MEDIA}>إعلامي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="logo_url" className="text-right">
                  رابط اللوجو
                </Label>
                <Input
                  id="logo_url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="https://..."
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
                <Label htmlFor="contact_person" className="text-right">
                  جهة الاتصال
                </Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  الهاتف
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="website" className="text-right">
                  الموقع الإلكتروني
                </Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="col-span-3"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="partnership_start_date" className="text-right">
                  تاريخ بداية الشراكة
                </Label>
                <Input
                  id="partnership_start_date"
                  name="partnership_start_date"
                  type="date"
                  value={formData.partnership_start_date || ''}
                  onChange={(e) => handleSelectChange('partnership_start_date', e.target.value || undefined)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="partnership_end_date" className="text-right">
                  تاريخ نهاية الشراكة
                </Label>
                <Input
                  id="partnership_end_date"
                  name="partnership_end_date"
                  type="date"
                  value={formData.partnership_end_date || ''}
                  onChange={(e) => handleSelectChange('partnership_end_date', e.target.value || undefined)}
                  className="col-span-3"
                />
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="is_active">نشط</Label>
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
