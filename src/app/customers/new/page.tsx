"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { createCustomer } from '@/domains/customers/store/customersSlice';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { 
  Customer, 
  CustomerType, 
  CustomerStatus, 
  CustomerAddress, 
  AddressType,
  BusinessProfile,
  AgentDetails,
  BusinessSubtype,
  CreateCustomerAddress,
  CreateBusinessProfile,
  CreateAgentDetails
} from '@/domains/customers/types';
import { toast } from '@/shared/ui/use-toast';

// Define a type for the payload sent to the createCustomer action
type CreateCustomerPayload = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'addresses' | 'businessProfile' | 'agentDetails' | 'firstOrderDate' | 'lastOrderDate' | 'referralCode' | 'totalOrders' | 'totalSpent' | 'loyaltyPoints' | 'walletBalance' | 'contactPerson' | 'avatarUrl' > & {
  password?: string;
  addresses?: CreateCustomerAddress[];
  businessProfile?: CreateBusinessProfile;
  agentDetails?: CreateAgentDetails;
};

// Define a specific type for the form state
interface NewCustomerFormState {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  preferredLanguage?: string;
  customerType: CustomerType; // Non-optional after init
  status?: CustomerStatus;
  organizationName?: string; // Kept for now, might be purely derived from businessProfileData.companyName
  notes?: string;
  tags?: string[];
  // Defaulted fields, not directly on form but part of Customer model
  totalOrders?: number;
  totalSpent?: number;
  loyaltyPoints?: number;
  walletBalance?: number;
  // Profile-specific data
  businessProfileData?: Partial<BusinessProfile>;
  agentDetailsData?: Partial<AgentDetails>;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const [formData, setFormData] = useState<NewCustomerFormState>({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    preferredLanguage: 'ar',
    customerType: CustomerType.HOUSEHOLD, 
    status: CustomerStatus.ACTIVE,
    organizationName: '',
    notes: '', // Initialize to empty string or undefined
    tags: [],   // Initialize to empty array or undefined
    totalOrders: 0,
    totalSpent: 0,
    loyaltyPoints: 0,
    walletBalance: 0,
    businessProfileData: undefined, 
    agentDetailsData: undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Partial<CustomerAddress>[]>([]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: keyof NewCustomerFormState, value: string | CustomerType | CustomerStatus) => {
    if (name === 'customerType') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value as CustomerType,
        businessProfileData: value === CustomerType.BUSINESS ? (prev.businessProfileData || {}) : undefined,
        agentDetailsData: value === CustomerType.AGENT ? (prev.agentDetailsData || {}) : undefined,
        organizationName: value === CustomerType.BUSINESS ? (prev.businessProfileData?.companyName || prev.organizationName || '') : '',
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle business profile input changes
  const handleBusinessProfileDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedProfileData = {
        ...(prev.businessProfileData || {}),
        [name]: value,
      };
      return {
        ...prev,
        businessProfileData: updatedProfileData,
        organizationName: name === 'companyName' ? value : prev.organizationName,
      };
    });
  };

  // Handle business profile select changes
  const handleBusinessProfileDataSelectChange = (name: string, value: string | boolean | Record<string, unknown> | null) => {
    setFormData(prev => ({
      ...prev,
      businessProfileData: {
        ...(prev.businessProfileData || {}),
        [name]: value,
      },
    }));
  };
  
