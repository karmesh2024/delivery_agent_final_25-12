'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store/index';
import { addSupplier, updateSupplier, fetchSuppliers, addSupplierDocument } from '../store/supplierSlice';
import { fetchAllReferenceData } from '../store/referenceDataSlice';
import { Supplier } from '../types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { FiUser, FiDollarSign, FiPackage, FiFileText, FiPhoneCall, FiStar, FiArrowLeft, FiSave } from 'react-icons/fi';
import BasicInfoTab from '../components/tabs/BasicInfoTab';
import FinancialDetailsTab from '../components/tabs/FinancialDetailsTab';
import ProductOfferingsTab from '../components/tabs/ProductOfferingsTab';
import ExistingDocumentsTab from '../components/tabs/DocumentsTab';
import AddDocumentForm from '../components/tabs/AddDocumentForm';
import EvaluationsTab from '../components/tabs/EvaluationsTab';
import ContactPersonsTab from '../components/tabs/ContactPersonsTab';
import { ProductOffering } from '../components/tabs/ProductOfferingsTab';
import { SupplierDocument } from '../types';
import { SupplierEvaluation } from '../components/tabs/EvaluationsTab';
import { useRouter } from 'next/navigation';
import { SupplierContactPerson } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/shared/components/ui/card';
import { SupplierFinancialDetails } from '../types';

// تعريف نوع البيانات المجمعة
interface FormDataType {
  basicInfo: Partial<Supplier>;
  financialDetails: Partial<SupplierFinancialDetails>;
  documents: SupplierDocument[];
}

// مكون الحقل الإلزامي
const RequiredIndicator = () => (
  <span className="text-red-500 mr-1">*</span>
);

interface SupplierFormPageProps {
  supplierId?: string;
}

