"use client";

import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { AlertCircle, CheckCircle2, MapPin, X, Search } from "lucide-react";
import { 
  addDeliveryZone, 
  getDeliveryZones, 
  deleteDeliveryZone, 
  updateDeliveryZoneStatus,
  updateDeliveryZonePrimary,
  getGeographicZones
} from "@/lib/supabase";
import { useToast } from "@/shared/ui/toast";
import { Switch } from "@/shared/ui/switch";
import { GeographicZone, GeoJSONPolygon, GeoJSONPoint } from "@/domains/settings/types/index";

interface AgentZonesManagerProps {
  agentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Zone {
  id: string;
  zone_name: string;
  is_active: boolean;
  created_at: string;
  is_primary: boolean;
}

// تعريف نوع مكّيف للمناطق الجغرافية المسترجعة من API
type ApiGeographicZone = Omit<GeographicZone, 'area_polygon' | 'center_point'> & {
  area_polygon: GeoJSONPolygon | unknown;
  center_point: GeoJSONPoint | unknown;
};

export function AgentZonesManager({ agentId, onSuccess, onCancel }: AgentZonesManagerProps) {
  const { toast } = useToast();
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [geographicZones, setGeographicZones] = useState<ApiGeographicZone[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [rowPrimaryState, setRowPrimaryState] = useState<Record<string, boolean>>({});
  
  // جلب مناطق المندوب عند تحميل المكون
  useEffect(() => {
    loadZones();
    loadGeographicZones();
  }, [agentId]);

  // وظيفة جلب المناطق الجغرافية العامة
  const loadGeographicZones = async () => {
    try {
      const zonesData = await getGeographicZones();
      // تصفية المناطق النشطة فقط
      setGeographicZones(zonesData.filter(zone => zone.is_active));
    } catch (error) {
      console.error("خطأ أثناء جلب المناطق الجغرافية:", error);
      toast({
        title: "خطأ",
        description: "فشل جلب المناطق الجغرافية",
        type: "error"
      });
    }
  };

  const loadZones = async () => {
    setIsLoading(true);
    try {
      const zonesData = await getDeliveryZones(agentId);
      setZones(zonesData);
    } catch (error) {
      console.error("خطأ أثناء جلب مناطق المندوب:", error);
      toast({
        title: "خطأ",
        description: "فشل جلب مناطق المندوب",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleZoneStatus = async (zoneId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const success = await updateDeliveryZoneStatus(zoneId, newStatus);
      
      if (success) {
        setZones(prev => 
          prev.map(zone => 
            zone.id === zoneId ? { ...zone, is_active: newStatus } : zone
          )
        );
        
        toast({
          title: "تم تحديث الحالة",
          description: `تم ${newStatus ? 'تفعيل' : 'تعطيل'} المنطقة بنجاح`,
          type: "success"
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل تحديث حالة المنطقة",
          type: "error"
        });
      }
    } catch (error) {
      console.error("خطأ أثناء تحديث حالة المنطقة:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة المنطقة",
        type: "error"
      });
    }
  };

  // وظيفة تحديث حالة المنطقة (أساسية/ثانوية)
  const handleTogglePrimaryStatus = async (zoneId: string, currentPrimaryStatus: boolean) => {
    try {
      const newStatus = !currentPrimaryStatus;
      const success = await updateDeliveryZonePrimary(zoneId, newStatus);
      
      if (success) {
        setZones(prev => 
          prev.map(zone => 
            zone.id === zoneId ? { ...zone, is_primary: newStatus } : zone
          )
        );
        
        toast({
          title: "تم تحديث النوع",
          description: `تم تغيير نوع المنطقة إلى ${newStatus ? 'أساسية' : 'ثانوية'} بنجاح`,
          type: "success"
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل تحديث نوع المنطقة",
          type: "error"
        });
      }
    } catch (error) {
      console.error("خطأ أثناء تحديث نوع المنطقة:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث نوع المنطقة",
        type: "error"
      });
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const success = await deleteDeliveryZone(zoneId);
      
      if (success) {
        setZones(prev => prev.filter(zone => zone.id !== zoneId));
        
        toast({
          title: "تم الحذف",
          description: "تم حذف المنطقة بنجاح",
          type: "success"
        });
      } else {
        toast({
          title: "خطأ",
          description: "فشل حذف المنطقة",
          type: "error"
        });
      }
    } catch (error) {
      console.error("خطأ أثناء حذف المنطقة:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المنطقة",
        type: "error"
      });
    }
  };

  const handleFinish = () => {
    if (zones.length === 0) {
      setErrorMessage("يرجى إضافة منطقة واحدة على الأقل");
      return;
    }
    
    onSuccess();
  };

  // تصفية المناطق الجغرافية بناءً على مصطلح البحث
  const filteredGeographicZones = geographicZones.filter(zone => 
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (zone.description && zone.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // إضافة منطقة جغرافية للمندوب
  const handleAddGeographicZoneFromTable = async (zoneId: string, isPrimary: boolean) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const selectedZoneDetails = geographicZones.find(z => z.id === zoneId);
      if (!selectedZoneDetails) {
        setErrorMessage("المنطقة المختارة غير موجودة.");
        setIsSubmitting(false);
        return;
      }
      const newZone = await addDeliveryZone({
        delivery_id: agentId,
        zone_name: selectedZoneDetails.name,
        is_active: true,
        geographic_zone_id: selectedZoneDetails.id,
        is_primary: isPrimary
      });
      if (newZone) {
        // Typecasting the newZone to Zone type instead of using ts-ignore
        setZones(prev => [...prev, newZone as Zone]);
        setSuccessMessage(`تم إضافة منطقة ${selectedZoneDetails.name} بنجاح كمنطقة ${isPrimary ? 'أساسية' : 'ثانوية'}`);
        toast({ title: "تم بنجاح", description: `تم إضافة منطقة ${selectedZoneDetails.name} بنجاح`, type: "success" });
      } else {
        setErrorMessage("فشل إضافة المنطقة.");
      }
    } catch (error) {
      console.error("خطأ أثناء إضافة المنطقة:", error);
      setErrorMessage("حدث خطأ أثناء إضافة المنطقة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowPrimaryChange = (zoneId: string, checked: boolean) => {
    setRowPrimaryState(prev => ({
      ...prev,
      [zoneId]: checked
    }));
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md text-sm flex items-center">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          {successMessage}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>إدارة مناطق عمل المندوب</CardTitle>
          <CardDescription>
            إضافة وإدارة المناطق التي يقوم المندوب بالتوصيل فيها
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <Label htmlFor="geographic_zone_search">اختر من المناطق الجغرافية المسجلة</Label>
              <Input 
                id="geographic_zone_search"
                placeholder="ابحث باسم المنطقة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
              
              {geographicZones.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">لا توجد مناطق جغرافية معرفة حالياً. قم بإضافتها من الإعدادات أولاً.</p>
              )}
              
              {geographicZones.length > 0 && (
                <div className="mt-2 border rounded-md max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/50 z-10">
                      <tr className="text-right">
                        <th className="p-2 font-medium">اسم المنطقة</th>
                        <th className="p-2 font-medium text-center w-1/4">نوع المنطقة</th>
                        <th className="p-2 font-medium text-center w-1/5">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGeographicZones.length === 0 && searchTerm && (
                        <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">لا توجد مناطق تطابق بحثك.</td></tr>
                      )}
                      {filteredGeographicZones.map((zone) => (
                        <tr key={zone.id} className="border-b last:border-b-0 hover:bg-muted/30">
                          <td className="p-2">{zone.name}</td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="flex items-center mr-2">
                                <Switch 
                                  checked={rowPrimaryState[zone.id] || false}
                                  onCheckedChange={(checked) => handleRowPrimaryChange(zone.id, checked)}
                                  id={`primary-switch-${zone.id}`}
                                />
                                <Label 
                                  htmlFor={`primary-switch-${zone.id}`} 
                                  className="mr-2 cursor-pointer text-sm font-medium"
                                >
                                  {rowPrimaryState[zone.id] ? 'أساسية' : 'ثانوية'}
                                </Label>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleAddGeographicZoneFromTable(zone.id, rowPrimaryState[zone.id] || false)}
                              disabled={isSubmitting}
                              className="px-4 py-1 h-auto"
                            >
                              إضافة
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <h3 className="text-md font-medium border-t pt-6 mt-2">مناطق العمل الحالية للمندوب</h3>
            
            {isLoading ? (
              <div className="text-center p-8">
                <p className="text-gray-500">جاري تحميل مناطق العمل...</p>
              </div>
            ) : zones.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">لم يتم إضافة أي مناطق عمل بعد</p>
              </div>
            ) : (
              <div className="divide-y">
                {zones.map((zone) => (
                  <div key={zone.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center flex-wrap">
                      <MapPin className={`h-5 w-5 mr-2 ${zone.is_active ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="font-medium mr-2">{zone.zone_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${
                        zone.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {zone.is_active ? 'مفعّلة' : 'معطّلة'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        zone.is_primary === true ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {zone.is_primary === true ? 'أساسية' : 'ثانوية'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* مفتاح تبديل نوع المنطقة (أساسية/ثانوية) */}
                      <div className="flex items-center gap-1 text-xs mr-2">
                        <span className={zone.is_primary ? 'text-blue-600' : 'text-gray-500'}>
                          {zone.is_primary ? 'أساسية' : 'ثانوية'}
                        </span>
                        <Switch
                          checked={zone.is_primary}
                          onCheckedChange={() => handleTogglePrimaryStatus(zone.id, zone.is_primary)}
                        />
                      </div>
                      
                      {/* مفتاح تبديل حالة المنطقة (مفعلة/معطلة) */}
                      <Switch
                        checked={zone.is_active}
                        onCheckedChange={() => handleToggleZoneStatus(zone.id, zone.is_active)}
                      />
                      
                      {/* زر حذف المنطقة */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteZone(zone.id)}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              رجوع
            </Button>
            <Button 
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting || zones.length === 0}
              className={isSubmitting ? "cursor-not-allowed opacity-70" : ""}
            >
              إنهاء وحفظ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 