  // Handle agent details input changes
  const handleAgentDetailsDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumberField = name === 'commissionRate';
    setFormData(prev => ({
      ...prev,
      agentDetailsData: {
        ...(prev.agentDetailsData || {}),
        [name]: isNumberField ? (value === '' ? undefined : parseFloat(value)) : value,
      },
    }));
  };

  // Handle agent details select changes
  const handleAgentDetailsDataSelectChange = (name: string, value: string | boolean | Record<string, unknown> | null) => {
    setFormData(prev => ({
      ...prev,
      agentDetailsData: {
        ...(prev.agentDetailsData || {}),
        [name]: value,
      },
    }));
  };

  // Handle address changes
  const handleAddressChange = (index: number, field: keyof CustomerAddress, value: string | number | boolean) => {
    const updatedAddresses = [...addresses];
    updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };
    setAddresses(updatedAddresses);
  };

  // Set an address as default
  const handleSetAddressAsDefault = (index: number) => {
    const updatedAddresses = addresses.map((address, i) => ({
      ...address,
      isDefault: i === index
    }));
    setAddresses(updatedAddresses);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    console.log("[ handleSubmit ] Called");
    e.preventDefault();
    
    setSubmitting(true);
    console.log("[ handleSubmit ] Submitting state set to true");
    
    try {
      console.log("[ handleSubmit ] Inside try block, form data:", JSON.parse(JSON.stringify(formData)) );

      if (!formData.fullName || !formData.phoneNumber) {
        console.log("[ handleSubmit ] Validation failed: fullName or phoneNumber missing.");
        toast({ title: "خطأ في الإدخال", description: 'يرجى ملء جميع الحقول المطلوبة في المعلومات الأساسية', variant: "destructive" });
        setSubmitting(false);
        return;
      }
      if (formData.customerType === CustomerType.BUSINESS && !formData.businessProfileData?.companyName) {
        console.log("[ handleSubmit ] Validation failed: companyName missing for business type.");
        toast({ title: "خطأ في الإدخال", description: 'يرجى ملء اسم الشركة لملف الشركة', variant: "destructive" });
        setSubmitting(false);
        return;
      }
      if (!formData.password) {
        console.log("[ handleSubmit ] Validation failed: password missing.");
        toast({ title: "خطأ في الإدخال", description: 'يرجى إدخال كلمة المرور', variant: "destructive" });
        setSubmitting(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        console.log("[ handleSubmit ] Validation failed: passwords do not match.");
        toast({ title: "خطأ في الإدخال", description: 'كلمتا المرور غير متطابقتين', variant: "destructive" });
        setSubmitting(false);
        return;
      }
      
      console.log("[ handleSubmit ] All validations passed.");
      const customerPayload: CreateCustomerPayload = {
        fullName: formData.fullName!,
        phoneNumber: formData.phoneNumber!,
        password: formData.password,
        email: formData.email || undefined,
        preferredLanguage: formData.preferredLanguage || 'ar',
        customerType: formData.customerType!,
        status: formData.status || CustomerStatus.ACTIVE,
        organizationName: formData.customerType === CustomerType.BUSINESS 
                          ? (formData.businessProfileData?.companyName || formData.organizationName) 
                          : undefined,
        notes: formData.notes || undefined,
        tags: formData.tags || [],

        addresses: addresses.map((addr): CreateCustomerAddress => ({
          addressType: addr.addressType || AddressType.HOME,
          addressLine: addr.addressLine!, // Assuming addressLine is required in form if address is added
          city: addr.city,
          area: addr.area,
          buildingNumber: addr.buildingNumber,
          floorNumber: addr.floorNumber,
          apartmentNumber: addr.apartmentNumber,
          additionalDirections: addr.additionalDirections,
          landmark: addr.landmark,
          latitude: addr.latitude!, // Assuming latitude is required
          longitude: addr.longitude!, // Assuming longitude is required
          isDefault: addr.isDefault === undefined ? false : addr.isDefault,
          isVerified: addr.isVerified === undefined ? false : addr.isVerified,
          streetAddress: addr.streetAddress,
        })),

        businessProfile: formData.customerType === CustomerType.BUSINESS && formData.businessProfileData
          ? {
              companyName: formData.businessProfileData.companyName!, // Required for business
              commercialRegistrationNumber: formData.businessProfileData.commercialRegistrationNumber,
              businessType: formData.businessProfileData.businessType,
              businessSubtype: formData.businessProfileData.businessSubtype,
              taxNumber: formData.businessProfileData.taxNumber,
              contactPersonName: formData.businessProfileData.contactPersonName,
              contactPhone: formData.businessProfileData.contactPhone,
              paymentMethod: formData.businessProfileData.paymentMethod,
              specialPricing: formData.businessProfileData.specialPricing || {},
              address: formData.businessProfileData.address,
              documents: formData.businessProfileData.documents || {},
              approved: formData.businessProfileData.approved === undefined ? false : formData.businessProfileData.approved,
            }
          : undefined,

        agentDetails: formData.customerType === CustomerType.AGENT && formData.agentDetailsData
          ? {
              storageLocation: formData.agentDetailsData.storageLocation,
              region: formData.agentDetailsData.region,
              areaCovered: formData.agentDetailsData.areaCovered,
              agentType: formData.agentDetailsData.agentType,
              commissionRate: formData.agentDetailsData.commissionRate !== undefined ? Number(formData.agentDetailsData.commissionRate) : undefined,
              paymentMethod: formData.agentDetailsData.paymentMethod,
              documents: formData.agentDetailsData.documents || {},
              approved: formData.agentDetailsData.approved === undefined ? false : formData.agentDetailsData.approved,
            }
          : undefined,
      };
      
      console.log("[ handleSubmit ] Submitting Customer Payload:", JSON.parse(JSON.stringify(customerPayload)));

      const resultAction = await dispatch(createCustomer(customerPayload));
      console.log("[ handleSubmit ] Dispatch resultAction:", resultAction);
      
      if (createCustomer.fulfilled.match(resultAction)) {
        console.log("[ handleSubmit ] createCustomer fulfilled.");
        if (resultAction.payload) {
          const result = resultAction.payload; 
          console.log("[ handleSubmit ] Fulfilled payload:", result);
          toast({
            title: "تمت إضافة العميل",
            description: "تم إنشاء العميل الجديد بنجاح",
            variant: "success",
          });
          router.push(`/customers/${result.id}`);
        } else {
          console.log("[ handleSubmit ] Fulfilled but payload is null.");
          toast({
            title: "فشل إنشاء العميل",
            description: 'فشل إنشاء العميل: لم يتم استقبال بيانات العميل بعد الإنشاء.',
            variant: "destructive",
          });
        }
      } else if (createCustomer.rejected.match(resultAction)) {
        console.log("[ handleSubmit ] createCustomer rejected.", resultAction);
        let errorMessage = 'حدث خطأ أثناء إنشاء العميل، يرجى المحاولة مرة أخرى';
        if (resultAction.payload) { 
          errorMessage = typeof resultAction.payload === 'string' ? resultAction.payload : JSON.stringify(resultAction.payload);
        } else if (resultAction.error && resultAction.error.message) { 
          errorMessage = resultAction.error.message;
        }
        console.error("[ handleSubmit ] Rejection error message:", errorMessage);
        toast({
          title: "فشل إنشاء العميل",
          description: errorMessage,
          variant: "destructive",
        });
      } 
    } catch (error) {
      console.error("[ handleSubmit ] Error in try-catch block:", error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء إنشاء العميل.';
      toast({
        title: "فشل إنشاء العميل",
        description: errorMessage, 
        variant: "destructive",
      });
    } finally {
      console.log("[ handleSubmit ] Inside finally block, setting submitting to false.");
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <DashboardLayout title="إضافة عميل جديد">
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" className="gap-1" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
            العودة للخلف
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preferredLanguage">اللغة المفضلة</Label>
                  <Select
                    value={formData.preferredLanguage || 'ar'}
                    onValueChange={(value) => handleSelectChange('preferredLanguage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر اللغة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">الإنجليزية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Password Fields Start Here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              {/* Password Fields End Here */}
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <Label>نوع العميل</Label>
                <RadioGroup
                  value={formData.customerType}
                  onValueChange={(value: string) => handleSelectChange('customerType', value)}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={CustomerType.HOUSEHOLD} id="household" />
                    <Label htmlFor="household">فرد</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={CustomerType.BUSINESS} id="business" />
                    <Label htmlFor="business">شركة</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={CustomerType.AGENT} id="agent" />
                    <Label htmlFor="agent">وكيل</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">حالة العميل</Label>
                <Select
                  value={formData.status || CustomerStatus.ACTIVE}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CustomerStatus.ACTIVE}>نشط</SelectItem>
                    <SelectItem value={CustomerStatus.INACTIVE}>غير نشط</SelectItem>
                    <SelectItem value={CustomerStatus.BLOCKED}>محظور</SelectItem>
                    <SelectItem value={CustomerStatus.PENDING}>قيد الانتظار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Addresses */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>العناوين</CardTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Add new empty address
                  const newAddress: Partial<CustomerAddress> = {
                    addressType: AddressType.HOME,
                    addressLine: '',
                    city: '',
                    area: '',
                    buildingNumber: '',
                    floorNumber: '',
                    apartmentNumber: '',
                    additionalDirections: '',
                    latitude: 0,
                    longitude: 0,
                    isDefault: addresses.length === 0, // First address is default
                    isVerified: false,
                  };
                  setAddresses([...addresses, newAddress]);
                }}
              >
                إضافة عنوان جديد
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {addresses.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  لا توجد عناوين مضافة. يمكنك إضافة عنوان جديد باستخدام الزر أعلاه.
                </p>
              ) : (
                addresses.map((address, index) => (
                  <Card key={index} className="border">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">العنوان {index + 1}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={address.isDefault ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSetAddressAsDefault(index)}
                            disabled={address.isDefault}
                          >
                            {address.isDefault ? 'عنوان افتراضي' : 'تعيين كافتراضي'}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              // Remove address
                              const newAddresses = [...addresses];
                              newAddresses.splice(index, 1);
                              
                              // If we removed the default address and have other addresses, set the first as default
                              if (address.isDefault && newAddresses.length > 0) {
                                newAddresses[0] = { ...newAddresses[0], isDefault: true };
                              }
                              
                              setAddresses(newAddresses);
                            }}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`address-type-${index}`}>نوع العنوان</Label>
                          <Select
                            value={address.addressType}
                            onValueChange={(value) => handleAddressChange(index, 'addressType', value)}
                          >
                            <SelectTrigger id={`address-type-${index}`}>
                              <SelectValue placeholder="اختر نوع العنوان" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={AddressType.HOME}>المنزل</SelectItem>
                              <SelectItem value={AddressType.WORK}>العمل</SelectItem>
                              <SelectItem value={AddressType.OTHER}>آخر</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`address-line-${index}`}>العنوان</Label>
                          <Input
                            id={`address-line-${index}`}
                            value={address.addressLine || ''}
                            onChange={(e) => handleAddressChange(index, 'addressLine', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`city-${index}`}>المدينة</Label>
                          <Input
                            id={`city-${index}`}
                            value={address.city || ''}
                            onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`area-${index}`}>المنطقة/الحي</Label>
                          <Input
                            id={`area-${index}`}
                            value={address.area || ''}
                            onChange={(e) => handleAddressChange(index, 'area', e.target.value)}
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor={`building-${index}`}>رقم المبنى</Label>
                            <Input
                              id={`building-${index}`}
                              value={address.buildingNumber || ''}
                              onChange={(e) => handleAddressChange(index, 'buildingNumber', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`floor-${index}`}>الطابق</Label>
                            <Input
                              id={`floor-${index}`}
                              value={address.floorNumber || ''}
                              onChange={(e) => handleAddressChange(index, 'floorNumber', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`apartment-${index}`}>الشقة</Label>
                            <Input
                              id={`apartment-${index}`}
                              value={address.apartmentNumber || ''}
                              onChange={(e) => handleAddressChange(index, 'apartmentNumber', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`directions-${index}`}>توجيهات إضافية</Label>
                          <Textarea
                            id={`directions-${index}`}
                            value={address.additionalDirections || ''}
                            onChange={(e) => handleAddressChange(index, 'additionalDirections', e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
          
          {/* Business Profile Section (Conditional) */}
          {formData.customerType === CustomerType.BUSINESS && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>ملف الشركة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">اسم الشركة</Label>
                    <Input id="companyName" name="companyName" value={formData.businessProfileData?.companyName || ''} onChange={handleBusinessProfileDataChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commercialRegistrationNumber">رقم السجل التجاري</Label>
                    <Input id="commercialRegistrationNumber" name="commercialRegistrationNumber" value={formData.businessProfileData?.commercialRegistrationNumber || ''} onChange={handleBusinessProfileDataChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">نوع العمل</Label>
                    <Input id="businessType" name="businessType" value={formData.businessProfileData?.businessType || ''} onChange={handleBusinessProfileDataChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessSubtype">النوع الفرعي للعمل</Label>
                    <Select value={formData.businessProfileData?.businessSubtype || ''} onValueChange={(value) => handleBusinessProfileDataSelectChange('businessSubtype', value)}>
                      <SelectTrigger><SelectValue placeholder="اختر النوع الفرعي" /></SelectTrigger>
                      <SelectContent>
                        {Object.values(BusinessSubtype).map(subtype => (
                          <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">الرقم الضريبي</Label>
                    <Input id="taxNumber" name="taxNumber" value={formData.businessProfileData?.taxNumber || ''} onChange={handleBusinessProfileDataChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonName">اسم مسؤول الاتصال</Label>
                    <Input id="contactPersonName" name="contactPersonName" value={formData.businessProfileData?.contactPersonName || ''} onChange={handleBusinessProfileDataChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">هاتف مسؤول الاتصال</Label>
                    <Input id="contactPhone" name="contactPhone" value={formData.businessProfileData?.contactPhone || ''} onChange={handleBusinessProfileDataChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethodBusiness">طريقة الدفع</Label>
                    <Input id="paymentMethodBusiness" name="paymentMethod" value={formData.businessProfileData?.paymentMethod || ''} onChange={handleBusinessProfileDataChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressBusiness">عنوان الشركة</Label>
                  <Textarea id="addressBusiness" name="address" value={formData.businessProfileData?.address || ''} onChange={handleBusinessProfileDataChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialPricing">التسعير الخاص (JSON)</Label>
                  <Textarea 
                    id="specialPricing" 
                    name="specialPricing" 
                    value={formData.businessProfileData?.specialPricing ? JSON.stringify(formData.businessProfileData.specialPricing, null, 2) : ''} 
                    onChange={(e) => {
                     try { 
                       const parsedValue = e.target.value.trim() ? JSON.parse(e.target.value) : null;
                       handleBusinessProfileDataSelectChange('specialPricing', parsedValue); 
                     } catch (err) { 
                       toast({ title: "خطأ", description: "صيغة JSON غير صحيحة للتسعير الخاص", variant: "destructive"});
                     }
                    }} 
                    placeholder='{ "item_id": 12.5, "category_abc": 0.85 }' 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentsBusiness">المستندات (JSON)</Label>
                  <Textarea 
                    id="documentsBusiness" 
                    name="documents" 
                    value={formData.businessProfileData?.documents ? JSON.stringify(formData.businessProfileData.documents, null, 2) : ''} 
                    onChange={(e) => {
                      try { 
                        const parsedValue = e.target.value.trim() ? JSON.parse(e.target.value) : null;
                        handleBusinessProfileDataSelectChange('documents', parsedValue); 
                      } catch (err) { 
                        toast({ title: "خطأ", description: "صيغة JSON غير صحيحة للمستندات", variant: "destructive"});
                      }
                    }} 
                    placeholder='[{"name":"Commercial Reg.","url":"..."},{"name":"Tax Card","url":"..."}]' 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approvedBusiness">معتمد</Label>
                  <Select value={formData.businessProfileData?.approved ? 'true' : 'false'} onValueChange={(value) => handleBusinessProfileDataSelectChange('approved', value === 'true')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">نعم</SelectItem>
                      <SelectItem value="false">لا</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agent Profile Section (Conditional) */}
          {formData.customerType === CustomerType.AGENT && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>ملف الوكيل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storageLocation">موقع التخزين</Label>
                    <Input id="storageLocation" name="storageLocation" value={formData.agentDetailsData?.storageLocation || ''} onChange={handleAgentDetailsDataChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">المنطقة</Label>
                    <Input id="region" name="region" value={formData.agentDetailsData?.region || ''} onChange={handleAgentDetailsDataChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="areaCovered">منطقة التغطية</Label>
                    <Input id="areaCovered" name="areaCovered" value={formData.agentDetailsData?.areaCovered || ''} onChange={handleAgentDetailsDataChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agentType">نوع الوكيل</Label>
                    <Input id="agentType" name="agentType" value={formData.agentDetailsData?.agentType || ''} onChange={handleAgentDetailsDataChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">نسبة العمولة (%)</Label>
                    <Input id="commissionRate" name="commissionRate" type="number" step="0.01" value={formData.agentDetailsData?.commissionRate === undefined ? '' : formData.agentDetailsData.commissionRate} onChange={handleAgentDetailsDataChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethodAgent">طريقة الدفع</Label>
                    <Input id="paymentMethodAgent" name="paymentMethod" value={formData.agentDetailsData?.paymentMethod || ''} onChange={handleAgentDetailsDataChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentsAgent">المستندات (JSON)</Label>
                  <Textarea 
                    id="documentsAgent" 
                    name="documents" 
                    value={formData.agentDetailsData?.documents ? JSON.stringify(formData.agentDetailsData.documents, null, 2) : ''} 
                    onChange={(e) => {
                      try { 
                        const parsedValue = e.target.value.trim() ? JSON.parse(e.target.value) : null;
                        handleAgentDetailsDataSelectChange('documents', parsedValue); 
                      } catch (err) { 
                        toast({ title: "خطأ", description: "صيغة JSON غير صحيحة للمستندات", variant: "destructive"});
                      }
                    }} 
                    placeholder='[{"name":"ID Copy","url":"..."},{"name":"Proof of Address","url":"..."}]' 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approvedAgent">معتمد</Label>
                  <Select value={formData.agentDetailsData?.approved ? 'true' : 'false'} onValueChange={(value) => handleAgentDetailsDataSelectChange('approved', value === 'true')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">نعم</SelectItem>
                      <SelectItem value="false">لا</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleGoBack}>
              إلغاء
            </Button>
            <Button type="submit" className="gap-1" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  إنشاء العميل
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 