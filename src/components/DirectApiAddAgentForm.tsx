"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/shared/ui/toast";
import { ClipboardCopy } from "lucide-react";

interface DirectApiAddAgentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function DirectApiAddAgentForm({ onSuccess, onCancel }: DirectApiAddAgentFormProps) {
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
    preferred_zones: "",
    status: "active" as "active" | "busy" | "inactive" | "suspended",
    online_status: "offline" as "online" | "offline" | "busy",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [createdDeliveryCode, setCreatedDeliveryCode] = useState<string | null>(null);

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
        [name]: value as "active" | "busy" | "inactive" | "suspended" 
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setCreatedPassword(null);
    setCreatedDeliveryCode(null);
    
    try {
      console.log("Form submitted with data:", formData);
      
      // استدعاء API الخادم مباشرة
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          date_of_birth: formData.date_of_birth,
          national_id: formData.national_id,
          license_number: formData.license_number,
          preferred_vehicle: formData.preferred_vehicle,
          preferred_language: formData.preferred_language,
          status: formData.status,
          notes: formData.notes
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'حدث خطأ أثناء إنشاء المندوب');
      }
      
      if (responseData.success) {
        setSuccessMessage(`تم إضافة المندوب ${formData.full_name} بنجاح`);
        
        // حفظ كلمة المرور وكود التسليم من الاستجابة
        if (responseData.data && responseData.data.tempPassword) {
          setCreatedPassword(responseData.data.tempPassword);
        }
        
        if (responseData.data && responseData.data.deliveryCode) {
          setCreatedDeliveryCode(responseData.data.deliveryCode);
        }
        
        console.log(`✅ تم إضافة المندوب ${formData.full_name} بنجاح`);
        
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
          preferred_zones: "",
          status: "active" as "active" | "busy" | "inactive" | "suspended",
          online_status: "offline" as "online" | "offline" | "busy",
          notes: "",
        });
        
        // استدعاء دالة النجاح
        onSuccess();
      } else {
        setErrorMessage("حدث خطأ أثناء إنشاء المندوب. الرجاء المحاولة مرة أخرى.");
      }
    } catch (error) {
      console.error("Error creating delivery boy:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm mb-4">
          {successMessage}
        </div>
      )}
      
      {(createdPassword || createdDeliveryCode) && (
        <div className="bg-blue-50 text-blue-600 p-4 rounded-md text-sm mb-4 border-2 border-blue-200">
          <div className="font-bold mb-3 text-base">معلومات تسجيل الدخول للمندوب:</div>
          
          {createdPassword && (
            <div className="mb-3 flex items-center flex-wrap">
              <span className="font-semibold ml-2">كلمة المرور:</span> 
              <code className="font-mono bg-white px-3 py-1 mx-2 rounded border border-blue-300">{createdPassword}</code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  navigator.clipboard.writeText(createdPassword);
                  toast({
                    title: "تم النسخ",
                    description: "تم نسخ كلمة المرور إلى الحافظة",
                    type: "success"
                  });
                }}
                className="mr-2"
              >
                <ClipboardCopy className="h-4 w-4 ml-1" />
                نسخ
              </Button>
            </div>
          )}
          
          {createdDeliveryCode && (
            <div className="mb-2 flex items-center flex-wrap">
              <span className="font-semibold ml-2">كود التحقق:</span> 
              <code className="font-mono bg-white px-3 py-1 mx-2 rounded border border-blue-300">{createdDeliveryCode}</code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  navigator.clipboard.writeText(createdDeliveryCode);
                  toast({
                    title: "تم النسخ",
                    description: "تم نسخ كود التحقق إلى الحافظة",
                    type: "success"
                  });
                }}
                className="mr-2"
              >
                <ClipboardCopy className="h-4 w-4 ml-1" />
                نسخ
              </Button>
            </div>
          )}
          
          <div className="text-xs mt-3 text-blue-500">
            يرجى حفظ هذه المعلومات وإرسالها للمندوب، فلن تظهر مرة أخرى.
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">اسم المندوب</Label>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="أدخل اسم المندوب"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+9665xxxxxxxx"
              required
              disabled={isSubmitting}
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
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              placeholder="YYYY-MM-DD"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="national_id">رقم الهوية الوطنية</Label>
            <Input
              id="national_id"
              name="national_id"
              value={formData.national_id}
              onChange={handleInputChange}
              placeholder="أدخل رقم الهوية"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="license_number">رقم رخصة القيادة</Label>
            <Input
              id="license_number"
              name="license_number"
              value={formData.license_number}
              onChange={handleInputChange}
              placeholder="أدخل رقم الرخصة"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preferred_vehicle">نوع المركبة المفضلة</Label>
            <Select 
              value={formData.preferred_vehicle} 
              onValueChange={(value) => handleSelectChange("preferred_vehicle", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="اختر اللغة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">الإنجليزية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="preferred_zones">المناطق المفضلة</Label>
            <Input
              id="preferred_zones"
              name="preferred_zones"
              value={formData.preferred_zones}
              onChange={handleInputChange}
              placeholder="أدخل المناطق المفضلة (مثال: الرياض, جدة)"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleSelectChange("status", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="busy">مشغول</SelectItem>
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
              <SelectTrigger>
                <SelectValue placeholder="اختر حالة الاتصال" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">متصل</SelectItem>
                <SelectItem value="offline">غير متصل</SelectItem>
                <SelectItem value="busy">مشغول</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="أدخل أي ملاحظات إضافية"
              disabled={isSubmitting}
              rows={3}
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

export default DirectApiAddAgentForm; 