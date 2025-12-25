'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Checkbox } from '@/shared/ui/checkbox';
import { FiPlus, FiTrash2, FiCode, FiPrinter, FiSearch } from 'react-icons/fi';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { qrCodeService } from '@/services/qrCodeService';
import { wasteCatalogService } from '@/services/wasteCatalogService';
import { Wizard } from '@/shared/components/Wizard';

// سيتم تحميل البيانات من قاعدة البيانات




const qualityGrades = [
  { id: 'A', name: 'A - جودة ممتازة', description: 'نظيف، مفروز، قابل للبيع مباشرة' },
  { id: 'B', name: 'B - جودة جيدة', description: 'يحتاج فرز بسيط' },
  { id: 'C', name: 'C - جودة مقبولة', description: 'يحتاج معالجة' },
  { id: 'D', name: 'D - جودة ضعيفة', description: 'قيمة منخفضة' }
];

const sortingStatuses = [
  'لم يتم الفرز بعد',
  'قيد الفرز',
  'تم الفرز',
  'جاهز للبيع'
];

const contaminationLevels = [
  'نظيف',
  'تلوث خفيف',
  'تلوث متوسط',
  'تلوث شديد'
];

const disposalMethods = [
  'إتلاف في موقع مرخص',
  'دفن صحي',
  'حرق آمن',
  'معالجة كيميائية',
  'أخرى'
];

const mockWasteStatuses = [
  { id: 'waiting', name: 'في الانتظار', color: '🟡' },
  { id: 'sorting', name: 'قيد الفرز', color: '🔵' },
  { id: 'ready', name: 'جاهز للبيع', color: '🟢' },
  { id: 'reserved', name: 'محجوز لشركة تدوير', color: '🟠' },
  { id: 'sold', name: 'تم البيع', color: '🟣' },
  { id: 'disposed', name: 'تم الإتلاف', color: '🔴' },
  { id: 'cancelled', name: 'ملغي', color: '⚫' }
];

interface WasteFormData {
  waste_no: string;
  warehouse_id: number | null;
  registration_date: string;
  source: string; // للتوافق الخلفي
  // الحقول الجديدة للنظام المحسن
  sector_id: number | null;
  client_type_id: number | null;
  source_code: string;
  reason_id: number | null;
  related_product_id: number | null;
  main_category_id: number | null;
  sub_category_id: number | null;
  plastic_type_id: number | null;
  metal_type_id: number | null;
  plastic_code: string;
  plastic_shape: string;
  plastic_color: string;
  plastic_cleanliness: string;
  plastic_hardness: string;
  metal_shape: string;
  metal_condition: string;
  paper_type: string;
  paper_condition: string;
  paper_print_type: string;
  glass_type: string;
  glass_shape: string;
  fabric_type: string;
  fabric_condition: string;
  fabric_cut_type: string;
  unit_mode: 'weight' | 'volume' | 'count' | 'dimension';
  weight: number | null;
  volume: number | null;
  count: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  recyclable: boolean;
  quality_grade: string;
  impurities_percent: number | null;
  sorting_status: string;
  contamination_level: string;
  disposal_reason: string;
  disposal_method: string;
  expected_price: number | null;
  expected_total: number | null;
  temp_location: string;
  rack_row_col: string;
  storage_conditions: string;
  stackable: boolean;
  max_stack_height: number | null;
  max_storage_days: number | null;
  alert_on_exceed: boolean;
  status: string;
  images: File[];
  documents: File[];
  notes: string;
  qr_code: string;
  emergency_flags: {
    urgent_processing: boolean;
    special_approvals: boolean;
    health_hazard: boolean;
    environmental_hazard: boolean;
  };
  // حقول إدارة المخازن الجديدة
  is_returnable_after_sorting: boolean; // قابل أن يكون مرتجع بعد الفرز أم لا
  initial_sorting_from_supplier: string; // الفرز الأولى من المورد
  initial_sorting_percentage: number; // نسبة الفرز الأولى من المورد
  pollution_percentage: number; // نسبة مستوى التلوث
}

