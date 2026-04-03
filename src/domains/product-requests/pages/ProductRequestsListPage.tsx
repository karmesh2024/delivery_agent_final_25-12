"use client";

import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchProductRequests,
  setFilters,
  setSelectedRequest,
} from "../store/productRequestsSlice";
import { DashboardLayout } from "@/shared/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { REQUEST_STATUS_LABELS } from "../domain/valueObjects/RequestStatus";
import type { ProductRequest, ProductRequestStatus } from "../types";
import Link from "next/link";
import { FiPlus, FiEye, FiRefreshCw } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const ALL_STATUS_VALUE = "__all__";

const statusOptions: { value: string; label: string }[] = [
  { value: ALL_STATUS_VALUE, label: "جميع الحالات" },
  ...(Object.entries(REQUEST_STATUS_LABELS) as [ProductRequestStatus, string][]).map(
    ([value, label]) => ({ value, label })
  ),
];

export function ProductRequestsListPage() {
  const dispatch = useAppDispatch();
  const {
    requests: { data: requests, loading, error },
    filters,
  } = useAppSelector((s) => s.productRequests);

  useEffect(() => {
    dispatch(
      fetchProductRequests({
        status: filters.status && filters.status !== ALL_STATUS_VALUE ? filters.status : undefined,
        department: filters.department || undefined,
        main_category_id: filters.main_category_id
          ? Number(filters.main_category_id)
          : undefined,
        sub_category_id: filters.sub_category_id
          ? Number(filters.sub_category_id)
          : undefined,
      })
    );
  }, [dispatch, filters.status, filters.department, filters.main_category_id, filters.sub_category_id]);

  const handleFilterStatus = (value: string) => {
    dispatch(setFilters({ status: value === ALL_STATUS_VALUE ? "" : value }));
  };

  return (
    <DashboardLayout title="طلبات إضافة المنتجات الجديدة">
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">طلبات إضافة المنتجات الجديدة</h1>
          <div className="flex items-center gap-2">
            <Select
              value={filters.status || ALL_STATUS_VALUE}
              onValueChange={handleFilterStatus}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                dispatch(
                  fetchProductRequests({
                    status: filters.status && filters.status !== ALL_STATUS_VALUE ? filters.status : undefined,
                    department: filters.department || undefined,
                  })
                )
              }
              disabled={loading}
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
            </Button>
            <Link href="/waste-management/product-requests/new">
              <Button>
                <FiPlus className="ml-2" />
                طلب جديد
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="text-destructive text-sm mb-4">{error}</p>
            )}
            {loading ? (
              <p className="text-muted-foreground">جاري التحميل...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead>
                    <TableHead>المنتج</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>السعر المقترح</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        لا توجد طلبات
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((r: ProductRequest) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono">{r.request_number}</TableCell>
                        <TableCell>{r.product_name}</TableCell>
                        <TableCell>
                          {r.waste_sub_categories?.name ?? r.waste_main_categories?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {r.proposed_price != null ? `${r.proposed_price} ج.م` : "—"}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString("ar-EG")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Link href={`/waste-management/product-requests/${r.id}`}>
                            <Button variant="ghost" size="sm">
                              <FiEye />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
