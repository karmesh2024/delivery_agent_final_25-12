import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/use-toast';
import { useAppDispatch } from '@/store/hooks';
import { createApprovedAgent } from '@/domains/approved-agents/store/approvedAgentsSlice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { PlusCircledIcon, MinusCircledIcon } from '@radix-ui/react-icons';
import { AgentCommission, CommissionType, CommissionUnit, ApprovedAgentZone, GeographicZone } from '@/types';
import { approvedAgentService } from '@/domains/approved-agents/api/approvedAgentService';
import { AlertCircle, CheckCircle2, Search, MapPin, X } from 'lucide-react';
import { Switch } from '@/shared/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { v4 as uuidv4 } from 'uuid';
import { SUPABASE_URL } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

interface FullAddApprovedAgentFormProps {
  onSuccess: (agentId: string, passwordSetByAdmin: string) => void;
  onCancel: () => void;
}

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string | null => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return null;
};

// مخطط Zod لتعريف المنطقة المعتمدة
const ApprovedAgentZoneSchema = z.object({
  geographic_zone_id: z.string().min(1, { message: "معرف المنطقة الجغرافية مطلوب" }),
  zone_name: z.string().min(1, { message: "اسم المنطقة مطلوب" }),
  is_active: z.boolean(),
  is_primary: z.boolean(),
});

// مخطط Zod الشامل لجميع خطوات إضافة الوكيل
const FullAgentSchema = z.object({
  // Step 1: Basic Info
  phone: z.string().min(1, { message: "رقم الهاتف مطلوب" }).regex(/^(\+20|0)?1[0-2][0-9]{8}$/, { message: "صيغة رقم الهاتف غير صحيحة (مصري)" }),
  password: z.string().min(6, { message: "كلمة المرور يجب أن لا تقل عن 6 أحرف" }),
  full_name: z.string().min(1, { message: "الاسم الكامل مطلوب" }),
  email: z.string().email({ message: "صيغة البريد الإلكتروني غير صحيحة" }).optional().or(z.literal('')),

  // Step 2: Agent Details & Commissions
  storage_location: z.string().min(1, { message: "موقع التخزين مطلوب" }),
  region: z.string().min(1, { message: "المنطقة مطلوبة" }),
  agent_type: z.enum(["individual", "company"], { message: "نوع الوكيل مطلوب" }),
  payment_method: z.string().min(1, { message: "طريقة الدفع مطلوبة" }),
  function_specific_commissions: z.array(z.object({
    type: z.enum(['waste_purchase', 'product_sale', 'cash_withdrawal', 'other'], { message: "نوع العمولة مطلوب" }),
    value: z.coerce.number().min(0, { message: "قيمة العمولة يجب أن تكون رقمًا موجبًا" }),
    unit: z.enum(['percentage', 'fixed_amount'], { message: "وحدة العمولة مطلوبة" }),
  })).optional(),

  // Step 3: Wallet Details
  initial_balance: z.coerce.number().min(0, { message: "الرصيد الأولي يجب أن يكون رقمًا موجبًا" }).optional(),
  currency: z.string().optional(), // Currency could be dynamic, though SAR is default
  wallet_type: z.string().optional(), // Default to AGENT_WALLET

  // Step 4: Approved Agent Zones
  approved_agent_zones: z.array(ApprovedAgentZoneSchema).default([]),

  // Step 5: Documents and Avatar
  avatar_file: z.any()
    .optional()
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, `حجم الصورة يجب أن لا يتجاوز 5MB.`)
    .refine((file) => !file || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type), `الصيغ المدعومة: JPG, PNG, WEBP, GIF.`),
  document_files: z.array(z.any())
    .optional()
    .refine((files) => !files || files.every(file => file.size <= 10 * 1024 * 1024), `حجم كل مستند يجب أن لا يتجاوز 10MB.`)
    .refine((files) => !files || files.every(file => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)), `صيغ المستندات المدعومة: PDF, JPG, PNG.`), // يمكنك إضافة أنواع أخرى حسب الحاجة
});

// Define a local type for form-specific Approved Agent Zones based on the new schema
type FormApprovedAgentZone = z.infer<typeof ApprovedAgentZoneSchema>;

type FormInputs = z.infer<typeof FullAgentSchema>;

