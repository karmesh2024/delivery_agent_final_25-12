'use client';

import React, { useState, useEffect } from 'react';
import {
  UniversalDialog,
  DialogFooter,
} from '@/shared/ui/universal-dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store/index';
import { addSupplier, updateSupplier } from '../store/supplierSlice';
import { fetchAllReferenceData } from '../store/referenceDataSlice';
import { Supplier } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import SupplierContactPersonList from './SupplierContactPersonList';

// تعريف واجهة لقيم النموذج التي يديرها النموذج مباشرة
interface SupplierFormValues {
  id?: string; // معرف المورد، اختياري لأنه قد يكون موجودًا فقط عند التعديل
  name: string;
  name_ar?: string;
  supplier_code: string;
  region_id?: number;
  supplier_type_id: number;
  contact_person?: string;
  contact_person_ar?: string;
  contact_phone?: string;
  contact_phone_secondary?: string;
  email?: string;
  website?: string;
  address?: string;
  address_ar?: string;
  city?: string;
  postal_code?: string;
  commercial_register?: string;
  tax_number?: string;
  vat_number?: string;
  rating?: number;
  product_description?: string;
  is_active: boolean;
  is_approved?: boolean;
  // created_at, updated_at, created_by, updated_by, approved_by, approved_at
  // هذه الحقول تتم إدارتها بواسطة الواجهة الخلفية أو قاعدة البيانات ولا يتم إرسالها مباشرة من النموذج
}

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null; // المورد الذي يتم تعديله (اختياري)
}

