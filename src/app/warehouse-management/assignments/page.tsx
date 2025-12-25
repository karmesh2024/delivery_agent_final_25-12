'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/shared/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Loader2, Package, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAppSelector } from '@/store/hooks';
import { supabase } from '@/lib/supabase';

interface AssignmentItem {
  id: string;
  catalog_product_id: string | null;
  product_id: string | null;
  sku: string | null;
  name: string | null;
  image_url: string | null;
  ordered_quantity: number;
  received_quantity: number | null;
  damaged_quantity: number | null;
  status: 'pending' | 'received' | 'shortage' | 'damaged';
  notes: string | null;
}

interface WarehouseAssignment {
  id: string;
  invoice_id: string | null;
  invoice_number: string | null;
  supplier_name: string | null;
  warehouse_id: number;
  warehouse_name: string | null;
  expected_date: string | null;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string | null;
  items: AssignmentItem[];
}

const statusLabels = {
  pending: 'قيد الانتظار',
  partial: 'استلام جزئي',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function WarehouseAssignmentsPage() {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const [assignments, setAssignments] = useState<WarehouseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const url = `/api/warehouse/assignments${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
      
      // الحصول على التوكن من Redux store أو من Supabase مباشرة
      let authToken = token;
      
      if (!authToken && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          authToken = session?.access_token || null;
        } catch (sessionError) {
          console.warn('Error getting session from Supabase:', sessionError);
        }
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(url, {
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل تحميل أوامر الإسناد');
      }
      
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      toast.error(error?.message || 'فشل تحميل أوامر الإسناد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="أوامر الإسناد">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">أوامر الإسناد</h1>
            <p className="text-gray-600 mt-1">استقبال وتتبع أوامر الإسناد من إدارة المشتريات</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>التصفية حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {['all', 'pending', 'partial', 'completed', 'cancelled'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'الكل' : statusLabels[status as keyof typeof statusLabels]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-10 text-gray-500">لا توجد أوامر إسناد حالياً</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>المخزن</TableHead>
                    <TableHead>تاريخ متوقع</TableHead>
                    <TableHead>عدد البنود</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.invoice_number || '—'}</TableCell>
                      <TableCell>{assignment.supplier_name || '—'}</TableCell>
                      <TableCell>{assignment.warehouse_name || `مخزن #${assignment.warehouse_id}`}</TableCell>
                      <TableCell>
                        {assignment.expected_date
                          ? new Date(assignment.expected_date).toLocaleDateString('ar-EG')
                          : '—'}
                      </TableCell>
                      <TableCell>{assignment.items.length}</TableCell>
                      <TableCell>
                        <Badge className={cn(statusColors[assignment.status], 'font-semibold')}>
                          {statusLabels[assignment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/warehouse-management/assignments/${assignment.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            عرض التفاصيل
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

