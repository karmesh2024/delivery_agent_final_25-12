'use client';

import React from 'react';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { EnhancedDropdown } from '@/shared/ui/enhanced-dropdown';
import { FiX, FiSave, FiPlus } from 'react-icons/fi';
import { toast } from '@/shared/ui/toast';

// Type definitions
export type DialogType = 'sector' | 'classification' | 'mainCategory' | 'subCategory' | 'warehouse' | 'permission' | 'delegation';

export interface Sector {
  id: string;
  name: string;
  color: string;
  code?: string;
  description?: string;
  warehouse_levels?: string[];
}

export interface Classification {
  id: string;
  name: string;
  description?: string;
  sector_ids?: string[];
}

export interface MainCategory {
  id: string;
  name: string;
  description?: string;
  classification_id: string;
}

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  main_category_id: string;
}

export interface Warehouse {
  id: string;
  name: string;
  description?: string;
  level_id: string;
  parent_warehouse_id?: string;
  location?: string;
  capacity?: string;
  manager_name?: string;
  contact_phone?: string;
  email?: string;
}

export interface WarehouseLevel {
  id: string;
  name: string;
  description?: string;
}

export interface Permission {
  permission_type: string;
  permission_value: boolean;
}

export interface DelegationData {
  delegator_warehouse_id: string;
  delegatee_warehouse_id: string;
  permission_types: string[];
  delegation_level: 'full' | 'limited' | 'temporary';
  expires_at?: string;
  description?: string;
}

export interface FormData {
  id?: string;
  name: string;
  description: string;
  code: string;
  color: string;
  warehouse_levels: string[];
  sector_id: string;
  sector_ids: string[];
  classification_id: string;
  main_category_id: string;
  level_id: string;
  parent_warehouse_id: string;
  location: string;
  capacity: string;
  manager_name: string;
  contact_phone: string;
  email: string;
  delegator_warehouse_id: string;
  delegatee_warehouse_id: string;
  permission_types: string[];
  delegation_level: string;
  expires_at: string;
  permissions: Permission[];
  warehouse_id?: string;
}

interface UniversalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData | DelegationData) => void;
  title: string;
  type: DialogType;
  initialData?: Partial<FormData>;
  sectors?: Sector[];
  classifications?: Classification[];
  mainCategories?: MainCategory[];
  warehouseLevels?: WarehouseLevel[];
  warehouses?: Warehouse[];
  loading?: boolean;
}

