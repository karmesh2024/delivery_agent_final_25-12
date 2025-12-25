import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { toast } from '@/shared/ui/use-toast';
import { MainCategory, SubCategory } from '@/domains/products/types/types';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';

interface CategoryManagementFormProps {
  shopId: string;
  shopName: string;
}

interface Store {
  id: string;
  name_ar: string;
  name_en: string | null;
}

interface MainCategoryFormData {
  name_ar: string;
  name_en: string | null;
  slug: string | null;
  sort_order: number;
  is_active: boolean;
  shop_id: string;
}

interface SubCategoryFormData {
  id?: string; // Add id to SubCategoryFormData for updates
  main_category_id: string;
  name_ar: string;
  name_en: string | null;
  slug: string | null;
  sort_order: number;
  is_active: boolean;
  shop_id: string;
}

const CategoryManagementForm: React.FC<CategoryManagementFormProps> = ({
  shopId,
  shopName,
}) => {
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentTab, setCurrentTab] = useState('main-categories');
  const [isAddMainCategoryDialogOpen, setIsAddMainCategoryDialogOpen] = useState(false);
  const [isAddSubCategoryDialogOpen, setIsAddSubCategoryDialogOpen] = useState(false);
  const [editingMainCategory, setEditingMainCategory] = useState<MainCategory | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [selectedMainCategoryIdForDisplay, setSelectedMainCategoryIdForDisplay] = useState<string | null>(null);
  const [newMainCategory, setNewMainCategory] = useState<MainCategoryFormData>({
    name_ar: '',
    name_en: '',
    slug: '',
    sort_order: 0,
    is_active: true,
    shop_id: '',
  });
  const [newSubCategory, setNewSubCategory] = useState<SubCategoryFormData>({
    main_category_id: '',
    name_ar: '',
    name_en: '',
    slug: '',
    sort_order: 0,
    is_active: true,
    shop_id: shopId,
  });

  // Reset state when shopId changes
  useEffect(() => {
    console.log('CategoryManagementForm: shopId changed, resetting state.', shopId);
    setSelectedMainCategoryIdForDisplay(null);
    setSubCategories([]);
    setCurrentTab('main-categories');
    // Also ensure newMainCategory and newSubCategory are updated with the new shopId
    setNewMainCategory(prev => ({ ...prev, shop_id: shopId }));
    setNewSubCategory(prev => ({ ...prev, shop_id: shopId }));
  }, [shopId]);

  const fetchStores = useCallback(async () => {
    try {
      const response = await fetch('/api/stores');
      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }
      const data: Store[] = await response.json();
      setStores(data);
      if (shopId && !newMainCategory.shop_id && data.some(s => s.id === shopId)) {
        setNewMainCategory(prev => ({ ...prev, shop_id: shopId }));
      } else if (data.length > 0 && !newMainCategory.shop_id) {
        setNewMainCategory(prev => ({ ...prev, shop_id: data[0].id }));
      }
    } catch (error: unknown) {
      console.error('Error fetching stores:', error);
      toast({
        title: "خطأ",
        description: `فشل جلب المتاجر: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [shopId, newMainCategory.shop_id]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const fetchMainCategories = useCallback(async () => {
    try {
      const response = await fetch(`/api/main-categories?shop_id=${shopId}`);
      if (!response.ok) throw new Error('Failed to fetch main categories');
      const data: MainCategory[] = await response.json();
      setMainCategories(data);
    } catch (error: unknown) {
      console.error('Error fetching main categories:', error);
      toast({
        title: "خطأ",
        description: `فشل جلب الفئات الرئيسية: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [shopId]);

  const fetchSubCategories = useCallback(async (mainCategoryId: string) => {
    try {
      const response = await fetch(`/api/subcategories?main_category_id=${mainCategoryId}&shop_id=${shopId}`);
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      const data: SubCategory[] = await response.json();
      setSubCategories(data);
    } catch (error: unknown) {
      console.error('Error fetching subcategories:', error);
      toast({
        title: "خطأ",
        description: `فشل جلب الفئات الفرعية: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [shopId]);

  useEffect(() => {
    if (shopId) {
      console.log('CategoryManagementForm: Effect for fetching main categories triggered. Shop ID:', shopId);
      fetchMainCategories();
    }
  }, [shopId, fetchMainCategories]);

  // New useEffect to handle initial selection of main category and tab switching
  useEffect(() => {
    console.log('CategoryManagementForm: Effect for initial main category selection and tab switching triggered. Main categories length:', mainCategories.length, 'Selected Main Category ID for Display:', selectedMainCategoryIdForDisplay);
    if (mainCategories.length > 0 && !selectedMainCategoryIdForDisplay) {
      console.log('CategoryManagementForm: Setting initial selectedMainCategoryIdForDisplay to:', mainCategories[0].id);
      setSelectedMainCategoryIdForDisplay(mainCategories[0].id);
      setCurrentTab('sub-categories'); // Automatically switch to sub-categories tab
    } else if (mainCategories.length === 0) {
      console.log('CategoryManagementForm: No main categories found or cleared. Setting tab to main-categories.');
      setSelectedMainCategoryIdForDisplay(null);
      setSubCategories([]); // Clear subcategories if no main categories exist
      setCurrentTab('main-categories'); // Go back to main categories tab if no main categories
    }
  }, [mainCategories, shopId, selectedMainCategoryIdForDisplay, setCurrentTab, setSubCategories, setSelectedMainCategoryIdForDisplay]);

  useEffect(() => {
    console.log('CategoryManagementForm: Effect for fetching subcategories triggered. Current Tab:', currentTab, 'Selected Main Category ID for Display:', selectedMainCategoryIdForDisplay);
    // Only fetch subcategories if on the 'sub-categories' tab AND a main category is selected for display
    if (currentTab === 'sub-categories' && selectedMainCategoryIdForDisplay) {
      console.log('CategoryManagementForm: Fetching subcategories for Main Category ID:', selectedMainCategoryIdForDisplay);
      fetchSubCategories(selectedMainCategoryIdForDisplay);
    } else if (currentTab === 'sub-categories' && !selectedMainCategoryIdForDisplay) {
      // If on sub-categories tab but no main category selected, clear the list
      console.log('CategoryManagementForm: On sub-categories tab but no main category selected for display. Clearing subcategories.');
      setSubCategories([]);
    }
    // No need to clear subcategories if not on the sub-categories tab, as they will be re-fetched when switching back
  }, [selectedMainCategoryIdForDisplay, fetchSubCategories, currentTab]);

  const handleMainCategoryRowClick = (categoryId: string) => {
    setSelectedMainCategoryIdForDisplay(categoryId);
    setCurrentTab('sub-categories');
  };

  // Handle main category form changes
  const handleMainCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewMainCategory(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle sub category form changes
  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewSubCategory(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddMainCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingMainCategory ? 'PUT' : 'POST';
      const url = editingMainCategory ? `/api/main-categories?id=${editingMainCategory.id}` : '/api/main-categories';
      
      const payload = {
        ...newMainCategory,
        shop_id: shopId,
        is_active: newMainCategory.is_active, 
        sort_order: Number(newMainCategory.sort_order),
        name_en: newMainCategory.name_en === '' ? null : newMainCategory.name_en,
        slug: newMainCategory.slug === '' ? null : newMainCategory.slug, 
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status !== 204) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save main category');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      toast({
        title: "نجاح",
        description: `تم ${editingMainCategory ? 'تعديل' : 'إضافة'} الفئة الرئيسية بنجاح.`, 
      });
      setIsAddMainCategoryDialogOpen(false);
      setEditingMainCategory(null);
      setNewMainCategory({ name_ar: '', name_en: '', slug: '', sort_order: 0, is_active: true, shop_id: '' });
      fetchMainCategories();
    } catch (error: unknown) {
      console.error('Error saving main category:', error);
      toast({
        title: "خطأ",
        description: `فشل ${editingMainCategory ? 'تعديل' : 'إضافة'} الفئة الرئيسية: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingSubCategory ? 'PUT' : 'POST';
      const url = '/api/subcategories';

      const payload: SubCategoryFormData = {
        main_category_id: newSubCategory.main_category_id,
        name_ar: newSubCategory.name_ar,
        name_en: newSubCategory.name_en === '' ? null : newSubCategory.name_en,
        slug: newSubCategory.slug,
        sort_order: Number(newSubCategory.sort_order),
        is_active: newSubCategory.is_active,
        shop_id: shopId,
        ...(editingSubCategory && { id: editingSubCategory.id }), // Conditionally add ID for update
      };

      console.log('editingSubCategory state:', editingSubCategory);
      console.log('Payload being sent for subcategory:', payload);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status !== 204) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save subcategory');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      toast({
        title: "نجاح",
        description: `تم ${editingSubCategory ? 'تعديل' : 'إضافة'} الفئة الفرعية بنجاح.`,
      });
      setIsAddSubCategoryDialogOpen(false);
      setEditingSubCategory(null);
      setNewSubCategory({ main_category_id: '', name_ar: '', name_en: '', slug: '', sort_order: 0, is_active: true, shop_id: shopId });
      // Re-fetch subcategories for the currently selected main category
      if (newSubCategory.main_category_id) {
        fetchSubCategories(newSubCategory.main_category_id);
      }
    } catch (error: unknown) {
      console.error('Error saving subcategory:', error);
      toast({
        title: "خطأ",
        description: `فشل ${editingSubCategory ? 'تعديل' : 'إضافة'} الفئة الفرعية: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMainCategory = async (id: string) => {
    if (!confirm('هل أنت متأكد أنك تريد حذف هذه الفئة الرئيسية؟')) return;
    try {
      const response = await fetch(`/api/main-categories?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete main category');
      } else if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      toast({
        title: "نجاح",
        description: "تم حذف الفئة الرئيسية بنجاح.",
      });
      fetchMainCategories();
    } catch (error: unknown) {
      console.error('Error deleting main category:', error);
      toast({
        title: "خطأ",
        description: `فشل حذف الفئة الرئيسية: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubCategory = async (id: string, mainCategoryId: string) => {
    if (!confirm('هل أنت متأكد أنك تريد حذف هذه الفئة الفرعية؟')) return;
    console.log(`Attempting to delete subcategory with ID: ${id} for Main Category ID: ${mainCategoryId}`);
    try {
      const response = await fetch(`/api/subcategories?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete subcategory');
      } else if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      toast({
        title: "نجاح",
        description: "تم حذف الفئة الفرعية بنجاح.",
      });
      // Ensure the subcategories list is refreshed after deletion
      if (mainCategoryId) {
        fetchSubCategories(mainCategoryId);
      }
    } catch (error: unknown) {
      console.error('Error deleting subcategory:', error);
      toast({
        title: "خطأ",
        description: `فشل حذف الفئة الفرعية: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const handleEditMainCategory = (category: MainCategory) => {
    setEditingMainCategory(category);
    setNewMainCategory({
      name_ar: category.name_ar,
      name_en: category.name_en ?? '',
      slug: category.slug ?? '',
      sort_order: category.sort_order,
      is_active: category.is_active ?? false,
      shop_id: category.shop_id,
    });
    setIsAddMainCategoryDialogOpen(true);
  };

  const handleEditSubCategory = (subcategory: SubCategory) => {
    setEditingSubCategory(subcategory);
    setNewSubCategory({
      main_category_id: subcategory.main_category_id,
      name_ar: subcategory.name_ar,
      name_en: subcategory.name_en || '',
      slug: subcategory.slug || '',
      sort_order: subcategory.sort_order,
      is_active: subcategory.is_active ?? false,
      shop_id: subcategory.shop_id || shopId,
    });
    setIsAddSubCategoryDialogOpen(true);
  };

  return (
    <Fragment>
      <Tabs value={currentTab} className="w-full" onValueChange={(value) => setCurrentTab(value as string)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main-categories">الفئات الرئيسية</TabsTrigger>
          <TabsTrigger value="sub-categories">الفئات الفرعية</TabsTrigger>
        </TabsList>

        <TabsContent value="main-categories">
          <h2 className="text-xl font-semibold mb-4">إدارة الفئات الرئيسية للمتجر: {shopName}</h2>
          <div className="flex justify-end mb-4">
            <Button onClick={() => {
              setEditingMainCategory(null);
              setNewMainCategory({ name_ar: '', name_en: '', slug: '', sort_order: 0, is_active: true, shop_id: '' });
              setIsAddMainCategoryDialogOpen(true);
            }}>إضافة فئة رئيسية جديدة</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم (عربي)</TableHead>
                <TableHead>الاسم (انجليزي)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>ترتيب الفرز</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mainCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">لا توجد فئات رئيسية لعرضها.</TableCell>
                </TableRow>
              ) : (
                mainCategories.map((category) => (
                  <TableRow key={category.id} onClick={() => handleMainCategoryRowClick(category.id)} className="cursor-pointer">
                    <TableCell>{category.name_ar}</TableCell>
                    <TableCell>{category.name_en}</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>{category.is_active ? 'نشط' : 'غير نشط'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEditMainCategory(category)} className="mr-2">تعديل</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteMainCategory(category.id)}>حذف</Button>
                      <Button variant="secondary" size="sm" onClick={() => {
                        setNewSubCategory(prev => ({ ...prev, main_category_id: category.id }));
                        setSelectedMainCategoryIdForDisplay(category.id);
                        setCurrentTab('sub-categories');
                        setTimeout(() => {
                          setIsAddSubCategoryDialogOpen(true);
                        }, 0);
                      }} className="mr-2">إضافة فئة فرعية</Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedMainCategoryIdForDisplay(category.id);
                        setCurrentTab('sub-categories');
                      }} className="mr-2">عرض الفئات الفرعية</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <CustomDialog
            isOpen={isAddMainCategoryDialogOpen}
            onClose={() => setIsAddMainCategoryDialogOpen(false)}
            title={editingMainCategory ? "تعديل فئة رئيسية" : "إضافة فئة رئيسية جديدة"}
            description="املأ البيانات لإضافة أو تعديل الفئة الرئيسية."
          >
            <form onSubmit={handleAddMainCategory} className="space-y-4">
              <div>
                <Label htmlFor="main-category-shop">المتجر</Label>
                <Select
                  onValueChange={(value) => setNewMainCategory(prev => ({ ...prev, shop_id: value }))}
                  value={newMainCategory.shop_id ?? ''}
                  required
                  disabled={stores.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر متجر" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name_ar || store.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="main-category-name-ar">الاسم (عربي)</Label>
                <Input
                  id="main-category-name-ar"
                  name="name_ar"
                  value={newMainCategory.name_ar}
                  onChange={handleMainCategoryChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="main-category-name-en">الاسم (انجليزي)</Label>
                <Input
                  id="main-category-name-en"
                  name="name_en"
                  value={newMainCategory.name_en ?? ''}
                  onChange={handleMainCategoryChange}
                />
              </div>
              <div>
                <Label htmlFor="main-category-slug">Slug</Label>
                <Input
                  id="main-category-slug"
                  name="slug"
                  value={newMainCategory.slug ?? ''}
                  onChange={handleMainCategoryChange}
                  placeholder="اختياري، سيتم إنشاؤه تلقائياً إذا ترك فارغاً"
                />
              </div>
              <div>
                <Label htmlFor="main-category-sort-order">ترتيب الفرز</Label>
                <Input
                  id="main-category-sort-order"
                  name="sort_order"
                  type="number"
                  value={newMainCategory.sort_order}
                  onChange={handleMainCategoryChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="main-category-is-active"
                  name="is_active"
                  checked={newMainCategory.is_active}
                  onCheckedChange={(checked: boolean) => setNewMainCategory(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="main-category-is-active">نشط</Label>
              </div>
              <DialogFooter>
                <Button type="submit">{editingMainCategory ? "تعديل" : "إضافة"}</Button>
                <Button type="button" variant="outline" onClick={() => setIsAddMainCategoryDialogOpen(false)}>إلغاء</Button>
              </DialogFooter>
            </form>
          </CustomDialog>
        </TabsContent>

        <TabsContent value="sub-categories">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">الفئات الفرعية للفئة الرئيسية: {selectedMainCategoryIdForDisplay ? (mainCategories.find(cat => cat.id === selectedMainCategoryIdForDisplay)?.name_ar || 'غير محدد') : 'يرجى اختيار فئة رئيسية أولاً'}</h3>
            <Button onClick={() => {
              setEditingSubCategory(null);
              setNewSubCategory(prev => ({
                ...prev,
                main_category_id: selectedMainCategoryIdForDisplay || '', // Ensure main_category_id is set for new subcategory
                name_ar: '',
                name_en: '',
                slug: '',
                sort_order: 0,
                is_active: true,
                shop_id: shopId
              }));
              setIsAddSubCategoryDialogOpen(true);
            }} disabled={!selectedMainCategoryIdForDisplay}>إضافة فئة فرعية جديدة</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم (عربي)</TableHead>
                <TableHead>الاسم (انجليزي)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>ترتيب الفرز</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">لا توجد فئات فرعية لعرضها للفئة الرئيسية المحددة.</TableCell>
                </TableRow>
              ) : (
                subCategories.map((subcategory) => (
                  <TableRow key={subcategory.id}>
                    <TableCell>{subcategory.name_ar}</TableCell>
                    <TableCell>{subcategory.name_en}</TableCell>
                    <TableCell>{subcategory.slug}</TableCell>
                    <TableCell>{subcategory.sort_order}</TableCell>
                    <TableCell>{subcategory.is_active ? 'نشط' : 'غير نشط'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEditSubCategory(subcategory)} className="mr-2">تعديل</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteSubCategory(subcategory.id, subcategory.main_category_id)}>حذف</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
      <CustomDialog
        isOpen={isAddSubCategoryDialogOpen}
        onClose={() => setIsAddSubCategoryDialogOpen(false)}
        title={editingSubCategory ? "تعديل فئة فرعية" : "إضافة فئة فرعية جديدة"}
        description="املأ البيانات لإضافة أو تعديل الفئة الفرعية."
      >
        <form onSubmit={handleAddSubCategory} className="space-y-4">
          <div>
            <Label htmlFor="sub-category-shop">المتجر</Label>
            <Select
              onValueChange={(value) => setNewSubCategory(prev => ({ ...prev, shop_id: value }))}
              value={newSubCategory.shop_id ?? ''}
              required
              disabled={stores.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر متجر" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name_ar || store.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sub-category-main-category">الفئة الرئيسية</Label>
            <Select
              onValueChange={(value: string) => setNewSubCategory(prev => ({
                ...prev,
                main_category_id: value
              }))}
              value={newSubCategory.main_category_id ?? ''}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر فئة رئيسية" />
              </SelectTrigger>
              <SelectContent>
                {mainCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sub-category-name-ar">الاسم (عربي)</Label>
            <Input
              id="sub-category-name-ar"
              name="name_ar"
              value={newSubCategory.name_ar}
              onChange={handleSubCategoryChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="sub-category-name-en">الاسم (انجليزي)</Label>
            <Input
              id="sub-category-name-en"
              name="name_en"
              value={newSubCategory.name_en ?? ''}
              onChange={handleSubCategoryChange}
            />
          </div>
          <div>
            <Label htmlFor="sub-category-slug">Slug</Label>
            <Input
              id="sub-category-slug"
              name="slug"
              value={newSubCategory.slug ?? ''}
              onChange={handleSubCategoryChange}
              placeholder="اختياري، سيتم إنشاؤه تلقائياً إذا ترك فارغاً"
            />
          </div>
          <div>
            <Label htmlFor="sub-category-sort-order">ترتيب الفرز</Label>
            <Input
              id="sub-category-sort-order"
              name="sort_order"
              type="number"
              value={newSubCategory.sort_order}
              onChange={handleSubCategoryChange}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sub-category-is-active"
              name="is_active"
              checked={newSubCategory.is_active}
              onCheckedChange={(checked: boolean) => setNewSubCategory(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="sub-category-is-active">نشط</Label>
          </div>
          <DialogFooter>
            <Button type="submit">{editingSubCategory ? "تعديل" : "إضافة"}</Button>
            <Button type="button" variant="outline" onClick={() => setIsAddSubCategoryDialogOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </form>
      </CustomDialog>
    </Fragment>
  );
};

export default CategoryManagementForm;
