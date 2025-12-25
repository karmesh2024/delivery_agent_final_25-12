'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { FiPhoneCall } from 'react-icons/fi';
import { SupplierContactPerson } from '../../types';

interface ContactPersonsTabProps {
  initialData: SupplierContactPerson[];
  supplierId?: string;
  onChange: (data: SupplierContactPerson[]) => void;
  onValidityChange: (isValid: boolean) => void;
}

const contactPersonSchema = z.object({
  first_name: z.string().min(1, { message: 'الاسم الأول مطلوب' }),
  last_name: z.string().min(1, { message: 'الاسم الأخير مطلوب' }),
  email: z.string().email({ message: 'صيغة البريد الإلكتروني غير صحيحة' }).or(z.literal('')),
  phone_number: z.string().min(10, { message: 'رقم الهاتف مطلوب (10 أرقام على الأقل)' }),
  position: z.string().min(1, { message: 'المنصب مطلوب' }),
});

const formSchema = z.object({
  contactPersons: z.array(contactPersonSchema),
});

const ContactPersonsTab: React.FC<ContactPersonsTabProps> = ({
  initialData,
  onChange,
  onValidityChange,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactPersons: initialData.length > 0 ? initialData : [{ first_name: '', last_name: '', email: '', phone_number: '', position: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'contactPersons',
  });

  useEffect(() => {
    if (initialData.length === 0 && fields.length === 0) {
      append({ first_name: '', last_name: '', email: '', phone_number: '', position: '' });
    }
  }, [initialData, fields.length, append]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      onChange((value.contactPersons || []) as SupplierContactPerson[]);
      onValidityChange(form.formState.isValid);
    });
    return () => subscription.unsubscribe();
  }, [form, onChange, onValidityChange]);

  useEffect(() => {
    onValidityChange(form.formState.isValid);
  }, [form.formState.isValid, onValidityChange]);

  const handleAddContactPerson = () => {
    append({ first_name: '', last_name: '', email: '', phone_number: '', position: '' });
  };

  const handleRemoveContactPerson = (index: number) => {
    remove(index);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="border p-4 rounded-md shadow-sm space-y-4 relative">
              <h4 className="text-md font-semibold mb-2 flex items-center gap-2">
                <FiPhoneCall className="text-gray-600" /> جهة الاتصال {index + 1}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`contactPersons.${index}.first_name`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>الاسم الأول</FormLabel>
                      <FormControl>
                        <Input placeholder="اسم جهة الاتصال الأول" {...formField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`contactPersons.${index}.last_name`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>الاسم الأخير</FormLabel>
                      <FormControl>
                        <Input placeholder="اسم جهة الاتصال الأخير" {...formField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`contactPersons.${index}.email`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@example.com" {...formField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`contactPersons.${index}.phone_number`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+966XXXXXXXXX" {...formField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`contactPersons.${index}.position`}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>المنصب</FormLabel>
                      <FormControl>
                        <Input placeholder="المنصب" {...formField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveContactPerson(index)}
                  className="absolute top-2 right-2"
                >
                  <FaTrash />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" onClick={handleAddContactPerson} className="mt-4 flex items-center gap-2">
            <FaPlus /> إضافة جهة اتصال أخرى
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ContactPersonsTab; 