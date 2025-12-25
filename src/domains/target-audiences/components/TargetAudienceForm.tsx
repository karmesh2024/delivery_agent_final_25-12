import React, { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { FiInfo } from 'react-icons/fi';
import { Prisma } from '@prisma/client';
import { TargetAudience, TargetAudienceFormData } from '@/domains/products/types/types';

interface GeographicZone {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
}

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

interface TargetAudienceFormProps {
  initialData?: TargetAudience;
  onSave: (data: TargetAudienceFormData) => void;
  onCancel: () => void;
  shopId: string;
}

const TargetAudienceForm: React.FC<TargetAudienceFormProps> = ({
  initialData,
  onSave,
  onCancel,
  shopId,
}) => {
  const [formData, setFormData] = useState<TargetAudienceFormData>({
    shop_id: shopId,
    name_ar: initialData?.name_ar || '',
    name_en: initialData?.name_en || null,
    description_ar: initialData?.description_ar || null,
    description_en: initialData?.description_en || null,
    discount_percentage: initialData?.discount_percentage || new Prisma.Decimal(0),
    markup_percentage: initialData?.markup_percentage || new Prisma.Decimal(0),
    min_order_amount: initialData?.min_order_amount || new Prisma.Decimal(0),
    max_discount_amount: initialData?.max_discount_amount || null,
    is_active: initialData?.is_active ?? true,
    priority: initialData?.priority || 1,
    audience_type: initialData?.audience_type || 'customer',
    payment_terms_days: initialData?.payment_terms_days || 0,
    geographic_zone_ids: initialData?.store_target_audience_geographic_zones?.map(link => link.geographic_zone_id) || [],
    ...(initialData?.id && { id: initialData.id }),
  });

  const [availableGeographicZones, setAvailableGeographicZones] = useState<GeographicZone[]>([]);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  useEffect(() => {
    // This useEffect can be removed if initialData is fully handled in useState above
  }, [initialData]);

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

  useEffect(() => {
    const loadCountriesAndCities = async () => {
      try {
        const countriesData = await fetchCountriesFromApi();
        setAllCountries(countriesData);
      } catch (error) {
        console.error("Failed to fetch countries and cities:", error);
      }
    };
    loadCountriesAndCities();
  }, []);

  // Effect to set initial country/city filters when editing an existing target audience
  useEffect(() => {
    if (initialData && allCountries.length > 0) {
      const associatedZoneLinks = initialData.store_target_audience_geographic_zones;
      if (associatedZoneLinks && associatedZoneLinks.length > 0) {
        const firstZoneId = associatedZoneLinks[0].geographic_zone_id;
        const loadInitialFilters = async () => {
          try {
            const response = await fetch(`/api/settings/geographic-zones?id=${firstZoneId}`);
            if (response.ok) {
              const zoneData: GeographicZone = await response.json();
              // Find the country ID from the fetched country name
              const country = allCountries.find(c => c.name_ar === zoneData.country || c.name_en === zoneData.country);
              if (country) {
                setSelectedCountryId(country.id);
                // After country is set, the useEffect for selectedCountryId will fetch cities
                // Then we can set the selected city if it exists in the newly filtered cities
                // This part will need to be handled in a subsequent effect or after cities are loaded.
                // For now, we only set the country. City will be handled by the next useEffect.
              }
            }
          } catch (error) {
            console.error("Failed to load initial country/city filters from zone data:", error);
          }
        };
        loadInitialFilters();
      }
    }
  }, [initialData, allCountries]);

  // This useEffect ensures that if selectedCountryId is set (e.g., from initialData),
  // and filteredCities become available, we attempt to set selectedCityId.
  useEffect(() => {
    if (selectedCountryId && initialData && filteredCities.length > 0) {
      const associatedZoneLinks = initialData.store_target_audience_geographic_zones;
      if (associatedZoneLinks && associatedZoneLinks.length > 0) {
        const firstZoneId = associatedZoneLinks[0].geographic_zone_id;
        const initialCityName = availableGeographicZones.find(zone => zone.id === firstZoneId)?.city;
        if (initialCityName) {
          const city = filteredCities.find(c => c.name_ar === initialCityName || c.name_en === initialCityName);
          if (city) {
            setSelectedCityId(city.id);
          }
        }
      }
    }
  }, [selectedCountryId, initialData, filteredCities, availableGeographicZones]);

  useEffect(() => {
    if (selectedCountryId) {
      const loadCitiesForCountry = async () => {
        try {
          const citiesData = await fetchCitiesFromApi(selectedCountryId);
          setFilteredCities(citiesData);
        } catch (error) {
          console.error(`Failed to fetch cities for country ${selectedCountryId}:`, error);
        }
      };
      loadCitiesForCountry();
    } else {
      setFilteredCities([]);
    }
  }, [selectedCountryId]);

  useEffect(() => {
    const fetchGeographicZones = async () => {
      try {
        let url = '/api/settings/geographic-zones';
        const params = new URLSearchParams();

        if (selectedCountryId) {
          const countryName = allCountries.find(c => c.id === selectedCountryId)?.name_ar;
          if (countryName) {
            params.append('country', countryName);
          }
        }
        if (selectedCityId) {
          const cityName = filteredCities.find(c => c.id === selectedCityId)?.name_ar;
          if (cityName) {
            params.append('city', cityName);
          }
        }

        if (params.toString()) {
          url = `${url}?${params.toString()}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: GeographicZone[] = await response.json();
        console.log('Fetched geographic zones in TargetAudienceForm:', data);
        setAvailableGeographicZones(data);
      } catch (error) {
        console.error('Failed to fetch geographic zones in TargetAudienceForm:', error);
        // Handle error, e.g., show a toast notification
      }
    };
    fetchGeographicZones();
  }, [selectedCountryId, selectedCityId, allCountries, filteredCities]);

  console.log('Current formData.geographic_zone_ids in TargetAudienceForm:', formData.geographic_zone_ids);
  console.log('Available geographic zones in TargetAudienceForm:', availableGeographicZones);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
  };

  const handleCheckboxChange = (name: keyof TargetAudience, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : new Prisma.Decimal(value),
    }));
  };

  const handleIntegerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : parseInt(value, 10),
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGeographicZoneChange = (zoneId: string, checked: boolean) => {
    setFormData(prev => {
      const currentZoneIds = new Set(prev.geographic_zone_ids);
      if (checked) {
        currentZoneIds.add(zoneId);
      } else {
        currentZoneIds.delete(zoneId);
      }
      return {
        ...prev,
        geographic_zone_ids: Array.from(currentZoneIds),
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <h2 className="text-xl font-semibold mb-4">إدارة الجمهور المستهدف</h2>

        <div>
          <Label htmlFor="name_ar" className="flex items-center gap-2">
            الاسم (عربي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">الاسم العربي للجمهور المستهدف.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="name_ar"
            name="name_ar"
            value={formData.name_ar}
            onChange={handleChange}
            required
            placeholder="مثال: عملاء عاديون، تجار جملة"
          />
        </div>

        <div>
          <Label htmlFor="name_en" className="flex items-center gap-2">
            الاسم (انجليزي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">الاسم الإنجليزي للجمهور المستهدف (اختياري).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="name_en"
            name="name_en"
            value={formData.name_en || ''}
            onChange={handleChange}
            placeholder="Example: Regular Customers, Wholesalers"
          />
        </div>

        <div>
          <Label htmlFor="description_ar" className="flex items-center gap-2">
            الوصف (عربي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">وصف الجمهور المستهدف باللغة العربية (اختياري).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="description_ar"
            name="description_ar"
            value={formData.description_ar || ''}
            onChange={handleChange}
            placeholder="مثال: يشمل جميع العملاء الذين يشترون بالتجزئة."
          />
        </div>

        <div>
          <Label htmlFor="description_en" className="flex items-center gap-2">
            الوصف (انجليزي)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">وصف الجمهور المستهدف باللغة الإنجليزية (اختياري).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="description_en"
            name="description_en"
            value={formData.description_en || ''}
            onChange={handleChange}
            placeholder="Example: Includes all customers who purchase at retail price."
          />
        </div>

        <div>
          <Label htmlFor="discount_percentage" className="flex items-center gap-2">
            نسبة الخصم الافتراضية (%)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">نسبة الخصم الافتراضية المئوية المطبقة على أسعار المنتجات لهذا الجمهور.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="discount_percentage"
            name="discount_percentage"
            type="number"
            step="0.01"
            value={formData.discount_percentage?.toString() || '0'}
            onChange={handleNumberChange}
            placeholder="مثال: 10.50"
          />
        </div>

        <div>
          <Label htmlFor="markup_percentage" className="flex items-center gap-2">
            نسبة الزيادة الافتراضية (%)
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">نسبة الزيادة المئوية الافتراضية المطبقة على تكلفة المنتجات لهذا الجمهور.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="markup_percentage"
            name="markup_percentage"
            type="number"
            step="0.01"
            value={formData.markup_percentage?.toString() || '0'}
            onChange={handleNumberChange}
            placeholder="مثال: 5.00"
          />
        </div>

        <div>
          <Label htmlFor="min_order_amount" className="flex items-center gap-2">
            الحد الأدنى للطلب
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">الحد الأدنى لقيمة الطلب لهذا الجمهور (اختياري).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="min_order_amount"
            name="min_order_amount"
            type="number"
            step="0.01"
            value={formData.min_order_amount?.toString() || '0'}
            onChange={handleNumberChange}
            placeholder="مثال: 500.00"
          />
        </div>

        <div>
          <Label htmlFor="max_discount_amount" className="flex items-center gap-2">
            أقصى مبلغ خصم
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">الحد الأقصى لمبلغ الخصم المسموح به لهذا الجمهور (اختياري).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="max_discount_amount"
            name="max_discount_amount"
            type="number"
            step="0.01"
            value={formData.max_discount_amount?.toString() || ''}
            onChange={handleNumberChange}
            placeholder="مثال: 100.00"
          />
        </div>

        <div>
          <Label htmlFor="audience_type" className="flex items-center gap-2">
            نوع الجمهور
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">تحديد نوع هذا الجمهور (مثال: عميل، جملة، وكيل).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Select
            value={formData.audience_type || 'customer'}
            onValueChange={(value) => handleSelectChange('audience_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع الجمهور" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">عميل</SelectItem>
              <SelectItem value="wholesale">جملة</SelectItem>
              <SelectItem value="retail">تجزئة</SelectItem>
              <SelectItem value="agent">وكيل</SelectItem>
              <SelectItem value="distributor">موزع</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="country">البلد</Label>
          <Select
            value={selectedCountryId || ''}
            onValueChange={(value) => {
              setSelectedCountryId(value);
              setSelectedCityId(null); // Reset city when country changes
              setFormData(prev => ({ ...prev, geographic_zone_ids: [] })); // Clear selected zones
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
        
        <div>
          <Label htmlFor="city">المدينة</Label>
          <Select
            value={selectedCityId || ''}
            onValueChange={(value) => {
              setSelectedCityId(value);
              setFormData(prev => ({ ...prev, geographic_zone_ids: [] })); // Clear selected zones
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

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            المناطق الجغرافية المستهدفة
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">حدد المناطق الجغرافية التي يستهدفها هذا الجمهور.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-3 rounded-md">
            {availableGeographicZones.length === 0 ? (
              <p className="text-gray-500 text-sm col-span-2">لا توجد مناطق جغرافية متاحة لهذا البلد والمدينة.</p>
            ) : (
              availableGeographicZones.map(zone => (
                <div key={zone.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Checkbox
                    id={`zone-${zone.id}`}
                    checked={formData.geographic_zone_ids.includes(zone.id)}
                    onCheckedChange={(checked) => handleGeographicZoneChange(zone.id, checked as boolean)}
                  />
                  <Label htmlFor={`zone-${zone.id}`}>{zone.name} ({zone.country}, {zone.city})</Label>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked: boolean) => handleCheckboxChange('is_active', checked)}
          />
          <Label htmlFor="is_active">
            نشط
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">تحديد ما إذا كان هذا الجمهور نشطًا ومتاحًا للاستخدام.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div>
          <Label htmlFor="priority" className="flex items-center gap-2">
            الأولوية
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">تحديد أولوية هذا الجمهور المستهدف (كلما زاد الرقم، زادت الأولوية).</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="priority"
            name="priority"
            type="number"
            step="1"
            value={formData.priority?.toString() || '1'}
            onChange={handleIntegerChange}
            placeholder="مثال: 1, 2, 3"
          />
        </div>

        <div>
          <Label htmlFor="payment_terms_days" className="flex items-center gap-2">
            أيام شروط الدفع
            <Tooltip>
              <TooltipTrigger asChild>
                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">عدد الأيام لشروط الدفع لهذا الجمهور.</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="payment_terms_days"
            name="payment_terms_days"
            type="number"
            step="1"
            value={formData.payment_terms_days?.toString() || '0'}
            onChange={handleIntegerChange}
            placeholder="مثال: 30"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>إلغاء</Button>
          <Button type="submit">حفظ</Button>
        </div>
      </form>
    </TooltipProvider>
  );
};

export default TargetAudienceForm; 