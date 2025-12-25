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
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiChevronDown,
  FiChevronRight,
  FiLayers,
  FiPackage,
  FiTag,
  FiFolder,
  FiStar,
  FiMinus
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import Link from 'next/link';
import warehouseService from '@/domains/warehouse-management/services/warehouseService';
import { UniversalDialog } from '@/shared/ui/universal-dialog';

interface Sector {
  id?: string;
  name: string;
  code: string;
  color?: string;
  warehouse_levels?: string[];
  product_classifications?: Classification[];
}

interface Classification {
  id: string;
  name: string;
  description: string;
  sector_id: string;
  main_categories?: MainCategory[];
}

interface MainCategory {
  id: string;
  name: string;
  description: string;
  classification_id: string;
  sub_categories?: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  description: string;
  main_category_id: string;
}

export default function HierarchicalCategoriesPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hierarchy');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [treeExpanded, setTreeExpanded] = useState(true);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'sector' | 'classification' | 'mainCategory' | 'subCategory'>('classification');
  const [dialogTitle, setDialogTitle] = useState('');
  const [editingItem, setEditingItem] = useState<Sector | Classification | MainCategory | SubCategory | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('بدء تحميل البيانات...');
      
      const [sectorsData, classificationsData] = await Promise.all([
        warehouseService.getSectors(),
        warehouseService.getProductClassifications()
      ]);
      
      console.log('القطاعات المحملة:', sectorsData);
      console.log('التصنيفات المحملة:', classificationsData);
      
      setSectors(sectorsData);
      setClassifications(classificationsData);
      
      // تحميل الفئات الأساسية والفرعية لجميع التصنيفات
      const allMainCategories: MainCategory[] = [];
      const allSubCategories: SubCategory[] = [];
      
      if (classificationsData.length > 0) {
        for (const classification of classificationsData) {
          try {
          const mainCats = await warehouseService.getMainCategories(classification.id);
            console.log(`الفئات الأساسية للتصنيف ${classification.name}:`, mainCats);
          allMainCategories.push(...mainCats);
          
          for (const mainCat of mainCats) {
              try {
            const subCats = await warehouseService.getSubCategories(mainCat.id);
                console.log(`الفئات الفرعية للفئة ${mainCat.name}:`, subCats);
            allSubCategories.push(...subCats);
              } catch (subError) {
                console.error(`خطأ في تحميل الفئات الفرعية للفئة ${mainCat.name}:`, subError);
              }
            }
          } catch (mainError) {
            console.error(`خطأ في تحميل الفئات الأساسية للتصنيف ${classification.name}:`, mainError);
          }
        }
        
        console.log('جميع الفئات الأساسية:', allMainCategories);
        console.log('جميع الفئات الفرعية:', allSubCategories);
      }
      
      // تحديث القطاعات بالتصنيفات المرتبطة
      const updatedSectors = sectorsData.map(sector => {
        const sectorClassifications = classificationsData.filter(c => c.sector_id === sector.id);
        const classificationsWithMainCategories = sectorClassifications.map(classification => {
          const mainCats = allMainCategories.filter(m => m.classification_id === classification.id);
          const mainCategoriesWithSubCategories = mainCats.map(mainCategory => ({
            ...mainCategory,
            sub_categories: allSubCategories.filter(s => s.main_category_id === mainCategory.id)
          }));
          return {
            ...classification,
            main_categories: mainCategoriesWithSubCategories
          };
        });
        
        return {
          ...sector,
          product_classifications: classificationsWithMainCategories
        };
      });
      
      setSectors(updatedSectors);
      
      // تحديث التصنيفات بالفئات الأساسية المرتبطة
      const updatedClassifications = classificationsData.map(classification => ({
        ...classification,
        main_categories: allMainCategories.filter(m => m.classification_id === classification.id)
      }));
      
      setClassifications(updatedClassifications);
      
      // تحديث الفئات الأساسية بالفئات الفرعية المرتبطة
      const updatedMainCategories = allMainCategories.map(mainCategory => ({
        ...mainCategory,
        sub_categories: allSubCategories.filter(s => s.main_category_id === mainCategory.id)
      }));
      
      setMainCategories(updatedMainCategories);
      setSubCategories(allSubCategories);
      
      console.log('القطاعات المحدثة:', updatedSectors);
      
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadMainCategories = async (classificationId: string) => {
    try {
      const data = await warehouseService.getMainCategories(classificationId);
      setMainCategories(data);
    } catch (error) {
      console.error('خطأ في تحميل الفئات الأساسية:', error);
    }
  };

  const loadSubCategories = async (mainCategoryId: string) => {
    try {
      const data = await warehouseService.getSubCategories(mainCategoryId);
      setSubCategories(data);
    } catch (error) {
      console.error('خطأ في تحميل الفئات الفرعية:', error);
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleTreeExpanded = () => {
    setTreeExpanded(!treeExpanded);
    if (treeExpanded) {
      // إغلاق جميع العناصر
      setExpandedItems(new Set());
    } else {
      // فتح جميع العناصر
      const allIds = new Set<string>();
      sectors.forEach(sector => {
        allIds.add(sector.id || '');
        sector.product_classifications?.forEach(classification => {
          allIds.add(classification.id);
          classification.main_categories?.forEach(mainCategory => {
            allIds.add(mainCategory.id);
            mainCategory.sub_categories?.forEach(subCategory => {
              allIds.add(subCategory.id);
            });
          });
        });
      });
      setExpandedItems(allIds);
    }
  };

  const openAddDialog = (type: 'sector' | 'classification' | 'mainCategory' | 'subCategory', sectorId?: string, classificationId?: string, mainCategoryId?: string) => {
    console.log('فتح حوار إضافة:', { type, sectorId, classificationId, mainCategoryId });
    console.log('القطاعات المتاحة:', sectors);
    console.log('التصنيفات المتاحة:', classifications);
    console.log('الفئات الأساسية المتاحة:', mainCategories);
    
    setDialogType(type);
    
    if (type === 'sector') {
      setDialogTitle('إضافة قطاع جديد');
    } else if (type === 'classification') {
      setDialogTitle('إضافة تصنيف جديد');
    } else if (type === 'mainCategory') {
      setDialogTitle('إضافة فئة أساسية جديدة');
    } else if (type === 'subCategory') {
      setDialogTitle('إضافة فئة فرعية جديدة');
    }
    
    setEditingItem(null);
    setDialogOpen(true);
    console.log('تم فتح الحوار:', dialogOpen);
  };

  const openEditDialog = (type: 'sector' | 'classification' | 'mainCategory' | 'subCategory', item: Sector | Classification | MainCategory | SubCategory) => {
    setDialogType(type);
    setEditingItem(item);
    
    if (type === 'sector') {
      setDialogTitle(`تعديل القطاع "${item.name}"`);
    } else if (type === 'classification') {
      setDialogTitle(`تعديل التصنيف "${item.name}"`);
    } else if (type === 'mainCategory') {
      setDialogTitle(`تعديل الفئة الأساسية "${item.name}"`);
    } else if (type === 'subCategory') {
      setDialogTitle(`تعديل الفئة الفرعية "${item.name}"`);
    }
    
    setDialogOpen(true);
  };

  const handleSubmit = async (formData: {
    name: string;
    description: string;
    code?: string;
    color?: string;
    warehouse_levels?: string[];
    sector_id?: string;
    sector_ids?: string[];
    classification_id?: string;
    main_category_id?: string;
  }) => {
    try {
      setDialogLoading(true);
      console.log('بدء إضافة/تحديث عنصر:', dialogType, formData);
      console.log('editingItem:', editingItem);
      console.log('القطاعات المتاحة:', sectors);
      console.log('التصنيفات المتاحة:', classifications);
      console.log('الفئات الأساسية المتاحة:', mainCategories);
      let success = false;
      
      if (dialogType === 'sector') {
        if (editingItem && editingItem.id) {
          console.log('تحديث قطاع:', formData);
          success = await warehouseService.updateSector(editingItem.id, {
            name: formData.name,
            description: formData.description,
            code: formData.code || '',
            color: formData.color || '#3B82F6',
            warehouse_levels: formData.warehouse_levels || ['country', 'city', 'district']
          });
        } else {
          console.log('إنشاء قطاع جديد:', formData);
          success = await warehouseService.createSector({
            name: formData.name,
            description: formData.description,
            code: formData.code || '',
            color: formData.color || '#3B82F6',
            warehouse_levels: formData.warehouse_levels || ['country', 'city', 'district']
          });
        }
      } else if (dialogType === 'classification') {
        if (editingItem && editingItem.id) {
          console.log('تحديث تصنيف:', formData);
          success = await warehouseService.updateProductClassification(editingItem.id, {
            name: formData.name,
            description: formData.description,
            sector_id: formData.sector_id || formData.sector_ids?.[0] || ''
          });
        } else {
          console.log('إنشاء تصنيف جديد:', formData);
          console.log('بيانات التصنيف:', {
              name: formData.name,
              description: formData.description,
            sector_id: formData.sector_id || formData.sector_ids?.[0]
            });
            success = await warehouseService.createProductClassification({
              name: formData.name,
              description: formData.description,
            sector_id: formData.sector_id || formData.sector_ids?.[0] || ''
            });
        }
      } else if (dialogType === 'mainCategory') {
        if (editingItem && editingItem.id) {
          console.log('تحديث فئة أساسية:', formData);
          success = await warehouseService.updateMainCategory(editingItem.id, {
            name: formData.name,
            description: formData.description,
            classification_id: formData.classification_id || ''
          });
        } else {
          console.log('إنشاء فئة أساسية جديدة:', formData);
          success = await warehouseService.createMainCategory({
            name: formData.name,
            description: formData.description,
            classification_id: formData.classification_id || ''
          });
        }
      } else if (dialogType === 'subCategory') {
        if (editingItem && editingItem.id) {
          console.log('تحديث فئة فرعية:', formData);
          success = await warehouseService.updateSubCategory(editingItem.id, {
            name: formData.name,
            description: formData.description,
            main_category_id: formData.main_category_id || ''
          });
        } else {
          console.log('إنشاء فئة فرعية جديدة:', formData);
          success = await warehouseService.createSubCategory({
            name: formData.name,
            description: formData.description,
            main_category_id: formData.main_category_id || ''
          });
        }
      }
      
      console.log('نتيجة العملية:', success);
      
      if (success) {
        toast.success('تم الحفظ بنجاح');
        setDialogOpen(false);
        setEditingItem(null);
        await loadData();
          } else {
        toast.error('فشل في الحفظ');
      }
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async (type: 'sector' | 'classification' | 'mainCategory' | 'subCategory', item: Sector | Classification | MainCategory | SubCategory) => {
    if (window.confirm(`هل أنت متأكد من حذف "${item.name}"؟`)) {
      let success = false;
      
      if (type === 'sector') {
        success = await warehouseService.deleteSector(item.id || '');
      } else if (type === 'classification') {
        success = await warehouseService.deleteProductClassification(item.id || '');
      } else if (type === 'mainCategory') {
        success = await warehouseService.deleteMainCategory(item.id || '');
      } else if (type === 'subCategory') {
        success = await warehouseService.deleteSubCategory(item.id || '');
      }
      
      if (success) {
        await loadData();
      }
    }
  };

  const getFormFields = () => {
    if (dialogType === 'sector') {
      return [
        {
          name: 'name',
          label: 'اسم القطاع',
          type: 'text',
          required: true,
          placeholder: 'أدخل اسم القطاع'
        },
        {
          name: 'description',
          label: 'الوصف',
          type: 'textarea',
          required: false,
          placeholder: 'أدخل وصف القطاع'
        },
        {
          name: 'code',
          label: 'كود القطاع',
          type: 'text',
          required: true,
          placeholder: 'أدخل كود القطاع'
        },
        {
          name: 'color',
          label: 'لون القطاع',
          type: 'color',
          required: true,
          placeholder: 'اختر لون القطاع'
        }
      ];
    } else if (dialogType === 'classification') {
      return [
        {
          name: 'name',
          label: 'اسم التصنيف',
          type: 'text',
          required: true,
          placeholder: 'أدخل اسم التصنيف'
        },
        {
          name: 'description',
          label: 'الوصف',
          type: 'textarea',
          required: false,
          placeholder: 'أدخل وصف التصنيف'
        },
        {
          name: 'sector_id',
          label: 'القطاع',
          type: 'select',
          required: true,
          options: sectors.map(s => ({ value: s.id!, label: s.name })),
          placeholder: 'اختر القطاع'
        }
      ];
    } else if (dialogType === 'mainCategory') {
      return [
        {
          name: 'name',
          label: 'اسم الفئة الأساسية',
          type: 'text',
          required: true,
          placeholder: 'أدخل اسم الفئة الأساسية'
        },
        {
          name: 'description',
          label: 'الوصف',
          type: 'textarea',
          required: false,
          placeholder: 'أدخل وصف الفئة الأساسية'
        },
        {
          name: 'classification_id',
          label: 'التصنيف',
          type: 'select',
          required: true,
          options: classifications.map(c => ({ value: c.id, label: c.name })),
          placeholder: 'اختر التصنيف'
        }
      ];
    } else if (dialogType === 'subCategory') {
      return [
        {
          name: 'name',
          label: 'اسم الفئة الفرعية',
          type: 'text',
          required: true,
          placeholder: 'أدخل اسم الفئة الفرعية'
        },
        {
          name: 'description',
          label: 'الوصف',
          type: 'textarea',
          required: false,
          placeholder: 'أدخل وصف الفئة الفرعية'
        },
        {
          name: 'main_category_id',
          label: 'الفئة الأساسية',
          type: 'select',
          required: true,
          options: mainCategories.map(m => ({ value: m.id, label: m.name })),
          placeholder: 'اختر الفئة الأساسية'
        }
      ];
    }
    
    return [];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

    return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة التصنيفات الهرمية</h1>
            <p className="text-gray-600">إدارة القطاعات والتصنيفات والفئات الأساسية والفرعية</p>
          </div>
          <Button onClick={() => openAddDialog('classification')}>
            <FiPlus className="w-4 h-4 mr-2" />
            إضافة تصنيف جديد
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="hierarchy" className="flex items-center gap-2">
              <FiLayers className="w-4 h-4" />
              التسلسل الهرمي
            </TabsTrigger>
            <TabsTrigger value="sectors" className="flex items-center gap-2">
              <FiStar className="w-4 h-4" />
              إدارة القطاعات
            </TabsTrigger>
            <TabsTrigger value="classifications" className="flex items-center gap-2">
              <FiPackage className="w-4 h-4" />
              التصنيفات
            </TabsTrigger>
            <TabsTrigger value="main-categories" className="flex items-center gap-2">
              <FiTag className="w-4 h-4" />
              الفئات الأساسية
            </TabsTrigger>
            <TabsTrigger value="sub-categories" className="flex items-center gap-2">
              <FiFolder className="w-4 h-4" />
              الفئات الفرعية
            </TabsTrigger>
          </TabsList>

          {/* Hierarchy Tab */}
          <TabsContent value="hierarchy" className="space-y-6">
            {/* Header Description */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <FiLayers className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">التسلسل الهرمي الكامل</h3>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    عرض شامل للهيكل الهرمي الكامل للمخازن مع القطاعات والتصنيفات والفئات. يمكنك من هنا رؤية العلاقات بين جميع العناصر وإدارتها بطريقة هرمية منظمة.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                  <FiLayers className="w-5 h-5 mr-2" />
                  التسلسل الهرمي الكامل
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleTreeExpanded}
                      className="flex items-center gap-1"
                    >
                      {treeExpanded ? (
                        <>
                          <FiMinus className="w-4 h-4" />
                          إغلاق الكل
                        </>
                      ) : (
                        <>
                          <FiPlus className="w-4 h-4" />
                          فتح الكل
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sectors.length === 0 ? (
                  <div className="text-center py-8">
                    <FiLayers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد قطاعات</h3>
                    <p className="text-gray-600 mb-4">ابدأ بإنشاء قطاع جديد</p>
                  </div>
                ) : (
      <div className="space-y-4">
                    {sectors.map(sector => (
                      <div key={sector.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleExpanded(sector.id || '')}
                              className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100"
                            >
                              {expandedItems.has(sector.id || '') ? (
                                <FiChevronDown className="w-4 h-4 text-gray-600" />
                              ) : (
                                <FiChevronRight className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                            <div 
                              className="w-4 h-4 rounded"
                    style={{ backgroundColor: sector.color }}
                            ></div>
                            <h3 className="font-medium text-lg">{sector.name}</h3>
                            <Badge variant="outline">{sector.code}</Badge>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {sector.product_classifications && sector.product_classifications.length > 0 && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {sector.product_classifications.length} تصنيف
                                </span>
                              )}
                              {sector.product_classifications && sector.product_classifications.length > 0 && (
                                (() => {
                                  const totalMainCategories = sector.product_classifications.reduce((total, classification) => 
                                    total + (classification.main_categories?.length || 0), 0
                                  );
                                  const totalSubCategories = sector.product_classifications.reduce((total, classification) => 
                                    total + (classification.main_categories?.reduce((subTotal, mainCategory) => 
                                      subTotal + (mainCategory.sub_categories?.length || 0), 0) || 0), 0
                                  );
                                  return (
                                    <>
                                      {totalMainCategories > 0 && (
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                          {totalMainCategories} فئة أساسية
                                        </span>
                                      )}
                                      {totalSubCategories > 0 && (
                                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                          {totalSubCategories} فئة فرعية
                                        </span>
                                      )}
                                    </>
                                  );
                                })()
                              )}
                            </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAddDialog('classification', sector.id)}
                >
                            <FiPlus className="w-3 h-3 mr-1" />
                  إضافة تصنيف
                </Button>
              </div>
                        
                        {expandedItems.has(sector.id || '') && sector.product_classifications && sector.product_classifications.length > 0 ? (
                          <div className="ml-6 space-y-2">
                            {sector.product_classifications.map(classification => {
                              console.log(`عرض التصنيف ${classification.name}:`, classification);
                              return (
                                <div key={classification.id} className="border-l-2 border-gray-200 pl-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => toggleExpanded(classification.id)}
                                        className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100"
                                      >
                                        {expandedItems.has(classification.id) ? (
                                          <FiChevronDown className="w-3 h-3 text-gray-600" />
                                        ) : (
                                          <FiChevronRight className="w-3 h-3 text-gray-600" />
                                        )}
                                      </button>
                          <h4 className="font-medium">{classification.name}</h4>
                                    </div>
                                    <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAddDialog('mainCategory', undefined, classification.id)}
                          >
                            <FiPlus className="w-3 h-3 mr-1" />
                            فئة أساسية
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog('classification', classification)}
                          >
                            <FiEdit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                                        onClick={() => handleDelete('classification', classification)}
                                        className="text-red-600"
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                                  {expandedItems.has(classification.id) && classification.main_categories && classification.main_categories.length > 0 ? (
                                    <div className="ml-4 space-y-2 mt-2">
                                      {classification.main_categories.map(mainCategory => {
                                        console.log(`عرض الفئة الأساسية ${mainCategory.name}:`, mainCategory);
                                        return (
                                          <div key={mainCategory.id} className="border-l-2 border-blue-200 pl-4">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-2">
                                                <button
                                                  onClick={() => toggleExpanded(mainCategory.id)}
                                                  className="flex items-center justify-center w-4 h-4 rounded hover:bg-gray-100"
                                                >
                                                  {expandedItems.has(mainCategory.id) ? (
                                                    <FiChevronDown className="w-3 h-3 text-gray-600" />
                                                  ) : (
                                                    <FiChevronRight className="w-3 h-3 text-gray-600" />
                                                  )}
                                                </button>
                                              <h5 className="font-medium text-sm">{mainCategory.name}</h5>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openAddDialog('subCategory', undefined, undefined, mainCategory.id)}
                                  >
                                    <FiPlus className="w-3 h-3 mr-1" />
                                    فئة فرعية
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditDialog('mainCategory', mainCategory)}
                                  >
                                    <FiEdit3 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                                  onClick={() => handleDelete('mainCategory', mainCategory)}
                                                  className="text-red-600"
                                  >
                                    <FiTrash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              
                                            {expandedItems.has(mainCategory.id) && mainCategory.sub_categories && mainCategory.sub_categories.length > 0 ? (
                                              <div className="ml-4 space-y-1 mt-2">
                                                {mainCategory.sub_categories.map(subCategory => {
                                                  console.log(`عرض الفئة الفرعية ${subCategory.name}:`, subCategory);
                                                  return (
                                                    <div key={subCategory.id} className="flex items-center justify-between">
                                                      <span className="text-sm text-gray-600">{subCategory.name}</span>
                                                      <div className="flex items-center space-x-1">
                                        <Button
                                          size="sm"
                                                          variant="outline"
                                          onClick={() => openEditDialog('subCategory', subCategory)}
                                        >
                                          <FiEdit3 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                                          variant="outline"
                                                          onClick={() => handleDelete('subCategory', subCategory)}
                                                          className="text-red-600"
                                        >
                                          <FiTrash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <p className="text-gray-500 text-xs ml-4 mt-1">لا توجد فئات فرعية</p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : expandedItems.has(classification.id) ? (
                                    <div className="ml-4 mt-2">
                                      <p className="text-gray-500 text-xs mb-2">لا توجد فئات أساسية تحت هذا التصنيف</p>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openAddDialog('mainCategory', undefined, classification.id)}
                                        className="text-xs"
                                      >
                                        <FiPlus className="w-3 h-3 mr-1" />
                                        إضافة فئة أساسية
                                      </Button>
                                    </div>
                                  ) : null}
                              </div>
                              );
                            })}
                            </div>
                        ) : expandedItems.has(sector.id || '') ? (
                          <div className="ml-6">
                            <p className="text-gray-500 text-sm mb-2">لا توجد تصنيفات</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAddDialog('classification', sector.id)}
                            >
                              <FiPlus className="w-3 h-3 mr-1" />
                              إضافة تصنيف
                            </Button>
                      </div>
                        ) : null}
                    </div>
                  ))}
                      </div>
                        )}
            </CardContent>
          </Card>
          </TabsContent>

          {/* Sectors Tab */}
          <TabsContent value="sectors" className="space-y-6">
            {/* Header Description */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <FiStar className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">إدارة القطاعات</h3>
                  <p className="text-purple-800 text-sm leading-relaxed">
                    القطاعات هي التصنيفات الرئيسية للمخازن مثل القطاع الصناعي، التجاري، الزراعي، الطبي. كل قطاع له لون مميز ومستويات مسموحة محددة. القطاعات تساعد في تنظيم وتصنيف المخازن حسب طبيعة العمل.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiStar className="w-5 h-5 mr-2" />
                    إدارة القطاعات ({sectors.length})
                  </div>
                  <Button onClick={() => openAddDialog('sector')}>
                    <FiPlus className="w-4 h-4 mr-2" />
                    إضافة قطاع جديد
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sectors.length === 0 ? (
                  <div className="text-center py-8">
                    <FiStar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد قطاعات</h3>
                    <p className="text-gray-600 mb-4">ابدأ بإنشاء قطاع جديد</p>
                    <Button onClick={() => openAddDialog('sector')}>
                      <FiPlus className="w-4 h-4 mr-2" />
                      إضافة قطاع جديد
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sectors.map(sector => (
                      <div key={sector.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: sector.color }}
                            ></div>
                            <h3 className="font-medium">{sector.name}</h3>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog('sector', sector)}
                            >
                              <FiEdit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete('sector', sector)}
                              className="text-red-600"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Badge variant="outline" className="text-xs">
                            {sector.code}
                          </Badge>
                          {sector.warehouse_levels && sector.warehouse_levels.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {sector.warehouse_levels.map((level: string) => (
                                <Badge key={level} variant="secondary" className="text-xs">
                                  {level === 'admin' ? 'الإدارة العليا' :
                                   level === 'country' ? 'المخزن الرئيسي' :
                                   level === 'city' ? 'مخزن المدينة' :
                                   level === 'district' ? 'مخزن المنطقة' : level}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {sector.product_classifications && sector.product_classifications.length > 0 && (
                            <p className="text-sm text-gray-600">
                              {sector.product_classifications.length} تصنيف
                            </p>
                          )}
                        </div>
                    </div>
                  ))}
              </div>
                )}
            </CardContent>
          </Card>
          </TabsContent>

          {/* Classifications Tab */}
          <TabsContent value="classifications" className="space-y-6">
            {/* Header Description */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <FiPackage className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">إدارة التصنيفات</h3>
                  <p className="text-green-800 text-sm leading-relaxed">
                    التصنيفات هي المستوى الثاني في الهيكل الهرمي، وتنتمي إلى قطاع معين. مثل تصنيف "المنتجات الغذائية" في القطاع التجاري، أو "المعدات الطبية" في القطاع الطبي. التصنيفات تساعد في تنظيم المنتجات والمخلفات داخل كل قطاع.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiPackage className="w-5 h-5 mr-2" />
                    التصنيفات ({classifications.length})
                  </div>
                  <Button onClick={() => openAddDialog('classification')}>
                    <FiPlus className="w-4 h-4 mr-2" />
                    إضافة تصنيف
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {classifications.length === 0 ? (
                  <div className="text-center py-8">
                    <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تصنيفات</h3>
                    <p className="text-gray-600 mb-4">ابدأ بإنشاء تصنيف جديد</p>
                <Button onClick={() => openAddDialog('classification')}>
                  <FiPlus className="w-4 h-4 mr-2" />
                  إضافة تصنيف جديد
                </Button>
              </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classifications.map(classification => (
                      <div key={classification.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{classification.name}</h3>
                          <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog('classification', classification)}
                          >
                              <FiEdit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                              onClick={() => handleDelete('classification', classification)}
                              className="text-red-600"
                          >
                              <FiTrash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                        {classification.description && (
                          <p className="text-sm text-gray-600 mb-2">{classification.description}</p>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {sectors.find(s => s.id === classification.sector_id)?.name || 'غير محدد'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                    </CardContent>
                  </Card>
          </TabsContent>

          {/* Main Categories Tab */}
          <TabsContent value="main-categories" className="space-y-6">
            {/* Header Description */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <FiTag className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">إدارة الفئات الأساسية</h3>
                  <p className="text-orange-800 text-sm leading-relaxed">
                    الفئات الأساسية هي المستوى الثالث في الهيكل الهرمي، وتنتمي إلى تصنيف معين. مثل فئة "اللحوم والدواجن" في تصنيف المنتجات الغذائية، أو فئة "الأدوات الجراحية" في تصنيف المعدات الطبية. الفئات الأساسية تساعد في تصنيف المنتجات بشكل أكثر تفصيلاً.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiTag className="w-5 h-5 mr-2" />
                    الفئات الأساسية ({mainCategories.length})
                  </div>
                  <Button onClick={() => openAddDialog('mainCategory')}>
                    <FiPlus className="w-4 h-4 mr-2" />
                    إضافة فئة أساسية
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mainCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <FiTag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فئات أساسية</h3>
                    <p className="text-gray-600 mb-4">ابدأ بإنشاء فئة أساسية جديدة</p>
                    <Button onClick={() => openAddDialog('mainCategory')}>
                      <FiPlus className="w-4 h-4 mr-2" />
                      إضافة فئة أساسية جديدة
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mainCategories.map(mainCategory => (
                      <div key={mainCategory.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{mainCategory.name}</h3>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog('mainCategory', mainCategory)}
                            >
                              <FiEdit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete('mainCategory', mainCategory)}
                              className="text-red-600"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {mainCategory.description && (
                          <p className="text-sm text-gray-600 mb-2">{mainCategory.description}</p>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {classifications.find(c => c.id === mainCategory.classification_id)?.name || 'غير محدد'}
                        </Badge>
                      </div>
                ))}
              </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sub Categories Tab */}
          <TabsContent value="sub-categories" className="space-y-6">
            {/* Header Description */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <FiFolder className="w-5 h-5 text-teal-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-teal-900 mb-2">إدارة الفئات الفرعية</h3>
                  <p className="text-teal-800 text-sm leading-relaxed">
                    الفئات الفرعية هي المستوى الرابع والأخير في الهيكل الهرمي، وتنتمي إلى فئة أساسية معينة. مثل فئة "لحم البقر" في الفئة الأساسية "اللحوم والدواجن"، أو فئة "المقصات الجراحية" في الفئة الأساسية "الأدوات الجراحية". الفئات الفرعية توفر تصنيفاً دقيقاً جداً للمنتجات.
                  </p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiFolder className="w-5 h-5 mr-2" />
                    الفئات الفرعية ({subCategories.length})
                  </div>
                  <Button onClick={() => openAddDialog('subCategory')}>
                    <FiPlus className="w-4 h-4 mr-2" />
                    إضافة فئة فرعية
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subCategories.length === 0 ? (
                  <div className="text-center py-8">
                    <FiFolder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فئات فرعية</h3>
                    <p className="text-gray-600 mb-4">ابدأ بإنشاء فئة فرعية جديدة</p>
                    <Button onClick={() => openAddDialog('subCategory')}>
                      <FiPlus className="w-4 h-4 mr-2" />
                      إضافة فئة فرعية جديدة
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subCategories.map(subCategory => (
                      <div key={subCategory.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{subCategory.name}</h3>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog('subCategory', subCategory)}
                            >
                              <FiEdit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete('subCategory', subCategory)}
                              className="text-red-600"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {subCategory.description && (
                          <p className="text-sm text-gray-600 mb-2">{subCategory.description}</p>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {mainCategories.find(m => m.id === subCategory.main_category_id)?.name || 'غير محدد'}
                        </Badge>
                      </div>
                    ))}
            </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Universal Dialog */}
        <UniversalDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={dialogTitle}
          type={dialogType}
          onSubmit={handleSubmit}
          loading={dialogLoading}
          initialData={editingItem ? {
            name: editingItem.name,
            description: 'description' in editingItem ? editingItem.description || '' : '',
            code: 'code' in editingItem ? editingItem.code || '' : '',
            color: 'color' in editingItem ? editingItem.color || '' : '',
            warehouse_levels: 'warehouse_levels' in editingItem ? editingItem.warehouse_levels || [] : [],
            sector_id: 'sector_id' in editingItem ? editingItem.sector_id || '' : '',
            classification_id: 'classification_id' in editingItem ? editingItem.classification_id || '' : '',
            main_category_id: 'main_category_id' in editingItem ? editingItem.main_category_id || '' : ''
          } : {
            name: '',
            description: '',
            code: '',
            color: '',
            warehouse_levels: [],
            sector_id: '',
            classification_id: '',
            main_category_id: ''
          }}
          sectors={sectors}
          classifications={classifications}
          mainCategories={mainCategories}
        />
      </div>
    </DashboardLayout>
  );
}