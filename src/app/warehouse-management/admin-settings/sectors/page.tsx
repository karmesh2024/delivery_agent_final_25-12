'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { 
  FiSettings, 
  FiHome, 
  FiUsers, 
  FiShield, 
  FiSave,
  FiEdit3,
  FiEye,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiX,
  FiLayers,
  FiPackage,
  FiArchive,
  FiRefreshCw
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { warehouseService } from '@/domains/warehouse-management/services/warehouseService';

// تسجيل حالة warehouseService
console.log('sectors page: warehouseService loaded:', warehouseService);

interface Sector {
  id?: string;
  code: string;
  name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
  warehouse_levels?: string[];
  created_at?: string;
}

interface ProductCategory {
  id: string;
  name: string;
  description: string;
  sector_id: string;
  is_active: boolean;
}

interface WasteCategory {
  id: string;
  name: string;
  description: string;
  sector_id: string;
  is_active: boolean;
}

export default function AdminSectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [wasteCategories, setWasteCategories] = useState<WasteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // نموذج إضافة قطاع جديد
  const [newSector, setNewSector] = useState({
    name: '',
    description: '',
    code: '',
    color: '#3B82F6',
    warehouse_levels: [] as string[]
  });

  // نموذج إضافة فئة منتج
  const [newProductCategory, setNewProductCategory] = useState({
    name: '',
    description: '',
    sector_id: ''
  });

  // نموذج إضافة فئة مخلفات
  const [newWasteCategory, setNewWasteCategory] = useState({
    name: '',
    description: '',
    sector_id: ''
  });

  const [activeTab, setActiveTab] = useState('sectors');

  // تحميل البيانات
  useEffect(() => {
    console.log('تم تشغيل useEffect لتحميل البيانات');
    console.log('warehouseService في useEffect:', warehouseService);
    if (warehouseService) {
      loadData();
    } else {
      console.error('warehouseService غير متوفر في useEffect');
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('بدء تحميل البيانات في الصفحة...');
      console.log('warehouseService.getSectors:', warehouseService.getSectors);
      
      // تحميل القطاعات
      console.log('جاري تحميل القطاعات...');
      
      if (!warehouseService || typeof warehouseService.getSectors !== 'function') {
        console.error('warehouseService أو getSectors غير متوفر!');
        console.log('warehouseService:', warehouseService);
        return;
      }
      
      const sectorsData = await warehouseService.getSectors();
      console.log('القطاعات المُرجعة:', sectorsData);
      console.log(`عدد القطاعات: ${sectorsData.length}`);
      console.log('نوع البيانات المُرجعة:', typeof sectorsData);
      console.log('هل البيانات مصفوفة؟', Array.isArray(sectorsData));
      setSectors(sectorsData);

      // تحميل فئات المنتجات
      const productCategoriesData = await warehouseService.getProductCategories();
      setProductCategories(productCategoriesData);

      // تحميل فئات المخلفات
      const wasteCategoriesData = await warehouseService.getWasteCategories();
      setWasteCategories(wasteCategoriesData);
      
      console.log('تم تحميل جميع البيانات بنجاح');
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // توليد كود القطاع تلقائياً
  const generateSectorCode = () => {
    if (!newSector.name) {
      toast.error('يرجى إدخال اسم القطاع أولاً');
      return;
    }

    // خوارزمية ذكية لتوليد الكود
    const generateCode = (name: string) => {
      // إزالة الأحرف الخاصة والمسافات الزائدة
      const cleanName = name.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z\s]/g, '').trim();
      
      // تقسيم الاسم إلى كلمات
      const words = cleanName.split(/\s+/).filter(word => word.length > 0);
      
      if (words.length === 1) {
        // إذا كان الاسم كلمة واحدة، خذ أول 3 أحرف
        return words[0].substring(0, 3).toUpperCase();
      } else if (words.length === 2) {
        // إذا كان الاسم كلمتين، خذ أول حرف من كل كلمة + حرف من الكلمة الثانية
        return (words[0].charAt(0) + words[1].substring(0, 2)).toUpperCase();
      } else {
        // إذا كان الاسم أكثر من كلمتين، خذ أول حرف من كل كلمة
        return words.map(word => word.charAt(0)).join('').substring(0, 3).toUpperCase();
      }
    };

    const code = generateCode(newSector.name);

    setNewSector(prev => ({
      ...prev,
      code: code
    }));

    toast.success(`تم توليد الكود: ${code}`);
  };

  // إضافة قطاع جديد
  const handleAddSector = async () => {
    if (!newSector.name || !newSector.code) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setSaving(true);
      const success = await warehouseService.createSector(newSector);
      if (success) {
        toast.success('تم إضافة القطاع بنجاح');
        setNewSector({
          name: '',
          description: '',
          code: '',
          color: '#3B82F6',
          warehouse_levels: []
        });
        loadData();
      }
    } catch (error) {
      console.error('خطأ في إضافة القطاع:', error);
      toast.error('حدث خطأ أثناء إضافة القطاع');
    } finally {
      setSaving(false);
    }
  };

  // إضافة فئة منتج
  const handleAddProductCategory = async () => {
    if (!newProductCategory.name || !newProductCategory.sector_id) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setSaving(true);
      const success = await warehouseService.createProductCategory(newProductCategory);
      if (success) {
        toast.success('تم إضافة فئة المنتج بنجاح');
        setNewProductCategory({
          name: '',
          description: '',
          sector_id: ''
        });
        loadData();
      }
    } catch (error) {
      console.error('خطأ في إضافة فئة المنتج:', error);
      toast.error('حدث خطأ أثناء إضافة فئة المنتج');
    } finally {
      setSaving(false);
    }
  };

  // إضافة فئة مخلفات
  const handleAddWasteCategory = async () => {
    if (!newWasteCategory.name || !newWasteCategory.sector_id) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setSaving(true);
      const success = await warehouseService.createWasteCategory(newWasteCategory);
      if (success) {
        toast.success('تم إضافة فئة المخلفات بنجاح');
        setNewWasteCategory({
          name: '',
          description: '',
          sector_id: ''
        });
        loadData();
      }
    } catch (error) {
      console.error('خطأ في إضافة فئة المخلفات:', error);
      toast.error('حدث خطأ أثناء إضافة فئة المخلفات');
    } finally {
      setSaving(false);
    }
  };

  // حذف قطاع
  const handleDeleteSector = async (sectorId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القطاع؟')) {
      try {
        const success = await warehouseService.deleteSector(sectorId);
        if (success) {
          toast.success('تم حذف القطاع بنجاح');
          loadData();
        }
      } catch (error) {
        console.error('خطأ في حذف القطاع:', error);
        toast.error('حدث خطأ أثناء حذف القطاع');
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل البيانات...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* العنوان الرئيسي */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة القطاعات والكتالوج</h1>
            <p className="text-gray-600 mt-1">
              إدارة القطاعات والكتالوج الأساسي للمنتجات والمخلفات
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/warehouse-management/admin-settings/hierarchical-categories">
              <Button variant="outline" className="text-green-600 border-green-200">
                <FiLayers className="w-4 h-4 mr-1" />
                التصنيفات الهرمية
              </Button>
            </Link>
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              <FiSettings className="w-4 h-4 mr-1" />
              الإدارة العليا
            </Badge>
          </div>
        </div>

        {/* التبويبات */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sectors" className="flex items-center gap-2">
              <FiLayers className="w-4 h-4" />
              القطاعات
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <FiPackage className="w-4 h-4" />
              فئات المنتجات
            </TabsTrigger>
            <TabsTrigger value="waste" className="flex items-center gap-2">
              <FiArchive className="w-4 h-4" />
              فئات المخلفات
            </TabsTrigger>
          </TabsList>

          {/* تبويب القطاعات */}
          <TabsContent value="sectors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiLayers className="w-5 h-5 text-blue-600" />
                  إدارة القطاعات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* إضافة قطاع جديد */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4">إضافة قطاع جديد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sector_name">اسم القطاع *</Label>
                      <Input
                        id="sector_name"
                        value={newSector.name}
                        onChange={(e) => setNewSector(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="مثال: القطاع الصناعي"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sector_code">كود القطاع *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="sector_code"
                          value={newSector.code}
                          onChange={(e) => setNewSector(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="مثال: IND"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateSectorCode}
                          className="flex items-center gap-1 px-3 hover:bg-blue-50 hover:border-blue-300"
                          title="توليد كود تلقائياً من اسم القطاع"
                        >
                          <FiRefreshCw className="w-4 h-4 text-blue-600" />
                          توليد
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        يمكنك إدخال الكود يدوياً أو استخدام زر التوليد التلقائي
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="sector_description">وصف القطاع</Label>
                      <Textarea
                        id="sector_description"
                        value={newSector.description}
                        onChange={(e) => setNewSector(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="وصف مختصر للقطاع"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sector_color">لون القطاع</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          id="sector_color"
                          value={newSector.color}
                          onChange={(e) => setNewSector(prev => ({ ...prev, color: e.target.value }))}
                          className="w-12 h-10"
                        />
                        <span className="text-sm text-gray-600">اختر لون مميز للقطاع</span>
                      </div>
                    </div>
                    <div>
                      <Label>المستويات المسموحة</Label>
                      <div className="space-y-2">
                        {['admin', 'country', 'city', 'district'].map(level => (
                          <label key={level} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newSector.warehouse_levels.includes(level)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewSector(prev => ({
                                    ...prev,
                                    warehouse_levels: [...prev.warehouse_levels, level]
                                  }));
                                } else {
                                  setNewSector(prev => ({
                                    ...prev,
                                    warehouse_levels: prev.warehouse_levels.filter(l => l !== level)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">
                              {level === 'admin' && 'الإدارة العليا'}
                              {level === 'country' && 'المخزن الرئيسي'}
                              {level === 'city' && 'مخزن المدينة'}
                              {level === 'district' && 'مخزن المنطقة'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={handleAddSector}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      {saving ? 'جاري الإضافة...' : 'إضافة القطاع'}
                    </Button>
                  </div>
                </div>

                {/* قائمة القطاعات */}
                <div className="space-y-4">
                  <h3 className="font-semibold">القطاعات الموجودة ({sectors.length})</h3>
                  {console.log('عرض القطاعات:', sectors)}
                  {sectors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد قطاعات مضافة بعد
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sectors.map((sector) => (
                        <Card key={sector.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full" 
                                  style={{ backgroundColor: sector.color }}
                                ></div>
                                <span className="font-semibold">{sector.name}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSector(sector.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{sector.description}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {sector.code}
                              </Badge>
                              <Badge 
                                variant={sector.is_active ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {sector.is_active ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب فئات المنتجات */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiPackage className="w-5 h-5 text-green-600" />
                  فئات المنتجات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* إضافة فئة منتج جديد */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4">إضافة فئة منتج جديد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="product_name">اسم الفئة *</Label>
                      <Input
                        id="product_name"
                        value={newProductCategory.name}
                        onChange={(e) => setNewProductCategory(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="مثال: الأجهزة الإلكترونية"
                      />
                    </div>
                    <div>
                      <Label htmlFor="product_sector">القطاع *</Label>
                      <select
                        id="product_sector"
                        value={newProductCategory.sector_id}
                        onChange={(e) => setNewProductCategory(prev => ({ ...prev, sector_id: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">اختر القطاع</option>
                        {sectors.map(sector => (
                          <option key={sector.id} value={sector.id}>
                            {sector.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="product_description">وصف الفئة</Label>
                      <Textarea
                        id="product_description"
                        value={newProductCategory.description}
                        onChange={(e) => setNewProductCategory(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="وصف مختصر للفئة"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={handleAddProductCategory}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      {saving ? 'جاري الإضافة...' : 'إضافة الفئة'}
                    </Button>
                  </div>
                </div>

                {/* قائمة فئات المنتجات */}
                <div className="space-y-4">
                  <h3 className="font-semibold">فئات المنتجات الموجودة</h3>
                  {productCategories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد فئات منتجات مضافة بعد
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {productCategories.map((category) => (
                        <Card key={category.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{category.name}</span>
                              <Badge 
                                variant={category.is_active ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {category.is_active ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                            <div className="text-xs text-gray-500">
                              القطاع: {sectors.find(s => s.id === category.sector_id)?.name || 'غير محدد'}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب فئات المخلفات */}
          <TabsContent value="waste" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiArchive className="w-5 h-5 text-orange-600" />
                  فئات المخلفات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* إضافة فئة مخلفات جديد */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-4">إضافة فئة مخلفات جديد</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="waste_name">اسم الفئة *</Label>
                      <Input
                        id="waste_name"
                        value={newWasteCategory.name}
                        onChange={(e) => setNewWasteCategory(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="مثال: المخلفات الإلكترونية"
                      />
                    </div>
                    <div>
                      <Label htmlFor="waste_sector">القطاع *</Label>
                      <select
                        id="waste_sector"
                        value={newWasteCategory.sector_id}
                        onChange={(e) => setNewWasteCategory(prev => ({ ...prev, sector_id: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">اختر القطاع</option>
                        {sectors.map(sector => (
                          <option key={sector.id} value={sector.id}>
                            {sector.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="waste_description">وصف الفئة</Label>
                      <Textarea
                        id="waste_description"
                        value={newWasteCategory.description}
                        onChange={(e) => setNewWasteCategory(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="وصف مختصر للفئة"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={handleAddWasteCategory}
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      {saving ? 'جاري الإضافة...' : 'إضافة الفئة'}
                    </Button>
                  </div>
                </div>

                {/* قائمة فئات المخلفات */}
                <div className="space-y-4">
                  <h3 className="font-semibold">فئات المخلفات الموجودة</h3>
                  {wasteCategories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد فئات مخلفات مضافة بعد
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wasteCategories.map((category) => (
                        <Card key={category.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{category.name}</span>
                              <Badge 
                                variant={category.is_active ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {category.is_active ? 'نشط' : 'غير نشط'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                            <div className="text-xs text-gray-500">
                              القطاع: {sectors.find(s => s.id === category.sector_id)?.name || 'غير محدد'}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
