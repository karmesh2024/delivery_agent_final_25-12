"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { categoryService } from "@/domains/product-categories/api/categoryService";
import type { Category, SubCategory } from "@/types";
import type { ProductRequestCreate } from "../types";

interface ProductRequestFormProps {
  defaultValues?: Partial<ProductRequestCreate>;
  onSubmit: (data: ProductRequestCreate) => void;
  loading?: boolean;
  submitLabel?: string;
}

export function ProductRequestForm({
  defaultValues,
  onSubmit,
  loading = false,
  submitLabel = "تقديم الطلب",
}: ProductRequestFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [mainCategoryId, setMainCategoryId] = useState<string>(
    defaultValues?.main_category_id != null
      ? String(defaultValues.main_category_id)
      : ""
  );
  const [form, setForm] = useState<Partial<ProductRequestCreate>>({
    product_name: "",
    requested_by_department: "",
    main_category_id: null,
    sub_category_id: null,
    description: "",
    proposed_price: undefined,
    cost_price: undefined,
    priority: "normal",
    ...defaultValues,
  });

  useEffect(() => {
    categoryService.getCategories().then(({ data }) => {
      setCategories(data || []);
    });
  }, []);

  useEffect(() => {
    if (!mainCategoryId) {
      setSubCategories([]);
      setForm((p) => ({ ...p, sub_category_id: null }));
      return;
    }
    categoryService.getSubCategories(mainCategoryId).then(({ data }) => {
      setSubCategories(data || []);
      setForm((p) => ({ ...p, sub_category_id: null }));
    });
  }, [mainCategoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ProductRequestCreate = {
      product_name: form.product_name!,
      requested_by_department: form.requested_by_department || null,
      main_category_id: form.main_category_id ?? null,
      sub_category_id: form.sub_category_id ?? null,
      description: form.description || null,
      specifications: form.specifications ?? null,
      proposed_price: form.proposed_price ?? null,
      cost_price: form.cost_price ?? null,
      profit_margin_percentage: form.profit_margin_percentage ?? null,
      market_study_url: form.market_study_url || null,
      financial_analysis_url: form.financial_analysis_url || null,
      logistics_assessment_url: form.logistics_assessment_url || null,
      procurement_report_url: form.procurement_report_url || null,
      status: "pending",
      priority: (form.priority as "normal" | "high" | "urgent") || "normal",
      review_notes: null,
      rejection_reason: null,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid gap-4">
        <Label htmlFor="product_name">اسم المنتج *</Label>
        <Input
          id="product_name"
          value={form.product_name ?? ""}
          onChange={(e) =>
            setForm((p) => ({ ...p, product_name: e.target.value }))
          }
          required
          placeholder="اسم المنتج المقترح"
        />
      </div>
      <div className="grid gap-4">
        <Label htmlFor="department">الإدارة / القسم</Label>
        <Input
          id="department"
          value={form.requested_by_department ?? ""}
          onChange={(e) =>
            setForm((p) => ({ ...p, requested_by_department: e.target.value }))
          }
          placeholder="مثال: تسويق، مشتريات، لوجستيات"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>الفئة الرئيسية</Label>
          <Select
            value={mainCategoryId}
            onValueChange={(v) => {
              setMainCategoryId(v);
              setForm((p) => ({
                ...p,
                main_category_id: v ? Number(v) : null,
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الفئة" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>الفئة الفرعية</Label>
          <Select
            value={form.sub_category_id != null ? String(form.sub_category_id) : ""}
            onValueChange={(v) =>
              setForm((p) => ({
                ...p,
                sub_category_id: v ? Number(v) : null,
              }))
            }
            disabled={!mainCategoryId}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر الفئة الفرعية" />
            </SelectTrigger>
            <SelectContent>
              {subCategories.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4">
        <Label htmlFor="description">الوصف</Label>
        <Textarea
          id="description"
          value={form.description ?? ""}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          placeholder="وصف المنتج والاستخدام"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="proposed_price">السعر المقترح (ج.م)</Label>
          <Input
            id="proposed_price"
            type="number"
            step="0.01"
            min="0"
            value={form.proposed_price ?? ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                proposed_price: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              }))
            }
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="cost_price">سعر التكلفة (ج.م)</Label>
          <Input
            id="cost_price"
            type="number"
            step="0.01"
            min="0"
            value={form.cost_price ?? ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                cost_price: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            placeholder="0.00"
          />
        </div>
      </div>
      <div>
        <Label>الأولوية</Label>
        <Select
          value={form.priority ?? "normal"}
          onValueChange={(v) =>
            setForm((p) => ({ ...p, priority: v as "normal" | "high" | "urgent" }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">عادية</SelectItem>
            <SelectItem value="high">عالية</SelectItem>
            <SelectItem value="urgent">عاجلة</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "جاري الحفظ..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
