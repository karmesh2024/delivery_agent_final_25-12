'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useAppSelector, RootState } from '@/store/index';
import SectionIntro from '@/domains/management-center/components/SectionIntro';
import { FiDollarSign, FiInfo } from 'react-icons/fi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { SupplierFinancialDetails, PaymentType } from '../../types';

// مكون الحقل الإلزامي
const RequiredIndicator = () => (
  <span className="text-red-500 mr-1">*</span>
);

// واجهة نوع طرق الدفع
// PaymentType is already defined in ../types.ts, so no need to redefine here
// export interface PaymentType {
//   id: number;
//   type_name: string;
//   type_name_ar: string;
// }

// Removed the local SupplierFinancialDetails interface to use the one from ../../types.ts

interface FinancialDetailsTabProps {
  initialData: Partial<SupplierFinancialDetails>;
  supplierId?: string;
  supplierName?: string;
  supplierCode?: string;
  onChange: (data: Partial<SupplierFinancialDetails>) => void;
  onValidityChange: (isValid: boolean) => void;
}

// Helper for deep equality check
function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || obj1 === null ||
      typeof obj2 !== 'object' || obj2 === null) {
    return false;
  }

  // Type assertion to treat them as objects with string keys
  const typedObj1 = obj1 as { [key: string]: unknown };
  const typedObj2 = obj2 as { [key: string]: unknown };

  const keys1 = Object.keys(typedObj1);
  const keys2 = Object.keys(typedObj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    // Ensure both objects have the key and values are deep equal
    if (!keys2.includes(key) || !deepEqual(typedObj1[key], typedObj2[key])) {
      return false;
    }
  }

  return true;
}

