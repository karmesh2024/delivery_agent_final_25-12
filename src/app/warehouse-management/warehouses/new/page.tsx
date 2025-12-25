'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip';
import { FiInfo, FiPackage, FiTrash2, FiLayers, FiPlus, FiMinus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import warehouseService, { WarehouseType, WarehouseLevel } from '@/domains/warehouse-management/services/warehouseService';
import { uploadFile, getPublicImageUrl, supabase } from '@/lib/supabase';

interface WarehouseFormData {
  name: string;
  location: string;
  region_id: number | null;
  capacity: number | null;
  manager_name: string;
  contact_phone: string;
  email?: string;
  code?: string;
  warehouse_type: WarehouseType;
  is_active: boolean;
  // حقول الهيكل الهرمي الجديدة
  warehouse_level?: WarehouseLevel;
  parent_warehouse_id?: number | null;
  is_main_warehouse?: boolean;
  country_code?: string;
  city_code?: string;
  district_code?: string;
  // Additional fields based on warehouse type
  waste_handling_capacity?: number;
  waste_categories?: string[];
  product_categories?: string[];
  mixed_ratio?: number;
  special_equipment?: string;
  environmental_permits?: string;
  safety_certifications?: string;
  operation_status?: 'active' | 'maintenance' | 'temporarily_closed';
  storage_type?: 'dry' | 'chilled' | 'wet' | 'mixed';
  inventory_system?: 'daily' | 'weekly' | 'monthly';
  images?: File[];
}

function NewWarehouseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editIdParam = searchParams?.get('editId');
  const editId = editIdParam ? Number(editIdParam) : null;

  // قائمة المحافظات المصرية (ثابتة حالياً)
  const egyptGovernorates: Array<{ id: number; name: string }> = [
    { id: 1, name: 'القاهرة' },
    { id: 2, name: 'الجيزة' },
    { id: 3, name: 'الإسكندرية' },
    { id: 4, name: 'الدقهلية' },
    { id: 5, name: 'الشرقية' },
    { id: 6, name: 'القليوبية' },
    { id: 7, name: 'كفر الشيخ' },
    { id: 8, name: 'الغربية' },
    { id: 9, name: 'المنوفية' },
    { id: 10, name: 'البحيرة' },
    { id: 11, name: 'بورسعيد' },
    { id: 12, name: 'الإسماعيلية' },
    { id: 13, name: 'السويس' },
    { id: 14, name: 'دمياط' },
    { id: 15, name: 'الفيوم' },
    { id: 16, name: 'بني سويف' },
    { id: 17, name: 'المنيا' },
    { id: 18, name: 'أسيوط' },
    { id: 19, name: 'سوهاج' },
    { id: 20, name: 'قنا' },
    { id: 21, name: 'الأقصر' },
    { id: 22, name: 'أسوان' },
    { id: 23, name: 'البحر الأحمر' },
    { id: 24, name: 'الوادي الجديد' },
    { id: 25, name: 'مطروح' },
    { id: 26, name: 'شمال سيناء' },
    { id: 27, name: 'جنوب سيناء' },
  ];
  const [activeTab, setActiveTab] = useState('basic-info');
  
  // متغيرات الهيكل الهرمي
  const [parentWarehouses, setParentWarehouses] = useState<Array<{ id: number; name: string; warehouse_level: WarehouseLevel }>>([]);
  const [loadingParentWarehouses, setLoadingParentWarehouses] = useState(false);
  
  // متغيرات القطاعات والكتالوج
  const [availableSectors, setAvailableSectors] = useState<any[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  
  // تجميعات فرعية: أقسام، موظفون، معدات، وسائل نقل
  const [departments, setDepartments] = useState<Array<{ 
    id?: string;
    name: string; 
    department_type: 'products' | 'waste' | 'mixed';
    waste_type?: string; 
    product_type?: string;
    operating_capacity?: string; 
    unit?: string; 
    notes?: string;
    category?: string;
  }>>([]);
  
  // إجبار إعادة التصيير للأقسام
  const [departmentsKey, setDepartmentsKey] = useState(0);
  const [staff, setStaff] = useState<Array<{ name: string; department?: string; operational_card?: string; phone?: string; role?: string; notes?: string }>>([]);
  const [equipment, setEquipment] = useState<Array<{ name: string; quantity?: number; status?: string; usage_type?: string; notes?: string }>>([]);
  const [fixtures, setFixtures] = useState<Array<{ name: string; quantity?: number; status?: string; usage_type?: string; notes?: string }>>([]);
  const [vehicles, setVehicles] = useState<Array<{ vehicle_type: string; count?: number; capacity?: string; status?: string; notes?: string }>>([]);
  // صور محفوظة (عند التعديل)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  // إدارة الفئات الهرمية للمنتجات والمخلفات
  const [productMainCategories, setProductMainCategories] = useState<Array<{ 
    id: string; 
    name: string; 
    description?: string; 
    subcategories: Array<{ id: string; name: string; description?: string }> 
  }>>([]);
  const [wasteMainCategories, setWasteMainCategories] = useState<Array<{ 
    id: string; 
    name: string; 
    description?: string; 
    subcategories: Array<{ id: string; name: string; description?: string }> 
  }>>([]);
  
  // إدارة حالة الفتح/الإغلاق للفئات الرئيسية
  const [expandedProductCategories, setExpandedProductCategories] = useState<Set<string>>(new Set());
  const [expandedWasteCategories, setExpandedWasteCategories] = useState<Set<string>>(new Set());
  
  // إدارة الفئات المتاحة للأقسام التشغيلية
  const [availableCategories, setAvailableCategories] = useState<Array<{ value: string; label: string; type: string }>>([]);
  const [selectedDeptType, setSelectedDeptType] = useState<string>('');
  // نموذج واجهة الأقسام التشغيلية: نوع + فئة رئيسية + فئة فرعية اختيارية
  const [deptForm, setDeptForm] = useState({
    deptType: '',
    mainCatId: '',
    subCatId: '',
    operating_capacity: '',
    unit: ''
  });

  // نموذج بيانات الموظف (عناصر متحكم بها)
  const [staffForm, setStaffForm] = useState({
    name: '',
    department: '',
    operational_card: '',
    phone: '',
    role: ''
  });
  
  // إجبار إعادة التصيير
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // حفظ البيانات المؤقتة لكل تبويب
  const [tempProductSettings, setTempProductSettings] = useState({
    special_equipment: '',
    mainCategories: [] as Array<{ id: string; name: string; description?: string; subcategories: Array<{ id: string; name: string; description?: string }> }>
  });
  
  const [tempWasteSettings, setTempWasteSettings] = useState({
    waste_handling_capacity: '',
    environmental_permits: '',
    safety_certifications: '',
    mainCategories: [] as Array<{ id: string; name: string; description?: string; subcategories: Array<{ id: string; name: string; description?: string }> }>
  });
  
  // وظائف حفظ واستعادة البيانات من localStorage
  const saveToLocalStorage = () => {
    // تجاهل الملفات عند الحفظ لأنها لا يمكن حفظها في localStorage
    const { images, ...formDataWithoutImages } = formData;
    const dataToSave = {
      formData: formDataWithoutImages,
      departments,
      staff,
      equipment,
      vehicles,
      productMainCategories,
      wasteMainCategories,
      tempProductSettings,
      tempWasteSettings,
      expandedProductCategories: Array.from(expandedProductCategories),
      expandedWasteCategories: Array.from(expandedWasteCategories),
      
      // حفظ الفئات المتاحة ونوع القسم المختار
      availableCategories,
      selectedDeptType,
      
      // حفظ نوع القسم من DOM أيضاً
      deptTypeFromDOM: (document.getElementById('dept-type') as HTMLSelectElement)?.value || ''
    };
    localStorage.setItem('warehouse-form-data', JSON.stringify(dataToSave));
    toast.success('تم حفظ البيانات مؤقتاً بنجاح');
  };

  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem('warehouse-form-data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // تجاهل الملفات المحفوظة لأنها لا يمكن حفظها في localStorage
        const { images, ...formDataWithoutImages } = parsed.formData || {};
        setFormData({ ...formDataWithoutImages, images: [] });
        setDepartments(parsed.departments || []);
        setStaff(parsed.staff || []);
        setEquipment(parsed.equipment || []);
        setVehicles(parsed.vehicles || []);
        setProductMainCategories(parsed.productMainCategories || []);
        setWasteMainCategories(parsed.wasteMainCategories || []);
        setTempProductSettings(parsed.tempProductSettings || tempProductSettings);
        setTempWasteSettings(parsed.tempWasteSettings || tempWasteSettings);
        setExpandedProductCategories(new Set(parsed.expandedProductCategories || []));
        setExpandedWasteCategories(new Set(parsed.expandedWasteCategories || []));
        
        // استعادة الفئات المتاحة ونوع القسم المختار
        setAvailableCategories(parsed.availableCategories || []);
        setSelectedDeptType(parsed.selectedDeptType || '');
        
        // تحديث نوع القسم في DOM إذا كان موجوداً
        const deptTypeToUse = parsed.deptTypeFromDOM || parsed.selectedDeptType;
        if (deptTypeToUse && document.getElementById('dept-type')) {
          (document.getElementById('dept-type') as HTMLSelectElement).value = deptTypeToUse;
          setSelectedDeptType(deptTypeToUse);
          updateAvailableCategories(deptTypeToUse);
        }
        
        // تحديث selectedDeptType من DOM إذا لم يكن موجوداً في البيانات المحفوظة
        if (!parsed.selectedDeptType && document.getElementById('dept-type')) {
          const domValue = (document.getElementById('dept-type') as HTMLSelectElement).value;
          if (domValue) {
            setSelectedDeptType(domValue);
            updateAvailableCategories(domValue);
          }
        }
        
        // إشعار المستخدم بتحميل البيانات المحفوظة
        if (parsed.formData && parsed.formData.name) {
          toast.info(`تم تحميل البيانات المحفوظة للمخزن: ${parsed.formData.name}`);
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل البيانات المحفوظة:', error);
      toast.error('خطأ في تحميل البيانات المحفوظة');
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('warehouse-form-data');
    toast.info('تم مسح البيانات المحفوظة');
  };

  // وظيفة تحديث الفئات المتاحة للأقسام التشغيلية
  const updateAvailableCategories = (deptType: string) => {
    const categories: Array<{ value: string; label: string; type: string }> = [];
    
    if (deptType === 'products') {
      productMainCategories.forEach(cat => {
        categories.push({
          value: cat.name,
          label: `📦 ${cat.name}`,
          type: 'main'
        });
        
        cat.subcategories.forEach(sub => {
          categories.push({
            value: `${cat.name} - ${sub.name}`,
            label: `  └─ ${sub.name}`,
            type: 'sub'
          });
        });
      });
      
      if (categories.length === 0) {
        categories.push({
          value: 'no-data',
          label: '⚠️ لا توجد فئات منتجات - أضف فئات في تبويب إعدادات المنتجات',
          type: 'warning'
        });
        toast.warning('لا توجد فئات منتجات. يرجى إضافة فئات في تبويب إعدادات المنتجات أولاً');
      } else {
        toast.success(`تم تحميل ${productMainCategories.length} فئة منتجات`);
      }
    } else if (deptType === 'waste') {
      wasteMainCategories.forEach(cat => {
        categories.push({
          value: cat.name,
          label: `🗑️ ${cat.name}`,
          type: 'main'
        });
        
        cat.subcategories.forEach(sub => {
          categories.push({
            value: `${cat.name} - ${sub.name}`,
            label: `  └─ ${sub.name}`,
            type: 'sub'
          });
        });
      });
      
      if (categories.length === 0) {
        categories.push({
          value: 'no-data',
          label: '⚠️ لا توجد فئات مخلفات - أضف فئات في تبويب إعدادات المخلفات',
          type: 'warning'
        });
        toast.warning('لا توجد فئات مخلفات. يرجى إضافة فئات في تبويب إعدادات المخلفات أولاً');
      } else {
        toast.success(`تم تحميل ${wasteMainCategories.length} فئة مخلفات`);
      }
    } else if (deptType === 'mixed') {
      if (productMainCategories.length > 0) {
        productMainCategories.forEach(cat => {
          categories.push({
            value: `products-${cat.name}`,
            label: `📦 ${cat.name}`,
            type: 'product-main'
          });
          
          cat.subcategories.forEach(sub => {
            categories.push({
              value: `products-${cat.name}-${sub.name}`,
              label: `  └─ ${sub.name}`,
              type: 'product-sub'
            });
          });
        });
      }
      
      if (wasteMainCategories.length > 0) {
        wasteMainCategories.forEach(cat => {
          categories.push({
            value: `waste-${cat.name}`,
            label: `🗑️ ${cat.name}`,
            type: 'waste-main'
          });
          
          cat.subcategories.forEach(sub => {
            categories.push({
              value: `waste-${cat.name}-${sub.name}`,
              label: `  └─ ${sub.name}`,
              type: 'waste-sub'
            });
          });
        });
      }
      
      if (categories.length === 0) {
        categories.push({
          value: 'no-data',
          label: '⚠️ لا توجد فئات - أضف فئات في تبويبات الإعدادات',
          type: 'warning'
        });
        toast.warning('لا توجد فئات. يرجى إضافة فئات في تبويبات إعدادات المنتجات والمخلفات أولاً');
      } else {
        const totalCategories = productMainCategories.length + wasteMainCategories.length;
        toast.success(`تم تحميل ${totalCategories} فئة (${productMainCategories.length} منتجات + ${wasteMainCategories.length} مخلفات)`);
      }
    }
    
    setAvailableCategories(categories);
  };

  // مشتقات الفئات حسب النوع المحدد
  const currentMainCategories = React.useMemo(() => {
    if (deptForm.deptType === 'products') return productMainCategories;
    if (deptForm.deptType === 'waste') return wasteMainCategories;
    return [] as typeof productMainCategories;
  }, [deptForm.deptType, productMainCategories, wasteMainCategories]);

  const currentSubCategories = React.useMemo(() => {
    const main = currentMainCategories.find(m => m.id === deptForm.mainCatId);
    return main ? main.subcategories : [];
  }, [currentMainCategories, deptForm.mainCatId]);

  // وظيفة توليد الكود التلقائي
  const generateWarehouseCode = async () => {
    try {
      // جلب آخر كود مخزن من قاعدة البيانات
      const { data: warehouses, error } = await supabase!
        .from('warehouses')
        .select('code')
        .not('code', 'is', null)
        .order('id', { ascending: false })
        .limit(10);

      if (error) {
        console.error('خطأ في جلب البيانات:', error);
        toast.error('خطأ في توليد الكود');
        return;
      }

      let nextNumber = 1;
      
      if (warehouses && warehouses.length > 0) {
        // استخراج الأرقام من الأكواد الموجودة
        const numbers = warehouses
          .map(w => w.code)
          .filter(code => code && code.match(/WH-\d+/))
          .map(code => parseInt(code!.replace('WH-', '')))
          .filter(num => !isNaN(num));

        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1;
        }
      }

      const newCode = `WH-${nextNumber.toString().padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, code: newCode }));
      toast.success(`تم توليد الكود: ${newCode}`);
    } catch (error) {
      console.error('خطأ في توليد الكود:', error);
      toast.error('خطأ في توليد الكود');
    }
  };

  const [formData, setFormData] = useState<WarehouseFormData>({
    name: '',
    location: '',
    region_id: null,
    capacity: null,
    manager_name: '',
    contact_phone: '',
    warehouse_type: 'products',
    is_active: true,
    // حقول الهيكل الهرمي
    warehouse_level: 'district',
    parent_warehouse_id: null,
    is_main_warehouse: false,
    country_code: '',
    city_code: '',
    district_code: '',
    operation_status: 'active',
    storage_type: 'dry',
    inventory_system: 'weekly',
    images: [],
  });

  // دالة لجلب القطاعات المتاحة
  const fetchAvailableSectors = async (level: WarehouseLevel) => {
    setLoadingSectors(true);
    try {
      const sectors = await warehouseService.getSectors();
      // إذا لم يكن للقطاع مستويات محددة، نعرضه دائمًا
      const filteredSectors = (sectors || []).filter((sector: any) => {
        const levels: string[] = Array.isArray(sector?.warehouse_levels) ? sector.warehouse_levels : [];
        if (levels.length === 0) return true; // اعرض الكل افتراضيًا
        return levels.includes(level);
      });
      setAvailableSectors(filteredSectors);
    } catch (error) {
      console.error('خطأ في جلب القطاعات:', error);
      toast.error('حدث خطأ أثناء جلب القطاعات');
    } finally {
      setLoadingSectors(false);
    }
  };

  // دالة لجلب المخازن الأب بناءً على المستوى المختار
  const fetchParentWarehouses = async (level: WarehouseLevel) => {
    setLoadingParentWarehouses(true);
    try {
      let warehouses: any[] = [];
      
      // جلب جميع المخازن أولاً
      const allWarehouses = await warehouseService.getAll();
      
      switch (level) {
        case 'country':
          // سيتم تعيين الأب تلقائياً إلى الإدارة العليا، لا حاجة للائحة آباء
          warehouses = [];
          break;
        case 'city':
          // للمدينة، نحتاج مخازن رئيسية (مستوى الدولة) فقط
          warehouses = allWarehouses.filter(w => w.warehouse_level === 'country');
          break;
        case 'district':
          // للمنطقة، نحتاج مخازن المدن فقط
          warehouses = allWarehouses.filter(w => w.warehouse_level === 'city');
          break;
        default:
          warehouses = [];
      }
      
      console.log(`جلب ${warehouses.length} مخزن أب للمستوى ${level}:`, warehouses);
      
      setParentWarehouses(warehouses.map(w => ({
        id: w.id,
        name: w.name,
        warehouse_level: w.warehouse_level || 'unknown'
      })));
    } catch (error) {
      console.error('خطأ في جلب المخازن الأب:', error);
      toast.error('حدث خطأ أثناء جلب المخازن الأب');
    } finally {
      setLoadingParentWarehouses(false);
    }
  };

  // دالة لتحديث المستوى الهرمي
  const handleWarehouseLevelChange = (level: WarehouseLevel) => {
    // إذا كان المستوى دولة: عيّن الإدارة العليا كأب تلقائياً
    if (level === 'country') {
      (async () => {
        const admin = await warehouseService.getAdminWarehouse();
    setFormData(prev => ({
      ...prev,
      warehouse_level: level,
          parent_warehouse_id: admin ? Number(admin.id) : null,
          is_main_warehouse: true
    }));
      setParentWarehouses([]);
        fetchAvailableSectors(level);
      })();
      return;
    }

    setFormData(prev => ({
      ...prev,
      warehouse_level: level,
      parent_warehouse_id: null,
      is_main_warehouse: false
    }));
    fetchParentWarehouses(level);
    fetchAvailableSectors(level);
  };

  const handleFormChange = (field: keyof WarehouseFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // تحميل البيانات المحفوظة عند بدء التطبيق
  React.useEffect(() => {
    loadFromLocalStorage();
    
    // معالجة المعاملات من URL
    const urlParams = new URLSearchParams(window.location.search);
    const levelParam = urlParams.get('level');
    const parentParam = urlParams.get('parent');
    
    if (levelParam && ['country', 'city', 'district'].includes(levelParam)) {
      const level = levelParam as WarehouseLevel;
      setFormData(prev => ({
        ...prev,
        warehouse_level: level,
        is_main_warehouse: level === 'country'
      }));
      
      if (parentParam) {
        const parentId = parseInt(parentParam);
        setFormData(prev => ({
          ...prev,
          parent_warehouse_id: parentId
        }));
      }
      
      // جلب المخازن الأب إذا لم يكن مخزن رئيسي
      if (level !== 'country') {
        fetchParentWarehouses(level);
      }
    }
    
    // إذا كنا في وضع التعديل، اجلب بيانات المخزن واملأ النموذج
    const loadForEdit = async () => {
      if (!editId) return;
      try {
        const { data: wh, error } = await supabase!
          .from('warehouses')
          .select('*')
          .eq('id', editId)
          .single();
        if (!error && wh) {
          setFormData((prev)=> ({
            ...prev,
            name: wh.name || '',
            location: wh.location || '',
            region_id: wh.region_id ?? null,
            capacity: wh.capacity ?? null,
            manager_name: wh.manager_name || '',
            contact_phone: wh.contact_phone || '',
            email: wh.email || '',
            code: wh.code || '',
            warehouse_type: wh.warehouse_type || 'products',
            operation_status: wh.operation_status || 'active',
            storage_type: wh.storage_type || 'dry',
            inventory_system: wh.inventory_system || 'weekly',
          }));
        }
        // جلب الأقسام والموظفين والمعدات ووسائل النقل
        const [depRes, stRes, eqRes, vhRes] = await Promise.all([
          supabase!.from('warehouse_departments').select('*').eq('warehouse_id', editId),
          supabase!.from('warehouse_staff').select('*').eq('warehouse_id', editId),
          supabase!.from('warehouse_equipment').select('*').eq('warehouse_id', editId),
          supabase!.from('warehouse_vehicles').select('*').eq('warehouse_id', editId),
        ]);
        if (!depRes.error && depRes.data) setDepartments(depRes.data as any);
        if (!stRes.error && stRes.data) setStaff(stRes.data as any);
        if (!eqRes.error && eqRes.data) {
          const eq = (eqRes.data as any[]);
          setEquipment(eq.filter(e=> e.usage_type !== 'fixture'));
          setFixtures(eq.filter(e=> e.usage_type === 'fixture'));
        }
        if (!vhRes.error && vhRes.data) setVehicles(vhRes.data as any);
        // جلب صور المخزن
        const imgRes = await supabase!.from('warehouse_images').select('image_url').eq('warehouse_id', editId);
        if (!imgRes.error && imgRes.data) {
          const urls: string[] = [];
          for (const r of imgRes.data as any[]) {
            const url: string | null = r.image_url || null;
            if (!url) continue;
            try {
              // محاولة استخراج المسار داخل البكت
              const match = url.match(/\/object\/public\/warehouse-images\/(.*)$/);
              const path = match ? match[1] : null;
              if (path) {
                const signed = await supabase!.storage.from('warehouse-images').createSignedUrl(path, 60 * 60);
                if (signed.data?.signedUrl) {
                  urls.push(signed.data.signedUrl);
                  continue;
                }
              }
              urls.push(url);
            } catch {
              urls.push(url);
            }
          }
          setExistingImages(urls);
        }
      } catch {}
    };
    loadForEdit();
  }, []);

  // حفظ البيانات تلقائياً عند تغيير أي بيانات
  React.useEffect(() => {
    const timer = setTimeout(() => {
      saveToLocalStorage();
    }, 1000); // حفظ بعد ثانية واحدة من آخر تغيير

    return () => clearTimeout(timer);
  }, [formData, departments, staff, equipment, vehicles, productMainCategories, wasteMainCategories, tempProductSettings, tempWasteSettings, expandedProductCategories, expandedWasteCategories]);

  // إجبار إعادة التصيير عند تغيير الأقسام
  React.useEffect(() => {
    console.log('تم تحديث الأقسام:', departments);
    // إجبار إعادة التصيير
    setForceUpdate(prev => prev + 1);
    setDepartmentsKey(prev => prev + 1);
    const event = new CustomEvent('departmentsUpdated');
    window.dispatchEvent(event);
  }, [departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // تحقق من نوع المخزن وعدم السماح بالقيمة الفارغة
      const safeWarehouseType = (formData.warehouse_type === 'products' || formData.warehouse_type === 'waste' || formData.warehouse_type === 'mixed')
        ? formData.warehouse_type
        : 'products';

      if (!formData.warehouse_type) {
        toast.info('تم ضبط نوع المخزن افتراضياً إلى: مخزن منتجات');
      }

      // التحقق من عدم تكرار كود المخزن قبل الإرسال
      let finalCode: string | null = formData.code?.trim() || null;
      if (finalCode) {
        const { data: existing, error: codeCheckError } = await supabase!
          .from('warehouses')
          .select('id')
          .eq('code', finalCode)
          .limit(1);
        if (!codeCheckError && existing && existing.length > 0) {
          toast.warning('الكود المدخل مستخدم سابقاً. سيتم إنشاء المخزن بدون كود. يمكنك توليد كود جديد لاحقاً.');
          finalCode = null; // تفادي تعارض المفتاح الفريد
        }
      }

      const created = editId ? { id: editId } as any : await warehouseService.createHierarchicalWarehouse({
        name: formData.name,
        location: formData.location,
        region_id: formData.region_id,
        capacity: formData.capacity,
        current_stock: null,
        manager_name: formData.manager_name || null,
        contact_phone: formData.contact_phone || null,
        email: formData.email || null,
        code: finalCode,
        warehouse_type: safeWarehouseType,
        operation_status: formData.operation_status,
        storage_type: formData.storage_type,
        inventory_system: formData.inventory_system,
        special_equipment: tempProductSettings.special_equipment || null,
        waste_handling_capacity: tempWasteSettings.waste_handling_capacity ? parseFloat(tempWasteSettings.waste_handling_capacity) : null,
        environmental_permits: tempWasteSettings.environmental_permits || null,
        safety_certifications: tempWasteSettings.safety_certifications || null,
        is_active: true,
        // حقول الهيكل الهرمي
        warehouse_level: formData.warehouse_level || 'district',
        parent_warehouse_id: formData.parent_warehouse_id,
        is_main_warehouse: formData.is_main_warehouse || false,
        country_code: formData.country_code || null,
        city_code: formData.city_code || null,
        district_code: formData.district_code || null,
      } as any);

      if (!created && !editId) {
        throw new Error('failed');
      }

      // Upload images and save records
      if (!editId && created && formData.images && formData.images.length > 0) {
        for (const file of formData.images) {
          const { path, error } = await uploadFile('warehouse-images', file, String(created.id));
          if (!error && path) {
            const publicUrl = getPublicImageUrl('warehouse-images', path);
            await supabase!.from('warehouse_images').insert({ warehouse_id: created.id, image_url: publicUrl });
          }
        }
      }

      // إدراج البيانات الفرعية بعد الإنشاء
      if (created || editId) {
        const targetId = editId || created.id;
        if (editId) {
          await warehouseService.update(editId, {
            name: formData.name,
            location: formData.location,
            region_id: formData.region_id ?? null,
            capacity: formData.capacity ?? null,
            manager_name: formData.manager_name || null,
            contact_phone: formData.contact_phone || null,
            email: formData.email || null,
            code: formData.code || null,
            warehouse_type: formData.warehouse_type,
            operation_status: formData.operation_status,
            storage_type: formData.storage_type,
            inventory_system: formData.inventory_system,
            is_active: formData.is_active,
          } as any);
          // مسح البيانات القديمة وإعادة إدراج التفصيلية
          await supabase!.from('warehouse_departments').delete().eq('warehouse_id', targetId);
          await supabase!.from('warehouse_staff').delete().eq('warehouse_id', targetId);
          await supabase!.from('warehouse_equipment').delete().eq('warehouse_id', targetId);
          await supabase!.from('warehouse_vehicles').delete().eq('warehouse_id', targetId);
        }
        if (departments.length) {
          await supabase!.from('warehouse_departments').insert(
            departments.map(d => ({ ...d, warehouse_id: targetId }))
          );
        }
        if (staff.length) {
          await supabase!.from('warehouse_staff').insert(
            staff.map(s => ({ ...s, warehouse_id: targetId }))
          );
        }
        if (equipment.length) {
          await supabase!.from('warehouse_equipment').insert(
            equipment.map(eq => ({ ...eq, warehouse_id: targetId, usage_type: eq.usage_type || 'machine' }))
          );
        }
        if (fixtures.length) {
          await supabase!.from('warehouse_equipment').insert(
            fixtures.map(fx => ({ ...fx, warehouse_id: targetId, usage_type: fx.usage_type || 'fixture' }))
          );
        }
        if (vehicles.length) {
          await supabase!.from('warehouse_vehicles').insert(
            vehicles.map(v => ({ ...v, warehouse_id: targetId }))
          );
        }
        
        // حفظ الفئات الهرمية للمنتجات والمخلفات
        if (tempProductSettings.mainCategories.length) {
          const productCategoriesData = tempProductSettings.mainCategories.map(cat => ({
            warehouse_id: created.id,
            notes: `فئة منتجات رئيسية: ${cat.name}${cat.description ? ` - ${cat.description}` : ''}${cat.subcategories.length ? ` | فئات فرعية: ${cat.subcategories.map(sub => sub.name).join(', ')}` : ''}`
          }));
          await supabase!.from('warehouse_notes').insert(productCategoriesData);
        }
        
        if (tempWasteSettings.mainCategories.length) {
          const wasteCategoriesData = tempWasteSettings.mainCategories.map(cat => ({
            warehouse_id: created.id,
            notes: `فئة مخلفات رئيسية: ${cat.name}${cat.description ? ` - ${cat.description}` : ''}${cat.subcategories.length ? ` | فئات فرعية: ${cat.subcategories.map(sub => sub.name).join(', ')}` : ''}`
          }));
          await supabase!.from('warehouse_notes').insert(wasteCategoriesData);
        }
      }

      toast.success(`تم إنشاء مخزن ${formData.name} بنجاح`);
      clearLocalStorage(); // تنظيف البيانات المحفوظة بعد الحفظ الناجح
      router.push('/warehouse-management/warehouses');
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء المخزن. يرجى المحاولة مرة أخرى.");
    }
  };

  const getWarehouseTypeIcon = (type: WarehouseType) => {
    switch (type) {
      case 'products':
        return <FiPackage className="h-5 w-5 text-blue-600" />;
      case 'waste':
        return <FiTrash2 className="h-5 w-5 text-red-600" />;
      case 'mixed':
        return <FiLayers className="h-5 w-5 text-green-600" />;
      default:
        return <FiPackage className="h-5 w-5 text-gray-600" />;
    }
  };

  const getWarehouseTypeDescription = (type: WarehouseType) => {
    switch (type) {
      case 'products':
        return 'مخزن مخصص لتخزين المنتجات الجديدة والمستعملة';
      case 'waste':
        return 'مخزن مخصص لتخزين المخلفات والمواد القابلة لإعادة التدوير';
      case 'mixed':
        return 'مخزن مختلط يمكنه تخزين المنتجات والمخلفات معاً';
      default:
        return '';
    }
  };

  return (
    <DashboardLayout title="إدارة المخازن">
      <TooltipProvider>
      <div className="container mx-auto p-6">
        <Link 
          href="/warehouse-management/warehouses" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <FaArrowLeft className="mr-2" /> العودة إلى قائمة المخازن
        </Link>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{editId ? 'تعديل مخزن' : 'إضافة مخزن جديد'}</h1>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={saveToLocalStorage} className="text-sm">
              💾 حفظ مؤقت
            </Button>
            <Button type="button" variant="outline" onClick={clearLocalStorage} className="text-sm text-red-600">
              🗑️ مسح المحفوظ
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="basic-info">المعلومات الأساسية</TabsTrigger>
              <TabsTrigger value="product-settings">إعدادات المنتجات</TabsTrigger>
              <TabsTrigger value="waste-settings">إعدادات المخلفات</TabsTrigger>
              <TabsTrigger value="additional">معلومات إضافية</TabsTrigger>
              <TabsTrigger value="departments">الأقسام التشغيلية</TabsTrigger>
              <TabsTrigger value="staff">الموظفون</TabsTrigger>
              <TabsTrigger value="equipment">المعدات - والتجهيزات</TabsTrigger>
              <TabsTrigger value="vehicles">وسائل النقل</TabsTrigger>
              <TabsTrigger value="attachments">صور ومرفقات</TabsTrigger>
            </TabsList>

            {/* المعلومات الأساسية */}
            <TabsContent value="basic-info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>المعلومات الأساسية للمخزن</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="code">الكود</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <FiInfo className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>كود فريد للمخزن يتم توليده تلقائياً أو إدخاله يدوياً</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      id="code" 
                      value={formData.code || ''} 
                      onChange={(e)=>handleFormChange('code', e.target.value)} 
                      placeholder="مثال: WH-001 - كود فريد للمخزن" 
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={generateWarehouseCode}
                      className="px-3"
                    >
                      🔄 توليد
                    </Button>
                  </div>
                </div>
                    <div>
                      <div className="flex items-center gap-2">
                      <Label htmlFor="name">اسم المخزن *</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FiInfo className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>اسم المخزن باللغة العربية أو الإنجليزية</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        placeholder="مثال: مخزن دبي الرئيسي - الاسم الرسمي للمخزن"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                      <Label htmlFor="location">الموقع *</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FiInfo className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>الدولة: مصر — المحافظة + العنوان التفصيلي</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input
                          id="country"
                          value="مصر"
                          readOnly
                        />
                        <Select value={String(formData.region_id || '')} onValueChange={(val)=>handleFormChange('region_id', Number(val))}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المحافظة" />
                          </SelectTrigger>
                          <SelectContent>
                            {egyptGovernorates.map((g)=> (
                              <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleFormChange('location', e.target.value)}
                          placeholder="العنوان التفصيلي: الشارع - المبنى - المعلم القريب"
                        required
                      />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="warehouse_type" className="flex items-center gap-2">
                        نوع المخزن *
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">اختر نوع المخزن حسب طبيعة العمل: منتجات، مخلفات، أو مختلط</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Select
                        value={formData.warehouse_type}
                        onValueChange={(value: WarehouseType) => handleFormChange('warehouse_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المخزن" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="products">
                            <div className="flex items-center gap-2">
                              <FiPackage className="h-4 w-4 text-blue-600" />
                              مخزن منتجات
                            </div>
                          </SelectItem>
                          <SelectItem value="waste">
                            <div className="flex items-center gap-2">
                              <FiTrash2 className="h-4 w-4 text-red-600" />
                              مخزن مخلفات
                            </div>
                          </SelectItem>
                          <SelectItem value="mixed">
                            <div className="flex items-center gap-2">
                              <FiLayers className="h-4 w-4 text-green-600" />
                              مخزن مختلط
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                      <Label htmlFor="capacity">السعة (متر مكعب)</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FiInfo className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>السعة الإجمالية للمخزن بالمتر المكعب</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="capacity"
                        type="number"
                        step="0.01"
                        value={formData.capacity || ''}
                        onChange={(e) => handleFormChange('capacity', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="مثال: 1000 - السعة الإجمالية بالمتر المكعب"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FiInfo className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>البريد الإلكتروني الرسمي للمخزن أو المدير</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        placeholder="مثال: manager@company.com - البريد الإلكتروني الرسمي"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                      <Label htmlFor="manager_name">اسم المدير</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FiInfo className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>اسم مدير المخزن المسؤول عن العمليات اليومية</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="manager_name"
                        value={formData.manager_name}
                        onChange={(e) => handleFormChange('manager_name', e.target.value)}
                        placeholder="مثال: أحمد محمد - اسم مدير المخزن"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                      <Label htmlFor="contact_phone">رقم الهاتف</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FiInfo className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>رقم هاتف المخزن أو المدير للتواصل</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="contact_phone"
                        value={formData.contact_phone}
                        onChange={(e) => handleFormChange('contact_phone', e.target.value)}
                        placeholder="مثال: +971501234567 - رقم هاتف المخزن أو المدير"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Label>حالة التشغيل</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FiInfo className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>الحالة الحالية لتشغيل المخزن</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select value={formData.operation_status} onValueChange={(v)=>handleFormChange('operation_status', v as any)}>
                        <SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="maintenance">تحت الصيانة</SelectItem>
                          <SelectItem value="temporarily_closed">مغلق مؤقتًا</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Label>نوع التخزين</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FiInfo className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>نوع البيئة التخزينية المطلوبة للمخزن</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select value={formData.storage_type} onValueChange={(v)=>handleFormChange('storage_type', v as any)}>
                        <SelectTrigger><SelectValue placeholder="اختر نوع التخزين" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dry">جاف</SelectItem>
                          <SelectItem value="chilled">مبرد</SelectItem>
                          <SelectItem value="wet">رطب</SelectItem>
                          <SelectItem value="mixed">مختلط</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Label>نظام الجرد</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <FiInfo className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>تكرار عملية جرد المخزون</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select value={formData.inventory_system} onValueChange={(v)=>handleFormChange('inventory_system', v as any)}>
                        <SelectTrigger><SelectValue placeholder="اختر نظام الجرد" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">يومي</SelectItem>
                          <SelectItem value="weekly">أسبوعي</SelectItem>
                          <SelectItem value="monthly">شهري</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* حقول الهيكل الهرمي */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="warehouse_level" className="flex items-center gap-2">
                          المستوى الهرمي *
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-sm">اختر مستوى المخزن في الهيكل التنظيمي</p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Select
                          value={formData.warehouse_level}
                          onValueChange={(value: WarehouseLevel) => handleWarehouseLevelChange(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المستوى الهرمي" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* إخفاء إنشاء الإدارة العليا من هذه الصفحة */}
                            <SelectItem value="country">مخزن رئيسي (مستوى الدولة)</SelectItem>
                            <SelectItem value="city">مخزن مدينة</SelectItem>
                            <SelectItem value="district">مخزن منطقة فرعية</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* ملاحظة: في مستوى الدولة يتم تعيين الأب تلقائياً إلى الإدارة العليا */}
                      {formData.warehouse_level === 'country' && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md px-3 py-2">
                          سيتم تعيين <span className="font-semibold">الإدارة العليا للمخازن</span> كأب لهذا المخزن تلقائياً. لا حاجة لاختيار أب.
                        </div>
                      )}

                      {/* حقل المخزن الأب - يظهر فقط لمستويي المدينة والمنطقة */}
                      {formData.warehouse_level !== 'admin' && formData.warehouse_level !== 'country' && (
                        <div>
                          <Label htmlFor="parent_warehouse_id" className="flex items-center gap-2">
                            المخزن الأب *
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">
                                  {formData.warehouse_level === 'city' 
                                    ? 'اختر المخزن الرئيسي الذي يتبع له هذا المخزن'
                                    : 'اختر مخزن المدينة الذي يتبع له هذا المخزن'
                                  }
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <p className="text-xs text-gray-500 mb-1">
                            {formData.warehouse_level === 'city'
                              ? 'يجب أن يكون الأب من مستوى: مخزن رئيسي (الدولة).'
                              : 'يجب أن يكون الأب من مستوى: مخزن مدينة.'}
                          </p>
                          <Select
                            value={formData.parent_warehouse_id?.toString() || ''}
                            onValueChange={(value) => handleFormChange('parent_warehouse_id', value ? Number(value) : null)}
                            disabled={loadingParentWarehouses}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={loadingParentWarehouses ? "جاري التحميل..." : "اختر المخزن الأب"} />
                            </SelectTrigger>
                            <SelectContent>
                              {parentWarehouses.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500">
                                  {formData.warehouse_level === 'city' 
                                    ? 'لا توجد مخازن رئيسية متاحة. قم بإنشاء مخزن رئيسي أولاً.'
                                    : 'لا توجد مخازن مدن متاحة. قم بإنشاء مخزن مدينة أولاً.'
                                  }
                                </div>
                              ) : (
                                parentWarehouses.map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                    {warehouse.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* عرض معلومات الهيكل الهرمي */}
                    {formData.warehouse_level && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <FiLayers className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold text-green-800">
                            {formData.warehouse_level === 'admin' && 'الإدارة العليا للمخازن'}
                            {formData.warehouse_level === 'country' && 'مخزن رئيسي (مستوى الدولة)'}
                            {formData.warehouse_level === 'city' && 'مخزن مدينة'}
                            {formData.warehouse_level === 'district' && 'مخزن منطقة فرعية'}
                          </h3>
                        </div>
                        <p className="text-sm text-green-600">
                          {formData.warehouse_level === 'admin' && 'هذا هو أعلى مستوى في الهيكل الهرمي ويدير جميع المخازن الأخرى'}
                          {formData.warehouse_level === 'country' && 'هذا المخزن هو مخزن رئيسي يغطي مستوى الدولة ولا يتبع لأي مخزن آخر'}
                          {formData.warehouse_level === 'city' && 'هذا المخزن يتبع لمخزن رئيسي ويغطي مستوى المدينة'}
                          {formData.warehouse_level === 'district' && 'هذا المخزن يتبع لمخزن مدينة ويغطي مستوى المنطقة'}
                        </p>
                      </div>
                    )}

                    {/* اختيار القطاعات */}
                    {formData.warehouse_level && formData.warehouse_level !== 'admin' && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-4">
                          <FiLayers className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-blue-800">اختيار القطاعات</h3>
                        </div>
                        <p className="text-sm text-blue-600 mb-4">
                          اختر القطاعات التي سيعمل بها هذا المخزن
                        </p>
                        
                        {loadingSectors ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-600 mt-2">جاري تحميل القطاعات...</p>
                          </div>
                        ) : availableSectors.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <p>لا توجد قطاعات متاحة لهذا المستوى</p>
                            <p className="text-sm">يرجى إضافة القطاعات من الإدارة العليا أولاً</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableSectors.map((sector) => (
                              <label key={sector.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedSectors.includes(sector.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSectors(prev => [...prev, sector.id]);
                                    } else {
                                      setSelectedSectors(prev => prev.filter(id => id !== sector.id));
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: sector.color }}
                                  ></div>
                                  <span className="font-medium">{sector.name}</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {sector.description}
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {selectedSectors.length > 0 && (
                          <div className="mt-4 p-3 bg-white rounded-lg border">
                            <p className="text-sm font-medium text-gray-700 mb-2">القطاعات المختارة:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedSectors.map(sectorId => {
                                const sector = availableSectors.find(s => s.id === sectorId);
                                return sector ? (
                                  <Badge key={sectorId} variant="outline" className="flex items-center gap-1">
                                    <div 
                                      className="w-2 h-2 rounded-full" 
                                      style={{ backgroundColor: sector.color }}
                                    ></div>
                                    {sector.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* عرض وصف نوع المخزن */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {getWarehouseTypeIcon(formData.warehouse_type)}
                      <h3 className="font-semibold text-blue-800">
                        {formData.warehouse_type === 'products' && 'مخزن المنتجات'}
                        {formData.warehouse_type === 'waste' && 'مخزن المخلفات'}
                        {formData.warehouse_type === 'mixed' && 'المخزن المختلط'}
                      </h3>
                    </div>
                    <p className="text-sm text-blue-600">
                      {getWarehouseTypeDescription(formData.warehouse_type)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* إعدادات المنتجات */}
            <TabsContent value="product-settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">إعدادات المنتجات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="special_equipment">المعدات الخاصة للمنتجات</Label>
                    <Textarea
                      id="special_equipment"
                      value={tempProductSettings.special_equipment}
                      onChange={(e) => setTempProductSettings(prev => ({ ...prev, special_equipment: e.target.value }))}
                      placeholder="مثال: سير فرز، مكبس نفايات، رافعة شوكية - المعدات الخاصة المطلوبة للمنتجات"
                      rows={3}
                    />
                  </div>

                  {/* إدارة الفئات الرئيسية للمنتجات */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">الفئات الرئيسية للمنتجات</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                      <Input placeholder="اسم الفئة الرئيسية" id="product-main-cat-name" />
                      <Input placeholder="وصف الفئة" id="product-main-cat-desc" />
                      <Button type="button" onClick={()=>{
                        const name = (document.getElementById('product-main-cat-name') as HTMLInputElement).value.trim();
                        const description = (document.getElementById('product-main-cat-desc') as HTMLInputElement).value.trim();
                        if (!name) return;
                        const newCategory = {
                          id: Date.now().toString(),
                          name,
                          description,
                          subcategories: []
                        };
                        setProductMainCategories(prev=>[...prev, newCategory]);
                        setTempProductSettings(prev => ({ ...prev, mainCategories: [...prev.mainCategories, newCategory] }));
                        (document.getElementById('product-main-cat-name') as HTMLInputElement).value='';
                        (document.getElementById('product-main-cat-desc') as HTMLInputElement).value='';
                      }}>➕ إضافة فئة رئيسية</Button>
                    </div>
                    
                    <div className="space-y-4">
                      {productMainCategories.map((category, catIdx) => (
                        <div key={category.id} className="border rounded-lg p-4 bg-blue-50">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newExpanded = new Set(expandedProductCategories);
                                  if (newExpanded.has(category.id)) {
                                    newExpanded.delete(category.id);
                                  } else {
                                    newExpanded.add(category.id);
                                  }
                                  setExpandedProductCategories(newExpanded);
                                }}
                                className="p-1 hover:bg-blue-200 rounded"
                              >
                                {expandedProductCategories.has(category.id) ? 
                                  <FiMinus className="h-4 w-4 text-blue-600" /> : 
                                  <FiPlus className="h-4 w-4 text-blue-600" />
                                }
                              </button>
                              <div>
                                <h5 className="font-semibold text-blue-800">{category.name}</h5>
                                {category.description && <p className="text-sm text-gray-600">{category.description}</p>}
                              </div>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={()=>{
                              setProductMainCategories(productMainCategories.filter((_,i)=>i!==catIdx));
                              setTempProductSettings(prev => ({ ...prev, mainCategories: prev.mainCategories.filter((_,i)=>i!==catIdx) }));
                            }}>حذف</Button>
                          </div>
                          
                          {/* عرض الفئات الفرعية عند الفتح */}
                          {expandedProductCategories.has(category.id) && (
                            <div className="ml-6 space-y-3">
                              {/* إضافة فئة فرعية */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                <Input placeholder="اسم الفئة الفرعية" id={`product-sub-${category.id}-name`} />
                                <Input placeholder="وصف الفئة الفرعية" id={`product-sub-${category.id}-desc`} />
                                <Button type="button" size="sm" onClick={()=>{
                                  const name = (document.getElementById(`product-sub-${category.id}-name`) as HTMLInputElement).value.trim();
                                  const description = (document.getElementById(`product-sub-${category.id}-desc`) as HTMLInputElement).value.trim();
                                  if (!name) return;
                                  const newSub = { id: Date.now().toString(), name, description };
                                  setProductMainCategories(prev => prev.map((cat, idx) => 
                                    idx === catIdx 
                                      ? { ...cat, subcategories: [...cat.subcategories, newSub] }
                                      : cat
                                  ));
                                  setTempProductSettings(prev => ({ 
                                    ...prev, 
                                    mainCategories: prev.mainCategories.map((cat, idx) => 
                                      idx === catIdx 
                                        ? { ...cat, subcategories: [...cat.subcategories, newSub] }
                                        : cat
                                    )
                                  }));
                                  (document.getElementById(`product-sub-${category.id}-name`) as HTMLInputElement).value='';
                                  (document.getElementById(`product-sub-${category.id}-desc`) as HTMLInputElement).value='';
                                }}>➕ إضافة فئة فرعية</Button>
                              </div>
                              
                              {/* عرض الفئات الفرعية */}
                              <div className="space-y-2">
                                {category.subcategories.map((sub, subIdx) => (
                                  <div key={sub.id} className="flex justify-between items-center bg-white border rounded p-2 text-sm">
                                    <div>
                                      <span className="font-medium">{sub.name}</span>
                                      {sub.description && <span className="text-gray-500"> — {sub.description}</span>}
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={()=>{
                                      setProductMainCategories(prev => prev.map((cat, idx) => 
                                        idx === catIdx 
                                          ? { ...cat, subcategories: cat.subcategories.filter((_, i) => i !== subIdx) }
                                          : cat
                                      ));
                                      setTempProductSettings(prev => ({ 
                                        ...prev, 
                                        mainCategories: prev.mainCategories.map((cat, idx) => 
                                          idx === catIdx 
                                            ? { ...cat, subcategories: cat.subcategories.filter((_, i) => i !== subIdx) }
                                            : cat
                                        )
                                      }));
                                    }}>حذف</Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* إعدادات المخلفات */}
            <TabsContent value="waste-settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">إعدادات المخلفات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="waste_handling_capacity">سعة معالجة المخلفات (طن/يوم)</Label>
                        <Input
                          id="waste_handling_capacity"
                          type="number"
                          step="0.01"
                      value={tempWasteSettings.waste_handling_capacity}
                      onChange={(e) => setTempWasteSettings(prev => ({ ...prev, waste_handling_capacity: e.target.value }))}
                          placeholder="مثال: 50 - سعة معالجة المخلفات بالطن يومياً"
                        />
                      </div>

                      <div>
                        <Label htmlFor="environmental_permits">التراخيص البيئية</Label>
                        <Textarea
                          id="environmental_permits"
                      value={tempWasteSettings.environmental_permits}
                      onChange={(e) => setTempWasteSettings(prev => ({ ...prev, environmental_permits: e.target.value }))}
                          placeholder="مثال: ترخيص معالجة المخلفات، ترخيص التخلص الآمن - التراخيص البيئية المطلوبة"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="safety_certifications">شهادات السلامة</Label>
                        <Textarea
                          id="safety_certifications"
                      value={tempWasteSettings.safety_certifications}
                      onChange={(e) => setTempWasteSettings(prev => ({ ...prev, safety_certifications: e.target.value }))}
                          placeholder="مثال: شهادة السلامة الصناعية، شهادة التعامل مع المواد الخطرة - شهادات السلامة المطلوبة"
                          rows={3}
                        />
                      </div>

                  {/* إدارة الفئات الرئيسية للمخلفات */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">الفئات الرئيسية للمخلفات</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                      <Input placeholder="اسم الفئة الرئيسية" id="waste-main-cat-name" />
                      <Input placeholder="وصف الفئة" id="waste-main-cat-desc" />
                      <Button type="button" onClick={()=>{
                        const name = (document.getElementById('waste-main-cat-name') as HTMLInputElement).value.trim();
                        const description = (document.getElementById('waste-main-cat-desc') as HTMLInputElement).value.trim();
                        if (!name) return;
                        const newCategory = {
                          id: Date.now().toString(),
                          name,
                          description,
                          subcategories: []
                        };
                        setWasteMainCategories(prev=>[...prev, newCategory]);
                        setTempWasteSettings(prev => ({ ...prev, mainCategories: [...prev.mainCategories, newCategory] }));
                        (document.getElementById('waste-main-cat-name') as HTMLInputElement).value='';
                        (document.getElementById('waste-main-cat-desc') as HTMLInputElement).value='';
                      }}>➕ إضافة فئة رئيسية</Button>
                    </div>

                    <div className="space-y-4">
                      {wasteMainCategories.map((category, catIdx) => (
                        <div key={category.id} className="border rounded-lg p-4 bg-red-50">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newExpanded = new Set(expandedWasteCategories);
                                  if (newExpanded.has(category.id)) {
                                    newExpanded.delete(category.id);
                                  } else {
                                    newExpanded.add(category.id);
                                  }
                                  setExpandedWasteCategories(newExpanded);
                                }}
                                className="p-1 hover:bg-red-200 rounded"
                              >
                                {expandedWasteCategories.has(category.id) ? 
                                  <FiMinus className="h-4 w-4 text-red-600" /> : 
                                  <FiPlus className="h-4 w-4 text-red-600" />
                                }
                              </button>
                      <div>
                                <h5 className="font-semibold text-red-800">{category.name}</h5>
                                {category.description && <p className="text-sm text-gray-600">{category.description}</p>}
                      </div>
                      </div>
                            <Button type="button" variant="outline" size="sm" onClick={()=>{
                              setWasteMainCategories(wasteMainCategories.filter((_,i)=>i!==catIdx));
                              setTempWasteSettings(prev => ({ ...prev, mainCategories: prev.mainCategories.filter((_,i)=>i!==catIdx) }));
                            }}>حذف</Button>
                    </div>

                          {/* عرض الفئات الفرعية عند الفتح */}
                          {expandedWasteCategories.has(category.id) && (
                            <div className="ml-6 space-y-3">
                              {/* إضافة فئة فرعية */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                <Input placeholder="اسم الفئة الفرعية" id={`waste-sub-${category.id}-name`} />
                                <Input placeholder="وصف الفئة الفرعية" id={`waste-sub-${category.id}-desc`} />
                                <Button type="button" size="sm" onClick={()=>{
                                  const name = (document.getElementById(`waste-sub-${category.id}-name`) as HTMLInputElement).value.trim();
                                  const description = (document.getElementById(`waste-sub-${category.id}-desc`) as HTMLInputElement).value.trim();
                                  if (!name) return;
                                  const newSub = { id: Date.now().toString(), name, description };
                                  setWasteMainCategories(prev => prev.map((cat, idx) => 
                                    idx === catIdx 
                                      ? { ...cat, subcategories: [...cat.subcategories, newSub] }
                                      : cat
                                  ));
                                  setTempWasteSettings(prev => ({ 
                                    ...prev, 
                                    mainCategories: prev.mainCategories.map((cat, idx) => 
                                      idx === catIdx 
                                        ? { ...cat, subcategories: [...cat.subcategories, newSub] }
                                        : cat
                                    )
                                  }));
                                  (document.getElementById(`waste-sub-${category.id}-name`) as HTMLInputElement).value='';
                                  (document.getElementById(`waste-sub-${category.id}-desc`) as HTMLInputElement).value='';
                                }}>➕ إضافة فئة فرعية</Button>
                      </div>

                              {/* عرض الفئات الفرعية */}
                              <div className="space-y-2">
                                {category.subcategories.map((sub, subIdx) => (
                                  <div key={sub.id} className="flex justify-between items-center bg-white border rounded p-2 text-sm">
                      <div>
                                      <span className="font-medium">{sub.name}</span>
                                      {sub.description && <span className="text-gray-500"> — {sub.description}</span>}
                      </div>
                                    <Button type="button" variant="outline" size="sm" onClick={()=>{
                                      setWasteMainCategories(prev => prev.map((cat, idx) => 
                                        idx === catIdx 
                                          ? { ...cat, subcategories: cat.subcategories.filter((_, i) => i !== subIdx) }
                                          : cat
                                      ));
                                      setTempWasteSettings(prev => ({ 
                                        ...prev, 
                                        mainCategories: prev.mainCategories.map((cat, idx) => 
                                          idx === catIdx 
                                            ? { ...cat, subcategories: cat.subcategories.filter((_, i) => i !== subIdx) }
                                            : cat
                                        )
                                      }));
                                    }}>حذف</Button>
                                  </div>
                                ))}
                      </div>
                    </div>
                  )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* معلومات إضافية */}
            <TabsContent value="additional" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>معلومات إضافية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => handleFormChange('is_active', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="is_active">المخزن نشط</Label>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">ملاحظات إضافية</h3>
                    <p className="text-sm text-gray-600">
                      يمكنك إضافة أي معلومات إضافية أو ملاحظات مهمة حول المخزن هنا.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          {/* صور ومرفقات */}
          <TabsContent value="attachments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>صور المخزن</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="images">رفع صور</Label>
                  <Input id="images" type="file" accept="image/*" multiple onChange={(e)=>{
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    handleFormChange('images', files);
                  }} />
                </div>
                {existingImages.length > 0 && (
                  <div>
                    <div className="mb-2 text-sm text-gray-600">الصور المحفوظة</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {existingImages.map((url, idx) => (
                        <div key={`ex-${idx}`} className="border rounded p-2">
                          <img src={url} alt={`existing-${idx}`} className="w-full h-32 object-cover rounded" />
                          <div className="text-xs mt-1 truncate">صورة رقم {idx+1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {formData.images.map((file, idx) => {
                      // التحقق من صحة الملف قبل إنشاء URL
                      if (!file || !(file instanceof File)) {
                        return null;
                      }
                      
                      try {
                        const objectURL = URL.createObjectURL(file);
                        return (
                          <div key={idx} className="border rounded p-2">
                            <img 
                              src={objectURL} 
                              alt={`preview-${idx}`} 
                              className="w-full h-32 object-cover rounded"
                              onLoad={() => URL.revokeObjectURL(objectURL)}
                              onError={() => URL.revokeObjectURL(objectURL)}
                            />
                            <div className="text-xs mt-1 truncate">{file.name}</div>
                          </div>
                        );
                      } catch (error) {
                        console.error('خطأ في إنشاء URL للملف:', error);
                        return (
                          <div key={idx} className="border rounded p-2 bg-red-50">
                            <div className="w-full h-32 flex items-center justify-center text-red-500">
                              خطأ في تحميل الصورة
                            </div>
                            <div className="text-xs mt-1 truncate">{file.name}</div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* الأقسام التشغيلية */}
          <TabsContent value="departments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>الأقسام التشغيلية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                  <Select 
                    value={deptForm.deptType}
                    onValueChange={(value) => {
                      setSelectedDeptType(value);
                      setDeptForm(prev=>({ ...prev, deptType: value, mainCatId: '', subCatId: '' }));
                      updateAvailableCategories(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="نوع القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="products">منتجات</SelectItem>
                      <SelectItem value="waste">مخلفات</SelectItem>
                      <SelectItem value="mixed">مختلط</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={deptForm.mainCatId}
                    onValueChange={(value)=> setDeptForm(prev=> ({...prev, mainCatId: value, subCatId: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="الفئة الرئيسية" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentMainCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={deptForm.subCatId}
                    onValueChange={(value)=> setDeptForm(prev=> ({...prev, subCatId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="الفئة الفرعية (اختياري)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__" disabled={!deptForm.mainCatId}>الكل</SelectItem>
                      {currentSubCategories.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      if (selectedDeptType) {
                        updateAvailableCategories(selectedDeptType);
                        toast.info('تم تحديث الفئات');
                      } else {
                        toast.warning('يرجى اختيار نوع القسم أولاً');
                      }
                    }}
                    className="px-3"
                  >
                    🔄 تحديث
                  </Button>

                  <Input 
                    placeholder="مثال: 2 - الطاقة التشغيلية للقسم" 
                    value={deptForm.operating_capacity}
                    onChange={(e) => setDeptForm(prev => ({ ...prev, operating_capacity: e.target.value }))}
                  />
                  <Input 
                    placeholder="مثال: طن/يوم - وحدة قياس الطاقة" 
                    value={deptForm.unit}
                    onChange={(e) => setDeptForm(prev => ({ ...prev, unit: e.target.value }))}
                  />

                  <Button type="button" onClick={()=>{
                    const { deptType, mainCatId, subCatId, operating_capacity, unit } = deptForm;
                    if (!deptType) {
                      toast.error('يرجى اختيار نوع القسم');
                      return;
                    }
                    if (!mainCatId) {
                      toast.error('يرجى اختيار الفئة الرئيسية');
                      return;
                    }
                    const main = currentMainCategories.find(m => m.id === mainCatId);
                    const sub = currentSubCategories.find(s => s.id === subCatId);
                    const name = subCatId && subCatId !== '__all__' && sub ? `${main?.name} - ${sub.name}` : `${main?.name}`;
                    const category = subCatId && subCatId !== '__all__' && sub ? `${main?.name} - ${sub.name}` : `${main?.name}`;
                    const newDept: any = {
                      id: Date.now().toString(),
                      name,
                      department_type: deptType,
                      operating_capacity: (operating_capacity || '').trim(),
                      unit: (unit || '').trim(),
                      category
                    };

                    setDepartments(prev => ([...prev, newDept]));
                    setDeptForm({ deptType: '', mainCatId: '', subCatId: '', operating_capacity: '', unit: '' });
                    setSelectedDeptType('');
                    setAvailableCategories([]);
                    setForceUpdate(prev => prev + 1);
                    setDepartmentsKey(prev => prev + 1);
                    toast.success('تم إضافة القسم بنجاح');
                  }}>➕ إضافة قسم</Button>
                </div>
                <div className="space-y-2" key={`departments-${departments.length}-${forceUpdate}-${departmentsKey}-${Math.random()}`}>
                  {departments.map((d,idx)=> (
                    <div key={`${d.id || idx}-${d.name}`} className="flex justify-between items-center border rounded p-2 text-sm">
                      <div>
                        <strong>{d.name}</strong> ({d.department_type === 'products' ? 'منتجات' : d.department_type === 'waste' ? 'مخلفات' : 'مختلط'})
                        {d.category && ` — الفئة: ${d.category}`}
                        {d.operating_capacity && ` — الطاقة: ${d.operating_capacity} ${d.unit || ''}`}
                      </div>
                      <Button type="button" variant="outline" onClick={()=>setDepartments(departments.filter((_,i)=>i!==idx))}>حذف</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* الموظفون */}
          <TabsContent value="staff" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>الموظفون</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                  <Input 
                    placeholder="مثال: أحمد علي - اسم الموظف" 
                    value={staffForm.name}
                    onChange={(e)=> setStaffForm(prev=> ({...prev, name: e.target.value}))}
                  />
                  <Select 
                    value={staffForm.department}
                    onValueChange={(value)=> setStaffForm(prev=> ({...prev, department: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={departments.length ? "اختر القسم" : "لا توجد أقسام تشغيلية"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled={!departments.length}>اختر القسم</SelectItem>
                      {Array.from(new Set(departments.map((d)=> d.name))).map((name, idx)=> (
                        <SelectItem key={idx} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input 
                    placeholder="مثال: 500 كجم/يوم - البطاقة التشغيلية" 
                    value={staffForm.operational_card}
                    onChange={(e)=> setStaffForm(prev=> ({...prev, operational_card: e.target.value}))}
                  />
                  <Input 
                    placeholder="مثال: 0501234567 - رقم هاتف الموظف" 
                    value={staffForm.phone}
                    onChange={(e)=> setStaffForm(prev=> ({...prev, phone: e.target.value}))}
                  />
                  <Input 
                    placeholder="مثال: عامل فرز - الوظيفة" 
                    value={staffForm.role}
                    onChange={(e)=> setStaffForm(prev=> ({...prev, role: e.target.value}))}
                  />
                  <Button type="button" onClick={()=>{
                    const { name, department, operational_card, phone, role } = staffForm;
                    if (!name.trim()) {
                      toast.error('يرجى إدخال اسم الموظف');
                      return;
                    }
                    if (!departments.length) {
                      toast.warning('لا توجد أقسام تشغيلية بعد — أضف قسماً أولاً من تبويب الأقسام التشغيلية');
                      return;
                    }
                    if (!department || department === 'none') {
                      toast.error('يرجى اختيار القسم التابع له الموظف');
                      return;
                    }
                    setStaff(prev=>[...prev,{ name: name.trim(), department, operational_card: operational_card.trim(), phone: phone.trim(), role: role.trim() }]);
                    setStaffForm({ name: '', department: '', operational_card: '', phone: '', role: '' });
                    toast.success('تم إضافة الموظف');
                  }}>➕ إضافة موظف</Button>
                </div>
                <div className="space-y-2">
                  {staff.map((s,idx)=> (
                    <div key={idx} className="flex justify-between items-center border rounded p-2 text-sm">
                      <div>{s.name} — {s.department} — {s.operational_card} — {s.phone} — {s.role}</div>
                      <Button type="button" variant="outline" onClick={()=>setStaff(staff.filter((_,i)=>i!==idx))}>حذف</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* المعدات - والتجهيزات */}
          <TabsContent value="equipment" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>المعدات - والتجهيزات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="machines">
                  <TabsList>
                    <TabsTrigger value="machines">المعدات</TabsTrigger>
                    <TabsTrigger value="fixtures">التجهيزات</TabsTrigger>
                  </TabsList>

                  <TabsContent value="machines" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      <Input placeholder="مثال: سير فرز - اسم المعدة" id="eq-name" />
                      <Input placeholder="مثال: 2 - الكمية المتاحة" type="number" id="eq-qty" />
                      <Input placeholder="مثال: جيد - حالة المعدة" id="eq-status" />
                      <Input placeholder="مثال: فرز البلاستيك - نوع الاستخدام" id="eq-usage" />
                      <Button type="button" onClick={()=>{
                        const name = (document.getElementById('eq-name') as HTMLInputElement).value.trim();
                        if (!name) return;
                        const quantity = parseInt((document.getElementById('eq-qty') as HTMLInputElement).value || '1');
                        const status = (document.getElementById('eq-status') as HTMLInputElement).value.trim();
                        const usage_type = (document.getElementById('eq-usage') as HTMLInputElement).value.trim();
                        setEquipment(prev=>[...prev,{ name, quantity: isNaN(quantity)?1:quantity, status, usage_type }]);
                        (document.getElementById('eq-name') as HTMLInputElement).value='';
                        (document.getElementById('eq-qty') as HTMLInputElement).value='';
                        (document.getElementById('eq-status') as HTMLInputElement).value='';
                        (document.getElementById('eq-usage') as HTMLInputElement).value='';
                      }}>➕ إضافة معدة</Button>
                    </div>
                    <div className="space-y-2">
                      {equipment.map((eq,idx)=> (
                        <div key={idx} className="flex justify-between items-center border rounded p-2 text-sm">
                          <div>{eq.name} — {eq.quantity} — {eq.status} — {eq.usage_type}</div>
                          <Button type="button" variant="outline" onClick={()=>setEquipment(equipment.filter((_,i)=>i!==idx))}>حذف</Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="fixtures" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      <Input placeholder="مثال: مكتب - اسم التجهيز" id="fx-name" />
                      <Input placeholder="مثال: 4 - الكمية" type="number" id="fx-qty" />
                      <Input placeholder="مثال: جيد - الحالة" id="fx-status" />
                      <Input placeholder="مثال: مكتب/كمبيوتر/كرسي" id="fx-type" />
                      <Button type="button" onClick={()=>{
                        const name = (document.getElementById('fx-name') as HTMLInputElement).value.trim();
                        if (!name) return;
                        const quantity = parseInt((document.getElementById('fx-qty') as HTMLInputElement).value || '1');
                        const status = (document.getElementById('fx-status') as HTMLInputElement).value.trim();
                        const usage_type = (document.getElementById('fx-type') as HTMLInputElement).value.trim() || 'fixture';
                        setFixtures(prev=>[...prev,{ name, quantity: isNaN(quantity)?1:quantity, status, usage_type }]);
                        (document.getElementById('fx-name') as HTMLInputElement).value='';
                        (document.getElementById('fx-qty') as HTMLInputElement).value='';
                        (document.getElementById('fx-status') as HTMLInputElement).value='';
                        (document.getElementById('fx-type') as HTMLInputElement).value='';
                      }}>➕ إضافة تجهيز</Button>
                    </div>
                    <div className="space-y-2">
                      {fixtures.map((fx,idx)=> (
                        <div key={idx} className="flex justify-between items-center border rounded p-2 text-sm">
                          <div>{fx.name} — {fx.quantity} — {fx.status} — {fx.usage_type}</div>
                          <Button type="button" variant="outline" onClick={()=>setFixtures(fixtures.filter((_,i)=>i!==idx))}>حذف</Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* وسائل النقل */}
          <TabsContent value="vehicles" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>وسائل النقل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <Input placeholder="مثال: شاحنة صغيرة - نوع الناقلة" id="vh-type" />
                  <Input placeholder="مثال: 2 - العدد المتاح" type="number" id="vh-count" />
                  <Input placeholder="مثال: 1.5 طن - السعة" id="vh-capacity" />
                  <Input placeholder="مثال: جيدة - حالة الناقلة" id="vh-status" />
                  <Button type="button" onClick={()=>{
                    const vehicle_type = (document.getElementById('vh-type') as HTMLInputElement).value.trim();
                    if (!vehicle_type) return;
                    const count = parseInt((document.getElementById('vh-count') as HTMLInputElement).value || '1');
                    const capacity = (document.getElementById('vh-capacity') as HTMLInputElement).value.trim();
                    const status = (document.getElementById('vh-status') as HTMLInputElement).value.trim();
                    setVehicles(prev=>[...prev,{ vehicle_type, count: isNaN(count)?1:count, capacity, status }]);
                    (document.getElementById('vh-type') as HTMLInputElement).value='';
                    (document.getElementById('vh-count') as HTMLInputElement).value='';
                    (document.getElementById('vh-capacity') as HTMLInputElement).value='';
                    (document.getElementById('vh-status') as HTMLInputElement).value='';
                  }}>➕ إضافة ناقلة</Button>
                </div>
                <div className="space-y-2">
                  {vehicles.map((v,idx)=> (
                    <div key={idx} className="flex justify-between items-center border rounded p-2 text-sm">
                      <div>{v.vehicle_type} — {v.count} — {v.capacity} — {v.status}</div>
                      <Button type="button" variant="outline" onClick={()=>setVehicles(vehicles.filter((_,i)=>i!==idx))}>حذف</Button>
                    </div>
                  ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6 space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              إلغاء
            </Button>
            <Button type="submit">
              {editId ? 'حفظ التعديلات' : 'إنشاء المخزن'}
            </Button>
          </div>
        </form>
      </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}

export default function NewWarehousePage() {
  return (
    <Suspense fallback={<div>جاري التحميل...</div>}>
      <NewWarehouseForm />
    </Suspense>
  );
}
