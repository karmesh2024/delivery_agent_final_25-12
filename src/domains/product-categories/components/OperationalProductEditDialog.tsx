"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { VisibilitySelect } from "@/domains/product-categories/components/VisibilitySelect";
import { updateProductOperational } from "@/domains/product-categories/services/operationalProductsService";
import type { OperationalProduct } from "@/domains/product-categories/services/operationalProductsService";

export interface OperationalProductEditDialogProps {
  open: boolean;
  onClose: () => void;
  product: OperationalProduct | null;
  onSaved: () => void;
}

export function OperationalProductEditDialog({
  open,
  onClose,
  product,
  onSaved,
}: OperationalProductEditDialogProps) {
  const [visibleToClient, setVisibleToClient] = useState(false);
  const [visibleToAgent, setVisibleToAgent] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [pricePremiumPercent, setPricePremiumPercent] = useState<string>("0");
  const [pricePremiumFixed, setPricePremiumFixed] = useState<string>("0");
  const [clientPricingMode, setClientPricingMode] = useState<'per_kg' | 'per_piece'>('per_kg');
  const [agentPricingMode, setAgentPricingMode] = useState<'per_kg' | 'per_piece'>('per_kg');
  const [weight, setWeight] = useState<string>("1000"); // نعرضه بالجرامات
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    setVisibleToClient(product.visible_to_client_app ?? false);
    setVisibleToAgent(product.visible_to_agent_app ?? false);
    setDisplayOrder(Number(product.display_order ?? 0));
    setPricePremiumPercent(String(product.price_premium_percentage ?? 0));
    setPricePremiumFixed(String(product.price_premium_fixed_amount ?? 0));
    setClientPricingMode(product.pricing_mode === 'per_piece' ? 'per_piece' : 'per_kg');
    setAgentPricingMode(product.agent_pricing_mode === 'per_piece' ? 'per_piece' : 'per_kg');
    
    // إذا كان الوزن محفوظ كـ كجم (مثلا 0.150) نظهره كـ 150 جرام
    // إذا كان أكبر من 1 اعتبره جرام (بحسب ما سبق) لتسهيل العرض
    const w = product.weight || 0;
    setWeight(String(w < 1 && w > 0 ? w * 1000 : w));
  }, [product]);

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      await updateProductOperational(product.id, {
        visible_to_client_app: visibleToClient,
        visible_to_agent_app: visibleToAgent,
        display_order: displayOrder,
        price_premium_percentage: parseFloat(pricePremiumPercent) || 0,
        price_premium_fixed_amount: parseFloat(pricePremiumFixed) || 0,
        pricing_mode: clientPricingMode,
        agent_pricing_mode: agentPricingMode,
        weight: (clientPricingMode === 'per_piece' || agentPricingMode === 'per_piece') 
                  ? (parseFloat(weight) / 1000) 
                  : (parseFloat(weight) || 0),
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل إعدادات المنتج: {product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label className="mb-2 block">الظهور</Label>
            <VisibilitySelect
              visibleToClientApp={visibleToClient}
              visibleToAgentApp={visibleToAgent}
              onVisibilityChange={(v) => {
                setVisibleToClient(v.visible_to_client_app);
                setVisibleToAgent(v.visible_to_agent_app);
              }}
            />
          </div>
          <div>
            <Label htmlFor="display_order">ترتيب العرض</Label>
            <Input
              id="display_order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="price_premium_percent">نسبة تعديل السعر % (عن سعر الفئة)</Label>
            <Input
              id="price_premium_percent"
              type="number"
              step="0.01"
              value={pricePremiumPercent}
              onChange={(e) => setPricePremiumPercent(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="price_premium_fixed">مبلغ ثابت (ج) يُضاف لسعر الكيلو</Label>
            <Input
              id="price_premium_fixed"
              type="number"
              step="0.01"
              value={pricePremiumFixed}
              onChange={(e) => setPricePremiumFixed(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="space-y-4 border rounded-lg p-3 bg-blue-50/50">
            <Label className="block text-blue-800 font-bold">إعدادات سلة التطبيق للمنتج</Label>
            
            <div className="grid grid-cols-2 gap-4">
              {/* إعدادات العميل */}
              <div className="border-l border-blue-200 pl-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">تطبيق العميل</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={clientPricingMode === 'per_kg'}
                      onChange={() => setClientPricingMode('per_kg')}
                      disabled={saving}
                    />
                    <span className="text-sm font-medium">عرض بالوزن (كجم)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={clientPricingMode === 'per_piece'}
                      onChange={() => setClientPricingMode('per_piece')}
                      disabled={saving}
                    />
                    <span className="text-sm font-medium text-blue-700">عرض بالقطعة</span>
                  </label>
                </div>
              </div>

              {/* إعدادات الوكيل */}
              <div>
                <p className="text-sm font-semibold text-teal-900 mb-2">تطبيق الوكيل</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={agentPricingMode === 'per_kg'}
                      onChange={() => setAgentPricingMode('per_kg')}
                      disabled={saving}
                    />
                    <span className="text-sm font-medium">الاستلام بالوزن (كجم)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={agentPricingMode === 'per_piece'}
                      onChange={() => setAgentPricingMode('per_piece')}
                      disabled={saving}
                    />
                    <span className="text-sm font-medium text-teal-700">الاستلام بالقطعة</span>
                  </label>
                </div>
              </div>
            </div>

            {(clientPricingMode === 'per_piece' || agentPricingMode === 'per_piece') && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <Label htmlFor="weight" className="text-blue-800 font-semibold">وزن القطعة الواحدة (بالجرام)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="mt-1 max-w-[200px]"
                  placeholder="مثال: 150"
                  disabled={saving}
                />
                <p className="text-[10px] text-blue-600 mt-1">يُستخدم هذا الوزن المشترك لتحويل السعر عند اختيار العرض أو الاستلام بالقطعة.</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
