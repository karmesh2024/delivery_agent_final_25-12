import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { 
  fetchSelectedWalletTransactions,
  setSelectedWalletTransactionsPage,
  // We might need to clear or reset transaction state differently now
} from '@/domains/payments/store/paymentsDashboardSlice';
import { TransactionDetail } from '@/domains/payments/types/paymentTypes';
import { translateTransactionType, translateStatus } from '@/services/paymentsService'; // Assuming these can be reused or adapted

interface WalletTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string | null;
  walletUserFullName?: string;
}

const TRANSACTIONS_PER_PAGE = 10; // Can be adjusted

const WalletTransactionsModal: React.FC<WalletTransactionsModalProps> = ({ 
  isOpen, 
  onClose, 
  walletId, 
  walletUserFullName 
}) => {
  const dispatch = useAppDispatch();
  const {
    selectedWalletTransactions,
    selectedWalletTransactionsStatus,
    selectedWalletTransactionsError,
    selectedWalletTransactionsTotalCount,
    selectedWalletTransactionsCurrentPage
  } = useAppSelector((state: RootState) => state.paymentsDashboard);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const loadTransactions = useCallback((pageToLoad: number) => {
    if (walletId) {
      dispatch(fetchSelectedWalletTransactions({ 
        walletId, 
        page: pageToLoad, 
        limit: TRANSACTIONS_PER_PAGE,
        searchTerm: searchQuery || undefined,
        transactionType: filterType || undefined,
        status: filterStatus || undefined,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
      }));
    }
  }, [dispatch, walletId, searchQuery, filterType, filterStatus, filterStartDate, filterEndDate]);

  useEffect(() => {
    if (isOpen && walletId) {
      // loadTransactions(selectedWalletTransactionsCurrentPage); // Load current page first if available and filters are same?
      // For simplicity, always load page 1 when modal opens or wallet/filters change fundamentally.
      // The handleApplyFilters also resets to page 1.
      dispatch(setSelectedWalletTransactionsPage(1)); // Ensure we start from page 1
      loadTransactions(1); 
    }
    // Clear transactions when modal is closed or walletId is cleared, to avoid showing stale data
    // This part depends on whether we want to clear the state or just not render.
    // For now, let's rely on the load in open.
  }, [isOpen, walletId]); // Removed loadTransactions from dependency array to avoid potential loops if not careful
  
  // Effect to reload data if filters change while modal is open
  // This is now handled by handleApplyFilters which calls loadTransactions.
  // useEffect(() => {
  //   if (isOpen && walletId) {
  //     loadTransactions(1); // Reload from page 1 when filters change
  //   }
  // }, [searchQuery, filterType, filterStatus, filterStartDate, filterEndDate, isOpen, walletId, loadTransactions]);

  if (!isOpen || !walletId) {
    return null;
  }

  const handleClose = () => {
    // TODO: Consider resetting local search/filter states and Redux transaction state if necessary
    onClose();
  };

  const handleApplyFilters = () => {
    dispatch(setSelectedWalletTransactionsPage(1)); // Reset to first page on new filter/search
    loadTransactions(1);
  };
  
  const handleTransactionPageChange = (newPage: number) => {
    dispatch(setSelectedWalletTransactionsPage(newPage));
    loadTransactions(newPage);
  };

  const totalTransactionPages = Math.ceil(selectedWalletTransactionsTotalCount / TRANSACTIONS_PER_PAGE);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4" dir="rtl">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">
            معاملات المحفظة {walletUserFullName ? ` لـ ${walletUserFullName}` : walletId ? ` (${walletId.substring(0,15)}...)` : ''}
          </h3>
          <button 
            onClick={handleClose} 
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Filter and Search Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 border rounded-md">
          <div>
            <label htmlFor="searchTxQuery" className="block text-sm font-medium text-gray-700 mb-1">بحث (وصف، معرف)</label>
            <input 
              type="text" 
              id="searchTxQuery"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="أدخل نص البحث..."
            />
          </div>
          <div>
            <label htmlFor="filterTxType" className="block text-sm font-medium text-gray-700 mb-1">نوع المعاملة</label>
            <select 
              id="filterTxType"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">الكل</option>
              <option value="DEPOSIT">إيداع</option>
              <option value="ORDER_PAYMENT">دفع طلب</option>
              <option value="DELIVERY_PAYMENT_COLLECTION">تحصيل دفعة توصيل</option>
              {/* Add other transaction types here */}
            </select>
          </div>
          <div>
            <label htmlFor="filterTxStatus" className="block text-sm font-medium text-gray-700 mb-1">حالة المعاملة</label>
            <select 
              id="filterTxStatus"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">الكل</option>
              <option value="COMPLETED">مكتملة</option>
              <option value="PENDING">قيد الانتظار</option>
              <option value="FAILED">فاشلة</option>
              {/* Add other statuses here */}
            </select>
          </div>
          <div>
            <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <input 
              type="date" 
              id="filterStartDate"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <input 
              type="date" 
              id="filterEndDate"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleApplyFilters}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm text-sm"
            >
              تطبيق الفلاتر والبحث
            </button>
          </div>
        </div>


        {/* Transactions Table Section */}
        {selectedWalletTransactionsStatus === 'loading' && <div className="text-center py-4">جارٍ تحميل المعاملات...</div>}
        {selectedWalletTransactionsStatus === 'failed' && selectedWalletTransactionsError && (
          <div className="text-red-500 text-center py-4">خطأ في تحميل المعاملات: {selectedWalletTransactionsError}</div>
        )}
        {selectedWalletTransactionsStatus === 'succeeded' && (
          <>
            {selectedWalletTransactions.length === 0 ? (
              <div className="text-center text-gray-500 py-4">لا توجد معاملات لعرضها تطابق معايير البحث.</div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">المعرف</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">رصيد قبل</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">رصيد بعد</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">معرف الطلب</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">معاملة مرتبطة</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">تفاصيل الدفع</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">بواسطة</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">مسؤول</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedWalletTransactions.map((tx: TransactionDetail) => (
                      <tr key={tx.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs" title={tx.id}>{tx.id.substring(0,10)}...</td>
                        <td className="px-3 py-2 whitespace-nowrap">{tx.date}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{tx.type}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{tx.amount}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.status === 'مكتملة' ? 'bg-green-100 text-green-800' :
                            tx.status === 'قيد الانتظار' ? 'bg-yellow-100 text-yellow-800' :
                            tx.status === 'فاشلة' ? 'bg-red-100 text-red-800' :
                            tx.status === 'بانتظار الموافقة' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {tx.status} 
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-[100px] truncate" title={tx.user}>{tx.user || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-xs truncate" title={tx.description}>{tx.description || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{tx.balance_before ?? '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{tx.balance_after ?? '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-[100px] truncate" title={tx.order_id}>{tx.order_id || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-[100px] truncate" title={tx.related_transaction_id}>{tx.related_transaction_id || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-xs truncate" 
                          title={tx.payment_method_details ? 
                                  (typeof tx.payment_method_details === 'object' ? 
                                    JSON.stringify(tx.payment_method_details) : 
                                    String(tx.payment_method_details)) : '-'}>
                          {tx.payment_method_details ? 
                            (typeof tx.payment_method_details === 'object' ? 
                              Object.keys(tx.payment_method_details).join(', ') : 
                              String(tx.payment_method_details).substring(0,20) + (String(tx.payment_method_details).length > 20 ? '...':'')) : 
                            '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-[100px] truncate" title={tx.initiated_by}>{tx.initiated_by || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-[100px] truncate" title={tx.admin_id}>{tx.admin_id || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-xs truncate" title={tx.notes}>{tx.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination for Transactions */}
            {selectedWalletTransactionsTotalCount > TRANSACTIONS_PER_PAGE && (
              <div className="flex justify-center items-center space-x-2 space-x-reverse mt-4">
                <button 
                  onClick={() => handleTransactionPageChange(selectedWalletTransactionsCurrentPage - 1)}
                  disabled={selectedWalletTransactionsCurrentPage <= 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  السابق
                </button>
                <span className="text-sm text-gray-700">
                  صفحة {selectedWalletTransactionsCurrentPage} من {totalTransactionPages}
                </span>
                <button 
                  onClick={() => handleTransactionPageChange(selectedWalletTransactionsCurrentPage + 1)}
                  disabled={selectedWalletTransactionsCurrentPage >= totalTransactionPages}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
         <div className="flex justify-end pt-4">
            <button 
                type="button" 
                onClick={handleClose}
                className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
              >
                إغلاق
              </button>
        </div>
      </div>
    </div>
  );
};

export default WalletTransactionsModal; 