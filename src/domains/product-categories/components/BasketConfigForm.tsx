import React, { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import { SubCategoryBucketConfig, basket_size, basket_supplier_type } from '@/domains/product-categories/api/basketConfigService';

interface BasketConfigFormProps {
  initialData?: Omit<SubCategoryBucketConfig, 'id' | 'created_at' | 'updated_at' | 'subcategory_id' | 'description'> | null;
  onSave: (config: Omit<SubCategoryBucketConfig, 'id' | 'created_at' | 'updated_at' | 'subcategory_id' | 'description'>) => void;
  onCancel: () => void;
}

export const BasketConfigForm: React.FC<BasketConfigFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<SubCategoryBucketConfig, 'id' | 'created_at' | 'updated_at' | 'subcategory_id' | 'description'>>({
    supplier_type: 'AUTHORIZED_AGENT',
    basket_size: 'SMALL',
    basket_empty_weight_kg: 0,
    max_net_weight_kg: 0,
    max_volume_liters: null,
    min_fill_percentage: 0,
    max_items_count: null,
    requires_separation: false,
    special_handling_notes: null,
    is_active: true,
  });

  useEffect(() => {
    if (initialData) {
      // Ensure initialData conforms to the Omit type
      setFormData(initialData);
    } else {
      // Reset to default empty state if no initialData is provided
      setFormData({
        supplier_type: 'AUTHORIZED_AGENT',
        basket_size: 'SMALL',
        basket_empty_weight_kg: 0,
        max_net_weight_kg: 0,
        max_volume_liters: null,
        min_fill_percentage: 0,
        max_items_count: null,
        requires_separation: false,
        special_handling_notes: null,
        is_active: true,
      });
    }
  }, [initialData]);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Determine if the field should be nullable (max_volume_liters, max_items_count)
    const isNullable = ['max_volume_liters', 'max_items_count'].includes(name);

    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? (isNullable ? null : 0) : (isNaN(parseFloat(value)) ? (isNullable ? null : 0) : parseFloat(value)),
    }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value,
    }));
  };

  const handleSelectChange = (name: 'supplier_type' | 'basket_size', value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value as basket_supplier_type | basket_size,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="supplier_type">نوع المورد</Label>
        <Select name="supplier_type" value={formData.supplier_type} onValueChange={(value) => handleSelectChange('supplier_type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="اختر نوع المورد" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AUTHORIZED_AGENT">وكيل معتمد</SelectItem>
            <SelectItem value="HOME_CLIENT">عميل منزلي</SelectItem>
            <SelectItem value="SCHOOL">مدرسة</SelectItem>
            <SelectItem value="RESTAURANT">مطعم</SelectItem>
            <SelectItem value="OFFICE">مكتب</SelectItem>
            <SelectItem value="OTHER">أخرى</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="basket_size">حجم السلة</Label>
        <Select name="basket_size" value={formData.basket_size} onValueChange={(value) => handleSelectChange('basket_size', value)}>
          <SelectTrigger>
            <SelectValue placeholder="اختر حجم السلة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SMALL">صغيرة</SelectItem>
            <SelectItem value="MEDIUM">متوسطة</SelectItem>
            <SelectItem value="LARGE">كبيرة</SelectItem>
            <SelectItem value="EXTRA_LARGE">كبيرة جداً</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="basket_empty_weight_kg">الوزن الفارغ للسلة (كجم)</Label>
        <Input
          id="basket_empty_weight_kg"
          name="basket_empty_weight_kg"
          type="number"
          value={formData.basket_empty_weight_kg}
          onChange={handleNumberChange}
        />
      </div>
      <div>
        <Label htmlFor="max_net_weight_kg">الوزن الصافي الأقصى (كجم)</Label>
        <Input
          id="max_net_weight_kg"
          name="max_net_weight_kg"
          type="number"
          value={formData.max_net_weight_kg}
          onChange={handleNumberChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="max_volume_liters">الحد الأقصى للحجم (لتر)</Label>
        <Input
          id="max_volume_liters"
          name="max_volume_liters"
          type="number"
          value={formData.max_volume_liters ?? ''}
          onChange={handleNumberChange}
        />
      </div>
      <div>
        <Label htmlFor="min_fill_percentage">الحد الأدنى لنسبة التعبئة (%)</Label>
        <Input
          id="min_fill_percentage"
          name="min_fill_percentage"
          type="number"
          value={formData.min_fill_percentage}
          onChange={handleNumberChange}
        />
      </div>
      <div>
        <Label htmlFor="max_items_count">الحد الأقصى لعدد العناصر (اختياري)</Label>
        <Input
          id="max_items_count"
          name="max_items_count"
          type="number"
          value={formData.max_items_count ?? ''}
          onChange={handleNumberChange}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="requires_separation"
          name="requires_separation"
          checked={formData.requires_separation}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_separation: checked }))}
        />
        <Label htmlFor="requires_separation">يتطلب فصل</Label>
      </div>
      <div>
        <Label htmlFor="special_handling_notes">ملاحظات خاصة (اختياري)</Label>
        <Textarea
          id="special_handling_notes"
          name="special_handling_notes"
          value={formData.special_handling_notes ?? ''}
          onChange={handleTextChange}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit">حفظ</Button>
      </div>
    </form>
  );
};
