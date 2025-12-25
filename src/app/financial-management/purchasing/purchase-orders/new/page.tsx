'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSuppliers } from '@/domains/supplier-management/store/supplierSlice';
import { fetchWarehouses } from '@/domains/warehouse-management/store/warehouseSlice';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Plus, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CreatePurchaseOrderInput, PurchaseOrderItem } from '@/domains/purchasing/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { suppliers } = useAppSelector((state) => state.supplier);
  const { warehouses } = useAppSelector((state) => state.warehouse);
  const token = useAppSelector((state) => state.auth.token);

  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  
  // Items state
  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      catalog_product_id: '',
      catalog_waste_id: '',
      product_id: '',
      sku: '',
      name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      measurement_unit: 'piece',
      notes: '',
    },
  ]);
  const [searchingProducts, setSearchingProducts] = useState<number | null>(null);
  const [productSearchResults, setProductSearchResults] = useState<Record<number, any[]>>({});
  const [productSearchQuery, setProductSearchQuery] = useState<Record<number, string>>({});
  const [focusedSearchIndex, setFocusedSearchIndex] = useState<number | null>(null);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [loadingRecentProducts, setLoadingRecentProducts] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loadingAllProducts, setLoadingAllProducts] = useState(false);
  const [showBrowseCatalogDialog, setShowBrowseCatalogDialog] = useState<number | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [catalogWaste, setCatalogWaste] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'products' | 'waste'>('products');

  useEffect(() => {
    const loadData = async () => {
      if (suppliers.length === 0) {
        setLoadingSuppliers(true);
        try {
          await dispatch(fetchSuppliers()).unwrap();
        } catch (error) {
          toast.error('فشل في تحميل الموردين');
        } finally {
          setLoadingSuppliers(false);
        }
      }

      if (warehouses.length === 0) {
        setLoadingWarehouses(true);
        try {
          await dispatch(fetchWarehouses()).unwrap();
        } catch (error) {
          toast.error('فشل في تحميل المخازن');
        } finally {
          setLoadingWarehouses(false);
        }
      }
    };

    loadData();
  }, [dispatch, suppliers.length, warehouses.length]);

  // تحميل أول 4 منتجات عند focus على حقل البحث
  const loadRecentProducts = async () => {
    if (loadingRecentProducts || recentProducts.length > 0) return;
    
    setLoadingRecentProducts(true);
    try {
      const response = await fetch('/api/catalog/products?limit=4');
      if (!response.ok) throw new Error('فشل تحميل المنتجات');
      
      const data = await response.json();
      const products = (data.products || []).map((p: any) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        type: 'catalog_product',
        catalog_product_id: p.id,
        image_url: p.image_url || null,
        total_quantity: p.total_quantity || 0,
      }));
      
      setRecentProducts(products);
    } catch (error) {
      console.error('Error loading recent products:', error);
    } finally {
      setLoadingRecentProducts(false);
    }
  };

  // تحميل جميع المنتجات للـ Dialog
  const loadAllProducts = async () => {
    if (loadingAllProducts) return;
    
    setLoadingAllProducts(true);
    try {
      const response = await fetch('/api/catalog/products');
      if (!response.ok) throw new Error('فشل تحميل المنتجات');
      
      const data = await response.json();
      const products = (data.products || []).map((p: any) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        type: 'catalog_product',
        catalog_product_id: p.id,
        image_url: p.image_url || null,
        total_quantity: p.total_quantity || 0,
      }));
      
      setAllProducts(products);
    } catch (error) {
      console.error('Error loading all products:', error);
      toast.error('فشل تحميل المنتجات');
    } finally {
      setLoadingAllProducts(false);
    }
  };

  // تحميل كتالوج المنتجات والمخلفات
  const loadCatalog = async (type: 'products' | 'waste') => {
    setLoadingCatalog(true);
    try {
      if (type === 'products') {
        const response = await fetch('/api/catalog/products');
        if (response.ok) {
          const data = await response.json();
          setCatalogProducts(data.products || []);
        }
      } else {
        // جلب المخلفات من Supabase
        if (supabase) {
          const { data, error } = await supabase
            .from('catalog_waste_materials')
            .select('id, waste_no, main_category_id, sub_category_id')
            .limit(100);
          
          if (!error && data) {
            setCatalogWaste(data.map((w: any) => ({
              id: w.id.toString(),
              waste_no: w.waste_no,
              name: w.waste_no, // استخدام waste_no كاسم مؤقت
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error loading catalog:', error);
      toast.error('فشل في تحميل الكتالوج');
    } finally {
      setLoadingCatalog(false);
    }
  };

  // البحث عن المنتجات/المخلفات
  const searchCatalog = async (index: number, query: string, type: 'products' | 'waste' | 'all') => {
    if (!query || query.trim().length < 2) {
      setProductSearchResults((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    setSearchingProducts(index);
    setProductSearchQuery((prev) => ({ ...prev, [index]: query }));

    try {
      const results: any[] = [];

      // البحث في المنتجات
      if (type === 'products' || type === 'all') {
        const response = await fetch(`/api/products/search-warehouse-inventory?sku=${encodeURIComponent(query)}&name=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.catalog_products) {
            data.catalog_products.forEach((p: any) => {
              results.push({
                id: p.id.toString(),
                sku: p.sku || '',
                name: p.name || '',
                type: 'catalog_product',
                catalog_product_id: p.id.toString(),
                image_url: p.image_url || null,
                total_quantity: p.total_quantity || 0,
              });
            });
          }
        }
      }

      // البحث في المخلفات
      if (type === 'waste' || type === 'all') {
        if (supabase) {
          const { data, error } = await supabase
            .from('catalog_waste_materials')
            .select('id, waste_no')
            .or(`waste_no.ilike.%${query}%`)
            .limit(10);
          
          if (!error && data) {
            data.forEach((w: any) => {
              results.push({
                id: w.id.toString(),
                waste_no: w.waste_no,
                name: w.waste_no,
                type: 'catalog_waste',
                catalog_waste_id: w.id.toString(),
              });
            });
          }
        }
      }

      setProductSearchResults((prev) => ({ ...prev, [index]: results }));
    } catch (error) {
      console.error('Error searching catalog:', error);
      toast.error('فشل البحث في الكتالوج');
      setProductSearchResults((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setSearchingProducts(null);
    }
  };

  // اختيار منتج/مخلفات من نتائج البحث
  const selectCatalogItem = (index: number, item: any) => {
    setItems((prev) =>
      prev.map((itm, idx) => {
        if (idx !== index) return itm;
        return {
          ...itm,
          catalog_product_id: item.type === 'catalog_product' ? item.catalog_product_id : '',
          catalog_waste_id: item.type === 'catalog_waste' ? item.catalog_waste_id : '',
          product_id: '',
          sku: item.sku || item.waste_no || '',
          name: item.name || item.waste_no || '',
          measurement_unit: itm.measurement_unit || 'piece',
        };
      })
    );
    setProductSearchResults((prev) => ({ ...prev, [index]: [] }));
    setProductSearchQuery((prev) => ({ ...prev, [index]: '' }));
  };

  // إضافة بند جديد
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        catalog_product_id: '',
        catalog_waste_id: '',
        product_id: '',
        sku: '',
        name: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        measurement_unit: 'piece',
        notes: '',
      },
    ]);
  };

  // حذف بند
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  // تحديث بند
  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };
        
        // إعادة حساب total_price عند تغيير quantity أو unit_price
        if (field === 'quantity' || field === 'unit_price') {
          updated.total_price = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0);
        }
        
        return updated;
      })
    );
  };

  // حساب المبلغ الإجمالي
  const calculatedTotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);

  const getHeaders = async (): Promise<HeadersInit> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    let authToken = token;
    
    if (!authToken && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        authToken = session?.access_token || null;
      } catch (error) {
        console.warn('Error getting session:', error);
      }
    }
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || !warehouseId) {
      toast.error('يجب تحديد المورد والمخزن');
      return;
    }

    if (items.length === 0 || items.every((item) => !item.name)) {
      toast.error('يجب إضافة بند واحد على الأقل');
      return;
    }

    setSaving(true);
    try {
      const data: CreatePurchaseOrderInput = {
        supplier_id: parseInt(supplierId),
        warehouse_id: parseInt(warehouseId),
        expected_delivery_date: expectedDeliveryDate || null,
        total_amount: calculatedTotal || undefined,
        notes: notes || null,
        items: items
          .filter((item) => item.name && item.quantity > 0)
          .map((item) => ({
            catalog_product_id: item.catalog_product_id || null,
            catalog_waste_id: item.catalog_waste_id || null,
            product_id: item.product_id || null,
            sku: item.sku || null,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            measurement_unit: item.measurement_unit || 'piece',
            notes: item.notes || null,
          })),
      };

      const headers = await getHeaders();
      const response = await fetch('/api/purchasing/purchase-orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في إنشاء أمر الشراء');
      }

      const result = await response.json();
      toast.success(result.message || 'تم إنشاء أمر الشراء بنجاح');
      router.push(`/financial-management/purchasing/purchase-orders/${result.id}`);
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      toast.error(error.message || 'فشل في إنشاء أمر الشراء');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="إنشاء أمر شراء">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/financial-management/purchasing/purchase-orders">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">أمر شراء جديد</h1>
            <p className="text-gray-600">قم بإنشاء أمر شراء جديد من المورد.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>بيانات أمر الشراء</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>المورد *</Label>
                  <Select
                    value={supplierId || 'none'}
                    onValueChange={(value) => setSupplierId(value === 'none' ? '' : value)}
                    disabled={loadingSuppliers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingSuppliers ? 'جاري التحميل...' : 'اختر المورد'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">اختر المورد</SelectItem>
                      {suppliers
                        .filter((s) => s.is_active)
                        .map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name_ar || supplier.name} ({supplier.supplier_code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>المخزن *</Label>
                  <Select
                    value={warehouseId}
                    onValueChange={setWarehouseId}
                    disabled={loadingWarehouses}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingWarehouses ? 'جاري التحميل...' : 'اختر المخزن'} />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id.toString()}>
                          {wh.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>تاريخ التسليم المتوقع</Label>
                  <Input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>المبلغ الإجمالي المتوقع</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={calculatedTotal > 0 ? calculatedTotal.toFixed(2) : totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    يتم الحساب تلقائياً من البنود
                  </p>
                </div>
              </div>

              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات إضافية حول أمر الشراء"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>بنود أمر الشراء</CardTitle>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة بند
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">البند {index + 1}</h4>
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* البحث عن المنتج/المخلفات */}
                  <div className="relative">
                    <Label>البحث عن المنتج (SKU أو الاسم)</Label>
                    <div className="relative">
                      <Input
                        value={productSearchQuery[index] || ''}
                        onChange={(e) => {
                          const query = e.target.value;
                          setProductSearchQuery((prev) => ({ ...prev, [index]: query }));
                          if (query.length >= 2) {
                            searchCatalog(index, query, 'all');
                          } else {
                            setProductSearchResults((prev) => ({ ...prev, [index]: [] }));
                          }
                        }}
                        onFocus={() => {
                          setFocusedSearchIndex(index);
                          loadRecentProducts();
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setFocusedSearchIndex(null);
                          }, 200);
                        }}
                        placeholder="ابحث بالـ SKU أو الاسم..."
                        className="pr-10"
                      />
                      {searchingProducts === index && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                      )}
                      {searchingProducts !== index && productSearchQuery[index] && (
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      )}
                    </div>

                    {/* عرض أول 4 منتجات عند focus بدون بحث */}
                    {focusedSearchIndex === index && 
                     (!productSearchQuery[index] || productSearchQuery[index].length < 2) &&
                     (recentProducts.length > 0 || loadingRecentProducts) && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                        {loadingRecentProducts ? (
                          <div className="p-4 text-center text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : (
                          <>
                            {recentProducts.map((product) => (
                              <div
                                key={product.id}
                                className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                onClick={() => selectCatalogItem(index, product)}
                              >
                                <div className="flex items-center gap-3">
                                  {/* صورة المنتج */}
                                  <div className="flex-shrink-0">
                                    {product.image_url ? (
                                      <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-12 h-12 object-cover rounded border"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                                        <span className="text-xs text-gray-400">لا صورة</span>
                                      </div>
                                    )}
                                  </div>
                                  {/* معلومات المنتج */}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{product.name}</div>
                                    <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                    {product.total_quantity !== undefined && (
                                      <div className="text-xs text-green-600 mt-1">
                                        الكمية في المخازن: {product.total_quantity.toLocaleString('ar-EG')}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">
                                    Catalog
                                  </span>
                                </div>
                              </div>
                            ))}
                            <div className="p-2 border-t bg-gray-50">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setShowBrowseCatalogDialog(index);
                                  loadAllProducts();
                                }}
                              >
                                اختر أكثر...
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* نتائج البحث */}
                    {productSearchQuery[index] && 
                     productSearchQuery[index].length >= 2 &&
                     productSearchResults[index] && 
                     productSearchResults[index].length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                        {productSearchResults[index].map((product) => (
                          <div
                            key={product.id}
                            className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => selectCatalogItem(index, product)}
                          >
                            <div className="flex items-center gap-3">
                              {/* صورة المنتج */}
                              <div className="flex-shrink-0">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded border"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                                    <span className="text-xs text-gray-400">لا صورة</span>
                                  </div>
                                )}
                              </div>
                              {/* معلومات المنتج */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{product.name || product.waste_no}</div>
                                <div className="text-sm text-gray-500">SKU: {product.sku || product.waste_no}</div>
                                {product.total_quantity !== undefined && (
                                  <div className="text-xs text-green-600 mt-1">
                                    الكمية في المخازن: {product.total_quantity.toLocaleString('ar-EG')}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">
                                {product.type === 'catalog_product' ? 'Catalog' : 'مخلفات'}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="p-2 border-t bg-gray-50">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setShowBrowseCatalogDialog(index);
                              loadAllProducts();
                            }}
                          >
                            اختر أكثر...
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dialog لتصفح الكتالوج */}
                  <Dialog open={showBrowseCatalogDialog === index} onOpenChange={(open) => {
                    if (open) {
                      setShowBrowseCatalogDialog(index);
                      loadAllProducts();
                    } else {
                      setShowBrowseCatalogDialog(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" className="w-full" style={{ display: 'none' }}>
                        تصفح الكتالوج
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>اختر منتجاً</DialogTitle>
                        <DialogDescription>
                          اختر منتجاً من الكتالوج
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {loadingAllProducts ? (
                          <div className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            <p className="mt-2 text-gray-500">جاري التحميل...</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                            {allProducts.map((product) => (
                              <div
                                key={product.id}
                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  selectCatalogItem(index, product);
                                  setShowBrowseCatalogDialog(null);
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  {/* صورة المنتج */}
                                  <div className="flex-shrink-0">
                                    {product.image_url ? (
                                      <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-16 h-16 object-cover rounded border"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                                        <span className="text-xs text-gray-400">لا صورة</span>
                                      </div>
                                    )}
                                  </div>
                                  {/* معلومات المنتج */}
                                  <div className="flex-1 min-w-0 text-right">
                                    <div className="font-medium truncate">{product.name}</div>
                                    <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                    {product.total_quantity !== undefined && (
                                      <div className="text-xs text-green-600 mt-1">
                                        الكمية في المخازن: {product.total_quantity.toLocaleString('ar-EG')}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">
                                    Catalog
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* بيانات البند */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label>SKU / رقم</Label>
                      <Input
                        value={item.sku || ''}
                        onChange={(e) => updateItem(index, 'sku', e.target.value)}
                        placeholder="SKU"
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label>الاسم</Label>
                      <Input
                        value={item.name || ''}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="اسم المنتج/المخلفات"
                        required
                      />
                    </div>
                    <div>
                      <Label>الكمية *</Label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={item.quantity || 0}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label>الوحدة</Label>
                      <Input
                        value={item.measurement_unit || 'piece'}
                        onChange={(e) => updateItem(index, 'measurement_unit', e.target.value)}
                        placeholder="قطعة"
                      />
                    </div>
                    <div>
                      <Label>سعر الوحدة *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price || 0}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label>الإجمالي</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.total_price.toFixed(2)}
                        readOnly
                        className="bg-gray-50 font-semibold"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>ملاحظات</Label>
                      <Input
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        placeholder="ملاحظات على البند"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {items.length > 0 && (
                <div className="mb-4">
                  <Button type="button" onClick={addItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    إضافة بند جديد
                  </Button>
                </div>
              )}

              {items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  لا توجد بنود. قم بإضافة بند جديد.
                </div>
              )}

              {items.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">المبلغ الإجمالي:</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {calculatedTotal.toLocaleString('ar-EG', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        ج.م
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-4">
            <Link href="/financial-management/purchasing/purchase-orders">
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </Link>
            <Button type="submit" disabled={saving || !supplierId || !warehouseId}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'إنشاء أمر الشراء'
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

