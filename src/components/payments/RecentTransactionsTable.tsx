"use client";

import React, { useEffect, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRecentTransactions, TransactionDetail } from '@/domains/payments/store/paymentsDashboardSlice';
import { RootState } from '@/store';

// Define the shape of our transaction data - Now using TransactionDetail from slice
// interface Transaction {
//   id: string;
//   date: string;
//   type: string;
//   amount: string;
//   status: 'مكتملة' | 'قيد الانتظار' | 'فاشلة'; // More specific status
//   user: string;
//   // Add more fields as needed, e.g., currency, description, relatedOrderId
// }

// Dummy data for recent transactions - will be replaced by Redux state
// const dummyTransactions: TransactionDetail[] = [
//   { id: 'txn_1', date: '2023-10-26', type: 'دفع طلب', amount: '150.00 ج.م', status: 'مكتملة', user: 'أحمد علي' },
//   { id: 'txn_2', date: '2023-10-26', type: 'طلب سحب', amount: '500.00 ج.م', status: 'قيد الانتظار', user: 'مندوب_007' },
//   { id: 'txn_3', date: '2023-10-25', type: 'إيداع', amount: '200.00 ج.م', status: 'مكتملة', user: 'فاطمة زين' },
//   { id: 'txn_4', date: '2023-10-25', type: 'إرجاع طلب', amount: '75.00 ج.م', status: 'مكتملة', user: 'عميل س' },
//   { id: 'txn_5', date: '2023-10-24', type: 'رسوم خدمة', amount: '10.00 ج.م', status: 'مكتملة', user: 'النظام' },
//   { id: 'txn_6', date: '2023-10-24', type: 'دفع طلب', amount: '80.00 ج.م', status: 'فاشلة', user: 'علي حسن' },
// ];

const columnHelper = createColumnHelper<TransactionDetail>(); // Updated to TransactionDetail

const columns = [
  columnHelper.accessor('date', {
    header: () => 'التاريخ',
    cell: info => new Date(info.getValue()).toLocaleDateString('ar-EG'), // Format date
  }),
  columnHelper.accessor('type', {
    header: () => 'النوع',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('amount', {
    header: () => 'المبلغ',
    // cell: info => info.getValue(), // Amount is already formatted string with currency from slice
    cell: info => `${info.row.original.amount} ${info.row.original.currency || 'ج.م'}` // Use amount and currency if available
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
        default: bgColor = 'bg-gray-100'; textColor = 'text-gray-800';
      }
      return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>{status}</span>;
    },
  }),
  columnHelper.accessor('user', {
    header: () => 'المستخدم/التفاصيل',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('description', { // Added description column
    header: () => 'الوصف',
    cell: info => info.getValue() || '-', // Show dash if no description
  }),
  // Example for an actions column (e.g., view details)
  // columnHelper.display({
  //   id: 'actions',
  //   header: 'Actions',
  //   cell: props => <button className="text-blue-600 hover:text-blue-800">View</button>
  // }),
];

export const RecentTransactionsTable: React.FC = () => {
  // const data = useMemo(() => dummyTransactions, []); // Replaced with Redux state
  const dispatch = useAppDispatch(); // Added
  const { recentTransactions, status, error } = useAppSelector( // Added
    (state: RootState) => state.paymentsDashboard // Added
  ); // Added

  useEffect(() => { // Added
    dispatch(fetchRecentTransactions({ limit: 10 })); // Fetch 10 recent transactions
  }, [dispatch]); // Added

  // Use recentTransactions from Redux store, ensure it's memoized or stable if passed directly to useReactTable
  const data = useMemo(() => recentTransactions || [], [recentTransactions]); // Added, ensure data is an array

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // We can add more features later: sorting, filtering, pagination
  });

  if (status === 'loading') { // Added
    return <div className="bg-white p-6 rounded-lg shadow-md text-center">جار تحميل أحدث المعاملات...</div>; // Added
  } // Added

  if (error) { // Added
    return <div className="bg-white p-6 rounded-lg shadow-md text-center text-red-500">خطأ في تحميل المعاملات: {error}</div>; // Added
  } // Added

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 text-right">أحدث المعاملات</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length > 0 ? ( // Check if rows exist
              (table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-200 text-right">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center text-gray-500 py-6">
                  لم يتم العثور على معاملات حديثة.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Placeholder for pagination controls */}
      {/* <div className="mt-4 flex justify-between items-center">
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </button>
        <span>
          Page{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>
        </span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </button>
      </div> */}
    </div>
  );
}; 