'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { toast } from 'sonner';
import { Prisma } from '@prisma/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { FiInfo } from 'react-icons/fi';

interface ProductType {
  id: string;
  name_ar: string;
  name_en: string | null;
  schema_template: Prisma.JsonObject;
  created_at: string;
}

export default function ProductTypesPage() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [schemaTemplate, setSchemaTemplate] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProductTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/product-types');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProductTypes(data);
    } catch (error) {
      console.error('Failed to fetch product types:', error);
      toast.error('فشل في جلب أنواع المنتجات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const parsedSchema = JSON.parse(schemaTemplate);
      const response = await fetch('/api/product-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name_ar: nameAr,
          name_en: nameEn,
          schema_template: parsedSchema,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      toast.success('تم إضافة نوع المنتج بنجاح.');
      setNameAr('');
      setNameEn('');
      setSchemaTemplate('');
      fetchProductTypes(); // Refresh the list
    } catch (error) {
      console.error('Failed to add product type:', error);
      toast.error(`فشل في إضافة نوع المنتج: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>إضافة نوع منتج جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TooltipProvider delayDuration={200}>
              <div>
                <Label htmlFor="name_ar" className="flex items-center gap-2">
                  الاسم بالعربية
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">الاسم العربي لنوع المنتج.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="name_ar"
                  value={nameAr}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNameAr(e.target.value)}
                  required
                  placeholder="مثال: إلكترونيات، ملابس"
                />
              </div>
              <div>
                <Label htmlFor="name_en" className="flex items-center gap-2">
                  الاسم بالإنجليزية (اختياري)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">الاسم الإنجليزي لنوع المنتج.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="name_en"
                  value={nameEn}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNameEn(e.target.value)}
                  placeholder="Example: Electronics, Apparel"
                />
              </div>
              <div>
                <Label htmlFor="schema_template" className="flex items-center gap-2">
                  قالب الهيكل (JSON)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <FiInfo className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">تعريف السمات الديناميكية للمنتج.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Textarea
                  id="schema_template"
                  value={schemaTemplate}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSchemaTemplate(e.target.value)}
                  rows={10}
                  placeholder="أدخل هيكل JSON هنا"
                  required
                />
              </div>
            </TooltipProvider>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الإضافة...' : 'إضافة نوع منتج'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}