export function UniversalDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  type,
  initialData = {},
  sectors = [],
  classifications = [],
  mainCategories = [],
  warehouseLevels = [],
  warehouses = [],
  loading = false
}: UniversalDialogProps) {
  console.log('UniversalDialog - props:', { isOpen, title, type, initialData, sectors, classifications, mainCategories });
  
  const didInitRef = React.useRef(false);
  const [formData, setFormData] = React.useState<FormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    code: initialData?.code || '',
    color: initialData?.color || '#3B82F6',
    warehouse_levels: initialData?.warehouse_levels || [],
    sector_id: initialData?.sector_id || '',
    sector_ids: initialData?.sector_ids || [],
    classification_id: initialData?.classification_id || '',
    main_category_id: initialData?.main_category_id || '',
    level_id: initialData?.level_id || '',
    parent_warehouse_id: initialData?.parent_warehouse_id || '',
    location: initialData?.location || '',
    capacity: initialData?.capacity || '',
    manager_name: initialData?.manager_name || '',
    contact_phone: initialData?.contact_phone || '',
    email: initialData?.email || '',
      delegator_warehouse_id: initialData?.delegator_warehouse_id ? String(initialData.delegator_warehouse_id) : '',
      delegatee_warehouse_id: initialData?.delegatee_warehouse_id ? String(initialData.delegatee_warehouse_id) : '',
    permission_types: initialData?.permission_types || [],
    delegation_level: initialData?.delegation_level || '',
    expires_at: initialData?.expires_at || '',
    permissions: initialData?.permissions || []
  });

  // استخدام useRef لتتبع آخر initialData لتجنب infinite loops
  const prevInitialDataIdRef = React.useRef<string | undefined>(undefined);
  const prevIsOpenRef = React.useRef<boolean>(false);

  // تحديث البيانات عند تغيير initialData أو فتح النموذج
  React.useEffect(() => {
    if (!isOpen) {
      didInitRef.current = false;
      prevIsOpenRef.current = false;
      return;
    }
    
    // تحديث البيانات فقط عند فتح النموذج لأول مرة أو عند تغيير initialData.id
    const initialDataId = initialData?.id;
    const wasJustOpened = !prevIsOpenRef.current && isOpen;
    const initialDataChanged = prevInitialDataIdRef.current !== initialDataId;
    
    if (!wasJustOpened && !initialDataChanged && didInitRef.current) {
      prevIsOpenRef.current = isOpen;
      return;
    }
    
    // إذا كان النموذج مفتوحاً، قم بتحديث البيانات
    console.log('UniversalDialog - updating form with initialData:', initialData);
    didInitRef.current = true;
    prevInitialDataIdRef.current = initialDataId;
    prevIsOpenRef.current = isOpen;
    setFormData(prev => ({
      ...prev,
      name: initialData?.name || '',
      description: initialData?.description || '',
      code: initialData?.code || '',
      color: initialData?.color || '#3B82F6',
      warehouse_levels: initialData?.warehouse_levels || [],
      sector_id: initialData?.sector_id || '',
      sector_ids: initialData?.sector_ids || [],
      classification_id: initialData?.classification_id || '',
      main_category_id: initialData?.main_category_id || '',
      level_id: initialData?.level_id || '',
      parent_warehouse_id: initialData?.parent_warehouse_id || '',
      location: initialData?.location || '',
      capacity: initialData?.capacity ?? '',
      manager_name: initialData?.manager_name || '',
      contact_phone: initialData?.contact_phone || '',
      email: initialData?.email || '',
      delegator_warehouse_id: initialData?.delegator_warehouse_id ? String(initialData.delegator_warehouse_id) : '',
      delegatee_warehouse_id: initialData?.delegatee_warehouse_id ? String(initialData.delegatee_warehouse_id) : '',
      permission_types: initialData?.permission_types || [],
      delegation_level: initialData?.delegation_level || '',
      expires_at: initialData?.expires_at || '',
      permissions: initialData?.permissions || []
    }));
  }, [isOpen, type, initialData?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('UniversalDialog - handleSubmit:', formData);
    console.log('UniversalDialog - type:', type);
    
    // التحقق من صحة البيانات حسب النوع
    if (type === 'delegation') {
      // للتفويض، التحقق من الحقول المطلوبة
      if (!formData.delegator_warehouse_id) {
        toast({ type: 'warning', title: 'تنبيه', description: 'يرجى اختيار المخزن المفوض' });
        return;
      }
      if (!formData.delegatee_warehouse_id) {
        toast({ type: 'warning', title: 'تنبيه', description: 'يرجى اختيار المخزن المستفيد' });
        return;
      }
      if (!formData.permission_types || formData.permission_types.length === 0) {
        toast({ type: 'warning', title: 'تنبيه', description: 'يرجى اختيار نوع واحد على الأقل من الصلاحيات المفوضة' });
        return;
      }
      if (!formData.delegation_level) {
        toast({ type: 'warning', title: 'تنبيه', description: 'يرجى اختيار مستوى التفويض' });
        return;
      }
    } else if (type === 'permission') {
      // للصلاحيات، التحقق من الحقول المطلوبة
      if (!initialData?.id && !initialData?.warehouse_id) {
        toast({ type: 'error', title: 'خطأ', description: 'معرف المخزن مطلوب' });
        return;
      }
      if (!formData.permissions || formData.permissions.length === 0) {
        toast({ type: 'warning', title: 'تنبيه', description: 'يرجى اختيار صلاحية واحدة على الأقل' });
        return;
      }
    } else {
      // للأنواع الأخرى، التحقق من الاسم
      if (!formData.name.trim()) {
        toast({ type: 'warning', title: 'تنبيه', description: 'يرجى إدخال الاسم' });
        return;
      }
    }
    
    // للتصنيفات، التحقق من اختيار قطاع واحد على الأقل
    if (type === 'classification' && formData.sector_ids.length === 0) {
      toast({ type: 'warning', title: 'تنبيه', description: 'يرجى اختيار قطاع واحد على الأقل' });
      return;
    }
    
    // للفئات الأساسية، التحقق من اختيار التصنيف
    if (type === 'mainCategory' && !formData.classification_id) {
      toast({ type: 'warning', title: 'تنبيه', description: 'يرجى اختيار التصنيف' });
      return;
    }
    
    // للفئات الفرعية، التحقق من اختيار الفئة الأساسية
    if (type === 'subCategory' && !formData.main_category_id) {
      toast({ type: 'warning', title: 'تنبيه', description: 'يرجى اختيار الفئة الأساسية' });
      return;
    }
    
    console.log('UniversalDialog - إرسال البيانات:', formData);
    onSubmit(formData);
  };

  const handleClose = () => {
    console.log('UniversalDialog - handleClose');
    didInitRef.current = false;
    setFormData({
      name: '',
      description: '',
      code: '',
      color: '#3B82F6',
      warehouse_levels: [],
      sector_id: '',
      sector_ids: [],
      classification_id: '',
      main_category_id: '',
      level_id: '',
      parent_warehouse_id: '',
      location: '',
      capacity: '',
      manager_name: '',
      contact_phone: '',
      email: '',
      delegator_warehouse_id: '',
      delegatee_warehouse_id: '',
      permission_types: [],
      delegation_level: '',
      expires_at: '',
      permissions: []
    });
    onClose();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleClose();
  };

  const isEdit = initialData?.id;

  // دوال التعامل مع اختيار القطاعات
  const handleSelectAllSectors = () => {
    setFormData(prev => {
      const newSectorIds = sectors.map(sector => sector.id);
      return {
        ...prev,
        sector_ids: newSectorIds,
        sector_id: newSectorIds[0] || ''
      };
    });
  };

  const handleSectorToggle = (sectorId: string) => {
    setFormData(prev => {
      const newSectorIds = prev.sector_ids.includes(sectorId)
        ? prev.sector_ids.filter(id => id !== sectorId)
        : [...prev.sector_ids, sectorId];
      
      return {
        ...prev,
        sector_ids: newSectorIds,
        sector_id: newSectorIds[0] || ''
      };
    });
  };

  const isAllSectorsSelected = formData.sector_ids.length === sectors.length && sectors.length > 0;
  const isSectorSelected = (sectorId: string) => formData.sector_ids.includes(sectorId);

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      className="sm:max-w-[500px]"
      footer={
        <div className="flex justify-end space-x-2 rtl:space-x-reverse">
          <Button
            type="button"
            variant="outline"
            onClick={handleCloseClick}
            disabled={loading}
          >
            <FiX className="w-4 h-4 mr-1" />
            إلغاء
          </Button>
          <Button
            type="submit"
            form="universal-dialog-form"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FiSave className="w-4 h-4 mr-1" />
            {isEdit ? 'تحديث' : 'إضافة'}
          </Button>
        </div>
      }
    >
      <form id="universal-dialog-form" onSubmit={handleSubmit} className="space-y-4">
          {/* اسم العنصر - غير مطلوب للتفويض */}
          {type !== 'delegation' && type !== 'permission' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  {type === 'sector' ? 'اسم القطاع' :
                   type === 'classification' ? 'اسم التصنيف' : 
                   type === 'mainCategory' ? 'اسم الفئة الأساسية' : 
                   type === 'subCategory' ? 'اسم الفئة الفرعية' : 
                   'اسم المخزن'} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`أدخل ${type === 'sector' ? 'اسم القطاع' :
                             type === 'classification' ? 'اسم التصنيف' : 
                             type === 'mainCategory' ? 'اسم الفئة الأساسية' : 
                             type === 'subCategory' ? 'اسم الفئة الفرعية' : 'اسم المخزن'}`}
                  className="bg-white text-gray-900 border-gray-300"
                  required
                />
              </div>

              {/* وصف العنصر */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 font-medium">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="أدخل الوصف (اختياري)"
                  rows={3}
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
            </>
          )}

          {/* وصف العنصر - للتفويض فقط */}
          {type === 'delegation' && (
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700 font-medium">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="أدخل الوصف (اختياري)"
                rows={3}
                className="bg-white text-gray-900 border-gray-300"
              />
            </div>
          )}

          {/* حقول القطاع - للقطاعات فقط */}
          {type === 'sector' && (
            <>
              {/* كود القطاع */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-700 font-medium">كود القطاع *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="أدخل كود القطاع"
                  className="bg-white text-gray-900 border-gray-300"
                  required
                />
              </div>

              {/* لون القطاع */}
              <div className="space-y-2">
                <Label htmlFor="color" className="text-gray-700 font-medium">لون القطاع *</Label>
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="bg-white text-gray-900 border-gray-300"
                    required
                  />
                </div>
              </div>

              {/* المستويات المسموحة */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">المستويات المسموحة *</Label>
                <div className="space-y-2">
                  {[
                    { value: 'admin', label: 'الإدارة العليا' },
                    { value: 'country', label: 'المخزن الرئيسي' },
                    { value: 'city', label: 'مخزن المدينة' },
                    { value: 'district', label: 'مخزن المنطقة' }
                  ].map((level) => (
                    <div key={level.value} className="flex items-center space-x-2 rtl:space-x-reverse">
                      <input
                        type="checkbox"
                        id={`level_${level.value}`}
                        checked={formData.warehouse_levels?.includes(level.value) || false}
                        onChange={(e) => {
                          const currentLevels = formData.warehouse_levels || [];
                          const newLevels = e.target.checked
                            ? [...currentLevels, level.value]
                            : currentLevels.filter(l => l !== level.value);
                          setFormData({ ...formData, warehouse_levels: newLevels });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor={`level_${level.value}`} className="text-sm text-gray-700">
                        {level.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* حقول المخزن - للمخازن فقط */}
          {type === 'warehouse' && (
            <>
              {/* مستوى المخزن */}
              <div className="space-y-2">
                <Label htmlFor="level_id" className="text-gray-700 font-medium">مستوى المخزن *</Label>
                <EnhancedDropdown
                  options={warehouseLevels.map((level: WarehouseLevel) => ({ id: String(level.id), name: String(level.name) }))}
                  value={formData.level_id}
                  onChange={(value) => setFormData({ ...formData, level_id: value })}
                  placeholder="اختر مستوى المخزن"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
              {/* المخزن الأب */}
              <div className="space-y-2">
                <Label htmlFor="parent_warehouse_id" className="text-gray-700 font-medium">المخزن الأب</Label>
                <EnhancedDropdown
                  options={warehouses.map((warehouse: Warehouse) => ({ id: String(warehouse.id), name: String(warehouse.name) }))}
                  value={formData.parent_warehouse_id}
                  onChange={(value) => setFormData({ ...formData, parent_warehouse_id: value })}
                  placeholder="اختر المخزن الأب (اختياري)"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
              {/* الموقع */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-700 font-medium">الموقع</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="أدخل موقع المخزن"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
              {/* السعة */}
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-gray-700 font-medium">السعة</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="أدخل سعة المخزن"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
              {/* اسم المدير */}
              <div className="space-y-2">
                <Label htmlFor="manager_name" className="text-gray-700 font-medium">اسم المدير</Label>
                <Input
                  id="manager_name"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  placeholder="أدخل اسم مدير المخزن"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
              {/* رقم الهاتف */}
              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="text-gray-700 font-medium">رقم الهاتف</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="أدخل رقم الهاتف"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
              {/* البريد الإلكتروني */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="أدخل البريد الإلكتروني"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
            </>
          )}

          {/* حقول الصلاحيات - للصلاحيات فقط */}
          {type === 'permission' && (
            <>
              {/* الصلاحيات */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">الصلاحيات</Label>
                <div className="space-y-2">
                  {[
                    { value: 'create_warehouse', label: 'إنشاء مخزن' },
                    { value: 'edit_warehouse', label: 'تعديل مخزن' },
                    { value: 'delete_warehouse', label: 'حذف مخزن' },
                    { value: 'view_reports', label: 'عرض التقارير' },
                    { value: 'manage_permissions', label: 'إدارة الصلاحيات' },
                    { value: 'delegate_permissions', label: 'تفويض الصلاحيات' }
                  ].map((permission) => (
                    <div key={permission.value} className="flex items-center space-x-2 rtl:space-x-reverse">
                      <input
                        type="checkbox"
                        id={`permission_${permission.value}`}
                        checked={formData.permissions?.some((p: Permission) => p.permission_type === permission.value && p.permission_value) || false}
                        onChange={(e) => {
                          const currentPermissions = formData.permissions || [];
                          const newPermissions = e.target.checked
                            ? [...currentPermissions.filter((p: Permission) => p.permission_type !== permission.value),
                                { permission_type: permission.value, permission_value: true }]
                            : currentPermissions.filter((p: Permission) => p.permission_type !== permission.value);
                          setFormData({ ...formData, permissions: newPermissions });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor={`permission_${permission.value}`} className="text-sm text-gray-700">
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* حقول التفويض - للتفويض فقط */}
          {type === 'delegation' && (
            <>
              {/* المخزن المفوض */}
              <div className="space-y-2">
                <Label htmlFor="delegator_warehouse_id" className="text-gray-700 font-medium">المخزن المفوض *</Label>
                <EnhancedDropdown
                  options={warehouses.map((warehouse: Warehouse) => ({ id: String(warehouse.id), name: String(warehouse.name) }))}
                  value={formData.delegator_warehouse_id}
                  onChange={(value) => setFormData({ ...formData, delegator_warehouse_id: value })}
                  placeholder="اختر المخزن المفوض"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
              {/* المخزن المستفيد */}
              <div className="space-y-2">
                <Label htmlFor="delegatee_warehouse_id" className="text-gray-700 font-medium">المخزن المستفيد *</Label>
                <EnhancedDropdown
                  options={warehouses.map((warehouse: Warehouse) => ({ id: String(warehouse.id), name: String(warehouse.name) }))}
                  value={formData.delegatee_warehouse_id}
                  onChange={(value) => setFormData({ ...formData, delegatee_warehouse_id: value })}
                  placeholder="اختر المخزن المستفيد"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
              {/* أنواع الصلاحيات المفوضة */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">أنواع الصلاحيات المفوضة *</Label>
                <div className="space-y-2">
                  {[
                    { value: 'create_warehouse', label: 'إنشاء مخزن' },
                    { value: 'edit_warehouse', label: 'تعديل مخزن' },
                    { value: 'delete_warehouse', label: 'حذف مخزن' },
                    { value: 'view_reports', label: 'عرض التقارير' },
                    { value: 'manage_permissions', label: 'إدارة الصلاحيات' },
                    { value: 'delegate_permissions', label: 'تفويض الصلاحيات' }
                  ].map((permission) => (
                    <div key={permission.value} className="flex items-center space-x-2 rtl:space-x-reverse">
                      <input
                        type="checkbox"
                        id={`delegation_${permission.value}`}
                        checked={formData.permission_types?.includes(permission.value) || false}
                        onChange={(e) => {
                          const currentTypes = formData.permission_types || [];
                          const newTypes = e.target.checked
                            ? [...currentTypes, permission.value]
                            : currentTypes.filter(t => t !== permission.value);
                          setFormData({ ...formData, permission_types: newTypes });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor={`delegation_${permission.value}`} className="text-sm text-gray-700">
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {/* مستوى التفويض */}
              <div className="space-y-2">
                <Label htmlFor="delegation_level" className="text-gray-700 font-medium">مستوى التفويض *</Label>
                <EnhancedDropdown
                  options={[
                    { id: 'full', name: 'تفويض كامل' },
                    { id: 'limited', name: 'تفويض محدود' },
                    { id: 'temporary', name: 'تفويض مؤقت' }
                  ]}
                  value={formData.delegation_level}
                  onChange={(value) => setFormData({ ...formData, delegation_level: value })}
                  placeholder="اختر مستوى التفويض"
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
              {/* تاريخ الانتهاء */}
              <div className="space-y-2">
                <Label htmlFor="expires_at" className="text-gray-700 font-medium">تاريخ الانتهاء</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
            </>
          )}

          {/* اختيار القطاعات - للتصنيفات فقط */}
          {type === 'classification' && (
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">القطاعات *</Label>
              
              {/* خيار جميع القطاعات */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <input
                    type="checkbox"
                    id="all_sectors"
                    checked={isAllSectorsSelected}
                    onChange={handleSelectAllSectors}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="all_sectors" className="text-sm font-medium text-gray-700 cursor-pointer">
                    جميع القطاعات
                  </label>
        </div>

                {/* قائمة القطاعات */}
                <div className="ml-6 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                  {sectors.map((sector) => (
                    <div key={sector.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                      <input
                        type="checkbox"
                        id={`sector_${sector.id}`}
                        checked={isSectorSelected(sector.id)}
                        onChange={() => handleSectorToggle(sector.id)}
                        className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label 
                        htmlFor={`sector_${sector.id}`} 
                        className="text-sm text-gray-700 cursor-pointer flex items-center space-x-2 rtl:space-x-reverse"
    >
      <div
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: sector.color }}
                        ></div>
                        <span>{sector.name}</span>
                      </label>
        </div>
                  ))}
        </div>

                {/* عرض القطاعات المختارة */}
                {formData.sector_ids.length > 0 && (
                  <div className="text-xs text-gray-500">
                    القطاعات المختارة: {formData.sector_ids.length} من {sectors.length}
          </div>
        )}
      </div>
    </div>
          )}

          {/* اختيار التصنيف - للفئات الأساسية فقط */}
          {type === 'mainCategory' && (
            <div className="space-y-2">
              <EnhancedDropdown
                options={classifications}
                value={formData.classification_id}
                onChange={(value) => setFormData({ ...formData, classification_id: value })}
                placeholder="اختر التصنيف"
                label="التصنيف"
                required={true}
                searchPlaceholder="ابحث في التصنيفات..."
                showUniqueOnly={true}
                className="w-full"
              />
            </div>
          )}

          {/* اختيار الفئة الأساسية - للفئات الفرعية فقط */}
          {type === 'subCategory' && (
            <div className="space-y-2">
              <EnhancedDropdown
                options={mainCategories}
                value={formData.main_category_id}
                onChange={(value) => setFormData({ ...formData, main_category_id: value })}
                placeholder="اختر الفئة الأساسية"
                label="الفئة الأساسية"
                required={true}
                searchPlaceholder="ابحث في الفئات الأساسية..."
                showUniqueOnly={false}
                className="w-full"
              />
            </div>
          )}

        </form>
    </CustomDialog>
  );
} 