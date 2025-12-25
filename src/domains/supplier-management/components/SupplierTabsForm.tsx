'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store/index';
import { addSupplier, updateSupplier } from '../store/supplierSlice';
import { fetchAllReferenceData } from '../store/referenceDataSlice';
import { Supplier } from '../types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { FiUser, FiDollarSign, FiPackage, FiFileText, FiPhoneCall, FiStar } from 'react-icons/fi';
import BasicInfoTab from './tabs/BasicInfoTab';
import FinancialDetailsTab from './tabs/FinancialDetailsTab';
import ProductOfferingsTab from './tabs/ProductOfferingsTab';
import DocumentsTab from './tabs/DocumentsTab';
import EvaluationsTab from './tabs/EvaluationsTab';
import ContactPersonsTab from './tabs/ContactPersonsTab';
import { ProductOffering } from './tabs/ProductOfferingsTab';
import { SupplierDocument } from '../types';
import { SupplierEvaluation } from './tabs/EvaluationsTab';
import { useRouter } from 'next/navigation';
import { SupplierContactPerson } from '../types';

interface SupplierTabsFormProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

// تعريف نوع البيانات المجمعة
interface FormDataType {
  basicInfo: Partial<Supplier>;
  financialDetails: Record<string, unknown>;
  productOfferings: ProductOffering[];
  documents: SupplierDocument[];
  contactPersons: SupplierContactPerson[];
  evaluations: SupplierEvaluation[];
}

// مكون الحقل الإلزامي
const RequiredIndicator = () => (
  <span className="text-red-500 mr-1">*</span>
);

