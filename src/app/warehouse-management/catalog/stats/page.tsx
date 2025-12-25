'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { FiPackage, FiTrash2, FiTrendingUp, FiDollarSign, FiCheckCircle, FiBarChart } from 'react-icons/fi';
import { productCatalogService } from '@/services/productCatalogService';
import { wasteCatalogService } from '@/services/wasteCatalogService';

export default function CatalogStatsPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalWaste: 0,
    recyclableWaste: 0,
    totalValue: 0,
    categoriesBreakdown: {} as { [key: string]: number },
    recentProducts: [] as any[],
    recentWaste: [] as any[]
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // جلب المنتجات
      const products = await productCatalogService.getProducts();
      
      // جلب المخلفات
      const wasteMaterials = await wasteCatalogService.getWasteMaterials();
      
      // جلب إحصائيات المخلفات
      const wasteStats = await wasteCatalogService.getWasteStatistics();
      
      // حساب إحصائيات المنتجات
      const productCategories: { [key: string]: number } = {};
      products.forEach(product => {
        const categoryName = (product as any).main_category?.name || 'غير محدد';
        productCategories[categoryName] = (productCategories[categoryName] || 0) + 1;
      });

      setStats({
        totalProducts: products.length,
        totalWaste: wasteStats.totalWaste,
        recyclableWaste: wasteStats.recyclableWaste,
        totalValue: wasteStats.totalValue,
        categoriesBreakdown: { ...productCategories, ...wasteStats.categoriesBreakdown },
        recentProducts: products.slice(0, 5),
        recentWaste: wasteMaterials.slice(0, 5)
      });
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="إحصائيات الكتالوج">
        <div className="p-6">
          <div className="text-center py-8">جاري تحميل الإحصائيات...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="إحصائيات الكتالوج">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">إحصائيات الكتالوج</h1>
          <p className="text-gray-600 mt-2">نظرة شاملة على المنتجات والمخلفات</p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
              <FiPackage className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                منتج مسجل في النظام
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المخلفات</CardTitle>
              <FiTrash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWaste.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                كجم من المخلفات المسجلة
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المخلفات القابلة للتدوير</CardTitle>
              <FiCheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recyclableWaste.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                كجم قابل لإعادة التدوير
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">القيمة الإجمالية المتوقعة</CardTitle>
              <FiDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                جنيه مصري
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiBarChart className="h-5 w-5" />
                توزيع الفئات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.categoriesBreakdown).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(count / Math.max(...Object.values(stats.categoriesBreakdown))) * 100}%` 
                          }}
                        />
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recycling Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiTrendingUp className="h-5 w-5" />
                معدل إعادة التدوير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {stats.totalWaste > 0 ? Math.round((stats.recyclableWaste / stats.totalWaste) * 100) : 0}%
                </div>
                <p className="text-sm text-gray-600">
                  من المخلفات قابلة لإعادة التدوير
                </p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full" 
                      style={{ 
                        width: `${stats.totalWaste > 0 ? (stats.recyclableWaste / stats.totalWaste) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Products */}
          <Card>
            <CardHeader>
              <CardTitle>أحدث المنتجات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.sku}</p>
                    </div>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status === 'active' ? 'نشط' : 'متوقف'}
                    </Badge>
                  </div>
                ))}
                {stats.recentProducts.length === 0 && (
                  <p className="text-center text-gray-500 py-4">لا توجد منتجات حديثة</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Waste */}
          <Card>
            <CardHeader>
              <CardTitle>أحدث المخلفات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentWaste.map((waste) => (
                  <div key={waste.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{waste.waste_no}</h4>
                      <p className="text-sm text-gray-600">
                        {(waste as any).main_category?.name || 'غير محدد'} - {waste.weight} كجم
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {waste.recyclable && (
                        <Badge variant="outline" className="text-green-600">
                          قابل للتدوير
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {waste.status === 'waiting' ? 'في الانتظار' :
                         waste.status === 'ready' ? 'جاهز' : waste.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {stats.recentWaste.length === 0 && (
                  <p className="text-center text-gray-500 py-4">لا توجد مخلفات حديثة</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Environmental Impact */}
        <Card>
          <CardHeader>
            <CardTitle>التأثير البيئي الإيجابي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {Math.round(stats.recyclableWaste * 2.5)} كجم
                </div>
                <p className="text-sm text-gray-600">انبعاثات كربونية محفوظة</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {Math.round(stats.recyclableWaste * 15)} لتر
                </div>
                <p className="text-sm text-gray-600">طاقة محفوظة</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600 mb-2">
                  {Math.round(stats.recyclableWaste * 50)} لتر
                </div>
                <p className="text-sm text-gray-600">مياه محفوظة</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 mb-2">
                  {Math.round(stats.recyclableWaste * 0.1)} شجرة
                </div>
                <p className="text-sm text-gray-600">أشجار محفوظة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
