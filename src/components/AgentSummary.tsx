"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ClipboardCopy, MapPin, Phone, Mail, Calendar, User, Shield, Car, FileText, MessageCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/shared/ui/toast";
import { generateVerificationCode } from "@/lib/utils";
import { GeoJSONPoint, GeoJSONPolygon } from "@/domains/settings/types";
import Image from "next/image";
import { Label } from "@/shared/ui/label";
import { getPublicImageUrl, supabase } from '@/lib/supabase';

// نوع البيانات للمندوب
interface AgentData {
  id: string;
  full_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  profile_image_url?: string;
  status?: string;
  driver_license_number?: string;
  national_id?: string;
  birth_date?: string;
  preferred_vehicle?: string;
  created_at?: string;
  delivery_code?: string;
}

interface Zone {
  id: string;
  zone_name: string;
  is_active: boolean;
  is_primary: boolean;
}

// Interface for API response which includes geographic_zone info
interface ApiZoneResponse {
  id: string;
  is_primary: boolean;
  geographic_zone: {
    id: string;
    name: string;
    description?: string;
    area_polygon: GeoJSONPolygon;
    center_point: GeoJSONPoint;
  };
}

interface AgentSummaryProps {
  agentId: string;
  deliveryCode: string | null;
  passwordSetByAdmin: string | null;
  onComplete: () => void;
  onBack: () => void;
}