export const FullAddApprovedAgentForm: React.FC<FullAddApprovedAgentFormProps> = ({ onSuccess, onCancel }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [geographicZones, setGeographicZones] = useState<GeographicZone[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [zonesError, setZonesError] = useState<string | null>(null);

  const methods = useForm<FormInputs>({
    resolver: zodResolver(FullAgentSchema),
    mode: "onChange",
    defaultValues: {
      phone: '',
      password: '',
      full_name: '',
      email: '',
      storage_location: '',
      region: '',
      agent_type: 'individual',
      payment_method: 'cash',
      function_specific_commissions: [],
      initial_balance: 0,
      currency: 'SAR',
      wallet_type: 'AGENT_WALLET',
      approved_agent_zones: [],
      avatar_file: undefined,
      document_files: [],
    }
  });

  const { handleSubmit, control, formState: { errors, isValid }, trigger, getValues, setValue } = methods;

  // Use field array for commissions
  const { fields: commissionFields, append: appendCommission, remove: removeCommission } = useFieldArray({
    control,
    name: "function_specific_commissions",
  });

  // Use field array for approved zones, explicitly typing with keyName
  const { fields: zoneFields, append: appendZone, remove: removeZone } = useFieldArray<FormInputs, "approved_agent_zones", "id">({
    control,
    name: "approved_agent_zones",
    keyName: "id", // Ensure a unique key for each item, 'id' is generated by useFieldArray
  });

  useEffect(() => {
    // Load geographic zones for Step 4
    const loadGeographicZones = async () => {
      try {
        const { data, error } = await approvedAgentService.getGeographicZones();
        if (error) throw error;
        setGeographicZones(data ? data.filter(zone => zone.is_active) : []);
      } catch (error) {
        console.error("خطأ أثناء جلب المناطق الجغرافية:", error);
        toast({
          title: "خطأ",
          description: "فشل جلب المناطق الجغرافية",
          variant: "destructive"
        });
      }
    };
    loadGeographicZones();
  }, []);

  const nextStep = async () => {
    let isValidStep = false;
    if (currentStep === 1) {
      isValidStep = await trigger(['phone', 'password', 'full_name', 'email']);
    } else if (currentStep === 2) {
      isValidStep = await trigger(['storage_location', 'region', 'agent_type', 'payment_method', 'function_specific_commissions']);
    } else if (currentStep === 3) {
      isValidStep = await trigger(['initial_balance', 'currency', 'wallet_type']);
    } else if (currentStep === 4) {
      // Use zoneFields directly, as it's guaranteed to be an array by useFieldArray
      if (zoneFields.length === 0) {
        toast({
          title: "بيانات ناقصة",
          description: "يرجى إضافة منطقة واحدة على الأقل.",
          variant: "destructive",
        });
        return false;
      }
      isValidStep = true; // No specific fields to trigger for zones step, validation is in onSubmit
    } else if (currentStep === 5) {
      isValidStep = await trigger(['avatar_file', 'document_files']);
    }

    if (isValidStep) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة قبل المتابعة.",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (data: FormInputs) => {
    if (currentStep !== 5) return; // Ensure submission only happens on the last step (Documents)

    if (!data.approved_agent_zones || data.approved_agent_zones.length === 0) {
      setZonesError("يرجى إضافة منطقة واحدة على الأقل");
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إضافة منطقة واحدة على الأقل.",
        variant: "destructive",
      });
      return;
    } else {
      setZonesError(null);
    }

    setIsSubmittingForm(true);
    let avatarUrl: string | undefined = undefined;
    const agentDocuments: {
      document_type: string;
      document_url: string;
      verification_status: 'pending' | 'approved' | 'rejected';
    }[] = [];

    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized.');
      }
      const supabaseClient = supabase; // Local variable for supabase after null check

      let filePath: string;

      // Upload avatar file if exists
      if (data.avatar_file && data.avatar_file.length > 0) {
        const avatarFile = data.avatar_file[0];
        filePath = `avatars/${data.phone}_${uuidv4()}.${avatarFile.name.split('.').pop()}`;
        const { data: uploadedAvatarData, error: avatarUploadError } = await supabaseClient.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (avatarUploadError) throw avatarUploadError;
        if (uploadedAvatarData) {
          avatarUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${uploadedAvatarData.path}`;
          console.log("Avatar uploaded successfully:", avatarUrl);
        }
      }

      // Upload other document files
      if (data.document_files && data.document_files.length > 0) {
        for (const file of data.document_files) {
          filePath = `documents/${data.phone}_${uuidv4()}.${file.name.split('.').pop()}`;
          const { data: uploadedDocumentData, error: documentUploadError } = await supabaseClient.storage
            .from('documents')
            .upload(filePath, file);

          if (documentUploadError) throw documentUploadError;
          if (uploadedDocumentData) {
            const documentUrl = `${SUPABASE_URL}/storage/v1/object/public/documents/${uploadedDocumentData.path}`;
            agentDocuments.push({
              document_type: file.name.split('.').shift() || 'other', // Use filename as type or 'other'
              document_url: documentUrl,
              verification_status: 'pending',
            });
            console.log("Document uploaded successfully:", documentUrl);
          }
        }
      }

      const payload = {
        phone: data.phone,
        password: data.password,
        full_name: data.full_name,
        email: data.email || undefined,
        storage_location: data.storage_location,
        region: data.region,
        agent_type: data.agent_type,
        payment_method: data.payment_method,
        function_specific_commissions: data.function_specific_commissions || [],
        initial_balance: data.initial_balance ?? 0,
        currency: data.currency ?? "SAR",
        wallet_type: data.wallet_type ?? "AGENT_WALLET",
        approved: false, // Default to false upon creation
        approved_agent_zones: data.approved_agent_zones.map(zone => ({
          geographic_zone_id: zone.geographic_zone_id,
          zone_name: zone.zone_name,
          is_active: zone.is_active,
          is_primary: zone.is_primary,
        })),
        avatar_url: avatarUrl, // Add avatar URL to payload
        agent_documents: agentDocuments, // Add documents to payload
      };

      const resultAction = await dispatch(createApprovedAgent(payload));

      if (createApprovedAgent.fulfilled.match(resultAction)) {
        onSuccess(resultAction.payload, data.password);
        toast({
          title: "تم بنجاح",
          description: "تم إنشاء الوكيل المعتمد بنجاح.",
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
    } catch (error) {
      console.error("خطأ أثناء إضافة الوكيل:", error);
      toast({
        title: "فشل في إضافة الوكيل",
        description: "حدث خطأ أثناء إضافة الوكيل المعتمد.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const filteredGeographicZones = geographicZones.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (zone.description && zone.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddGeographicZoneFromTable = (zoneId: string, isPrimary: boolean, zoneName: string) => {
    const existingZone = zoneFields.find(field => field.geographic_zone_id === zoneId);
    if (existingZone) {
      toast({
        title: "خطأ",
        description: "المنطقة مضافة بالفعل.",
        variant: "destructive",
      });
      return;
    }

    // If making this zone primary, set all other existing primary zones to non-primary
    if (isPrimary) {
      const currentZones = getValues('approved_agent_zones') || [];
      currentZones.forEach((zone, index) => {
        if (zone.is_primary) {
          setValue(`approved_agent_zones.${index}.is_primary`, false);
        }
      });
    }

    appendZone({
      geographic_zone_id: zoneId,
      zone_name: zoneName,
      is_active: true, // Default to active
      is_primary: isPrimary,
    });
    toast({
      title: "تم الإضافة",
      description: `تم إضافة منطقة ${zoneName} بنجاح كمنطقة ${isPrimary ? 'أساسية' : 'ثانوية'}.`,
      variant: "success",
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div
            className={`w-1/5 text-center cursor-pointer pb-2 border-b-2 ${currentStep === 1 ? 'border-blue-500 text-blue-500 font-semibold' : 'border-gray-300 text-gray-500'}`}
            onClick={() => setCurrentStep(1)}
          >
            المعلومات الأساسية
          </div>
          <div
            className={`w-1/5 text-center cursor-pointer pb-2 border-b-2 ${currentStep === 2 ? 'border-blue-500 text-blue-500 font-semibold' : 'border-gray-300 text-gray-500'}`}
            onClick={() => setCurrentStep(2)}
          >
            التفاصيل
          </div>
          <div
            className={`w-1/5 text-center cursor-pointer pb-2 border-b-2 ${currentStep === 3 ? 'border-blue-500 text-blue-500 font-semibold' : 'border-gray-300 text-gray-500'}`}
            onClick={() => setCurrentStep(3)}
          >
            المحفظة
          </div>
          <div
            className={`w-1/5 text-center cursor-pointer pb-2 border-b-2 ${currentStep === 4 ? 'border-blue-500 text-blue-500 font-semibold' : 'border-gray-300 text-gray-500'}`}
            onClick={() => setCurrentStep(4)}
          >
            المناطق
          </div>
          <div
            className={`w-1/5 text-center cursor-pointer pb-2 border-b-2 ${currentStep === 5 ? 'border-blue-500 text-blue-500 font-semibold' : 'border-gray-300 text-gray-500'}`}
            onClick={() => setCurrentStep(5)}
          >
            المستندات
          </div>
          <div
            className={`w-1/5 text-center cursor-pointer pb-2 border-b-2 ${currentStep === 6 ? 'border-blue-500 text-blue-500 font-semibold' : 'border-gray-300 text-gray-500'}`}
            onClick={() => setCurrentStep(6)}
          >
            الملخص
          </div>
        </div>

        {currentStep === 1 && (
          // Step 1: Basic Information
          (<div>
            <h2 className="text-xl font-semibold mb-4">الخطوة 1: معلومات التسجيل الأساسية</h2>
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
            <div className="flex justify-end mt-6">
              <Button type="button" onClick={nextStep}>
                التالي
              </Button>
            </div>
          </div>)
        )}

        {currentStep === 2 && (
          // Step 2: Agent Details & Commissions
          (<div>
            <h2 className="text-xl font-semibold mb-4">الخطوة 2: تفاصيل الوكيل والعمولات</h2>
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
              <Select onValueChange={(value) => methods.setValue('agent_type', value as "individual" | "company")} defaultValue={getValues('agent_type')}>
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
              <Select onValueChange={(value) => methods.setValue('payment_method', value)} defaultValue={getValues('payment_method')}>
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
                {commissionFields.map((field, index) => (
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
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCommission(index)} className="mt-6">
                      <MinusCircledIcon className="h-5 w-5 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={() => appendCommission({ type: 'waste_purchase', value: 0, unit: 'percentage' })} className="mt-4">
                <PlusCircledIcon className="h-4 w-4 mr-2" /> إضافة عمولة جديدة
              </Button>
            </div>
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={prevStep}>
                السابق
              </Button>
              <Button type="button" onClick={nextStep}>
                التالي
              </Button>
            </div>
          </div>)
        )}

        {currentStep === 3 && (
          // Step 3: Wallet Details
          (<div>
            <h2 className="text-xl font-semibold mb-4">الخطوة 3: تفاصيل المحفظة</h2>
            <div className="mb-4">
              <Label htmlFor="initial_balance">الرصيد الأولي للمحفظة</Label>
              <Input type="number" id="initial_balance" step="0.01" {...methods.register('initial_balance')} />
              {errors.initial_balance && <p className="text-red-500 text-sm mt-1">{errors.initial_balance.message}</p>}
            </div>
            <div className="mb-4">
              <Label htmlFor="currency">العملة</Label>
              <Select onValueChange={(value) => methods.setValue('currency', value)} defaultValue={getValues('currency')}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="اختر العملة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EGP">EGP</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>}
            </div>
            <div className="mb-4">
              <Label htmlFor="wallet_type">نوع المحفظة</Label>
              <Select onValueChange={(value) => methods.setValue('wallet_type', value)} defaultValue={getValues('wallet_type')}>
                <SelectTrigger id="wallet_type">
                  <SelectValue placeholder="اختر نوع المحفظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGENT_WALLET">محفظة وكيل</SelectItem>
                  <SelectItem value="CUSTOMER_WALLET">محفظة عميل</SelectItem>
                  <SelectItem value="COMPANY_WALLET">محفظة شركة</SelectItem>
                </SelectContent>
              </Select>
              {errors.wallet_type && <p className="text-red-500 text-sm mt-1">{errors.wallet_type.message}</p>}
            </div>
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={prevStep}>
                السابق
              </Button>
              <Button type="button" onClick={nextStep}>
                التالي
              </Button>
            </div>
          </div>)
        )}

        {currentStep === 4 && (
          // Step 4: Approved Agent Zones & Final Submission
          (<div>
            <h2 className="text-xl font-semibold mb-4">الخطوة 4: إدارة مناطق الوكيل المعتمد</h2>
            {zonesError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm flex items-center mb-4">
                <AlertCircle className="h-5 w-5 mr-2" />
                {zonesError}
              </div>
            )}
            <Card>
              <CardHeader>
                <CardTitle>مناطق عمل الوكيل المعتمد</CardTitle>
                <CardDescription>إدارة المناطق التي يغطيها الوكيل المعتمد.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label htmlFor="search-zone">البحث عن مناطق جغرافية لإضافتها</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="search-zone"
                      placeholder="ابحث بالاسم أو الوصف..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-grow"
                    />
                    <Search className="h-4 w-4 text-gray-500" />
                  </div>
                </div>

                <div className="h-64 overflow-y-auto border rounded-md mb-4">
                  {filteredGeographicZones.length > 0 ? (
                    filteredGeographicZones.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                        <div>
                          <p className="font-semibold">{zone.name}</p>
                          <p className="text-sm text-gray-500">{zone.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddGeographicZoneFromTable(zone.id, false, zone.name)}
                            disabled={zoneFields.some(field => field.geographic_zone_id === zone.id)}
                          >
                            <PlusCircledIcon className="h-4 w-4 mr-1" /> إضافة (ثانوية)
                          </Button>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => handleAddGeographicZoneFromTable(zone.id, true, zone.name)}
                            disabled={zoneFields.some(field => field.geographic_zone_id === zone.id)}
                          >
                            <MapPin className="h-4 w-4 mr-1" /> إضافة (أساسية)
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 p-4">لا توجد مناطق جغرافية متاحة.</p>
                  )}
                </div>

                <h3 className="text-lg font-semibold mb-2">المناطق المضافة للوكيل:</h3>
                <div className="space-y-3">
                  {zoneFields.length > 0 ? (
                    zoneFields.map((field, index) => (
                      <div key={field.id} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                        <div>
                          <p className="font-semibold">{field.zone_name} {field.is_primary && <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">أساسية</span>}</p>
                          <p className="text-sm text-gray-600">
                            {field.is_active ? 'نشطة' : 'غير نشطة'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`zone-${field.id}-primary`} className="text-sm">أساسية</Label>
                          <Switch
                            id={`zone-${field.id}-primary`}
                            checked={field.is_primary}
                            onCheckedChange={(checked) => {
                              // Only one primary zone allowed
                              if (checked) {
                                zoneFields.forEach((z, i) => {
                                  if (i !== index) {
                                    setValue(`approved_agent_zones.${i}.is_primary`, false);
                                  }
                                });
                              }
                              setValue(`approved_agent_zones.${index}.is_primary`, checked);
                            }}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeZone(index)}>
                            <X className="h-5 w-5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 p-4">لم يتم إضافة أي مناطق بعد.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between mt-6">
              <Button type="button" variant="outline" onClick={prevStep}>
                السابق
              </Button>
              <Button type="submit" disabled={isSubmittingForm}>
                {isSubmittingForm ? 'جاري إنشاء الوكيل...' : 'تأكيد وإنهاء'}
              </Button>
            </div>
          </div>)
        )}

        {currentStep === 5 && (
          // Step 5: Documents and Avatar Upload
          (<div dir="rtl">
            <h2 className="text-xl font-semibold mb-4">الخطوة 5: المستندات وصورة الأفاتار</h2>
            <div className="mb-4">
              <Label htmlFor="avatar_file">صورة الأفاتار (اختياري)</Label>
              <Input type="file" id="avatar_file" accept="image/*" {...methods.register('avatar_file')} />
              {getErrorMessage(errors.avatar_file) && <p className="text-red-500 text-sm mt-1">{getErrorMessage(errors.avatar_file)}</p>}
            </div>
            <div className="mb-4">
              <Label htmlFor="document_files">مستندات أخرى (اختياري - PDF, صور)</Label>
              <Input type="file" id="document_files" multiple accept="application/pdf,image/*" {...methods.register('document_files')} />
              {getErrorMessage(errors.document_files) && <p className="text-red-500 text-sm mt-1">{getErrorMessage(errors.document_files)}</p>}
            </div>
          </div>)
        )}

        <div className="flex justify-between mt-6">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmittingForm}>
              السابق
            </Button>
          )}
          {currentStep < 5 && (
            <Button type="button" onClick={nextStep} disabled={isSubmittingForm}>
              التالي
            </Button>
          )}
          {currentStep === 5 && (
            <Button type="submit" disabled={isSubmittingForm}>
              {isSubmittingForm ? 'جاري الإضافة...' : 'إضافة الوكيل'}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}; 