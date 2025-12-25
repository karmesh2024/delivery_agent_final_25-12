"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createDeliveryBoy } from "@/lib/supabase";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/shared/ui/toast";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Simple date formatting helper
function formatDate(date: Date, format: string): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  if (format === 'yyyy-MM-dd') {
    return `${year}-${month}-${day}`;
  } else if (format === 'yyyy/MM/dd') {
    return `${year}/${month}/${day}`;
  } else {
    return `${year}-${month}-${day}`;
  }
}

// Function to validate date format
function isValidDateString(dateString: string): boolean {
  // Check for format YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!regex.test(dateString)) {
    return false;
  }
  
  // Check if date is valid
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// تحويل من تنسيق YYYY-MM-DD إلى DD-MM-YYYY للعرض
function formatDateForDisplay(isoDate: string): string {
  if (!isoDate) return '';
  
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// تحويل من تنسيق DD-MM-YYYY إلى YYYY-MM-DD للتخزين
function formatDateForStorage(displayDate: string): string {
  if (!displayDate) return '';
  
  const parts = displayDate.split('/');
  if (parts.length !== 3) return displayDate;
  
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Add this interface near the top of the file, after the imports
type DeliveryBoyResponse = {
  id?: string;
  data?: {
    user?: { id: string };
    delivery_boy?: { id: string; delivery_code?: string };
  };
  user?: { id: string };
  delivery_boy?: { id: string; delivery_code?: string };
  delivery_code?: string;
} | null;

interface FullAddAgentFormProps {
  onSuccess: (agentId: string, deliveryCode: string, passwordSetByAdmin: string) => void;
  onCancel: () => void;
}

export function FullAddAgentForm({ onSuccess, onCancel }: FullAddAgentFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    national_id: "",
    license_number: "",
    preferred_vehicle: "tricycle" as "tricycle" | "pickup_truck" | "light_truck",
    preferred_language: "ar",
    preferred_zones: [] as string[] | string,
    status: "active" as "active" | "inactive" | "suspended",
    online_status: "offline" as "online" | "offline" | "busy",
    notes: "",
    password: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "preferred_vehicle") {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value as "tricycle" | "pickup_truck" | "light_truck" 
      }));
    } else if (name === "status") {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value as "active" | "inactive" | "suspended" 
      }));
    } else if (name === "online_status") {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value as "online" | "offline" | "busy" 
      }));
    } else if (name === "preferred_language") {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setFormData(prev => ({ 
        ...prev, 
        date_of_birth: formatDate(selectedDate, 'yyyy-MM-dd') 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    // Password validation
    if (!formData.password || !formData.confirmPassword) {
      setErrorMessage("كلمة المرور وتأكيد كلمة المرور مطلوبان");
      setIsSubmitting(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("كلماتي المرور غير متطابقتين");
      setIsSubmitting(false);
      return;
    }
    // Add more password complexity validation if needed

    try {
      // console.log("Form submitted with data:", formData); // Removed sensitive log
      
      // التحقق من صحة الحقول المطلوبة
      if (!formData.full_name || !formData.phone) {
        setErrorMessage("الاسم الكامل ورقم الهاتف مطلوبان");
        setIsSubmitting(false);
        return;
      }
      
      // التحقق من تنسيق تاريخ الميلاد
      if (formData.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date_of_birth)) {
        setErrorMessage("تنسيق تاريخ الميلاد غير صحيح. يجب أن يكون بصيغة YYYY-MM-DD");
        setIsSubmitting(false);
        return;
      }
      
      // تنظيف وتحويل المناطق المفضلة إلى مصفوفة
      let preferredZones: string[] = [];
      if (typeof formData.preferred_zones === 'string') {
        // في حالة إدخالها كنص مفصول بفواصل
        preferredZones = formData.preferred_zones.split(',').map((zone: string) => zone.trim());
      } else if (Array.isArray(formData.preferred_zones)) {
        // في حالة إدخالها كمصفوفة مباشرة
        preferredZones = formData.preferred_zones.map((zone: string) => zone.trim());
      }
      
      // استدعاء وظيفة createDeliveryBoy من مكتبة supabase مباشرة بدلاً من API
      try {
        const newAgent: DeliveryBoyResponse = await createDeliveryBoy({
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          date_of_birth: formData.date_of_birth,
          national_id: formData.national_id,
          license_number: formData.license_number,
          preferred_vehicle: formData.preferred_vehicle,
          preferred_language: formData.preferred_language,
          preferred_zones: preferredZones,
          notes: formData.notes,
          status: formData.status,
          online_status: formData.online_status,
          password: formData.password,
        });
        
        if (!newAgent) {
          throw new Error("فشل في إنشاء المندوب");
        }
        
        setSuccessMessage(`تم إضافة المندوب ${formData.full_name} بنجاح`);
        // console.log(`✅ تم إضافة المندوب ${formData.full_name} بنجاح:`, newAgent); // Removed sensitive log
        
        toast({
          title: "تم بنجاح",
          description: `تم إضافة المندوب ${formData.full_name} بنجاح`,
          type: "success"
        });
        
        // إعادة تعيين النموذج
        setFormData({
          full_name: "",
          phone: "",
          email: "",
          date_of_birth: "",
          national_id: "",
          license_number: "",
          preferred_vehicle: "tricycle" as "tricycle" | "pickup_truck" | "light_truck",
          preferred_language: "ar",
          preferred_zones: [],
          status: "active" as "active" | "inactive" | "suspended",
          online_status: "offline" as "online" | "offline" | "busy",
          notes: "",
          password: "",
          confirmPassword: "",
        });
        setDate(undefined);
        
        // استدعاء دالة النجاح مع معرف المندوب الجديد ورمز التوصيل وكلمة المرور
        let agentId = "";
        let deliveryCode = "";
        
        if (newAgent.id) {
          agentId = newAgent.id;
        } else if (newAgent.data && newAgent.data.delivery_boy && newAgent.data.delivery_boy.id) {
          agentId = newAgent.data.delivery_boy.id;
        }

        // Additional checks for delivery_code in different structures
        if (newAgent.delivery_code) {
          deliveryCode = newAgent.delivery_code;
        } else if (newAgent.data && newAgent.data.delivery_boy && newAgent.data.delivery_boy.delivery_code) {
          deliveryCode = newAgent.data.delivery_boy.delivery_code;
        }

        // console.log("معرف المندوب:", agentId, "رمز التوصيل:", deliveryCode); // Removed sensitive log
        
        if (agentId && deliveryCode) {
          onSuccess(agentId, deliveryCode, formData.password);
        } else {
          // console.error("لم يتم العثور على معرف المندوب أو رمز التوصيل في البيانات المستردة:", newAgent); // Removed sensitive log
          setErrorMessage("فشل في الحصول على معرف المندوب أو رمز التوصيل بعد الإنشاء.");
        }
      } catch (error: unknown) {
        // console.error("خطأ في إنشاء المندوب باستخدام createDeliveryBoy:", error); // Removed detailed error log
        // console.error("Error creating delivery boy:", error); // Removed detailed error log
        setErrorMessage(`فشل في إنشاء المندوب: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error creating delivery boy:", error);
      if (error instanceof Error) {
        // تحسين رسائل الخطأ لتكون أكثر تحديدًا وتساعد المستخدم
        let errorMsg = error.message;
        
        // تخصيص رسائل الخطأ للبيانات المكررة
        if (errorMsg.includes("رقم الهاتف") || errorMsg.includes("phone")) {
          errorMsg = "يوجد مندوب بنفس رقم الهاتف بالفعل. الرجاء استخدام رقم هاتف آخر.";
        } else if (errorMsg.includes("البريد الإلكتروني") || errorMsg.includes("email")) {
          errorMsg = "يوجد مندوب بنفس البريد الإلكتروني بالفعل. الرجاء استخدام بريد إلكتروني آخر.";
        } else if (errorMsg.includes("الرقم القومي") || errorMsg.includes("national_id")) {
          errorMsg = "يوجد مندوب بنفس الرقم القومي بالفعل. الرجاء التحقق من الرقم القومي المدخل.";
        } else if (errorMsg.includes("رقم الرخصة") || errorMsg.includes("license_number")) {
          errorMsg = "يوجد مندوب بنفس رقم رخصة القيادة بالفعل. الرجاء التحقق من رقم الرخصة المدخل.";
        }
        
        setErrorMessage(errorMsg);
        toast({
          title: "خطأ في إضافة المندوب",
          description: errorMsg,
          type: "error"
        });
      } else {
        setErrorMessage("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.");
        toast({
          title: "خطأ",
          description: "حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.",
          type: "error"
        });
      }
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md text-sm mb-6 flex items-center">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* معلومات أساسية */}
          <div className="space-y-2">
            <Label htmlFor="full_name">اسم المندوب الكامل *</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="أدخل الاسم الكامل"
              required
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+9665xxxxxxxx"
              required
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="example@domain.com"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">تاريخ الميلاد *</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <Input
                  id="birth_day"
                  name="birth_day"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="اليوم"
                  value={formData.date_of_birth ? formData.date_of_birth.split('-')[2] : ''}
                  onChange={(e) => {
                    const day = e.target.value.padStart(2, '0');
                    const currentDate = formData.date_of_birth.split('-');
                    let newDate = "";
                    
                    if (currentDate.length === 3) {
                      // YYYY-MM-DD تنسيق صحيح
                      newDate = `${currentDate[0]}-${currentDate[1]}-${day}`;
                    } else {
                      // تاريخ غير موجود بعد، استخدم السنة والشهر الحاليين
                      const today = new Date();
                      const year = today.getFullYear();
                      const month = (today.getMonth() + 1).toString().padStart(2, '0');
                      newDate = `${year}-${month}-${day}`;
                    }
                    
                    setFormData(prev => ({ ...prev, date_of_birth: newDate }));
                  }}
                  className="text-center"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="col-span-1">
                <Input
                  id="birth_month"
                  name="birth_month"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="الشهر"
                  value={formData.date_of_birth ? formData.date_of_birth.split('-')[1] : ''}
                  onChange={(e) => {
                    const month = e.target.value.padStart(2, '0');
                    const currentDate = formData.date_of_birth.split('-');
                    let newDate = "";
                    
                    if (currentDate.length === 3) {
                      // تنسيق صحيح
                      newDate = `${currentDate[0]}-${month}-${currentDate[2]}`;
                    } else {
                      // تاريخ غير موجود بعد، استخدم السنة الحالية ويوم 1
                      const today = new Date();
                      const year = today.getFullYear();
                      newDate = `${year}-${month}-01`;
                    }
                    
                    setFormData(prev => ({ ...prev, date_of_birth: newDate }));
                  }}
                  className="text-center"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="col-span-1">
                <Input
                  id="birth_year"
                  name="birth_year"
                  type="number"
                  min="1940"
                  max={new Date().getFullYear()}
                  placeholder="السنة"
                  value={formData.date_of_birth ? formData.date_of_birth.split('-')[0] : ''}
                  onChange={(e) => {
                    const year = e.target.value;
                    const currentDate = formData.date_of_birth.split('-');
                    let newDate = "";
                    
                    if (currentDate.length === 3) {
                      // تنسيق صحيح
                      newDate = `${year}-${currentDate[1]}-${currentDate[2]}`;
                    } else {
                      // تاريخ غير موجود بعد، استخدم الشهر واليوم الحاليين
                      const today = new Date();
                      const month = (today.getMonth() + 1).toString().padStart(2, '0');
                      const day = today.getDate().toString().padStart(2, '0');
                      newDate = `${year}-${month}-${day}`;
                    }
                    
                    setFormData(prev => ({ ...prev, date_of_birth: newDate }));
                  }}
                  className="text-center"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">أدخل التاريخ بصيغة اليوم/الشهر/السنة (سيتم تخزينه بتنسيق YYYY-MM-DD)</p>
          </div>

          {/* معلومات الهوية والرخصة */}
          <div className="space-y-2">
            <Label htmlFor="national_id">رقم الهوية الوطنية *</Label>
            <Input
              id="national_id"
              name="national_id"
              value={formData.national_id}
              onChange={handleInputChange}
              placeholder="أدخل رقم الهوية"
              required
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="license_number">رقم رخصة القيادة *</Label>
            <Input
              id="license_number"
              name="license_number"
              value={formData.license_number}
              onChange={handleInputChange}
              placeholder="أدخل رقم رخصة القيادة"
              required
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          
          {/* التفضيلات والحالة */}
          <div className="space-y-2">
            <Label htmlFor="preferred_vehicle">نوع المركبة المفضلة *</Label>
            <Select 
              value={formData.preferred_vehicle} 
              onValueChange={(value) => handleSelectChange("preferred_vehicle", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر نوع المركبة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tricycle">دراجة ثلاثية</SelectItem>
                <SelectItem value="pickup_truck">شاحنة بيك أب</SelectItem>
                <SelectItem value="light_truck">شاحنة خفيفة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preferred_language">اللغة المفضلة</Label>
            <Select 
              value={formData.preferred_language} 
              onValueChange={(value) => handleSelectChange("preferred_language", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر اللغة المفضلة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">الإنجليزية</SelectItem>
                <SelectItem value="ur">الأوردية</SelectItem>
                <SelectItem value="hi">الهندية</SelectItem>
                <SelectItem value="bn">البنغالية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleSelectChange("status", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="suspended">معلق</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="online_status">حالة الاتصال</Label>
            <Select 
              value={formData.online_status} 
              onValueChange={(value) => handleSelectChange("online_status", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر حالة الاتصال" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">متصل</SelectItem>
                <SelectItem value="offline">غير متصل</SelectItem>
                <SelectItem value="busy">مشغول</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* ملاحظات */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="أدخل أي ملاحظات إضافية عن المندوب"
              disabled={isSubmitting}
              className="w-full"
              rows={4}
            />
          </div>
        </div>
        
        {/* New Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="أعد إدخال كلمة المرور"
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 rtl:space-x-reverse">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className={isSubmitting ? "cursor-not-allowed opacity-70" : ""}
          >
            {isSubmitting ? "جاري الإضافة..." : "إضافة المندوب"}
          </Button>
        </div>
      </form>
    </div>
  );
} 