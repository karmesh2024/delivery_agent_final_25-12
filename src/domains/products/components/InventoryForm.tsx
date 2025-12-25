import React, { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { FiInfo, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { CommonProductFormData, MeasurementUnit } from '@/domains/products/types/types';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';

interface InventoryFormProps {
  formData: CommonProductFormData;
  onFormChange: <K extends keyof CommonProductFormData>(field: K, value: CommonProductFormData[K]) => void;
  isEditing: boolean;
  onCatalogProductDetected?: (catalogProductId: string) => void;
}

interface WarehouseInventoryInfo {
  warehouse_name: string;
  quantity: number;
  unit: string | null;
}

const InventoryForm: React.FC<InventoryFormProps> = ({
  formData,
  onFormChange,
  isEditing,
  onCatalogProductDetected,
}) => {
  const [warehouseInventory, setWarehouseInventory] = useState<WarehouseInventoryInfo[]>([]);
  const [totalWarehouseQuantity, setTotalWarehouseQuantity] = useState<number | null>(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? null : parseInt(value, 10);
    onFormChange(name as keyof CommonProductFormData, numericValue);
  };

  const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? null : parseFloat(value);
    onFormChange(name as keyof CommonProductFormData, numericValue);
  };

  // Search for warehouse inventory by SKU
  const searchWarehouseInventory = async () => {
    if (!formData.sku || formData.sku.trim() === '') {
      setInventoryError('يرجى إدخال SKU للبحث عن المخزون');
      return;
    }

    setIsLoadingInventory(true);
    setInventoryError(null);

    try {
      const response = await fetch(`/api/products/search-warehouse-inventory?sku=${encodeURIComponent(formData.sku)}`);
      
      if (!response.ok) {
        throw new Error('فشل جلب بيانات المخزون');
      }

      const data = await response.json();
      
      if (data.inventory && data.inventory.length > 0) {
        // Get the first matching product's inventory
        const firstProductInventory = data.inventory[0];
        setTotalWarehouseQuantity(firstProductInventory.total_quantity);

        const productInfo = firstProductInventory.product;
        if (
          !isEditing &&
          productInfo &&
          productInfo.is_catalog &&
          productInfo.id &&
          onCatalogProductDetected
        ) {
          const detectedId =
            typeof productInfo.id === 'bigint'
              ? productInfo.id.toString()
              : String(productInfo.id);
          onCatalogProductDetected(detectedId);
        }
        
        const warehouses = firstProductInventory.warehouses.map((inv: any) => ({
          warehouse_name: inv.warehouses?.name || 'مخزن غير معروف',
          quantity: parseFloat(inv.quantity?.toString() || '0'),
          unit: inv.unit,
        }));
        
        setWarehouseInventory(warehouses);
      } else {
        setTotalWarehouseQuantity(0);
        setWarehouseInventory([]);
        setInventoryError('لا يوجد مخزون لهذا المنتج في المخازن');
      }
    } catch (error) {
      console.error('Error fetching warehouse inventory:', error);
      setInventoryError('حدث خطأ أثناء جلب بيانات المخزون');
      setWarehouseInventory([]);
      setTotalWarehouseQuantity(null);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Auto-search when SKU changes (debounced)
  useEffect(() => {
    if (formData.sku && formData.sku.trim() !== '' && !isEditing) {
      const timeoutId = setTimeout(() => {
        searchWarehouseInventory();
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timeoutId);
    } else {
      setWarehouseInventory([]);
      setTotalWarehouseQuantity(null);
      setInventoryError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.sku, isEditing]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* معلومات الوحدة والقياس */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">معلومات الوحدة والقياس</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="measurement_unit" className="flex items-center gap-2">
                نوع الوحدة
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">نوع الوحدة المستخدمة لقياس المنتج.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Select
                value={formData.measurement_unit}
                onValueChange={(value: MeasurementUnit) => onFormChange('measurement_unit', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">قطعة</SelectItem>
                  <SelectItem value="dozen">دزينة</SelectItem>
                  <SelectItem value="kg">كيلوجرام</SelectItem>
                  <SelectItem value="liter">لتر</SelectItem>
                  <SelectItem value="pack">عبوة</SelectItem>
                  <SelectItem value="box">صندوق</SelectItem>
                  <SelectItem value="set">مجموعة</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="weight" className="flex items-center gap-2">
                الوزن (كجم)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">وزن المنتج بالكيلوجرام.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.01"
                value={formData.weight?.toString() ?? ''}
                onChange={handleDecimalChange}
                placeholder="مثال: 0.5"
              />
            </div>
          </div>
        </div>

        {/* معلومات المخزون والكميات */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">معلومات المخزون والكميات</h3>
          
          {/* Warehouse Inventory Search Section */}
          {!isEditing && formData.sku && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-blue-800">
                  المخزون المتاح في المخازن
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={searchWarehouseInventory}
                  disabled={isLoadingInventory || !formData.sku}
                  className="flex items-center gap-2"
                >
                  {isLoadingInventory ? (
                    <>
                      <FiRefreshCw className="h-4 w-4 animate-spin" />
                      جاري البحث...
                    </>
                  ) : (
                    <>
                      <FiSearch className="h-4 w-4" />
                      البحث عن المخزون
                    </>
                  )}
                </Button>
              </div>

              {inventoryError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{inventoryError}</AlertDescription>
                </Alert>
              )}

              {totalWarehouseQuantity !== null && !inventoryError && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="text-sm font-medium text-gray-700">إجمالي الكمية في المخازن:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {totalWarehouseQuantity.toLocaleString()} {warehouseInventory[0]?.unit || 'وحدة'}
                    </span>
                  </div>

                  {warehouseInventory.length > 0 && (
                    <div className="mt-2">
                      <Label className="text-xs text-gray-600 mb-1 block">التفاصيل حسب المخزن:</Label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {warehouseInventory.map((inv, idx) => (
                          <div key={idx} className="flex items-center justify-between p-1.5 bg-white rounded text-xs">
                            <span className="text-gray-600">{inv.warehouse_name}:</span>
                            <span className="font-medium text-gray-800">
                              {inv.quantity.toLocaleString()} {inv.unit || 'وحدة'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {totalWarehouseQuantity > 0 && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-700">
                        💡 يمكنك استخدام الكمية المتاحة من المخازن ({totalWarehouseQuantity.toLocaleString()}) كقيمة أولية للمخزون
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => onFormChange('stock_quantity', Math.floor(totalWarehouseQuantity))}
                      >
                        استخدام الكمية من المخازن
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock_quantity" className="flex items-center gap-2">
                كمية المخزون الحالية
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">الكمية المتوفرة من المنتج في المخزون حالياً.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="stock_quantity"
                name="stock_quantity"
                type="number"
                value={formData.stock_quantity?.toString() ?? ''}
                onChange={handleNumberChange}
                placeholder="مثال: 100"
              />
            </div>

            <div>
              <Label htmlFor="min_stock_level" className="flex items-center gap-2">
                الحد الأدنى للمخزون
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">مستوى المخزون الذي يتطلب إعادة الطلب.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="min_stock_level"
                name="min_stock_level"
                type="number"
                value={formData.min_stock_level?.toString() ?? ''}
                onChange={handleNumberChange}
                placeholder="مثال: 10"
              />
            </div>
          </div>
        </div>

        {/* معلومات التكلفة */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">معلومات التكلفة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost_price" className="flex items-center gap-2">
                سعر التكلفة
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">تكلفة شراء المنتج من المورد.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="cost_price"
                name="cost_price"
                type="number"
                step="0.01"
                value={formData.cost_price?.toString() ?? ''}
                onChange={handleDecimalChange}
                placeholder="مثال: 50.00"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">معلومات المخزون</h3>
          <p className="text-sm text-blue-600">
            إدارة كمية المخزون والتكلفة والوزن للمنتج. هذه المعلومات تساعد في تتبع المخزون وحساب الأرباح.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default InventoryForm;