const SupplierForm: React.FC<SupplierFormProps> = ({ isOpen, onClose, supplier }) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.supplier);
  const { regions, supplierTypes, loading: referenceDataLoading } = useAppSelector((state) => state.referenceData);

  // تهيئة formData بناءً على ما إذا كان هناك مورد للتعديل أو إنشاء مورد جديد
  const [formData, setFormData] = useState<SupplierFormValues>(
    supplier ?
      { // إذا كان هناك مورد، استخدم بياناته
        id: supplier.id,
        name: supplier.name || '',
        name_ar: supplier.name_ar || '',
        supplier_code: supplier.supplier_code || '',
        region_id: supplier.region_id,
        supplier_type_id: supplier.supplier_type_id,
        contact_person: supplier.contact_person || '',
        contact_person_ar: supplier.contact_person_ar || '',
        contact_phone: supplier.contact_phone || '',
        contact_phone_secondary: supplier.contact_phone_secondary || '',
        email: supplier.email || '',
        website: supplier.website || '',
        address: supplier.address || '',
        address_ar: supplier.address_ar || '',
        city: supplier.city || '',
        postal_code: supplier.postal_code || '',
        commercial_register: supplier.commercial_register || '',
        tax_number: supplier.tax_number || '',
        vat_number: supplier.vat_number || '',
        rating: supplier.rating,
        product_description: supplier.product_description || '',
        is_active: supplier.is_active,
        is_approved: supplier.is_approved,
      } :
      { // قيم افتراضية لمورد جديد
        name: '',
        name_ar: '',
        supplier_code: '',
        region_id: undefined,
        supplier_type_id: 0, // قيمة مؤقتة، يجب أن تكون قائمة منسدلة
        contact_person: '',
        contact_person_ar: '',
        contact_phone: '',
        contact_phone_secondary: '',
        email: '',
        website: '',
        address: '',
        address_ar: '',
        city: '',
        postal_code: '',
        commercial_register: '',
        tax_number: '',
        vat_number: '',
        rating: undefined,
        product_description: '',
        is_active: true, // الافتراضي مورد نشط
        is_approved: false, // الافتراضي غير معتمد
      }
  );

  useEffect(() => {
    // جلب البيانات المرجعية عند فتح النموذج لأول مرة
    if (isOpen) {
      dispatch(fetchAllReferenceData());
    }
    // تحديث formData عند تغيير المورد (لعمليات التعديل)
    if (supplier) {
      setFormData({
        id: supplier.id,
        name: supplier.name || '',
        name_ar: supplier.name_ar || '',
        supplier_code: supplier.supplier_code || '',
        region_id: supplier.region_id,
        supplier_type_id: supplier.supplier_type_id,
        contact_person: supplier.contact_person || '',
        contact_person_ar: supplier.contact_person_ar || '',
        contact_phone: supplier.contact_phone || '',
        contact_phone_secondary: supplier.contact_phone_secondary || '',
        email: supplier.email || '',
        website: supplier.website || '',
        address: supplier.address || '',
        address_ar: supplier.address_ar || '',
        city: supplier.city || '',
        postal_code: supplier.postal_code || '',
        commercial_register: supplier.commercial_register || '',
        tax_number: supplier.tax_number || '',
        vat_number: supplier.vat_number || '',
        rating: supplier.rating,
        product_description: supplier.product_description || '',
        is_active: supplier.is_active,
        is_approved: supplier.is_approved,
      });
    } else {
      // إعادة تهيئة النموذج لإضافة مورد جديد
      setFormData({
        name: '',
        name_ar: '',
        supplier_code: '',
        region_id: undefined,
        supplier_type_id: 0, // Placeholder
        contact_person: '',
        contact_person_ar: '',
        contact_phone: '',
        contact_phone_secondary: '',
        email: '',
        website: '',
        address: '',
        address_ar: '',
        city: '',
        postal_code: '',
        commercial_register: '',
        tax_number: '',
        vat_number: '',
        rating: undefined,
        product_description: '',
        is_active: true,
        is_approved: false,
      });
    }
  }, [supplier, isOpen, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const target = e.target; // Introduce a new variable for type narrowing

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [id]: target.checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [id]: value,
      }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value === '' ? undefined : Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (supplier && supplier.id) {
        // وضع التعديل
        await dispatch(updateSupplier({ id: supplier.id, supplier: formData as Partial<Supplier> })).unwrap();
        toast.success('تم تحديث المورد بنجاح!');
      } else {
        // وضع الإضافة
        await dispatch(addSupplier(formData as Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'approved_by' | 'approved_at' | 'created_by' | 'updated_by'>)).unwrap();
        toast.success('تم إضافة المورد بنجاح!');
      }
      onClose();
    } catch (err: unknown) {
      toast.error(`فشل في ${supplier ? 'تحديث' : 'إضافة'} المورد: ${(err as Error).message || 'خطأ غير معروف'}`);
    }
  };

  return (
    <UniversalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? "تعديل بيانات المورد" : "إضافة مورد جديد"}
      description={supplier ? "قم بتعديل تفاصيل المورد الحالي." : "املأ التفاصيل أدناه لإضافة مورد جديد إلى النظام."}
      maxWidth="md:max-w-2xl" // توسيع حجم الحوار لاستيعاب الحقول الجديدة
      footer={
        <DialogFooter>
          <Button type="submit" disabled={loading} onClick={handleSubmit}>
            {loading ? (supplier ? 'جاري التحديث...' : 'جاري الإضافة...') : (supplier ? 'حفظ التعديلات' : 'إضافة مورد')}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </DialogFooter>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name_ar" className="text-right">الاسم (عربي)</Label>
          <Input id="name_ar" value={formData.name_ar || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">الاسم (إنجليزي)</Label>
          <Input id="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="supplier_code" className="text-right">كود المورد</Label>
          <Input id="supplier_code" value={formData.supplier_code || ''} onChange={handleChange} className="col-span-3" required />
        </div>
        {/* حقول معلومات الاتصال */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="contact_person_ar" className="text-right">شخص الاتصال (عربي)</Label>
          <Input id="contact_person_ar" value={formData.contact_person_ar || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="contact_person" className="text-right">شخص الاتصال (إنجليزي)</Label>
          <Input id="contact_person" value={formData.contact_person || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="contact_phone" className="text-right">رقم الهاتف الأساسي</Label>
          <Input id="contact_phone" value={formData.contact_phone || ''} onChange={handleChange} className="col-span-3" type="tel" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="contact_phone_secondary" className="text-right">رقم هاتف ثانوي</Label>
          <Input id="contact_phone_secondary" value={formData.contact_phone_secondary || ''} onChange={handleChange} className="col-span-3" type="tel" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">البريد الإلكتروني</Label>
          <Input id="email" value={formData.email || ''} onChange={handleChange} className="col-span-3" type="email" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="website" className="text-right">الموقع الإلكتروني</Label>
          <Input id="website" value={formData.website || ''} onChange={handleChange} className="col-span-3" type="url" />
        </div>
        {/* حقول العنوان */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="address_ar" className="text-right">العنوان (عربي)</Label>
          <Input id="address_ar" value={formData.address_ar || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="address" className="text-right">العنوان (إنجليزي)</Label>
          <Input id="address" value={formData.address || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="city" className="text-right">المدينة</Label>
          <Input id="city" value={formData.city || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="postal_code" className="text-right">الرمز البريدي</Label>
          <Input id="postal_code" value={formData.postal_code || ''} onChange={handleChange} className="col-span-3" />
        </div>
        {/* حقول المعلومات التجارية */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="commercial_register" className="text-right">السجل التجاري</Label>
          <Input id="commercial_register" value={formData.commercial_register || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="tax_number" className="text-right">الرقم الضريبي</Label>
          <Input id="tax_number" value={formData.tax_number || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="vat_number" className="text-right">رقم ضريبة القيمة المضافة</Label>
          <Input id="vat_number" value={formData.vat_number || ''} onChange={handleChange} className="col-span-3" />
        </div>
        {/* حقول التقييم والحالة */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="rating" className="text-right">التقييم</Label>
          <Input id="rating" value={formData.rating?.toString() || ''} onChange={handleNumberChange} className="col-span-3" type="number" min="0" max="5" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="product_description" className="text-right">توصيف المنتجات</Label>
          <Input id="product_description" value={formData.product_description || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="is_active" className="text-right">نشط</Label>
          <input id="is_active" type="checkbox" checked={formData.is_active} onChange={handleChange} className="col-span-3 w-4 h-4" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="is_approved" className="text-right">معتمد</Label>
          <input id="is_approved" type="checkbox" checked={formData.is_approved || false} onChange={handleChange} className="col-span-3 w-4 h-4" />
        </div>
        {/* حقول region_id و supplier_type_id ستحتاج إلى قوائم منسدلة */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="region_id" className="text-right">المنطقة</Label>
          <div className="col-span-3">
            <Select
              onValueChange={(value) => setFormData((prev) => ({ ...prev, region_id: Number(value) }))}
              value={formData.region_id?.toString() || ''}
              disabled={referenceDataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المنطقة" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id.toString()}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="supplier_type_id" className="text-right">نوع المورد</Label>
          <div className="col-span-3">
            <Select
              onValueChange={(value) => setFormData((prev) => ({ ...prev, supplier_type_id: Number(value) }))}
              value={formData.supplier_type_id?.toString() || ''}
              disabled={referenceDataLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع المورد" />
              </SelectTrigger>
              <SelectContent>
                {supplierTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.type_name_ar} ({type.type_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {supplier && supplier.id && (
          <div className="mt-4 pt-4 border-t">
            <SupplierContactPersonList supplierId={supplier.id} />
          </div>
        )}
      </form>
    </UniversalDialog>
  );
};

export default SupplierForm; 