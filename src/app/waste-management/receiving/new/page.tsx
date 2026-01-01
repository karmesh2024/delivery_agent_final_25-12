'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from '@/shared/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { 
  FiTruck, 
  FiPackage, 
  FiUser, 
  FiFileText,
  FiPlus,
  FiTrash2,
  FiSave
} from "react-icons/fi";
import { receivingApprovalService, ReceivingSource } from '@/domains/waste-management/services/receivingApprovalService';
import { canManageReceiving } from '@/domains/waste-management/services/wasteManagementPermissions';
import { getCurrentUserId } from '@/lib/logger-safe';
import { useToast } from '@/shared/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface WasteItem {
  waste_material_id: string;
  quantity: number;
  unit: string;
  quality_grade?: string;
  notes?: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface WasteMaterial {
  waste_no: string;
  name_ar?: string;
  unit?: string;
  unit_mode?: string;
  unit_id?: number;
  main_category_name?: string;
  sub_category_name?: string;
}

const sourceOptions: Array<{ value: ReceivingSource; label: string; icon: any }> = [
  { value: 'delivery_boy', label: 'دليفري بوي', icon: FiTruck },
  { value: 'supplier', label: 'مورد', icon: FiPackage },
  { value: 'agent', label: 'وكيل', icon: FiUser },
  { value: 'direct', label: 'مباشر', icon: FiFileText },
];

