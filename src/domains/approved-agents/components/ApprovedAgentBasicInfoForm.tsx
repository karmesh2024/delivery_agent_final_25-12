import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/use-toast';
import { useAppDispatch } from '@/store/hooks';
import { createApprovedAgent } from '@/domains/approved-agents/store/approvedAgentsSlice';

interface ApprovedAgentBasicInfoFormProps {
  onSuccess: (agentId: string, passwordSetByAdmin: string) => void;
  onCancel: () => void;
}

// مخطط Zod للخطوة 1: التسجيل الأساسي
const BasicInfoSchema = z.object({
  phone: z.string().min(1, { message: "رقم الهاتف مطلوب" }).regex(/^(\+20|0)?1[0-2][0-9]{8}$/, { message: "صيغة رقم الهاتف غير صحيحة (مصري)" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن لا تقل عن 6 أحرف" }),
  full_name: z.string().min(1, { message: "الاسم الكامل مطلوب" }),
  email: z.string().email({ message: "صيغة البريد الإلكتروني غير صحيحة" }).optional().or(z.literal('')),
});

type FormInputs = z.infer<typeof BasicInfoSchema>;

export const ApprovedAgentBasicInfoForm: React.FC<ApprovedAgentBasicInfoFormProps> = ({ onSuccess, onCancel }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const methods = useForm<FormInputs>({
    resolver: zodResolver(BasicInfoSchema),
    mode: "onChange",
  });

  const { handleSubmit, formState: { errors, isSubmitting } } = methods;

  const onSubmit = async (data: FormInputs) => {
    const payload = {
      phone: data.phone,
      password: data.password,
      full_name: data.full_name,
      email: data.email || undefined,
      // لا توجد بيانات وهمية هنا، سيتم جمعها في الخطوة التالية
    };

    const resultAction = await dispatch(createApprovedAgent(payload));

    if (createApprovedAgent.fulfilled.match(resultAction)) {
      onSuccess(resultAction.payload, data.password); // تمرير كلمة المرور التي تم إنشاؤها
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء معلومات التسجيل الأساسية للوكيل المعتمد.",
        variant: "success",
      });
    } else {
      const errorMessage = resultAction.payload as string;
      toast({
        title: "فشل في إنشاء الوكيل",
        description: errorMessage || "حدث خطأ أثناء إضافة الوكيل المعتمد.",
        variant: "destructive",
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-4">
          <Label htmlFor="phone">رقم الهاتف <span className="text-red-500">*</span></Label>
          <Input type="text" id="phone" {...methods.register('phone')} />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
        </div>
        <div className="mb-4">
          <Label htmlFor="password">كلمة المرور <span className="text-red-500">*</span></Label>
          <Input type="password" id="password" {...methods.register('password')} />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        </div>
        <div className="mb-4">
          <Label htmlFor="full_name">الاسم الكامل <span className="text-red-500">*</span></Label>
          <Input type="text" id="full_name" {...methods.register('full_name')} />
          {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
        </div>
        <div className="mb-4">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input type="email" id="email" {...methods.register('email')} />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'جاري التسجيل...' : 'تسجيل ومتابعة'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}; 