import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/use-toast';
import { FiPlus, FiTrash } from 'react-icons/fi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { AlertCircle, CheckCircle2, MapPin, X, Search } from "lucide-react";
import { Switch } from "@/shared/ui/switch";
import { GeographicZone, GeoJSONPolygon, GeoJSONPoint, ApprovedAgentZone } from "@/types";
import { approvedAgentService } from '@/domains/approved-agents/api/approvedAgentService';

export interface ApprovedAgentZonesManagerProps {
  agentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// تعريف نوع مكّيف للمناطق الجغرافية المسترجعة من API
type ApiGeographicZone = Omit<GeographicZone, 'area_polygon' | 'center_point'> & {
  area_polygon: GeoJSONPolygon | unknown;
  center_point: GeoJSONPoint | unknown;
};

export const ApprovedAgentZonesManager: React.FC<ApprovedAgentZonesManagerProps> = ({ agentId, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [zones, setZones] = useState<ApprovedAgentZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [geographicZones, setGeographicZones] = useState<ApiGeographicZone[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // جلب مناطق المندوب عند تحميل المكون
  useEffect(() => {
    loadZones();
    loadGeographicZones();
  }, [agentId]);

  // وظيفة جلب المناطق الجغرافية العامة
  const loadGeographicZones = async () => {
    try {
      const { data, error } = await approvedAgentService.getGeographicZones();
      if (error) throw error;
      setGeographicZones(data ? data.filter(zone => zone.is_active) : []);
    } catch (error) {
      console.error("خطأ أثناء جلب المناطق الجغرافية:", error);
      toast({
        title: "خطأ",
        description: "فشل جلب المناطق الجغرافية",
        variant: "destructive"
      });
    }
  };

  const loadZones = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await approvedAgentService.getApprovedAgentZones(agentId);
      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error("خطأ أثناء جلب مناطق الوكيل:", error);
      toast({
        title: "خطأ",
        description: "فشل جلب مناطق الوكيل",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleZoneStatus = async (zoneId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await approvedAgentService.updateApprovedAgentZoneStatus(zoneId, newStatus);
      
      if (!error) {
        setZones(prev => 
          prev.map(zone => 
            zone.id === zoneId ? { ...zone, is_active: newStatus } : zone
          )
        );
        
        toast({
          title: "تم تحديث الحالة",
          description: `تم ${newStatus ? 'تفعيل' : 'تعطيل'} المنطقة بنجاح`,
          variant: "success"
        });
      } else {
        throw error;
      }
    } catch (error) {
      console.error("خطأ أثناء تحديث حالة المنطقة:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة المنطقة",
        variant: "destructive"
      });
    }
  };

  // وظيفة تحديث حالة المنطقة (أساسية/ثانوية)
  const handleTogglePrimaryStatus = async (zoneId: string, currentPrimaryStatus: boolean) => {
    try {
      const newStatus = !currentPrimaryStatus;
      const { error } = await approvedAgentService.updateApprovedAgentZonePrimary(zoneId, newStatus);
      
      if (!error) {
        setZones(prev => 
          prev.map(zone => 
            zone.id === zoneId ? { ...zone, is_primary: newStatus } : zone
          )
        );
        
        toast({
          title: "تم تحديث النوع",
          description: `تم تغيير نوع المنطقة إلى ${newStatus ? 'أساسية' : 'ثانوية'} بنجاح`,
          variant: "success"
        });

        // إذا تم تفعيل هذه المنطقة كأساسية، قم بتعطيل الأساسية في جميع المناطق الأخرى
        if (newStatus) {
          setZones(prev => 
            prev.map(zone => 
              zone.id !== zoneId ? { ...zone, is_primary: false } : zone
            )
          );
        }

      } else {
        throw error;
      }
    } catch (error) {
      console.error("خطأ أثناء تحديث نوع المنطقة:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث نوع المنطقة",
        variant: "destructive"
      });
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const { error } = await approvedAgentService.deleteApprovedAgentZone(zoneId);
      
      if (!error) {
        setZones(prev => prev.filter(zone => zone.id !== zoneId));
        
        toast({
          title: "تم الحذف",
          description: "تم حذف المنطقة بنجاح",
          variant: "success"
        });
      } else {
        throw error;
      }
    } catch (error) {
      console.error("خطأ أثناء حذف المنطقة:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المنطقة",
        variant: "destructive"
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

  // إضافة منطقة جغرافية للوكيل
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
      const { data: newZone, error } = await approvedAgentService.addApprovedAgentZone({
        agent_id: agentId,
        zone_name: selectedZoneDetails.name,
        is_active: true,
        geographic_zone_id: selectedZoneDetails.id,
        is_primary: isPrimary
      });
      if (!error && newZone) {
        setZones(prev => {
          let updatedZones = [...prev, newZone];
          // إذا كانت المنطقة الجديدة أساسية، قم بتعطيل الأساسية في جميع المناطق الأخرى
          if (isPrimary) {
            updatedZones = updatedZones.map(zone => 
              zone.id !== newZone.id ? { ...zone, is_primary: false } : zone
            );
          }
          return updatedZones;
        });
        setSuccessMessage(`تم إضافة منطقة ${selectedZoneDetails.name} بنجاح كمنطقة ${isPrimary ? 'أساسية' : 'ثانوية'}`);
        toast({ title: "تم بنجاح", description: `تم إضافة منطقة ${selectedZoneDetails.name} بنجاح`, variant: "success" });
      } else {
        throw error;
      }
    } catch (error) {
      console.error("خطأ أثناء إضافة المنطقة:", error);
      setErrorMessage("حدث خطأ أثناء إضافة المنطقة.");
    } finally {
      setIsSubmitting(false);
    }
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
          <CardTitle>مناطق عمل الوكيل المعتمد</CardTitle>
          <CardDescription>إدارة المناطق التي يغطيها الوكيل المعتمد.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>جاري تحميل المناطق...</p>
          ) : zones.length === 0 ? (
            <p className="text-gray-500">لم يتم تحديد مناطق لهذا الوكيل بعد. يرجى إضافة مناطق من القائمة أدناه.</p>
          ) : (
            <div className="space-y-4">
              {zones.map(zone => (
                <div key={zone.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                    <span>{zone.zone_name}</span>
                    {zone.is_primary && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">أساسية</span>}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={zone.is_active === true}
                        onCheckedChange={(checked) => handleToggleZoneStatus(zone.id, zone.is_active === true)}
                        aria-label={`تفعيل/تعطيل ${zone.zone_name}`}
                      />
                      <Label htmlFor={`status-switch-${zone.id}`}>
                        {zone.is_active ? 'نشط' : 'غير نشط'}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={zone.is_primary === true}
                        onCheckedChange={(checked) => handleTogglePrimaryStatus(zone.id, zone.is_primary === true)}
                        aria-label={`تعيين ${zone.zone_name} كمنطقة أساسية`}
                      />
                      <Label htmlFor={`primary-switch-${zone.id}`}>
                        أساسي
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteZone(zone.id)}
                    >
                      <FiTrash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إضافة مناطق جغرافية</CardTitle>
          <CardDescription>ابحث عن المناطق الجغرافية المتاحة لإضافتها للوكيل المعتمد.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Input
              type="text"
              placeholder="ابحث عن منطقة جغرافية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow max-w-sm"
            />
          </div>

          {filteredGeographicZones.length === 0 ? (
            <p className="text-gray-500 mt-4">لا توجد مناطق جغرافية متاحة تطابق بحثك.</p>
          ) : (
            <div className="mt-4 border rounded-md">
              {filteredGeographicZones.map(zone => (
                <div key={zone.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{zone.name}</span>
                    {zone.description && <span className="text-sm text-gray-500 ml-2">({zone.description})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddGeographicZoneFromTable(zone.id, false)}
                      disabled={zones.some(az => az.geographic_zone_id === zone.id) || isSubmitting}
                    >
                      {zones.some(az => az.geographic_zone_id === zone.id) ? "تم الإضافة" : "إضافة كمنطقة ثانوية"}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAddGeographicZoneFromTable(zone.id, true)}
                      disabled={zones.some(az => az.geographic_zone_id === zone.id && az.is_primary === true) || isSubmitting}
                    >
                      {zones.some(az => az.geographic_zone_id === zone.id && az.is_primary === true) ? "تم الإضافة كأساسية" : "إضافة كمنطقة أساسية"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          السابق
        </Button>
        <Button type="button" onClick={handleFinish} disabled={isSubmitting}>
          الانتهاء ومتابعة
        </Button>
      </div>
    </div>
  );
}; 