export function AgentSummary({ agentId, deliveryCode: initialDeliveryCode, passwordSetByAdmin, onComplete, onBack }: AgentSummaryProps) {
  const { toast } = useToast();
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const displayDeliveryCode = agentData?.delivery_code || initialDeliveryCode;
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // جلب بيانات المندوب عند تحميل المكون
  useEffect(() => {
    loadAgentData();
  }, [agentId]);

  const loadAgentData = async () => {
    setIsLoading(true);
    try {
      // استدعاء API لجلب بيانات المندوب
      const response = await fetch(`/api/agents/${agentId}`);
      if (!response.ok) {
        throw new Error("فشل في جلب بيانات المندوب");
      }
      const data = await response.json();
      setAgentData(data);
      
      // جلب مناطق المندوب
      console.log("Fetching zones for agent:", agentId);
      const zonesResponse = await fetch(`/api/agents/${agentId}/zones`);
      if (zonesResponse.ok) {
        const zonesData = await zonesResponse.json();
        console.log("Agent zones data:", zonesData);
        
        // تحويل البيانات من الشكل الذي تعيده واجهة API إلى الشكل المطلوب للمكون
        if (Array.isArray(zonesData)) {
          const transformedZones: Zone[] = zonesData.map((zone: ApiZoneResponse) => ({
            id: zone.id,
            zone_name: zone.geographic_zone?.name || 'منطقة غير معروفة',
            is_active: true, // افتراض أن المنطقة نشطة إذا تم إرجاعها
            is_primary: zone.is_primary || false
          }));
          setZones(transformedZones);
        } else {
          setZones([]);
        }
      } else {
        console.error("Error fetching agent zones:", await zonesResponse.text());
        toast({
          title: "تنبيه",
          description: "تعذر جلب مناطق عمل المندوب",
          type: "warning"
        });
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات المندوب:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات المندوب",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // إعادة توليد كود التحقق
  const regenerateDeliveryCode = async () => {
    setIsRegenerating(true);
    try {
      // استدعاء API لإعادة توليد كود التسليم وتحديثه في قاعدة البيانات
      const response = await fetch(`/api/agents/${agentId}/regenerate-code`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error("فشل في إعادة توليد كود التحقق");
      }
      
      const { delivery_code } = await response.json();
      
      // تحديث البيانات المحلية
      setAgentData(prev => prev ? { ...prev, delivery_code } : null);
      
      toast({
        title: "تم بنجاح",
        description: "تم إعادة توليد كود التحقق بنجاح",
        type: "success"
      });
    } catch (error) {
      console.error("خطأ في إعادة توليد كود التحقق:", error);
      toast({
        title: "خطأ",
        description: "فشل في إعادة توليد كود التحقق",
        type: "error"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // نسخ كود التحقق إلى الحافظة
  const copyDeliveryCode = () => {
    if (!displayDeliveryCode) return;
    
    navigator.clipboard.writeText(displayDeliveryCode);
    toast({
      title: "تم النسخ",
      description: "تم نسخ كود التحقق إلى الحافظة",
      type: "success"
    });
  };

  // إرسال كود التحقق عبر الواتساب
  const sendCodeViaWhatsApp = () => {
    if (!displayDeliveryCode || !agentData?.phone) return;
    
    const phone = agentData.phone.replace(/\+/g, '');
    let message = `كود التوصيل الخاص بك: ${displayDeliveryCode}`;
    if (passwordSetByAdmin) {
      message += `\nكلمة المرور: ${passwordSetByAdmin}`;
    }
    message += "\n\nيرجى الحفاظ على سرية هذه المعلومات.";
    // تحذير: إرسال كلمات المرور عبر واتساب/SMS غير آمن.
    // Consider providing this information through a more secure channel.
    console.warn("Security Risk: Sending password via WhatsApp/SMS.");

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // إرسال كود التحقق عبر الرسائل القصيرة (SMS)
  const sendCodeViaSMS = () => {
    if (!displayDeliveryCode) return;
    
    let message = `كود التوصيل الخاص بك: ${displayDeliveryCode}`;
    if (passwordSetByAdmin) {
      message += `\nكلمة المرور: ${passwordSetByAdmin}`;
    }
    message += "\n\nيرجى الحفاظ على سرية هذه المعلومات.";
    // تحذير: إرسال كلمات المرور عبر واتساب/SMS غير آمن.
    // Consider providing this information through a more secure channel.
    console.warn("Security Risk: Sending password via WhatsApp/SMS.");

    // هذه دالة وهمية، يجب استبدالها بمنطق حقيقي لإرسال SMS
    // For a real implementation, you would use an SMS gateway API here.
    // Example: sendSmsApi(agentData.phone, message);
    toast({
      title: "تم إعداد رسالة SMS", // Changed title to reflect it's prepared, not actually sent by this mock function
      description: `تم تجهيز الرسالة: ${message}`,
      type: "success"
    });
    console.log("SMS message to be sent:", message);
    if (agentData?.phone) {
      console.log("To phone number (for SMS gateway):", agentData.phone);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">جاري تحميل بيانات المندوب...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="max-h-[80vh] overflow-auto">
        <CardHeader>
          <CardTitle>ملخص بيانات المندوب</CardTitle>
          <CardDescription>
            عرض جميع المعلومات الخاصة بالمندوب وكود التحقق
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!agentData ? (
            <div className="text-center p-4 text-red-600">
              لم يتم العثور على بيانات المندوب
            </div>
          ) : (
            <div className="space-y-6">
              {/* بطاقة بيانات المندوب */}
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-200 overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* صورة المندوب */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="relative w-16 h-16 min-w-[4rem] min-h-[4rem] max-w-[4rem] max-h-[4rem] rounded-full border-2 border-gray-200 bg-gray-100 overflow-hidden mb-2">
                      {agentData.profile_image_url ? (
                        <Image 
                          src={getPublicImageUrl("agents-documents", agentData.profile_image_url) || ''} 
                          alt={agentData.full_name || 'صورة المندوب'} 
                          fill
                          sizes="(max-width: 768px) 100vw, 64px"
                          className="object-cover"
                          style={{ objectPosition: 'center top' }}
                          priority
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <Badge variant={agentData.status === 'active' ? 'default' : 'secondary'}>
                      {agentData.status === 'active' ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                  
                  {/* المعلومات الأساسية */}
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">الاسم الكامل</div>
                      <div className="font-semibold text-lg">{agentData.full_name || 'غير محدد'}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">رقم الهاتف</div>
                      <div className="font-semibold flex items-center">
                        <Phone className="h-4 w-4 ml-1 text-gray-400" />
                        {agentData.phone || 'غير محدد'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">البريد الإلكتروني</div>
                      <div className="font-semibold flex items-center">
                        <Mail className="h-4 w-4 ml-1 text-gray-400" />
                        {agentData.email || 'غير محدد'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">تاريخ الميلاد</div>
                      <div className="font-semibold flex items-center">
                        <Calendar className="h-4 w-4 ml-1 text-gray-400" />
                        {agentData.birth_date ? new Date(agentData.birth_date).toLocaleDateString('ar-EG', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : 'غير محدد'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">رقم الهوية</div>
                      <div className="font-semibold flex items-center">
                        <FileText className="h-4 w-4 ml-1 text-gray-400" />
                        {agentData.national_id || 'غير محدد'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">رقم رخصة القيادة</div>
                      <div className="font-semibold flex items-center">
                        <Shield className="h-4 w-4 ml-1 text-gray-400" />
                        {agentData.driver_license_number || 'غير محدد'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">نوع المركبة المفضلة</div>
                      <div className="font-semibold flex items-center">
                        <Car className="h-4 w-4 ml-1 text-gray-400" />
                        {agentData.preferred_vehicle || 'غير محدد'}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">تاريخ التسجيل</div>
                      <div className="font-semibold flex items-center">
                        <Calendar className="h-4 w-4 ml-1 text-gray-400" />
                        {agentData.created_at ? new Date(agentData.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* قسم كود التحقق وكلمة المرور المحددة من المشرف */}
              <Card>
                <CardHeader>
                  <CardTitle>بيانات تسجيل الدخول الأولية</CardTitle>
                  <CardDescription>
                    سيستخدم المندوب هذه البيانات لتسجيل الدخول لأول مرة.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {displayDeliveryCode && (
                    <div className="space-y-2">
                      <Label htmlFor="deliveryCodeDisplay">رمز التوصيل (Delivery Code)</Label>
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <span id="deliveryCodeDisplay" className="text-lg font-mono font-bold text-blue-700 tracking-wider">{displayDeliveryCode}</span>
                        <Button variant="outline" size="icon" onClick={copyDeliveryCode} title="نسخ الرمز">
                          <ClipboardCopy className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={regenerateDeliveryCode} disabled={isRegenerating} title="إعادة توليد الرمز">
                          {isRegenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        يمكن للمندوب استخدام هذا الرمز مع كلمة المرور أدناه لتسجيل الدخول.
                      </p>
                    </div>
                  )}
                  {passwordSetByAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="passwordDisplay">كلمة المرور المحددة من المشرف</Label>
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <span id="passwordDisplay" className="text-lg font-mono text-green-700">{passwordSetByAdmin}</span>
                        {/* Add a copy button for password if desired, but be mindful of security implications */}
                      </div>
                      <p className="text-xs text-gray-500">
                        هذه هي كلمة المرور التي قمت بتعيينها للمندوب. يرجى تزويده بها.
                      </p>
                    </div>
                  )}
                  
                  {/* إضافة أزرار إرسال بيانات الاعتماد */}
                  {(displayDeliveryCode || passwordSetByAdmin) && (
                    <div className="mt-4 space-y-2">
                      <Label>إرسال بيانات الاعتماد</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="flex items-center gap-2"
                          onClick={sendCodeViaWhatsApp}
                          disabled={!displayDeliveryCode || !agentData?.phone}
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>إرسال عبر واتساب</span>
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex items-center gap-2"
                          onClick={sendCodeViaSMS}
                          disabled={!displayDeliveryCode || !agentData?.phone}
                        >
                          <Phone className="h-4 w-4" />
                          <span>إرسال عبر SMS</span>
                        </Button>
                      </div>
                      {(!agentData?.phone) && (
                        <p className="text-xs text-amber-500">
                          لا يمكن إرسال البيانات: رقم الهاتف غير متوفر للمندوب
                        </p>
                      )}
                    </div>
                  )}
                  
                  {!displayDeliveryCode && !passwordSetByAdmin && (
                     <p className="text-center text-gray-500">بيانات تسجيل الدخول غير متوفرة حاليًا.</p>
                  )}
                </CardContent>
              </Card>
              
              {/* مناطق العمل */}
              <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                <h3 className="text-lg font-semibold mb-4 text-green-800">مناطق العمل</h3>
                {isLoading ? (
                  <div className="text-center p-4 text-gray-500">
                    جاري تحميل مناطق العمل...
                  </div>
                ) : zones.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">
                    لم يتم تعيين مناطق عمل للمندوب بعد
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {zones.map((zone) => (
                      <div key={zone.id} className="bg-white p-3 rounded border border-green-200 flex items-center">
                        <MapPin className="h-5 w-5 ml-2 text-green-600" />
                        <span className="font-medium">{zone.zone_name}</span>
                        <div className="mr-auto flex gap-2">
                          <Badge variant={zone.is_active ? 'outline' : 'secondary'} className="mr-1">
                            {zone.is_active ? 'مفعلة' : 'معطلة'}
                          </Badge>
                          <Badge variant={zone.is_primary ? 'default' : 'outline'}>
                            {zone.is_primary ? 'أساسية' : 'ثانوية'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-6">
        <Button onClick={onBack}>إلغاء</Button>
        <Button onClick={onComplete}>إكمال وإنهاء</Button>
      </div>
    </div>
  );
} 