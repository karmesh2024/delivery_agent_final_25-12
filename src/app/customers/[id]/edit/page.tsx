"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCustomerById, updateCustomer } from '@/domains/customers/store/customersSlice';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/shared/ui/card';
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
  AddressType 
} from '@/domains/customers/types';
import { toast } from '@/shared/ui/use-toast';

export default function CustomerEditPage() {
  const router = useRouter();
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { selectedCustomer, isLoading, error } = useAppSelector((state) => state.customers);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

  // Load customer data
  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerById(id as string));
    }
  }, [dispatch, id]);

  // Initialize form data when customer is loaded
  useEffect(() => {
    if (selectedCustomer) {
      setFormData({
        fullName: selectedCustomer.fullName,
        phoneNumber: selectedCustomer.phoneNumber,
        email: selectedCustomer.email || '',
        preferredLanguage: selectedCustomer.preferredLanguage,
        customerType: selectedCustomer.customerType,
        organizationName: selectedCustomer.organizationName || '',
        status: selectedCustomer.status,
        loyaltyPoints: selectedCustomer.loyaltyPoints,
        walletBalance: selectedCustomer.walletBalance || 0,
      });
      setAddresses([...selectedCustomer.addresses]);
    }
  }, [selectedCustomer]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
    e.preventDefault();
    
    if (!id || !selectedCustomer) return;
    
    setSubmitting(true);
    
    try {
      // Prepare update data
      const customerData: Partial<Customer> = {
        ...formData,
        addresses: addresses,
      };
      
      // Dispatch update action
      await dispatch(updateCustomer({ id: id as string, customerData })).unwrap();
      
      // Show success message
      toast({
        title: "تم تحديث بيانات العميل",
        description: "تم حفظ التغييرات بنجاح",
      });
      
      // Navigate back to customer detail page
      router.push(`/customers/${id}`);
    } catch (error) {
      // Show error message
      toast({
        title: "فشل تحديث بيانات العميل",
        description: "حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <DashboardLayout title="تعديل بيانات العميل">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="تعديل بيانات العميل">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={handleGoBack}>العودة للخلف</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedCustomer) {
    return (
      <DashboardLayout title="تعديل بيانات العميل">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="mb-4">لم يتم العثور على بيانات العميل</p>
          <Button onClick={handleGoBack}>العودة للخلف</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`تعديل بيانات العميل: ${selectedCustomer.fullName}`}>
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
                    value={formData.preferredLanguage || ''}
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
                </RadioGroup>
              </div>
              
              {formData.customerType === CustomerType.BUSINESS && (
                <div className="space-y-2">
                  <Label htmlFor="organizationName">اسم المؤسسة/الشركة</Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    value={formData.organizationName || ''}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="status">حالة العميل</Label>
                <Select
                  value={formData.status || ''}
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
                  const newAddress: CustomerAddress = {
                    id: `temp-${Date.now()}`, // Temporary ID for new address
                    customerId: id as string,
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
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                  setAddresses([...addresses, newAddress]);
                }}
              >
                إضافة عنوان جديد
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {addresses.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">لا توجد عناوين مسجلة لهذا العميل</p>
              ) : (
                addresses.map((address, index) => (
                  <Card key={address.id} className="border">
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
                            value={address.addressLine}
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
          
          {/* Loyalty and Wallet */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>الولاء والمحفظة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loyaltyPoints">نقاط الولاء</Label>
                  <Input
                    id="loyaltyPoints"
                    name="loyaltyPoints"
                    type="number"
                    value={formData.loyaltyPoints || 0}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="walletBalance">رصيد المحفظة</Label>
                  <Input
                    id="walletBalance"
                    name="walletBalance"
                    type="number"
                    step="0.01"
                    value={formData.walletBalance || 0}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleGoBack}>
              إلغاء
            </Button>
            <Button type="submit" className="gap-1" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 