'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ProductCategoriesTabs } from '@/domains/product-categories/pages/ProductCategoriesTabs';
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
  FiMinus,
  FiHelpCircle,
  FiAward,
  FiShoppingCart,
  FiImage
} from 'react-icons/fi';
import { unifiedCategoriesService, UnifiedSector, UnifiedClassification, UnifiedMainCategory, UnifiedSubCategory, ItemType, UnifiedBrand } from '../services/unifiedCategoriesService';
import { unifiedBrandsService } from '../services/unifiedBrandsService';
import { unifiedUnitsService, Unit } from '../services/unifiedUnitsService';
import {
  getStoresWithCategories,
  getStoreByClassificationId,
  createStoreForClassification as createStoreForClassificationApi,
  syncMainCategoryToStore,
  syncSubCategoryToStore,
  getStoreMainCategoryIdByName,
  syncProductToLinkedStores,
  type StoreForOrg,
} from '../services/storeOrgLinkService';
import { categoryService } from '@/domains/product-categories/api/categoryService';
import { productService } from '@/domains/product-categories/services/productService';
import { createProductWithOpeningPrice } from '@/domains/waste-management/services/wasteProductWorkflowService';
import { subcategoryExchangePriceService } from '@/domains/waste-management/services/subcategoryExchangePriceService';
import { storeCatalogProductService, type StoreCatalogProduct } from '@/services/storeCatalogProductService';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { supabase } from '@/lib/supabase';
import { warehouseService } from '../services/warehouseService';
import { toast } from 'react-toastify';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories, fetchCategoryBucketConfigsThunk } from '@/domains/product-categories/store/productCategoriesSlice';
import PointsSettingsPage from '@/domains/financial-management/points/pages/PointsSettingsPage';
import { CategoryBasketConfigDetails } from '@/domains/product-categories/components/CategoryBasketConfigDetails';
import { CategoryBasketConfigForm } from '@/domains/product-categories/components/CategoryBasketConfigForm';
import { GlobalBasketConfigDetails } from '@/domains/product-categories/components/GlobalBasketConfigDetails';

const OrganizationStructurePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: wasteCategories } = useAppSelector(state => state.productCategories.categories);
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
  const treeExpansionAppliedRef = useRef<string | null>(null);

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
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [selectedSubCategoryForProducts, setSelectedSubCategoryForProducts] = useState<UnifiedSubCategory | null>(null);
  const [productsUnderSubcategory, setProductsUnderSubcategory] = useState<any[]>([]);
  const [storeCatalogProductsUnderSubcategory, setStoreCatalogProductsUnderSubcategory] = useState<StoreCatalogProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [addStoreProductDialogOpen, setAddStoreProductDialogOpen] = useState(false);
  const [storeProductForm, setStoreProductForm] = useState({
    name: '',
    name_ar: '',
    description: '',
    sku: '',
    default_selling_price: '',
    cost_price: '',
    profit_margin: '',
    loyalty_points_earned: '0',
    brand_id: '',
    image_url: '',
    is_on_sale: false,
    sale_price: '',
  });
  const [storesForOrg, setStoresForOrg] = useState<StoreForOrg[]>([]);
  const [createStoreForClassification, setCreateStoreForClassification] = useState(false);
  const [storeSlugForNewClassification, setStoreSlugForNewClassification] = useState('');
  const [selectedBasketCategoryId, setSelectedBasketCategoryId] = useState<string | null>(null);
  const [basketConfigFormOpen, setBasketConfigFormOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    nameAr: '',
    description: '',
    openingPrice: '',
    pricePremiumPercentage: '0',
    pricePremiumFixedAmount: '0',
    pricingMode: 'per_kg' as 'per_kg' | 'per_piece',
    weightGrams: '1000',
    image_url: '',
  });
  
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
    classification_id: '',
    image_url: ''
  });
  const [subCategoryForm, setSubCategoryForm] = useState({ 
    name: '', 
    name_ar: '', 
    code: '', 
    description: '', 
    item_type: 'both' as ItemType,
    main_category_id: '',
    image_url: ''
  });
  // أسعار البورصة الأولية للفئات الفرعية (للمخلفات فقط)
  const [subCategoryInitialBuyPrice, setSubCategoryInitialBuyPrice] = useState<number | undefined>(undefined);
  const [subCategoryInitialSellPrice, setSubCategoryInitialSellPrice] = useState<number | undefined>(undefined);
  const [mainCategoryImageFile, setMainCategoryImageFile] = useState<File | null>(null);
  const [mainCategoryImagePreview, setMainCategoryImagePreview] = useState<string | null>(null);
  const [subCategoryImageFile, setSubCategoryImageFile] = useState<File | null>(null);
  const [subCategoryImagePreview, setSubCategoryImagePreview] = useState<string | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [storeProductImageFile, setStoreProductImageFile] = useState<File | null>(null);
  const [storeProductImagePreview, setStoreProductImagePreview] = useState<string | null>(null);
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
    if (activeTab === 'basket') {
      dispatch(fetchCategories());
      dispatch(fetchCategoryBucketConfigsThunk());
    }
  }, [activeTab, dispatch]);

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

  // عند فتح تبويب الفئات الفرعية: إعادة جلب الفئات الفرعية للفئة المختارة (لتجنب عرض قائمة الهرمية المختلطة)
  useEffect(() => {
    if (activeTab === 'sub-categories' && selectedMainCategory) {
      loadSubCategories(selectedMainCategory);
    }
  }, [activeTab]);

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

      // جلب جميع الفئات الأساسية لكل تصنيف (من unified أو من waste حسب نوع التصنيف)
      const allMainCategories: UnifiedMainCategory[] = [];
      for (const classification of allClassifications) {
        if (classification.item_type === 'waste') {
          const { data: wasteMains } = await categoryService.getCategories();
          const mapped = (wasteMains || []).map(cat => ({
            id: cat.id,
            classification_id: classification.id,
            code: cat.code || String(cat.id),
            name: cat.name,
            name_ar: cat.name,
            description: cat.description || undefined,
            item_type: 'waste' as ItemType,
            level: 0,
            path: '',
            sub_categories: [],
            ...((cat as { image_url?: string }).image_url != null && { image_url: (cat as { image_url?: string }).image_url }),
          }));
          allMainCategories.push(...mapped);
        } else {
          const mainCats = await unifiedCategoriesService.getMainCategoriesByClassification(classification.id);
          allMainCategories.push(...mainCats);
        }
      }
      setMainCategories(allMainCategories);

      // جلب جميع الفئات الفرعية (من unified أو من waste)
      const allSubCategories: UnifiedSubCategory[] = [];
      for (const mainCategory of allMainCategories) {
        if (mainCategory.item_type === 'waste') {
          const { data: wasteSubs } = await categoryService.getSubCategories(mainCategory.id);
          const mapped = (wasteSubs || []).map(sub => ({
            id: sub.id,
            main_category_id: mainCategory.id,
            code: sub.code || String(sub.id),
            name: sub.name,
            name_ar: sub.name,
            description: sub.description || undefined,
            item_type: 'waste' as ItemType,
            level: 0,
            path: '',
            ...((sub as { image_url?: string }).image_url != null && { image_url: (sub as { image_url?: string }).image_url }),
          }));
          allSubCategories.push(...mapped);
        } else {
          const subCats = await unifiedCategoriesService.getSubCategoriesByMainCategory(mainCategory.id);
          allSubCategories.push(...subCats);
        }
      }
      setSubCategories(allSubCategories);

      // جلب المتاجر مع الفئات (للعرض في التسلسل الهرمي)
      const storesData = await getStoresWithCategories();
      setStoresForOrg(storesData);
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
      let classification = classifications.find(c => c.id === classificationId);
      if (!classification && classifications.length === 0) {
        const all = await unifiedCategoriesService.getClassifications();
        setClassifications(all);
        classification = all.find(c => c.id === classificationId);
      }
      if (classification?.item_type === 'waste') {
        const { data } = await categoryService.getCategories();
        const mapped: UnifiedMainCategory[] = (data || []).map(cat => ({
          id: cat.id,
          classification_id: classificationId,
          code: cat.code || String(cat.id),
          name: cat.name,
          name_ar: cat.name,
          description: cat.description || undefined,
          item_type: 'waste' as ItemType,
          level: 0,
          path: '',
          sub_categories: [],
          ...((cat as { image_url?: string }).image_url != null && { image_url: (cat as { image_url?: string }).image_url }),
        }));
        setMainCategories(mapped);
      } else {
        const data = await unifiedCategoriesService.getMainCategoriesByClassification(classificationId);
        setMainCategories(data);
      }
    } catch (error) {
      console.error('خطأ في تحميل الفئات الأساسية:', error);
    }
  };

  const loadSubCategories = async (mainCategoryId: string) => {
    try {
      // تحديد مصدر البيانات: waste (integer id من waste_*) يستخدم categoryService، غير ذلك (UUID من unified_*) يستخدم unifiedCategoriesService
      const mainCategory = mainCategories.find((m) => m.id === mainCategoryId || String(m.id) === mainCategoryId);
      const classification = selectedClassification ? classifications.find((c) => c.id === selectedClassification) : null;
      const isWasteMain = (mainCategory?.item_type ?? classification?.item_type) === 'waste';
      if (isWasteMain) {
        const { data } = await categoryService.getSubCategories(mainCategoryId);
        const mapped: UnifiedSubCategory[] = (data || []).map(sub => ({
          id: sub.id,
          main_category_id: mainCategoryId,
          code: sub.code || String(sub.id),
          name: sub.name,
          name_ar: sub.name,
          description: sub.description || undefined,
          item_type: 'waste' as ItemType,
          level: 0,
          path: '',
          ...((sub as { image_url?: string }).image_url != null && { image_url: (sub as { image_url?: string }).image_url }),
        }));
        setSubCategories(mapped);
      } else {
        const data = await unifiedCategoriesService.getSubCategoriesByMainCategory(mainCategoryId);
        setSubCategories(data);
      }
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
      toast.error('يرجى اختيار قطاع');
      return;
    }
    if (!classificationForm.name?.trim()) {
      toast.error('يرجى إدخال اسم التصنيف');
      return;
    }
    const isProduct = classificationForm.item_type === 'product';
    const shouldCreateStore = isProduct || createStoreForClassification;
    if (isProduct && !storeSlugForNewClassification?.trim()) {
      toast.error('يرجى إدخال رابط المتجر (Slug) عند نوع المنتج');
      return;
    }
    if (shouldCreateStore && !isProduct && !storeSlugForNewClassification?.trim()) {
      toast.error('يرجى إدخال رابط المتجر (Slug)');
      return;
    }
    try {
      const result = await unifiedCategoriesService.addClassification({
        sector_id: classificationForm.sector_id,
        name: classificationForm.name.trim(),
        name_ar: classificationForm.name_ar?.trim(),
        description: classificationForm.description?.trim(),
        item_type: classificationForm.item_type,
        is_active: true,
      });
      if (result) {
        const slug = storeSlugForNewClassification.trim() || (classificationForm.name_ar || classificationForm.name).replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '').toLowerCase() || `store-${Date.now()}`;
        if (shouldCreateStore && result.id) {
          await createStoreForClassificationApi({
            classification_id: result.id,
            name_ar: classificationForm.name_ar?.trim() || classificationForm.name.trim(),
            name_en: classificationForm.name.trim(),
            slug: slug,
          });
          setCreateStoreForClassification(false);
          setStoreSlugForNewClassification('');
        }
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
    const classification = classifications.find(c => c.id === mainCategoryForm.classification_id);
    const isWaste = classification?.item_type === 'waste';
    if (!isWaste && !mainCategoryForm.code) {
      alert('يرجى إدخال كود الفئة');
      return;
    }
    if (!mainCategoryForm.name) {
      alert('يرجى إدخال اسم الفئة');
      return;
    }
    try {
      if (isWaste) {
        let imageUrl = mainCategoryForm.image_url || undefined;
        if (mainCategoryImageFile) {
          const { url, error: uploadErr } = await categoryService.uploadImage(mainCategoryImageFile, 'categories');
          if (uploadErr) throw new Error(uploadErr);
          imageUrl = url || undefined;
        }
        const { data, error } = await categoryService.addCategory({
          name: mainCategoryForm.name,
          description: mainCategoryForm.description || undefined,
          image_url: imageUrl,
        });
        if (error) throw new Error(error);
        if (data) {
          toast.success('تم إضافة الفئة الأساسية (مخلف) بنجاح');
          setAddMainCategoryOpen(false);
          setMainCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', classification_id: '', image_url: '' });
          setMainCategoryImageFile(null);
          setMainCategoryImagePreview(null);
          if (activeTab === 'hierarchy') {
            await loadAllHierarchyData();
          } else {
            loadMainCategories(mainCategoryForm.classification_id);
          }
        }
      } else {
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
          const linkedStore = await getStoreByClassificationId(mainCategoryForm.classification_id);
          if (linkedStore) {
            await syncMainCategoryToStore({
              shop_id: linkedStore.id,
              name_ar: mainCategoryForm.name_ar || mainCategoryForm.name,
              name_en: mainCategoryForm.name,
            });
          }
          setAddMainCategoryOpen(false);
          setMainCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', classification_id: '', image_url: '' });
          setMainCategoryImageFile(null);
          setMainCategoryImagePreview(null);
          if (activeTab === 'hierarchy') {
            await loadAllHierarchyData();
          } else {
            loadMainCategories(mainCategoryForm.classification_id);
          }
        }
      }
    } catch (error) {
      console.error('خطأ في إضافة الفئة الأساسية:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في إضافة الفئة الأساسية');
    }
  };

  const handleAddSubCategory = async () => {
    if (!subCategoryForm.main_category_id) {
      alert('يرجى اختيار فئة أساسية');
      return;
    }
    // Use main category source: waste main categories have integer ids, unified have UUIDs
    const mainCat = mainCategories.find(
      (m) => String(m.id) === String(subCategoryForm.main_category_id)
    );
    const isWasteMain =
      mainCat?.item_type === 'waste' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        String(subCategoryForm.main_category_id)
      );
    const isWaste = isWasteMain;
    if (!isWaste && !subCategoryForm.code) {
      alert('يرجى إدخال كود الفئة');
      return;
    }
    if (!subCategoryForm.name) {
      alert('يرجى إدخال اسم الفئة');
      return;
    }
    try {
      if (isWaste) {
        let imageUrl = subCategoryForm.image_url || undefined;
        if (subCategoryImageFile) {
          const { url, error: uploadErr } = await categoryService.uploadImage(subCategoryImageFile, 'subcategories');
          if (uploadErr) throw new Error(uploadErr);
          imageUrl = url || undefined;
        }
        const hasInitialPrice =
          typeof subCategoryInitialBuyPrice === 'number' && subCategoryInitialBuyPrice > 0;

        const subPayload = {
          name: subCategoryForm.name,
          description: subCategoryForm.description || undefined,
          category_id: subCategoryForm.main_category_id,
          image_url: imageUrl,
        };

        const { data, error } = hasInitialPrice
          ? await categoryService.createSubCategoryWithInitialExchangePrice(
              subPayload,
              subCategoryInitialBuyPrice!,
              subCategoryInitialSellPrice,
              undefined,
            )
          : await categoryService.addSubCategory(subPayload);

        if (error) throw new Error(error);
        if (data) {
          toast.success(
            hasInitialPrice
              ? 'تم إضافة الفئة الفرعية (مخلف) مع سعر البورصة الأولي بنجاح'
              : 'تم إضافة الفئة الفرعية (مخلف) بنجاح'
          );
          setAddSubCategoryOpen(false);
          setSubCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', main_category_id: '', image_url: '' });
          setSubCategoryInitialBuyPrice(undefined);
          setSubCategoryInitialSellPrice(undefined);
          setSubCategoryImageFile(null);
          setSubCategoryImagePreview(null);
          if (activeTab === 'hierarchy') {
            await loadAllHierarchyData();
          } else {
            loadSubCategories(subCategoryForm.main_category_id);
          }
        }
      } else {
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
          const mainCat = mainCategories.find((m) => m.id === subCategoryForm.main_category_id);
          if (mainCat) {
            const linkedStore = await getStoreByClassificationId(mainCat.classification_id);
            if (linkedStore) {
              const storeMainId = await getStoreMainCategoryIdByName(
                linkedStore.id,
                mainCat.name_ar || mainCat.name
              );
              if (storeMainId) {
                await syncSubCategoryToStore({
                  main_category_id: storeMainId,
                  name_ar: subCategoryForm.name_ar || subCategoryForm.name,
                  name_en: subCategoryForm.name,
                });
              }
            }
          }
          setAddSubCategoryOpen(false);
          setSubCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', main_category_id: '', image_url: '' });
          setSubCategoryImageFile(null);
          setSubCategoryImagePreview(null);
          if (activeTab === 'hierarchy') {
            await loadAllHierarchyData();
          } else {
            loadSubCategories(subCategoryForm.main_category_id);
          }
        }
      }
    } catch (error) {
      console.error('خطأ في إضافة الفئة الفرعية:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في إضافة الفئة الفرعية');
    }
  };

  const loadProductsForSubcategory = async () => {
    if (!selectedSubCategoryForProducts) return;
    setLoadingProducts(true);
    try {
      if (selectedSubCategoryForProducts.item_type === 'waste') {
        const list = await productService.getProductsBySubcategory(String(selectedSubCategoryForProducts.id));
        setProductsUnderSubcategory(Array.isArray(list) ? list : []);
        setStoreCatalogProductsUnderSubcategory([]);
      } else if (selectedSubCategoryForProducts.item_type === 'product' || selectedSubCategoryForProducts.item_type === 'both') {
        const list = await storeCatalogProductService.getBySubCategoryId(selectedSubCategoryForProducts.id);
        setStoreCatalogProductsUnderSubcategory(list);
        setProductsUnderSubcategory([]);
      } else {
        setProductsUnderSubcategory([]);
        setStoreCatalogProductsUnderSubcategory([]);
      }
    } catch (e) {
      console.error('خطأ في جلب المنتجات:', e);
      setProductsUnderSubcategory([]);
      setStoreCatalogProductsUnderSubcategory([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (productsDialogOpen && selectedSubCategoryForProducts) {
      loadProductsForSubcategory();
    }
  }, [productsDialogOpen, selectedSubCategoryForProducts?.id]);

  const handleOpenProductsDialog = (subCategory: UnifiedSubCategory) => {
    setSelectedSubCategoryForProducts(subCategory);
    setProductsDialogOpen(true);
  };

  const handleAddStoreProductSubmit = async () => {
    if (!selectedSubCategoryForProducts || !selectedSubCategoryForProducts.id) return;
    const subId = selectedSubCategoryForProducts.id;
    if (!storeProductForm.name.trim()) {
      toast.error('اسم المنتج مطلوب');
      return;
    }
    if (!storeProductForm.sku.trim()) {
      toast.error('رمز SKU مطلوب');
      return;
    }
    const sellingPrice = storeProductForm.default_selling_price ? parseFloat(storeProductForm.default_selling_price) : undefined;
    const costPrice = storeProductForm.cost_price ? parseFloat(storeProductForm.cost_price) : undefined;
    const profitMargin = storeProductForm.profit_margin ? parseFloat(storeProductForm.profit_margin) : undefined;
    const points = storeProductForm.loyalty_points_earned ? parseInt(storeProductForm.loyalty_points_earned, 10) : 0;
    let imageUrl: string | undefined = storeProductForm.image_url || undefined;
    if (storeProductImageFile) {
      try {
        const url = await productService.uploadProductImage(storeProductImageFile);
        imageUrl = url;
      } catch (uploadError) {
        console.error('خطأ في رفع صورة المنتج:', uploadError);
        toast.error('فشل في رفع صورة المنتج');
        // يمكن المتابعة بدون صورة أو التوقف؛ سنقوم بالمتابعة هنا
      }
    }

    const salePrice = storeProductForm.sale_price ? parseFloat(storeProductForm.sale_price) : undefined;
    
    const created = await storeCatalogProductService.create({
      unified_sub_category_id: subId,
      name: storeProductForm.name.trim(),
      name_ar: storeProductForm.name_ar.trim() || null,
      description: storeProductForm.description.trim() || null,
      sku: storeProductForm.sku.trim(),
      default_selling_price: sellingPrice ?? null,
      cost_price: costPrice ?? null,
      profit_margin: profitMargin ?? null,
      loyalty_points_earned: points,
      brand_id: storeProductForm.brand_id || null,
      image_url: imageUrl || null,
      is_on_sale: storeProductForm.is_on_sale,
      sale_price: salePrice ?? null,
    });
    if (created) {
      // مزامنة المنتج مع المتاجر المرتبطة بالتصنيف
      await syncProductToLinkedStores(created);
      
      setAddStoreProductDialogOpen(false);
      setStoreProductForm({ name: '', name_ar: '', description: '', sku: '', default_selling_price: '', cost_price: '', profit_margin: '', loyalty_points_earned: '0', brand_id: '', image_url: '', is_on_sale: false, sale_price: '' });
      setStoreProductImageFile(null);
      setStoreProductImagePreview(null);
      loadProductsForSubcategory();
    }
  };

  const handleSyncAllProducts = async () => {
    if (!storeCatalogProductsUnderSubcategory.length) return;
    toast.info('جاري مزامنة المنتجات مع المتاجر...');
    let successCount = 0;
    for (const prod of storeCatalogProductsUnderSubcategory) {
      try {
        await syncProductToLinkedStores(prod);
        successCount++;
      } catch (err) {
        console.error('Error syncing product:', prod.id, err);
      }
    }
    toast.success(`تمت مزامنة ${successCount} منتج بنجاح`);
    loadProductsForSubcategory();
  };

  const handleAddProductSubmit = async () => {
    if (!selectedSubCategoryForProducts || selectedSubCategoryForProducts.item_type !== 'waste') return;
    const openingPrice = parseFloat(productForm.openingPrice);
    if (isNaN(openingPrice) || openingPrice < 0) {
      toast.error('أدخل سعراً افتتاحياً صحيحاً');
      return;
    }
    const wasteSubcategoryId = Number(selectedSubCategoryForProducts.id);
    if (isNaN(wasteSubcategoryId)) {
      toast.error('معرف الفئة الفرعية غير صالح');
      return;
    }
    try {
      let imageUrl: string | undefined = productForm.image_url || undefined;
      if (productImageFile) {
        const url = await productService.uploadProductImage(productImageFile);
        imageUrl = url;
      }
      const result = await createProductWithOpeningPrice({
        wasteSubcategoryId,
        name: productForm.name,
        nameAr: productForm.nameAr || undefined,
        description: productForm.description || undefined,
        openingPrice,
        pricePremiumPercentage: parseFloat(productForm.pricePremiumPercentage) || 0,
        pricePremiumFixedAmount: parseFloat(productForm.pricePremiumFixedAmount) || 0,
        pricingMode: productForm.pricingMode,
        weightGrams: productForm.pricingMode === 'per_piece' ? parseInt(productForm.weightGrams, 10) || 1000 : 1000,
        imageUrl,
      });
      if (result.success) {
        setAddProductDialogOpen(false);
        setProductForm({ name: '', nameAr: '', description: '', openingPrice: '', pricePremiumPercentage: '0', pricePremiumFixedAmount: '0', pricingMode: 'per_kg', weightGrams: '1000', image_url: '' });
        setProductImageFile(null);
        setProductImagePreview(null);
        loadProductsForSubcategory();
      }
    } catch (e) {
      console.error('خطأ في إضافة المنتج:', e);
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
      const isWaste = editingMainCategory.item_type === 'waste';
      if (isWaste) {
        let imageUrl: string | undefined = mainCategoryForm.image_url || undefined;
        if (mainCategoryImageFile) {
          const { url, error: uploadErr } = await categoryService.uploadImage(mainCategoryImageFile, 'categories');
          if (uploadErr) throw new Error(uploadErr);
          imageUrl = url || undefined;
        }
        const { data, error } = await categoryService.updateCategory(editingMainCategory.id, {
          name: mainCategoryForm.name,
          description: mainCategoryForm.description || undefined,
          image_url: imageUrl,
        });
        if (error) throw new Error(error);
        if (data) {
          toast.success('تم تحديث الفئة الأساسية (مخلف) بنجاح');
          setEditingMainCategory(null);
          setMainCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', classification_id: '', image_url: '' });
          setMainCategoryImageFile(null);
          setMainCategoryImagePreview(null);
          if (activeTab === 'hierarchy') {
            await loadAllHierarchyData();
          } else if (selectedClassification) {
            loadMainCategories(selectedClassification);
          }
        }
      } else {
        const result = await unifiedCategoriesService.updateMainCategory(editingMainCategory.id, {
          name: mainCategoryForm.name,
          name_ar: mainCategoryForm.name_ar,
          code: mainCategoryForm.code,
          description: mainCategoryForm.description,
          item_type: mainCategoryForm.item_type,
        });
        if (result) {
          setEditingMainCategory(null);
          setMainCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', classification_id: '', image_url: '' });
          setMainCategoryImageFile(null);
          setMainCategoryImagePreview(null);
          if (activeTab === 'hierarchy') {
            await loadAllHierarchyData();
          } else if (selectedClassification) {
            loadMainCategories(selectedClassification);
          }
        }
      }
    } catch (error) {
      console.error('خطأ في تحديث الفئة الأساسية:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في تحديث الفئة الأساسية');
    }
  };

  const handleUpdateSubCategory = async () => {
    if (!editingSubCategory) return;
    try {
      const isWaste = editingSubCategory.item_type === 'waste';
      if (isWaste) {
        let imageUrl: string | undefined = subCategoryForm.image_url || undefined;
        if (subCategoryImageFile) {
          const { url, error: uploadErr } = await categoryService.uploadImage(subCategoryImageFile, 'subcategories');
          if (uploadErr) throw new Error(uploadErr);
          imageUrl = url || undefined;
        }
        const { data, error } = await categoryService.updateSubCategory(editingSubCategory.id, {
          name: subCategoryForm.name,
          description: subCategoryForm.description || undefined,
          image_url: imageUrl,
        });
        if (error) throw new Error(error);
        if (data) {
          // تحديث سعر البورصة إذا تم إدخاله
          if (subCategoryInitialBuyPrice) {
            const userId = await getCurrentUserId();
            await subcategoryExchangePriceService.setSubcategoryExchangePrice(
              Number(editingSubCategory.id),
              subCategoryInitialBuyPrice,
              subCategoryInitialSellPrice,
              userId
            );
          }
          toast.success('تم تحديث الفئة الفرعية (مخلف) بنجاح');
          setEditingSubCategory(null);
          setSubCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', main_category_id: '', image_url: '' });
          setSubCategoryInitialBuyPrice(undefined);
          setSubCategoryInitialSellPrice(undefined);
          setSubCategoryImageFile(null);
          setSubCategoryImagePreview(null);
          if (activeTab === 'hierarchy') {
            await loadAllHierarchyData();
          } else if (selectedMainCategory) {
            loadSubCategories(selectedMainCategory);
          }
        }
      } else {
        const result = await unifiedCategoriesService.updateSubCategory(editingSubCategory.id, {
          name: subCategoryForm.name,
          name_ar: subCategoryForm.name_ar,
          code: subCategoryForm.code,
          description: subCategoryForm.description,
          item_type: subCategoryForm.item_type,
        });
        if (result) {
          // تحديث سعر البورصة إذا كان متاحاً (خاصة للنوع both الذي لم يتم التعامل معه فوق)
          if (editingSubCategory.item_type === 'both' && subCategoryInitialBuyPrice) {
             const userId = await getCurrentUserId();
             await subcategoryExchangePriceService.setSubcategoryExchangePrice(
               Number(editingSubCategory.id),
               subCategoryInitialBuyPrice,
               subCategoryInitialSellPrice,
               userId
             );
          }
          setEditingSubCategory(null);
          setSubCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', main_category_id: '', image_url: '' });
          setSubCategoryImageFile(null);
          setSubCategoryImagePreview(null);
          if (activeTab === 'hierarchy') {
            await loadAllHierarchyData();
          } else if (selectedMainCategory) {
            loadSubCategories(selectedMainCategory);
          }
        }
      }
    } catch (error) {
      console.error('خطأ في تحديث الفئة الفرعية:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في تحديث الفئة الفرعية');
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
      const mainCat = mainCategories.find(m => String(m.id) === String(id));
      const isWaste = mainCat?.item_type === 'waste';
      const result = isWaste
        ? await categoryService.deleteCategory(id)
        : { success: await unifiedCategoriesService.deleteMainCategory(id), error: null as string | null };
      const success = result.success;
      if (success) {
        if (isWaste) toast.success('تم حذف الفئة الأساسية (مخلف) بنجاح');
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        } else if (selectedClassification) {
          await loadMainCategories(selectedClassification);
        }
        setMainCategories(prev => prev.filter(m => m.id !== id));
        setSubCategories(prev => prev.filter(s => s.main_category_id !== id));
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message) : 'خطأ غير معروف');
      console.error('خطأ في حذف الفئة الأساسية:', error);
      toast.error(`خطأ في حذف الفئة الأساسية: ${msg || 'خطأ غير معروف'}`);
    }
  };

  const handleDeleteSubCategory = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الفئة الفرعية "${name}"؟`)) return;
    try {
      const subCat = subCategories.find(s => String(s.id) === String(id));
      const isWaste = subCat?.item_type === 'waste';
      const result = isWaste
        ? await categoryService.deleteSubCategory(id)
        : { success: await unifiedCategoriesService.deleteSubCategory(id), error: null as string | null };
      const success = result.success;
      if (success) {
        if (isWaste) toast.success('تم حذف الفئة الفرعية (مخلف) بنجاح');
        if (activeTab === 'hierarchy') {
          await loadAllHierarchyData();
        } else if (selectedMainCategory) {
          await loadSubCategories(selectedMainCategory);
        }
        setSubCategories(prev => prev.filter(s => s.id !== id));
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message) : 'خطأ غير معروف');
      console.error('خطأ في حذف الفئة الفرعية:', error);
      toast.error(`خطأ في حذف الفئة الفرعية: ${msg || 'خطأ غير معروف'}`);
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

  // فتح الشجرة افتراضياً عند تحميل البيانات (مرة واحدة لكل نسخة بيانات لتجنب حلقة التحديث)
  useEffect(() => {
    if (!loading && sectors.length > 0 && treeExpanded) {
      const signature = `${sectors.length}-${classifications.length}-${mainCategories.length}-${subCategories.length}`;
      if (treeExpansionAppliedRef.current === signature) return;
      treeExpansionAppliedRef.current = signature;
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
        <TabsList className="grid w-full grid-cols-9">
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
          <TabsTrigger value="product-categories">
            <FiLayers className="mr-2" />
            إدارة الفئات والمنتجات
          </TabsTrigger>
          <TabsTrigger value="units-brands">
            <FiPackage className="mr-2" />
            الوحدات والبراندز
          </TabsTrigger>
          <TabsTrigger value="points">
            <FiAward className="mr-2" />
            النقاط والمكافآت
          </TabsTrigger>
          <TabsTrigger value="basket">
            <FiShoppingCart className="mr-2" />
            إعدادات السلة
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
                    عرض الهيكل الكامل: قطاع → تصنيف (منتج = متجر) → فئة أساسية → فئة فرعية → منتج. التصميم الأولي للمنتجات وتسعيرها من هنا يُزامن مع كتالوج المخازن.
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
                                          setMainCategoryForm({ ...mainCategoryForm, classification_id: classification.id, image_url: '' });
                                          setMainCategoryImageFile(null);
                                          setMainCategoryImagePreview(null);
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
                                      {classificationMainCategories.map((mainCategory, mainIdx) => {
                                        const mainCategorySubCategories = subCategories.filter(s => s.main_category_id === mainCategory.id);
                                        const isMainCategoryExpanded = expandedItems.has(mainCategory.id);
                                        
                                        return (
                                          <div key={`h-main-${classification.id}-${mainCategory.id}-${mainIdx}`} className="border-l-2 border-blue-200 pl-4">
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
                                                    setSubCategoryForm({ ...subCategoryForm, main_category_id: mainCategory.id, image_url: '' });
                                                    setSubCategoryImageFile(null);
                                                    setSubCategoryImagePreview(null);
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
                                                    const mcImg = (mainCategory as { image_url?: string }).image_url;
                                                    setMainCategoryForm({
                                                      name: mainCategory.name,
                                                      name_ar: mainCategory.name_ar || '',
                                                      code: mainCategory.code,
                                                      description: mainCategory.description || '',
                                                      item_type: mainCategory.item_type,
                                                      classification_id: mainCategory.classification_id,
                                                      image_url: mcImg || '',
                                                    });
                                                    setMainCategoryImageFile(null);
                                                    setMainCategoryImagePreview(mcImg || null);
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
                                                {mainCategorySubCategories.map((subCategory, subIdx) => {
                                                  const isSubCategoryExpanded = expandedItems.has(subCategory.id);
                                                  
                                                  return (
                                                    <div key={`h-sub-${classification.id}-${mainCategory.id}-${subCategory.id}-${subIdx}`} className="border-l-2 border-purple-200 pl-4">
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
                                                              const scImg = (subCategory as { image_url?: string }).image_url;
                                                              setSubCategoryForm({
                                                                name: subCategory.name,
                                                                name_ar: subCategory.name_ar || '',
                                                                code: subCategory.code,
                                                                description: subCategory.description || '',
                                                                item_type: subCategory.item_type,
                                                                main_category_id: subCategory.main_category_id,
                                                                image_url: scImg || '',
                                                              });
                                                              setSubCategoryImageFile(null);
                                                              setSubCategoryImagePreview(scImg || null);
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

                {/* قسم المتاجر: عرض المتاجر وفئاتها في التسلسل الهرمي */}
                {storesForOrg.length > 0 && (
                  <div className="mt-6 pt-4 border-t space-y-2">
                    <h3 className="font-semibold text-base flex items-center gap-2 mb-3">
                      <FiShoppingBag className="w-4 h-4 text-amber-600" />
                      المتاجر
                    </h3>
                    {storesForOrg.map((store) => {
                      const isStoreExpanded = expandedItems.has(`store-${store.id}`);
                      const mainCats = store.store_main_categories || [];
                      return (
                        <div key={store.id} className="border rounded-lg p-3 bg-amber-50/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <button
                                onClick={() => toggleExpanded(`store-${store.id}`)}
                                className="flex items-center justify-center w-6 h-6 rounded hover:bg-amber-100"
                              >
                                {isStoreExpanded ? (
                                  <FiChevronDown className="w-4 h-4 text-amber-700" />
                                ) : (
                                  <FiChevronRight className="w-4 h-4 text-amber-700" />
                                )}
                              </button>
                              <FiShoppingBag className="w-4 h-4 text-amber-600" />
                              <h4 className="font-medium">{store.name_ar}</h4>
                              <Badge variant="outline" className="bg-amber-100 text-amber-800">متجر</Badge>
                              {store.unified_classification_id && (
                                <Badge variant="outline" className="text-xs">مرتبط بتصنيف</Badge>
                              )}
                            </div>
                            <Link href={`/store-management/stores/${store.id}`} target="_blank" rel="noopener">
                              <Button size="sm" variant="outline">إدارة المتجر</Button>
                            </Link>
                          </div>
                          {isStoreExpanded && mainCats.length > 0 && (
                            <div className="mt-3 ml-8 space-y-2">
                              {mainCats.map((main) => (
                                <div key={main.id} className="border-l-2 border-amber-200 pl-4">
                                  <div className="font-medium text-sm text-amber-900">{main.name_ar}</div>
                                  {(main.store_subcategories || []).length > 0 && (
                                    <div className="mt-1 ml-2 text-xs text-amber-800 space-y-0.5">
                                      {(main.store_subcategories || []).map((sub) => (
                                        <div key={sub.id}>• {sub.name_ar}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {isStoreExpanded && mainCats.length === 0 && (
                            <div className="mt-3 ml-8 text-sm text-gray-500">لا توجد فئات في هذا المتجر</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                      {classifications.find(c => c.id === selectedClassification)?.item_type === 'product' && (
                        <span className="block mt-1 text-amber-700">تُضاف هنا وتُزامن تلقائياً مع المتجر ومع كتالوج المخازن.</span>
                      )}
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setMainCategoryForm({ ...mainCategoryForm, classification_id: selectedClassification, image_url: '' });
                    setMainCategoryImageFile(null);
                    setMainCategoryImagePreview(null);
                    setAddMainCategoryOpen(true);
                  }}>
                    <FiPlus className="mr-2" />
                    إضافة فئة أساسية
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mainCategories
                    .filter((m) => m.classification_id === selectedClassification)
                    .map((mainCategory, mainIdx) => (
                    <Card
                      key={`main-${mainIdx}-${mainCategory.classification_id}-${mainCategory.id}`}
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
                              const mcImg = (mainCategory as { image_url?: string }).image_url;
                              setMainCategoryForm({
                                name: mainCategory.name,
                                name_ar: mainCategory.name_ar || '',
                                code: mainCategory.code,
                                description: mainCategory.description || '',
                                item_type: mainCategory.item_type,
                                classification_id: mainCategory.classification_id,
                                image_url: mcImg || '',
                              });
                              setMainCategoryImageFile(null);
                              setMainCategoryImagePreview(mcImg || null);
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
                    setSubCategoryForm({ ...subCategoryForm, main_category_id: selectedMainCategory, image_url: '' });
                    setSubCategoryImageFile(null);
                    setSubCategoryImagePreview(null);
                    setAddSubCategoryOpen(true);
                  }}>
                    <FiPlus className="mr-2" />
                    إضافة فئة فرعية
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subCategories
                    .filter((sc) => String(sc.main_category_id) === String(selectedMainCategory))
                    .map((subCategory, subIdx) => (
                    <Card key={`sub-${subIdx}-${subCategory.main_category_id}-${subCategory.id}`} className="transition-all hover:shadow-lg">
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
                              const scImg = (subCategory as { image_url?: string }).image_url;
                              setSubCategoryForm({
                                name: subCategory.name,
                                name_ar: subCategory.name_ar || '',
                                code: subCategory.code,
                                description: subCategory.description || '',
                                item_type: subCategory.item_type,
                                main_category_id: subCategory.main_category_id,
                                image_url: scImg || '',
                              });
                              setSubCategoryImageFile(null);
                              setSubCategoryImagePreview(scImg || null);
                              
                              // جلب أسعار البورصة الحالية (للفئات من نوع مخلفات)
                              if (subCategory.item_type === 'waste') {
                                subcategoryExchangePriceService.getSubcategoryExchangePrice(Number(subCategory.id))
                                  .then(price => {
                                    if (price) {
                                      setSubCategoryInitialBuyPrice(price.buy_price);
                                      setSubCategoryInitialSellPrice(price.sell_price || undefined);
                                    } else {
                                      setSubCategoryInitialBuyPrice(undefined);
                                      setSubCategoryInitialSellPrice(undefined);
                                    }
                                  });
                              }

                              setAddSubCategoryOpen(true);
                            }}
                          >
                            <FiEdit className="mr-1" />
                            تعديل
                          </Button>
                          {(subCategory.item_type === 'waste' || subCategory.item_type === 'product' || subCategory.item_type === 'both') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProductsDialog(subCategory);
                              }}
                            >
                              <FiPackage className="mr-1" />
                              {subCategory.item_type === 'waste' ? 'المنتجات (مخلفات)' : 'المنتجات (متجر)'}
                            </Button>
                          )}
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

        {/* تبويب إدارة الفئات والمنتجات (عرض نفس الشاشة) */}
        <TabsContent value="product-categories" className="space-y-4">
          <ProductCategoriesTabs />
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

        {/* تبويب النقاط والمكافآت */}
        <TabsContent value="points" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiAward className="mr-2" />
                النقاط والمكافآت للمخلفات
              </CardTitle>
              <CardDescription>
                إعدادات النقاط لكل كيلو/قطعة، قيمة النقطة، نطاق الوزن، والمكافآت حسب الفئة الفرعية والمنتج
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PointsSettingsPage />
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب إعدادات السلة (الباسكت) */}
        <TabsContent value="basket" className="space-y-4">
          {/* إعداد سلة لكل الفئات الرئيسية (تكوين عام) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FiShoppingCart className="mr-2" />
                إعداد سلة لكل الفئات الرئيسية
              </CardTitle>
              <CardDescription>
                إعداد سلة واحد يطبق على كل الفئات. للعميل بشكل أساسي، أو لوكيل معيّن (يجب اختيار اسم الوكيل عند نوع المورد: وكيل معتمد).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GlobalBasketConfigDetails />
            </CardContent>
          </Card>

          {/* إعداد سلة للفئة الرئيسية (حسب الفئة) */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center">
                    <FiShoppingCart className="mr-2" />
                    إعداد سلة للفئة الرئيسية
                  </CardTitle>
                  <CardDescription>
                    إعدادات السلة حسب الفئة الرئيسية ونوع المورّد (عميل/وكيل/آخرون) وحجم السلة
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    dispatch(fetchCategories());
                    dispatch(fetchCategoryBucketConfigsThunk());
                  }}
                >
                  <FiRefreshCw className="mr-2" />
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Label>الفئة الرئيسية:</Label>
                <Select
                  value={selectedBasketCategoryId ?? ''}
                  onValueChange={(v) => {
                    setSelectedBasketCategoryId(v || null);
                    dispatch(fetchCategoryBucketConfigsThunk());
                  }}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="اختر الفئة الرئيسية" />
                  </SelectTrigger>
                  <SelectContent>
                    {wasteCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBasketCategoryId && (
                  <Button onClick={() => setBasketConfigFormOpen(true)}>
                    <FiPlus className="mr-2" />
                    إضافة إعداد سلة
                  </Button>
                )}
              </div>
              {selectedBasketCategoryId ? (
                <CategoryBasketConfigDetails categoryId={selectedBasketCategoryId} />
              ) : (
                <p className="text-muted-foreground text-sm">اختر فئة رئيسية لعرض أو إدارة إعدادات السلة.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: إعداد سلة لفئة رئيسية */}
      <Dialog open={basketConfigFormOpen} onOpenChange={setBasketConfigFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إضافة إعداد سلة للفئة الرئيسية</DialogTitle>
            <DialogDescription>
              تحديد نوع المورّد وحجم السلة والوزن والحجم
            </DialogDescription>
          </DialogHeader>
          {selectedBasketCategoryId && (
            <CategoryBasketConfigForm
              categoryId={selectedBasketCategoryId}
              onClose={() => {
                setBasketConfigFormOpen(false);
                dispatch(fetchCategoryBucketConfigsThunk());
              }}
            />
          )}
        </DialogContent>
      </Dialog>

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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إضافة تصنيف جديد</DialogTitle>
            <DialogDescription>
              {classificationForm.item_type === 'product' ? (
                <span>
                  اختر <strong>منتج</strong> لإنشاء متجر جديد داخل القطاع. اسم التصنيف = اسم المتجر. ثم أضف الفئات الأساسية والفرعية بالتتابع (كما في إدارة المخلفات)، ثم المنتجات وتسعيرها. يتم التصميم الأولي للمنتج والمزامنة تلقائياً مع كتالوج المنتجات في كتالوج المخازن.
                </span>
              ) : (
                'قم بإضافة تصنيف جديد للقطاع المحدد'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                  <SelectItem value="product">منتج (المتجر الجديد داخل القطاع)</SelectItem>
                  <SelectItem value="waste">مخلف</SelectItem>
                  <SelectItem value="both">كليهما</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="classification-name">
                {classificationForm.item_type === 'product' ? 'اسم التصنيف = اسم المتجر *' : 'اسم التصنيف *'}
              </Label>
              <Input
                id="classification-name"
                value={classificationForm.name}
                onChange={(e) => setClassificationForm({ ...classificationForm, name: e.target.value })}
                placeholder={classificationForm.item_type === 'product' ? 'مثال: متجر المنظفات والكوزماتكس' : 'أدخل اسم التصنيف'}
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
            {classificationForm.item_type === 'product' && !editingClassification && (
              <div>
                <Label htmlFor="store-slug">رابط المتجر (Slug) *</Label>
                <Input
                  id="store-slug"
                  value={storeSlugForNewClassification}
                  onChange={(e) => setStoreSlugForNewClassification(e.target.value)}
                  placeholder="مثال: detergents-cosmetics"
                />
                <p className="text-xs text-muted-foreground mt-1">يُستخدم في عنوان المتجر (بدون مسافات)</p>
              </div>
            )}
            <div>
              <Label htmlFor="classification-description">الوصف</Label>
              <Textarea
                id="classification-description"
                value={classificationForm.description}
                onChange={(e) => setClassificationForm({ ...classificationForm, description: e.target.value })}
                placeholder="أدخل الوصف (اختياري)"
              />
            </div>
            {!editingClassification && classificationForm.item_type === 'both' && (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create-store-for-classification"
                    checked={createStoreForClassification}
                    onCheckedChange={(checked) => setCreateStoreForClassification(!!checked)}
                  />
                  <Label htmlFor="create-store-for-classification" className="cursor-pointer">
                    إنشاء متجر لهذا التصنيف (الفئات المضافة من إدارة التسلسل ستظهر داخل المتجر تلقائياً)
                  </Label>
                </div>
                {createStoreForClassification && (
                  <div>
                    <Label htmlFor="store-slug-both">رابط المتجر (Slug) *</Label>
                    <Input
                      id="store-slug-both"
                      value={storeSlugForNewClassification}
                      onChange={(e) => setStoreSlugForNewClassification(e.target.value)}
                      placeholder="مثال: detergents-cosmetics"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddClassificationOpen(false);
              setEditingClassification(null);
              setClassificationForm({ name: '', name_ar: '', description: '', item_type: 'both', sector_id: '' });
              setCreateStoreForClassification(false);
              setStoreSlugForNewClassification('');
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
              <div className="flex gap-2">
                <Input
                  id="main-category-code"
                  value={mainCategoryForm.code}
                  onChange={(e) => setMainCategoryForm({ ...mainCategoryForm, code: e.target.value })}
                  placeholder="أدخل كود الفئة"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="توليد كود فريد"
                  onClick={async () => {
                    const code = await unifiedCategoriesService.getNextMainCategoryCode();
                    setMainCategoryForm((prev) => ({ ...prev, code }));
                    toast.success('تم توليد كود فريد');
                  }}
                >
                  <FiRefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">اضغط على الزر لملء الحقل تلقائياً بكود غير متكرر</p>
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
            <div>
              <Label className="flex items-center gap-2">
                <FiImage className="w-4 h-4" />
                صورة الفئة (اختياري)
              </Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/jfif"
                className="mt-1"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setMainCategoryImageFile(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => setMainCategoryImagePreview(ev.target?.result as string || null);
                    reader.readAsDataURL(file);
                  } else {
                    setMainCategoryImageFile(null);
                    setMainCategoryImagePreview(mainCategoryForm.image_url || null);
                  }
                }}
              />
              {(mainCategoryImagePreview || mainCategoryForm.image_url) && (
                <div className="mt-2">
                  <img
                    src={mainCategoryImagePreview || mainCategoryForm.image_url || ''}
                    alt="معاينة"
                    className="h-20 w-20 object-cover rounded border"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddMainCategoryOpen(false);
              setEditingMainCategory(null);
              setMainCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', classification_id: '', image_url: '' });
              setMainCategoryImageFile(null);
              setMainCategoryImagePreview(null);
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
            <div>
              <Label className="flex items-center gap-2">
                <FiImage className="w-4 h-4" />
                صورة الفئة الفرعية (اختياري)
              </Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/jfif"
                className="mt-1"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSubCategoryImageFile(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => setSubCategoryImagePreview(ev.target?.result as string || null);
                    reader.readAsDataURL(file);
                  } else {
                    setSubCategoryImageFile(null);
                    setSubCategoryImagePreview(subCategoryForm.image_url || null);
                  }
                }}
              />
              {(subCategoryImagePreview || subCategoryForm.image_url) && (
                <div className="mt-2">
                  <img
                    src={subCategoryImagePreview || subCategoryForm.image_url || ''}
                    alt="معاينة"
                    className="h-20 w-20 object-cover rounded border"
                  />
                </div>
              )}
            </div>
            {/* سعر البورصة الأولي (للفئات الفرعية من نوع مخلفات فقط) */}
            {(subCategoryForm.item_type === 'waste' || subCategoryForm.item_type === 'both') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sub-category-initial-buy">سعر شراء البورصة الأولي (اختياري)</Label>
                  <Input
                    id="sub-category-initial-buy"
                    type="number"
                    min={0}
                    step={0.01}
                    value={subCategoryInitialBuyPrice ?? ''}
                    onChange={(e) =>
                      setSubCategoryInitialBuyPrice(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="sub-category-initial-sell">سعر بيع البورصة الأولي (اختياري)</Label>
                  <Input
                    id="sub-category-initial-sell"
                    type="number"
                    min={0}
                    step={0.01}
                    value={subCategoryInitialSellPrice ?? ''}
                    onChange={(e) =>
                      setSubCategoryInitialSellPrice(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    placeholder="يُحسب تلقائياً من سعر الشراء إن تُرك فارغاً"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddSubCategoryOpen(false);
              setEditingSubCategory(null);
              setSubCategoryForm({ name: '', name_ar: '', code: '', description: '', item_type: 'both', main_category_id: '', image_url: '' });
              setSubCategoryImageFile(null);
              setSubCategoryImagePreview(null);
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

      {/* Dialog: منتجات الفئة الفرعية (مخلفات أو منتجات متجر) */}
      <Dialog open={productsDialogOpen} onOpenChange={(open) => { setProductsDialogOpen(open); if (!open) setSelectedSubCategoryForProducts(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>المنتجات - {selectedSubCategoryForProducts?.name}</DialogTitle>
            <DialogDescription>
              {selectedSubCategoryForProducts?.item_type === 'waste'
                ? 'المنتجات تحت الفئة الفرعية (مخلفات). يمكنك إضافة منتج جديد مع سعر افتتاحي وإضافته تلقائياً للبورصة.'
                : 'منتجات المتجر تحت هذه الفئة. أسعار افتراضية ونقاط وبراندز — يمكن إضافتها لاحقاً للمتاجر من إدارة المتاجر.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSubCategoryForProducts?.item_type === 'waste' && (
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setProductForm({ name: '', nameAr: '', description: '', openingPrice: '', pricePremiumPercentage: '0', pricePremiumFixedAmount: '0', pricingMode: 'per_kg', weightGrams: '1000', image_url: '' });
                    setAddProductDialogOpen(true);
                  }}
                >
                  <FiPlus className="mr-2" />
                  إضافة منتج مخلفات
                </Button>
              </div>
            )}
            {(selectedSubCategoryForProducts?.item_type === 'product' || selectedSubCategoryForProducts?.item_type === 'both') && (
              <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-100"
                  onClick={handleSyncAllProducts}
                  disabled={storeCatalogProductsUnderSubcategory.length === 0}
                >
                  <FiRefreshCw className="mr-2" />
                  مزامنة جميع المتجات مع المتاجر
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    setStoreProductForm({ name: '', name_ar: '', description: '', sku: '', default_selling_price: '', cost_price: '', profit_margin: '', loyalty_points_earned: '0', brand_id: '', image_url: '', is_on_sale: false, sale_price: '' });
                    setAddStoreProductDialogOpen(true);
                  }}
                >
                  <FiPlus className="mr-2" />
                  إضافة منتج للمتجر
                </Button>
              </div>
            )}
            {loadingProducts ? (
              <p className="text-center text-gray-500 py-4">جاري تحميل المنتجات...</p>
            ) : selectedSubCategoryForProducts?.item_type === 'waste' ? (
              productsUnderSubcategory.length === 0 ? (
                <p className="text-center text-gray-500 py-4">لا توجد منتجات مخلفات. أضف منتجاً جديداً.</p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الوزن</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>طريقة الحساب</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsUnderSubcategory.map((p: any, pIdx: number) => (
                        <TableRow key={`prod-${pIdx}-${p.id ?? pIdx}`}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{p.weight != null ? `${p.weight} جم` : '-'}</TableCell>
                          <TableCell>{p.price != null ? `${Number(p.price).toFixed(2)} ج` : '-'}</TableCell>
                          <TableCell>{p.pricing_mode === 'per_piece' ? 'بالقطعة' : 'بالكيلو'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : (selectedSubCategoryForProducts?.item_type === 'product' || selectedSubCategoryForProducts?.item_type === 'both') ? (
              storeCatalogProductsUnderSubcategory.length === 0 ? (
                <p className="text-center text-gray-500 py-4">لا توجد منتجات متجر. أضف منتجاً للمتجر.</p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>السعر الافتراضي</TableHead>
                        <TableHead>النقاط</TableHead>
                        <TableHead>إجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storeCatalogProductsUnderSubcategory.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.name_ar || p.name}</TableCell>
                          <TableCell>{p.sku}</TableCell>
                          <TableCell>{p.default_selling_price != null ? `${Number(p.default_selling_price).toFixed(2)} ج` : '-'}</TableCell>
                          <TableCell>{p.loyalty_points_earned ?? 0}</TableCell>
                          <TableCell className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-500 hover:text-blue-700"
                              title="مزامنة مع المتاجر"
                              onClick={async () => {
                                await syncProductToLinkedStores(p);
                                toast.success('تمت المزامنة بنجاح');
                              }}
                            >
                              <FiRefreshCw />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (window.confirm('حذف هذا المنتج من الكتالوج؟')) {
                                  const ok = await storeCatalogProductService.delete(p.id);
                                  if (ok) loadProductsForSubcategory();
                                }
                              }}
                            >
                              <FiTrash2 className="text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: إضافة منتج للمتجر (من كتالوج التنظيم) */}
      <Dialog open={addStoreProductDialogOpen} onOpenChange={setAddStoreProductDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة منتج للمتجر</DialogTitle>
            <DialogDescription>
              الفئة: {selectedSubCategoryForProducts?.name}. السعر الافتراضي والنقاط والبراند — يُستخدم عند إضافة المنتج لأي متجر لاحقاً.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-colors cursor-pointer" onClick={() => document.getElementById('store-product-image-upload')?.click()}>
              {storeProductImagePreview ? (
                <div className="relative w-full aspect-video rounded overflow-hidden shadow-sm border border-gray-100 bg-gray-50 flex items-center justify-center">
                  <img src={storeProductImagePreview} alt="Preview" className="max-h-full object-contain" />
                  <button onClick={(e) => { e.stopPropagation(); setStoreProductImageFile(null); setStoreProductImagePreview(null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                    <FiX size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <FiImage className="text-gray-400 text-3xl mb-1" />
                  <span className="text-sm text-gray-500">صورة المنتج (اختياري)</span>
                  <span className="text-[10px] text-gray-400 mt-1 uppercase">png, jpg, webp</span>
                </div>
              )}
              <input 
                id="store-product-image-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setStoreProductImageFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setStoreProductImagePreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} 
              />
            </div>
            <div><Label>الاسم *</Label><Input value={storeProductForm.name} onChange={(e) => setStoreProductForm({ ...storeProductForm, name: e.target.value })} placeholder="اسم المنتج" /></div>
            <div><Label>الاسم بالعربية</Label><Input value={storeProductForm.name_ar} onChange={(e) => setStoreProductForm({ ...storeProductForm, name_ar: e.target.value })} placeholder="الاسم بالعربية" /></div>
            <div><Label>رمز SKU *</Label><Input value={storeProductForm.sku} onChange={(e) => setStoreProductForm({ ...storeProductForm, sku: e.target.value })} placeholder="مثال: PRD-001" /></div>
            <div><Label>الوصف</Label><Textarea value={storeProductForm.description} onChange={(e) => setStoreProductForm({ ...storeProductForm, description: e.target.value })} placeholder="وصف اختياري" rows={2} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>سعر البيع المبدئي المقترح (ج) *</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={storeProductForm.default_selling_price} 
                  onChange={(e) => setStoreProductForm({ ...storeProductForm, default_selling_price: e.target.value })} 
                  placeholder="السعر القادم من إدارة التسعير" 
                />
                <p className="text-[10px] text-muted-foreground mt-1">يُقترح من إدارة التسلسل وفقاً لبيانات المالية</p>
              </div>
              <div>
                <Label>سعر التكلفة التقريبي (ج)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={storeProductForm.cost_price} 
                  onChange={(e) => setStoreProductForm({ ...storeProductForm, cost_price: e.target.value })} 
                  placeholder="0.00" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>هامش الربح %</Label><Input type="number" step="0.01" value={storeProductForm.profit_margin} onChange={(e) => setStoreProductForm({ ...storeProductForm, profit_margin: e.target.value })} placeholder="0" /></div>
              <div><Label>نقاط الولاء</Label><Input type="number" min="0" value={storeProductForm.loyalty_points_earned} onChange={(e) => setStoreProductForm({ ...storeProductForm, loyalty_points_earned: e.target.value })} placeholder="0" /></div>
            </div>
            
            {/* حقول الخصم */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox 
                  id="is-on-sale"
                  checked={storeProductForm.is_on_sale}
                  onCheckedChange={(checked) => setStoreProductForm({ ...storeProductForm, is_on_sale: checked as boolean })}
                />
                <Label htmlFor="is-on-sale" className="cursor-pointer font-medium">
                  المنتج عليه خصم
                </Label>
              </div>
              
              {storeProductForm.is_on_sale && (
                <div>
                  <Label>سعر البيع بعد الخصم (ج) *</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    value={storeProductForm.sale_price} 
                    onChange={(e) => setStoreProductForm({ ...storeProductForm, sale_price: e.target.value })} 
                    placeholder="السعر بعد الخصم" 
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    يجب أن يكون أقل من السعر الأصلي
                  </p>
                </div>
              )}
            </div>
            
            <div><Label>البراند</Label>
              <Select value={storeProductForm.brand_id || 'none'} onValueChange={(v) => setStoreProductForm({ ...storeProductForm, brand_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="اختر براند" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— بدون براند —</SelectItem>
                  {productBrands.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name_ar}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStoreProductDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddStoreProductSubmit}>إضافة المنتج</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: إضافة منتج جديد (سعر افتتاحي + نسبة/مبلغ) */}
      <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <TooltipProvider delayDuration={300}>
            <DialogHeader>
              <DialogTitle>إضافة منتج جديد</DialogTitle>
              <DialogDescription>
                الفئة: {selectedSubCategoryForProducts?.name}. السعر الافتتاحي سيُضاف للبورصة ويمكن تحديثه لاحقاً من إدارة التسعير.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="flex items-center mb-1 w-full">
                  <div className="flex-1 min-w-0"><Label>الاسم *</Label></div>
                  <span className="shrink-0 mx-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help text-muted-foreground inline-flex" aria-label="شرح الحقل">
                        <FiHelpCircle className="w-4 h-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="min-w-[18rem] max-w-[22rem]">
                      <p className="font-medium mb-0.5">اسم المنتج كما يظهر في النظام.</p>
                      <p className="text-muted-foreground text-xs">مثال: علبة صلصة، صفيح حديد، كرتونة</p>
                    </TooltipContent>
                  </Tooltip>
                  </span>
                  <div className="flex-1 min-w-0" aria-hidden="true" />
                </div>
                <Input
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="اسم المنتج"
                />
              </div>
              <div>
                <div className="flex items-center mb-1 w-full">
                  <div className="flex-1 min-w-0"><Label>الاسم بالعربية</Label></div>
                  <span className="shrink-0 mx-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help text-muted-foreground inline-flex" aria-label="شرح الحقل">
                        <FiHelpCircle className="w-4 h-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="min-w-[18rem] max-w-[22rem]">
                      <p className="font-medium mb-0.5">الاسم الكامل أو الوصف بالعربية للتطبيقات والعملاء.</p>
                      <p className="text-muted-foreground text-xs">مثال: علبة صلصة طماطم، صفيح حديد خفيف</p>
                    </TooltipContent>
                  </Tooltip>
                  </span>
                  <div className="flex-1 min-w-0" aria-hidden="true" />
                </div>
                <Input
                  value={productForm.nameAr}
                  onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                  placeholder="الاسم بالعربية"
                />
              </div>
              <div>
                <div className="flex items-center mb-1 w-full">
                  <div className="flex-1 min-w-0"><Label>الوصف</Label></div>
                  <span className="shrink-0 mx-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help text-muted-foreground inline-flex" aria-label="شرح الحقل">
                        <FiHelpCircle className="w-4 h-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="min-w-[18rem] max-w-[22rem]">
                      <p className="font-medium mb-0.5">وصف اختياري للمنتج (مواصفات، استخدام، إلخ).</p>
                      <p className="text-muted-foreground text-xs">مثال: علب صلصة فولاذية قابلة لإعادة التدوير</p>
                    </TooltipContent>
                  </Tooltip>
                  </span>
                  <div className="flex-1 min-w-0" aria-hidden="true" />
                </div>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="وصف اختياري"
                  rows={2}
                />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <FiImage className="w-4 h-4" />
                  صورة المنتج (اختياري)
                </Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/jfif"
                  className="mt-1"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProductImageFile(file);
                      const reader = new FileReader();
                      reader.onload = (ev) => setProductImagePreview(ev.target?.result as string || null);
                      reader.readAsDataURL(file);
                    } else {
                      setProductImageFile(null);
                      setProductImagePreview(productForm.image_url || null);
                    }
                  }}
                />
                {(productImagePreview || productForm.image_url) && (
                  <div className="mt-2">
                    <img
                      src={productImagePreview || productForm.image_url || ''}
                      alt="معاينة"
                      className="h-20 w-20 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center mb-1 w-full">
                  <div className="flex-1 min-w-0"><Label>السعر الافتتاحي (ج/كجم) *</Label></div>
                  <span className="shrink-0 mx-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help text-muted-foreground inline-flex" aria-label="شرح الحقل">
                        <FiHelpCircle className="w-4 h-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="min-w-[18rem] max-w-[22rem]">
                      <p className="font-medium mb-0.5">سعر الكيلو جرام بالجنيه. يُستخدم كسعر مرجعي للفئة ويُضاف للبورصة.</p>
                      <p className="text-muted-foreground text-xs">مثال: 18 أو 20.5 — يمكن تعديله لاحقاً من إدارة التسعير</p>
                    </TooltipContent>
                  </Tooltip>
                  </span>
                  <div className="flex-1 min-w-0" aria-hidden="true" />
                </div>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.openingPrice}
                  onChange={(e) => setProductForm({ ...productForm, openingPrice: e.target.value })}
                  placeholder="مثال: 18"
                />
                <p className="text-xs text-gray-500 mt-1">سعر المرجع للفئة. يمكن تعديله لاحقاً من البورصة.</p>
              </div>
              <div>
                <div className="flex items-center mb-1 w-full">
                  <div className="flex-1 min-w-0"><Label>نسبة تعديل السعر عن الفئة (%)</Label></div>
                  <span className="shrink-0 mx-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help text-muted-foreground inline-flex" aria-label="شرح الحقل">
                        <FiHelpCircle className="w-4 h-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="min-w-[18rem] max-w-[22rem]">
                      <p className="font-medium mb-0.5">نسبة زيادة أو خصم عن سعر الفئة. موجب = زيادة، سالب = خصم.</p>
                      <p className="text-muted-foreground text-xs">مثال: 0 = نفس السعر، 10 = زيادة 10%، -5 = خصم 5%</p>
                    </TooltipContent>
                  </Tooltip>
                  </span>
                  <div className="flex-1 min-w-0" aria-hidden="true" />
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.pricePremiumPercentage}
                  onChange={(e) => setProductForm({ ...productForm, pricePremiumPercentage: e.target.value })}
                  placeholder="0 = نفس السعر، 10 = زيادة 10%"
                />
              </div>
              <div>
                <div className="flex items-center mb-1 w-full">
                  <div className="flex-1 min-w-0"><Label>مبلغ إضافي (ج)</Label></div>
                  <span className="shrink-0 mx-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help text-muted-foreground inline-flex" aria-label="شرح الحقل">
                        <FiHelpCircle className="w-4 h-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="min-w-[18rem] max-w-[22rem]">
                      <p className="font-medium mb-0.5">مبلغ ثابت يُضاف لسعر الكيلو بعد تطبيق النسبة (بالجنيه).</p>
                      <p className="text-muted-foreground text-xs">مثال: 0 = لا إضافة، 0.5 = نصف جنيه للكيلو، 2 = جنيهان</p>
                    </TooltipContent>
                  </Tooltip>
                  </span>
                  <div className="flex-1 min-w-0" aria-hidden="true" />
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.pricePremiumFixedAmount}
                  onChange={(e) => setProductForm({ ...productForm, pricePremiumFixedAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <div className="flex items-center mb-1 w-full">
                  <div className="flex-1 min-w-0"><Label>طريقة الحساب</Label></div>
                  <span className="shrink-0 mx-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help text-muted-foreground inline-flex" aria-label="شرح الحقل">
                        <FiHelpCircle className="w-4 h-4" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="min-w-[18rem] max-w-[22rem]">
                      <p className="font-medium mb-0.5">بالكيلو: السعر يُطبق مباشرة على الوزن بالكجم. بالقطعة: السعر يُحسب حسب وزن الوحدة بالجرام.</p>
                      <p className="text-muted-foreground text-xs">مثال: بالكيلو للمواد السائبة؛ بالقطعة لعلب صلصة (مثلاً 200 جم)</p>
                    </TooltipContent>
                  </Tooltip>
                  </span>
                  <div className="flex-1 min-w-0" aria-hidden="true" />
                </div>
                <Select
                  value={productForm.pricingMode}
                  onValueChange={(v) => setProductForm({ ...productForm, pricingMode: v as 'per_kg' | 'per_piece' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_kg">بالكيلو</SelectItem>
                    <SelectItem value="per_piece">بالقطعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {productForm.pricingMode === 'per_piece' && (
                <div>
                  <div className="flex items-center mb-1 w-full">
                    <div className="flex-1 min-w-0"><Label>وزن الوحدة (جرام)</Label></div>
                    <span className="shrink-0 mx-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help text-muted-foreground inline-flex" aria-label="شرح الحقل">
                          <FiHelpCircle className="w-4 h-4" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="min-w-[18rem] max-w-[22rem]">
                        <p className="font-medium mb-0.5">وزن القطعة الواحدة بالجرام. يُستخدم لتحويل السعر من ج/كجم إلى سعر للقطعة.</p>
                        <p className="text-muted-foreground text-xs">مثال: 120 لعلبة سمنة، 200 لعلبة صلصة، 1000 = كيلو واحد</p>
                      </TooltipContent>
                    </Tooltip>
                    </span>
                    <div className="flex-1 min-w-0" aria-hidden="true" />
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={productForm.weightGrams}
                    onChange={(e) => setProductForm({ ...productForm, weightGrams: e.target.value })}
                    placeholder="مثال: 120"
                  />
                </div>
              )}
            </div>
          </TooltipProvider>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddProductDialogOpen(false);
              setProductForm(prev => ({ ...prev, image_url: '' }));
              setProductImageFile(null);
              setProductImagePreview(null);
            }}>
              <FiX className="mr-2" />
              إلغاء
            </Button>
            <Button onClick={handleAddProductSubmit}>
              <FiPlus className="mr-2" />
              إنشاء المنتج
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
                  name_en: brandForm.name_en || undefined,
                  description_ar: brandForm.description_ar || undefined,
                  description_en: brandForm.description_en || undefined,
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
