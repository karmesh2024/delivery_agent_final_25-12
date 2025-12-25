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
import Link from 'next/link';

export default function CatalogViewPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [wasteMaterials, setWasteMaterials] = useState<WasteCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // فلاتر البحث
  const [productFilters, setProductFilters] = useState({
    search: '',
    category: '',
    warehouse: '',
    status: ''
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
  }, []);

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

    return matchesSearch && matchesCategory && matchesWarehouse && matchesStatus;
  });

  // فلترة المخلفات
  const filteredWasteMaterials = wasteMaterials.filter(waste => {
    const matchesSearch = !wasteFilters.search || 
      waste.waste_no.toLowerCase().includes(wasteFilters.search.toLowerCase()) ||
      (waste as any).main_category?.name?.toLowerCase().includes(wasteFilters.search.toLowerCase());
    
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
        warehouse: (product as any).warehouse?.name,
        category: (product as any).main_category?.name,
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
        name: (waste as any).main_category?.name || 'مخلفات',
        wasteNo: waste.waste_no,
        warehouse: (waste as any).warehouse?.name,
        category: (waste as any).main_category?.name,
        weight: waste.weight,
        volume: waste.volume,
        count: waste.count,
        status: (waste as any).status
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
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{product.name}</h3>
                              <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                                {product.status === 'active' ? 'نشط' : product.status === 'inactive' ? 'متوقف' : 'قادم قريباً'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">SKU:</span> {product.sku}
                              </div>
                              <div>
                                <span className="font-medium">كود المنتج:</span> {product.product_code}
                              </div>
                              <div>
                                <span className="font-medium">المخزن:</span> {(product as any).warehouse?.name || 'غير محدد'}
                              </div>
                              <div>
                                <span className="font-medium">الفئة:</span> {(product as any).main_category?.name || 'غير محدد'}
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
                        <SelectItem value="1">بلاستيك</SelectItem>
                        <SelectItem value="2">معادن</SelectItem>
                        <SelectItem value="3">كرتون/ورق</SelectItem>
                        <SelectItem value="4">زجاج</SelectItem>
                        <SelectItem value="5">أقمشة/نسيج</SelectItem>
                        <SelectItem value="6">مواد عضوية</SelectItem>
                        <SelectItem value="7">إلكترونيات</SelectItem>
                        <SelectItem value="8">أخرى</SelectItem>
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
                                waste.status === 'ready' ? 'default' :
                                waste.status === 'waiting' ? 'secondary' :
                                waste.status === 'sold' ? 'default' : 'destructive'
                              }>
                                {waste.status === 'waiting' ? 'في الانتظار' :
                                 waste.status === 'sorting' ? 'قيد الفرز' :
                                 waste.status === 'ready' ? 'جاهز للبيع' :
                                 waste.status === 'reserved' ? 'محجوز' :
                                 waste.status === 'sold' ? 'تم البيع' :
                                 waste.status === 'disposed' ? 'تم الإتلاف' : 'ملغي'}
                              </Badge>
                              {waste.recyclable && (
                                <Badge variant="outline" className="text-green-600">
                                  قابل للتدوير
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">المخزن:</span> {(waste as any).warehouse?.name || 'غير محدد'}
                              </div>
                              <div>
                                <span className="font-medium">الفئة:</span> {(waste as any).main_category?.name || 'غير محدد'}
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
                            >
                              <FiEye />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="تعديل"
                            >
                              <FiEdit />
                            </Button>
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
    </DashboardLayout>
  );
}
