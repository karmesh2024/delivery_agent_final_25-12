"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/shared/ui/dialog";
import { AgentStatus } from "@/types";
import { createDeliveryBoy } from "@/lib/supabase";
import { useToast } from "@/shared/ui/toast";

// تعريف نوع البيانات للمندوب الجديد
interface NewAgentData {
  name: string;
  phone: string;
  email: string;
  preferred_vehicle: "tricycle" | "pickup_truck" | "light_truck";
  status: AgentStatus;
}

interface AddAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAgent?: (agentData: NewAgentData) => void;
}

export function AddAgentDialog({
  open,
  onOpenChange,
  onAddAgent
}: AddAgentDialogProps) {
  const [formData, setFormData] = useState<NewAgentData>({
    name: "",
    phone: "",
    email: "",
    preferred_vehicle: "tricycle",
    status: "offline" as AgentStatus
  });

  // إضافة تسجيل للحالة
  console.log("AddAgentDialog rendering, open:", open);

  // مراقبة التغييرات في حالة الفتح
  useEffect(() => {
    console.log("AddAgentDialog - open state changed:", open);
  }, [open]);

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // إعادة تعيين رسالة الخطأ عند تغيير المدخلات
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value as AgentStatus }));
    // إعادة تعيين رسالة الخطأ عند تغيير الاختيارات
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      console.log("Form submitted with data:", formData);
      
      // تحويل الحالة إلى الصيغة المطلوبة لقاعدة البيانات
      const dbStatus = formData.status === 'online' ? 'active' : 'inactive';
      
      // استدعاء وظيفة إضافة المندوب
      const newAgent = await createDeliveryBoy({
        full_name: formData.name,
        phone: formData.phone,
        email: formData.email,
        preferred_vehicle: formData.preferred_vehicle,
        status: dbStatus
      });
      
      if (newAgent) {
        if (onAddAgent) {
          onAddAgent(formData);
        }
        
        setSuccessMessage(`تم إضافة المندوب ${formData.name} بنجاح`);
        console.log(`✅ تم إضافة المندوب ${formData.name} بنجاح`);
        toast({
          title: "تم بنجاح",
          description: `تم إضافة المندوب ${formData.name} بنجاح`,
          type: "success"
        });
        
        // إعادة تعيين النموذج
        setFormData({
          name: "",
          phone: "",
          email: "",
          preferred_vehicle: "tricycle",
          status: "offline" as AgentStatus
        });
        
        // إغلاق النافذة بعد تقديم النموذج بنجاح بعد فترة
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        setErrorMessage("حدث خطأ أثناء إنشاء المندوب. الرجاء المحاولة مرة أخرى.");
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إنشاء المندوب. الرجاء المحاولة مرة أخرى.",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error creating delivery boy:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
        toast({
          title: "خطأ",
          description: error.message,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة مندوب جديد</DialogTitle>
          <DialogDescription>
            أدخل معلومات المندوب الجديد هنا
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المندوب</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
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
              <Label htmlFor="status">الحالة الأولية</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleSelectChange("status", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offline">غير نشط</SelectItem>
                  <SelectItem value="online">متاح</SelectItem>
                  <SelectItem value="busy">مشغول</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddAgentDialog; 