export default function NewReceivingRequestPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [source, setSource] = useState<ReceivingSource>('direct');
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [wasteMaterials, setWasteMaterials] = useState<WasteMaterial[]>([]);
  
  // حقول مشروطة حسب المصدر
  const [deliveryAgentId, setDeliveryAgentId] = useState<string>('');
  const [collectionSessionId, setCollectionSessionId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [supplierInvoiceId, setSupplierInvoiceId] = useState<string>('');
  const [agentId, setAgentId] = useState<string>('');
  
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([
    { waste_material_id: '', quantity: 0, unit: 'كجم', quality_grade: 'A' }
  ]);
  
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (warehouseId) {
      loadWasteMaterials(warehouseId);
    } else {
      setWasteMaterials([]);
    }
  }, [warehouseId]);

  useEffect(() => {
    calculateTotals();
  }, [wasteItems]);

  const loadWarehouses = async () => {
    try {
      if (!supabase) return;
      
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('خطأ في جلب المخازن:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب قائمة المخازن",
        variant: "destructive",
      });
    }
  };

  const loadWasteMaterials = async (warehouseId: number) => {
    try {
      if (!supabase) return;
      
      const { data, error } = await supabase
        .from('catalog_waste_materials')
        .select(`
          waste_no,
          unit_mode,
          unit_id,
          notes,
          warehouse_id,
          units:unit_id(name),
          main_category:unified_main_categories(name, name_ar),
          sub_category:unified_sub_categories(name, name_ar)
        `)
        .eq('warehouse_id', warehouseId) // فلترة حسب المخزن المختار
        .order('waste_no');
      
      if (error) {
        console.error('خطأ في جلب المخلفات:', error);
        throw error;
      }
      
      // تحويل البيانات إلى الشكل المطلوب
      const materials: WasteMaterial[] = (data || []).map((item: any) => {
        // تحديد الوحدة بناءً على unit_mode
        let unitName = 'كجم';
        if (item.units?.name) {
          unitName = item.units.name;
        } else if (item.unit_mode === 'weight') {
          unitName = 'كجم';
        } else if (item.unit_mode === 'volume') {
          unitName = 'م³';
        } else if (item.unit_mode === 'count') {
          unitName = 'قطعة';
        } else if (item.unit_mode === 'dimension') {
          unitName = 'م';
        }
        
        return {
          waste_no: item.waste_no,
          name_ar: item.notes || '', // استخدام notes كاسم (فارغ إذا لم يكن موجوداً)
          unit: unitName,
          unit_mode: item.unit_mode,
          unit_id: item.unit_id,
          main_category_name: item.main_category?.name || '',
          sub_category_name: item.sub_category?.name || '',
        };
      });
      
      setWasteMaterials(materials);
      
      if (materials.length === 0) {
        toast({
          title: "تنبيه",
          description: "لا توجد مخلفات مسجلة في كتالوج هذا المخزن",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('خطأ في جلب المخلفات:', error);
      toast({
        title: "خطأ",
        description: error?.message || "فشل في جلب قائمة المخلفات",
        variant: "destructive",
      });
    }
  };

  const calculateTotals = () => {
    const weight = wasteItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setTotalWeight(weight);
    // يمكن إضافة حساب القيمة بناءً على الأسعار من البورصة
    setTotalValue(0);
  };

  const addWasteItem = () => {
    setWasteItems([...wasteItems, { waste_material_id: '', quantity: 0, unit: 'كجم', quality_grade: 'A' }]);
  };

  const removeWasteItem = (index: number) => {
    setWasteItems(wasteItems.filter((_, i) => i !== index));
  };

  const updateWasteItem = (index: number, field: keyof WasteItem, value: any) => {
    const updated = [...wasteItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // إذا تم تغيير المخلفات، تحديث الوحدة تلقائياً
    if (field === 'waste_material_id') {
      const material = wasteMaterials.find(m => m.waste_no === value);
      if (material && material.unit) {
        updated[index].unit = material.unit;
      }
    }
    
    setWasteItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('handleSubmit called', { source, warehouseId, wasteItems, totalWeight, totalValue });
    
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log('No user ID found');
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    console.log('User ID:', userId);

    const permission = await canManageReceiving(userId, 'view');
    console.log('Permission check:', permission);
    if (!permission.allowed) {
      toast({
        title: "خطأ",
        description: permission.reason || 'ليس لديك صلاحية لإنشاء طلبات الاستلام',
        variant: "destructive",
      });
      return;
    }

    if (!warehouseId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المخزن",
        variant: "destructive",
      });
      return;
    }

    if (wasteItems.length === 0 || wasteItems.some(item => !item.waste_material_id || item.quantity <= 0)) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال المخلفات والكميات بشكل صحيح",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const requestData: any = {
        source,
        warehouse_id: warehouseId,
        waste_items: wasteItems,
        total_weight: totalWeight || null,
        total_value: totalValue || null,
      };

      // إضافة الحقول المشروطة حسب المصدر
      if (source === 'delivery_boy') {
        if (deliveryAgentId) requestData.delivery_agent_id = deliveryAgentId;
        if (collectionSessionId) requestData.collection_session_id = collectionSessionId;
      } else if (source === 'supplier') {
        if (supplierId) requestData.supplier_id = supplierId;
        if (supplierInvoiceId) requestData.supplier_invoice_id = supplierInvoiceId;
      } else if (source === 'agent') {
        if (agentId) requestData.agent_id = agentId;
      }

      console.log('Sending request data:', requestData);

      const result = await receivingApprovalService.createReceivingRequest(requestData);
      
      console.log('Result:', result);
      
      if (result) {
        toast({
          title: "نجح",
          description: "تم إنشاء طلب الاستلام بنجاح",
        });
        setTimeout(() => {
          router.push('/waste-management/receiving');
        }, 1000);
      } else {
        toast({
          title: "خطأ",
          description: "فشل في إنشاء طلب الاستلام. يرجى التحقق من البيانات.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('خطأ في إنشاء طلب الاستلام:', error);
      toast({
        title: "خطأ",
        description: error?.message || "فشل في إنشاء طلب الاستلام",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const SourceIcon = sourceOptions.find(opt => opt.value === source)?.icon || FiFileText;

  return (
    <DashboardLayout title="إنشاء طلب استلام جديد">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">إنشاء طلب استلام جديد</h1>
            <p className="text-gray-500 mt-2">
              إضافة طلب استلام مخلفات جديد من أي مصدر
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            إلغاء
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* المعلومات الأساسية */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>المعلومات الأساسية</CardTitle>
                <CardDescription>معلومات المصدر والمخزن</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* مصدر الاستلام */}
                <div>
                  <Label>مصدر الاستلام *</Label>
                  <Select value={source} onValueChange={(v) => setSource(v as ReceivingSource)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المصدر" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* المخزن */}
                <div>
                  <Label>المخزن المستلم *</Label>
                  <Select 
                    value={warehouseId?.toString() || ''} 
                    onValueChange={(v) => {
                      setWarehouseId(parseInt(v));
                      // مسح المخلفات عند تغيير المخزن
                      setWasteItems([{ waste_material_id: '', quantity: 0, unit: 'كجم', quality_grade: 'A' }]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المخزن" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {warehouseId && (
                    <p className="text-sm text-gray-500 mt-1">
                      سيتم عرض المخلفات من كتالوج هذا المخزن فقط
                    </p>
                  )}
                </div>

                {/* حقول مشروطة حسب المصدر */}
                {source === 'delivery_boy' && (
                  <>
                    <div>
                      <Label>معرف الدليفري بوي</Label>
                      <Input
                        value={deliveryAgentId}
                        onChange={(e) => setDeliveryAgentId(e.target.value)}
                        placeholder="UUID للدليفري بوي"
                      />
                    </div>
                    <div>
                      <Label>معرف جلسة التجميع (اختياري)</Label>
                      <Input
                        value={collectionSessionId}
                        onChange={(e) => setCollectionSessionId(e.target.value)}
                        placeholder="UUID لجلسة التجميع"
                      />
                    </div>
                  </>
                )}

                {source === 'supplier' && (
                  <>
                    <div>
                      <Label>معرف المورد</Label>
                      <Input
                        type="number"
                        value={supplierId || ''}
                        onChange={(e) => setSupplierId(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="معرف المورد"
                      />
                    </div>
                    <div>
                      <Label>معرف فاتورة المورد (اختياري)</Label>
                      <Input
                        value={supplierInvoiceId}
                        onChange={(e) => setSupplierInvoiceId(e.target.value)}
                        placeholder="UUID للفاتورة"
                      />
                    </div>
                  </>
                )}

                {source === 'agent' && (
                  <div>
                    <Label>معرف الوكيل</Label>
                    <Input
                      value={agentId}
                      onChange={(e) => setAgentId(e.target.value)}
                      placeholder="UUID للوكيل"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* الإجماليات */}
            <Card>
              <CardHeader>
                <CardTitle>الإجماليات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>الوزن الإجمالي</Label>
                  <Input
                    type="number"
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(parseFloat(e.target.value) || 0)}
                    placeholder="كجم"
                  />
                </div>
                <div>
                  <Label>القيمة الإجمالية</Label>
                  <Input
                    type="number"
                    value={totalValue}
                    onChange={(e) => setTotalValue(parseFloat(e.target.value) || 0)}
                    placeholder="ج.م"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* المخلفات */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>المخلفات المستلمة</CardTitle>
                  <CardDescription>إضافة المخلفات والكميات</CardDescription>
                </div>
                <Button type="button" onClick={addWasteItem} variant="outline" size="sm">
                  <FiPlus className="h-4 w-4 mr-2" />
                  إضافة مخلف
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wasteItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                    <div className="col-span-12 md:col-span-4">
                      <Label>المخلفات *</Label>
                      {!warehouseId ? (
                        <div className="p-2 border rounded bg-gray-50 text-sm text-gray-500">
                          يرجى اختيار المخزن أولاً لعرض المخلفات
                        </div>
                      ) : wasteMaterials.length === 0 ? (
                        <div className="p-2 border rounded bg-yellow-50 text-sm text-yellow-700">
                          لا توجد مخلفات في كتالوج هذا المخزن
                        </div>
                      ) : (
                        <Select
                          value={item.waste_material_id}
                          onValueChange={(v) => updateWasteItem(index, 'waste_material_id', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المخلفات" />
                          </SelectTrigger>
                          <SelectContent>
                            {wasteMaterials.map((material) => {
                              // بناء النص المعروض: المعرف - الاسم (الفئة الأساسية / الفئة الفرعية)
                              const parts: string[] = [material.waste_no];
                              
                              if (material.name_ar) {
                                parts.push(material.name_ar);
                              }
                              
                              const categories: string[] = [];
                              if (material.main_category_name) {
                                categories.push(material.main_category_name);
                              }
                              if (material.sub_category_name) {
                                categories.push(material.sub_category_name);
                              }
                              
                              if (categories.length > 0) {
                                parts.push(`(${categories.join(' / ')})`);
                              }
                              
                              const displayText = parts.join(' - ');
                              
                              return (
                                <SelectItem key={material.waste_no} value={material.waste_no}>
                                  {displayText}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <Label>الكمية *</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateWasteItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <Label>الوحدة</Label>
                      <Input
                        value={item.unit}
                        onChange={(e) => updateWasteItem(index, 'unit', e.target.value)}
                        placeholder="كجم"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <Label>الجودة</Label>
                      <Select
                        value={item.quality_grade || 'A'}
                        onValueChange={(v) => updateWasteItem(index, 'quality_grade', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">ممتاز (A)</SelectItem>
                          <SelectItem value="B">جيد (B)</SelectItem>
                          <SelectItem value="C">متوسط (C)</SelectItem>
                          <SelectItem value="D">ضعيف (D)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-12 md:col-span-1">
                      <Label>&nbsp;</Label>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeWasteItem(index)}
                        className="w-full"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="col-span-12">
                      <Label>ملاحظات</Label>
                      <Textarea
                        value={item.notes || ''}
                        onChange={(e) => updateWasteItem(index, 'notes', e.target.value)}
                        placeholder="ملاحظات حول هذه المخلفات..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* أزرار الإجراءات */}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              <FiSave className="h-4 w-4 mr-2" />
              {loading ? 'جاري الحفظ...' : 'إنشاء طلب الاستلام'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