const FinancialDetailsTab: React.FC<FinancialDetailsTabProps> = ({
  initialData,
  supplierId,
  supplierName,
  supplierCode,
  onChange,
  onValidityChange,
}) => {
  const paymentTypes = useAppSelector((state: RootState) => state.referenceData.paymentTypes || []);
  
  // Ref to store the *last processed* initialData prop
  const lastProcessedInitialDataRef = useRef<Partial<SupplierFinancialDetails>>({}); // Changed type

  const [financialDetails, setFinancialDetails] = useState<Partial<SupplierFinancialDetails>>(() => { // Changed type
    const combinedData = { ...initialData, supplier_id: supplierId ? parseInt(supplierId) : undefined }; // initialData is already Partial<SupplierFinancialDetails>
    lastProcessedInitialDataRef.current = combinedData; // Set initial processed data
    return combinedData;
  });

  // Effect to update internal state ONLY when the *content* of initialData changes
  useEffect(() => {
    const currentCombinedData = { ...initialData, supplier_id: supplierId ? parseInt(supplierId) : undefined }; // initialData is already Partial<SupplierFinancialDetails>
    
    // Check if the new initialData (content-wise) is different from what was last processed
    if (!deepEqual(lastProcessedInitialDataRef.current, currentCombinedData)) {
      setFinancialDetails(currentCombinedData);
      lastProcessedInitialDataRef.current = currentCombinedData; // Update the ref to the new processed data
    }
  }, [initialData, supplierId]); // Dependencies are only initialData and supplierId

  // Ref to track the last data reported via onChange
  const lastReportedFinancialDetailsRef = useRef<Partial<SupplierFinancialDetails> | null>(null); // Changed type

  // Effect to report changes to the parent
  useEffect(() => {
    // Only call onChange if the financialDetails state has actually changed from what was last reported
    if (!deepEqual(financialDetails, lastReportedFinancialDetailsRef.current)) {
      onChange(financialDetails);
      lastReportedFinancialDetailsRef.current = financialDetails; // Update the ref
    }
    // Call onValidityChange only if it's truly dynamic or needs to be set once
    onValidityChange(true); // Financial information is always valid, as it's not mandatory
  }, [financialDetails, onChange, onValidityChange]); // financialDetails is a dependency, as its changes should trigger reporting

  // Handler for internal field changes
  const handleChange = (field: keyof SupplierFinancialDetails, value: unknown) => {
    setFinancialDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <div className="space-y-6">
      <SectionIntro
        title="التفاصيل المالية"
        description="يرجى إدخال كافة المعلومات المالية للمورد بدقة. هذه البيانات ضرورية لضمان التعاملات المالية السليمة وتتبع المدفوعات."
        example="مثال إداري: يُعد إدخال الحد الائتماني وشروط الدفع أمراً حاسماً لتقييم المخاطر المالية وتحديد سيولة المورد. تأكد من مطابقة البيانات مع سجلات الشركة."
        icon={FiDollarSign}
      />
      {/* طرق الدفع */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preferred_payment_type_id" className="flex items-center">
            طريقة الدفع المفضلة
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">يحدد طريقة الدفع التي يفضلها المورد (مثل تحويل بنكي، دفع نقدي، إلخ).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Select
            value={financialDetails.preferred_payment_type_id?.toString() || ''}
            onValueChange={(value) => handleChange('preferred_payment_type_id', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر طريقة الدفع" />
            </SelectTrigger>
            <SelectContent>
              {paymentTypes.map((type: PaymentType) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.type_name_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="secondary_payment_type_id" className="flex items-center">
            طريقة الدفع البديلة
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">يوفر خيارًا ثانيًا لطريقة الدفع، في حال لم تكن الطريقة المفضلة متاحة أو مناسبة.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Select
            value={financialDetails.secondary_payment_type_id?.toString() || ''}
            onValueChange={(value) => handleChange('secondary_payment_type_id', value ? parseInt(value) : undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر طريقة الدفع" />
            </SelectTrigger>
            <SelectContent>
              {paymentTypes.map((type: PaymentType) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.type_name_ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* الحدود المالية والتوازن */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="credit_limit" className="flex items-center">
            الحد الائتماني
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">الحد الائتماني الممنوح للمورد (المبلغ الأقصى الذي يمكن للمورد أن يشتري به على الحساب).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="credit_limit"
            type="number"
            placeholder="مثال: 10000.00"
            value={financialDetails.credit_limit || ''}
            onChange={(e) => handleChange('credit_limit', parseFloat(e.target.value) || undefined)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="current_balance" className="flex items-center">
            الرصيد الحالي
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">الرصيد النقدي الحالي للمورد في حساباتك.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="current_balance"
            type="number"
            placeholder="مثال: 50000.00"
            value={financialDetails.current_balance || ''}
            onChange={(e) => handleChange('current_balance', parseFloat(e.target.value) || undefined)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="outstanding_amount" className="flex items-center">
            المبلغ المستحق
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">إجمالي المبلغ المستحق على المورد.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="outstanding_amount"
            type="number"
            placeholder="مثال: 25000.00"
            value={financialDetails.outstanding_amount || ''}
            onChange={(e) => handleChange('outstanding_amount', parseFloat(e.target.value) || undefined)}
          />
        </div>
      </div>
      
      {/* شروط الدفع والأقساط والخصومات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payment_terms_days" className="flex items-center">
            شروط الدفع (أيام)
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">عدد الأيام المسموح بها للمورد لتسديد الفواتير.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="payment_terms_days"
            type="number"
            placeholder="مثال: 30"
            value={financialDetails.payment_terms_days || ''}
            onChange={(e) => handleChange('payment_terms_days', parseInt(e.target.value) || undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="installment_months" className="flex items-center">
            عدد أشهر الأقساط
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">عدد الأشهر التي يتم خلالها سداد المبلغ المقسط.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="installment_months"
            type="number"
            placeholder="مثال: 12"
            value={financialDetails.installment_months || ''}
            onChange={(e) => handleChange('installment_months', parseInt(e.target.value) || undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="installment_amount" className="flex items-center">
            قيمة القسط
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">قيمة الدفعة الشهرية (القسط) التي يدفعها المورد.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="installment_amount"
            type="number"
            placeholder="مثال: 1000.00"
            value={financialDetails.installment_amount || ''}
            onChange={(e) => handleChange('installment_amount', parseFloat(e.target.value) || undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_percentage" className="flex items-center">
            نسبة الخصم
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">النسبة المئوية للخصم الممنوح للمورد عند الدفع المبكر.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="discount_percentage"
            type="number"
            placeholder="مثال: 2.5"
            value={financialDetails.discount_percentage || ''}
            onChange={(e) => handleChange('discount_percentage', parseFloat(e.target.value) || undefined)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="late_fee_percentage" className="flex items-center">
            نسبة الغرامة على التأخير
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">النسبة المئوية للغرامة المفروضة على المورد في حال التأخر عن السداد.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="late_fee_percentage"
            type="number"
            placeholder="مثال: 5.0"
            value={financialDetails.late_fee_percentage || ''}
            onChange={(e) => handleChange('late_fee_percentage', parseFloat(e.target.value) || undefined)}
          />
        </div>
      </div>
      
      {/* معلومات البنك */}
      <h3 className="text-lg font-medium mt-8 mb-4">المعلومات البنكية</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bank_name" className="flex items-center">
            اسم البنك
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">اسم البنك الذي يتعامل معه المورد.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="bank_name"
            type="text"
            placeholder="مثال: بنك الاسكندرية"
            value={financialDetails.bank_name || ''}
            onChange={(e) => handleChange('bank_name', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bank_account_number" className="flex items-center">
            رقم الحساب
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">رقم الحساب البنكي للمورد.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="bank_account_number"
            type="text"
            placeholder="مثال: 1234567899"
            value={financialDetails.bank_account_number || ''}
            onChange={(e) => handleChange('bank_account_number', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="iban" className="flex items-center">
            (رقم الأيبان) IBAN
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">الرقم المصرفي الدولي للحساب (IBAN) للمورد.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="iban"
            type="text"
            placeholder="مثال: SA1234567890123456789012"
            value={financialDetails.iban || ''}
            onChange={(e) => handleChange('iban', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="swift_code" className="flex items-center">
            (رمز السويفت) SWIFT
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">رمز السويفت (SWIFT code) الخاص ببنك المورد.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="swift_code"
            type="text"
            placeholder="مثال: RIYSAJA"
            value={financialDetails.swift_code || ''}
            onChange={(e) => handleChange('swift_code', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="account_holder_name" className="flex items-center">
            اسم صاحب الحساب
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">اسم صاحب الحساب البنكي للمورد.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="account_holder_name"
            type="text"
            placeholder="مثال: علي ابراهيم"
            value={financialDetails.account_holder_name || ''}
            onChange={(e) => handleChange('account_holder_name', e.target.value)}
          />
        </div>
      </div>
      
      {/* الضمانات والتأمينات */}
      <h3 className="text-lg font-medium mt-8 mb-4">الضمانات والتأمينات</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bank_guarantee_amount" className="flex items-center">
            قيمة الضمان البنكي
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">قيمة الضمان البنكي المقدم من المورد.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="bank_guarantee_amount"
            type="number"
            placeholder="مثال: 50000.00"
            value={financialDetails.bank_guarantee_amount || ''}
            onChange={(e) => handleChange('bank_guarantee_amount', parseFloat(e.target.value) || undefined)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="guarantee_expiry_date" className="flex items-center">
            تاريخ انتهاء الضمان
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <FiInfo className="h-4 w-4 text-gray-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">تاريخ انتهاء صلاحية الضمان البنكي.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="guarantee_expiry_date"
            type="date"
            placeholder="mm/dd/yyyy"
            value={financialDetails.guarantee_expiry_date || ''}
            onChange={(e) => handleChange('guarantee_expiry_date', e.target.value || null)}
          />
        </div>
      </div>
    </div>
  );
};

export default FinancialDetailsTab; 