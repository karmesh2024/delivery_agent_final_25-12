import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Textarea } from '@/shared/ui/textarea';
import { Prisma } from '@prisma/client'; // Import Prisma
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'; // Import Tooltip components
import { FiInfo } from 'react-icons/fi'; // Import info icon

export interface Field {
  name: string;
  label_ar: string;
  label_en?: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  options?: string[];
  required?: boolean;
  is_decimal?: boolean; // For number type to specify decimal steps
}

// Define a more specific interface for fields coming from Prisma.JsonObject
interface PrismaField extends Prisma.JsonObject {
  name: string;
  label_ar: string;
  label_en?: string | null;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  options?: Prisma.JsonArray | null;
  required?: boolean | null;
  is_decimal?: boolean | null;
}

interface SchemaBuilderProps {
  initialSchema?: Prisma.JsonObject | null;
  onChange: (schema: Prisma.JsonObject | null) => void;
}

export const SchemaBuilder: React.FC<SchemaBuilderProps> = ({
  initialSchema,
  onChange,
}) => {
  const [fields, setFields] = useState<Field[]>([]);

  // Effect to synchronize internal state with initialSchema prop
  useEffect(() => {
    if (initialSchema !== undefined) {
      try {
        let newParsedFields: Field[] = [];
        if (initialSchema && typeof initialSchema === 'object' && 'fields' in initialSchema && Array.isArray(initialSchema.fields)) {
          newParsedFields = (initialSchema.fields as Prisma.JsonArray).map((item: Prisma.JsonValue) => {
            // Ensure item is a valid object before casting
            if (typeof item === 'object' && item !== null && 'name' in item && 'label_ar' in item && 'type' in item) {
              const prismaField = item as PrismaField; // Cast to PrismaField
              return {
                name: prismaField.name,
                label_ar: prismaField.label_ar,
                label_en: prismaField.label_en ?? undefined,
                type: prismaField.type,
                options: Array.isArray(prismaField.options) ? prismaField.options.map((opt) => String(opt)) : undefined, // Removed explicit type cast for opt
                required: prismaField.required ?? false,
                is_decimal: prismaField.is_decimal ?? false,
              };
            }
            return null; // Or handle invalid items as needed
          }).filter(Boolean) as Field[]; // Filter out nulls and cast
        }

        // Only update if the internal state is truly different to prevent unnecessary renders
        if (JSON.stringify(fields) !== JSON.stringify(newParsedFields)) {
          setFields(newParsedFields);
        }
      } catch (e) {
        console.error("Failed to parse initial schema:", e);
        setFields([]);
      }
    }
  }, [initialSchema]); // Only depends on initialSchema

  // Helper function to update internal state and notify parent
  const handleUpdate = useCallback((updatedFields: Field[]) => {
    setFields(updatedFields);
    onChange(updatedFields.length > 0 ? { fields: updatedFields } as unknown as Prisma.JsonObject : null);
  }, [onChange]);

  const handleAddField = () => {
    const newFields = [
      ...fields,
      { name: '', label_ar: '', type: 'text' as Field['type'], required: false, is_decimal: false },
    ];
    handleUpdate(newFields);
  };

  const handleFieldChange = (index: number, fieldName: keyof Field, value: string | boolean) => {
    const newFields = [...fields];
    if (fieldName === 'options') {
      if (typeof value === 'string') {
        newFields[index] = { ...newFields[index], [fieldName]: value.split(',').map((item: string) => item.trim()) };
      }
    } else if (fieldName === 'type') {
      newFields[index] = { ...newFields[index], [fieldName]: value as Field['type'], options: undefined, is_decimal: undefined };
    } else {
      newFields[index] = { ...newFields[index], [fieldName]: value };
    }
    handleUpdate(newFields);
  };

  const handleRemoveField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    handleUpdate(newFields);
  };

  return (
    <div className="space-y-4">
      <TooltipProvider delayDuration={200}>
        <div className="space-y-2">
          {/* Ensure fields is an array before mapping over it */}
          {Array.isArray(fields) && fields.map((field, index) => (
            <div key={index} className="border p-4 rounded-md space-y-2 relative">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleRemoveField(index)}
              >
                X
              </Button>
              <div>
                <Label htmlFor={`field-name-${index}`} className="flex items-center gap-2">
                  اسم الحقل (فريد)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">الاسم الفريد الذي سيُستخدم في قاعدة البيانات وهيكل المنتج لتحديد هذا الحقل. يجب أن يكون فريدًا ولا يحتوي على مسافات.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id={`field-name-${index}`}
                  value={field.name}
                  onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyPress={(e) => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); }}
                  required
                  placeholder="مثال: color_hex, weight_kg"
                />
              </div>
              <div>
                <Label htmlFor={`field-label_ar-${index}`} className="flex items-center gap-2">
                  التسمية (عربي)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">التسمية العربية لهذا الحقل كما ستظهر للمستخدمين في واجهة التطبيق.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id={`field-label_ar-${index}`}
                  value={field.label_ar}
                  onChange={(e) => handleFieldChange(index, 'label_ar', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyPress={(e) => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); }}
                  required
                  placeholder="مثال: اللون, الوزن"
                />
              </div>
              <div>
                <Label htmlFor={`field-label_en-${index}`} className="flex items-center gap-2">
                  التسمية (انجليزي)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">التسمية الإنجليزية لهذا الحقل (اختياري)، مفيدة للغات متعددة.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id={`field-label_en-${index}`}
                  value={field.label_en || ''}
                  onChange={(e) => handleFieldChange(index, 'label_en', e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyPress={(e) => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); }}
                  placeholder="Example: Color, Weight"
                />
              </div>
              <div>
                <Label htmlFor={`field-type-${index}`} className="flex items-center gap-2">
                  النوع
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">نوع البيانات الذي يمكن لهذا الحقل تخزينه (نص، رقم، قائمة اختيار، إلخ).</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select
                  value={field.type}
                  onValueChange={(value) => handleFieldChange(index, 'type', value as Field['type'])}
                >
                  <SelectTrigger id={`field-type-${index}`}>
                    <SelectValue placeholder="اختر نوع الحقل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">نص</SelectItem>
                    <SelectItem value="number">رقم</SelectItem>
                    <SelectItem value="select">قائمة اختيار</SelectItem>
                    <SelectItem value="textarea">مساحة نص</SelectItem>
                    <SelectItem value="checkbox">مربع اختيار</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {field.type === 'select' && (
                <div>
                  <Label htmlFor={`field-options-${index}`} className="flex items-center gap-2">
                    خيارات (مفصولة بفاصلة)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">أدخل الخيارات المتاحة للقائمة المنسدلة، مفصولة بفاصلة (مثال: أحمر,أزرق,أخضر).</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Textarea
                    id={`field-options-${index}`}
                    value={field.options?.join(',') || ''}
                    onChange={(e) => handleFieldChange(index, 'options', e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyPress={(e) => { if (e.key === ' ' || e.key === 'Enter') e.preventDefault(); }}
                    placeholder="مثال: صغير, متوسط, كبير"
                  />
                </div>
              )}

              {field.type === 'number' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`field-is_decimal-${index}`}
                    checked={field.is_decimal || false}
                    onCheckedChange={(checked) =>
                      handleFieldChange(index, 'is_decimal', typeof checked === 'boolean' ? checked : false)
                    }
                  />
                  <Label htmlFor={`field-is_decimal-${index}`} className="flex items-center gap-2">
                    عدد عشري؟
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">حدد هذا الخيار إذا كان الحقل الرقمي يمكن أن يقبل قيمًا عشرية (مثل 10.5)، وإلا فسيقبل أعدادًا صحيحة فقط.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`field-required-${index}`}
                  checked={field.required || false}
                  onCheckedChange={(checked) =>
                    handleFieldChange(index, 'required', typeof checked === 'boolean' ? checked : false)
                  }
                />
                <Label htmlFor={`field-required-${index}`} className="flex items-center gap-2">
                  مطلوب؟
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">حدد هذا الخيار إذا كان إدخال البيانات في هذا الحقل إلزاميًا عند إضافة أو تعديل المنتج.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
              </div>
            </div>
          ))}
        </div>
      </TooltipProvider>
      <Button type="button" onClick={handleAddField} className="mt-4">
        إضافة حقل جديد
      </Button>
    </div>
  );
};
