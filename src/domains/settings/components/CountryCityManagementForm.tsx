'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import { toast } from '@/shared/ui/use-toast';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface Country {
  id: string;
  name_ar: string;
  name_en?: string; // Made optional as per DB schema, may be null
}

interface City {
  id: string;
  name_ar: string;
  name_en?: string; // Made optional as per DB schema, may be null
  country_id: string; // The ID of the parent country entry
}

export default function CountryCityManagementForm() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isAddCountryDialogOpen, setIsAddCountryDialogOpen] = useState(false);
  const [isAddCityDialogOpen, setIsAddCityDialogOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [newCountryNameAr, setNewCountryNameAr] = useState('');
  const [newCountryNameEn, setNewCountryNameEn] = useState('');
  const [newCityNameAr, setNewCityNameAr] = useState('');
  const [newCityNameEn, setNewCityNameEn] = useState('');
  const [selectedCountryForCity, setSelectedCountryForCity] = useState<string | null>(null);

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/countries');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Country[] = await response.json();
      setCountries(data);
    } catch (error: unknown) {
      console.error('Failed to fetch countries:', error);
      toast({
        title: 'خطأ',
        description: `فشل جلب الدول: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  const fetchCities = async (countryId: string) => {
    try {
      const response = await fetch(`/api/cities?country_id=${countryId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: City[] = await response.json();
      setCities(data);
    } catch (error: unknown) {
      console.error(`فشل جلب المدن للدولة ${countryId}:`, error);
      toast({
        title: 'خطأ',
        description: `فشل جلب المدن: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (countries.length > 0 && !selectedCountryForCity) {
      setSelectedCountryForCity(countries[0].id);
    }
  }, [countries, selectedCountryForCity]);

  useEffect(() => {
    if (selectedCountryForCity) {
      fetchCities(selectedCountryForCity);
    } else {
      setCities([]);
    }
  }, [selectedCountryForCity]);

  const handleAddCountry = async () => {
    if (!newCountryNameAr.trim()) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال اسم الدولة بالعربية.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const method = editingCountry ? 'PUT' : 'POST';
      const url = editingCountry ? `/api/countries?id=${editingCountry.id}` : '/api/countries';

      const payload = {
        name_ar: newCountryNameAr,
        name_en: newCountryNameEn || null, // Ensure null if empty
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast({ title: 'نجاح', description: `تم ${editingCountry ? 'تعديل' : 'إضافة'} الدولة بنجاح.` });
      setIsAddCountryDialogOpen(false);
      setEditingCountry(null);
      setNewCountryNameAr('');
      setNewCountryNameEn('');
      fetchCountries(); // Refresh the list
    } catch (error: unknown) {
      console.error('Failed to save country:', error);
      toast({ title: 'خطأ', description: `فشل في حفظ الدولة: ${(error as Error).message}`, variant: 'destructive' });
    }
  };

  const handleDeleteCountry = async (id: string) => {
    if (confirm('هل أنت متأكد أنك تريد حذف هذه الدولة؟ سيتم حذف جميع المدن التابعة لها.')) {
      try {
        const response = await fetch(`/api/countries?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        toast({ title: 'نجاح', description: 'تم حذف الدولة بنجاح.' });
        fetchCountries(); // Refresh the list
        fetchCities(selectedCountryForCity!); // Also refresh cities for the current country
      } catch (error: unknown) {
        console.error('Failed to delete country:', error);
        toast({ title: 'خطأ', description: `فشل في حذف الدولة: ${(error as Error).message}`, variant: 'destructive' });
      }
    }
  };

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country);
    setNewCountryNameAr(country.name_ar);
    setNewCountryNameEn(country.name_en || '');
    setIsAddCountryDialogOpen(true);
  };

  const handleAddCity = async () => {
    if (!selectedCountryForCity || !newCityNameAr.trim()) {
      toast({
        title: 'خطأ',
        description: 'الرجاء اختيار الدولة وإدخال اسم المدينة بالعربية.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const method = editingCity ? 'PUT' : 'POST';
      const url = editingCity ? `/api/cities?id=${editingCity.id}` : '/api/cities';

      const payload = {
        name_ar: newCityNameAr,
        name_en: newCityNameEn || null,
        country_id: selectedCountryForCity,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast({ title: 'نجاح', description: `تم ${editingCity ? 'تعديل' : 'إضافة'} المدينة بنجاح.` });
      setIsAddCityDialogOpen(false);
      setEditingCity(null);
      setNewCityNameAr('');
      setNewCityNameEn('');
      if (selectedCountryForCity) {
        fetchCities(selectedCountryForCity); // Refresh the city list for the current country
      }
    } catch (error: unknown) {
      console.error('Failed to save city:', error);
      toast({ title: 'خطأ', description: `فشل في حفظ المدينة: ${(error as Error).message}`, variant: 'destructive' });
    }
  };

  const handleDeleteCity = async (id: string) => {
    if (confirm('هل أنت متأكد أنك تريد حذف هذه المدينة؟')) {
      try {
        const response = await fetch(`/api/cities?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        toast({ title: 'نجاح', description: 'تم حذف المدينة بنجاح.' });
        if (selectedCountryForCity) {
          fetchCities(selectedCountryForCity); // Refresh the city list
        }
      } catch (error: unknown) {
        console.error('Failed to delete city:', error);
        toast({ title: 'خطأ', description: `فشل في حذف المدينة: ${(error as Error).message}`, variant: 'destructive' });
      }
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setNewCityNameAr(city.name_ar);
    setNewCityNameEn(city.name_en || '');
    setSelectedCountryForCity(city.country_id);
    setIsAddCityDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">إدارة الدول</h2>
      <Button onClick={() => {
        setEditingCountry(null);
        setNewCountryNameAr('');
        setNewCountryNameEn('');
        setIsAddCountryDialogOpen(true);
      }}>
        <PlusCircle className="h-4 w-4 ml-2" /> إضافة دولة جديدة
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم (عربي)</TableHead>
            <TableHead>الاسم (انجليزي)</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {countries.map((country) => (
            <TableRow key={country.id}>
              <TableCell>{country.name_ar}</TableCell>
              <TableCell>{country.name_en}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => handleEditCountry(country)} className="mr-2">
                  <FiEdit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteCountry(country.id)}>
                  <FiTrash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CustomDialog
        isOpen={isAddCountryDialogOpen}
        onClose={() => {
          setIsAddCountryDialogOpen(false);
          setEditingCountry(null);
          setNewCountryNameAr('');
          setNewCountryNameEn('');
        }}
        title={editingCountry ? 'تعديل دولة' : 'إضافة دولة جديدة'}
        description={editingCountry ? 'قم بتعديل بيانات الدولة.' : 'أدخل بيانات الدولة الجديدة وحدودها ومركزها.'}
        footer={
          <DialogFooter>
            <Button type="button" onClick={handleAddCountry}>{editingCountry ? 'تعديل' : 'إضافة'}</Button>
            <Button type="button" variant="outline" onClick={() => {
              setIsAddCountryDialogOpen(false);
              setEditingCountry(null);
              setNewCountryNameAr('');
              setNewCountryNameEn('');
            }}>إلغاء</Button>
          </DialogFooter>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="country-name-ar">الاسم (عربي)</Label>
            <Input
              id="country-name-ar"
              value={newCountryNameAr}
              onChange={(e) => setNewCountryNameAr(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="country-name-en">الاسم (انجليزي)</Label>
            <Input
              id="country-name-en"
              value={newCountryNameEn}
              onChange={(e) => setNewCountryNameEn(e.target.value)}
            />
          </div>
        </div>
      </CustomDialog>

      <h2 className="text-xl font-bold mt-8">إدارة المدن</h2>
      <div className="flex items-center space-x-4">
        <Label htmlFor="country-select-for-city">اختر الدولة:</Label>
        <Select onValueChange={setSelectedCountryForCity} value={selectedCountryForCity || ''}>
          <SelectTrigger id="country-select-for-city" className="w-[180px]">
            <SelectValue placeholder="اختر دولة" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.id} value={country.id}>
                {country.name_ar}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => {
        if (!selectedCountryForCity) {
          toast({
            title: 'تحذير',
            description: 'الرجاء اختيار دولة أولاً لإضافة مدينة.',
            variant: 'default',
          });
          return;
        }
        setEditingCity(null);
        setNewCityNameAr('');
        setNewCityNameEn('');
        setIsAddCityDialogOpen(true);
      }} disabled={!selectedCountryForCity}>
        <PlusCircle className="h-4 w-4 ml-2" /> إضافة مدينة جديدة
      </Button>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم (عربي)</TableHead>
            <TableHead>الاسم (انجليزي)</TableHead>
            <TableHead>الدولة</TableHead>
            <TableHead>الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cities.map((city) => (
            <TableRow key={city.id}>
              <TableCell>{city.name_ar}</TableCell>
              <TableCell>{city.name_en}</TableCell>
              <TableCell>{countries.find(c => c.id === city.country_id)?.name_ar || 'غير معروف'}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => handleEditCity(city)} className="mr-2">
                  <FiEdit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteCity(city.id)}>
                  <FiTrash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CustomDialog
        isOpen={isAddCityDialogOpen}
        onClose={() => {
          setIsAddCityDialogOpen(false);
          setEditingCity(null);
          setNewCityNameAr('');
          setNewCityNameEn('');
        }}
        title={editingCity ? 'تعديل مدينة' : 'إضافة مدينة جديدة'}
        description={editingCity ? 'قم بتعديل بيانات المدينة.' : 'أدخل بيانات المدينة الجديدة وحدودها ومركزها.'}
        footer={
          <DialogFooter>
            <Button type="button" onClick={handleAddCity}>{editingCity ? 'تعديل' : 'إضافة'}</Button>
            <Button type="button" variant="outline" onClick={() => {
              setIsAddCityDialogOpen(false);
              setEditingCity(null);
              setNewCityNameAr('');
              setNewCityNameEn('');
            }}>إلغاء</Button>
          </DialogFooter>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="city-country">الدولة</Label>
            <Select onValueChange={setSelectedCountryForCity} value={selectedCountryForCity || ''} disabled={!!editingCity}>
              <SelectTrigger id="city-country" className="w-full">
                <SelectValue placeholder="اختر دولة" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="city-name-ar">الاسم (عربي)</Label>
            <Input
              id="city-name-ar"
              value={newCityNameAr}
              onChange={(e) => setNewCityNameAr(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="city-name-en">الاسم (انجليزي)</Label>
            <Input
              id="city-name-en"
              value={newCityNameEn}
              onChange={(e) => setNewCityNameEn(e.target.value)}
            />
          </div>
        </div>
      </CustomDialog>
    </div>
  );
} 