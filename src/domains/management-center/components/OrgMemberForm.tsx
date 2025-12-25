import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/shared/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { FiInfo } from 'react-icons/fi';
import { OrgMember, OrgUnit, JobTitle } from '@/domains/hr/domain/types';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminSelect } from './AdminSelect'; // Import the new AdminSelect component
import { SimpleSelect } from '@/shared/components/ui/SimpleSelect';

const formSchema = z.object({
  adminId: z.string().uuid({ message: "معرف المسؤول غير صالح" }),
  orgUnitId: z.string().uuid({ message: "معرف الوحدة التنظيمية غير صالح" }),
  jobTitleId: z.string().uuid({ message: "معرف المسمى الوظيفي غير صالح" }).nullable().optional(),
  isPrimary: z.boolean().default(true).optional(),
});

interface OrgMemberFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  initialData?: Partial<Omit<OrgMember, 'id' | 'createdAt'>>;
  orgUnits: OrgUnit[];
  jobTitles: JobTitle[];
  admins: { id: string; name: string; email: string; role?: string }[]; // Updated to include role
}

const OrgMemberForm: React.FC<OrgMemberFormProps> = ({ onSubmit, initialData = {}, orgUnits, jobTitles, admins }) => {
  console.log('[OrgMemberForm] Received admins:', admins);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adminId: initialData.adminId || "",
      orgUnitId: initialData.orgUnitId || "",
      jobTitleId: initialData.jobTitleId === null ? "none" : initialData.jobTitleId || "none",
      isPrimary: initialData.isPrimary ?? false,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const submittedValues = {
      ...values,
      jobTitleId: values.jobTitleId === "none" ? null : values.jobTitleId,
    };
    onSubmit(submittedValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="adminId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المسؤول</FormLabel>
              <FormControl>
                <AdminSelect
                  admins={admins}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="اختر مسؤولاً"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="orgUnitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>الوحدة التنظيمية</FormLabel>
              <FormControl>
                <SimpleSelect
                  options={orgUnits.map(u => ({ value: u.id, label: u.name }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="اختر وحدة تنظيمية"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobTitleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                المسمى الوظيفي
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiInfo className="h-4 w-4 text-gray-400 ms-2" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-700 text-white text-sm p-2 rounded-md">
                      <p>المسمى الوظيفي داخل الوحدة التنظيمية (اختياري).</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <SimpleSelect
                  options={[{ value: 'none', label: 'لا يوجد مسمى وظيفي' }, ...jobTitles.map(j => ({ value: j.id, label: j.name }))]}
                  value={field.value || 'none'}
                  onChange={field.onChange}
                  placeholder="اختر مسمى وظيفي (اختياري)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPrimary"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow rtl:space-x-reverse">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>تعيين كمسؤول أساسي للوحدة</FormLabel>
                <FormDescription>
                  إذا تم تحديده، سيكون هذا المسؤول هو المسؤول الأساسي لهذه الوحدة التنظيمية.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </form>
    </Form>
  );
};

export default OrgMemberForm;
