'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { FiSearch, FiRefreshCw, FiFilter, FiEdit, FiTrash2, FiPlus, FiMinusCircle, FiDownload } from "react-icons/fi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useRouter } from 'next/navigation';
import { supplierService } from '@/domains/supplier-management/services/supplierService';
import { approvedAgentService } from '@/domains/approved-agents/api/approvedAgentService';
import { getAgents } from '@/lib/supabase';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInventoryItems } from '@/store/inventory/inventorySlice';
import { RootState } from '@/store/store';
import warehouseService from '@/domains/warehouse-management/services/warehouseService';

interface InventoryItem {
  id: string;
  product: { name: string };
  category: { name: string };
  warehouse: { name: string };
  quantity: number;
  unit: string;
  min_quantity: number;
  max_quantity: number;
  last_update: string;
}

const InventoryManagementPage: React.FC = () => {
  const dispatch = useDispatch();
  // في الإصدار النهائي سيتم استخدام بيانات المخزون من Redux
  // const { items: inventory, loading, error } = useSelector((state: RootState) => state.inventory);
  
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [warehouseList, setWarehouseList] = useState<{ id: number; name: string; warehouse_type?: 'products' | 'waste' | 'mixed' }[]>([]);
  const [warehouseDropdownOpen, setWarehouseDropdownOpen] = useState(false);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const router = useRouter();

  // Modal state for creating supply order (add material/product)
  const [createOpen, setCreateOpen] = useState(false);
  const [sourceType, setSourceType] = useState<'supplier' | 'agent' | 'delivery'>('supplier');
  const [sourceId, setSourceId] = useState<string>('');
  const [orderKind, setOrderKind] = useState<'product' | 'waste'>('product');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]); // approved agents
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [onlyBelowMin, setOnlyBelowMin] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<'add' | 'subtract'>('add');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  
  useEffect(() => {
    // في الإصدار النهائي
    // dispatch(fetchInventoryItems());
    
    // البيانات المؤقتة للعرض
    const dummyData: InventoryItem[] = [
      { 
        id: '1', 
        product: { name: 'الألومنيوم المعاد تدويره' }, 
        category: { name: 'معادن' },
        warehouse: { name: 'المستودع الرئيسي' },
        quantity: 3500,
        unit: 'كجم',
        min_quantity: 1000,
        max_quantity: 5000,
        last_update: '2023-11-20T10:30:00'
      },
      { 
        id: '2', 
        product: { name: 'النحاس النقي' }, 
        category: { name: 'معادن' },
        warehouse: { name: 'مستودع المواد الأولية' },
        quantity: 1200,
        unit: 'كجم',
        min_quantity: 500,
        max_quantity: 2000,
        last_update: '2023-11-18T14:45:00'
      },
      { 
        id: '3', 
        product: { name: 'الورق المقوى' }, 
        category: { name: 'ورق' },
        warehouse: { name: 'المستودع الرئيسي' },
        quantity: 8500,
        unit: 'كجم',
        min_quantity: 2000,
        max_quantity: 10000,
        last_update: '2023-11-19T09:15:00'
      },
      { 
        id: '4', 
        product: { name: 'الزجاج المكسر' }, 
        category: { name: 'زجاج' },
        warehouse: { name: 'مستودع الزجاج' },
        quantity: 4200,
        unit: 'كجم',
        min_quantity: 1000,
        max_quantity: 6000,
        last_update: '2023-11-17T16:20:00'
      },
      { 
        id: '5', 
        product: { name: 'البلاستيك PET' }, 
        category: { name: 'بلاستيك' },
        warehouse: { name: 'مستودع البلاستيك' },
        quantity: 5600,
        unit: 'كجم',
        min_quantity: 2000,
        max_quantity: 8000,
        last_update: '2023-11-16T11:50:00'
      }
    ];
    
    setTimeout(() => {
      setInventory(dummyData);
      setLoading(false);
    }, 1000);
  }, []);

  // جلب قائمة المخازن الحقيقية لعرضها في قائمة المستودعات
  useEffect(() => {
    (async () => {
      try {
        const data = await warehouseService.getAll();
        const mapped = (data || []).map((w: any) => ({ id: w.id, name: w.name, warehouse_type: w.warehouse_type }));
        setWarehouseList(mapped);
      } catch {}
    })();
  }, []);

  // fetch suppliers/agents/delivery boys for the modal
  useEffect(() => {
    (async () => {
      try {
        const s = await supplierService.getAll();
        setSuppliers(s || []);
      } catch {}
      try {
        const { agents: a } = await approvedAgentService.getApprovedAgents();
        setAgents(a || []);
      } catch {}
      try {
        const d = await getAgents();
        setDeliveryBoys(d || []);
      } catch {}
    })();
  }, []);
  
  const categories = ['all', 'معادن', 'ورق', 'زجاج', 'بلاستيك'];
  const warehouses = ['all', ...new Set(warehouseList.map((w) => w.name))] as string[];

  const typeLabel = (t?: 'products' | 'waste' | 'mixed') => {
    if (t === 'products') return 'منتجات';
    if (t === 'waste') return 'مخلفات';
    if (t === 'mixed') return 'مختلط';
    return 'غير محدد';
  };
  
  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.product.name.includes(searchTerm) || 
                         item.category.name.includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' || item.category.name === categoryFilter;
    const matchesWarehouse = warehouseFilter === 'all' || item.warehouse.name === warehouseFilter;
    const matchesMin = !onlyBelowMin || item.quantity <= item.min_quantity;
    return matchesSearch && matchesCategory && matchesWarehouse && matchesMin;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStockStatus = (quantity: number, min: number, max: number) => {
    if (quantity <= min) return { label: 'منخفض', class: 'bg-red-100 text-red-800' };
    if (quantity >= max) return { label: 'زائد', class: 'bg-blue-100 text-blue-800' };
    return { label: 'جيد', class: 'bg-green-100 text-green-800' };
  };

  const openAdjust = (item: InventoryItem, mode: 'add' | 'subtract') => {
    setAdjustTarget(item);
    setAdjustMode(mode);
    setAdjustQty(0);
    setAdjustReason('');
  };

  const exportCsv = (rows: InventoryItem[]) => {
    const header = ['المادة','الفئة','المستودع','الكمية','الوحدة','الحد الأدنى','الحد الأقصى','آخر تحديث'];
    const data = rows.map(r => [r.product.name, r.category.name, r.warehouse.name, r.quantity, r.unit, r.min_quantity, r.max_quantity, r.last_update]);
    const csv = [header, ...data].map(arr => arr.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">إدارة المخزون</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              setLoading(true);
              // في المستقبل
              // dispatch(fetchInventoryItems())
              setTimeout(() => setLoading(false), 1000);
            }}
          >
            <FiRefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => exportCsv(filteredItems)}>
            <FiDownload className="mr-2 h-4 w-4" />
            تصدير CSV
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <FiPlus className="mr-2 h-4 w-4" />
            إضافة مادة / منتج جديد
          </Button>
        </div>
      </div>
      
      {/* فلاتر البحث */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">فلترة المخزون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="بحث عن مادة..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <FiFilter className="text-gray-500" />
              <select
                className="border border-gray-300 rounded-md p-2"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'جميع الفئات' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <div className="flex gap-2 items-center">
                <FiFilter className="text-gray-500" />
                <button
                  type="button"
                  className="border border-gray-300 rounded-md px-3 py-2 min-w-[220px] text-right"
                  onClick={() => setWarehouseDropdownOpen((o) => !o)}
                >
                  {warehouseFilter === 'all'
                    ? 'جميع المستودعات'
                    : (() => {
                        const w = warehouseList.find(x => x.name === warehouseFilter);
                        return w ? `${w.name} — ${typeLabel(w.warehouse_type)}` : warehouseFilter;
                      })()}
                </button>
              </div>
              {warehouseDropdownOpen && (
                <div className="absolute z-20 mt-2 w-[320px] bg-white border border-gray-200 rounded-md shadow-lg p-2">
                  <div className="mb-2">
                    <Input
                      placeholder="بحث عن اسم المخزن..."
                      value={warehouseSearch}
                      onChange={(e) => setWarehouseSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-64 overflow-auto space-y-1">
                    <button
                      className={`w-full text-right px-2 py-1 rounded hover:bg-gray-100 ${warehouseFilter==='all'?'bg-gray-50':''}`}
                      onClick={() => { setWarehouseFilter('all'); setWarehouseDropdownOpen(false); }}
                    >
                      جميع المستودعات
                    </button>
                    {warehouseList
                      .filter(w => w.name.toLowerCase().includes(warehouseSearch.toLowerCase()))
                      .map((w) => (
                        <button
                          key={w.id}
                          className={`w-full text-right px-2 py-1 rounded hover:bg-gray-100 ${warehouseFilter===w.name?'bg-gray-50':''}`}
                          onClick={() => { setWarehouseFilter(w.name); setWarehouseDropdownOpen(false); }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{w.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{typeLabel(w.warehouse_type)}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          <div className="flex gap-2 items-center">
            <input id="belowMin" type="checkbox" className="rounded" checked={onlyBelowMin} onChange={(e) => setOnlyBelowMin(e.target.checked)} />
            <label htmlFor="belowMin" className="text-sm">عرض المواد تحت الحد الأدنى</label>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Supply Order Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة مادة / منتج جديد</DialogTitle>
            <DialogDescription>
              قم بإضافة مادة أو منتج جديد إلى المخزون
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm">نوع الطلب</label>
                <Select value={orderKind} onValueChange={(v) => setOrderKind(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="product">منتج</SelectItem>
                      <SelectItem value="waste">مخلفات</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 text-sm">المستودع</label>
                <Select
                  value={(() => {
                    const current = warehouseList.find(w => w.name === warehouseFilter);
                    return current ? String(current.id) : 'all';
                  })()}
                  onValueChange={(v) => {
                    const selected = warehouseList.find(w => String(w.id) === v);
                    if (selected) setWarehouseFilter(selected.name);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستودع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {warehouseList.map(w => (
                        <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 text-sm">جهة التوريد</label>
                <Select value={sourceType} onValueChange={(v) => { setSourceType(v as any); setSourceId(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجهة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="supplier">مورد</SelectItem>
                      <SelectItem value="agent">وكيل</SelectItem>
                      <SelectItem value="delivery">دليفري بوي</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 text-sm">اختيار الجهة</label>
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر من القائمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {sourceType === 'supplier' && suppliers.map((s:any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                      {sourceType === 'agent' && agents.map((a:any) => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.full_name || a.name}</SelectItem>
                      ))}
                      {sourceType === 'delivery' && deliveryBoys.map((d:any) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name || d.full_name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => {
                const wh = warehouseList.find(w => w.name === warehouseFilter) || warehouseList[0];
                if (!wh || !sourceId) return;
                router.push(`/warehouse-management/warehouses/${wh.id}/supply-orders/new?sourceType=${sourceType}&sourceId=${sourceId}&orderType=${orderKind}`);
              }}
              disabled={!sourceId || warehouseList.length === 0}
            >
              متابعة لإنشاء طلب توريد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* ملخص المخزون */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المواد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : inventory.length} مادة
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الكميات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : inventory.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()} كجم
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">المواد منخفضة المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? '...' : inventory.filter(i => i.quantity <= i.min_quantity).length} مادة
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">المستودعات النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : new Set(inventory.map(i => i.warehouse.name)).size}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* جدول المخزون */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">المادة</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>المستودع</TableHead>
                <TableHead className="text-center">الكمية</TableHead>
                <TableHead className="text-center">الحد الأدنى</TableHead>
                <TableHead className="text-center">الحد الأقصى</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-center">آخر تحديث</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">جاري تحميل البيانات...</TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item.quantity, item.min_quantity, item.max_quantity);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell>{item.category.name}</TableCell>
                      <TableCell>{item.warehouse.name}</TableCell>
                      <TableCell className="text-center">{item.quantity.toLocaleString()} {item.unit}</TableCell>
                      <TableCell className="text-center">{item.min_quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{item.max_quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${status.class}`}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-500">
                        {formatDate(item.last_update)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openAdjust(item, 'add')}>
                            <FiPlus className="h-4 w-4" /> إضافة
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openAdjust(item, 'subtract')}>
                            <FiMinusCircle className="h-4 w-4" /> خصم
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              
              {!loading && filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">لا توجد نتائج للبحث</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagementPage;
