"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useParams, useRouter } from "next/navigation";
import {
  fetchProductRequestById,
  approveProductRequest,
  rejectProductRequest,
  requestRevisionProductRequest,
} from "@/domains/product-requests/store/productRequestsSlice";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { REQUEST_STATUS_LABELS } from "@/domains/product-requests/domain/valueObjects/RequestStatus";
import type { ProductRequestStatus } from "@/domains/product-requests/types";
import { getCurrentUserId } from "@/lib/logger-safe";
import { useToast } from "@/shared/ui/use-toast";
import Link from "next/link";
import { FiCheck, FiX, FiEdit, FiArrowRight } from "react-icons/fi";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";

export default function ProductRequestDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const selectedRequest = useAppSelector((s) => s.productRequests.selectedRequest);
  const [loading, setLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");

  useEffect(() => {
    if (id) dispatch(fetchProductRequestById(id));
  }, [dispatch, id]);

  const handleApprove = async () => {
    const userId = await getCurrentUserId();
    if (!userId) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await dispatch(approveProductRequest({ id, userId })).unwrap();
      toast({ title: "تمت الموافقة", description: "تمت الموافقة على الطلب بنجاح" });
    } catch (e) {
      toast({
        title: "خطأ",
        description: (e as Error).message ?? "فشل في الموافقة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: "مطلوب",
        description: "يرجى إدخال سبب الرفض",
        variant: "destructive",
      });
      return;
    }
    const userId = await getCurrentUserId();
    if (!userId) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await dispatch(
        rejectProductRequest({ id, userId, reason: rejectReason.trim() })
      ).unwrap();
      toast({ title: "تم الرفض", description: "تم رفض الطلب" });
      setRejectDialogOpen(false);
      setRejectReason("");
    } catch (e) {
      toast({
        title: "خطأ",
        description: (e as Error).message ?? "فشل في الرفض",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      toast({
        title: "مطلوب",
        description: "يرجى إدخال ملاحظات التعديل المطلوبة",
        variant: "destructive",
      });
      return;
    }
    const userId = await getCurrentUserId();
    if (!userId) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await dispatch(
        requestRevisionProductRequest({
          id,
          userId,
          notes: revisionNotes.trim(),
        })
      ).unwrap();
      toast({
        title: "تم إرسال طلب التعديل",
        description: "سيتم إبلاغ مقدم الطلب بالتعديلات المطلوبة",
      });
      setRevisionDialogOpen(false);
      setRevisionNotes("");
    } catch (e) {
      toast({
        title: "خطأ",
        description: (e as Error).message ?? "فشل في طلب التعديل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRequest) {
    return (
      <DashboardLayout title="تفاصيل الطلب">
        <div className="p-6">
          <p className="text-muted-foreground">جاري التحميل...</p>
          <Link href="/waste-management/product-requests">
            <Button variant="link">العودة للقائمة</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const r = selectedRequest;
  const canReview =
    r.status === "pending" || r.status === "needs_revision";

  return (
    <DashboardLayout title={`طلب ${r.request_number}`}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/waste-management/product-requests">
            <Button variant="ghost" size="sm">
              العودة للقائمة
            </Button>
          </Link>
          <FiArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>تفاصيل الطلب</CardTitle>
            <Badge
              variant={
                r.status === "approved"
                  ? "default"
                  : r.status === "rejected"
                  ? "destructive"
                  : "secondary"
              }
            >
              {REQUEST_STATUS_LABELS[r.status as ProductRequestStatus]}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <span className="font-medium">رقم الطلب:</span>{" "}
              <span className="font-mono">{r.request_number}</span>
            </p>
            <p>
              <span className="font-medium">اسم المنتج:</span> {r.product_name}
            </p>
            <p>
              <span className="font-medium">الفئة:</span>{" "}
              {r.waste_sub_categories?.name ?? r.waste_main_categories?.name ?? "—"}
            </p>
            {r.description && (
              <p>
                <span className="font-medium">الوصف:</span> {r.description}
              </p>
            )}
            <p>
              <span className="font-medium">السعر المقترح:</span>{" "}
              {r.proposed_price != null ? `${r.proposed_price} ج.م` : "—"}
            </p>
            <p>
              <span className="font-medium">تاريخ الإنشاء:</span>{" "}
              {r.created_at
                ? new Date(r.created_at).toLocaleString("ar-EG")
                : "—"}
            </p>
            {r.review_notes && (
              <p>
                <span className="font-medium">ملاحظات المراجعة:</span>{" "}
                {r.review_notes}
              </p>
            )}
            {r.rejection_reason && (
              <p>
                <span className="font-medium">سبب الرفض:</span>{" "}
                {r.rejection_reason}
              </p>
            )}
          </CardContent>
        </Card>

        {canReview && (
          <Card>
            <CardHeader>
              <CardTitle>إجراءات المراجعة</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <FiCheck className="ml-2" />
                موافقة
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
                disabled={loading}
              >
                <FiX className="ml-2" />
                رفض
              </Button>
              <Button
                variant="outline"
                onClick={() => setRevisionDialogOpen(true)}
                disabled={loading}
              >
                <FiEdit className="ml-2" />
                طلب تعديل
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>سبب الرفض</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label>يرجى إدخال سبب الرفض (مطلوب)</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="سبب الرفض..."
                rows={3}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                إلغاء
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={loading}>
                تأكيد الرفض
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>طلب تعديل</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label>التعديلات المطلوبة (مطلوب)</Label>
              <Textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="اذكر التعديلات المطلوبة..."
                rows={3}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleRequestRevision} disabled={loading}>
                إرسال طلب التعديل
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
