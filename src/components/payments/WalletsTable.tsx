import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWallets, fetchWalletDetails, clearSelectedWallet } from '@/domains/payments/store/paymentsDashboardSlice';
import { WalletWithUserDetails } from '@/domains/payments/types/paymentTypes';
import { translateWalletType, translateWalletStatus } from '@/services/paymentsService';
import WalletDetailsModal from './WalletDetailsModal';
import WalletTransactionsModal from './WalletTransactionsModal';
import ManualTransactionModal from './ManualTransactionModal';
import { FaRegListAlt, FaEdit, FaExchangeAlt } from 'react-icons/fa';

const WalletsTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    wallets,
    walletsStatus,
    walletsError,
    selectedWalletDetails,
  } = useAppSelector((state) => state.paymentsDashboard);

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWalletType, setSelectedWalletType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const isLoading = walletsStatus === 'loading';

  // State for managing the details modal
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isTransactionsModalOpen, setTransactionsModalOpen] = useState(false);
  const [selectedWalletForTransactions, setSelectedWalletForTransactions] = useState<WalletWithUserDetails | null>(null);
  const [isManualTransactionModalOpen, setManualTransactionModalOpen] = useState(false);
  const [selectedWalletForManualTx, setSelectedWalletForManualTx] = useState<WalletWithUserDetails | null>(null);

  useEffect(() => {
    const filters = {
      wallet_type: selectedWalletType || undefined,
      status: selectedStatus || undefined,
    };
    dispatch(fetchWallets({ page: currentPage, pageSize: limit, filters, searchQuery }));
  }, [dispatch, currentPage, searchQuery, selectedWalletType, selectedStatus, limit]);

  const handleManageWallet = (wallet: WalletWithUserDetails) => {
    dispatch(fetchWalletDetails({ walletId: wallet.id }));
    setDetailsModalOpen(true);
  };

  const handleViewTransactions = (wallet: WalletWithUserDetails) => {
    setSelectedWalletForTransactions(wallet);
    setTransactionsModalOpen(true);
  };

  const handleOpenManualTransactionModal = (wallet: WalletWithUserDetails) => {
    setSelectedWalletForManualTx(wallet);
    setManualTransactionModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    dispatch(clearSelectedWallet());
  };

  const handleCloseTransactionsModal = () => {
    setTransactionsModalOpen(false);
    setSelectedWalletForTransactions(null);
  };

  const handleCloseManualTransactionModal = () => {
    setManualTransactionModalOpen(false);
    setSelectedWalletForManualTx(null);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleWalletTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWalletType(event.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(event.target.value);
    setCurrentPage(1);
  };

  const currentFiltersForModal = { 
    wallet_type: selectedWalletType || undefined, 
    status: selectedStatus || undefined 
  };

  return (
    <div dir="rtl">
      <div className="mb-4 p-4 bg-gray-50 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="بحث بالمعرف, اسم المستخدم..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="walletTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">نوع المحفظة</label>
            <select
              id="walletTypeFilter"
              value={selectedWalletType}
              onChange={handleWalletTypeChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">الكل</option>
              <option value="CUSTOMER_HOME">عميل منزل</option>
              <option value="DELIVERY_BOY">مندوب توصيل</option>
              <option value="AGENT">وكيل</option>
              <option value="COMPANY">شركة</option>
              <option value="SYSTEM_FLOAT">سيولة النظام</option>
              <option value="SYSTEM_REVENUE">إيرادات النظام</option>
              <option value="SYSTEM_FEES">رسوم خدمة</option>
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">حالة المحفظة</label>
            <select
              id="statusFilter"
              value={selectedStatus}
              onChange={handleStatusChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">الكل</option>
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">غير نشط</option>
              <option value="PENDING_VERIFICATION">بانتظار التحقق</option>
              <option value="VERIFIED">تم التحقق</option>
              <option value="REJECTED">مرفوض</option>
              <option value="FROZEN">مجمد</option>
              <option value="SUSPENDED">معلق</option>
              <option value="CLOSED">مغلق</option>
            </select>
          </div>
          {/* Pagination (Simple example) */}
          <div className="flex items-center justify-end space-x-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              السابق
            </button>
            <span className="text-sm text-gray-700">صفحة {currentPage}</span>
            <button 
              onClick={() => setCurrentPage(prev => prev + 1)} 
              disabled={wallets.length < limit || isLoading} 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
      {isLoading && (!wallets || wallets.length === 0) && (
        <div className="text-center p-4">جارٍ تحميل المحافظ...</div>
      )}
      {!isLoading && walletsError && (
        <div className="text-center p-4 text-red-500">فشل تحميل المحافظ: {walletsError}</div>
      )}
      {!isLoading && !walletsError && (!wallets || wallets.length === 0) && (
         <div className="text-center p-4">لا توجد محافظ لعرضها تطابق شروط البحث/الفلترة.</div>
      )}
      {wallets && wallets.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  معرف المحفظة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم المستخدم
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الهاتف
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  البريد الإلكتروني
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الرصيد
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العملة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نوع المحفظة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wallets.map((wallet: WalletWithUserDetails) => (
                <tr key={wallet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{wallet.id.substring(0,15)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{wallet.user_details?.full_name || (wallet.user_details ? 'اسم غير متوفر' : 'غير معروف')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wallet.user_details?.phone_number || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wallet.user_details?.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {wallet.balance.toLocaleString('ar-EG', { style: 'currency', currency: wallet.currency })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wallet.currency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {translateWalletType(wallet.wallet_type)} 
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      wallet.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 
                      wallet.status.toLowerCase() === 'verified' ? 'bg-blue-100 text-blue-800' :
                      wallet.status.toLowerCase() === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                      wallet.status.toLowerCase() === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                      wallet.status.toLowerCase() === 'frozen' ? 'bg-orange-100 text-orange-800' :
                      wallet.status.toLowerCase() === 'closed' ? 'bg-gray-100 text-gray-800' :
                      wallet.status.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {translateWalletStatus(wallet.status)} 
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(wallet.created_at).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <button 
                      onClick={() => handleManageWallet(wallet)}
                      className="text-indigo-600 hover:text-indigo-900 ml-2 p-1"
                      title="إدارة المحفظة"
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleViewTransactions(wallet)}
                      className="text-green-600 hover:text-green-900 ml-2 p-1"
                      title="عرض المعاملات"
                    >
                      <FaRegListAlt size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenManualTransactionModal(wallet)}
                      className="text-blue-600 hover:text-blue-900 ml-2 p-1"
                      title="إيداع/سحب يدوي"
                    >
                      <FaExchangeAlt size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {isDetailsModalOpen && selectedWalletDetails && (
        <WalletDetailsModal 
          isOpen={isDetailsModalOpen} 
          onClose={handleCloseDetailsModal}
          currentListParams={{ page: currentPage, limit, filters: currentFiltersForModal, searchQuery }}
        />
      )}
      {isTransactionsModalOpen && selectedWalletForTransactions && (
        <WalletTransactionsModal
          isOpen={isTransactionsModalOpen}
          onClose={handleCloseTransactionsModal}
          walletId={selectedWalletForTransactions.id}
          walletUserFullName={selectedWalletForTransactions.user_details?.full_name || undefined}
        />
      )}
      {isManualTransactionModalOpen && selectedWalletForManualTx && (
        <ManualTransactionModal
          isOpen={isManualTransactionModalOpen}
          onClose={handleCloseManualTransactionModal}
          wallet={selectedWalletForManualTx}
        />
      )}
    </div>
  );
};

export default WalletsTable;