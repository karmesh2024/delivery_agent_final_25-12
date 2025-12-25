import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { OrgUnit, OrgUnitTreeNode } from '@/domains/hr/domain/types';
import { useAppSelector } from '@/store/hooks';
import { selectHrState } from '@/domains/hr/store/hrSlice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { FiInfo } from 'react-icons/fi';

const formSchema = z.object({
  name: z.string().min(2, { message: 'الاسم مطلوب ولا يقل عن حرفين' }),
  code: z.string().optional().nullable(),
  warehouseId: z.preprocess(val => (val === '' ? null : Number(val)), z.number().optional().nullable()),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

type OrgUnitFormValues = z.infer<typeof formSchema>;

interface OrgUnitFormProps {
  onSubmit: (values: OrgUnitFormValues) => void;
  initialData?: Partial<OrgUnit>;
}

const OrgUnitForm: React.FC<OrgUnitFormProps> = ({ onSubmit, initialData }) => {
  const { tree: orgUnitsTree } = useAppSelector(selectHrState);

  const form = useForm<OrgUnitFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      warehouseId: initialData?.warehouseId || null,
      parentId: initialData?.parentId || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  const renderOrgUnitOptions = (nodes: OrgUnitTreeNode[], indent: number = 0) => {
    return nodes.map(node => (
      <React.Fragment key={node.id}>
        <SelectItem value={node.id} disabled={node.id === initialData?.id}>
          {'--'.repeat(indent) + node.name}
        </SelectItem>
        {node.children && renderOrgUnitOptions(node.children, indent + 1)}
      </React.Fragment>
    ));
  };

  const handleSubmit = (values: OrgUnitFormValues) => {
    onSubmit({
      ...values,
      parentId: values.parentId === 'none' ? null : values.parentId,
    });
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
                      <p>اسم الوحدة التنظيمية (مثل: قسم المبيعات)</p>
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
                      <p>رمز فريد للوحدة التنظيمية (اختياري)</p>
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
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                القسم الرئيسي
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-1">
                      <FiInfo className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-700 text-white text-sm px-2 py-1 rounded shadow-lg">
                      <p>القسم الذي تتبع له هذه الوحدة التنظيمية (اختياري)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر قسم رئيسي" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">لا يوجد قسم رئيسي</SelectItem>
                  {renderOrgUnitOptions(orgUnitsTree)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* يمكنك إضافة حقل warehouseId إذا كان مطلوبًا */}
        {/* <FormField
          control={form.control}
          name="warehouseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>معرف المستودع</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> */}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {initialData?.id ? 'تعديل القسم' : 'إضافة قسم'}
        </Button>
      </form>
    </Form>
  );
};

export default OrgUnitForm;
