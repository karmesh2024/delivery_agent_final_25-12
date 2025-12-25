import React from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/use-toast';
import { useAppDispatch } from '@/store/hooks';
import { updateApprovedAgentDetails } from '@/domains/approved-agents/store/approvedAgentsSlice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { PlusCircledIcon, MinusCircledIcon } from '@radix-ui/react-icons';
import { AgentCommission, CommissionType, CommissionUnit } from '@/types';

interface ApprovedAgentDetailsFormProps {
  agentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const DetailsSchema = z.object({
  storage_location: z.string().min(1, { message: "موقع التخزين مطلوب" }),
  region: z.string().min(1, { message: "المنطقة مطلوبة" }),
  agent_type: z.enum(["individual", "company"], { message: "نوع الوكيل مطلوب" }),
  payment_method: z.string().min(1, { message: "طريقة الدفع مطلوبة" }),
  function_specific_commissions: z.array(z.object({
    type: z.enum(['waste_purchase', 'product_sale', 'cash_withdrawal', 'other'], { message: "نوع العمولة مطلوب" }),
    value: z.coerce.number().min(0, { message: "قيمة العمولة يجب أن تكون رقمًا موجبًا" }),
    unit: z.enum(['percentage', 'fixed_amount'], { message: "وحدة العمولة مطلوبة" }),
  })).optional(),
});

type FormInputs = z.infer<typeof DetailsSchema>;

export const ApprovedAgentDetailsForm: React.FC<ApprovedAgentDetailsFormProps> = ({ agentId, onSuccess, onCancel }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const methods = useForm<FormInputs>({
    resolver: zodResolver(DetailsSchema),
    mode: "onChange",
    defaultValues: {
      function_specific_commissions: [],
    }
  });

  const { handleSubmit, control, formState: { errors, isSubmitting } } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "function_specific_commissions",
  });

  const onSubmit = async (data: FormInputs) => {
    const payload = {
      agentId,
      storage_location: data.storage_location,
      region: data.region,
      agent_type: data.agent_type,
      payment_method: data.payment_method,
      function_specific_commissions: data.function_specific_commissions || [],
    };

    const resultAction = await dispatch(updateApprovedAgentDetails(payload));

    if (updateApprovedAgentDetails.fulfilled.match(resultAction)) {
      toast({
        title: "تم بنجاح",
        description: "تم تحديث تفاصيل الوكيل المعتمد.",
        variant: "success",
      });
      onSuccess();
    } else {
      const errorMessage = resultAction.payload as string;
      toast({
        title: "فشل في تحديث التفاصيل",
        description: errorMessage || "حدث خطأ أثناء تحديث تفاصيل الوكيل المعتمد.",
        variant: "destructive",
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-4">
          <Label htmlFor="storage_location">موقع التخزين <span className="text-red-500">*</span></Label>
          <Input type="text" id="storage_location" {...methods.register('storage_location')} />
          {errors.storage_location && <p className="text-red-500 text-sm mt-1">{errors.storage_location.message}</p>}
        </div>
        <div className="mb-4">
          <Label htmlFor="region">المنطقة <span className="text-red-500">*</span></Label>
          <Input type="text" id="region" {...methods.register('region')} />
          {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region.message}</p>}
        </div>
        <div className="mb-4">
          <Label htmlFor="agent_type">نوع الوكيل <span className="text-red-500">*</span></Label>
          <Select onValueChange={(value) => methods.setValue('agent_type', value as "individual" | "company")}>
            <SelectTrigger id="agent_type">
              <SelectValue placeholder="اختر نوع الوكيل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">فردي</SelectItem>
              <SelectItem value="company">شركة</SelectItem>
            </SelectContent>
          </Select>
          {errors.agent_type && <p className="text-red-500 text-sm mt-1">{errors.agent_type.message}</p>}
        </div>
        <div className="mb-4">
          <Label htmlFor="payment_method">طريقة الدفع <span className="text-red-500">*</span></Label>
          <Select onValueChange={(value) => methods.setValue('payment_method', value)}>
            <SelectTrigger id="payment_method">
              <SelectValue placeholder="اختر طريقة الدفع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">نقداً</SelectItem>
              <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
              <SelectItem value="mobile_money">محفظة إلكترونية</SelectItem>
              <SelectItem value="other">أخرى</SelectItem>
            </SelectContent>
          </Select>
          {errors.payment_method && <p className="text-red-500 text-sm mt-1">{errors.payment_method.message}</p>}
        </div>
        <div className="mb-4">
          <Label>عمولات الوظائف (اختياري)</Label>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 border p-3 rounded-md">
                <div className="flex-grow grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <Label htmlFor={`function_specific_commissions.${index}.type`}>نوع العمولة</Label>
                    <Select onValueChange={(value) => methods.setValue(`function_specific_commissions.${index}.type`, value as CommissionType)} defaultValue={field.type}>
                      <SelectTrigger id={`function_specific_commissions.${index}.type`}>
                        <SelectValue placeholder="اختر نوع العمولة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waste_purchase">شراء المخلفات</SelectItem>
                        <SelectItem value="product_sale">بيع المنتجات</SelectItem>
                        <SelectItem value="cash_withdrawal">سحب نقدي</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.function_specific_commissions?.[index]?.type && (
                      <p className="text-red-500 text-sm mt-1">
                        {
                          errors.function_specific_commissions[index].type &&
                          typeof errors.function_specific_commissions[index].type === 'object' &&
                          'message' in errors.function_specific_commissions[index].type
                            ? errors.function_specific_commissions[index].type.message
                            : String(errors.function_specific_commissions[index].type)
                        }
                      </p>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor={`function_specific_commissions.${index}.value`}>القيمة</Label>
                    <Input type="number" id={`function_specific_commissions.${index}.value`} step="0.01" {...methods.register(`function_specific_commissions.${index}.value`)} />
                    {errors.function_specific_commissions?.[index]?.value && (
                      <p className="text-red-500 text-sm mt-1">
                        {
                          errors.function_specific_commissions[index].value &&
                          typeof errors.function_specific_commissions[index].value === 'object' &&
                          'message' in errors.function_specific_commissions[index].value
                            ? errors.function_specific_commissions[index].value.message
                            : String(errors.function_specific_commissions[index].value)
                        }
                      </p>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Label htmlFor={`function_specific_commissions.${index}.unit`}>الوحدة</Label>
                    <Select onValueChange={(value) => methods.setValue(`function_specific_commissions.${index}.unit`, value as CommissionUnit)} defaultValue={field.unit}>
                      <SelectTrigger id={`function_specific_commissions.${index}.unit`}>
                        <SelectValue placeholder="اختر الوحدة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                        <SelectItem value="fixed_amount">مبلغ ثابت</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.function_specific_commissions?.[index]?.unit && (
                      <p className="text-red-500 text-sm mt-1">
                        {
                          errors.function_specific_commissions[index].unit &&
                          typeof errors.function_specific_commissions[index].unit === 'object' &&
                          'message' in errors.function_specific_commissions[index].unit
                            ? errors.function_specific_commissions[index].unit.message
                            : String(errors.function_specific_commissions[index].unit)
                        }
                      </p>
                    )}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-6">
                  <MinusCircledIcon className="h-5 w-5 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={() => append({ type: 'waste_purchase', value: 0, unit: 'percentage' })} className="mt-4">
            <PlusCircledIcon className="h-4 w-4 mr-2" /> إضافة عمولة جديدة
          </Button>
        </div>

        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            السابق
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التفاصيل ومتابعة'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}; 