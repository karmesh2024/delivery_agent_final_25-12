'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiSearch, 
  FiLayers,
  FiTag,
  FiPackage,
  FiCode,
  FiSave,
  FiX
} from 'react-icons/fi';
import { toast } from 'sonner';
import { productCatalogService } from '@/services/productCatalogService';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import Link from 'next/link';

interface MainCategory {
  id: number;
  code: string;
  name: string;
}

interface SubCategory {
  id: number;
  code: string;
  name: string;
  main_id: number;
}

interface Unit {
  id: number;
  code: string;
  name: string;
}

interface Brand {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
}

export default function CatalogCategoriesPage() {
  const [activeTab, setActiveTab] = useState('main-categories');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Main Categories
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [showMainCategoryDialog, setShowMainCategoryDialog] = useState(false);
  const [editingMainCategory, setEditingMainCategory] = useState<MainCategory | null>(null);
  const [newMainCategory, setNewMainCategory] = useState({ code: '', name: '' });
  
  // Sub Categories
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [newSubCategory, setNewSubCategory] = useState({ code: '', name: '', main_id: 0 });
  
  // Units
  const [units, setUnits] = useState<Unit[]>([]);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [newUnit, setNewUnit] = useState({ code: '', name: '' });
  
  // Brands
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showBrandDialog, setShowBrandDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [newBrand, setNewBrand] = useState({ name: '', description: '' });
  
  const [deleteDialog, setDeleteDialog] = useState<{ type: string; id: number; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // دالة توليد الكود التلقائي
  const generateCode = (prefix: string, existingCodes: string[]): string => {
    let counter = 1;
    let newCode = `${prefix}${counter.toString().padStart(3, '0')}`;
    
    while (existingCodes.includes(newCode)) {
      counter++;
      newCode = `${prefix}${counter.toString().padStart(3, '0')}`;
    }
    
    return newCode;
  };

  // توليد كود الفئة الأساسية
  const generateMainCategoryCode = () => {
    const existingCodes = mainCategories.map(cat => cat.code);
    const newCode = generateCode('CAT', existingCodes);
    
    if (editingMainCategory) {
      setEditingMainCategory({ ...editingMainCategory, code: newCode });
    } else {
      setNewMainCategory({ ...newMainCategory, code: newCode });
    }
  };

  // توليد كود الفئة الفرعية
  const generateSubCategoryCode = () => {
    const existingCodes = subCategories.map(cat => cat.code);
    const newCode = generateCode('SUB', existingCodes);
    
    if (editingSubCategory) {
      setEditingSubCategory({ ...editingSubCategory, code: newCode });
    } else {
      setNewSubCategory({ ...newSubCategory, code: newCode });
    }
  };

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [mainCats, unitsData, brandsData] = await Promise.all([
        productCatalogService.getMainCategories(),
        productCatalogService.getUnits(),
        productCatalogService.getBrands(),
      ]);
      
      setMainCategories(mainCats || []);
      setUnits(unitsData || []);
      setBrands(brandsData || []);
      
      // Load sub categories
      const subCats = await productCatalogService.getSubCategories();
      setSubCategories(subCats || []);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  // Main Categories Handlers
  const handleAddMainCategory = async () => {
    if (!newMainCategory.code || !newMainCategory.name) {
      toast.error('يجب إدخال الكود والاسم');
      return;
    }

    try {
      const result = await productCatalogService.addMainCategory(
        newMainCategory.code,
        newMainCategory.name
      );
      
      if (result) {
        toast.success('تم إضافة الفئة الأساسية بنجاح');
        setNewMainCategory({ code: '', name: '' });
        setShowMainCategoryDialog(false);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الفئة');
    }
  };

  const handleEditMainCategory = async () => {
    if (!editingMainCategory) return;
    
    try {
      const result = await productCatalogService.updateMainCategory(
        editingMainCategory.id,
        editingMainCategory.code,
        editingMainCategory.name
      );
      
      if (result) {
        toast.success('تم تحديث الفئة الأساسية بنجاح');
        setEditingMainCategory(null);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الفئة');
    }
  };

  const handleDeleteMainCategory = async () => {
    if (!deleteDialog) return;
    
    try {
      const result = await productCatalogService.deleteMainCategory(deleteDialog.id);
      if (result) {
        toast.success('تم حذف الفئة الأساسية بنجاح');
        setDeleteDialog(null);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الفئة');
    }
  };

  // Sub Categories Handlers
  const handleAddSubCategory = async () => {
    if (!newSubCategory.code || !newSubCategory.name || !newSubCategory.main_id) {
      toast.error('يجب إدخال جميع البيانات');
      return;
    }

    try {
      const result = await productCatalogService.addSubCategory(
        newSubCategory.code,
        newSubCategory.name,
        newSubCategory.main_id
      );
      
      if (result) {
        toast.success('تم إضافة الفئة الفرعية بنجاح');
        setNewSubCategory({ code: '', name: '', main_id: 0 });
        setShowSubCategoryDialog(false);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الفئة الفرعية');
    }
  };

  const handleEditSubCategory = async () => {
    if (!editingSubCategory) return;
    
    try {
      const result = await productCatalogService.updateSubCategory(
        editingSubCategory.id,
        editingSubCategory.code,
        editingSubCategory.name,
        editingSubCategory.main_id
      );
      
      if (result) {
        toast.success('تم تحديث الفئة الفرعية بنجاح');
        setEditingSubCategory(null);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الفئة الفرعية');
    }
  };

  const handleDeleteSubCategory = async () => {
    if (!deleteDialog) return;
    
    try {
      const result = await productCatalogService.deleteSubCategory(deleteDialog.id);
      if (result) {
        toast.success('تم حذف الفئة الفرعية بنجاح');
        setDeleteDialog(null);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الفئة الفرعية');
    }
  };

  // Units Handlers
  const handleAddUnit = async () => {
    if (!newUnit.code || !newUnit.name) {
      toast.error('يجب إدخال الكود والاسم');
      return;
    }

    try {
      const result = await productCatalogService.addUnit(newUnit.code, newUnit.name);
      if (result) {
        toast.success('تم إضافة الوحدة بنجاح');
        setNewUnit({ code: '', name: '' });
        setShowUnitDialog(false);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الوحدة');
    }
  };

  const handleEditUnit = async () => {
    if (!editingUnit) return;
    
    try {
      const result = await productCatalogService.updateUnit(
        editingUnit.id,
        editingUnit.code,
        editingUnit.name
      );
      
      if (result) {
        toast.success('تم تحديث الوحدة بنجاح');
        setEditingUnit(null);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث الوحدة');
    }
  };

  const handleDeleteUnit = async () => {
    if (!deleteDialog) return;
    
    try {
      const result = await productCatalogService.deleteUnit(deleteDialog.id);
      if (result) {
        toast.success('تم حذف الوحدة بنجاح');
        setDeleteDialog(null);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف الوحدة');
    }
  };

  // Brands Handlers
  const handleAddBrand = async () => {
    if (!newBrand.name) {
      toast.error('يجب إدخال اسم البراند');
      return;
    }

    try {
      const result = await productCatalogService.addBrand(newBrand.name, newBrand.description || '');
      if (result) {
        toast.success('تم إضافة البراند بنجاح');
        setNewBrand({ name: '', description: '' });
        setShowBrandDialog(false);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة البراند');
    }
  };

  const handleEditBrand = async () => {
    if (!editingBrand) return;
    
    try {
      const result = await productCatalogService.updateBrand(
        editingBrand.id,
        editingBrand.name,
        editingBrand.description || ''
      );
      
      if (result) {
        toast.success('تم تحديث البراند بنجاح');
        setEditingBrand(null);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث البراند');
    }
  };

  const handleDeleteBrand = async () => {
    if (!deleteDialog) return;
    
    try {
      const result = await productCatalogService.deleteBrand(deleteDialog.id);
      if (result) {
        toast.success('تم حذف البراند بنجاح');
        setDeleteDialog(null);
        loadData();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف البراند');
    }
  };

  // Filter functions
  const filteredMainCategories = mainCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubCategories = subCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMainCategoryName = (mainId: number) => {
    const category = mainCategories.find(c => c.id === mainId);
    return category?.name || 'غير محدد';
  };

  return (
    <DashboardLayout title="إدارة فئات الكتالوج">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">إدارة فئات الكتالوج</h1>
            <p className="text-gray-600 mt-2">إدارة الفئات الأساسية والفرعية والوحدات والبراندز</p>
          </div>
          <Link href="/warehouse-management/catalog">
            <Button variant="outline">العودة إلى الكتالوج</Button>
          </Link>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="البحث في الفئات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="main-categories">
              <FiLayers className="mr-2" />
              الفئات الأساسية ({mainCategories.length})
            </TabsTrigger>
            <TabsTrigger value="sub-categories">
              <FiTag className="mr-2" />
              الفئات الفرعية ({subCategories.length})
            </TabsTrigger>
            <TabsTrigger value="units">
              <FiPackage className="mr-2" />
              الوحدات ({units.length})
            </TabsTrigger>
            <TabsTrigger value="brands">
              <FiCode className="mr-2" />
              البراندز ({brands.length})
            </TabsTrigger>
          </TabsList>

          {/* Main Categories Tab */}
          <TabsContent value="main-categories" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>الفئات الأساسية</CardTitle>
                    <CardDescription>إدارة الفئات الأساسية للمنتجات في الكتالوج</CardDescription>
                  </div>
                  <Button onClick={() => setShowMainCategoryDialog(true)}>
                    <FiPlus className="mr-2" />
                    إضافة فئة أساسية
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredMainCategories.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">لا توجد فئات أساسية</p>
                  ) : (
                    filteredMainCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-semibold">{category.name}</div>
                          <div className="text-sm text-gray-500">الكود: {category.code}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingMainCategory(category)}
                          >
                            <FiEdit />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({
                                type: 'main-category',
                                id: category.id,
                                name: category.name,
                              })
                            }
                          >
                            <FiTrash2 className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sub Categories Tab */}
          <TabsContent value="sub-categories" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>الفئات الفرعية</CardTitle>
                    <CardDescription>إدارة الفئات الفرعية المرتبطة بالفئات الأساسية</CardDescription>
                  </div>
                  <Button onClick={() => setShowSubCategoryDialog(true)}>
                    <FiPlus className="mr-2" />
                    إضافة فئة فرعية
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredSubCategories.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">لا توجد فئات فرعية</p>
                  ) : (
                    filteredSubCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-semibold">{category.name}</div>
                          <div className="text-sm text-gray-500">
                            الكود: {category.code} | الفئة الأساسية: {getMainCategoryName(category.main_id)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSubCategory(category)}
                          >
                            <FiEdit />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({
                                type: 'sub-category',
                                id: category.id,
                                name: category.name,
                              })
                            }
                          >
                            <FiTrash2 className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Units Tab */}
          <TabsContent value="units" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>الوحدات</CardTitle>
                    <CardDescription>إدارة وحدات القياس المستخدمة في الكتالوج</CardDescription>
                  </div>
                  <Button onClick={() => setShowUnitDialog(true)}>
                    <FiPlus className="mr-2" />
                    إضافة وحدة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredUnits.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">لا توجد وحدات</p>
                  ) : (
                    filteredUnits.map((unit) => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-semibold">{unit.name}</div>
                          <div className="text-sm text-gray-500">الكود: {unit.code}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUnit(unit)}
                          >
                            <FiEdit />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({
                                type: 'unit',
                                id: unit.id,
                                name: unit.name,
                              })
                            }
                          >
                            <FiTrash2 className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brands Tab */}
          <TabsContent value="brands" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>البراندز</CardTitle>
                    <CardDescription>إدارة البراندز والعلامات التجارية</CardDescription>
                  </div>
                  <Button onClick={() => setShowBrandDialog(true)}>
                    <FiPlus className="mr-2" />
                    إضافة براند
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredBrands.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">لا توجد براندز</p>
                  ) : (
                    filteredBrands.map((brand) => (
                      <div
                        key={brand.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-semibold">{brand.name}</div>
                          {brand.description && (
                            <div className="text-sm text-gray-500">{brand.description}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBrand(brand)}
                          >
                            <FiEdit />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDeleteDialog({
                                type: 'brand',
                                id: brand.id,
                                name: brand.name,
                              })
                            }
                          >
                            <FiTrash2 className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Main Category Dialog */}
        <CustomDialog
          isOpen={showMainCategoryDialog || editingMainCategory !== null}
          onClose={() => {
            setShowMainCategoryDialog(false);
            setEditingMainCategory(null);
            setNewMainCategory({ code: '', name: '' });
          }}
          title={editingMainCategory ? 'تعديل الفئة الأساسية' : 'إضافة فئة أساسية جديدة'}
          description="أدخل بيانات الفئة الأساسية"
          footer={
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowMainCategoryDialog(false);
                setEditingMainCategory(null);
                setNewMainCategory({ code: '', name: '' });
              }}>
                إلغاء
              </Button>
              <Button onClick={editingMainCategory ? handleEditMainCategory : handleAddMainCategory}>
                <FiSave className="mr-2" />
                حفظ
              </Button>
            </DialogFooter>
          }
        >
          <div className="space-y-4">
            <div>
              <Label>الكود *</Label>
              <div className="flex gap-2">
                <Input
                  value={editingMainCategory?.code || newMainCategory.code}
                  onChange={(e) => {
                    if (editingMainCategory) {
                      setEditingMainCategory({ ...editingMainCategory, code: e.target.value });
                    } else {
                      setNewMainCategory({ ...newMainCategory, code: e.target.value });
                    }
                  }}
                  placeholder="مثال: CAT001"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateMainCategoryCode}
                  title="توليد كود تلقائي"
                >
                  <FiCode className="mr-2" />
                  توليد
                </Button>
              </div>
            </div>
            <div>
              <Label>الاسم *</Label>
              <Input
                value={editingMainCategory?.name || newMainCategory.name}
                onChange={(e) => {
                  if (editingMainCategory) {
                    setEditingMainCategory({ ...editingMainCategory, name: e.target.value });
                  } else {
                    setNewMainCategory({ ...newMainCategory, name: e.target.value });
                  }
                }}
                placeholder="مثال: ملابس"
              />
            </div>
          </div>
        </CustomDialog>

        {/* Add/Edit Sub Category Dialog */}
        <CustomDialog
          isOpen={showSubCategoryDialog || editingSubCategory !== null}
          onClose={() => {
            setShowSubCategoryDialog(false);
            setEditingSubCategory(null);
            setNewSubCategory({ code: '', name: '', main_id: 0 });
          }}
          title={editingSubCategory ? 'تعديل الفئة الفرعية' : 'إضافة فئة فرعية جديدة'}
          description="أدخل بيانات الفئة الفرعية"
          footer={
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowSubCategoryDialog(false);
                setEditingSubCategory(null);
                setNewSubCategory({ code: '', name: '', main_id: 0 });
              }}>
                إلغاء
              </Button>
              <Button onClick={editingSubCategory ? handleEditSubCategory : handleAddSubCategory}>
                <FiSave className="mr-2" />
                حفظ
              </Button>
            </DialogFooter>
          }
        >
          <div className="space-y-4">
            <div>
              <Label>الفئة الأساسية *</Label>
              <Select
                value={String(editingSubCategory?.main_id || newSubCategory.main_id)}
                onValueChange={(value) => {
                  if (editingSubCategory) {
                    setEditingSubCategory({ ...editingSubCategory, main_id: Number(value) });
                  } else {
                    setNewSubCategory({ ...newSubCategory, main_id: Number(value) });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة الأساسية" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الكود *</Label>
              <div className="flex gap-2">
                <Input
                  value={editingSubCategory?.code || newSubCategory.code}
                  onChange={(e) => {
                    if (editingSubCategory) {
                      setEditingSubCategory({ ...editingSubCategory, code: e.target.value });
                    } else {
                      setNewSubCategory({ ...newSubCategory, code: e.target.value });
                    }
                  }}
                  placeholder="مثال: SUBCAT001"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateSubCategoryCode}
                  title="توليد كود تلقائي"
                >
                  <FiCode className="mr-2" />
                  توليد
                </Button>
              </div>
            </div>
            <div>
              <Label>الاسم *</Label>
              <Input
                value={editingSubCategory?.name || newSubCategory.name}
                onChange={(e) => {
                  if (editingSubCategory) {
                    setEditingSubCategory({ ...editingSubCategory, name: e.target.value });
                  } else {
                    setNewSubCategory({ ...newSubCategory, name: e.target.value });
                  }
                }}
                placeholder="مثال: تي شيرت"
              />
            </div>
          </div>
        </CustomDialog>

        {/* Add/Edit Unit Dialog */}
        <CustomDialog
          isOpen={showUnitDialog || editingUnit !== null}
          onClose={() => {
            setShowUnitDialog(false);
            setEditingUnit(null);
            setNewUnit({ code: '', name: '' });
          }}
          title={editingUnit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
          description="أدخل بيانات الوحدة"
          footer={
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowUnitDialog(false);
                setEditingUnit(null);
                setNewUnit({ code: '', name: '' });
              }}>
                إلغاء
              </Button>
              <Button onClick={editingUnit ? handleEditUnit : handleAddUnit}>
                <FiSave className="mr-2" />
                حفظ
              </Button>
            </DialogFooter>
          }
        >
          <div className="space-y-4">
            <div>
              <Label>الكود *</Label>
              <Input
                value={editingUnit?.code || newUnit.code}
                onChange={(e) => {
                  if (editingUnit) {
                    setEditingUnit({ ...editingUnit, code: e.target.value });
                  } else {
                    setNewUnit({ ...newUnit, code: e.target.value });
                  }
                }}
                placeholder="مثال: PCS"
              />
            </div>
            <div>
              <Label>الاسم *</Label>
              <Input
                value={editingUnit?.name || newUnit.name}
                onChange={(e) => {
                  if (editingUnit) {
                    setEditingUnit({ ...editingUnit, name: e.target.value });
                  } else {
                    setNewUnit({ ...newUnit, name: e.target.value });
                  }
                }}
                placeholder="مثال: قطعة"
              />
            </div>
          </div>
        </CustomDialog>

        {/* Add/Edit Brand Dialog */}
        <CustomDialog
          isOpen={showBrandDialog || editingBrand !== null}
          onClose={() => {
            setShowBrandDialog(false);
            setEditingBrand(null);
            setNewBrand({ name: '', description: '' });
          }}
          title={editingBrand ? 'تعديل البراند' : 'إضافة براند جديد'}
          description="أدخل بيانات البراند"
          footer={
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowBrandDialog(false);
                setEditingBrand(null);
                setNewBrand({ name: '', description: '' });
              }}>
                إلغاء
              </Button>
              <Button onClick={editingBrand ? handleEditBrand : handleAddBrand}>
                <FiSave className="mr-2" />
                حفظ
              </Button>
            </DialogFooter>
          }
        >
          <div className="space-y-4">
            <div>
              <Label>الاسم *</Label>
              <Input
                value={editingBrand?.name || newBrand.name}
                onChange={(e) => {
                  if (editingBrand) {
                    setEditingBrand({ ...editingBrand, name: e.target.value });
                  } else {
                    setNewBrand({ ...newBrand, name: e.target.value });
                  }
                }}
                placeholder="مثال: Nike"
              />
            </div>
            <div>
              <Label>الوصف</Label>
              <Input
                value={editingBrand?.description || newBrand.description}
                onChange={(e) => {
                  if (editingBrand) {
                    setEditingBrand({ ...editingBrand, description: e.target.value });
                  } else {
                    setNewBrand({ ...newBrand, description: e.target.value });
                  }
                }}
                placeholder="وصف البراند (اختياري)"
              />
            </div>
          </div>
        </CustomDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog !== null} onOpenChange={(open) => !open && setDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف {deleteDialog?.name}؟ هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteDialog?.type === 'main-category') {
                    handleDeleteMainCategory();
                  } else if (deleteDialog?.type === 'sub-category') {
                    handleDeleteSubCategory();
                  } else if (deleteDialog?.type === 'unit') {
                    handleDeleteUnit();
                  } else if (deleteDialog?.type === 'brand') {
                    handleDeleteBrand();
                  }
                }}
                className="bg-red-500 hover:bg-red-600"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