export default function WasteCatalogFormWizard() {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<WasteFormData>({
    waste_no: '',
    warehouse_id: null,
    registration_date: new Date().toISOString().split('T')[0],
    source: '', // للتوافق الخلفي
    // الحقول الجديدة
    sector_id: null,
    client_type_id: null,
    source_code: '',
    reason_id: null,
    related_product_id: null,
    main_category_id: null,
    sub_category_id: null,
    plastic_type_id: null,
    metal_type_id: null,
    plastic_code: '',
    plastic_shape: '',
    plastic_color: '',
    plastic_cleanliness: '',
    plastic_hardness: '',
    metal_shape: '',
    metal_condition: '',
    paper_type: '',
    paper_condition: '',
    paper_print_type: '',
    glass_type: '',
    glass_shape: '',
    fabric_type: '',
    fabric_condition: '',
    fabric_cut_type: '',
    unit_mode: 'weight',
    weight: null,
    volume: null,
    count: null,
    length: null,
    width: null,
    height: null,
    recyclable: true,
    quality_grade: '',
    impurities_percent: null,
    sorting_status: '',
    contamination_level: '',
    disposal_reason: '',
    disposal_method: '',
    expected_price: null,
    expected_total: null,
    temp_location: '',
    rack_row_col: '',
    storage_conditions: '',
    stackable: false,
    max_stack_height: null,
    max_storage_days: null,
    alert_on_exceed: false,
    status: 'waiting',
    images: [],
    documents: [],
    notes: '',
    qr_code: '',
    emergency_flags: {
      urgent_processing: false,
      special_approvals: false,
      health_hazard: false,
      environmental_hazard: false
    },
    // القيم الافتراضية للحقول الجديدة
    is_returnable_after_sorting: false,
    initial_sorting_from_supplier: '',
    initial_sorting_percentage: 0,
    pollution_percentage: 0
  });

  const [showPlasticDialog, setShowPlasticDialog] = useState(false);
  const [showMetalDialog, setShowMetalDialog] = useState(false);
  const [showPaperDialog, setShowPaperDialog] = useState(false);
  const [showGlassDialog, setShowGlassDialog] = useState(false);
  const [showFabricDialog, setShowFabricDialog] = useState(false);
  const [showMainCategoryDialog, setShowMainCategoryDialog] = useState(false);
  const [showSubCategoryDialog, setShowSubCategoryDialog] = useState(false);
  const [newWasteMainCategory, setNewWasteMainCategory] = useState({ code: '', name: '' });
  const [newWasteSubCategory, setNewWasteSubCategory] = useState({ code: '', name: '', main_id: null as number | null });

  // حوارات النظام الجديد
  const [showSectorDialog, setShowSectorDialog] = useState(false);
  const [showClientTypeDialog, setShowClientTypeDialog] = useState(false);
  const [showWasteSourceDialog, setShowWasteSourceDialog] = useState(false);
  const [showSourceReasonDialog, setShowSourceReasonDialog] = useState(false);
  const [newSector, setNewSector] = useState({ name: '', description: '' });
  const [newClientType, setNewClientType] = useState({ name: '', description: '' });
  const [newWasteSource, setNewWasteSource] = useState({ id: '', name: '', description: '' });
  const [newSourceReason, setNewSourceReason] = useState({ name: '', description: '' });

  // البيانات المحملة من قاعدة البيانات
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
  const [wasteMainCategories, setWasteMainCategories] = useState<{ id: number; code: string; name: string }[]>([]);
  const [wasteSubCategories, setWasteSubCategories] = useState<{ id: number; code: string; name: string; main_id: number }[]>([]);
  const [units, setUnits] = useState<{ id: number; name: string; symbol: string }[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // البيانات الجديدة للنظام المحسن
  const [sectors, setSectors] = useState<{ id: number; name: string; description?: string }[]>([]);
  const [clientTypes, setClientTypes] = useState<{ id: number; sector_id: number; name: string; description?: string }[]>([]);
  const [availableSources, setAvailableSources] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [availableReasons, setAvailableReasons] = useState<{ id: number; name: string; description?: string }[]>([]);

  const [newPlasticType, setNewPlasticType] = useState({ code: '', name: '', description: '' });
  const [newMetalType, setNewMetalType] = useState({ name: '' });
  const [newPaperType, setNewPaperType] = useState({ name: '' });
  const [newGlassType, setNewGlassType] = useState({ name: '' });
  const [newFabricType, setNewFabricType] = useState({ name: '' });
  const [newMainCategory, setNewMainCategory] = useState({ code: '', name: '' });
  const [newSubCategory, setNewSubCategory] = useState({ code: '', name: '' });

  // تحميل البيانات من قاعدة البيانات
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsDataLoading(true);
        
        // تحميل المخازن
        const warehousesData = await wasteCatalogService.getWarehouses();
        setWarehouses(warehousesData);
        
        // تحميل الفئات الرئيسية للمخلفات
        const wasteMainCategoriesData = await wasteCatalogService.getWasteMainCategories();
        setWasteMainCategories(wasteMainCategoriesData);
        
        // تحميل الوحدات
        const unitsData = await wasteCatalogService.getUnits();
        setUnits(unitsData);
        
        
        // تحميل البيانات الجديدة للنظام المحسن
        const sectorsData = await wasteCatalogService.getWasteSectors();
        setSectors(sectorsData);
        
      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        toast.error('حدث خطأ في تحميل البيانات');
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, []);

  // تحميل الفئات الفرعية عند تغيير الفئة الرئيسية
  useEffect(() => {
    const loadSubCategories = async () => {
      if (formData.main_category_id) {
        try {
          const subCategoriesData = await wasteCatalogService.getWasteSubCategories(formData.main_category_id);
          setWasteSubCategories(subCategoriesData);
        } catch (error) {
          console.error('خطأ في تحميل الفئات الفرعية:', error);
        }
      } else {
        setWasteSubCategories([]);
      }
    };

    loadSubCategories();
  }, [formData.main_category_id]);

  // تحميل أنواع العملاء عند تغيير القطاع
  useEffect(() => {
    const loadClientTypes = async () => {
      if (formData.sector_id) {
        try {
          const clientTypesData = await wasteCatalogService.getClientTypes(formData.sector_id);
          setClientTypes(clientTypesData);
          // إعادة تعيين نوع العميل عند تغيير القطاع
          handleFormChange('client_type_id', null);
        } catch (error) {
          console.error('خطأ في تحميل أنواع العملاء:', error);
        }
      } else {
        setClientTypes([]);
        handleFormChange('client_type_id', null);
      }
    };

    loadClientTypes();
  }, [formData.sector_id]);

  // تحميل المصادر المتاحة عند تغيير نوع العميل
  useEffect(() => {
    const loadAvailableSources = async () => {
      if (formData.sector_id && formData.client_type_id) {
        try {
          const sourcesData = await wasteCatalogService.getAvailableSources(formData.sector_id, formData.client_type_id);
          setAvailableSources(sourcesData);
          // إعادة تعيين المصدر عند تغيير نوع العميل
          handleFormChange('source_code', '');
        } catch (error) {
          console.error('خطأ في تحميل المصادر المتاحة:', error);
        }
      } else {
        setAvailableSources([]);
        handleFormChange('source_code', '');
      }
    };

    loadAvailableSources();
  }, [formData.sector_id, formData.client_type_id]);

  // تحميل الأسباب المتاحة عند تغيير المصدر
  useEffect(() => {
    const loadAvailableReasons = async () => {
      if (formData.sector_id && formData.client_type_id && formData.source_code) {
        try {
          const reasonsData = await wasteCatalogService.getAvailableReasons(
            formData.sector_id, 
            formData.client_type_id, 
            formData.source_code
          );
          setAvailableReasons(reasonsData);
          // إعادة تعيين السبب عند تغيير المصدر
          handleFormChange('reason_id', null);
        } catch (error) {
          console.error('خطأ في تحميل الأسباب المتاحة:', error);
        }
      } else {
        setAvailableReasons([]);
        handleFormChange('reason_id', null);
      }
    };

    loadAvailableReasons();
  }, [formData.sector_id, formData.client_type_id, formData.source_code]);

  // دوال الحفظ للنظام الجديد
  const handleAddSector = async () => {
    if (!newSector.name.trim()) {
      toast.error('يرجى إدخال اسم القطاع');
      return;
    }

    try {
      const result = await wasteCatalogService.addWasteSector({
        name: newSector.name.trim(),
        description: newSector.description.trim() || undefined
      });

      if (result) {
        // إضافة القطاع الجديد إلى القائمة
        setSectors(prev => [...prev, result]);
        // إعادة تعيين النموذج
        setNewSector({ name: '', description: '' });
        setShowSectorDialog(false);
        toast.success('تم إضافة القطاع بنجاح');
      }
    } catch (error) {
      console.error('خطأ في إضافة القطاع:', error);
      toast.error('حدث خطأ أثناء إضافة القطاع');
    }
  };

  const handleAddClientType = async () => {
    if (!newClientType.name.trim()) {
      toast.error('يرجى إدخال اسم نوع العميل');
      return;
    }

    if (!formData.sector_id) {
      toast.error('يرجى اختيار القطاع أولاً');
      return;
    }

    try {
      const result = await wasteCatalogService.addClientType({
        sector_id: formData.sector_id,
        name: newClientType.name.trim(),
        description: newClientType.description.trim() || undefined
      });

      if (result) {
        // إضافة نوع العميل الجديد إلى القائمة
        setClientTypes(prev => [...prev, result]);
        // إعادة تعيين النموذج
        setNewClientType({ name: '', description: '' });
        setShowClientTypeDialog(false);
        toast.success('تم إضافة نوع العميل بنجاح');
      }
    } catch (error) {
      console.error('خطأ في إضافة نوع العميل:', error);
      toast.error('حدث خطأ أثناء إضافة نوع العميل');
    }
  };

  const handleAddWasteSource = async () => {
    if (!newWasteSource.id.trim() || !newWasteSource.name.trim()) {
      toast.error('يرجى إدخال رمز واسم مصدر المخلفات');
      return;
    }

    if (!formData.sector_id || !formData.client_type_id) {
      toast.error('يرجى اختيار القطاع ونوع العميل أولاً');
      return;
    }

    try {
      const result = await wasteCatalogService.addWasteSource({
        id: newWasteSource.id.trim(),
        name: newWasteSource.name.trim(),
        description: newWasteSource.description.trim() || undefined
      });

      if (result) {
        // إضافة مصدر المخلفات الجديد إلى القائمة
        setAvailableSources(prev => [...prev, result]);
        
        // ربط المصدر الجديد بالقطاع ونوع العميل المحددين
        const linkResult = await wasteCatalogService.addSectorClientSourceReasonLink({
          sector_id: formData.sector_id,
          client_type_id: formData.client_type_id,
          source_id: result.id,
          reason_id: 1, // سبب افتراضي - يمكن تعديله لاحقاً
          priority_order: 1
        });

        if (linkResult) {
          console.log('تم ربط المصدر بالقطاع ونوع العميل');
        }
        
        // إعادة تعيين النموذج
        setNewWasteSource({ id: '', name: '', description: '' });
        setShowWasteSourceDialog(false);
        toast.success('تم إضافة مصدر المخلفات وربطه بالسياق المحدد');
      }
    } catch (error) {
      console.error('خطأ في إضافة مصدر المخلفات:', error);
      toast.error('حدث خطأ أثناء إضافة مصدر المخلفات');
    }
  };

  const handleAddSourceReason = async () => {
    if (!newSourceReason.name.trim()) {
      toast.error('يرجى إدخال اسم سبب المصدر');
      return;
    }

    if (!formData.sector_id || !formData.client_type_id || !formData.source_code) {
      toast.error('يرجى اختيار القطاع ونوع العميل والمصدر أولاً');
      return;
    }

    try {
      const result = await wasteCatalogService.addSourceReason({
        name: newSourceReason.name.trim(),
        description: newSourceReason.description.trim() || undefined
      });

      if (result) {
        // إضافة سبب المصدر الجديد إلى القائمة
        setAvailableReasons(prev => [...prev, result]);
        
        // ربط السبب الجديد بالقطاع ونوع العميل والمصدر المحددين
        const linkResult = await wasteCatalogService.addSectorClientSourceReasonLink({
          sector_id: formData.sector_id,
          client_type_id: formData.client_type_id,
          source_id: formData.source_code,
          reason_id: result.id,
          priority_order: 1
        });

        if (linkResult) {
          console.log('تم ربط السبب بالسياق المحدد');
        }
        
        // إعادة تعيين النموذج
        setNewSourceReason({ name: '', description: '' });
        setShowSourceReasonDialog(false);
        toast.success('تم إضافة سبب المصدر وربطه بالسياق المحدد');
      }
    } catch (error) {
      console.error('خطأ في إضافة سبب المصدر:', error);
      toast.error('حدث خطأ أثناء إضافة سبب المصدر');
    }
  };

  const handleFormChange = useCallback((field: keyof WasteFormData, value: string | number | boolean | File[] | null | { urgent_processing: boolean; special_approvals: boolean; health_hazard: boolean; environmental_hazard: boolean; }) => {
    console.log('تحديث الحقل:', field, 'القيمة:', value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('البيانات الجديدة:', newData);
      return newData;
    });
  }, []);

  // دالة خاصة لمعالجة النصوص
  const handleTextChange = useCallback((field: keyof WasteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const generateWasteNumber = async () => {
    try {
      const wasteNo = await wasteCatalogService.generateUniqueWasteNumber();
      handleFormChange('waste_no', wasteNo);
    } catch (error) {
      toast.error('فشل في توليد رقم المخلفات');
    }
  };

  const generateMainCategoryCode = () => {
    const code = `WC-${Date.now().toString().slice(-3)}`;
    setNewWasteMainCategory(prev => ({ ...prev, code }));
    toast.success(`تم توليد كود الفئة: ${code}`);
    return code;
  };

  const generateSubCategoryCode = () => {
    const code = `WSC-${Date.now().toString().slice(-3)}`;
    setNewWasteSubCategory(prev => ({ ...prev, code }));
    toast.success(`تم توليد كود الفئة الفرعية: ${code}`);
    return code;
  };

  const filteredSubCategories = wasteSubCategories;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const generateQR = async () => {
    try {
      if (!formData.waste_no || !formData.main_category_id) {
        toast.error('يرجى ملء رقم المخلفات والفئة الأساسية أولاً');
        return;
      }

      const qrData = qrCodeService.createWasteQRData({
        id: formData.waste_no,
        name: mockWasteMainCategories.find(c => c.id === formData.main_category_id)?.name || 'مخلفات',
        wasteNo: formData.waste_no,
        warehouse: mockWarehouses.find(w => w.id === formData.warehouse_id)?.name,
        category: mockWasteMainCategories.find(c => c.id === formData.main_category_id)?.name,
        weight: formData.weight,
        volume: formData.volume,
        count: formData.count,
        status: mockWasteStatuses.find(s => s.id === formData.status)?.name
      });

      const qrCodeImage = await qrCodeService.generateQRCodeImage(qrData);
      
      // حفظ QR Code في النموذج
      handleFormChange('qr_code', qrCodeImage);
      
      toast.success('تم توليد QR Code للمخلفات بنجاح');
    } catch (error) {
      toast.error('فشل في توليد QR Code');
    }
  };

  const printLabel = async () => {
    try {
      if (!formData.waste_no || !formData.main_category_id) {
        toast.error('يرجى ملء رقم المخلفات والفئة الأساسية أولاً');
        return;
      }

      const qrData = qrCodeService.createWasteQRData({
        id: formData.waste_no,
        name: mockWasteMainCategories.find(c => c.id === formData.main_category_id)?.name || 'مخلفات',
        wasteNo: formData.waste_no,
        warehouse: mockWarehouses.find(w => w.id === formData.warehouse_id)?.name,
        category: mockWasteMainCategories.find(c => c.id === formData.main_category_id)?.name,
        weight: formData.weight,
        volume: formData.volume,
        count: formData.count,
        status: mockWasteStatuses.find(s => s.id === formData.status)?.name
      });

      await qrCodeService.printLabel(qrData);
      toast.success('تم إرسال ملصق المخلفات للطباعة');
    } catch (error) {
      toast.error('فشل في طباعة ملصق المخلفات');
    }
  };

  const addPlasticType = () => {
    if (newPlasticType.code && newPlasticType.name) {
      // TODO: إضافة نوع البلاستيك إلى قاعدة البيانات
      toast.success(`تم إضافة نوع البلاستيك: ${newPlasticType.name}`);
      setNewPlasticType({ code: '', name: '', description: '' });
      setShowPlasticDialog(false);
    }
  };

  const addMetalType = () => {
    if (newMetalType.name.trim()) {
      // TODO: إضافة نوع المعدن إلى قاعدة البيانات
      toast.success(`تم إضافة نوع المعدن: ${newMetalType.name}`);
      setNewMetalType({ name: '' });
      setShowMetalDialog(false);
    }
  };

  const addPaperType = () => {
    if (newPaperType.name.trim()) {
      // TODO: إضافة نوع الورق إلى قاعدة البيانات
      toast.success(`تم إضافة نوع الورق: ${newPaperType.name}`);
      setNewPaperType({ name: '' });
      setShowPaperDialog(false);
    }
  };

  const addGlassType = () => {
    if (newGlassType.name.trim()) {
      // TODO: إضافة نوع الزجاج إلى قاعدة البيانات
      toast.success(`تم إضافة نوع الزجاج: ${newGlassType.name}`);
      setNewGlassType({ name: '' });
      setShowGlassDialog(false);
    }
  };

  const addFabricType = () => {
    if (newFabricType.name.trim()) {
      // TODO: إضافة نوع القماش إلى قاعدة البيانات
      toast.success(`تم إضافة نوع القماش: ${newFabricType.name}`);
      setNewFabricType({ name: '' });
      setShowFabricDialog(false);
    }
  };

  const addMainCategory = () => {
    if (newMainCategory.name.trim()) {
      // TODO: إضافة الفئة الأساسية إلى قاعدة البيانات
      toast.success(`تم إضافة الفئة الأساسية: ${newMainCategory.name}`);
      setNewMainCategory({ code: '', name: '' });
      setShowMainCategoryDialog(false);
    }
  };

  const addSubCategory = () => {
    if (newSubCategory.name.trim()) {
      // TODO: إضافة الفئة الفرعية إلى قاعدة البيانات
      toast.success(`تم إضافة الفئة الفرعية: ${newSubCategory.name}`);
      setNewSubCategory({ code: '', name: '' });
      setShowSubCategoryDialog(false);
    }
  };

  const handleAddWasteMainCategory = async () => {
    if (newWasteMainCategory.name.trim() && newWasteMainCategory.code.trim()) {
      try {
        const result = await wasteCatalogService.addWasteMainCategory(newWasteMainCategory.code, newWasteMainCategory.name);
        if (result) {
          // تحديث قائمة الفئات الرئيسية للمخلفات
          setWasteMainCategories(prev => [...prev, result]);
          toast.success(`تم إضافة الفئة الأساسية: ${newWasteMainCategory.name}`);
          setNewWasteMainCategory({ code: '', name: '' });
          setShowMainCategoryDialog(false);
        }
      } catch (error) {
        toast.error('فشل في إضافة الفئة الأساسية');
      }
    }
  };

  const handleAddWasteSubCategory = async () => {
    if (newWasteSubCategory.name.trim() && newWasteSubCategory.code.trim() && newWasteSubCategory.main_id) {
      try {
        const result = await wasteCatalogService.addWasteSubCategory(newWasteSubCategory.code, newWasteSubCategory.name, newWasteSubCategory.main_id);
        if (result) {
          // تحديث قائمة الفئات الفرعية للمخلفات
          setWasteSubCategories(prev => [...prev, result]);
          toast.success(`تم إضافة الفئة الفرعية: ${newWasteSubCategory.name}`);
          setNewWasteSubCategory({ code: '', name: '', main_id: null });
          setShowSubCategoryDialog(false);
        }
      } catch (error) {
        toast.error('فشل في إضافة الفئة الفرعية');
      }
    }
  };

  const canGoNext = () => {
    // تم نقل منطق التحقق إلى مكون Wizard
    return true;
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const wasteData: Omit<WasteCatalogItem, 'id' | 'created_at'> = {
        waste_no: formData.waste_no,
        warehouse_id: formData.warehouse_id,
        registration_date: formData.registration_date,
        source: formData.source_code || formData.source || undefined,
        // الحقول الجديدة للنظام المحسن
        sector_id: formData.sector_id || undefined,
        client_type_id: formData.client_type_id || undefined,
        source_code: formData.source_code || undefined,
        reason_id: formData.reason_id || undefined,
        related_product_id: formData.related_product_id || undefined,
        main_category_id: formData.main_category_id || undefined,
        sub_category_id: formData.sub_category_id || undefined,
        plastic_type_id: formData.plastic_type_id || undefined,
        metal_type_id: formData.metal_type_id || undefined,
        plastic_code: formData.plastic_code || undefined,
        plastic_shape: formData.plastic_shape || undefined,
        plastic_color: formData.plastic_color || undefined,
        plastic_cleanliness: formData.plastic_cleanliness || undefined,
        plastic_hardness: formData.plastic_hardness || undefined,
        metal_shape: formData.metal_shape || undefined,
        metal_condition: formData.metal_condition || undefined,
        paper_type: formData.paper_type || undefined,
        paper_condition: formData.paper_condition || undefined,
        paper_print_type: formData.paper_print_type || undefined,
        glass_type: formData.glass_type || undefined,
        glass_shape: formData.glass_shape || undefined,
        fabric_type: formData.fabric_type || undefined,
        fabric_condition: formData.fabric_condition || undefined,
        fabric_cut_type: formData.fabric_cut_type || undefined,
        unit_mode: formData.unit_mode,
        unit_id: formData.unit_id || undefined,
        weight: formData.weight || undefined,
        volume: formData.volume || undefined,
        count: formData.count || undefined,
        length: formData.length || undefined,
        width: formData.width || undefined,
        height: formData.height || undefined,
        recyclable: formData.recyclable || false,
        quality_grade: formData.quality_grade || undefined,
        impurities_percent: formData.impurities_percent || undefined,
        sorting_status: formData.sorting_status || undefined,
        contamination_level: formData.contamination_level || undefined,
        disposal_reason: formData.disposal_reason || undefined,
        disposal_method: formData.disposal_method || undefined,
        expected_price: formData.expected_price || undefined,
        expected_total: formData.expected_total || undefined,
        temp_location: formData.temp_location || undefined,
        rack_row_col: formData.rack_row_col || undefined,
        storage_conditions: formData.storage_conditions || undefined,
        stackable: formData.stackable || false,
        max_stack_height: formData.max_stack_height || undefined,
        max_storage_days: formData.max_storage_days || undefined,
        alert_on_exceed: formData.alert_on_exceed || false,
        status: formData.status || 'waiting',
        images: [], // TODO: رفع الصور إلى Supabase Storage
        documents: [], // TODO: رفع المستندات إلى Supabase Storage
        notes: formData.notes || undefined,
        emergency_flags: formData.emergency_flags
      };

      const result = await wasteCatalogService.addWaste(wasteData);
      
      if (result) {
        // إعادة تعيين النموذج
        setFormData({
          waste_no: '',
          warehouse_id: null,
          registration_date: new Date().toISOString().split('T')[0],
          source: '',
          // الحقول الجديدة
          sector_id: null,
          client_type_id: null,
          source_code: '',
          reason_id: null,
          related_product_id: null,
          main_category_id: null,
          sub_category_id: null,
          plastic_type_id: null,
          metal_type_id: null,
          plastic_code: '',
          plastic_shape: '',
          plastic_color: '',
          plastic_cleanliness: '',
          plastic_hardness: '',
          metal_shape: '',
          metal_condition: '',
          paper_type: '',
          paper_condition: '',
          paper_print_type: '',
          glass_type: '',
          glass_shape: '',
          fabric_type: '',
          fabric_condition: '',
          fabric_cut_type: '',
          unit_mode: 'weight',
          weight: null,
          volume: null,
          count: null,
          length: null,
          width: null,
          height: null,
          recyclable: true,
          quality_grade: '',
          impurities_percent: null,
          sorting_status: '',
          contamination_level: '',
          disposal_reason: '',
          disposal_method: '',
          expected_price: null,
          expected_total: null,
          temp_location: '',
          rack_row_col: '',
          storage_conditions: '',
          stackable: false,
          max_stack_height: null,
          max_storage_days: null,
          alert_on_exceed: false,
          status: 'waiting',
          images: [],
          documents: [],
          notes: '',
          emergency_flags: {
            urgent_processing: false,
            special_approvals: false,
            health_hazard: false,
            environmental_hazard: false
          }
        });
        setCurrentStep(0);
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ المخلفات');
    } finally {
      setIsLoading(false);
    }
  };

  // مكونات الخطوات الجديدة للنظام المحسن
  const SectorClientStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="sector">القطاع</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSectorDialog(true)}
              className="h-8 px-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              إضافة قطاع
            </Button>
          </div>
          <Select
            value={formData.sector_id?.toString() || ''}
            onValueChange={(value) => {
              handleFormChange('sector_id', Number(value));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر القطاع" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map(sector => (
                <SelectItem key={sector.id} value={sector.id.toString()}>
                  <div className="flex flex-col">
                    <span>{sector.name}</span>
                    {sector.description && (
                      <span className="text-xs text-gray-500">{sector.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="client_type">نوع العميل</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowClientTypeDialog(true)}
              disabled={!formData.sector_id}
              className="h-8 px-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              إضافة نوع
            </Button>
          </div>
          <Select
            value={formData.client_type_id?.toString() || ''}
            onValueChange={(value) => handleFormChange('client_type_id', Number(value))}
            disabled={!formData.sector_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع العميل" />
            </SelectTrigger>
            <SelectContent>
              {clientTypes.map(clientType => (
                <SelectItem key={clientType.id} value={clientType.id.toString()}>
                  <div className="flex flex-col">
                    <span>{clientType.name}</span>
                    {clientType.description && (
                      <span className="text-xs text-gray-500">{clientType.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const SourceReasonStep = () => (
    <div className="space-y-4">
      {/* عرض معلومات القطاع ونوع العميل المختارين */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">السياق المحدد:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">القطاع:</span>
            <span className="mr-2 text-blue-600">
              {sectors.find(s => s.id === formData.sector_id)?.name || 'غير محدد'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">نوع العميل:</span>
            <span className="mr-2 text-blue-600">
              {clientTypes.find(c => c.id === formData.client_type_id)?.name || 'غير محدد'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="source_code">مصدر المخلفات</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowWasteSourceDialog(true)}
              className="h-8 px-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              إضافة مصدر
            </Button>
          </div>
          <Select
            value={formData.source_code}
            onValueChange={(value) => {
              handleFormChange('source_code', value);
              handleFormChange('source', value); // للتوافق الخلفي
            }}
            disabled={!formData.sector_id || !formData.client_type_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر مصدر المخلفات" />
            </SelectTrigger>
            <SelectContent>
              {availableSources.map((source, index) => (
                <SelectItem key={`source-${source.id}-${index}`} value={source.id}>
                  <div className="flex flex-col">
                    <span>{source.name}</span>
                    {source.description && (
                      <span className="text-xs text-gray-500">{source.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {availableSources.length === 0 && formData.sector_id && formData.client_type_id && (
            <p className="text-sm text-gray-500 mt-1">
              لا توجد مصادر متاحة لهذا القطاع ونوع العميل. اضغط "إضافة مصدر" لإضافة مصدر جديد.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="reason_id">سبب المصدر</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSourceReasonDialog(true)}
              disabled={!formData.source_code}
              className="h-8 px-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              إضافة سبب
            </Button>
          </div>
          <Select
            value={formData.reason_id?.toString() || ''}
            onValueChange={(value) => handleFormChange('reason_id', Number(value))}
            disabled={!formData.source_code}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر سبب المصدر" />
            </SelectTrigger>
            <SelectContent>
              {availableReasons.map((reason, index) => (
                <SelectItem key={`reason-${reason.id}-${index}`} value={reason.id.toString()}>
                  <div className="flex flex-col">
                    <span>{reason.name}</span>
                    {reason.description && (
                      <span className="text-xs text-gray-500">{reason.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {availableReasons.length === 0 && formData.source_code && (
            <p className="text-sm text-gray-500 mt-1">
              لا توجد أسباب متاحة لهذا المصدر. اضغط "إضافة سبب" لإضافة سبب جديد.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // مكونات الخطوات
  const BasicInfoStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="waste_no">رقم المخلفات</Label>
          <div className="flex gap-2">
            <Input
              id="waste_no"
              value={formData.waste_no}
              onChange={(e) => handleFormChange('waste_no', e.target.value)}
              placeholder="WASTE-2025-0001"
            />
            <Button onClick={generateWasteNumber} variant="outline">
              توليد
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="warehouse">اسم المخزن</Label>
          <Select
            value={formData.warehouse_id?.toString() || ''}
            onValueChange={(value) => handleFormChange('warehouse_id', Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر المخزن" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map(warehouse => (
                <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="registration_date">تاريخ تسجيل المخلفات</Label>
          <Input
            id="registration_date"
            type="date"
            value={formData.registration_date}
            onChange={(e) => handleFormChange('registration_date', e.target.value)}
          />
        </div>

      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="related_product"
          checked={!!formData.related_product_id}
          onCheckedChange={(checked) => {
            if (!checked) {
              handleFormChange('related_product_id', null);
            }
          }}
        />
        <Label htmlFor="related_product">المخلفات مرتبطة بمنتج معين</Label>
      </div>

      {formData.related_product_id && (
        <div>
          <Label htmlFor="product_search">البحث عن المنتج</Label>
          <div className="flex gap-2">
            <Input
              id="product_search"
              placeholder="اسم المنتج أو SKU"
            />
            <Button variant="outline">
              <FiSearch />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const CategoryStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="main_category">الفئة الأساسية</Label>
          <div className="flex gap-2">
            <Select
              value={formData.main_category_id?.toString() || ''}
              onValueChange={(value) => handleFormChange('main_category_id', Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة الأساسية" />
              </SelectTrigger>
              <SelectContent>
                {wasteMainCategories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowMainCategoryDialog(true)} variant="outline">
              <FiPlus />
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="sub_category">الفئة الفرعية</Label>
          <div className="flex gap-2">
            <Select
              value={formData.sub_category_id?.toString() || ''}
              onValueChange={(value) => handleFormChange('sub_category_id', Number(value))}
              disabled={!formData.main_category_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة الفرعية" />
              </SelectTrigger>
              <SelectContent>
                {filteredSubCategories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowSubCategoryDialog(true)} variant="outline">
              <FiPlus />
            </Button>
          </div>
        </div>
      </div>

      {/* تفاصيل البلاستيك */}
      {formData.main_category_id === 1 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-3">تفاصيل البلاستيك</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plastic_type">نوع البلاستيك</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.plastic_type_id?.toString() || ''}
                  onValueChange={(value) => handleFormChange('plastic_type_id', Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع البلاستيك" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPlasticTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name} - {type.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowPlasticDialog(true)} variant="outline">
                  <FiPlus />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="plastic_code">الرمز الدولي</Label>
              <Input
                id="plastic_code"
                value={formData.plastic_code}
                onChange={(e) => handleFormChange('plastic_code', e.target.value)}
                placeholder="1-7"
              />
            </div>

            <div>
              <Label htmlFor="plastic_shape">شكل البلاستيك</Label>
              <Select
                value={formData.plastic_shape}
                onValueChange={(value) => handleFormChange('plastic_shape', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="عبوات">عبوات</SelectItem>
                  <SelectItem value="أغطية">أغطية</SelectItem>
                  <SelectItem value="أكياس">أكياس</SelectItem>
                  <SelectItem value="صناديق">صناديق</SelectItem>
                  <SelectItem value="أنابيب">أنابيب</SelectItem>
                  <SelectItem value="أخرى">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="plastic_color">لون البلاستيك</Label>
              <Select
                value={formData.plastic_color}
                onValueChange={(value) => handleFormChange('plastic_color', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر اللون" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="شفاف">شفاف</SelectItem>
                  <SelectItem value="أبيض">أبيض</SelectItem>
                  <SelectItem value="ملون">ملون</SelectItem>
                  <SelectItem value="أسود">أسود</SelectItem>
                  <SelectItem value="مختلط">مختلط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="plastic_cleanliness">حالة النظافة</Label>
              <Select
                value={formData.plastic_cleanliness}
                onValueChange={(value) => handleFormChange('plastic_cleanliness', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="نظيف">نظيف</SelectItem>
                  <SelectItem value="يحتاج غسيل">يحتاج غسيل</SelectItem>
                  <SelectItem value="ملوث">ملوث</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="plastic_hardness">الصلابة</Label>
              <Select
                value={formData.plastic_hardness}
                onValueChange={(value) => handleFormChange('plastic_hardness', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصلابة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="صلب">صلب</SelectItem>
                  <SelectItem value="مرن">مرن</SelectItem>
                  <SelectItem value="رغوي">رغوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* تفاصيل المعادن */}
      {formData.main_category_id === 2 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-3">تفاصيل المعادن</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="metal_type">نوع المعدن</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.metal_type_id?.toString() || ''}
                  onValueChange={(value) => handleFormChange('metal_type_id', Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المعدن" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockMetalTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowMetalDialog(true)} variant="outline">
                  <FiPlus />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="metal_shape">شكل المعدن</Label>
              <Select
                value={formData.metal_shape}
                onValueChange={(value) => handleFormChange('metal_shape', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الشكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="علب">علب</SelectItem>
                  <SelectItem value="أغطية">أغطية</SelectItem>
                  <SelectItem value="أسلاك">أسلاك</SelectItem>
                  <SelectItem value="صفائح">صفائح</SelectItem>
                  <SelectItem value="قطع">قطع</SelectItem>
                  <SelectItem value="خردة">خردة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="metal_condition">حالة المعدن</Label>
              <Select
                value={formData.metal_condition}
                onValueChange={(value) => handleFormChange('metal_condition', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="نظيف">نظيف</SelectItem>
                  <SelectItem value="صدأ">صدأ</SelectItem>
                  <SelectItem value="مطلي">مطلي</SelectItem>
                  <SelectItem value="مختلط">مختلط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const QuantityStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="unit_mode">نظام الوحدة</Label>
        <Select
          value={formData.unit_mode}
          onValueChange={(value: 'weight' | 'volume' | 'count' | 'dimension') => handleFormChange('unit_mode', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر نظام الوحدة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weight">⚖️ بالوزن (كجم/طن)</SelectItem>
            <SelectItem value="volume">📏 بالحجم (م³/لتر)</SelectItem>
            <SelectItem value="count">🔢 بالعدد (قطعة)</SelectItem>
            <SelectItem value="dimension">📐 بالقياس (طول × عرض × ارتفاع)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.unit_mode === 'weight' && (
        <div>
          <Label htmlFor="weight">الوزن (كجم)</Label>
          <Input
            id="weight"
            type="number"
            value={formData.weight || ''}
            onChange={(e) => handleFormChange('weight', Number(e.target.value))}
            placeholder="الوزن"
          />
        </div>
      )}

      {formData.unit_mode === 'volume' && (
        <div>
          <Label htmlFor="volume">الحجم (م³)</Label>
          <Input
            id="volume"
            type="number"
            value={formData.volume || ''}
            onChange={(e) => handleFormChange('volume', Number(e.target.value))}
            placeholder="الحجم"
          />
        </div>
      )}

      {formData.unit_mode === 'count' && (
        <div>
          <Label htmlFor="count">العدد (قطعة)</Label>
          <Input
            id="count"
            type="number"
            value={formData.count || ''}
            onChange={(e) => handleFormChange('count', Number(e.target.value))}
            placeholder="العدد"
          />
        </div>
      )}

      {formData.unit_mode === 'dimension' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="length">الطول (متر)</Label>
            <Input
              id="length"
              type="number"
              value={formData.length || ''}
              onChange={(e) => handleFormChange('length', Number(e.target.value))}
              placeholder="الطول"
            />
          </div>
          <div>
            <Label htmlFor="width">العرض (متر)</Label>
            <Input
              id="width"
              type="number"
              value={formData.width || ''}
              onChange={(e) => handleFormChange('width', Number(e.target.value))}
              placeholder="العرض"
            />
          </div>
          <div>
            <Label htmlFor="height">الارتفاع (متر)</Label>
            <Input
              id="height"
              type="number"
              value={formData.height || ''}
              onChange={(e) => handleFormChange('height', Number(e.target.value))}
              placeholder="الارتفاع"
            />
          </div>
        </div>
      )}
    </div>
  );

  const RecyclingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="recyclable"
          checked={formData.recyclable}
          onCheckedChange={(checked) => handleFormChange('recyclable', checked)}
        />
        <Label htmlFor="recyclable">قابل لإعادة التدوير</Label>
      </div>

      {formData.recyclable ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="quality_grade">درجة الجودة</Label>
            <Select
              value={formData.quality_grade}
              onValueChange={(value) => handleFormChange('quality_grade', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر درجة الجودة" />
              </SelectTrigger>
              <SelectContent>
                {qualityGrades.map(grade => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="impurities_percent">نسبة الشوائب (%)</Label>
            <Input
              id="impurities_percent"
              type="number"
              min="0"
              max="100"
              value={formData.impurities_percent || ''}
              onChange={(e) => handleFormChange('impurities_percent', Number(e.target.value))}
              placeholder="0-100"
            />
          </div>

          <div>
            <Label htmlFor="sorting_status">حالة الفرز</Label>
            <Select
              value={formData.sorting_status}
              onValueChange={(value) => handleFormChange('sorting_status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر حالة الفرز" />
              </SelectTrigger>
              <SelectContent>
                {sortingStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contamination_level">مستوى التلوث</Label>
            <Select
              value={formData.contamination_level}
              onValueChange={(value) => handleFormChange('contamination_level', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر مستوى التلوث" />
              </SelectTrigger>
              <SelectContent>
                {contaminationLevels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="disposal_reason">سبب عدم قابلية التدوير</Label>
            <Textarea
              id="disposal_reason"
              value={formData.disposal_reason}
              onChange={(e) => handleFormChange('disposal_reason', e.target.value)}
              placeholder="مثل: ملوث بمواد خطرة، مختلط غير قابل للفصل..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="disposal_method">طريقة التخلص</Label>
            <Select
              value={formData.disposal_method}
              onValueChange={(value) => handleFormChange('disposal_method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر طريقة التخلص" />
              </SelectTrigger>
              <SelectContent>
                {disposalMethods.map(method => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* حقول إدارة المخازن الجديدة */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_returnable_after_sorting"
            checked={formData.is_returnable_after_sorting}
            onCheckedChange={(checked) => handleFormChange('is_returnable_after_sorting', checked)}
          />
          <Label htmlFor="is_returnable_after_sorting">قابل أن يكون مرتجع بعد الفرز</Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="initial_sorting_from_supplier">الفرز الأولى من المورد</Label>
            <Input
              id="initial_sorting_from_supplier"
              value={formData.initial_sorting_from_supplier}
              onChange={(e) => handleFormChange('initial_sorting_from_supplier', e.target.value)}
              placeholder="مثال: فرز يدوي، فرز آلي"
            />
          </div>
          <div>
            <Label htmlFor="initial_sorting_percentage">نسبة الفرز الأولى من المورد (%)</Label>
            <Input
              id="initial_sorting_percentage"
              type="number"
              min="0"
              max="100"
              value={formData.initial_sorting_percentage || ''}
              onChange={(e) => handleFormChange('initial_sorting_percentage', Number(e.target.value))}
              placeholder="0-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pollution_percentage">نسبة مستوى التلوث (%)</Label>
            <Input
              id="pollution_percentage"
              type="number"
              min="0"
              max="100"
              value={formData.pollution_percentage || ''}
              onChange={(e) => handleFormChange('pollution_percentage', Number(e.target.value))}
              placeholder="0-100"
            />
          </div>
          <div>
            <Label htmlFor="impurities_percent">نسبة الشوائب (%)</Label>
            <Input
              id="impurities_percent"
              type="number"
              min="0"
              max="100"
              value={formData.impurities_percent || ''}
              onChange={(e) => handleFormChange('impurities_percent', Number(e.target.value))}
              placeholder="0-100"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="status">حالة المخلفات</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleFormChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="waiting">🟡 في الانتظار</SelectItem>
            <SelectItem value="sorting">🔵 قيد الفرز</SelectItem>
            <SelectItem value="ready">🟢 جاهز للبيع</SelectItem>
            <SelectItem value="sold">✅ تم البيع</SelectItem>
            <SelectItem value="disposed">❌ تم التخلص</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const DocumentationStep = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="images">صور المخلفات</Label>
        <Input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="mt-2"
        />
      </div>

      {formData.images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {formData.images.map((file, index) => (
            <div key={index} className="relative border rounded-lg p-2">
              <div className="w-full h-32 relative">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`preview-${index}`}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => removeImage(index)}
              >
                <FiTrash2 size={12} />
              </Button>
              <div className="text-xs mt-1 truncate">{file.name}</div>
            </div>
          ))}
        </div>
      )}

      <div>
        <Label htmlFor="documents">المستندات</Label>
        <Input
          id="documents"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleDocumentUpload}
          className="mt-2"
        />
      </div>

      {formData.documents.length > 0 && (
        <div className="space-y-2">
          {formData.documents.map((file, index) => (
            <div key={index} className="flex items-center justify-between border rounded p-2">
              <span className="text-sm">{file.name}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeDocument(index)}
              >
                <FiTrash2 size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        <Button onClick={generateQR} variant="outline">
          <FiCode className="mr-2" />
          توليد QR Code
        </Button>
        <Button onClick={printLabel} variant="outline">
          <FiPrinter className="mr-2" />
          طباعة ملصق
        </Button>
      </div>

      {formData.qr_code && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold mb-3">QR Code</h4>
          <div className="flex justify-center">
            <img 
              src={formData.qr_code} 
              alt="QR Code" 
              className="w-48 h-48 border rounded"
            />
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleFormChange('notes', e.target.value)}
          placeholder="ملاحظات إضافية"
          rows={3}
        />
      </div>
    </div>
  );

  const steps = [
    {
      title: 'اختيار القطاع ونوع العميل',
      content: <SectorClientStep />,
      isValid: (data: WasteFormData) => {
        console.log('التحقق من الخطوة الأولى:', {
          sector_id: data.sector_id,
          client_type_id: data.client_type_id,
          isValid: !!(data.sector_id && data.client_type_id)
        });
        if (!data.sector_id || !data.client_type_id) {
          toast.error('يرجى اختيار القطاع ونوع العميل.');
          return false;
        }
        return true;
      }
    },
    {
      title: 'اختيار مصدر المخلفات وسببه',
      content: <SourceReasonStep />,
      isValid: (data: WasteFormData) => {
        if (!data.source_code || !data.reason_id) {
          toast.error('يرجى اختيار مصدر المخلفات وسببه.');
          return false;
        }
        return true;
      }
    },
    {
      title: 'المعلومات الأساسية',
      content: <BasicInfoStep />,
      isValid: (data: WasteFormData) => {
        if (!data.waste_no || !data.warehouse_id || !data.registration_date) {
          toast.error('يرجى ملء جميع الحقول الأساسية.');
          return false;
        }
        return true;
      }
    },
    {
      title: 'التصنيف والتفاصيل',
      content: <CategoryStep />,
      isValid: (data: WasteFormData) => {
        if (!data.main_category_id) {
          toast.error('يرجى اختيار الفئة الرئيسية.');
          return false;
        }
        return true;
      }
    },
    {
      title: 'الكمية والقياسات',
      content: <QuantityStep />,
      isValid: (data: WasteFormData) => {
        if (!data.unit_mode) {
          toast.error('يرجى اختيار نظام الوحدة.');
          return false;
        }
        return true;
      }
    },
    {
      title: 'إعادة التدوير والقيمة',
      content: <RecyclingStep />,
      isValid: (data: WasteFormData) => {
        return true;
      }
    },
    {
      title: 'التوثيق والإتمام',
      content: <DocumentationStep />,
      isValid: (data: WasteFormData) => {
        return true;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <Wizard
        steps={steps}
        formData={formData}
        onFinish={handleFinish}
        isLoading={isLoading}
      />

      {/* Dialogs - نفس Dialogs من النسخة الأصلية */}
      {/* Dialog إضافة نوع بلاستيك */}
      {showPlasticDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">إضافة نوع بلاستيك جديد</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="plastic_code">الرمز الدولي</Label>
                <Input
                  id="plastic_code"
                  value={newPlasticType.code}
                  onChange={(e) => setNewPlasticType(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="1-7"
                />
              </div>
              <div>
                <Label htmlFor="plastic_name">اسم نوع البلاستيك</Label>
                <Input
                  id="plastic_name"
                  value={newPlasticType.name}
                  onChange={(e) => setNewPlasticType(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="PET, HDPE, PVC..."
                />
              </div>
              <div>
                <Label htmlFor="plastic_description">الوصف</Label>
                <Textarea
                  id="plastic_description"
                  value={newPlasticType.description}
                  onChange={(e) => setNewPlasticType(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف نوع البلاستيك"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowPlasticDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={addPlasticType}>إضافة</Button>
            </div>
          </div>
        </div>
      )}

      {/* حوار إضافة فئة أساسية جديدة للمخلفات */}
      {showMainCategoryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">إضافة فئة أساسية جديدة للمخلفات</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="waste_main_category_code">كود الفئة</Label>
                <div className="flex gap-2">
                  <Input
                    id="waste_main_category_code"
                    value={newWasteMainCategory.code}
                    onChange={(e) => setNewWasteMainCategory(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="مثال: WC-001"
                  />
                  <Button onClick={generateMainCategoryCode} variant="outline" type="button">
                    توليد
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="waste_main_category_name">اسم الفئة</Label>
                <Input
                  id="waste_main_category_name"
                  value={newWasteMainCategory.name}
                  onChange={(e) => setNewWasteMainCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: بلاستيك"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowMainCategoryDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddWasteMainCategory}>إضافة</Button>
            </div>
          </div>
        </div>
      )}

      {/* حوار إضافة فئة فرعية جديدة للمخلفات */}
      {showSubCategoryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">إضافة فئة فرعية جديدة للمخلفات</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="waste_sub_category_main">الفئة الأساسية</Label>
                <Select value={newWasteSubCategory.main_id?.toString() || ''} onValueChange={(value) => setNewWasteSubCategory(prev => ({ ...prev, main_id: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة الأساسية" />
                  </SelectTrigger>
                  <SelectContent>
                    {wasteMainCategories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="waste_sub_category_code">كود الفئة الفرعية</Label>
                <div className="flex gap-2">
                  <Input
                    id="waste_sub_category_code"
                    value={newWasteSubCategory.code}
                    onChange={(e) => setNewWasteSubCategory(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="مثال: WSC-001"
                  />
                  <Button onClick={generateSubCategoryCode} variant="outline" type="button">
                    توليد
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="waste_sub_category_name">اسم الفئة الفرعية</Label>
                <Input
                  id="waste_sub_category_name"
                  value={newWasteSubCategory.name}
                  onChange={(e) => setNewWasteSubCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: عبوات بلاستيكية"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowSubCategoryDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddWasteSubCategory}>إضافة</Button>
            </div>
          </div>
        </div>
      )}

      {/* حوار إضافة قطاع جديد */}
      {showSectorDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة قطاع جديد</h3>
            <p className="text-sm text-gray-600 mb-4">أضف قطاع جديد للمخلفات</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sector_name">اسم القطاع</Label>
                <Input
                  id="sector_name"
                  value={newSector.name}
                  onChange={(e) => setNewSector(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: تعليمي"
                />
              </div>
              <div>
                <Label htmlFor="sector_description">الوصف (اختياري)</Label>
                <Textarea
                  id="sector_description"
                  value={newSector.description}
                  onChange={(e) => setNewSector(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للقطاع"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowSectorDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddSector}>
                إضافة القطاع
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* حوار إضافة نوع عميل جديد */}
      {showClientTypeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة نوع عميل جديد</h3>
            <p className="text-sm text-gray-600 mb-4">أضف نوع عميل جديد للقطاع المحدد</p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="client_type_name">اسم نوع العميل</Label>
                <Input
                  id="client_type_name"
                  value={newClientType.name}
                  onChange={(e) => setNewClientType(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: جامعة"
                />
              </div>
              <div>
                <Label htmlFor="client_type_description">الوصف (اختياري)</Label>
                <Textarea
                  id="client_type_description"
                  value={newClientType.description}
                  onChange={(e) => setNewClientType(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر لنوع العميل"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowClientTypeDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddClientType}>
                إضافة نوع العميل
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* حوار إضافة مصدر مخلفات جديد */}
      {showWasteSourceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة مصدر مخلفات جديد</h3>
            <p className="text-sm text-gray-600 mb-4">أضف مصدر مخلفات جديد</p>
            
            {/* عرض السياق المحدد */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="text-xs font-semibold text-blue-800 mb-1">السياق المحدد:</h4>
              <div className="text-xs text-blue-600">
                <div>القطاع: {sectors.find(s => s.id === formData.sector_id)?.name || 'غير محدد'}</div>
                <div>نوع العميل: {clientTypes.find(c => c.id === formData.client_type_id)?.name || 'غير محدد'}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="waste_source_id">رمز المصدر</Label>
                <Input
                  id="waste_source_id"
                  value={newWasteSource.id}
                  onChange={(e) => setNewWasteSource(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="مثال: association_waste"
                />
              </div>
              <div>
                <Label htmlFor="waste_source_name">اسم المصدر</Label>
                <Input
                  id="waste_source_name"
                  value={newWasteSource.name}
                  onChange={(e) => setNewWasteSource(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: مخلفات جمعية"
                />
              </div>
              <div>
                <Label htmlFor="waste_source_description">الوصف (اختياري)</Label>
                <Textarea
                  id="waste_source_description"
                  value={newWasteSource.description}
                  onChange={(e) => setNewWasteSource(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للمصدر"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowWasteSourceDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddWasteSource}>
                إضافة المصدر
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* حوار إضافة سبب مصدر جديد */}
      {showSourceReasonDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">إضافة سبب مصدر جديد</h3>
            <p className="text-sm text-gray-600 mb-4">أضف سبب مصدر جديد</p>
            
            {/* عرض السياق المحدد */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="text-xs font-semibold text-blue-800 mb-1">السياق المحدد:</h4>
              <div className="text-xs text-blue-600">
                <div>القطاع: {sectors.find(s => s.id === formData.sector_id)?.name || 'غير محدد'}</div>
                <div>نوع العميل: {clientTypes.find(c => c.id === formData.client_type_id)?.name || 'غير محدد'}</div>
                <div>المصدر: {availableSources.find(s => s.id === formData.source_code)?.name || 'غير محدد'}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="source_reason_name">اسم السبب</Label>
                <Input
                  id="source_reason_name"
                  value={newSourceReason.name}
                  onChange={(e) => setNewSourceReason(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: تنظيف دوري"
                />
              </div>
              <div>
                <Label htmlFor="source_reason_description">الوصف (اختياري)</Label>
                <Textarea
                  id="source_reason_description"
                  value={newSourceReason.description}
                  onChange={(e) => setNewSourceReason(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مختصر للسبب"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowSourceReasonDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddSourceReason}>
                إضافة السبب
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
