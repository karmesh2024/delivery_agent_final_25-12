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
import {
  addContactPerson,
  updateContactPerson,
} from '../store/supplierSlice';
import { SupplierContactPerson } from '../types';
import { Checkbox } from '@/shared/components/ui/checkbox';

interface SupplierContactPersonFormValues {
  id?: number;
  supplier_id: number;
  first_name: string;
  last_name: string;
  position?: string;
  email?: string;
  phone_number: string;
  is_primary?: boolean;
}

interface SupplierContactPersonFormProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: number;
  contactPerson?: SupplierContactPerson | null;
}

const SupplierContactPersonForm: React.FC<SupplierContactPersonFormProps> = ({
  isOpen,
  onClose,
  supplierId,
  contactPerson,
}) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.supplier);

  const [formData, setFormData] = useState<SupplierContactPersonFormValues>(
    contactPerson
      ?
      {
        id: contactPerson.id,
        supplier_id: contactPerson.supplier_id,
        first_name: contactPerson.first_name || '',
        last_name: contactPerson.last_name || '',
        position: contactPerson.position || '',
        email: contactPerson.email || '',
        phone_number: contactPerson.phone_number || '',
        is_primary: contactPerson.is_primary || false,
      }
      :
      {
        supplier_id: supplierId,
        first_name: '',
        last_name: '',
        position: '',
        email: '',
        phone_number: '',
        is_primary: false,
      }
  );

  useEffect(() => {
    if (contactPerson) {
      setFormData({
        id: contactPerson.id,
        supplier_id: contactPerson.supplier_id,
        first_name: contactPerson.first_name || '',
        last_name: contactPerson.last_name || '',
        position: contactPerson.position || '',
        email: contactPerson.email || '',
        phone_number: contactPerson.phone_number || '',
        is_primary: contactPerson.is_primary || false,
      });
    } else {
      setFormData({
        supplier_id: supplierId,
        first_name: '',
        last_name: '',
        position: '',
        email: '',
        phone_number: '',
        is_primary: false,
      });
    }
  }, [contactPerson, supplierId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (contactPerson && contactPerson.id) {
        await dispatch(
          updateContactPerson({
            id: contactPerson.id,
            contactPerson: formData as Partial<SupplierContactPerson>,
          })
        ).unwrap();
        toast.success('تم تحديث جهة الاتصال بنجاح!');
      } else {
        await dispatch(
          addContactPerson(formData as Omit<SupplierContactPerson, 'id' | 'created_at' | 'updated_at'>)
        ).unwrap();
        toast.success('تم إضافة جهة الاتصال بنجاح!');
      }
      onClose();
    } catch (err: unknown) {
      toast.error(
        `فشل في ${
          contactPerson ? 'تحديث' : 'إضافة'
        } جهة الاتصال: ${(err as Error).message || 'خطأ غير معروف'}`
      );
    }
  };

  return (
    <UniversalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={contactPerson ? "تعديل جهة الاتصال" : "إضافة جهة اتصال جديدة"}
      description={contactPerson ? "قم بتعديل تفاصيل جهة الاتصال." : "املأ التفاصيل أدناه لإضافة جهة اتصال جديدة."
      }
      maxWidth="md:max-w-xl"
      footer={
        <DialogFooter>
          <Button type="submit" disabled={loading} onClick={handleSubmit}>
            {loading
              ? contactPerson
                ? 'جاري التحديث...'
                : 'جاري الإضافة...'
              : contactPerson
                ? 'حفظ التعديلات'
                : 'إضافة جهة اتصال'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </DialogFooter>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="first_name" className="text-right">
            الاسم الأول
          </Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="last_name" className="text-right">
            اسم العائلة
          </Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            البريد الإلكتروني
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="phone_number" className="text-right">
            رقم الهاتف
          </Label>
          <Input
            id="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="position" className="text-right">
            المنصب
          </Label>
          <Input
            id="position"
            value={formData.position}
            onChange={handleChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="is_primary" className="text-right">
            جهة اتصال أساسية
          </Label>
          <Checkbox
            id="is_primary"
            checked={formData.is_primary}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, is_primary: !!checked }))
            }
            className="col-span-3"
          />
        </div>
      </form>
    </UniversalDialog>
  );
};

export default SupplierContactPersonForm; 