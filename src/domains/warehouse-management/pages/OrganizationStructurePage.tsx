'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { 
  FiLayers, 
  FiTag, 
  FiFolder, 
  FiFolderPlus, 
  FiPlus, 
  FiEdit, 
  FiTrash2,
  FiPackage,
  FiShoppingBag,
  FiGitBranch,
  FiX,
  FiRefreshCw,
  FiChevronDown,
  FiChevronRight,
  FiMinus
} from 'react-icons/fi';
import { unifiedCategoriesService, UnifiedSector, UnifiedClassification, UnifiedMainCategory, UnifiedSubCategory, ItemType } from '../services/unifiedCategoriesService';
import { unifiedBrandsService, UnifiedBrand } from '../services/unifiedBrandsService';
import { unifiedUnitsService, Unit } from '../services/unifiedUnitsService';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { warehouseService } from '../services/warehouseService';
import { toast } from 'react-toastify';

const OrganizationStructurePage: React.FC = () => {
  const [sectors, setSectors] = useState<UnifiedSector[]>([]);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [classifications, setClassifications] = useState<UnifiedClassification[]>([]);
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);
  const [mainCategories, setMainCategories] = useState<UnifiedMainCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<UnifiedSubCategory[]>([]);
  const [brands, setBrands] = useState<UnifiedBrand[]>([]);
  const [productBrands, setProductBrands] = useState<UnifiedBrand[]>([]);
  const [wasteBrands, setWasteBrands] = useState<UnifiedBrand[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hierarchy');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [treeExpanded, setTreeExpanded] = useState(true);

  // Dialog states
  const [addSectorOpen, setAddSectorOpen] = useState(false);
  const [addClassificationOpen, setAddClassificationOpen] = useState(false);
  const [addMainCategoryOpen, setAddMainCategoryOpen] = useState(false);
  const [addSubCategoryOpen, setAddSubCategoryOpen] = useState(false);
  const [unitsBrandsOpen, setUnitsBrandsOpen] = useState(false);
  const [selectedClassificationForUnitsBrands, setSelectedClassificationForUnitsBrands] = useState<string | null>(null);
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [addBrandOpen, setAddBrandOpen] = useState(false);
  const [mainCategoryBrandsOpen, setMainCategoryBrandsOpen] = useState(false);
  const [subCategoryBrandsOpen, setSubCategoryBrandsOpen] = useState(false);
  const [selectedMainCategoryForBrands, setSelectedMainCategoryForBrands] = useState<string | null>(null);
  const [selectedSubCategoryForBrands, setSelectedSubCategoryForBrands] = useState<string | null>(null);
  
  // Edit states
  const [editingClassification, setEditingClassification] = useState<UnifiedClassification | null>(null);
  const [editingMainCategory, setEditingMainCategory] = useState<UnifiedMainCategory | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<UnifiedSubCategory | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingBrand, setEditingBrand] = useState<UnifiedBrand | null>(null);

  // Form states
  const [sectorForm, setSectorForm] = useState({ name: '', code: '', description: '', color: '#3B82F6' });
  const [classificationForm, setClassificationForm] = useState({ 
    name: '', 
    name_ar: '', 
    description: '', 
    item_type: 'both' as ItemType,
    sector_id: ''
  });
  const [mainCategoryForm, setMainCategoryForm] = useState({ 
    name: '', 
    name_ar: '', 
    code: '', 
    description: '', 
    item_type: 'both' as ItemType,
    classification_id: ''
  });
  const [subCategoryForm, setSubCategoryForm] = useState({ 
    name: '', 
    name_ar: '', 
    code: '', 
    description: '', 
    item_type: 'both' as ItemType,
    main_category_id: ''
  });
  const [selectedUnits, setSelectedUnits] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [unitForm, setUnitForm] = useState({ code: '', name: '' });
  const [brandForm, setBrandForm] = useState({ 
    name_ar: '', 
    name_en: '', 
    description_ar: '', 
    description_en: '',
    item_type: 'both' as ItemType,
    sort_order: 0,
    is_active: true 
  });

  useEffect(() => {
    loadData();
    // تحميل البيانات الهرمية عند تحميل الصفحة
    loadAllHierarchyData();
  }, []);

  useEffect(() => {
    if (selectedSector) {
      loadClassifications(selectedSector);
    }
  }, [selectedSector]);

  useEffect(() => {
    if (selectedClassification) {
      loadMainCategories(selectedClassification);
    }
  }, [selectedClassification]);

  useEffect(() => {
    if (selectedMainCategory) {
      loadSubCategories(selectedMainCategory);
    }
  }, [selectedMainCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sectorsData, brandsData, productBrandsData, wasteBrandsData, unitsData] = await Promise.all([
        unifiedCategoriesService.getSectors(),
        unifiedBrandsService.getBrands(),
        unifiedBrandsService.getProductBrands(),
        unifiedBrandsService.getWasteBrands(),
        unifiedUnitsService.getUnits(),
      ]);
      setSectors(sectorsData);
      setBrands(brandsData);
      setProductBrands(productBrandsData);
      setWasteBrands(wasteBrandsData);
      setUnits(unitsData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  // دالة لتحميل جميع البيانات الهرمية دفعة واحدة
  const loadAllHierarchyData = async () => {
    try {
      // جلب جميع القطاعات
      const sectorsData = await unifiedCategoriesService.getSectors();
      setSectors(sectorsData);

      // جلب جميع التصنيفات
      const allClassifications = await unifiedCategoriesService.getClassifications();
      setClassifications(allClassifications);

      // جلب جميع الفئات الأساسية لكل تصنيف
      const allMainCategories: UnifiedMainCategory[] = [];
      for (const classification of allClassifications) {
        const mainCats = await unifiedCategoriesService.getMainCategoriesByClassification(classification.id);
        allMainCategories.push(...mainCats);
      }
      setMainCategories(allMainCategories);

      // جلب جميع الفئات الفرعية لكل فئة أساسية
      const allSubCategories: UnifiedSubCategory[] = [];
      for (const mainCategory of allMainCategories) {
        const subCats = await unifiedCategoriesService.getSubCategoriesByMainCategory(mainCategory.id);
        allSubCategories.push(...subCats);
      }
      setSubCategories(allSubCategories);
    } catch (error) {
      console.error('خطأ في تحميل البيانات الهرمية:', error);
    }
  };

  const loadClassifications = async (sectorId: string) => {
    try {
      const data = await unifiedCategoriesService.getClassificationsBySector(sectorId);
      setClassifications(data);
    } catch (error) {
      console.error('خطأ في تحميل التصنيفات:', error);
    }
  };

  const loadMainCategories = async (classificationId: string) => {
    try {
      const data = await unifiedCategoriesService.getMainCategoriesByClassification(classificationId);
      setMainCategories(data);
    } catch (error) {
      console.error('خطأ في تحميل الفئات الأساسية:', error);
    }
  };

  const loadSubCategories = async (mainCategoryId: string) => {
    try {
      const data = await unifiedCategoriesService.getSubCategoriesByMainCategory(mainCategoryId);
      setSubCategories(data);
    } catch (error) {
      console.error('خطأ في تحميل الفئات الفرعية:', error);
    }
  };

  const handleAddSector = async () => {
    if (!sectorForm.name || !sectorForm.code) {
      alert('يرجى إدخال اسم القطاع وكود القطاع');
      return;
    }
    try {
      const success = await warehouseService.createSector({
        name: sectorForm.name,
        code: sectorForm.code,
        description: sectorForm.description || '',
        color: sectorForm.color,
        warehouse_levels: [], // يمكن إضافة المستويات لاحقاً
      });
      if (success) {
        setAddSectorOpen(false);
        setSectorForm({ name: '', code: '', description: '', color: '#3B82F6' });
        await loadData();
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        }
      }
    } catch (error) {
      console.error('خطأ في إضافة القطاع:', error);
    }
  };

  const handleAddClassification = async () => {
    if (!classificationForm.sector_id) {
      alert('يرجى اختيار قطاع');
      return;
    }
    try {
      const result = await unifiedCategoriesService.addClassification({
        sector_id: classificationForm.sector_id,
        name: classificationForm.name,
        name_ar: classificationForm.name_ar,
        description: classificationForm.description,
        item_type: classificationForm.item_type,
        is_active: true,
      });
      if (result) {
        setAddClassificationOpen(false);
        setClassificationForm({ name: '', name_ar: '', description: '', item_type: 'both', sector_id: '' });
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        } else {
          loadClassifications(classificationForm.sector_id);
        }
      }
    } catch (error) {
      console.error('خطأ في إضافة التصنيف:', error);
    }
  };

  const handleAddMainCategory = async () => {
    if (!mainCategoryForm.classification_id) {
      alert('يرجى اختيار تصنيف');
      return;
    }
    if (!mainCategoryForm.code) {
      alert('يرجى إدخال كود الفئة');
      return;
    }
    try {
      const result = await unifiedCategoriesService.addMainCategory({
        classification_id: mainCategoryForm.classification_id,
        code: mainCategoryForm.code,
        name: mainCategoryForm.name,
        name_ar: mainCategoryForm.name_ar,
        description: mainCategoryForm.description,
        item_type: mainCategoryForm.item_type,
        level: 0,
        path: '',
        is_active: true,
      });
      if (result) {
        setAddMainCategoryOpen(false);
        setMainCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', classification_id: '' });
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        } else {
          loadMainCategories(mainCategoryForm.classification_id);
        }
      }
    } catch (error) {
      console.error('خطأ في إضافة الفئة الأساسية:', error);
    }
  };

  const handleAddSubCategory = async () => {
    if (!subCategoryForm.main_category_id) {
      alert('يرجى اختيار فئة أساسية');
      return;
    }
    if (!subCategoryForm.code) {
      alert('يرجى إدخال كود الفئة');
      return;
    }
    try {
      const result = await unifiedCategoriesService.addSubCategory({
        main_category_id: subCategoryForm.main_category_id,
        code: subCategoryForm.code,
        name: subCategoryForm.name,
        name_ar: subCategoryForm.name_ar,
        description: subCategoryForm.description,
        item_type: subCategoryForm.item_type,
        level: 0,
        path: '',
        is_active: true,
      });
      if (result) {
        setAddSubCategoryOpen(false);
        setSubCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', main_category_id: '' });
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        } else {
          loadSubCategories(subCategoryForm.main_category_id);
        }
      }
    } catch (error) {
      console.error('خطأ في إضافة الفئة الفرعية:', error);
    }
  };

  const handleLinkUnitsBrands = async () => {
    if (!selectedClassificationForUnitsBrands) return;
    
    try {
      // ربط الوحدات
      for (const unitId of selectedUnits) {
        await unifiedCategoriesService.linkUnitToClassification(selectedClassificationForUnitsBrands, unitId);
      }
      
      // ربط البراندز
      for (const brandId of selectedBrands) {
        await unifiedCategoriesService.linkBrandToClassification(selectedClassificationForUnitsBrands, brandId);
      }
      
      setUnitsBrandsOpen(false);
      setSelectedUnits([]);
      setSelectedBrands([]);
      if (selectedSector) {
        loadClassifications(selectedSector);
      }
    } catch (error) {
      console.error('خطأ في ربط الوحدات والبراندز:', error);
    }
  };

  const handleLinkMainCategoryBrands = async () => {
    if (!selectedMainCategoryForBrands) return;
    
    try {
      for (const brandId of selectedBrands) {
        await unifiedCategoriesService.linkBrandToMainCategory(selectedMainCategoryForBrands, brandId);
      }
      
      setMainCategoryBrandsOpen(false);
      setSelectedBrands([]);
      setSelectedMainCategoryForBrands(null);
      if (selectedClassification) {
        loadMainCategories(selectedClassification);
      }
    } catch (error) {
      console.error('خطأ في ربط البراندز بالفئة الأساسية:', error);
    }
  };

  const handleLinkSubCategoryBrands = async () => {
    if (!selectedSubCategoryForBrands) return;
    
    try {
      for (const brandId of selectedBrands) {
        await unifiedCategoriesService.linkBrandToSubCategory(selectedSubCategoryForBrands, brandId);
      }
      
      setSubCategoryBrandsOpen(false);
      setSelectedBrands([]);
      setSelectedSubCategoryForBrands(null);
      if (selectedMainCategory) {
        loadSubCategories(selectedMainCategory);
      }
    } catch (error) {
      console.error('خطأ في ربط البراندز بالفئة الفرعية:', error);
    }
  };

  // دوال التعديل
  const handleUpdateClassification = async () => {
    if (!editingClassification) return;
    try {
      const result = await unifiedCategoriesService.updateClassification(editingClassification.id, {
        name: classificationForm.name,
        name_ar: classificationForm.name_ar,
        description: classificationForm.description,
        item_type: classificationForm.item_type,
      });
      if (result) {
        setEditingClassification(null);
        setClassificationForm({ name: '', name_ar: '', description: '', item_type: 'both', sector_id: '' });
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        } else if (selectedSector) {
          loadClassifications(selectedSector);
        }
      }
    } catch (error) {
      console.error('خطأ في تحديث التصنيف:', error);
    }
  };

  const handleUpdateMainCategory = async () => {
    if (!editingMainCategory) return;
    try {
      const result = await unifiedCategoriesService.updateMainCategory(editingMainCategory.id, {
        name: mainCategoryForm.name,
        name_ar: mainCategoryForm.name_ar,
        code: mainCategoryForm.code,
        description: mainCategoryForm.description,
        item_type: mainCategoryForm.item_type,
      });
      if (result) {
        setEditingMainCategory(null);
        setMainCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', classification_id: '' });
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        } else if (selectedClassification) {
          loadMainCategories(selectedClassification);
        }
      }
    } catch (error) {
      console.error('خطأ في تحديث الفئة الأساسية:', error);
    }
  };

  const handleUpdateSubCategory = async () => {
    if (!editingSubCategory) return;
    try {
      const result = await unifiedCategoriesService.updateSubCategory(editingSubCategory.id, {
        name: subCategoryForm.name,
        name_ar: subCategoryForm.name_ar,
        code: subCategoryForm.code,
        description: subCategoryForm.description,
        item_type: subCategoryForm.item_type,
      });
      if (result) {
        setEditingSubCategory(null);
        setSubCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', main_category_id: '' });
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        } else if (selectedMainCategory) {
          loadSubCategories(selectedMainCategory);
        }
      }
    } catch (error) {
      console.error('خطأ في تحديث الفئة الفرعية:', error);
    }
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit) return;
    try {
      const result = await unifiedUnitsService.updateUnit(editingUnit.id, {
        name: unitForm.name,
        code: unitForm.code,
      });
      if (result) {
        setEditingUnit(null);
        setUnitForm({ code: '', name: '' });
        await loadData();
      }
    } catch (error) {
      console.error('خطأ في تحديث الوحدة:', error);
    }
  };

  const handleUpdateBrand = async () => {
    if (!editingBrand) return;
    try {
      const result = await unifiedBrandsService.updateBrand(editingBrand.id, {
        name_ar: brandForm.name_ar,
        name_en: brandForm.name_en,
        description_ar: brandForm.description_ar,
        description_en: brandForm.description_en,
        item_type: brandForm.item_type,
        sort_order: brandForm.sort_order,
        is_active: brandForm.is_active,
      });
      if (result) {
        setEditingBrand(null);
        setBrandForm({ name_ar: '', name_en: '', description_ar: '', description_en: '', item_type: 'both', sort_order: 0, is_active: true });
        await loadData();
      }
    } catch (error) {
      console.error('خطأ في تحديث البراند:', error);
    }
  };

  // دوال الحذف
  const handleDeleteClassification = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف التصنيف "${name}"؟ سيتم حذف جميع الفئات الأساسية والفرعية المرتبطة به.`)) return;
    try {
      const success = await unifiedCategoriesService.deleteClassification(id);
      if (success) {
        // تحديث البيانات بناءً على التبويب النشط
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        } else if (selectedSector) {
          await loadClassifications(selectedSector);
        }
        // إزالة التصنيف من القائمة المحلية
        setClassifications(prev => prev.filter(c => c.id !== id));
        // إزالة الفئات الأساسية والفرعية المرتبطة
        setMainCategories(prev => prev.filter(m => m.classification_id !== id));
        const deletedMainCategoryIds = mainCategories.filter(m => m.classification_id === id).map(m => m.id);
        setSubCategories(prev => prev.filter(s => !deletedMainCategoryIds.includes(s.main_category_id)));
      }
    } catch (error: any) {
      console.error('خطأ في حذف التصنيف:', error);
      toast.error(`خطأ في حذف التصنيف: ${error.message || error}`);
    }
  };

  const handleDeleteMainCategory = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الفئة الأساسية "${name}"؟ سيتم حذف جميع الفئات الفرعية المرتبطة بها.`)) return;
    try {
      const success = await unifiedCategoriesService.deleteMainCategory(id);
      if (success) {
        // تحديث البيانات بناءً على التبويب النشط
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        } else if (selectedClassification) {
          await loadMainCategories(selectedClassification);
        }
        // إزالة الفئة الأساسية من القائمة المحلية
        setMainCategories(prev => prev.filter(m => m.id !== id));
        // إزالة الفئات الفرعية المرتبطة
        setSubCategories(prev => prev.filter(s => s.main_category_id !== id));
      }
    } catch (error: any) {
      console.error('خطأ في حذف الفئة الأساسية:', error);
      toast.error(`خطأ في حذف الفئة الأساسية: ${error.message || error}`);
    }
  };

  const handleDeleteSubCategory = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الفئة الفرعية "${name}"؟`)) return;
    try {
      const success = await unifiedCategoriesService.deleteSubCategory(id);
      if (success) {
        // تحديث البيانات بناءً على التبويب النشط
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        } else if (selectedMainCategory) {
          await loadSubCategories(selectedMainCategory);
        }
        // إزالة الفئة الفرعية من القائمة المحلية
        setSubCategories(prev => prev.filter(s => s.id !== id));
      }
    } catch (error: any) {
      console.error('خطأ في حذف الفئة الفرعية:', error);
      toast.error(`خطأ في حذف الفئة الفرعية: ${error.message || error}`);
    }
  };

  const getItemTypeBadge = (itemType: string) => {
    const colors = {
      product: 'bg-blue-100 text-blue-800',
      waste: 'bg-green-100 text-green-800',
      both: 'bg-purple-100 text-purple-800',
    };
    const labels = {
      product: 'منتج',
      waste: 'مخلف',
      both: 'كليهما',
    };
    return (
      <Badge className={colors[itemType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[itemType as keyof typeof labels] || itemType}
      </Badge>
    );
  };

  // جلب التسلسل الهرمي الكامل
  const [hierarchyData, setHierarchyData] = useState<any[]>([]);

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
    if (treeExpanded) {
      // إغلاق جميع العناصر
      setExpandedItems(new Set());
    } else {
      // فتح جميع العناصر
      const allIds = new Set<string>();
      sectors.forEach(sector => {
        allIds.add(sector.id);
        classifications.filter(c => c.sector_id === sector.id).forEach(classification => {
          allIds.add(classification.id);
          mainCategories.filter(m => m.classification_id === classification.id).forEach(mainCategory => {
            allIds.add(mainCategory.id);
            subCategories.filter(s => s.main_category_id === mainCategory.id).forEach(subCategory => {
              allIds.add(subCategory.id);
            });
          });
        });
      });
      setExpandedItems(allIds);
    }
    setTreeExpanded(!treeExpanded);
  };

  const loadHierarchy = async () => {
    await loadAllHierarchyData();
  };

  useEffect(() => {
    if (activeTab === 'hierarchy') {
      loadHierarchy();
    }
  }, [activeTab]);

  // فتح الشجرة افتراضياً عند تحميل البيانات
  useEffect(() => {
    if (!loading && sectors.length > 0 && treeExpanded) {
      const allIds = new Set<string>();
      sectors.forEach(sector => {
        allIds.add(sector.id);
        classifications.filter(c => c.sector_id === sector.id).forEach(classification => {
          allIds.add(classification.id);
          mainCategories.filter(m => m.classification_id === classification.id).forEach(mainCategory => {
            allIds.add(mainCategory.id);
            subCategories.filter(s => s.main_category_id === mainCategory.id).forEach(subCategory => {
              allIds.add(subCategory.id);
            });
          });
        });
      });
      setExpandedItems(allIds);
    }
  }, [loading, sectors, classifications, mainCategories, subCategories, treeExpanded]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* العنوان */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة التنظيم والتسلسل</h1>
          <p className="text-gray-600 mt-2">
            إدارة القطاعات، التصنيفات، الفئات الأساسية والفرعية، الوحدات والبراندز
          </p>
        </div>
      </div>

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hierarchy">
            <FiGitBranch className="mr-2" />
            التسلسل الهرمي
          </TabsTrigger>
          <TabsTrigger value="sectors">
            <FiLayers className="mr-2" />
            القطاعات
          </TabsTrigger>
          <TabsTrigger value="classifications">
            <FiTag className="mr-2" />
            التصنيفات
          </TabsTrigger>
          <TabsTrigger value="main-categories">
            <FiFolder className="mr-2" />
            الفئات الأساسية
          </TabsTrigger>
          <TabsTrigger value="sub-categories">
            <FiFolderPlus className="mr-2" />
            الفئات الفرعية
          </TabsTrigger>
          <TabsTrigger value="units-brands">
            <FiPackage className="mr-2" />
            الوحدات والبراندز
          </TabsTrigger>
        </TabsList>

        {/* تبويب التسلسل الهرمي */}
        <TabsContent value="hierarchy" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>التسلسل الهرمي الكامل</CardTitle>
                  <CardDescription>
                    عرض الهيكل الكامل: قطاع → تصنيف → فئة أساسية → فئة فرعية
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTreeExpanded}
                  >
                    {treeExpanded ? (
                      <>
                        <FiMinus className="mr-2" />
                        إغلاق الكل
                      </>
                    ) : (
                      <>
                        <FiPlus className="mr-2" />
                        فتح الكل
                      </>
                    )}
                  </Button>
                  <Button onClick={loadHierarchy}>
                    <FiRefreshCw className="mr-2" />
                    تحديث
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sectors.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">لا توجد بيانات للعرض</p>
                ) : (
                  sectors.map(sector => {
                    const sectorClassifications = classifications.filter(c => c.sector_id === sector.id);
                    const isExpanded = expandedItems.has(sector.id);
                    
                    return (
                      <div key={sector.id} className="border rounded-lg p-3 bg-white">
                        {/* القطاع */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <button
                              onClick={() => toggleExpanded(sector.id)}
                              className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100"
                            >
                              {isExpanded ? (
                                <FiChevronDown className="w-4 h-4 text-gray-600" />
                              ) : (
                                <FiChevronRight className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: sector.color || '#3B82F6' }}
                            />
                            <h3 className="font-semibold text-lg">{sector.name}</h3>
                            <Badge variant="outline">{sector.code}</Badge>
                            <div className="flex items-center gap-2 text-xs">
                              {sectorClassifications.length > 0 && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                  {sectorClassifications.length} تصنيف
                                </Badge>
                              )}
                              {(() => {
                                const totalMain = mainCategories.filter(m => 
                                  sectorClassifications.some(c => c.id === m.classification_id)
                                ).length;
                                const totalSub = subCategories.filter(s => 
                                  mainCategories.some(m => 
                                    m.id === s.main_category_id && 
                                    sectorClassifications.some(c => c.id === m.classification_id)
                                  )
                                ).length;
                                return (
                                  <>
                                    {totalMain > 0 && (
                                      <Badge variant="outline" className="bg-green-100 text-green-700">
                                        {totalMain} فئة أساسية
                                      </Badge>
                                    )}
                                    {totalSub > 0 && (
                                      <Badge variant="outline" className="bg-purple-100 text-purple-700">
                                        {totalSub} فئة فرعية
                                      </Badge>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClassificationForm({ ...classificationForm, sector_id: sector.id });
                              setAddClassificationOpen(true);
                            }}
                          >
                            <FiPlus className="w-3 h-3 mr-1" />
                            إضافة تصنيف
                          </Button>
                        </div>

                        {/* التصنيفات */}
                        {isExpanded && sectorClassifications.length > 0 && (
                          <div className="mt-3 ml-8 space-y-2">
                            {sectorClassifications.map(classification => {
                              const classificationMainCategories = mainCategories.filter(m => m.classification_id === classification.id);
                              const isClassificationExpanded = expandedItems.has(classification.id);
                              
                              return (
                                <div key={classification.id} className="border-l-2 border-gray-200 pl-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 flex-1">
                                      <button
                                        onClick={() => toggleExpanded(classification.id)}
                                        className="flex items-center justify-center w-5 h-5 rounded hover:bg-gray-100"
                                      >
                                        {isClassificationExpanded ? (
                                          <FiChevronDown className="w-3 h-3 text-gray-600" />
                                        ) : (
                                          <FiChevronRight className="w-3 h-3 text-gray-600" />
                                        )}
                                      </button>
                                      <h4 className="font-medium">{classification.name}</h4>
                                      {getItemTypeBadge(classification.item_type)}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMainCategoryForm({ ...mainCategoryForm, classification_id: classification.id });
                                          setAddMainCategoryOpen(true);
                                        }}
                                      >
                                        <FiPlus className="w-3 h-3 mr-1" />
                                        فئة أساسية
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingClassification(classification);
                                          setClassificationForm({
                                            name: classification.name,
                                            name_ar: classification.name_ar || '',
                                            description: classification.description || '',
                                            item_type: classification.item_type,
                                            sector_id: classification.sector_id,
                                          });
                                          setAddClassificationOpen(true);
                                        }}
                                      >
                                        <FiEdit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteClassification(classification.id, classification.name);
                                        }}
                                        className="text-red-600"
                                      >
                                        <FiTrash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* الفئات الأساسية */}
                                  {isClassificationExpanded && classificationMainCategories.length > 0 && (
                                    <div className="mt-2 ml-4 space-y-2">
                                      {classificationMainCategories.map(mainCategory => {
                                        const mainCategorySubCategories = subCategories.filter(s => s.main_category_id === mainCategory.id);
                                        const isMainCategoryExpanded = expandedItems.has(mainCategory.id);
                                        
                                        return (
                                          <div key={mainCategory.id} className="border-l-2 border-blue-200 pl-4">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-2 flex-1">
                                                <button
                                                  onClick={() => toggleExpanded(mainCategory.id)}
                                                  className="flex items-center justify-center w-4 h-4 rounded hover:bg-gray-100"
                                                >
                                                  {isMainCategoryExpanded ? (
                                                    <FiChevronDown className="w-3 h-3 text-gray-600" />
                                                  ) : (
                                                    <FiChevronRight className="w-3 h-3 text-gray-600" />
                                                  )}
                                                </button>
                                                <h5 className="font-medium text-sm">{mainCategory.name}</h5>
                                                <span className="text-xs text-gray-500">({mainCategory.code})</span>
                                                {getItemTypeBadge(mainCategory.item_type)}
                                                {mainCategory.available_brands && mainCategory.available_brands.length > 0 && (
                                                  <Badge variant="outline" className="text-xs">
                                                    <FiShoppingBag className="w-3 h-3 mr-1" />
                                                    {mainCategory.available_brands.length}
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSubCategoryForm({ ...subCategoryForm, main_category_id: mainCategory.id });
                                                    setAddSubCategoryOpen(true);
                                                  }}
                                                >
                                                  <FiPlus className="w-3 h-3 mr-1" />
                                                  فئة فرعية
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingMainCategory(mainCategory);
                                                    setMainCategoryForm({
                                                      name: mainCategory.name,
                                                      name_ar: mainCategory.name_ar || '',
                                                      code: mainCategory.code,
                                                      description: mainCategory.description || '',
                                                      item_type: mainCategory.item_type,
                                                      classification_id: mainCategory.classification_id,
                                                    });
                                                    setAddMainCategoryOpen(true);
                                                  }}
                                                >
                                                  <FiEdit className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMainCategory(mainCategory.id, mainCategory.name);
                                                  }}
                                                  className="text-red-600"
                                                >
                                                  <FiTrash2 className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </div>

                                            {/* الفئات الفرعية */}
                                            {isMainCategoryExpanded && mainCategorySubCategories.length > 0 && (
                                              <div className="mt-2 ml-4 space-y-2">
                                                {mainCategorySubCategories.map(subCategory => {
                                                  const isSubCategoryExpanded = expandedItems.has(subCategory.id);
                                                  
                                                  return (
                                                    <div key={subCategory.id} className="border-l-2 border-purple-200 pl-4">
                                                      <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2 flex-1">
                                                          <button
                                                            onClick={() => toggleExpanded(subCategory.id)}
                                                            className="flex items-center justify-center w-4 h-4 rounded hover:bg-gray-100"
                                                          >
                                                            {isSubCategoryExpanded ? (
                                                              <FiChevronDown className="w-3 h-3 text-gray-600" />
                                                            ) : (
                                                              <FiChevronRight className="w-3 h-3 text-gray-600" />
                                                            )}
                                                          </button>
                                                          <h6 className="font-medium text-sm">{subCategory.name}</h6>
                                                          <span className="text-xs text-gray-500">({subCategory.code})</span>
                                                          {getItemTypeBadge(subCategory.item_type)}
                                                          {subCategory.available_brands && subCategory.available_brands.length > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                              <FiShoppingBag className="w-3 h-3 mr-1" />
                                                              {subCategory.available_brands.length}
                                                            </Badge>
                                                          )}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setEditingSubCategory(subCategory);
                                                              setSubCategoryForm({
                                                                name: subCategory.name,
                                                                name_ar: subCategory.name_ar || '',
                                                                code: subCategory.code,
                                                                description: subCategory.description || '',
                                                                item_type: subCategory.item_type,
                                                                main_category_id: subCategory.main_category_id,
                                                              });
                                                              setAddSubCategoryOpen(true);
                                                            }}
                                                          >
                                                            <FiEdit className="w-3 h-3" />
                                                          </Button>
                                                          <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleDeleteSubCategory(subCategory.id, subCategory.name);
                                                            }}
                                                            className="text-red-600"
                                                          >
                                                            <FiTrash2 className="w-3 h-3" />
                                                          </Button>
                                                        </div>
                                                      </div>
                                                      {isSubCategoryExpanded && (
                                                        <div className="mt-2 ml-4 text-xs text-gray-500">
                                                          لا توجد فئات فرعية
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                            {isMainCategoryExpanded && mainCategorySubCategories.length === 0 && (
                                              <div className="mt-2 ml-4 text-xs text-gray-500">
                                                لا توجد فئات فرعية
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {isClassificationExpanded && classificationMainCategories.length === 0 && (
                                    <div className="mt-2 ml-4 text-xs text-gray-500">
                                      لا توجد فئات أساسية
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {isExpanded && sectorClassifications.length === 0 && (
                          <div className="mt-3 ml-8 text-sm text-gray-500">
                            لا توجد تصنيفات
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب القطاعات */}
        <TabsContent value="sectors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>القطاعات</CardTitle>
                  <CardDescription>
                    إدارة القطاعات الأساسية في النظام
                  </CardDescription>
                </div>
                <Button onClick={() => setAddSectorOpen(true)}>
                  <FiPlus className="mr-2" />
                  إضافة قطاع جديد
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectors.map((sector) => (
                  <Card
                    key={sector.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedSector === sector.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedSector(sector.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{sector.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{sector.code}</p>
                          {sector.description && (
                            <p className="text-sm text-gray-600 mt-2">{sector.description}</p>
                          )}
                        </div>
                        {sector.color && (
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: sector.color }}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التصنيفات */}
        <TabsContent value="classifications" className="space-y-4">
          {!selectedSector ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FiTag className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-gray-600">يرجى اختيار قطاع أولاً لعرض التصنيفات</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>التصنيفات - {sectors.find(s => s.id === selectedSector)?.name}</CardTitle>
                    <CardDescription>
                      التصنيفات المرتبطة بالقطاع المحدد
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSelectedClassificationForUnitsBrands(null);
                        setUnitsBrandsOpen(true);
                      }}
                    >
                      <FiPackage className="mr-2" />
                      ربط وحدات وبراندز
                    </Button>
                    <Button onClick={() => {
                      setClassificationForm({ ...classificationForm, sector_id: selectedSector });
                      setAddClassificationOpen(true);
                    }}>
                      <FiPlus className="mr-2" />
                      إضافة تصنيف
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classifications.map((classification) => (
                    <Card
                      key={classification.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedClassification === classification.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedClassification(classification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{classification.name}</h3>
                            {classification.name_ar && (
                              <p className="text-sm text-gray-500">{classification.name_ar}</p>
                            )}
                          </div>
                          {getItemTypeBadge(classification.item_type)}
                        </div>
                        {classification.description && (
                          <p className="text-sm text-gray-600 mt-2">{classification.description}</p>
                        )}
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {classification.available_units && classification.available_units.length > 0 && (
                            <Badge variant="outline">
                              <FiPackage className="mr-1" />
                              {classification.available_units.length} وحدة
                            </Badge>
                          )}
                          {classification.available_brands && classification.available_brands.length > 0 && (
                            <Badge variant="outline">
                              <FiShoppingBag className="mr-1" />
                              {classification.available_brands.length} براند
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClassification(classification);
                              setClassificationForm({
                                name: classification.name,
                                name_ar: classification.name_ar || '',
                                description: classification.description || '',
                                item_type: classification.item_type,
                                sector_id: classification.sector_id,
                              });
                              setAddClassificationOpen(true);
                            }}
                          >
                            <FiEdit className="mr-1" />
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClassification(classification.id, classification.name);
                            }}
                          >
                            <FiTrash2 className="mr-1" />
                            حذف
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClassificationForUnitsBrands(classification.id);
                              setUnitsBrandsOpen(true);
                            }}
                          >
                            <FiPackage className="mr-1" />
                            ربط وحدات/براندز
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* تبويب الفئات الأساسية */}
        <TabsContent value="main-categories" className="space-y-4">
          {!selectedClassification ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FiFolder className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-gray-600">يرجى اختيار تصنيف أولاً لعرض الفئات الأساسية</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      الفئات الأساسية - {classifications.find(c => c.id === selectedClassification)?.name}
                    </CardTitle>
                    <CardDescription>
                      الفئات الأساسية المرتبطة بالتصنيف المحدد
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setMainCategoryForm({ ...mainCategoryForm, classification_id: selectedClassification });
                    setAddMainCategoryOpen(true);
                  }}>
                    <FiPlus className="mr-2" />
                    إضافة فئة أساسية
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mainCategories.map((mainCategory) => (
                    <Card
                      key={mainCategory.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedMainCategory === mainCategory.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedMainCategory(mainCategory.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold">{mainCategory.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{mainCategory.code}</p>
                          </div>
                          {getItemTypeBadge(mainCategory.item_type)}
                        </div>
                        {mainCategory.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {mainCategory.description}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {mainCategory.sub_categories && mainCategory.sub_categories.length > 0 && (
                            <Badge variant="outline">
                              {mainCategory.sub_categories.length} فئة فرعية
                            </Badge>
                          )}
                          {mainCategory.available_brands && mainCategory.available_brands.length > 0 && (
                            <Badge variant="outline">
                              <FiShoppingBag className="mr-1" />
                              {mainCategory.available_brands.length} براند
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMainCategory(mainCategory);
                              setMainCategoryForm({
                                name: mainCategory.name,
                                name_ar: mainCategory.name_ar || '',
                                code: mainCategory.code,
                                description: mainCategory.description || '',
                                item_type: mainCategory.item_type,
                                classification_id: mainCategory.classification_id,
                              });
                              setAddMainCategoryOpen(true);
                            }}
                          >
                            <FiEdit className="mr-1" />
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMainCategoryForBrands(mainCategory.id);
                              setMainCategoryBrandsOpen(true);
                            }}
                          >
                            <FiShoppingBag className="mr-1" />
                            ربط براندز
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMainCategory(mainCategory.id, mainCategory.name);
                            }}
                          >
                            <FiTrash2 className="mr-1" />
                            حذف
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* تبويب الفئات الفرعية */}
        <TabsContent value="sub-categories" className="space-y-4">
          {!selectedMainCategory ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FiFolderPlus className="mx-auto text-4xl text-gray-400 mb-4" />
                <p className="text-gray-600">يرجى اختيار فئة أساسية أولاً لعرض الفئات الفرعية</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      الفئات الفرعية - {mainCategories.find(m => m.id === selectedMainCategory)?.name}
                    </CardTitle>
                    <CardDescription>
                      الفئات الفرعية المرتبطة بالفئة الأساسية المحددة
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setSubCategoryForm({ ...subCategoryForm, main_category_id: selectedMainCategory });
                    setAddSubCategoryOpen(true);
                  }}>
                    <FiPlus className="mr-2" />
                    إضافة فئة فرعية
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subCategories.map((subCategory) => (
                    <Card key={subCategory.id} className="transition-all hover:shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold">{subCategory.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{subCategory.code}</p>
                          </div>
                          {getItemTypeBadge(subCategory.item_type)}
                        </div>
                        {subCategory.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {subCategory.description}
                          </p>
                        )}
                        {subCategory.available_brands && subCategory.available_brands.length > 0 && (
                          <Badge variant="outline" className="mt-2">
                            <FiShoppingBag className="mr-1" />
                            {subCategory.available_brands.length} براند
                          </Badge>
                        )}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSubCategory(subCategory);
                              setSubCategoryForm({
                                name: subCategory.name,
                                name_ar: subCategory.name_ar || '',
                                code: subCategory.code,
                                description: subCategory.description || '',
                                item_type: subCategory.item_type,
                                main_category_id: subCategory.main_category_id,
                              });
                              setAddSubCategoryOpen(true);
                            }}
                          >
                            <FiEdit className="mr-1" />
                            تعديل
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubCategoryForBrands(subCategory.id);
                              setSubCategoryBrandsOpen(true);
                            }}
                          >
                            <FiShoppingBag className="mr-1" />
                            ربط براندز
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubCategory(subCategory.id, subCategory.name);
                            }}
                          >
                            <FiTrash2 className="mr-1" />
                            حذف
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* تبويب الوحدات والبراندز */}
        <TabsContent value="units-brands" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* الوحدات */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <FiPackage className="mr-2" />
                      الوحدات
                    </CardTitle>
                    <CardDescription>
                      إدارة الوحدات المتاحة في النظام
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setUnitForm({ code: '', name: '' });
                    setAddUnitOpen(true);
                  }}>
                    <FiPlus className="mr-2" />
                    إضافة وحدة
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {units.map((unit) => (
                    <div key={unit.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{unit.name}</p>
                        <p className="text-sm text-gray-500">{unit.code}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingUnit(unit);
                            setUnitForm({ code: unit.code, name: unit.name });
                            setAddUnitOpen(true);
                          }}
                        >
                          <FiEdit />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`هل أنت متأكد من حذف الوحدة "${unit.name}"؟`)) {
                              await unifiedUnitsService.deleteUnit(unit.id);
                              await loadData();
                            }
                          }}
                        >
                          <FiTrash2 className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* البراندز - مقسمة حسب النوع */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* براندز المنتجات */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center">
                        <FiShoppingBag className="mr-2" />
                        براندز المنتجات
                      </CardTitle>
                      <CardDescription>
                        براندز خاصة بالمنتجات
                      </CardDescription>
                    </div>
                    <Button onClick={() => {
                      setBrandForm({ name_ar: '', name_en: '', description_ar: '', description_en: '', item_type: 'product', sort_order: 0, is_active: true });
                      setAddBrandOpen(true);
                    }}>
                      <FiPlus className="mr-2" />
                      إضافة براند منتج
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {productBrands.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{brand.name_ar}</p>
                          {brand.name_en && (
                            <p className="text-sm text-gray-500">{brand.name_en}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingBrand(brand);
                              setBrandForm({
                                name_ar: brand.name_ar,
                                name_en: brand.name_en || '',
                                description_ar: brand.description_ar || '',
                                description_en: brand.description_en || '',
                                item_type: brand.item_type || 'both',
                                sort_order: brand.sort_order || 0,
                                is_active: brand.is_active ?? true,
                              });
                              setAddBrandOpen(true);
                            }}
                          >
                            <FiEdit />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm(`هل أنت متأكد من حذف البراند "${brand.name_ar}"؟`)) {
                                await unifiedBrandsService.deleteBrand(brand.id);
                                await loadData();
                              }
                            }}
                          >
                            <FiTrash2 className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {productBrands.length === 0 && (
                      <p className="text-center text-gray-500 py-4">لا توجد براندز منتجات</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* براندز المخلفات والروبابيكيا والمستعمل */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center">
                        <FiShoppingBag className="mr-2" />
                        براندز المخلفات والروبابيكيا والمستعمل
                      </CardTitle>
                      <CardDescription>
                        براندز خاصة بالمخلفات والروبابيكيا والمستعمل
                      </CardDescription>
                    </div>
                    <Button onClick={() => {
                      setBrandForm({ name_ar: '', name_en: '', description_ar: '', description_en: '', item_type: 'waste', sort_order: 0, is_active: true });
                      setAddBrandOpen(true);
                    }}>
                      <FiPlus className="mr-2" />
                      إضافة براند مخلف
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {wasteBrands.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{brand.name_ar}</p>
                          {brand.name_en && (
                            <p className="text-sm text-gray-500">{brand.name_en}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingBrand(brand);
                              setBrandForm({
                                name_ar: brand.name_ar,
                                name_en: brand.name_en || '',
                                description_ar: brand.description_ar || '',
                                description_en: brand.description_en || '',
                                item_type: brand.item_type || 'both',
                                sort_order: brand.sort_order || 0,
                                is_active: brand.is_active ?? true,
                              });
                              setAddBrandOpen(true);
                            }}
                          >
                            <FiEdit />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (confirm(`هل أنت متأكد من حذف البراند "${brand.name_ar}"؟`)) {
                                await unifiedBrandsService.deleteBrand(brand.id);
                                await loadData();
                              }
                            }}
                          >
                            <FiTrash2 className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {wasteBrands.length === 0 && (
                      <p className="text-center text-gray-500 py-4">لا توجد براندز مخلفات</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: إضافة قطاع جديد */}
      <Dialog open={addSectorOpen} onOpenChange={setAddSectorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة قطاع جديد</DialogTitle>
            <DialogDescription>
              قم بإضافة قطاع جديد إلى النظام
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sector-name">اسم القطاع *</Label>
              <Input
                id="sector-name"
                value={sectorForm.name}
                onChange={(e) => setSectorForm({ ...sectorForm, name: e.target.value })}
                placeholder="أدخل اسم القطاع"
              />
            </div>
            <div>
              <Label htmlFor="sector-code">كود القطاع *</Label>
              <Input
                id="sector-code"
                value={sectorForm.code}
                onChange={(e) => setSectorForm({ ...sectorForm, code: e.target.value })}
                placeholder="أدخل كود القطاع"
              />
            </div>
            <div>
              <Label htmlFor="sector-color">لون القطاع *</Label>
              <div className="flex gap-2">
                <Input
                  id="sector-color"
                  type="color"
                  value={sectorForm.color}
                  onChange={(e) => setSectorForm({ ...sectorForm, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={sectorForm.color}
                  onChange={(e) => setSectorForm({ ...sectorForm, color: e.target.value })}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sector-description">الوصف</Label>
              <Textarea
                id="sector-description"
                value={sectorForm.description}
                onChange={(e) => setSectorForm({ ...sectorForm, description: e.target.value })}
                placeholder="أدخل الوصف (اختياري)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSectorOpen(false)}>
              <FiX className="mr-2" />
              إلغاء
            </Button>
            <Button onClick={handleAddSector}>
              <FiPlus className="mr-2" />
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: إضافة تصنيف جديد */}
      <Dialog open={addClassificationOpen} onOpenChange={setAddClassificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة تصنيف جديد</DialogTitle>
            <DialogDescription>
              قم بإضافة تصنيف جديد للقطاع المحدد
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="classification-name">اسم التصنيف *</Label>
              <Input
                id="classification-name"
                value={classificationForm.name}
                onChange={(e) => setClassificationForm({ ...classificationForm, name: e.target.value })}
                placeholder="أدخل اسم التصنيف"
              />
            </div>
            <div>
              <Label htmlFor="classification-name-ar">الاسم بالعربية</Label>
              <Input
                id="classification-name-ar"
                value={classificationForm.name_ar}
                onChange={(e) => setClassificationForm({ ...classificationForm, name_ar: e.target.value })}
                placeholder="أدخل الاسم بالعربية"
              />
            </div>
            <div>
              <Label htmlFor="classification-item-type">نوع العنصر *</Label>
              <Select
                value={classificationForm.item_type}
                onValueChange={(value) => setClassificationForm({ ...classificationForm, item_type: value as ItemType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">منتج</SelectItem>
                  <SelectItem value="waste">مخلف</SelectItem>
                  <SelectItem value="both">كليهما</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="classification-description">الوصف</Label>
              <Textarea
                id="classification-description"
                value={classificationForm.description}
                onChange={(e) => setClassificationForm({ ...classificationForm, description: e.target.value })}
                placeholder="أدخل الوصف (اختياري)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddClassificationOpen(false);
              setEditingClassification(null);
              setClassificationForm({ name: '', name_ar: '', description: '', item_type: 'both', sector_id: '' });
            }}>
              <FiX className="mr-2" />
              إلغاء
            </Button>
            <Button onClick={editingClassification ? handleUpdateClassification : handleAddClassification}>
              {editingClassification ? (
                <>
                  <FiEdit className="mr-2" />
                  تحديث
                </>
              ) : (
                <>
                  <FiPlus className="mr-2" />
                  إضافة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: إضافة فئة أساسية جديدة */}
      <Dialog open={addMainCategoryOpen} onOpenChange={setAddMainCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة فئة أساسية جديدة</DialogTitle>
            <DialogDescription>
              قم بإضافة فئة أساسية جديدة للتصنيف المحدد
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="main-category-code">كود الفئة *</Label>
              <Input
                id="main-category-code"
                value={mainCategoryForm.code}
                onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, code: e.target.value })}
                placeholder="أدخل كود الفئة"
              />
            </div>
            <div>
              <Label htmlFor="main-category-name">اسم الفئة *</Label>
              <Input
                id="main-category-name"
                value={mainCategoryForm.name}
                onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, name: e.target.value })}
                placeholder="أدخل اسم الفئة"
              />
            </div>
            <div>
              <Label htmlFor="main-category-name-ar">الاسم بالعربية</Label>
              <Input
                id="main-category-name-ar"
                value={mainCategoryForm.name_ar}
                onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, name_ar: e.target.value })}
                placeholder="أدخل الاسم بالعربية"
              />
            </div>
            <div>
              <Label htmlFor="main-category-item-type">نوع العنصر *</Label>
              <Select
                value={mainCategoryForm.item_type}
                onValueChange={(value) => setMainCategoryForm({ ...mainCategoryForm, item_type: value as ItemType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">منتج</SelectItem>
                  <SelectItem value="waste">مخلف</SelectItem>
                  <SelectItem value="both">كليهما</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="main-category-description">الوصف</Label>
              <Textarea
                id="main-category-description"
                value={mainCategoryForm.description}
                onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, description: e.target.value })}
                placeholder="أدخل الوصف (اختياري)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddMainCategoryOpen(false);
              setEditingMainCategory(null);
              setMainCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', classification_id: '' });
            }}>
              <FiX className="mr-2" />
              إلغاء
            </Button>
            <Button onClick={editingMainCategory ? handleUpdateMainCategory : handleAddMainCategory}>
              {editingMainCategory ? (
                <>
                  <FiEdit className="mr-2" />
                  تحديث
                </>
              ) : (
                <>
                  <FiPlus className="mr-2" />
                  إضافة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: إضافة فئة فرعية جديدة */}
      <Dialog open={addSubCategoryOpen} onOpenChange={setAddSubCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة فئة فرعية جديدة</DialogTitle>
            <DialogDescription>
              قم بإضافة فئة فرعية جديدة للفئة الأساسية المحددة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sub-category-code">كود الفئة *</Label>
              <Input
                id="sub-category-code"
                value={subCategoryForm.code}
                onChange={(e) => setSubCategoryForm({ ...subCategoryForm, code: e.target.value })}
                placeholder="أدخل كود الفئة"
              />
            </div>
            <div>
              <Label htmlFor="sub-category-name">اسم الفئة *</Label>
              <Input
                id="sub-category-name"
                value={subCategoryForm.name}
                onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })}
                placeholder="أدخل اسم الفئة"
              />
            </div>
            <div>
              <Label htmlFor="sub-category-name-ar">الاسم بالعربية</Label>
              <Input
                id="sub-category-name-ar"
                value={subCategoryForm.name_ar}
                onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name_ar: e.target.value })}
                placeholder="أدخل الاسم بالعربية"
              />
            </div>
            <div>
              <Label htmlFor="sub-category-item-type">نوع العنصر *</Label>
              <Select
                value={subCategoryForm.item_type}
                onValueChange={(value) => setSubCategoryForm({ ...subCategoryForm, item_type: value as ItemType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">منتج</SelectItem>
                  <SelectItem value="waste">مخلف</SelectItem>
                  <SelectItem value="both">كليهما</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sub-category-description">الوصف</Label>
              <Textarea
                id="sub-category-description"
                value={subCategoryForm.description}
                onChange={(e) => setSubCategoryForm({ ...subCategoryForm, description: e.target.value })}
                placeholder="أدخل الوصف (اختياري)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddSubCategoryOpen(false);
              setEditingSubCategory(null);
              setSubCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', main_category_id: '' });
            }}>
              <FiX className="mr-2" />
              إلغاء
            </Button>
            <Button onClick={editingSubCategory ? handleUpdateSubCategory : handleAddSubCategory}>
              {editingSubCategory ? (
                <>
                  <FiEdit className="mr-2" />
                  تحديث
                </>
              ) : (
                <>
                  <FiPlus className="mr-2" />
                  إضافة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: ربط الوحدات والبراندز */}
      <Dialog open={unitsBrandsOpen} onOpenChange={setUnitsBrandsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ربط الوحدات والبراندز بالتصنيف</DialogTitle>
            <DialogDescription>
              اختر التصنيف ثم قم بربط الوحدات والبراندز المتاحة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* اختيار التصنيف */}
            {!selectedClassificationForUnitsBrands && (
              <div>
                <Label>اختر التصنيف *</Label>
                <Select
                  value={selectedClassificationForUnitsBrands || ''}
                  onValueChange={(value) => setSelectedClassificationForUnitsBrands(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {classifications.map((classification) => (
                      <SelectItem key={classification.id} value={classification.id}>
                        {classification.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedClassificationForUnitsBrands && (
              <>
                {/* الوحدات */}
                <div>
                  <Label className="text-lg font-semibold mb-3 block">الوحدات المتاحة</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                    {units.map((unit) => (
                      <div key={unit.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`unit-${unit.id}`}
                          checked={selectedUnits.includes(unit.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUnits([...selectedUnits, unit.id]);
                            } else {
                              setSelectedUnits(selectedUnits.filter(id => id !== unit.id));
                            }
                          }}
                        />
                        <Label htmlFor={`unit-${unit.id}`} className="cursor-pointer flex-1">
                          {unit.name} ({unit.code})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* البراندز - مقسمة حسب نوع التصنيف */}
                <div>
                  <Label className="text-lg font-semibold mb-3 block">البراندز المتاحة</Label>
                  {(() => {
                    const selectedClassificationData = classifications.find(c => c.id === selectedClassificationForUnitsBrands);
                    const classificationItemType = selectedClassificationData?.item_type;
                    
                    // تحديد البراندز المناسبة حسب نوع التصنيف
                    let availableBrands: UnifiedBrand[] = [];
                    if (classificationItemType === 'product') {
                      availableBrands = productBrands;
                    } else if (classificationItemType === 'waste') {
                      availableBrands = wasteBrands;
                    } else {
                      // 'both' - عرض جميع البراندز
                      availableBrands = brands;
                    }
                    
                    return (
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3">
                        {availableBrands.length > 0 ? (
                          availableBrands.map((brand) => (
                            <div key={brand.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`brand-${brand.id}`}
                                checked={selectedBrands.includes(brand.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedBrands([...selectedBrands, brand.id]);
                                  } else {
                                    setSelectedBrands(selectedBrands.filter(id => id !== brand.id));
                                  }
                                }}
                              />
                              <div className="flex items-center justify-between flex-1">
                                <Label htmlFor={`brand-${brand.id}`} className="cursor-pointer">
                                  {brand.name_ar} {brand.name_en && `(${brand.name_en})`}
                                </Label>
                                {brand.item_type && (
                                  <div className="ml-2">
                                    {getItemTypeBadge(brand.item_type || 'both')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-gray-500 py-4">
                            لا توجد براندز متاحة لهذا التصنيف
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUnitsBrandsOpen(false);
              setSelectedClassificationForUnitsBrands(null);
              setSelectedUnits([]);
              setSelectedBrands([]);
            }}>
              <FiX className="mr-2" />
              إلغاء
            </Button>
            <Button 
              onClick={handleLinkUnitsBrands}
              disabled={!selectedClassificationForUnitsBrands || (selectedUnits.length === 0 && selectedBrands.length === 0)}
            >
              <FiPlus className="mr-2" />
              ربط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: ربط البراندز بالفئة الأساسية */}
      <Dialog open={mainCategoryBrandsOpen} onOpenChange={setMainCategoryBrandsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ربط البراندز بالفئة الأساسية</DialogTitle>
            <DialogDescription>
              اختر البراندز المراد ربطها بالفئة الأساسية المحددة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedMainCategoryForBrands && (() => {
              const mainCategory = mainCategories.find(m => m.id === selectedMainCategoryForBrands);
              const linkedBrandIds = mainCategory?.available_brands?.map(b => b.id) || [];
              let availableBrands: UnifiedBrand[] = [];
              if (mainCategory?.item_type === 'product') {
                availableBrands = productBrands;
              } else if (mainCategory?.item_type === 'waste') {
                availableBrands = wasteBrands;
              } else {
                availableBrands = brands;
              }
              
              return (
                <>
                  {/* البراندز المرتبطة بالفعل */}
                  {linkedBrandIds.length > 0 && (
                    <div>
                      <Label className="text-lg font-semibold mb-3 block text-green-600">
                        البراندز المرتبطة ({linkedBrandIds.length})
                      </Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3 bg-green-50">
                        {mainCategory?.available_brands?.map((brand) => (
                          <div key={brand.id} className="flex items-center justify-between p-2 bg-white rounded">
                            <div className="flex items-center space-x-2 flex-1">
                              <FiShoppingBag className="text-green-600" />
                              <span className="font-medium">{brand.name_ar} {brand.name_en && `(${brand.name_en})`}</span>
                              {brand.item_type && (
                                <div className="ml-2">
                                  {getItemTypeBadge(brand.item_type || 'both')}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`هل تريد إلغاء ربط البراند "${brand.name_ar}"؟`)) {
                                  await unifiedCategoriesService.unlinkBrandFromMainCategory(selectedMainCategoryForBrands!, brand.id);
                                  if (selectedClassification) {
                                    loadMainCategories(selectedClassification);
                                  }
                                }
                              }}
                            >
                              <FiTrash2 className="text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* البراندز المتاحة للربط */}
                  <div>
                    <Label className="text-lg font-semibold mb-3 block">
                      البراندز المتاحة للربط - {mainCategory?.name}
                    </Label>
                    <div className="space-y-2 max-h-96 overflow-y-auto border rounded p-3">
                      {availableBrands.filter(b => !linkedBrandIds.includes(b.id)).map((brand) => (
                        <div key={brand.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`main-category-brand-${brand.id}`}
                            checked={selectedBrands.includes(brand.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBrands([...selectedBrands, brand.id]);
                              } else {
                                setSelectedBrands(selectedBrands.filter(id => id !== brand.id));
                              }
                            }}
                          />
                          <div className="flex items-center justify-between flex-1">
                            <Label htmlFor={`main-category-brand-${brand.id}`} className="cursor-pointer">
                              {brand.name_ar} {brand.name_en && `(${brand.name_en})`}
                            </Label>
                            {brand.item_type && (
                              <div className="ml-2">
                                {getItemTypeBadge(brand.item_type || 'both')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {availableBrands.filter(b => !linkedBrandIds.includes(b.id)).length === 0 && (
                        <p className="text-center text-gray-500 py-4">لا توجد براندز متاحة للربط</p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setMainCategoryBrandsOpen(false);
              setSelectedMainCategoryForBrands(null);
              setSelectedBrands([]);
            }}>
              <FiX className="mr-2" />
              إلغاء
            </Button>
            <Button 
              onClick={handleLinkMainCategoryBrands}
              disabled={!selectedMainCategoryForBrands || selectedBrands.length === 0}
            >
              <FiPlus className="mr-2" />
              ربط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: ربط البراندز بالفئة الفرعية */}
      <Dialog open={subCategoryBrandsOpen} onOpenChange={setSubCategoryBrandsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ربط البراندز بالفئة الفرعية</DialogTitle>
            <DialogDescription>
              اختر البراندز المراد ربطها بالفئة الفرعية المحددة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedSubCategoryForBrands && (() => {
              const subCategory = subCategories.find(s => s.id === selectedSubCategoryForBrands);
              const linkedBrandIds = subCategory?.available_brands?.map(b => b.id) || [];
              let availableBrands: UnifiedBrand[] = [];
              if (subCategory?.item_type === 'product') {
                availableBrands = productBrands;
              } else if (subCategory?.item_type === 'waste') {
                availableBrands = wasteBrands;
              } else {
                availableBrands = brands;
              }
              
              return (
                <>
                  {/* البراندز المرتبطة بالفعل */}
                  {linkedBrandIds.length > 0 && (
                    <div>
                      <Label className="text-lg font-semibold mb-3 block text-green-600">
                        البراندز المرتبطة ({linkedBrandIds.length})
                      </Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-3 bg-green-50">
                        {subCategory?.available_brands?.map((brand) => (
                          <div key={brand.id} className="flex items-center justify-between p-2 bg-white rounded">
                            <div className="flex items-center space-x-2 flex-1">
                              <FiShoppingBag className="text-green-600" />
                              <span className="font-medium">{brand.name_ar} {brand.name_en && `(${brand.name_en})`}</span>
                              {brand.item_type && (
                                <div className="ml-2">
                                  {getItemTypeBadge(brand.item_type || 'both')}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm(`هل تريد إلغاء ربط البراند "${brand.name_ar}"؟`)) {
                                  await unifiedCategoriesService.unlinkBrandFromSubCategory(selectedSubCategoryForBrands!, brand.id);
                                  if (selectedMainCategory) {
                                    loadSubCategories(selectedMainCategory);
                                  }
                                }
                              }}
                            >
                              <FiTrash2 className="text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* البراندز المتاحة للربط */}
                  <div>
                    <Label className="text-lg font-semibold mb-3 block">
                      البراندز المتاحة للربط - {subCategory?.name}
                    </Label>
                    <div className="space-y-2 max-h-96 overflow-y-auto border rounded p-3">
                      {availableBrands.filter(b => !linkedBrandIds.includes(b.id)).map((brand) => (
                        <div key={brand.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sub-category-brand-${brand.id}`}
                            checked={selectedBrands.includes(brand.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBrands([...selectedBrands, brand.id]);
                              } else {
                                setSelectedBrands(selectedBrands.filter(id => id !== brand.id));
                              }
                            }}
                          />
                          <div className="flex items-center justify-between flex-1">
                            <Label htmlFor={`sub-category-brand-${brand.id}`} className="cursor-pointer">
                              {brand.name_ar} {brand.name_en && `(${brand.name_en})`}
                            </Label>
                            {brand.item_type && (
                              <div className="ml-2">
                                {getItemTypeBadge(brand.item_type || 'both')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {availableBrands.filter(b => !linkedBrandIds.includes(b.id)).length === 0 && (
                        <p className="text-center text-gray-500 py-4">لا توجد براندز متاحة للربط</p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSubCategoryBrandsOpen(false);
              setSelectedSubCategoryForBrands(null);
              setSelectedBrands([]);
            }}>
              <FiX className="mr-2" />
              إلغاء
            </Button>
            <Button 
              onClick={handleLinkSubCategoryBrands}
              disabled={!selectedSubCategoryForBrands || selectedBrands.length === 0}
            >
              <FiPlus className="mr-2" />
              ربط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: إضافة/تعديل وحدة */}
      <Dialog open={addUnitOpen} onOpenChange={(open) => {
        setAddUnitOpen(open);
        if (!open) {
          setEditingUnit(null);
          setUnitForm({ code: '', name: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'تعديل وحدة' : 'إضافة وحدة جديدة'}</DialogTitle>
            <DialogDescription>
              {editingUnit ? 'قم بتعديل بيانات الوحدة' : 'قم بإضافة وحدة جديدة إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="unit-name">اسم الوحدة *</Label>
              <Input
                id="unit-name"
                value={unitForm.name}
                onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                placeholder="أدخل اسم الوحدة (مثل: كيلو، متر، قطعة)"
              />
            </div>
            <div>
              <Label htmlFor="unit-code">كود الوحدة *</Label>
              <Input
                id="unit-code"
                value={unitForm.code}
                onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                placeholder="أدخل كود الوحدة (مثل: KG, M, PC)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddUnitOpen(false);
              setEditingUnit(null);
              setUnitForm({ code: '', name: '' });
            }}>
              <FiX className="mr-2" />
              إلغاء
            </Button>
            <Button 
              onClick={async () => {
                if (!unitForm.name || !unitForm.code) {
                  alert('يرجى إدخال اسم الوحدة وكود الوحدة');
                  return;
                }
                const result = editingUnit 
                  ? await unifiedUnitsService.updateUnit(editingUnit.id, unitForm)
                  : await unifiedUnitsService.addUnit(unitForm);
                if (result) {
                  setAddUnitOpen(false);
                  setEditingUnit(null);
                  setUnitForm({ code: '', name: '' });
                  await loadData();
                }
              }}
            >
              {editingUnit ? (
                <>
                  <FiEdit className="mr-2" />
                  تحديث
                </>
              ) : (
                <>
                  <FiPlus className="mr-2" />
                  إضافة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: إضافة/تعديل براند */}
      <Dialog open={addBrandOpen} onOpenChange={(open) => {
        setAddBrandOpen(open);
        if (!open) {
          setEditingBrand(null);
          setBrandForm({ name_ar: '', name_en: '', description_ar: '', description_en: '', item_type: 'both', sort_order: 0, is_active: true });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'تعديل براند' : 'إضافة براند جديد'}</DialogTitle>
            <DialogDescription>
              {editingBrand ? 'قم بتعديل بيانات البراند' : 'قم بإضافة براند جديد إلى النظام'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="brand-name-ar">الاسم بالعربية *</Label>
              <Input
                id="brand-name-ar"
                value={brandForm.name_ar}
                onChange={(e) => setBrandForm({ ...brandForm, name_ar: e.target.value })}
                placeholder="أدخل اسم البراند بالعربية"
              />
            </div>
            <div>
              <Label htmlFor="brand-name-en">الاسم بالإنجليزية</Label>
              <Input
                id="brand-name-en"
                value={brandForm.name_en}
                onChange={(e) => setBrandForm({ ...brandForm, name_en: e.target.value })}
                placeholder="أدخل اسم البراند بالإنجليزية (اختياري)"
              />
            </div>
            <div>
              <Label htmlFor="brand-item-type">نوع البراند *</Label>
              <Select
                value={brandForm.item_type}
                onValueChange={(value) => setBrandForm({ ...brandForm, item_type: value as ItemType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">منتج</SelectItem>
                  <SelectItem value="waste">مخلف/روبابيكيا/مستعمل</SelectItem>
                  <SelectItem value="both">كليهما</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="brand-description-ar">الوصف بالعربية</Label>
              <Textarea
                id="brand-description-ar"
                value={brandForm.description_ar}
                onChange={(e) => setBrandForm({ ...brandForm, description_ar: e.target.value })}
                placeholder="أدخل وصف البراند بالعربية (اختياري)"
              />
            </div>
            <div>
              <Label htmlFor="brand-description-en">الوصف بالإنجليزية</Label>
              <Textarea
                id="brand-description-en"
                value={brandForm.description_en}
                onChange={(e) => setBrandForm({ ...brandForm, description_en: e.target.value })}
                placeholder="أدخل وصف البراند بالإنجليزية (اختياري)"
              />
            </div>
            <div>
              <Label htmlFor="brand-sort-order">ترتيب العرض</Label>
              <Input
                id="brand-sort-order"
                type="number"
                value={brandForm.sort_order}
                onChange={(e) => setBrandForm({ ...brandForm, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddBrandOpen(false);
              setEditingBrand(null);
              setBrandForm({ name_ar: '', name_en: '', description_ar: '', description_en: '', item_type: 'both', sort_order: 0, is_active: true });
            }}>
              <FiX className="mr-2" />
              إلغاء
            </Button>
            <Button 
              onClick={async () => {
                if (!brandForm.name_ar) {
                  alert('يرجى إدخال اسم البراند بالعربية');
                  return;
                }
                if (!brandForm.item_type) {
                  alert('يرجى اختيار نوع البراند');
                  return;
                }
                const brandData = {
                  name_ar: brandForm.name_ar,
                  name_en: brandForm.name_en || null,
                  description_ar: brandForm.description_ar || null,
                  description_en: brandForm.description_en || null,
                  item_type: brandForm.item_type,
                  sort_order: brandForm.sort_order,
                  is_active: brandForm.is_active,
                };
                const result = editingBrand
                  ? await unifiedBrandsService.updateBrand(editingBrand.id, brandData)
                  : await unifiedBrandsService.addBrand(brandData);
                if (result) {
                  setAddBrandOpen(false);
                  setEditingBrand(null);
                  setBrandForm({ name_ar: '', name_en: '', description_ar: '', description_en: '', item_type: 'both', sort_order: 0, is_active: true });
                  await loadData();
                }
              }}
            >
              {editingBrand ? (
                <>
                  <FiEdit className="mr-2" />
                  تحديث
                </>
              ) : (
                <>
                  <FiPlus className="mr-2" />
                  إضافة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationStructurePage;
