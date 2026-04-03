"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Pencil, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { useToast } from "@/shared/ui/use-toast";
import { getOperationalProducts } from "@/domains/product-categories/services/operationalProductsService";
import type { OperationalProduct } from "@/domains/product-categories/services/operationalProductsService";
import { VisibilitySelect } from "@/domains/product-categories/components/VisibilitySelect";
import { productService } from "@/domains/product-categories/services/productService";
import { OperationalProductEditDialog } from "@/domains/product-categories/components/OperationalProductEditDialog";

export function OperationalProductsPage() {
  const [products, setProducts] = useState<OperationalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<OperationalProduct | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const list = await getOperationalProducts();
      setProducts(list);
    } catch (e) {
      console.error(e);
      toast({
        title: "خطأ",
        description: "فشل تحميل قائمة المنتجات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleVisibilityChange = async (
    productId: string,
    visibility: { visible_to_client_app: boolean; visible_to_agent_app: boolean }
  ) => {
    try {
      await productService.updateProductVisibility(productId, visibility);
      toast({ title: "تم بنجاح", description: "تم تحديث الظهور" });
      load();
    } catch (e) {
      toast({
        title: "خطأ",
        description: e instanceof Error ? e.message : "فشل تحديث الظهور",
        variant: "destructive",
      });
    }
  };

  const openEdit = (p: OperationalProduct) => {
    setEditingProduct(p);
    setEditDialogOpen(true);
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">جميع المنتجات (إعدادات تشغيلية)</CardTitle>
          <p className="text-muted-foreground text-sm">
            السعر الفعلي = سعر الفئة الفرعية + نسبة التعديل + مبلغ ثابت. يمكنك تعديل الظهور وترتيب العرض ومعدّلات السعر.
          </p>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              لا توجد منتجات.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الفئة الفرعية</TableHead>
                    <TableHead className="text-right">السعر الفعلي (ج/كجم)</TableHead>
                    <TableHead className="text-right">الظهور</TableHead>
                    <TableHead className="text-right">ترتيب العرض</TableHead>
                    <TableHead className="text-right">نسبة %</TableHead>
                    <TableHead className="text-right">مبلغ (ج)</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.subcategory_name ?? "-"}</TableCell>
                      <TableCell>{p.effective_price_per_kg.toFixed(2)}</TableCell>
                      <TableCell>
                        <VisibilitySelect
                          visibleToClientApp={p.visible_to_client_app ?? false}
                          visibleToAgentApp={p.visible_to_agent_app ?? false}
                          onVisibilityChange={(v) => handleVisibilityChange(p.id, v)}
                        />
                      </TableCell>
                      <TableCell>{p.display_order ?? 0}</TableCell>
                      <TableCell>{Number(p.price_premium_percentage ?? 0)}</TableCell>
                      <TableCell>{Number(p.price_premium_fixed_amount ?? 0)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEdit(p)}
                          title="تعديل الإعدادات"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <OperationalProductEditDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSaved={() => {
          toast({ title: "تم بنجاح", description: "تم حفظ التعديلات" });
          load();
        }}
      />
    </div>
  );
}
