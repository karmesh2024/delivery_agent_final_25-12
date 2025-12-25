'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppDispatch, useAppSelector } from '@/store';
import { addWarehouse, updateWarehouse, fetchWarehouseById } from '../store/warehouseSlice';
import { Warehouse } from '../services/warehouseService';
import { Button } from '@/shared/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

// تعريف مخطط التحقق من صحة البيانات
const warehouseSchema = z.object({
  name: z.string().min(3, { message: 'يجب أن يكون اسم المخزن 3 أحرف على الأقل' }),
  location: z.string().min(5, { message: 'يجب إدخال موقع المخزن بشكل صحيح' }),
  region_id: z.number({ 
    required_error: 'يجب اختيار المنطقة',
    invalid_type_error: 'يجب اختيار المنطقة',
  }),
  capacity: z.number().positive({ message: 'يجب أن تكون السعة أكبر من 0' }),
  manager_id: z.string().optional(),
  contact_phone: z.string().optional(),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

interface WarehouseFormProps {
  warehouseId?: number;
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({ warehouseId }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { currentWarehouse, loading, error } = useAppSelector((state) => state.warehouse);
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([
    { id: 1, name: 'القاهرة' },
    { id: 2, name: 'الإسكندرية' },
    { id: 3, name: 'الجيزة' },
    { id: 4, name: 'المنصورة' },
    { id: 5, name: 'شبرا الخيمة' },
  ]);

  // تهيئة نموذج React Hook Form مع التحقق من الصحة
  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      location: '',
      region_id: undefined,
      capacity: 0,
      manager_id: '',
      contact_phone: '',
    },
  });

  // جلب بيانات المخزن عند التعديل
  useEffect(() => {
    if (warehouseId) {
      dispatch(fetchWarehouseById(warehouseId));
    }
  }, [dispatch, warehouseId]);

  // تحديث النموذج عند استلام بيانات المخزن
  useEffect(() => {
    if (currentWarehouse && warehouseId) {
      form.reset({
        name: currentWarehouse.name,
        location: currentWarehouse.location,
        region_id: currentWarehouse.region_id,
        capacity: currentWarehouse.capacity,
        manager_id: currentWarehouse.manager_id || '',
        contact_phone: currentWarehouse.contact_phone || '',
      });
    }
  }, [currentWarehouse, form, warehouseId]);

  // معالجة تقديم النموذج
  const onSubmit = async (data: WarehouseFormValues) => {
    try {
      if (warehouseId) {
        // تحديث مخزن موجود
        await dispatch(updateWarehouse({ id: warehouseId, warehouse: data })).unwrap();
        toast.success('تم تحديث المخزن بنجاح');
      } else {
        // إضافة مخزن جديد
        await dispatch(addWarehouse(data)).unwrap();
        toast.success('تم إضافة المخزن بنجاح');
      }
      router.push('/dashboard/warehouses');
    } catch (error) {
      toast.error(warehouseId ? 'فشل في تحديث المخزن' : 'فشل في إضافة المخزن');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{warehouseId ? 'تعديل المخزن' : 'إضافة مخزن جديد'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المخزن</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل اسم المخزن" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>موقع المخزن</FormLabel>
                  <FormControl>
                    <Textarea placeholder="أدخل العنوان التفصيلي للمخزن" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="region_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المنطقة</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value?.toString()}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المنطقة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id.toString()}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>السعة الكلية (كجم/طن)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="أدخل السعة الكلية للمخزن"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manager_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مدير المخزن (اختياري)</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل معرف مدير المخزن" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الاتصال (اختياري)</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل رقم الاتصال بالمخزن" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 rtl:space-x-reverse">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/warehouses')}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الحفظ...' : warehouseId ? 'تحديث المخزن' : 'إضافة المخزن'}
              </Button>
            </div>

            {error && (
              <div className="bg-red-100 p-3 rounded-md text-red-700 text-sm mt-4">
                {error}
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default WarehouseForm; 