'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Badge } from '@/shared/ui/badge';
import { FiSearch, FiFilter, FiEye, FiEdit, FiTrash2, FiDownload, FiPrinter, FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';
import { productCatalogService, ProductCatalogItem } from '@/services/productCatalogService';
import { wasteCatalogService, WasteCatalogItem } from '@/services/wasteCatalogService';
import { qrCodeService } from '@/services/qrCodeService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import Link from 'next/link';

export default function CatalogViewPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [wasteMaterials, setWasteMaterials] = useState<WasteCatalogItem[]>([]);
  const [wasteMainCategories, setWasteMainCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null);
  const [selectedWaste, setSelectedWaste] = useState<WasteCatalogItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // فلاتر البحث
  const [productFilters, setProductFilters] = useState({
    search: '',
    category: '',
    warehouse: '',
    status: '',
    organizationLinked: 'all' as 'all' | 'yes' | 'no'
  });
  
  const [wasteFilters, setWasteFilters] = useState({
    search: '',
    category: '',
    warehouse: '',
    status: ''
  });

  // جلب البيانات
  useEffect(() => {
    loadProducts();
    loadWasteMaterials();
    loadCategories();
  }, []);

  // الاستماع لتحديثات البيانات من صفحات أخرى
  useEffect(() => {
    // الاستماع لتحديثات من نفس النافذة
    const handleCustomEvent = () => {
      console.log('🔄 تحديث قائمة المخلفات بعد إضافة جديدة...');
      loadWasteMaterials();
      loadProducts();
    };
    
    window.addEventListener('wasteCatalogUpdated', handleCustomEvent);
    window.addEventListener('productCatalogUpdated', handleCustomEvent);

    // إعادة تحميل البيانات عند التركيز على النافذة (عند العودة من صفحة أخرى)
    const handleFocus = () => {
      const lastUpdate = localStorage.getItem('wasteCatalogLastUpdate');
      if (lastUpdate) {
        const timeSinceUpdate = Date.now() - parseInt(lastUpdate, 10);
        // إعادة التحميل إذا مر أقل من 30 ثانية (يعني تمت إضافة جديدة)
        if (timeSinceUpdate < 30000) {
          console.log('🔄 إعادة تحميل البيانات بعد العودة من صفحة الإضافة...');
          loadWasteMaterials();
          loadProducts();
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // فحص دوري للتحديثات (كل 5 ثوان)
    const intervalId = setInterval(() => {
      const lastUpdate = localStorage.getItem('wasteCatalogLastUpdate');
      if (lastUpdate) {
        const timeSinceUpdate = Date.now() - parseInt(lastUpdate, 10);
        if (timeSinceUpdate < 10000) { // أقل من 10 ثوان
          console.log('🔄 تحديث تلقائي للبيانات...');
          loadWasteMaterials();
          loadProducts();
          localStorage.removeItem('wasteCatalogLastUpdate'); // إزالة العلامة بعد التحديث
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener('wasteCatalogUpdated', handleCustomEvent);
      window.removeEventListener('productCatalogUpdated', handleCustomEvent);
      window.removeEventListener('focus', handleFocus);
      clearInterval(intervalId);
    };
  }, []);

  const loadCategories = async () => {
    try {
      const data = await wasteCatalogService.getWasteMainCategories();
      setWasteMainCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await productCatalogService.getProducts();
      setProducts(data);
    } catch (error) {
      toast.error('فشل في جلب المنتجات');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWasteMaterials = async () => {
    setIsLoading(true);
    try {
      const data = await wasteCatalogService.getWasteMaterials();
      setWasteMaterials(data);
    } catch (error) {
      toast.error('فشل في جلب المخلفات');
    } finally {
      setIsLoading(false);
    }
  };

  // فلترة المنتجات
  const filteredProducts = products.filter(product => {
    const matchesSearch = !productFilters.search || 
      product.name.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.sku.toLowerCase().includes(productFilters.search.toLowerCase()) ||
      product.product_code.toLowerCase().includes(productFilters.search.toLowerCase());
    
    const matchesCategory = !productFilters.category || productFilters.category === 'all' || 
      product.main_category_id?.toString() === productFilters.category;
    
    const matchesWarehouse = !productFilters.warehouse || productFilters.warehouse === 'all' || 
      product.warehouse_id?.toString() === productFilters.warehouse;
    
    const matchesStatus = !productFilters.status || productFilters.status === 'all' || 
      product.status === productFilters.status;

    const hasOrgLink = !!(product as ProductCatalogItem & { unified_sub_category_id?: string | null }).unified_sub_category_id;
    const matchesOrg = productFilters.organizationLinked === 'all' ||
      (productFilters.organizationLinked === 'yes' && hasOrgLink) ||
      (productFilters.organizationLinked === 'no' && !hasOrgLink);

    return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus && matchesOrg;
  });

  // فلترة المخلفات
  const filteredWasteMaterials = wasteMaterials.filter(waste => {
    const matchesSearch = !wasteFilters.search || 
      waste.waste_no.toLowerCase().includes(wasteFilters.search.toLowerCase()) ||
      waste.main_category?.name?.toLowerCase().includes(wasteFilters.search.toLowerCase());
    
    const matchesCategory = !wasteFilters.category || wasteFilters.category === 'all' || 
      waste.main_category_id?.toString() === wasteFilters.category;
    
    const matchesWarehouse = !wasteFilters.warehouse || wasteFilters.warehouse === 'all' || 
      waste.warehouse_id?.toString() === wasteFilters.warehouse;
    
    const matchesStatus = !wasteFilters.status || wasteFilters.status === 'all' || 
      waste.status === wasteFilters.status;

    return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
  });

  // حذف منتج
  const handleDeleteProduct = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      const success = await productCatalogService.deleteProduct(id);
      if (success) {
        loadProducts();
      }
    }
  };

  // حذف مخلفات
  const handleDeleteWaste = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذه المخلفات؟')) {
      const success = await wasteCatalogService.deleteWasteMaterial(id);
      if (success) {
        loadWasteMaterials();
      }
    }
  };

  // طباعة QR Code للمنتج
  const printProductQR = async (product: ProductCatalogItem) => {
    try {
      const qrData = qrCodeService.createProductQRData({
        id: product.id?.toString() || product.sku,
        name: product.name,
        sku: product.sku,
        warehouse: product.warehouse?.name,
        category: product.main_category?.name,
        weight: product.weight,
        volume: product.unit_mode === 'volume' ? product.weight : undefined,
        count: product.unit_mode === 'count' ? product.weight : undefined,
        status: product.status
      });
      
      await qrCodeService.printLabel(qrData);
    } catch (error) {
      toast.error('فشل في طباعة QR Code');
    }
  };

  // طباعة QR Code للمخلفات
  const printWasteQR = async (waste: WasteCatalogItem) => {
    try {
      const qrData = qrCodeService.createWasteQRData({
        id: waste.id?.toString() || waste.waste_no,
        name: waste.main_category?.name || 'مخلفات',
        wasteNo: waste.waste_no,
        warehouse: waste.warehouse?.name,
        category: waste.main_category?.name,
        weight: waste.weight,
        volume: waste.volume,
        count: waste.count,
        status: waste.status
      });
      
      await qrCodeService.printLabel(qrData);
    } catch (error) {
      toast.error('فشل في طباعة QR Code');
    }
  };

  // تحميل QR Code
  const downloadQR = async (type: 'product' | 'waste', item: any) => {
    try {
      const qrData = type === 'product' 
        ? qrCodeService.createProductQRData({
            id: item.id?.toString() || item.sku,
            name: item.name,
            sku: item.sku,
            warehouse: item.warehouse?.name,
            category: item.main_category?.name,
            weight: item.weight,
            status: item.status
          })
        : qrCodeService.createWasteQRData({
            id: item.id?.toString() || item.waste_no,
            name: item.main_category?.name || 'مخلفات',
            wasteNo: item.waste_no,
            warehouse: item.warehouse?.name,
            category: item.main_category?.name,
            weight: item.weight,
            status: item.status
          });
      
      await qrCodeService.downloadQRCode(qrData, `${type}_${item.id || item.sku || item.waste_no}_qr.png`);
    } catch (error) {
      toast.error('فشل في تحميل QR Code');
    }
  };

  return (
    <DashboardLayout title="عرض الكتالوج">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">كتالوج المخازن</h1>
            <p className="text-gray-600 mt-2">عرض وإدارة المنتجات والمخلفات</p>
          </div>
          <div className="flex gap-2">
            <Link href="/warehouse-management/catalog">
              <Button>
                <FiPlus className="mr-2" />
                إضافة جديد
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products">
              المنتجات ({filteredProducts.length})
            </TabsTrigger>
            <TabsTrigger value="waste">
              المخلفات ({filteredWasteMaterials.length})
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>قائمة المنتجات</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <Label htmlFor="product-search">البحث</Label>
                    <div className="flex gap-2">
                      <Input
                        id="product-search"
                        placeholder="البحث بالاسم، SKU، أو كود المنتج"
                        value={productFilters.search}
                        onChange={(e) => setProductFilters(prev => ({ ...prev, search: e.target.value }))}
                      />
                      <Button variant="outline">
                        <FiSearch />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="product-category">الفئة</Label>
                    <Select
                      value={productFilters.category}
                      onValueChange={(value) => setProductFilters(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الفئات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفئات</SelectItem>
                        <SelectItem value="1">الملابس والأزياء</SelectItem>
                        <SelectItem value="2">الإلكترونيات</SelectItem>
                        <SelectItem value="3">المواد الغذائية</SelectItem>
                        <SelectItem value="4">الأدوات المنزلية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product-status">الحالة</Label>
                    <Select
                      value={productFilters.status}
                      onValueChange={(value) => setProductFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الحالات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="active">نشط</SelectItem>
                        <SelectItem value="inactive">متوقف</SelectItem>
                        <SelectItem value="coming_soon">قادم قريباً</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product-org">الربط بالتنظيم</Label>
                    <Select
                      value={productFilters.organizationLinked}
                      onValueChange={(value: 'all' | 'yes' | 'no') => setProductFilters(prev => ({ ...prev, organizationLinked: value }))}
                    >
                      <SelectTrigger id="product-org">
                        <SelectValue placeholder="الكل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="yes">مرتبط بالتنظيم فقط</SelectItem>
                        <SelectItem value="no">غير مرتبط بالتنظيم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : (
                  <div className="space-y-4">
                    {filteredProducts.map((product) => {
                      // معالجة الصور - قد تكون JSONB array أو string
                      let productImages: string[] = [];
                      if (product.images) {
                        if (typeof product.images === 'string') {
                          try {
                            productImages = JSON.parse(product.images);
                          } catch {
                            productImages = [];
                          }
                        } else if (Array.isArray(product.images)) {
                          productImages = product.images;
                        }
                      }

                      return (
                        <Card key={product.id} className="p-4">
                        <div className="flex justify-between items-start gap-4">
                          {/* عرض الصور */}
                          {productImages.length > 0 && (
                            <div className="flex-shrink-0">
                              <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={productImages[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                  }}
                                />
                              </div>
                              {productImages.length > 1 && (
                                <div className="text-xs text-gray-500 mt-1 text-center">
                                  +{productImages.length - 1} صورة أخرى
                                </div>
                              )}
                            </div>
                          )}
                          {productImages.length === 0 && (
                            <div className="flex-shrink-0 w-32 h-32 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-sm">لا توجد صورة</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{product.name}</h3>
                              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                {product.status === 'active' ? 'نشط' : product.status === 'inactive' ? 'متوقف' : 'قادم قريباً'}
                              </Badge>
                              {(product as ProductCatalogItem & { unified_sub_category_id?: string | null }).unified_sub_category_id && (
                                <Badge variant="outline" className="border-green-600 text-green-700 bg-green-50">
                                  مرتبط بالتنظيم
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">SKU:</span> {product.sku}
                              </div>
                              <div>
                                <span className="font-medium">كود المنتج:</span> {product.product_code}
                              </div>
                              <div>
                                <span className="font-medium">المخزن:</span> {product.warehouse?.name || 'غير محدد'}
                              </div>
                              <div>
                                <span className="font-medium">الفئة:</span> {product.main_category?.name || 'غير محدد'}
                              </div>
                              {product.weight && (
                                <div>
                                  <span className="font-medium">الوزن:</span> {product.weight} كجم
                                </div>
                              )}
                              {product.brand && (
                                <div>
                                  <span className="font-medium">البراند:</span> {product.brand}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">تاريخ الإنشاء:</span> {new Date(product.created_at || '').toLocaleDateString('ar-SA')}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printProductQR(product)}
                              title="طباعة QR Code"
                            >
                              <FiPrinter />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadQR('product', product)}
                              title="تحميل QR Code"
                            >
                              <FiDownload />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="عرض التفاصيل"
                               onClick={() => {
                                 setSelectedProduct(product);
                                 setSelectedWaste(null);
                                 setIsDetailsOpen(true);
                               }}
                             >
                               <FiEye />
                             </Button>
                            <Link href={`/warehouse-management/catalog/edit/${product.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                title="تعديل"
                              >
                                <FiEdit />
                              </Button>
                            </Link>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id!)}
                              title="حذف"
                            >
                              <FiTrash2 />
                            </Button>
                          </div>
                        </div>
                      </Card>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        لا توجد منتجات مطابقة للبحث
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Waste Tab */}
          <TabsContent value="waste" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>قائمة المخلفات</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <Label htmlFor="waste-search">البحث</Label>
                    <div className="flex gap-2">
                      <Input
                        id="waste-search"
                        placeholder="البحث برقم المخلفات أو الفئة"
                        value={wasteFilters.search}
                        onChange={(e) => setWasteFilters(prev => ({ ...prev, search: e.target.value }))}
                      />
                      <Button variant="outline">
                        <FiSearch />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="waste-category">الفئة</Label>
                    <Select
                      value={wasteFilters.category}
                      onValueChange={(value) => setWasteFilters(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الفئات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفئات</SelectItem>
                        {wasteMainCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="waste-status">الحالة</Label>
                    <Select
                      value={wasteFilters.status}
                      onValueChange={(value) => setWasteFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الحالات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="waiting">في الانتظار</SelectItem>
                        <SelectItem value="sorting">قيد الفرز</SelectItem>
                        <SelectItem value="ready">جاهز للبيع</SelectItem>
                        <SelectItem value="reserved">محجوز لشركة تدوير</SelectItem>
                        <SelectItem value="sold">تم البيع</SelectItem>
                        <SelectItem value="disposed">تم الإتلاف</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : (
                  <div className="space-y-4">
                    {filteredWasteMaterials.map((waste) => (
                      <Card key={waste.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{waste.waste_no}</h3>
                              <Badge variant={
                                waste.status === 'ready' || waste.status === 'available' ? 'default' :
                                waste.status === 'waiting' ? 'secondary' :
                                waste.status === 'sold' ? 'default' : 
                                (waste.status === 'cancelled' || waste.status === 'disposed') ? 'destructive' : 'outline'
                              }>
                                {waste.status === 'waiting' ? 'في الانتظار' :
                                 waste.status === 'sorting' ? 'قيد الفرز' :
                                 waste.status === 'ready' || waste.status === 'available' ? 'جاهز للبيع' :
                                 waste.status === 'reserved' ? 'محجوز' :
                                 waste.status === 'sold' ? 'تم البيع' :
                                 waste.status === 'disposed' ? 'تم الإتلاف' : 
                                 waste.status === 'cancelled' ? 'ملغي' : 'غير محدد'}
                              </Badge>
                              {waste.recyclable && (
                                <Badge variant="outline" className="text-green-600">
                                  قابل للتدوير
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">المخزن:</span> {waste.warehouse?.name || 'غير محدد'}
                              </div>
                              <div>
                                <span className="font-medium">الفئة:</span> {waste.main_category?.name || 'غير محدد'}
                              </div>
                              {waste.weight && (
                                <div>
                                  <span className="font-medium">الوزن:</span> {waste.weight} كجم
                                </div>
                              )}
                              {waste.volume && (
                                <div>
                                  <span className="font-medium">الحجم:</span> {waste.volume} م³
                                </div>
                              )}
                              {waste.count && (
                                <div>
                                  <span className="font-medium">العدد:</span> {waste.count} قطعة
                                </div>
                              )}
                              {waste.expected_price && (
                                <div>
                                  <span className="font-medium">السعر المتوقع:</span> {waste.expected_price} جنيه
                                </div>
                              )}
                              <div>
                                <span className="font-medium">تاريخ التسجيل:</span> {new Date(waste.registration_date).toLocaleDateString('ar-SA')}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printWasteQR(waste)}
                              title="طباعة QR Code"
                            >
                              <FiPrinter />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadQR('waste', waste)}
                              title="تحميل QR Code"
                            >
                              <FiDownload />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="عرض التفاصيل"
                               onClick={() => {
                                 setSelectedWaste(waste);
                                 setSelectedProduct(null);
                                 setIsDetailsOpen(true);
                               }}
                             >
                               <FiEye />
                             </Button>
                            <Link href={`/warehouse-management/catalog/waste-edit/${waste.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                title="تعديل"
                              >
                                <FiEdit />
                              </Button>
                            </Link>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteWaste(waste.id!)}
                              title="حذف"
                            >
                              <FiTrash2 />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {filteredWasteMaterials.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        لا توجد مخلفات مطابقة للبحث
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* نافذة تفاصيل العنصر */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedProduct ? 'تفاصيل المنتج' : 'تفاصيل المخلفات'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct ? `عرض بيانات المنتج: ${selectedProduct.name}` : `عرض بيانات المخلفات: ${selectedWaste?.waste_no}`}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <div className="text-gray-400">لا يوجد صور حالياً</div>
                </div>
                {selectedProduct.qr_code && (
                  <div className="p-4 border rounded-lg flex flex-col items-center">
                    <p className="text-sm text-gray-500 mb-2">QR Code</p>
                    <img src={selectedProduct.qr_code} alt="QR Code" className="w-32 h-32" />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">اسم المنتج</p>
                    <p className="font-semibold">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">SKU</p>
                    <p className="font-semibold">{selectedProduct.sku}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الفئة الأساسية</p>
                    <p className="font-semibold">{selectedProduct.main_category?.name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الفئة الفرعية</p>
                    <p className="font-semibold">{selectedProduct.sub_category?.name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">المخزن</p>
                    <p className="font-semibold">{selectedProduct.warehouse?.name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الحالة</p>
                    <Badge variant={selectedProduct.status === 'active' ? 'default' : 'secondary'}>
                      {selectedProduct.status === 'active' ? 'نشط' : selectedProduct.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الكمية القصوى</p>
                    <p className="font-semibold">{selectedProduct.max_qty || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الكمية الدنيا</p>
                    <p className="font-semibold">{selectedProduct.min_qty || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الوحدة</p>
                    <p className="font-semibold">{selectedProduct.unit?.name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">البراند</p>
                    <p className="font-semibold">{selectedProduct.brand || 'غير محدد'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الوصف</p>
                  <p className="text-gray-700">{selectedProduct.description || 'لا يوجد وصف'}</p>
                </div>
              </div>
            </div>
          )}

          {selectedWaste && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                {selectedWaste.images && Array.isArray(selectedWaste.images) && selectedWaste.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedWaste.images.map((image, index) => {
                      const imageUrl = typeof image === 'string' ? image : (image instanceof File ? URL.createObjectURL(image) : '');
                      if (!imageUrl) return null;
                      return (
                        <div key={index} className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={`صورة ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('خطأ في تحميل الصورة:', imageUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="text-gray-400">لا يوجد صور حالياً</div>
                  </div>
                )}
                {selectedWaste.qr_code && (
                  <div className="p-4 border rounded-lg flex flex-col items-center">
                    <p className="text-sm text-gray-500 mb-2">QR Code</p>
                    <img src={selectedWaste.qr_code} alt="QR Code" className="w-32 h-32" />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">رقم المخلفات</p>
                    <p className="font-semibold">{selectedWaste.waste_no}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">تاريخ التسجيل</p>
                    <p className="font-semibold">{selectedWaste.registration_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">المخزن</p>
                    <p className="font-semibold">{selectedWaste.warehouse?.name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الفئة الأساسية</p>
                    <p className="font-semibold">{selectedWaste.main_category?.name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الفئة الفرعية</p>
                    <p className="font-semibold">{selectedWaste.sub_category?.name_ar || selectedWaste.sub_category?.name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">القطاع</p>
                    <p className="font-semibold">{selectedWaste.sector?.name_ar || selectedWaste.sector?.name || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الحالة</p>
                    <Badge variant={
                      selectedWaste.status === 'ready' || selectedWaste.status === 'available' ? 'default' :
                      selectedWaste.status === 'waiting' ? 'secondary' : 'outline'
                    }>
                      {selectedWaste.status === 'available' ? 'جاهز للبيع' : 
                       selectedWaste.status === 'ready' ? 'جاهز للبيع' :
                       selectedWaste.status === 'waiting' ? 'في الانتظار' : selectedWaste.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الوزن</p>
                    <p className="font-semibold">{selectedWaste.weight || 0} {selectedWaste.unit?.name || 'كجم'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">القابلية للتدوير</p>
                    <Badge variant={selectedWaste.recyclable ? 'default' : 'secondary'}>
                      {selectedWaste.recyclable ? 'نعم' : 'لا'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الوحدة</p>
                    <p className="font-semibold">{selectedWaste.unit?.name || 'غير محدد'}</p>
                  </div>
                  {selectedWaste.related_product && (
                    <div>
                      <p className="text-sm text-gray-500">المنتج المرتبط</p>
                      <p className="font-semibold">{selectedWaste.related_product.name}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">المصدر</p>
                  <p className="font-semibold">{selectedWaste.source || 'غير محدد'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ملاحظات</p>
                  <p className="text-gray-700">{selectedWaste.notes || 'لا يوجد ملاحظات'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-8">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>إغلاق</Button>
            {selectedProduct && (
              <Link href={`/warehouse-management/catalog/edit/${selectedProduct.id}`}>
                <Button>تعديل البيانات</Button>
              </Link>
            )}
            {selectedWaste && (
              <Link href={`/warehouse-management/catalog/waste-edit/${selectedWaste.id}`}>
                <Button>تعديل البيانات</Button>
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
