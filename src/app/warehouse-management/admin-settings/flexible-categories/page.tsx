'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { 
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiChevronDown,
  FiChevronRight,
  FiLayers,
  FiPackage,
  FiTag,
  FiFolder,
  FiFolderOpen,
  FiGitBranch
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import warehouseService, { FlexibleCategory, Sector } from '@/domains/warehouse-management/services/warehouseService';
import { UniversalDialog } from '@/shared/ui/universal-dialog';

export default function FlexibleCategoriesPage() {
  const [categories, setCategories] = useState<FlexibleCategory[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [editingItem, setEditingItem] = useState<FlexibleCategory | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [parentCategory, setParentCategory] = useState<FlexibleCategory | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, sectorsData] = await Promise.all([
        warehouseService.getFlexibleCategoriesTree(),
        warehouseService.getSectors()
      ]);
      
      setCategories(categoriesData);
      setSectors(sectorsData);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const openAddDialog = (parent?: FlexibleCategory) => {
    setParentCategory(parent || null);
    setEditingItem(null);
    setDialogTitle(parent ? `إضافة فئة فرعية تحت "${parent.name}"` : 'إضافة فئة جديدة');
    setDialogOpen(true);
  };

  const openEditDialog = (item: FlexibleCategory) => {
    setEditingItem(item);
    setParentCategory(null);
    setDialogTitle(`تعديل "${item.name}"`);
    setDialogOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    try {
      setDialogLoading(true);
      let success = false;
      
      if (editingItem) {
        success = await warehouseService.updateFlexibleCategory(editingItem.id, formData);
      } else {
        success = await warehouseService.createFlexibleCategory({
          ...formData,
          parent_id: parentCategory?.id || null
        });
      }

      if (success) {
        setDialogOpen(false);
        await loadData();
      }
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDelete = async (item: FlexibleCategory) => {
    if (window.confirm(`هل أنت متأكد من حذف "${item.name}"؟`)) {
      const success = await warehouseService.deleteFlexibleCategory(item.id);
      if (success) {
        await loadData();
      }
    }
  };

  const renderCategoryTree = (category: FlexibleCategory, depth = 0) => {
    const isExpanded = expandedItems.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const indentStyle = { marginLeft: `${depth * 20}px` };

    return (
      <div key={category.id} className="mb-2">
        <div 
          className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
          style={indentStyle}
        >
          <div className="flex items-center space-x-3">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
              </button>
            ) : (
              <div className="w-6" />
            )}
            
            <div className="flex items-center space-x-2">
              {category.category_type === 'product' && <FiPackage className="text-blue-500" />}
              {category.category_type === 'waste' && <FiTrash2 className="text-red-500" />}
              {category.category_type === 'service' && <FiTag className="text-green-500" />}
              {category.category_type === 'other' && <FiFolder className="text-gray-500" />}
              
              <div>
                <h4 className="font-medium text-gray-900">{category.name}</h4>
                {category.description && (
                  <p className="text-sm text-gray-600">{category.description}</p>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    المستوى {category.level}
                  </Badge>
                  {category.sector && (
                    <Badge variant="secondary" className="text-xs">
                      {category.sector.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openAddDialog(category)}
              className="text-xs"
            >
              <FiPlus className="w-3 h-3 mr-1" />
              فئة فرعية
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEditDialog(category)}
            >
              <FiEdit3 className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(category)}
              className="text-red-600 hover:text-red-700"
            >
              <FiTrash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-2">
            {category.children!.map(child => renderCategoryTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const getFormFields = () => {
    const categoryTypes = [
      { value: 'product', label: 'منتج' },
      { value: 'waste', label: 'مخلفات' },
      { value: 'service', label: 'خدمة' },
      { value: 'other', label: 'أخرى' }
    ];

    return [
      {
        name: 'name',
        label: 'اسم الفئة',
        type: 'text',
        required: true,
        placeholder: 'أدخل اسم الفئة'
      },
      {
        name: 'description',
        label: 'الوصف',
        type: 'textarea',
        required: false,
        placeholder: 'أدخل وصف الفئة'
      },
      {
        name: 'category_type',
        label: 'نوع الفئة',
        type: 'select',
        required: true,
        options: categoryTypes,
        placeholder: 'اختر نوع الفئة'
      },
      {
        name: 'sector_id',
        label: 'القطاع',
        type: 'select',
        required: false,
        options: sectors.map(s => ({ value: s.id!, label: s.name })),
        placeholder: 'اختر القطاع (اختياري)'
      },
      {
        name: 'sort_order',
        label: 'ترتيب العرض',
        type: 'number',
        required: false,
        placeholder: '0'
      }
    ];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الفئات المرنة</h1>
            <p className="text-gray-600">نظام هرمي مرن لإدارة الفئات بدون حدود للمستويات</p>
          </div>
          <Button onClick={() => openAddDialog()}>
            <FiPlus className="w-4 h-4 mr-2" />
            إضافة فئة جديدة
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
            <div className="flex items-center">
              <FiGitBranch className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">إجمالي الفئات</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FiPackage className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">فئات المنتجات</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {categories.filter(c => c.category_type === 'product').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FiTrash2 className="w-8 h-8 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">فئات المخلفات</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {categories.filter(c => c.category_type === 'waste').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FiLayers className="w-8 h-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">أقصى عمق</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.max(...categories.map(c => c.level), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Tree */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FiGitBranch className="w-5 h-5 mr-2" />
              شجرة الفئات الهرمية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <FiGitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد فئات</h3>
                <p className="text-gray-600 mb-4">ابدأ بإنشاء فئة جديدة لبناء هيكلك الهرمي</p>
                <Button onClick={() => openAddDialog()}>
                  <FiPlus className="w-4 h-4 mr-2" />
                  إضافة فئة جديدة
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map(category => renderCategoryTree(category))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Universal Dialog */}
        <UniversalDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={dialogTitle}
          fields={getFormFields()}
          onSubmit={handleSubmit}
          loading={dialogLoading}
          initialData={editingItem ? {
            name: editingItem.name,
            description: editingItem.description || '',
            category_type: editingItem.category_type,
            sector_id: editingItem.sector_id || '',
            sort_order: editingItem.sort_order
          } : {}}
        />
      </div>
    </DashboardLayout>
  );
}