const SupplierFormPage: React.FC<SupplierFormPageProps> = ({ supplierId }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const { loading } = useAppSelector((state) => state.supplier);
  const { regions, supplierTypes, documentTypes, loading: referenceDataLoading, errorStates } = useAppSelector((state) => state.referenceData);
  const { currentAdmin } = useAppSelector((state) => state.auth);
  const { suppliers, loading: suppliersLoading } = useAppSelector((state) => state.supplier);
  
  // Current user ID for evaluations
  const currentUserId = currentAdmin?.id ? parseInt(currentAdmin.id) : 0;
  
  // مرجع ثابت للمصفوفات الفارغة لمنع إعادة العرض غير الضرورية
  const stableEmptyDocuments = useRef<SupplierDocument[]>([]).current;
  const stableEmptyFinancialDetails = useRef<Partial<SupplierFinancialDetails>>({}).current;

  // تعريف التبويبات بترتيبها
  const tabs = useMemo(() => [
    { id: 'basic-info', name: 'المعلومات الأساسية', icon: FiUser },
    { id: 'documents', name: 'المستندات', icon: FiFileText },
    { id: 'financial-details', name: 'التفاصيل المالية', icon: FiDollarSign },
  ], []);

  // تتبع التاب النشط
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  
  // New states for stepper and progress bar
  const [stepCompletion, setStepCompletion] = useState({
    'basic-info': false,
    'documents': false,
    'financial-details': false,
  });
  const [overallProgress, setOverallProgress] = useState(0);
  
  // بيانات النموذج المجمعة
  const [formData, setFormData] = useState<FormDataType>(() => ({
    basicInfo: { 
      id: undefined,
      name: '', name_ar: '', supplier_code: '', region_id: undefined, supplier_type_id: 0, 
      contact_person: '', contact_person_ar: '', contact_phone: '', contact_phone_secondary: '', 
      email: '', website: '', address: '', address_ar: '', city: '', postal_code: '', 
      commercial_register: '', tax_number: '', vat_number: '', rating: undefined, 
      product_description: '', is_active: true, is_approved: false 
    },
    financialDetails: stableEmptyFinancialDetails,
    documents: stableEmptyDocuments,
  }));
  
  // حالة صلاحية النموذج
  const [isFormValid, setIsFormValid] = useState({
    'basic-info': false,
    'documents': true,
    'financial-details': true,
  });
  
  // تحميل البيانات المرجعية والموردين عند فتح الصفحة
  useEffect(() => {
    dispatch(fetchAllReferenceData());
    dispatch(fetchSuppliers());
  }, [dispatch, documentTypes]);
  
  // البحث عن المورد إذا كان وضع التعديل
  const supplier = useMemo(() => {
    console.log("SupplierFormPage: supplierId from props:", supplierId);
    console.log("SupplierFormPage: suppliers from Redux:", suppliers);
    console.log("SupplierFormPage: IDs of suppliers in Redux:", suppliers.map(s => s.id));
    if (supplierId) {
      const numericSupplierId = parseInt(supplierId, 10); // Ensure base 10 for parsing
      if (isNaN(numericSupplierId)) {
        console.error("Invalid supplierId received:", supplierId);
        return null;
      }
      const foundSupplier = suppliers.find(s => s.id === numericSupplierId);
      console.log("SupplierFormPage: foundSupplier after find (after type conversion):", foundSupplier);
      return foundSupplier || null;
    }
    return null;
  }, [supplierId, suppliers]);
  
  // تهيئة البيانات عند فتح النموذج للتعديل
  useEffect(() => {
    console.log("SupplierFormPage: Current supplier state after useEffect:", supplier);
    if (supplier) {
      console.log("SupplierFormPage: supplier.financial_details before setting formData:", supplier.financial_details);
      setFormData(prevData => {
        const newDocuments = supplier.documents || stableEmptyDocuments;
        const newFinancialDetails = supplier.financial_details && Object.keys(supplier.financial_details).length > 0 
          ? supplier.financial_details 
          : stableEmptyFinancialDetails;

        if (
          prevData.basicInfo.id === supplier.id &&
          prevData.documents === newDocuments &&
          JSON.stringify(prevData.financialDetails) === JSON.stringify(newFinancialDetails)
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
            contact_job_title: supplier.contact_job_title || '',
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
          financialDetails: newFinancialDetails,
          documents: newDocuments,
        };
      });
      
      setIsFormValid({
        'basic-info': true,
        'documents': true,
        'financial-details': true,
      });
    } else {
      setFormData(prevData => {
        if (
          prevData.basicInfo.id === undefined &&
          prevData.documents === stableEmptyDocuments &&
          JSON.stringify(prevData.financialDetails) === JSON.stringify(stableEmptyFinancialDetails)
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
          financialDetails: stableEmptyFinancialDetails,
          documents: stableEmptyDocuments,
        };
      });
      
      setIsFormValid({
        'basic-info': false,
        'documents': true,
        'financial-details': true,
      });
    }
  }, [supplier, stableEmptyDocuments, stableEmptyFinancialDetails]);
  
  const updateFormData = useCallback((tabName: keyof FormDataType, data: SupplierDocument[] | Partial<Supplier> | Partial<SupplierFinancialDetails>) => {
    setFormData(prevData => {
      if (tabName === 'financialDetails') {
        return {
          ...prevData,
          financialDetails: { ...prevData.financialDetails, ...data as Partial<SupplierFinancialDetails> }
        };
      }
      return {
        ...prevData,
        [tabName]: data
      };
    });
  }, []);
  
  const updateFormValidity = useCallback((tabName: keyof typeof isFormValid, isValid: boolean) => {
    setIsFormValid(prevValidity => ({
      ...prevValidity,
      [tabName]: isValid
    }));

    setStepCompletion(prevCompletion => {
      if (prevCompletion[tabName as keyof typeof prevCompletion] !== isValid) {
        return {
          ...prevCompletion,
          [tabName as keyof typeof prevCompletion]: isValid
        };
      }
      return prevCompletion;
    });
  }, []);
  
  const handleAddDocument = useCallback(async (newDocument: SupplierDocument) => {
    if (!supplierId) {
      toast.error('يجب حفظ بيانات المورد الأساسية أولاً لإضافة المستندات.');
      setActiveTab('basic-info');
      return;
    }
    try {
      const resultAction = await dispatch(addSupplierDocument({ supplierId, document: newDocument }));
      if (addSupplierDocument.fulfilled.match(resultAction)) {
        toast.success('تم إضافة المستند بنجاح!');
        // تحديث الحالة المحلية للمستندات في formData
        setFormData(prevData => ({
          ...prevData,
          documents: [...prevData.documents, resultAction.payload]
        }));
        console.log("SupplierFormPage: formData.documents after adding document:", formData.documents);
      } else if (resultAction.payload) {
        toast.error(`فشل إضافة المستند: ${resultAction.payload}`);
      } else {
        toast.error('فشل إضافة المستند لسبب غير معروف.');
      }
    } catch (error: unknown) {
      console.error('خطأ في إضافة المستند:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'خطأ غير معروف';
      toast.error(`فشل إضافة المستند: ${errorMessage}`);
    }
  }, [dispatch, supplierId]);
  
  const isEntireFormValid = useCallback(() => {
    const relevantTabs: (keyof typeof isFormValid)[] = ['basic-info', 'documents', 'financial-details'];
    return relevantTabs.every(tab => isFormValid[tab]);
  }, [isFormValid]);

  useEffect(() => {
    const relevantSteps = tabs.map(tab => tab.id);
    const completedRelevantSteps = relevantSteps.filter(step => stepCompletion[step as keyof typeof stepCompletion]).length;
    const totalRelevantSteps = relevantSteps.length;
    
    if (totalRelevantSteps > 0) {
      setOverallProgress(Math.round((completedRelevantSteps / totalRelevantSteps) * 100));
    } else {
      setOverallProgress(0);
    }
  }, [stepCompletion, tabs]);
  
  const handleSubmit = useCallback(async () => {
    if (!isEntireFormValid()) {
      const invalidTab = Object.entries(isFormValid).find(([key, valid]) => !valid && tabs.some(tab => tab.id === key));
      if (invalidTab) {
        setActiveTab(invalidTab[0]);
        toast.error('يرجى ملء جميع الحقول الإلزامية قبل الإرسال');
      }
      return;
    }
    
    try {
      const supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'approved_by' | 'approved_at'> = {
        name: formData.basicInfo.name || '',
        supplier_code: formData.basicInfo.supplier_code || '',
        supplier_type_id: formData.basicInfo.supplier_type_id || 0,
        name_ar: formData.basicInfo.name_ar || '',
        region_id: formData.basicInfo.region_id,
        contact_person: formData.basicInfo.contact_person || '',
        contact_person_ar: formData.basicInfo.contact_person_ar || '',
        contact_job_title: formData.basicInfo.contact_job_title || '',
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
        financial_details: formData.financialDetails as SupplierFinancialDetails,
      };
      
      if (supplier && supplier.id) {
        await dispatch(updateSupplier({ id: supplier.id, supplier: supplierData })).unwrap();
        toast.success('تم تحديث المورد بنجاح!');
      } else {
        await dispatch(addSupplier(supplierData)).unwrap();
        toast.success('تم إضافة المورد بنجاح!');
      }
      
      router.push('/supplier-management/suppliers');
    } catch (err: unknown) {
      toast.error(`حدث خطأ: ${(err as Error).message}`);
    }
  }, [dispatch, formData, isEntireFormValid, isFormValid, supplier, router]);

  const handleCancel = useCallback(() => {
    router.push('/supplier-management/suppliers');
  }, [router]);

  const nextTab = useCallback(() => {
    const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);

    if (currentTabIndex !== -1) {
      const currentTabId = tabs[currentTabIndex].id;
      
      if (!supplier && !isFormValid[currentTabId as keyof typeof isFormValid]) {
        toast.error('يرجى ملء جميع الحقول الإلزامية في هذه الخطوة.');
        return;
      }

      if (currentTabIndex < tabs.length - 1) {
        setActiveTab(tabs[currentTabIndex + 1].id);
      }
    }
  }, [activeTab, isFormValid, supplier, tabs]);

  const prevTab = useCallback(() => {
    const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  }, [activeTab, tabs]);

  const basicInfoProps = useMemo(() => ({
    initialData: formData.basicInfo,
    onChange: (data: Partial<Supplier>) => updateFormData('basicInfo', data),
    onValidityChange: (isValid: boolean) => updateFormValidity('basic-info', isValid)
  }), [formData.basicInfo, updateFormData, updateFormValidity]);

  const financialDetailsProps = useMemo(() => ({
    initialData: formData.financialDetails,
    onChange: (data: Partial<SupplierFinancialDetails>) => updateFormData('financialDetails', data),
    onValidityChange: (isValid: boolean) => updateFormValidity('financial-details', isValid),
    supplierName: formData.basicInfo.name,
    supplierCode: formData.basicInfo.supplier_code,
    supplierId: supplier?.id ? String(supplier.id) : undefined,
  }), [formData.financialDetails, updateFormData, updateFormValidity, formData.basicInfo.name, formData.basicInfo.supplier_code, supplier?.id]);

  const documentsProps = useMemo(() => ({
    documents: formData.documents,
    supplierId: supplier?.id ? String(supplier.id) : undefined,
    onChange: (data: SupplierDocument[]) => updateFormData('documents', data),
    onValidityChange: (isValid: boolean) => updateFormValidity('documents', isValid)
  }), [formData.documents, supplier?.id, updateFormData, updateFormValidity]);

  if (errorStates?.documentTypes && activeTab === 'documents') {
    return (
      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>خطأ في تحميل البيانات</CardTitle>
            <CardDescription>حدث خطأ أثناء تحميل أنواع المستندات. قد تكون هناك مشكلة في قاعدة البيانات.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 p-4 rounded-md text-red-800 mb-4">
              <p className="font-medium">تفاصيل الخطأ:</p>
              <p className="text-sm">{errorStates.documentTypes}</p>
              <p className="text-sm mt-2">
                يرجى التحقق من وجود جدول document_types في قاعدة البيانات.
                <br />قد تحتاج إلى تنفيذ سكريبت إنشاء الجداول في قاعدة البيانات.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={handleCancel}>
              العودة للقائمة
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (referenceDataLoading || suppliersLoading) {
    return <div className="p-6 text-center">جاري تحميل البيانات...</div>;
  }

  const isEditMode = !!supplierId && !!supplier;

  return (
    <div className="p-6">
      <Card className="max-w-5xl mx-auto">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">
                {supplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
              </CardTitle>
              <CardDescription>
                {supplier ? 'تعديل معلومات المورد الحالي.' : (
                  <>
                    الخطوة {tabs.findIndex(tab => tab.id === activeTab) + 1} من {tabs.length}: 
                    {activeTab === 'basic-info' && 'أدخل المعلومات الأساسية للمورد.'}
                    {activeTab === 'documents' && 'رفع المستندات المطلوبة للمورد.'}
                    {activeTab === 'financial-details' && 'أدخل التفاصيل المالية للمورد.'}
                  </>
                )}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <FiArrowLeft className="mr-2 h-4 w-4" />
              العودة للقائمة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stepper and Progress Bar - Only show for new supplier addition */}
          {!supplier && (
            <div className="mt-4 mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">تقدم إضافة المورد</h3>
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4 rtl:space-x-reverse">
                  {tabs.map((tab, index) => {
                    const isCurrentTab = activeTab === tab.id;
                    const isCompleted = stepCompletion[tab.id as keyof typeof stepCompletion];
                    const Icon = tab.icon;
                    return (
                      <div key={tab.id} className="flex items-center">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'} ${isCurrentTab ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}>
                          {isCompleted ? '✓' : index + 1}
                        </span>
                        <Icon className="w-5 h-5 mx-2 text-gray-600" />
                        <span className="mr-2 text-sm text-gray-600">{tab.name}</span>
                      </div>
                    );
                  })}
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
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex flex-col items-center justify-center p-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md transition-all duration-200">
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{tab.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="basic-info">
                <BasicInfoTab {...basicInfoProps} />
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
                  <div className="space-y-4">
                    <Tabs defaultValue="current-documents" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="current-documents">المستندات الحالية</TabsTrigger>
                        <TabsTrigger value="add-document">إضافة مستند</TabsTrigger>
                      </TabsList>
                      <TabsContent value="current-documents">
                        <ExistingDocumentsTab 
                          documents={formData.documents}
                          supplierName={formData.basicInfo.name}
                          supplierCode={formData.basicInfo.supplier_code}
                        />
                      </TabsContent>
                      <TabsContent value="add-document">
                        <AddDocumentForm 
                          onAddDocument={handleAddDocument}
                          documentTypes={documentTypes}
                          supplierId={supplier?.id ? String(supplier.id) : undefined}
                          supplierName={formData.basicInfo.name}
                          supplierCode={formData.basicInfo.supplier_code}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="financial-details">
                <FinancialDetailsTab {...financialDetailsProps} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between mt-6 border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              إلغاء
            </Button>
            {activeTab !== 'basic-info' && (
              <Button 
                variant="ghost" 
                onClick={prevTab}
                disabled={activeTab === 'basic-info' || loading}
              >
                السابق
              </Button>
            )}
            {activeTab !== 'financial-details' && (
              <Button 
                onClick={nextTab}
                disabled={loading || referenceDataLoading}
              >
                التالي
              </Button>
            )}
            {activeTab === 'financial-details' && (
              <Button onClick={handleSubmit} disabled={loading || referenceDataLoading}>
                <FiSave className="mr-2 h-4 w-4" />
                {supplier ? 'حفظ التعديلات' : 'إضافة مورد'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SupplierFormPage; 