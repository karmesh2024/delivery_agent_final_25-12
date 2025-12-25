'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { FiCamera, FiSearch, FiPackage, FiTrash2 } from 'react-icons/fi';
import { toast } from 'sonner';
import { productCatalogService } from '@/services/productCatalogService';
import { wasteCatalogService } from '@/services/wasteCatalogService';
import { qrCodeService } from '@/services/qrCodeService';

export default function QRScannerComponent() {
  const [scannedData, setScannedData] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'product' | 'waste' | 'auto'>('auto');

  const handleQRScan = async () => {
    try {
      // محاكاة مسح QR Code - في التطبيق الحقيقي سيتم استخدام مكتبة مسح QR Code
      const mockQRData = {
        type: 'product',
        id: 'SKU-123456-789',
        name: 'منتج تجريبي',
        sku: 'SKU-123456-789',
        warehouse: 'مخزن القاهرة الرئيسي',
        category: 'الإلكترونيات',
        weight: 2.5,
        status: 'active',
        timestamp: new Date().toISOString()
      };
      
      const qrString = JSON.stringify(mockQRData);
      setScannedData(qrString);
      await handleSearch(qrString);
    } catch (error) {
      toast.error('فشل في مسح QR Code');
    }
  };

  const handleManualSearch = async () => {
    if (!scannedData.trim()) {
      toast.error('يرجى إدخال بيانات QR Code');
      return;
    }
    await handleSearch(scannedData);
  };

  const handleSearch = async (qrData: string) => {
    setIsSearching(true);
    try {
      // تحليل بيانات QR Code
      const parsedData = qrCodeService.parseQRCode(qrData);
      
      if (!parsedData) {
        toast.error('بيانات QR Code غير صحيحة');
        return;
      }

      let result = null;

      if (parsedData.type === 'product' && parsedData.sku) {
        // البحث عن المنتج
        const products = await productCatalogService.getProducts();
        result = products.find(p => p.sku === parsedData.sku);
        setSearchType('product');
      } else if (parsedData.type === 'waste' && parsedData.wasteNo) {
        // البحث عن المخلفات
        const wasteMaterials = await wasteCatalogService.getWasteMaterials();
        result = wasteMaterials.find(w => w.waste_no === parsedData.wasteNo);
        setSearchType('waste');
      } else {
        // البحث التلقائي
        const products = await productCatalogService.getProducts();
        const wasteMaterials = await wasteCatalogService.getWasteMaterials();
        
        const productResult = products.find(p => p.sku === parsedData.id || p.product_code === parsedData.id);
        const wasteResult = wasteMaterials.find(w => w.waste_no === parsedData.id);
        
        if (productResult) {
          result = { ...productResult, resultType: 'product' };
          setSearchType('product');
        } else if (wasteResult) {
          result = { ...wasteResult, resultType: 'waste' };
          setSearchType('waste');
        }
      }

      setSearchResult(result);
      
      if (!result) {
        toast.warning('لم يتم العثور على نتائج مطابقة');
      } else {
        toast.success('تم العثور على النتيجة بنجاح');
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
      toast.error('حدث خطأ أثناء البحث');
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setScannedData('');
    setSearchResult(null);
    setSearchType('auto');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiCamera className="h-5 w-5" />
            مسح QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleQRScan} className="flex-1">
              <FiCamera className="mr-2" />
              مسح QR Code
            </Button>
            <Button variant="outline" onClick={clearResults}>
              مسح النتائج
            </Button>
          </div>
          
          <div>
            <Label htmlFor="qr-data">أو أدخل بيانات QR Code يدوياً</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="qr-data"
                placeholder="الصق بيانات QR Code هنا"
                value={scannedData}
                onChange={(e) => setScannedData(e.target.value)}
              />
              <Button 
                onClick={handleManualSearch} 
                disabled={isSearching || !scannedData.trim()}
              >
                <FiSearch className="mr-2" />
                بحث
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {searchType === 'product' ? (
                <FiPackage className="h-5 w-5" />
              ) : (
                <FiTrash2 className="h-5 w-5" />
              )}
              نتيجة البحث
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchType === 'product' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{searchResult.name}</h3>
                  <Badge variant={searchResult.status === 'active' ? 'default' : 'secondary'}>
                    {searchResult.status === 'active' ? 'نشط' : 'متوقف'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">SKU:</span> {searchResult.sku}
                  </div>
                  <div>
                    <span className="font-medium">كود المنتج:</span> {searchResult.product_code}
                  </div>
                  <div>
                    <span className="font-medium">المخزن:</span> {(searchResult as any).warehouse?.name || 'غير محدد'}
                  </div>
                  <div>
                    <span className="font-medium">الفئة:</span> {(searchResult as any).main_category?.name || 'غير محدد'}
                  </div>
                  {searchResult.weight && (
                    <div>
                      <span className="font-medium">الوزن:</span> {searchResult.weight} كجم
                    </div>
                  )}
                  {searchResult.brand && (
                    <div>
                      <span className="font-medium">البراند:</span> {searchResult.brand}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">تاريخ الإنشاء:</span> {new Date(searchResult.created_at || '').toLocaleDateString('ar-SA')}
                  </div>
                </div>

                {searchResult.description && (
                  <div>
                    <span className="font-medium">الوصف:</span>
                    <p className="text-gray-600 mt-1">{searchResult.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{searchResult.waste_no}</h3>
                  <Badge variant={
                    searchResult.status === 'ready' ? 'default' :
                    searchResult.status === 'waiting' ? 'secondary' : 'destructive'
                  }>
                    {searchResult.status === 'waiting' ? 'في الانتظار' :
                     searchResult.status === 'sorting' ? 'قيد الفرز' :
                     searchResult.status === 'ready' ? 'جاهز للبيع' :
                     searchResult.status === 'reserved' ? 'محجوز' :
                     searchResult.status === 'sold' ? 'تم البيع' :
                     searchResult.status === 'disposed' ? 'تم الإتلاف' : 'ملغي'}
                  </Badge>
                  {searchResult.recyclable && (
                    <Badge variant="outline" className="text-green-600">
                      قابل للتدوير
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">المخزن:</span> {(searchResult as any).warehouse?.name || 'غير محدد'}
                  </div>
                  <div>
                    <span className="font-medium">الفئة:</span> {(searchResult as any).main_category?.name || 'غير محدد'}
                  </div>
                  {searchResult.weight && (
                    <div>
                      <span className="font-medium">الوزن:</span> {searchResult.weight} كجم
                    </div>
                  )}
                  {searchResult.volume && (
                    <div>
                      <span className="font-medium">الحجم:</span> {searchResult.volume} م³
                    </div>
                  )}
                  {searchResult.count && (
                    <div>
                      <span className="font-medium">العدد:</span> {searchResult.count} قطعة
                    </div>
                  )}
                  {searchResult.expected_price && (
                    <div>
                      <span className="font-medium">السعر المتوقع:</span> {searchResult.expected_price} جنيه
                    </div>
                  )}
                  <div>
                    <span className="font-medium">تاريخ التسجيل:</span> {new Date(searchResult.registration_date).toLocaleDateString('ar-SA')}
                  </div>
                </div>

                {searchResult.notes && (
                  <div>
                    <span className="font-medium">ملاحظات:</span>
                    <p className="text-gray-600 mt-1">{searchResult.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isSearching && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>جاري البحث...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