const SupplierTabsForm: React.FC<SupplierTabsFormProps> = ({ isOpen, onClose, supplier }) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.supplier);
  const { regions, supplierTypes, documentTypes, loading: referenceDataLoading, errorStates } = useAppSelector((state) => state.referenceData);
  const { currentAdmin } = useAppSelector((state) => state.auth);
  const router = useRouter();
  
  // Current user ID for evaluations
  const currentUserId = currentAdmin?.id ? parseInt(currentAdmin.id) : 0;
  
  // مرجع ثابت للمصفوفات الفارغة لمنع إعادة العرض غير الضرورية
  const stableEmptyDocuments = useRef<SupplierDocument[]>([]).current;
  const stableEmptyContactPersons = useRef<SupplierContactPerson[]>([]).current;
  const stableEmptyProductOfferings = useRef<ProductOffering[]>([]).current;
  const stableEmptyEvaluations = useRef<SupplierEvaluation[]>([]).current;

  // تتبع التاب النشط
  const [activeTab, setActiveTab] = useState('basic-info');
  
  // New states for stepper and progress bar
  const [stepCompletion, setStepCompletion] = useState({
    basicInfo: false,
    financialDetails: false,
    documents: false,
    productOfferings: false,
    contactPersons: false,
    evaluations: false,
  });
  const [overallProgress, setOverallProgress] = useState(0);

  // بيانات النموذج المجمعة
  const [formData, setFormData] = useState<FormDataType>({
    basicInfo: {},
    financialDetails: {},
    productOfferings: stableEmptyProductOfferings,
    documents: stableEmptyDocuments,
    contactPersons: stableEmptyContactPersons,
    evaluations: stableEmptyEvaluations
  });
  
  // حالة صلاحية النموذج
  const [isFormValid, setIsFormValid] = useState({
    basicInfo: false,
    financialDetails: true,
    productOfferings: true,
    documents: true,
    contactPersons: true,
    evaluations: true
  });
  
  // تحميل البيانات المرجعية عند فتح النموذج
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAllReferenceData());
    }
  }, [isOpen, dispatch]);
  
  // تهيئة البيانات عند فتح النموذج للتعديل
  useEffect(() => {
    if (supplier) {
      setFormData(prevData => {
        // تحقق مما إذا كانت المستندات قد تغيرت بالفعل
        const newDocuments = supplier.documents || stableEmptyDocuments;
        const newContactPersons = supplier.contactPersons || stableEmptyContactPersons;

        // إذا لم يتغير المورد ولم تتغير المستندات وجهات الاتصال، لا تقم بتحديث الحالة
        if (
          prevData.basicInfo.id === supplier.id &&
          prevData.documents === newDocuments &&
          prevData.contactPersons === newContactPersons
        ) {
          return prevData;
        }

        return {
          ...prevData,
          basicInfo: {
            id: supplier.id,
            name: supplier.name || '',
            name_ar: supplier.name_ar || '',
            supplier_code: supplier.supplier_code || '',
            region_id: supplier.region_id,
            supplier_type_id: supplier.supplier_type_id,
            contact_person: supplier.contact_person || '',
            contact_person_ar: supplier.contact_person_ar || '',
            contact_phone: supplier.contact_phone || '',
            contact_phone_secondary: supplier.contact_phone_secondary || '',
            email: supplier.email || '',
            website: supplier.website || '',
            address: supplier.address || '',
            address_ar: supplier.address_ar || '',
            city: supplier.city || '',
            postal_code: supplier.postal_code || '',
            commercial_register: supplier.commercial_register || '',
            tax_number: supplier.tax_number || '',
            vat_number: supplier.vat_number || '',
            rating: supplier.rating,
            product_description: supplier.product_description || '',
            is_active: supplier.is_active,
            is_approved: supplier.is_approved,
          },
          financialDetails: {},
          productOfferings: stableEmptyProductOfferings,
          documents: newDocuments, // استخدام المستندات الجديدة أو المرجع الثابت
          contactPersons: newContactPersons, // استخدام جهات الاتصال الجديدة أو المرجع الثابت
          evaluations: stableEmptyEvaluations
        };
      });
      
      // تهيئة صلاحية النموذج
      setIsFormValid({
        basicInfo: true,
        financialDetails: true,
        productOfferings: true,
        documents: true,
        contactPersons: true,
        evaluations: true
      });
    } else {
      // تهيئة نموذج فارغ للإضافة
      setFormData(prevData => {
        // إذا كان المورد جديدًا ولا يوجد ID، ولم تتغير المستندات وجهات الاتصال، لا تقم بتحديث الحالة
        if (
          prevData.basicInfo.id === undefined &&
          prevData.documents === stableEmptyDocuments &&
          prevData.contactPersons === stableEmptyContactPersons
        ) {
          return prevData;
        }

        return {
          ...prevData,
          basicInfo: {
            name: '',
            name_ar: '',
            supplier_code: '',
            region_id: undefined,
            supplier_type_id: 0,
            contact_person: '',
            contact_person_ar: '',
            contact_phone: '',
            contact_phone_secondary: '',
            email: '',
            website: '',
            address: '',
            address_ar: '',
            city: '',
            postal_code: '',
            commercial_register: '',
            tax_number: '',
            vat_number: '',
            rating: undefined,
            product_description: '',
            is_active: true,
            is_approved: false,
          },
          financialDetails: {},
          productOfferings: stableEmptyProductOfferings,
          documents: stableEmptyDocuments,
          contactPersons: stableEmptyContactPersons,
          evaluations: stableEmptyEvaluations
        };
      });
      
      // إعادة تعيين صلاحية النموذج
      setIsFormValid({
        basicInfo: false,
        financialDetails: true,
        productOfferings: true,
        documents: true,
        contactPersons: true,
        evaluations: true
      });
    }
  }, [supplier, stableEmptyDocuments, stableEmptyContactPersons, stableEmptyProductOfferings, stableEmptyEvaluations]);
  
  // تحديث البيانات من التابات المختلفة - مثبتة باستخدام useCallback
  const updateFormData = useCallback((tabName: keyof FormDataType, data: ProductOffering[] | SupplierDocument[] | SupplierEvaluation[] | Partial<Supplier> | Record<string, unknown> | SupplierContactPerson[]) => {
    setFormData(prevData => ({
      ...prevData,
      [tabName]: data
    }));
  }, []);
  
  // تحديث حالة الصلاحية من التابات المختلفة
  const updateFormValidity = useCallback((tabName: keyof typeof isFormValid, isValid: boolean) => {
    setIsFormValid(prevValidity => ({
      ...prevValidity,
      [tabName]: isValid
    }));
  }, []);
  
  // التحقق من صلاحية النموذج بالكامل
  const isEntireFormValid = useCallback(() => {
    return Object.values(isFormValid).every(valid => valid === true);
  }, [isFormValid]);

  // Calculate overall progress based on step completion (simplified for now)
  useEffect(() => {
    const relevantSteps = ['basicInfo', 'financialDetails', 'documents', 'productOfferings', 'contactPersons', 'evaluations'];
    const completedRelevantSteps = relevantSteps.filter(step => stepCompletion[step as keyof typeof stepCompletion]).length;
    const totalRelevantSteps = relevantSteps.length;
    
    if (totalRelevantSteps > 0) {
      setOverallProgress(Math.round((completedRelevantSteps / totalRelevantSteps) * 100));
    } else {
      setOverallProgress(0);
    }
  }, [stepCompletion]);
  
  // معالجة الإرسال
  const handleSubmit = useCallback(async () => {
    if (!isEntireFormValid()) {
      // التبديل إلى أول تاب غير صالح
      const invalidTab = Object.entries(isFormValid).find(([_, valid]) => !valid);
      if (invalidTab) {
        setActiveTab(invalidTab[0]);
        toast.error('يرجى ملء جميع الحقول الإلزامية قبل الإرسال');
      }
      return;
    }
    
    try {
      // تجميع جميع البيانات من التابات المختلفة
      const supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'approved_by' | 'approved_at'> = {
        name: formData.basicInfo.name || '',
        supplier_code: formData.basicInfo.supplier_code || '',
        supplier_type_id: formData.basicInfo.supplier_type_id || 0,
        name_ar: formData.basicInfo.name_ar || '',
        region_id: formData.basicInfo.region_id,
        contact_person: formData.basicInfo.contact_person || '',
        contact_person_ar: formData.basicInfo.contact_person_ar || '',
        contact_phone: formData.basicInfo.contact_phone || '',
        contact_phone_secondary: formData.basicInfo.contact_phone_secondary || '',
        email: formData.basicInfo.email || '',
        website: formData.basicInfo.website || '',
        address: formData.basicInfo.address || '',
        address_ar: formData.basicInfo.address_ar || '',
        city: formData.basicInfo.city || '',
        postal_code: formData.basicInfo.postal_code || '',
        commercial_register: formData.basicInfo.commercial_register || '',
        tax_number: formData.basicInfo.tax_number || '',
        vat_number: formData.basicInfo.vat_number || '',
        rating: formData.basicInfo.rating,
        product_description: formData.basicInfo.product_description || '',
        is_active: formData.basicInfo.is_active || false,
        is_approved: formData.basicInfo.is_approved || false,
      };
      
      if (supplier && supplier.id) {
        // وضع التعديل
        await dispatch(updateSupplier({ id: supplier.id, supplier: supplierData })).unwrap();
        toast.success('تم تحديث المورد بنجاح!');
      } else {
        // وضع الإضافة
        await dispatch(addSupplier(supplierData)).unwrap();
        toast.success('تم إضافة المورد بنجاح!');
      }
      onClose();
    } catch (err: unknown) {
      toast.error(`حدث خطأ: ${(err as Error).message}`);
    }
  }, [dispatch, formData, isEntireFormValid, isFormValid, onClose, supplier]);

  // ===================== Navigation Handlers =====================

  const nextTab = useCallback(() => {
    const tabs = [
      'basic-info',
      'financial-details',
      'product-offerings',
      'documents',
      'contact-persons',
      'evaluations',
    ];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  }, [activeTab]);

  const prevTab = useCallback(() => {
    const tabs = [
      'basic-info',
      'financial-details',
      'product-offerings',
      'documents',
      'contact-persons',
      'evaluations',
    ];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  }, [activeTab]);

  // Memoize props to prevent unnecessary re-renders
  const basicInfoProps = useMemo(() => ({
    initialData: formData.basicInfo,
    onChange: (data: Partial<Supplier>) => updateFormData('basicInfo', data),
    onValidityChange: (isValid: boolean) => updateFormValidity('basicInfo', isValid)
  }), [formData.basicInfo, updateFormData, updateFormValidity]);

  const financialDetailsProps = useMemo(() => ({
    initialData: formData.financialDetails,
    onChange: (data: Record<string, unknown>) => updateFormData('financialDetails', data),
    onValidityChange: (isValid: boolean) => updateFormValidity('financialDetails', isValid)
  }), [formData.financialDetails, updateFormData, updateFormValidity]);

  const productOfferingsProps = useMemo(() => ({
    initialData: formData.productOfferings,
    onChange: (data: ProductOffering[]) => updateFormData('productOfferings', data),
    onValidityChange: (isValid: boolean) => updateFormValidity('productOfferings', isValid)
  }), [formData.productOfferings, updateFormData, updateFormValidity]);

  const documentsProps = useMemo(() => ({
    documents: formData.documents,
    supplierId: supplier?.id,
    onChange: (data: SupplierDocument[]) => updateFormData('documents', data),
    onValidityChange: (isValid: boolean) => updateFormValidity('documents', isValid)
  }), [formData.documents, supplier?.id, updateFormData, updateFormValidity]);

  const contactPersonsProps = useMemo(() => ({
    initialData: formData.contactPersons,
    supplierId: supplier?.id,
    onChange: (data: SupplierContactPerson[]) => updateFormData('contactPersons', data),
    onValidityChange: (isValid: boolean) => updateFormValidity('contactPersons', isValid)
  }), [formData.contactPersons, supplier?.id, updateFormData, updateFormValidity]);

  const evaluationsProps = useMemo(() => ({
    initialData: formData.evaluations,
    currentUserId: currentUserId,
    onChange: (data: SupplierEvaluation[]) => updateFormData('evaluations', data),
    onValidityChange: (isValid: boolean) => updateFormValidity('evaluations', isValid)
  }), [formData.evaluations, currentUserId, updateFormData, updateFormValidity]);

  // Show errors if there are any critical errors in loading reference data
  if (isOpen && errorStates?.documentTypes && activeTab === 'documents') {
    return (
      <CustomDialog
        isOpen={isOpen}
        onClose={onClose}
        title="خطأ في تحميل البيانات"
        description="حدث خطأ أثناء تحميل أنواع المستندات. قد تكون هناك مشكلة في قاعدة البيانات."
      >
        <div className="bg-red-50 p-4 rounded-md text-red-800 mb-4">
          <p className="font-medium">تفاصيل الخطأ:</p>
          <p className="text-sm">{errorStates.documentTypes}</p>
          <p className="text-sm mt-2">
            يرجى التحقق من وجود جدول document_types في قاعدة البيانات.
            <br />قد تحتاج إلى تنفيذ سكريبت إنشاء الجداول في قاعدة البيانات.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      </CustomDialog>
    );
  }

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
      description={supplier ? 'تعديل معلومات المورد الحالي.' : 'أدخل تفاصيل المورد الجديد.'}
      className="max-w-4xl"
    >
      {/* Stepper and Progress Bar - Only show for new supplier addition */}
      {!supplier && (
        <div className="mt-4 mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">تقدم إضافة المورد</h3>
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4 rtl:space-x-reverse">
              {/* Basic Info Step */}
              <div className="flex items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepCompletion.basicInfo ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {stepCompletion.basicInfo ? '✓' : '1'}
                </span>
                <span className="mr-2 text-sm text-gray-600">المعلومات الأساسية</span>
              </div>
              {/* Financial Details Step */}
              <div className="flex items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepCompletion.financialDetails ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {stepCompletion.financialDetails ? '✓' : '2'}
                </span>
                <span className="mr-2 text-sm text-gray-600">التفاصيل المالية</span>
              </div>
              {/* Documents Step */}
              <div className="flex items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepCompletion.documents ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {stepCompletion.documents ? '✓' : '3'}
                </span>
                <span className="mr-2 text-sm text-gray-600">المستندات</span>
              </div>
              {/* Product Offerings Step */}
              <div className="flex items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepCompletion.productOfferings ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {stepCompletion.productOfferings ? '✓' : '4'}
                </span>
                <span className="mr-2 text-sm text-gray-600">عروض المنتجات</span>
              </div>
              {/* Contact Persons Step */}
              <div className="flex items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepCompletion.contactPersons ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {stepCompletion.contactPersons ? '✓' : '5'}
                </span>
                <span className="mr-2 text-sm text-gray-600">جهات الاتصال</span>
              </div>
              {/* Evaluations Step */}
              <div className="flex items-center">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${stepCompletion.evaluations ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {stepCompletion.evaluations ? '✓' : '6'}
                </span>
                <span className="mr-2 text-sm text-gray-600">التقييمات</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <p className="text-right text-sm text-gray-600 mt-2">{overallProgress}% اكتمال تعبئة الحقول</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto p-1 bg-gray-100 rounded-md shadow-sm">
          <TabsTrigger value="basic-info" className="flex flex-col items-center justify-center p-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all duration-200">
            <FiUser className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">معلومات أساسية</span>
          </TabsTrigger>
          <TabsTrigger value="financial-details" className="flex flex-col items-center justify-center p-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all duration-200">
            <FiDollarSign className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">تفاصيل مالية</span>
          </TabsTrigger>
          <TabsTrigger value="product-offerings" className="flex flex-col items-center justify-center p-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all duration-200">
            <FiPackage className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">عروض المنتجات</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex flex-col items-center justify-center p-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all duration-200">
            <FiFileText className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">المستندات</span>
          </TabsTrigger>
          <TabsTrigger value="contact-persons" className="flex flex-col items-center justify-center p-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all duration-200">
            <FiPhoneCall className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">جهات الاتصال</span>
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex flex-col items-center justify-center p-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all duration-200">
            <FiStar className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">التقييمات</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="basic-info">
            <BasicInfoTab {...basicInfoProps} />
          </TabsContent>
          <TabsContent value="financial-details">
            <FinancialDetailsTab {...financialDetailsProps} />
          </TabsContent>
          <TabsContent value="product-offerings">
            <ProductOfferingsTab {...productOfferingsProps} />
          </TabsContent>
          <TabsContent value="documents">
            {errorStates?.documentTypes ? (
              <div className="bg-red-50 p-4 rounded-md text-red-800">
                <p className="font-medium">خطأ في تحميل أنواع المستندات</p>
                <p className="text-sm mt-2">
                  يرجى التحقق من وجود جدول document_types في قاعدة البيانات.
                </p>
              </div>
            ) : (
              <DocumentsTab {...documentsProps} />
            )}
          </TabsContent>
          <TabsContent value="contact-persons">
            <ContactPersonsTab {...contactPersonsProps} />
          </TabsContent>
          <TabsContent value="evaluations">
            <EvaluationsTab {...evaluationsProps} />
          </TabsContent>
        </div>
      </Tabs>

      <DialogFooter className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          إلغاء
        </Button>
        <Button onClick={handleSubmit} disabled={loading || referenceDataLoading}>
          {supplier ? 'حفظ التعديلات' : 'إضافة مورد'}
        </Button>
      </DialogFooter>
    </CustomDialog>
  );
};

export default SupplierTabsForm; 