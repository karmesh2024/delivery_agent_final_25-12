"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Customer, CustomerStatus } from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { MoreHorizontal, Eye, Edit, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/shared/ui/dropdown-menu';

interface CustomersTableProps {
  customers: Customer[];
  onView: (customerId: string) => void;
  onEdit: (customerId: string) => void;
  onDelete: (customerId: string) => void;
}

// مكون لعرض حالة العميل في شكل بادج ملون
const CustomerStatusBadge = ({ status }: { status: CustomerStatus }) => {
  const statusConfig = {
    active: { variant: 'success', label: 'نشط' },
    inactive: { variant: 'secondary', label: 'غير نشط' },
    blocked: { variant: 'destructive', label: 'محظور' },
    pending: { variant: 'warning', label: 'قيد الانتظار' },
    suspended: { variant: 'danger', label: 'معلق' }
  };

  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    // @ts-expect-error - Badge variant prop accepts custom string
    <Badge variant={config.variant}>{config.label}</Badge>
  );
};

export function CustomersTable({ customers, onView, onEdit, onDelete }: CustomersTableProps) {
  const router = useRouter();

  return (
    <div className="border rounded-md overflow-hidden">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-[50px] text-center">#</TableHead>
            <TableHead className="w-[80px] text-center">الصورة</TableHead>
            <TableHead>الاسم الكامل</TableHead>
            <TableHead>رقم الهاتف</TableHead>
            <TableHead>البريد الإلكتروني</TableHead>
            <TableHead className="text-center">الطلبات</TableHead>
            <TableHead className="text-center">المبلغ الكلي</TableHead>
            <TableHead className="text-center">الحالة</TableHead>
            <TableHead className="text-center">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                لا توجد نتائج.
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer, index) => (
              <TableRow key={customer.id} className="hover:bg-muted/30">
                <TableCell className="text-center font-medium">{index + 1}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden">
                      {customer.avatarUrl ? (
                        <img 
                          src={customer.avatarUrl} 
                          alt={customer.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-semibold">
                          {customer.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{customer.fullName}</TableCell>
                <TableCell dir="ltr">{customer.phoneNumber}</TableCell>
                <TableCell>{customer.email || '-'}</TableCell>
                <TableCell className="text-center">{customer.totalOrders}</TableCell>
                <TableCell className="text-center">
                  {customer.totalSpent.toLocaleString()} ج.م
                </TableCell>
                <TableCell className="text-center">
                  <CustomerStatusBadge status={customer.status} />
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(customer.id)}>
                        <Eye className="ml-2 h-4 w-4" />
                        <span>عرض التفاصيل</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(customer.id)}>
                        <Edit className="ml-2 h-4 w-4" />
                        <span>تعديل</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(customer.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="ml-2 h-4 w-4" />
                        <span>حذف</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 