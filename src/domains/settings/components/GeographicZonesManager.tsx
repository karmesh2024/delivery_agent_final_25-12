"use client";

import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Switch } from "@/shared/ui/switch";
import { AlertCircle, CheckCircle2, PlusCircle, MapPin, X, Pencil, Map } from "lucide-react";
import { useToast } from "@/shared/ui/toast";
import { Badge } from "@/shared/ui/badge";
import { SimpleMapDrawer } from "./SimpleMapDrawer";
import {
  getGeographicZones,
  addGeographicZone,
  updateGeographicZone,
  deleteGeographicZone
} from "@/lib/supabase";
import { GeographicZone, GeographicZoneFormData, GeoJSONPolygon, GeoJSONPoint, ApiGeographicZone } from "../types";

export function GeographicZonesManager() {
  const { toast } = useToast();
  const [zones, setZones] = useState<ApiGeographicZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // حالة نموذج إضافة/تعديل المنطقة
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentZoneId, setCurrentZoneId] = useState<string | null>(null);
  const [formData, setFormData] = useState<GeographicZoneFormData>({
    name: "",
    description: "",
    is_active: true
  });
  const [areaData, setAreaData] = useState<{
    area_polygon: GeoJSONPolygon;
    center_point: GeoJSONPoint;
    bounds: { north: number; south: number; east: number; west: number };
  } | null>(null);
  const [showMap, setShowMap] = useState(false);

  // جلب المناطق الجغرافية عند تحميل المكون
  useEffect(() => {
    loadZones();
  }, []);

  // عند فتح/إغلاق الحوار
  useEffect(() => {
    if (isFormDialogOpen) {
      // تأخير عرض الخريطة بعد فتح النافذة لضمان التهيئة الصحيحة
      const timer = setTimeout(() => {
        setShowMap(true);
      }, 800); // زيادة وقت الانتظار لإعطاء الحوار وقت كافي للفتح

      return () => {
        clearTimeout(timer);
      };
    } else {
      // إيقاف عرض الخريطة عند إغلاق الحوار للتأكد من تنظيف الموارد
      setShowMap(false);
      
      // تنظيف أي خرائط متبقية إذا كانت متاحة عند إغلاق الحوار
      if (typeof window !== 'undefined' && typeof window.L !== 'undefined') {
        try {
          const L = window.L;
          if (L.maps) {
            Object.keys(L.maps).forEach(id => {
              try {
                const map = L.maps[id];
                if (map && typeof map.remove === 'function') {
                  console.log(`تنظيف الخريطة عند إغلاق الحوار: ${id}`);
                  map.off();
                  map.remove();
                  delete L.maps[id];
                }
              } catch (error) {
                console.error('خطأ أثناء تنظيف الخريطة:', error);
              }
            });
          }
        } catch (error) {
          console.error('خطأ أثناء محاولة تنظيف الخرائط:', error);
        }
      }
    }
  }, [isFormDialogOpen]);

  const loadZones = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const zonesData = await getGeographicZones();
      setZones(zonesData);
    } catch (error) {
      console.error("خطأ أثناء جلب المناطق الجغرافية:", error);
      setErrorMessage("فشل في جلب المناطق الجغرافية");
      toast({
        title: "خطأ",
        description: "فشل جلب المناطق الجغرافية",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // فتح نموذج إضافة منطقة جديدة
  const openAddZoneForm = () => {
    setIsEditMode(false);
    setCurrentZoneId(null);
    setFormData({
      name: "",
      description: "",
      is_active: true
    });
    setAreaData(null);
    setIsFormDialogOpen(true);
  };

  // فتح نموذج تعديل منطقة موجودة
  const openEditZoneForm = (zone: GeographicZone) => {
    setIsEditMode(true);
    setCurrentZoneId(zone.id);
    setFormData({
      name: zone.name,
      description: zone.description,
      is_active: zone.is_active
    });
    setAreaData({
      area_polygon: zone.area_polygon,
      center_point: zone.center_point,
      bounds: extractBoundsFromPolygon(zone.area_polygon)
    });
    setIsFormDialogOpen(true);
  };

  // استخراج حدود المنطقة من البيانات الجغرافية
  const extractBoundsFromPolygon = (polygon: GeoJSONPolygon): { north: number; south: number; east: number; west: number } => {
    try {
      if (!polygon.coordinates || !polygon.coordinates[0] || polygon.coordinates[0].length === 0) {
        return { north: 24, south: 24, east: 46, west: 46 }; // قيم افتراضية لمركز السعودية
      }

      let north = -90, south = 90, east = -180, west = 180;
      
      polygon.coordinates[0].forEach(coord => {
        const lng = coord[0];
        const lat = coord[1];
        
        north = Math.max(north, lat);
        south = Math.min(south, lat);
        east = Math.max(east, lng);
        west = Math.min(west, lng);
      });
      
      return { north, south, east, west };
    } catch (error) {
      console.error("خطأ في استخراج حدود المنطقة:", error);
      return { north: 24, south: 24, east: 46, west: 46 }; // قيم افتراضية لمركز السعودية
    }
  };

  // تغيير قيم نموذج البيانات
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // تغيير قيمة التفعيل
  const handleToggleChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_active: checked }));
  };

  // معالجة تحديد منطقة على الخريطة
  const handleAreaDefined = (data: {
    area_polygon: GeoJSONPolygon;
    center_point: GeoJSONPoint;
    bounds: { north: number; south: number; east: number; west: number };
  }) => {
    setAreaData(data);
  };

  // حفظ المنطقة (إضافة أو تعديل)
  const handleSaveZone = async () => {
    if (!formData.name.trim()) {
      setErrorMessage("يرجى إدخال اسم المنطقة");
      return;
    }

    if (!areaData) {
      setErrorMessage("يرجى تحديد المنطقة على الخريطة");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      const zoneData = {
        name: formData.name.trim(),
        description: formData.description,
        area_polygon: areaData.area_polygon,
        center_point: areaData.center_point,
        is_active: formData.is_active
      };

      if (isEditMode && currentZoneId) {
        // تحديث منطقة موجودة
        const success = await updateGeographicZone(currentZoneId, zoneData);
        
        if (success) {
          setZones(prev => 
            prev.map(zone => 
              zone.id === currentZoneId ? { ...zone, ...zoneData } : zone
            )
          );
          
          toast({
            title: "تم التحديث",
            description: `تم تحديث منطقة ${formData.name} بنجاح`,
            type: "success"
          });
          
          setIsFormDialogOpen(false);
        } else {
          setErrorMessage("فشل تحديث المنطقة. يرجى المحاولة مرة أخرى.");
        }
      } else {
        // إضافة منطقة جديدة
        const newZone = await addGeographicZone(zoneData);
        
        if (newZone) {
          setZones(prev => [...prev, newZone]);
          setSuccessMessage(`تم إضافة منطقة ${formData.name} بنجاح`);
          toast({
            title: "تم بنجاح",
            description: `تم إضافة منطقة ${formData.name} بنجاح`,
            type: "success"
          });
          
          setIsFormDialogOpen(false);
        } else {
          setErrorMessage("فشل إضافة المنطقة. يرجى المحاولة مرة أخرى.");
        }
      }
    } catch (error) {
      console.error("خطأ أثناء حفظ المنطقة:", error);
      setErrorMessage("حدث خطأ أثناء حفظ المنطقة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // حذف منطقة
  const handleDeleteZone = async (zoneId: string, zoneName: string) => {
    if (!confirm(`هل أنت متأكد من حذف منطقة "${zoneName}"؟`)) {
      return;
    }
    
    try {
      const success = await deleteGeographicZone(zoneId);
      
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

  // تغيير حالة المنطقة (مفعلة/معطلة)
  const handleToggleZoneStatus = async (zoneId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const success = await updateGeographicZone(zoneId, { is_active: newStatus });
      
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

  // استخراج النقاط من البيانات الجغرافية للعرض على الخريطة
  const extractPolygonPoints = (geoPolygon: GeoJSONPolygon): Array<[number, number]> | undefined => {
    try {
      if (!geoPolygon || !geoPolygon.coordinates || !geoPolygon.coordinates[0]) {
        return undefined;
      }
      
      return geoPolygon.coordinates[0].map(coord => [coord[1], coord[0]]);
    } catch (error) {
      console.error("خطأ في استخراج نقاط المضلع:", error);
      return undefined;
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>إدارة المناطق الجغرافية</CardTitle>
            <CardDescription>
              إضافة وإدارة المناطق الجغرافية للمندوبين
            </CardDescription>
          </div>
          <Button onClick={openAddZoneForm}>
            <PlusCircle className="h-4 w-4 ml-2" />
            إضافة منطقة جديدة
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-8">
              <p className="text-gray-500">جاري تحميل المناطق الجغرافية...</p>
            </div>
          ) : zones.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <MapPin className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">لم يتم إضافة أي مناطق جغرافية بعد</p>
              <Button onClick={openAddZoneForm} variant="outline" className="mt-4">
                <PlusCircle className="h-4 w-4 ml-2" />
                إضافة منطقة جديدة
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {zones.map((zone) => (
                <Card key={zone.id} className="overflow-hidden border">
                  <div className="p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium flex items-center">
                        <MapPin className={`h-5 w-5 ml-2 ${zone.is_active ? 'text-green-500' : 'text-gray-400'}`} />
                        {zone.name}
                      </h3>
                      <Badge className={zone.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {zone.is_active ? 'مفعّلة' : 'معطّلة'}
                      </Badge>
                    </div>
                    
                    {zone.description && (
                      <p className="text-sm text-gray-600 mb-4">{zone.description}</p>
                    )}
                    
                    <div className="flex-grow"></div>
                    
                    <div className="flex justify-between mt-4">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditZoneForm(zone)}
                          className="h-9 px-2"
                        >
                          <Pencil className="h-4 w-4 ml-1" />
                          تعديل
                        </Button>
                        <Switch
                          checked={zone.is_active}
                          onCheckedChange={() => handleToggleZoneStatus(zone.id, zone.is_active)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteZone(zone.id, zone.name)}
                        className="h-9 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* مربع حوار إضافة/تعديل منطقة */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "تعديل منطقة جغرافية" : "إضافة منطقة جغرافية جديدة"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
               ? "قم بتعديل بيانات المنطقة الجغرافية وحدودها على الخريطة" 
               : "أدخل بيانات المنطقة الجديدة وحدد حدودها على الخريطة"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 flex-grow">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المنطقة</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="أدخل اسم المنطقة"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="is_active">الحالة</Label>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={handleToggleChange}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="is_active" className="mr-2">
                    {formData.is_active ? "مفعّلة" : "معطّلة"}
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">وصف المنطقة</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="أدخل وصفاً للمنطقة (اختياري)"
                disabled={isSubmitting}
                rows={3}
              />
            </div>
            
            <div className="space-y-2 flex-grow">
              <Label className="flex items-center">
                <Map className="h-4 w-4 ml-1" />
                رسم حدود المنطقة
              </Label>
              <div className="h-[450px] relative">
                {showMap ? (
                  <SimpleMapDrawer 
                    key={`zone-map-${isFormDialogOpen}-${Date.now()}`}
                    onAreaDefined={handleAreaDefined}
                    initialPolygon={isEditMode && areaData?.area_polygon 
                      ? extractPolygonPoints(areaData.area_polygon) 
                      : undefined}
                  />
                ) : (
                  <div className="h-[400px] w-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="mb-2">جاري تحميل الخريطة...</div>
                      <div className="w-8 h-8 border-4 border-t-blue-500 border-b-gray-200 border-l-gray-200 border-r-gray-200 rounded-full animate-spin mx-auto"></div>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                استخدم أدوات الرسم في الأعلى لتحديد حدود المنطقة على الخريطة
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-4 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setIsFormDialogOpen(false)}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveZone}
              disabled={isSubmitting || !formData.name.trim() || !areaData}
              className={isSubmitting ? "cursor-not-allowed opacity-70" : ""}
            >
              {isSubmitting ? "جاري الحفظ..." : isEditMode ? "حفظ التغييرات" : "إضافة المنطقة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 