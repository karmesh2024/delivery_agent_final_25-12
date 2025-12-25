"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Switch } from "@/shared/ui/switch";
import { AlertCircle, CheckCircle2, PlusCircle, MapPin, Save, X } from "lucide-react";
import { useToast } from "@/shared/ui/toast";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import dynamic from 'next/dynamic';
import CountryCityManagementForm from './CountryCityManagementForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

// استيراد الدوال والأنواع اللازمة من Supabase
import {
  getGeographicZones,
  addGeographicZone,
  updateGeographicZone,
  deleteGeographicZone
} from "@/lib/supabase";
import { GeographicZone, GeographicZoneFormData, GeoJSONPolygon, GeoJSONPoint, ApiGeographicZone, Coordinate } from "../types";

const SimpleMapDrawer = dynamic(
  () => import('./SimpleMapDrawer').then(mod => mod.SimpleMapDrawer),
  { ssr: false }
);

interface Country {
  id: string;
  name_ar: string;
  name_en: string;
}

interface City {
  id: string;
  name_ar: string;
  name_en: string;
  country_id: string;
}

export function DirectMapEditor() {
  const { toast } = useToast();
  const [zones, setZones] = useState<ApiGeographicZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("zoneslist");
  
  // حالة نموذج إضافة/تعديل المنطقة
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentZoneId, setCurrentZoneId] = useState<string | null>(null);
  const [formData, setFormData] = useState<GeographicZoneFormData>({
    name: "",
    description: "",
    is_active: true,
    city: "",
    country: ""
  });
  const [areaData, setAreaData] = useState<{
    area_polygon: GeoJSONPolygon;
    center_point: GeoJSONPoint;
    bounds: { north: number; south: number; east: number; west: number };
  } | null>(null);

  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  // Helper to fetch countries from API
  const fetchCountriesFromApi = async (): Promise<Country[]> => {
    const response = await fetch('/api/countries');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  // Helper to fetch cities from API for a given country_id
  const fetchCitiesFromApi = async (countryId: string): Promise<City[]> => {
    const response = await fetch(`/api/cities?country_id=${countryId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  // Mock API calls for countries and cities - Replace with actual API calls later
  const fetchAllCountriesAndCities = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const countriesData = await fetchCountriesFromApi();
      setAllCountries(countriesData);

      // Fetch all cities for all countries, or handle on country selection
      // For now, let's assume we'll fetch cities when a country is selected
      // Or if we need all cities initially, we'd loop through countries and fetch.
      // Given the current UI, fetching cities on country selection seems more appropriate.
      // However, the `allCities` state expects all cities upfront. Let's adjust this approach.
      // We'll fetch cities for the currently selected country, or initially for the first country if any.
      // Let's modify the useEffect for selectedCountryId to trigger city fetch
      
      // Initial fetch for all cities if needed, or adjust the state logic.
      // For now, removing the mock cities data and relying on `filteredCities` based on `selectedCountryId`.

    } catch (error) {
      console.error("خطأ أثناء جلب البلدان والمدن:", error);
      setErrorMessage("فشل في جلب البلدان والمدن");
      toast({
        title: "خطأ",
        description: "فشل جلب البلدان والمدن",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllCountriesAndCities();
  }, [fetchAllCountriesAndCities]);

  useEffect(() => {
    if (selectedCountryId) {
      // Fetch cities for the selected country from the API
      const loadCitiesForCountry = async () => {
        try {
          const citiesData = await fetchCitiesFromApi(selectedCountryId);
          setFilteredCities(citiesData);
        } catch (error) {
          console.error(`خطأ أثناء جلب المدن للبلد ${selectedCountryId}:`, error);
          setErrorMessage("فشل في جلب المدن للبلد المحدد");
          toast({
            title: "خطأ",
            description: "فشل جلب المدن للبلد المحدد",
            type: "error"
          });
        }
      };
      loadCitiesForCountry();
    } else {
      setFilteredCities([]);
    }
  }, [selectedCountryId, toast]);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const zonesData = await getGeographicZones();
      setZones(zonesData as unknown as ApiGeographicZone[]);
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
  const startAddZone = () => {
    setIsEditMode(false);
    setCurrentZoneId(null);
    setFormData({
      name: "",
      description: "",
      is_active: true,
      city: "",
      country: ""
    });
    setAreaData(null);
    setSelectedCountryId(null); // Reset selected country
    setFilteredCities([]); // Clear filtered cities
    setActiveTab("editmap");
  };

  // فتح نموذج تعديل منطقة موجودة
  const startEditZone = async (zone: GeographicZone) => {
    console.log("startEditZone called with zone:", zone);
    setIsEditMode(true);
    setCurrentZoneId(zone.id);

    const countryExists = allCountries.find(c => c.name_ar === zone.country || c.name_en === zone.country);
    const countryIdToSet = countryExists ? countryExists.id : null;
    setSelectedCountryId(countryIdToSet); // Set country ID first

    let citiesForSelectedCountry: City[] = [];
    if (countryIdToSet) {
      try {
        citiesForSelectedCountry = await fetchCitiesFromApi(countryIdToSet); // Fetch cities immediately
        setFilteredCities(citiesForSelectedCountry); // Update filteredCities state
      } catch (error) {
        console.error("Error fetching cities for selected country during edit:", error);
        // Handle error, maybe show a toast
      }
    }

    // Now use the potentially updated citiesForSelectedCountry or filteredCities for city search
    // Using citiesForSelectedCountry to ensure we use the just-fetched data
    const cityExists = citiesForSelectedCountry.find(c => c.name_ar === zone.city || c.name_en === zone.city);

    console.log("Zone description from prop:", zone.description);
    setFormData({
      name: zone.name,
      description: zone.description !== null && zone.description !== undefined ? zone.description : "",
      is_active: zone.is_active,
      city: cityExists ? cityExists.id : "", // Store city ID
      country: countryExists ? countryExists.id : "" // Store country ID
    });
    console.log("FormData after setting description:", formData.description);

    let parsedAreaPolygon: GeoJSONPolygon | null = null;
    let parsedCenterPoint: GeoJSONPoint | null = null;

    try {
      const rawAreaPolygon = zone.area_polygon;
      if (typeof rawAreaPolygon === 'string') {
        try {
          // Attempt to parse once
          const tempPolygon = JSON.parse(rawAreaPolygon);
          // If it's still a string after first parse, try parsing again
          if (typeof tempPolygon === 'string') {
            parsedAreaPolygon = JSON.parse(tempPolygon);
          } else {
            parsedAreaPolygon = tempPolygon;
          }
        } catch (e) {
          // Fallback if initial parse fails
          parsedAreaPolygon = null;
        }
      } else {
        parsedAreaPolygon = rawAreaPolygon;
      }

      const rawCenterPoint = zone.center_point;
      if (typeof rawCenterPoint === 'string') {
        try {
          // Attempt to parse once
          const tempCenter = JSON.parse(rawCenterPoint);
          // If it's still a string after first parse, try parsing again
          if (typeof tempCenter === 'string') {
            parsedCenterPoint = JSON.parse(tempCenter);
          } else {
            parsedCenterPoint = tempCenter;
          }
        } catch (e) {
          // Fallback if initial parse fails
          parsedCenterPoint = null;
        }
      } else {
        parsedCenterPoint = rawCenterPoint;
      }

    } catch (e) {
      console.error("Error parsing GeoJSON data (likely double-quoted JSON string):", e);
      // Fallback to null or default values if parsing fails
      parsedAreaPolygon = null;
      parsedCenterPoint = null;
    }

    setAreaData({
      area_polygon: parsedAreaPolygon || { type: "Polygon", coordinates: [] },
      center_point: parsedCenterPoint || { type: "Point", coordinates: [0, 0] },
      bounds: parsedAreaPolygon ? extractBoundsFromPolygon(parsedAreaPolygon) : { north: 24, south: 24, east: 46, west: 46 }
    });
    setActiveTab("editmap");
  };

  // استخراج حدود المنطقة من البيانات الجغرافية
  const extractBoundsFromPolygon = (polygon: GeoJSONPolygon): { north: number; south: number; east: number; west: number } => {
    try {
      if (!polygon.coordinates || polygon.coordinates.length === 0 || !polygon.coordinates[0] || polygon.coordinates[0].length === 0) {
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
    bounds: number[];
  }) => {
    // إذا كانت بيانات المنطقة فارغة، نتجاهل التحديث
    if (!data.area_polygon.coordinates || data.area_polygon.coordinates.length === 0 || 
        (data.area_polygon.coordinates[0] && data.area_polygon.coordinates[0].length === 0)) {
      console.log('Ignoring empty polygon data');
      return;
    }
    
    // قبل تحديث الحالة، نتحقق مما إذا كانت البيانات الجديدة مختلفة عن البيانات الحالية
    // لمنع دورة التحديث اللانهائية
    if (areaData) {
      // تحقق باسط لمقارنة البيانات: مقارنة عدد النقاط
      const currentPoints = areaData.area_polygon.coordinates[0] || [];
      const newPoints = data.area_polygon.coordinates[0] || [];
      
      if (currentPoints.length === newPoints.length) {
        // إذا كان عدد النقاط متساويًا، تحقق مما إذا كانت نفس البيانات
        let isDifferent = false;
        
        for (let i = 0; i < currentPoints.length; i++) {
          if (!currentPoints[i] || !newPoints[i] ||
              currentPoints[i][0] !== newPoints[i][0] || 
              currentPoints[i][1] !== newPoints[i][1]) {
            isDifferent = true;
            break;
          }
        }
        
        // إذا لم تكن البيانات مختلفة، فلا حاجة للتحديث
        if (!isDifferent) {
          console.log('Area data is the same, skipping update');
          return;
        }
      }
    }
    
    try {
      // تحويل من تنسيق مصفوفة الأرقام إلى تنسيق كائن مع الشمال والجنوب والشرق والغرب
      const convertedData = {
        area_polygon: data.area_polygon,
        center_point: data.center_point,
        bounds: {
          west: data.bounds[0],
          south: data.bounds[1],
          east: data.bounds[2],
          north: data.bounds[3]
        }
      };
      
      // استخدام المعالج الوظيفي مع setState للتأكد من استخدام أحدث قيمة للحالة
      setAreaData(prevData => {
        if (JSON.stringify(prevData) === JSON.stringify(convertedData)) {
          return prevData; // لا تغيير إذا كانت البيانات متماثلة
        }
        return convertedData;
      });
      
      // إظهار رسالة نجاح للمستخدم - استخدم setTimeout لمنع تحديثات الحالة المتعددة في نفس دورة الرسم
      setTimeout(() => {
        toast({
          title: "تم التحديد",
          description: "تم تحديد المنطقة بنجاح",
          type: "success"
        });
      }, 0);
    } catch (error) {
      console.error("خطأ أثناء معالجة بيانات المنطقة:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء معالجة بيانات المنطقة",
        type: "error"
      });
    }
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
      if (isEditMode && currentZoneId) {
        // تحديث منطقة موجودة
        if (!areaData?.area_polygon || !areaData?.center_point) {
          toast({
            title: "خطأ",
            description: "الرجاء تحديد منطقة على الخريطة أولاً.",
            type: "error"
          });
          setIsSubmitting(false);
          return;
        }
        const success = await updateGeographicZone(currentZoneId, formData, areaData.area_polygon, areaData.center_point);
        
        if (!success) {
          throw new Error("فشل في تحديث المنطقة.");
        }
      } else {
        // إضافة منطقة جديدة
        if (!areaData?.area_polygon || !areaData?.center_point) {
          toast({
            title: "خطأ",
            description: "الرجاء تحديد منطقة على الخريطة أولاً.",
            type: "error"
          });
          setIsSubmitting(false);
          return;
        }
        const result = await addGeographicZone(formData, areaData.area_polygon, areaData.center_point);
        if (!result) {
          throw new Error("فشل في إضافة المنطقة.");
        }
      }
      toast({
        title: "نجاح",
        description: isEditMode ? "تم تحديث المنطقة بنجاح." : "تمت إضافة المنطقة بنجاح.",
      });
      loadZones();
      setActiveTab("zoneslist");
    } catch (error) {
      console.error("خطأ أثناء حفظ المنطقة:", error);
      setErrorMessage(`فشل في حفظ المنطقة: ${(error as Error).message}`);
      toast({
        title: "خطأ",
        description: `فشل حفظ المنطقة: ${(error as Error).message}`,
        type: "error"
      });
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
      // Pass area_polygon and center_point as undefined since only is_active is being changed
      const success = await updateGeographicZone(zoneId, { is_active: newStatus }, undefined, undefined);
      
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="zoneslist">قائمة المناطق</TabsTrigger>
            <TabsTrigger value="editmap">إضافة / تعديل منطقة</TabsTrigger>
            <TabsTrigger value="countries-cities">إدارة الدول والمدن</TabsTrigger>
          </TabsList>
          
          {activeTab === "zoneslist" && (
            <Button onClick={startAddZone}>
              <PlusCircle className="h-4 w-4 ml-2" />
              إضافة منطقة جديدة
            </Button>
          )}
        </div>
        
        <TabsContent value="zoneslist" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>المناطق الجغرافية</CardTitle>
              <CardDescription>
                قائمة بجميع المناطق الجغرافية المحددة للمندوبين
              </CardDescription>
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
                  <Button onClick={startAddZone} variant="outline" className="mt-4">
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
                              onClick={() => startEditZone(zone as unknown as GeographicZone)}
                              className="h-9 px-2"
                            >
                              <PlusCircle className="h-4 w-4 ml-1" />
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
        </TabsContent>
        
        <TabsContent value="editmap" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>{isEditMode ? "تعديل منطقة جغرافية" : "إضافة منطقة جغرافية جديدة"}</CardTitle>
              <CardDescription>
                {isEditMode 
                 ? "قم بتعديل بيانات المنطقة الجغرافية وحدودها على الخريطة" 
                 : "أدخل بيانات المنطقة الجديدة وحدد حدودها على الخريطة"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">البلد</Label>
                    <Select
                      value={selectedCountryId || ''}
                      onValueChange={(value) => {
                        setSelectedCountryId(value);
                        setFormData(prev => ({ ...prev, country: value }));
                        setFormData(prev => ({ ...prev, city: '' }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر البلد" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCountries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Select
                      value={formData.city || ''}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, city: value }));
                      }}
                      disabled={!selectedCountryId || filteredCities.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name_ar}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">اسم المنطقة</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="أدخل اسم المنطقة"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">وصف المنطقة</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="أدخل وصفاً للمنطقة (اختياري)"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="is_active">تفعيل المنطقة</Label>
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
                
                <div className="space-y-2">
                  <Label className="block mb-2">رسم حدود المنطقة</Label>
                  <div className="rounded-md overflow-hidden border" style={{ height: '800px' }}>
                    <SimpleMapDrawer
                      key={`map-drawer-${activeTab}-${isEditMode}-${currentZoneId || 'new'}`}
                      initialCenter={areaData?.center_point?.coordinates ? [areaData.center_point.coordinates[1], areaData.center_point.coordinates[0]] : [29.9187, 31.2001]} // Alexandria: [latitude, longitude]
                      initialZoom={15} // مستوى تقريب أعلى
                      initialPolygon={areaData?.area_polygon?.coordinates && areaData.area_polygon.coordinates.length > 0 ? areaData.area_polygon.coordinates[0] as Coordinate[] : undefined}
                      onAreaDefined={handleAreaDefined}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    استخدم أدوات الرسم في الأعلى لتحديد حدود المنطقة على الخريطة
                  </p>
                </div>
                
                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("zoneslist")}
                    disabled={isSubmitting}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleSaveZone}
                    disabled={isSubmitting || !formData.name.trim() || !areaData}
                    className={isSubmitting ? "cursor-not-allowed opacity-70" : ""}
                  >
                    <Save className="h-4 w-4 ml-2" />
                    {isSubmitting ? "جاري الحفظ..." : isEditMode ? "حفظ التغييرات" : "إضافة المنطقة"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="countries-cities" className="pt-2">
          <CountryCityManagementForm />
        </TabsContent>
      </Tabs>
    </div>
  );
} 