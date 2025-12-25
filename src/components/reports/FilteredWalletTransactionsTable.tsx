import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { TransactionDetail } from '@/domains/payments/types/paymentTypes';
import { fetchTransactionsForWalletType, clearFilteredWalletTypeTransactions } from '@/domains/payments/store/paymentsDashboardSlice'; 
import { AppDispatch } from '@/store'; // Assuming AppDispatch is exported from store/index.ts

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  // Add other relevant transaction filters if needed, e.g., transaction_type, status
}

interface FilteredWalletTransactionsTableProps {
  walletIds: string[];
  walletTypeLabel: string; // Used as a simple key for now, ensure uniqueness if needed
  filters: ReportFilters; 
  isVisible: boolean; // To control fetching and rendering based on parent expansion
}

const TRANSACTIONS_PER_PAGE = 10; // Define how many transactions to show per page
const defaultInitialState = { transactions: [], status: 'idle' as const, error: null, currentPage: 1, totalPages: 0, totalCount: 0 };

const FilteredWalletTransactionsTable: React.FC<FilteredWalletTransactionsTableProps> = ({
  walletIds,
  walletTypeLabel, // This will be our key for the Redux store slice
  filters,
  isVisible
}) => {
  const dispatch: AppDispatch = useAppDispatch(); // Use AppDispatch type
  
  const { 
    transactions, 
    status, 
    error,
    currentPage,
    totalPages,
    totalCount
  } = useAppSelector(state => 
    state.paymentsDashboard.filteredTransactionsByWalletType[walletTypeLabel] || 
    defaultInitialState // Use the constant default state here
  );

  // Local state for current page if we want to manage it inside this component 
  // OR rely on the Redux state's currentPage completely.
  // For now, we'll dispatch actions to change the Redux currentPage.

  useEffect(() => {
    if (isVisible && walletIds.length > 0) {
      dispatch(fetchTransactionsForWalletType({
        walletTypeKey: walletTypeLabel,
        walletIds,
        page: currentPage, // Use currentPage from Redux state
        limit: TRANSACTIONS_PER_PAGE,
        filters
      }));
    } else if (!isVisible) {
        // Optionally clear data when not visible to save memory or reset state
        // dispatch(clearFilteredWalletTypeTransactions(walletTypeLabel));
    }
    // Re-fetch if isVisible changes, walletIds change, filters change, or currentPage in Redux changes
  }, [isVisible, walletIds, filters, currentPage, dispatch, walletTypeLabel]);

  // Cleanup on unmount or when isVisible becomes false to reset the specific slice of state
  useEffect(() => {
    return () => {
      if (!isVisible) { // Or just on unmount if preferred
        // dispatch(clearFilteredWalletTypeTransactions(walletTypeLabel));
      }
    };
  }, [dispatch, walletTypeLabel, isVisible]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      // Dispatch an action to set the current page in Redux for this specific table
      // This will trigger the useEffect above to re-fetch data for the new page.
      // We might need a specific action in the slice to update only the currentPage for a walletTypeKey
      // For now, we can re-dispatch fetchTransactionsForWalletType with the new page.
      dispatch(fetchTransactionsForWalletType({
        walletTypeKey: walletTypeLabel,
        walletIds,
        page: newPage,
        limit: TRANSACTIONS_PER_PAGE,
        filters
      }));
    }
  };

  if (!isVisible) {
    return null; // Don't render anything if not visible
  }

  if (status === 'loading' && transactions.length === 0) { // Show loading only if no data is present yet
    return <div className="p-4 text-center text-sm text-gray-500">جارٍ تحميل حركات {walletTypeLabel}...</div>;
  }

  if (status === 'failed') {
    return <div className="p-4 text-center text-sm text-red-500">فشل تحميل الحركات: {error || 'حدث خطأ غير معروف'}</div>;
  }

  if (status === 'succeeded' && transactions.length === 0 && totalCount === 0) {
    return <div className="p-4 text-center text-sm text-gray-500">لا توجد حركات لعرضها لـ {walletTypeLabel} بالفلاتر المحددة.</div>;
  }
  
  if (status === 'loading' && transactions.length > 0) {
    // Optionally show a subtle loading indicator over the existing table or a small message
    // For now, we just render the table with potentially stale data while new data loads
  }

  return (
    <div className="overflow-x-auto mt-4">
      { (status === 'loading' && transactions.length > 0) && 
        <p className="text-xs text-gray-400 text-center mb-2">تحديث البيانات...</p> }
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المحفظة (ID)</th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{new Date(transaction.date).toLocaleDateString('ar-EG')}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{transaction.type}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{parseFloat(transaction.amount).toLocaleString('ar-EG', { style: 'currency', currency: transaction.currency || 'EGP' })}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 hover:underline cursor-pointer" title={transaction.wallet_id}>{transaction.wallet_id.substring(0,8)}...</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 truncate max-w-xs" title={transaction.description}>{transaction.description || '-'}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${transaction.status === 'مكتملة' ? 'bg-green-100 text-green-800' : 
                    transaction.status === 'قيد الانتظار' ? 'bg-yellow-100 text-yellow-800' : 
                    transaction.status === 'فاشلة'  ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'}
                `}>
                  {transaction.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || status === 'loading'}
            className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
          >
            السابق
          </button>
          <span className="text-sm text-gray-700">
            صفحة {currentPage} من {totalPages} (إجمالي {totalCount} حركة)
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || status === 'loading'}
            className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
};

export default FilteredWalletTransactionsTable; 