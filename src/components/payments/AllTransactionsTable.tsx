"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  TableMeta,
} from '@tanstack/react-table';
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/shared/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { format } from "date-fns";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { TransactionDetail } from '@/domains/payments/types/paymentTypes';
import { fetchAllAdminTransactions } from '@/domains/payments/store/paymentsDashboardSlice';

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 20) => {
  if (!text) return '-';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Helper function to format ID
const formatId = (id: string | null | undefined) => {
  if (!id) return '-';
  return id.substring(0, 8);
};

interface FetchAllTransactionsParams {
  page: number;
  limit: number;
  searchQuery?: string;
  transactionType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  managementActivityType?: 'PAYOUT_MANAGEMENT' | 'WALLET_MANAGEMENT';
}

const columnHelper = createColumnHelper<TransactionDetail>();

interface TransactionTableMeta extends TableMeta<TransactionDetail> {
  onViewDetails: (transaction: TransactionDetail) => void;
}

const columns = [

  columnHelper.display({
    id: 'row_number',
    header: () => 'م',
    cell: info => {
      const transactionId = info.row.original.id;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              {info.row.index + 1}
            </TooltipTrigger>
            <TooltipContent>
              <p dir="ltr">{transactionId}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  }),
  
  columnHelper.accessor('date', {
    header: () => 'التاريخ',
    cell: info => new Date(info.getValue()).toLocaleDateString('ar-EG'),
  }),
  columnHelper.accessor('type', {
    header: () => 'نوع المعاملة',
    cell: info => {
      const typeMap: Record<string, string> = {
        'DEPOSIT': 'إيداع',
        'WITHDRAWAL': 'سحب',
        'ORDER_PAYMENT': 'دفع طلب',
        'ORDER_COLLECTION': 'تحصيل طلب',
        'REFUND': 'استرداد',
        'MANUAL_ADJUSTMENT': 'تسوية يدوية',
        'FEE': 'رسوم',
        'INITIAL_BALANCE': 'رصيد افتتاحي',
        'ADMIN_CREDIT_ADJUSTMENT': 'تسوية دائنة',
        'ADMIN_DEBIT_ADJUSTMENT': 'تسوية مدينة',
        'DELIVERY_PAYMENT_COLLECTION': 'تحصيل طلب توصيل',
        'PAYOUT_TO_USER': 'دفع مستحقات للمستخدم'
      };
      const rawType = info.getValue();
      if (rawType === 'PAYOUT') {
        return 'سحب أرباح عام';
      }
      return typeMap[rawType] || rawType;
    },
  }),
  columnHelper.accessor('amount', {
    header: () => 'المبلغ',
    cell: info => `${info.row.original.amount} ${info.row.original.currency || 'ج.م'}`
  }),
  columnHelper.accessor('status', {
    header: () => 'الحالة',
    cell: info => {
      const status = info.getValue();
      let bgColor, textColor;
      switch (status) {
        case 'مكتملة': bgColor = 'bg-green-100'; textColor = 'text-green-800'; break;
        case 'قيد الانتظار': bgColor = 'bg-yellow-100'; textColor = 'text-yellow-800'; break;
        case 'فاشلة': bgColor = 'bg-red-100'; textColor = 'text-red-800'; break;
        case 'بانتظار الموافقة': bgColor = 'bg-blue-100'; textColor = 'text-blue-800'; break;
        default: bgColor = 'bg-gray-100'; textColor = 'text-gray-800';
      }
      return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>{status}</span>;
    },
  }),
  columnHelper.accessor('description', {
    header: () => 'الوصف',
    cell: info => {
      const description = info.getValue();
      const safeDescription = typeof description === 'string' ? description : '';
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="text-right block w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {truncateText(safeDescription, 30)} 
            </TooltipTrigger>
            <TooltipContent>
              <p dir="rtl" className="max-w-xs whitespace-normal break-words">{safeDescription}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  }),
  columnHelper.accessor(row => row, {
    id: 'reference_id_display',
    header: () => 'المعرف المرجعي',
    cell: info => {
      const transaction = info.row.original;
      const payoutId = transaction.payoutRequestId;
      const transactionId = transaction.id;
      const transactionType = transaction.type;

      const displayId = payoutId ? formatId(payoutId) : formatId(transactionId);
      const idTooltip = payoutId || transactionId;
      let statusText = '';
      let statusColor = '';

      if (payoutId) {
        if (transactionType === 'سحب معتمد') {
          statusText = 'موافق عليه';
          statusColor = 'text-green-600';
        } else if (transactionType === 'طلب سحب مرفوض') {
          statusText = 'مرفوض';
          statusColor = 'text-red-600';
        } else if (transactionType === 'سحب أرباح' && transaction.status === 'مكتملة') {
          // Potentially a generic approved state for 'سحب أرباح'
          // statusText = 'منفذ';
          // statusColor = 'text-blue-600';
        }
      } else if (transactionType === 'تسوية دائنة (إداري)') {
        statusText = 'إيداع يدوي';
        statusColor = 'text-green-600';
      } else if (transactionType === 'تسوية مدينة (إداري)') {
        statusText = 'سحب يدوي';
        statusColor = 'text-orange-500';
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="font-mono flex items-center justify-end gap-2">
              <span>{displayId}</span>
              {statusText && (
                <span className={`text-xs font-semibold ${statusColor}`}>({statusText})</span>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p dir="ltr">{idTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  }),
  columnHelper.accessor('type', {
    id: 'management_activity_type',
    header: () => 'نوع الإدارة',
    cell: info => {
      const transaction = info.row.original;
      const transactionType = transaction.type;
      const payoutId = transaction.payoutRequestId;
      const initiatorType = transaction.initiatedBy;

      if (payoutId || transactionType === 'سحب أرباح' || transactionType === 'سحب معتمد' || transactionType === 'طلب سحب مرفوض') {
        return 'إدارة السحب';
      }
      
      if (initiatorType === 'ADMIN' && (transactionType === 'تسوية دائنة (إداري)' || transactionType === 'تسوية مدينة (إداري)' || transactionType === 'إيداع')) {
        return 'إدارة المحافظ';
      }
      return 'عمليات أخرى';
    }
  }),
  columnHelper.accessor('adminNotes', {
    header: () => 'ملاحظات المسؤول',
    cell: info => {
      const notes = info.getValue();
      const safeNotes = typeof notes === 'string' ? notes : '';
      return notes ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {truncateText(safeNotes, 20)}
            </TooltipTrigger>
            <TooltipContent>
              <p dir="rtl" className="max-w-xs whitespace-normal break-words">{safeNotes}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : '-';
    },
  }),
  columnHelper.accessor('user', {
    header: () => 'المستخدم',
    cell: info => info.getValue() || '-',
  }),
  columnHelper.accessor('processedByAdminName', {
    id: 'supervisor_info',
    header: () => 'المشرف',
    cell: info => {
      const adminName = info.getValue();
      return adminName ? `بواسطة: ${adminName}` : '-';
    },
  }),
  columnHelper.display({
    id: 'actions',
    header: 'الإجراءات',
    cell: info => (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => (info.table.options.meta as TransactionTableMeta)?.onViewDetails(info.row.original)}
      >
        عرض التفاصيل
      </Button>
    ),
  }),

 
];

interface AllTransactionsTableProps {
  onViewDetails: (transaction: TransactionDetail) => void;
}

interface PaymentsDashboardStatePlaceholder {
  allTransactions: TransactionDetail[];
  allTransactionsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  allTransactionsError: string | null;
  allTransactionsTotalCount: number;
  allTransactionsCurrentPage: number;
  allTransactionsTotalPages: number;
}

export const AllTransactionsTable: React.FC<AllTransactionsTableProps> = ({ onViewDetails }) => {
  const dispatch = useAppDispatch();
  const { 
    allTransactions, 
    allTransactionsStatus, 
    allTransactionsError,
    allTransactionsTotalCount,
    allTransactionsCurrentPage,
    allTransactionsTotalPages,
  } = useAppSelector((state: RootState) => state.paymentsDashboard as unknown as PaymentsDashboardStatePlaceholder);

  const [searchQuery, setSearchQuery] = useState('');
  const [transactionType, setTransactionType] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [managementActivityFilter, setManagementActivityFilter] = useState<'PAYOUT_MANAGEMENT' | 'WALLET_MANAGEMENT' | undefined>(undefined);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [pageSize, setPageSize] = useState(6);
  
  useEffect(() => {
    fetchTransactions(1);
  }, [dispatch]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchTransactions(1);
    }, 500);
    
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, transactionType, statusFilter, startDate, endDate, pageSize, managementActivityFilter]);

  const fetchTransactions = (page: number) => {
    const params: FetchAllTransactionsParams = { 
      page,
      limit: pageSize,
      searchQuery: searchQuery || undefined,
      transactionType: transactionType,
      status: statusFilter,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      managementActivityType: managementActivityFilter,
    };
    dispatch(fetchAllAdminTransactions(params));
  };

  const handlePageChange = (newPage: number) => {
    fetchTransactions(newPage);
  };

  const handleExportCSV = () => {
    console.log('تصدير البيانات كملف CSV');
  };

  const data = useMemo(() => allTransactions || [], [allTransactions]);

  const table = useReactTable<TransactionDetail>({
    data,
    columns,
    state: {
      sorting,
    },
    meta: {
      onViewDetails,
    } as TransactionTableMeta,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    manualPagination: true,
    pageCount: allTransactionsTotalPages || 1,
  });

  if (allTransactionsStatus === 'loading' && data.length === 0) {
    return <div className="bg-white p-6 rounded-lg shadow-md text-center">جار تحميل المعاملات...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 className="text-xl font-semibold text-gray-700">إدارة المعاملات</h3>
        <Button onClick={handleExportCSV} variant="outline">
          تصدير البيانات (CSV)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div>
          <Input
            placeholder="بحث (رقم المعاملة، المستخدم...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <Select value={transactionType} onValueChange={(value) => setTransactionType(value === "ALL_TYPES_PLACEHOLDER" ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="نوع المعاملة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_TYPES_PLACEHOLDER">جميع الأنواع</SelectItem>
              <SelectItem value="DEPOSIT">إيداع</SelectItem>
              <SelectItem value="WITHDRAWAL">سحب</SelectItem>
              <SelectItem value="ORDER_PAYMENT">دفع طلب</SelectItem>
              <SelectItem value="ORDER_COLLECTION">تحصيل طلب</SelectItem>
              <SelectItem value="REFUND">استرداد</SelectItem>
              <SelectItem value="MANUAL_ADJUSTMENT">تسوية يدوية</SelectItem>
              <SelectItem value="FEE">رسوم</SelectItem>
              <SelectItem value="PAYOUT">سحب أرباح</SelectItem>
              <SelectItem value="INITIAL_BALANCE">رصيد افتتاحي</SelectItem>
              <SelectItem value="ADMIN_CREDIT_ADJUSTMENT">تسوية دائنة (إداري)</SelectItem>
              <SelectItem value="ADMIN_DEBIT_ADJUSTMENT">تسوية مدينة (إداري)</SelectItem>
              <SelectItem value="DELIVERY_PAYMENT_COLLECTION">تحصيل طلب توصيل</SelectItem>
              <SelectItem value="PAYOUT_TO_USER">دفع مستحقات للمستخدم</SelectItem>
              <SelectItem value="PAYOUT_APPROVED">سحب معتمد</SelectItem>
              <SelectItem value="PAYOUT_REJECTED">طلب سحب مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === "ALL_STATUSES_PLACEHOLDER" ? undefined : value)}>
            <SelectTrigger>
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_STATUSES_PLACEHOLDER">جميع الحالات</SelectItem>
              <SelectItem value="COMPLETED">مكتملة</SelectItem>
              <SelectItem value="PENDING">قيد الانتظار</SelectItem>
              <SelectItem value="FAILED">فاشلة</SelectItem>
              <SelectItem value="PENDING_APPROVAL">بانتظار الموافقة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Input 
            type="date" 
            value={startDate ? format(startDate, 'yyyy-MM-dd') : ''} 
            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)} 
            placeholder="من تاريخ" 
            className="w-full"
          />
        </div>
        <div>
          <Input 
            type="date" 
            value={endDate ? format(endDate, 'yyyy-MM-dd') : ''} 
            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)} 
            placeholder="إلى تاريخ"
            className="w-full"
          />
        </div>
        <div className="lg:col-span-1">
          <Select 
            value={managementActivityFilter} 
            onValueChange={(value) => setManagementActivityFilter(value === "ALL_ACTIVITIES_PLACEHOLDER" ? undefined : value as 'PAYOUT_MANAGEMENT' | 'WALLET_MANAGEMENT')}
          >
            <SelectTrigger>
              <SelectValue placeholder="نوع الإدارة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_ACTIVITIES_PLACEHOLDER">كل الأنشطة الإدارية</SelectItem>
              <SelectItem value="PAYOUT_MANAGEMENT">إدارة السحب</SelectItem>
              <SelectItem value="WALLET_MANAGEMENT">إدارة المحافظ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {allTransactionsError && (
        <div className="bg-red-50 p-4 mb-4 rounded-md text-red-600">
          خطأ: {allTransactionsError}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center justify-end">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-200 text-right">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center text-gray-500 py-6">
                  {allTransactionsStatus === 'loading' ? 'جار تحميل المعاملات...' : 'لم يتم العثور على معاملات.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            عرض {data.length} من {allTransactionsTotalCount || 0} معاملة 
          </span>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handlePageChange((allTransactionsCurrentPage || 1) - 1)}
            disabled={(allTransactionsCurrentPage || 1) === 1}
            variant="outline"
            size="sm"
          >
            السابق
          </Button>
          <span className="text-sm text-gray-700">
            الصفحة {allTransactionsCurrentPage || 1} من {allTransactionsTotalPages || 1}
          </span>
          <Button
            onClick={() => handlePageChange((allTransactionsCurrentPage || 1) + 1)}
            disabled={(allTransactionsCurrentPage || 1) === (allTransactionsTotalPages || 1)}
            variant="outline"
            size="sm"
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}; 