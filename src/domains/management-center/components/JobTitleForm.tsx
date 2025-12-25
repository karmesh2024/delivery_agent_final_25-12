import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { JobTitle, OrgUnitTreeNode } from '@/domains/hr/domain/types';
import { useAppSelector } from '@/store/hooks';
import { selectHrState } from '@/domains/hr/store/hrSlice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { FiInfo } from 'react-icons/fi';

const formSchema = z.object({
  name: z.string().min(2, { message: 'الاسم مطلوب ولا يقل عن حرفين' }),
  code: z.string().optional().nullable(),
  orgUnitId: z.string().min(1, { message: 'يجب اختيار وحدة تنظيمية' }),
  isActive: z.boolean().optional().default(true),
});

type JobTitleFormValues = z.infer<typeof formSchema>;

interface JobTitleFormProps {
  onSubmit: (values: JobTitleFormValues) => void;
  initialData?: Partial<JobTitle>;
}

const JobTitleForm: React.FC<JobTitleFormProps> = ({ onSubmit, initialData }) => {
  const { tree: orgUnitsTree } = useAppSelector(selectHrState);

  const form = useForm<JobTitleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      orgUnitId: initialData?.orgUnitId || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const renderOrgUnitOptions = (nodes: OrgUnitTreeNode[], indent: number = 0) => {
    return nodes.map(node => (
      <React.Fragment key={node.id}>
        <SelectItem value={node.id}>
          {'--'.repeat(indent) + node.name}
        </SelectItem>
        {node.children && renderOrgUnitOptions(node.children, indent + 1)}
      </React.Fragment>
    ));
  };

  const handleSubmit = (values: JobTitleFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                الاسم
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-1">
                      <FiInfo className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-700 text-white text-sm px-2 py-1 rounded shadow-lg">
                      <p>اسم المسمى الوظيفي (مثال: مدير مبيعات)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                الرمز
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-1">
                      <FiInfo className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-700 text-white text-sm px-2 py-1 rounded shadow-lg">
                      <p>رمز فريد للمسمى الوظيفي (اختياري)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel className="flex items-center">
                الوحدة التنظيمية
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-1">
                      <FiInfo className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-700 text-white text-sm px-2 py-1 rounded shadow-lg">
                      <p>الوحدة التنظيمية التي يتبع لها هذا المسمى الوظيفي</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر وحدة تنظيمية" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {renderOrgUnitOptions(orgUnitsTree)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {initialData?.id ? 'تعديل المسمى الوظيفي' : 'إضافة مسمى وظيفي'}
        </Button>
      </form>
    </Form>
  );
};

export default JobTitleForm;



