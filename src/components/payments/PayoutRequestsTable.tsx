import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { fetchPayoutRequestsThunk, approvePayoutRequestThunk, rejectPayoutRequestThunk, setPayoutRequestsCurrentPage, clearPayoutActionStatus } from '@/domains/payments/store/paymentsDashboardSlice';
import { PayoutRequestDetail } from '@/domains/payments/types/paymentTypes';
import { translatePayoutStatus, PayoutRequestFilters } from '@/services/paymentsService';

// Placeholder for Icons - replace with actual icon components
const EditIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const CheckCircleIcon = () => <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = () => <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EyeIcon = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;


// interface PayoutRequestsTableProps { // Removed empty interface
//   // Props for filtering, searching if controlled from parent later
// }

const PayoutRequestsTable: React.FC = () => { // Using React.FC without explicit props type
  const dispatch = useAppDispatch();
  const { 
    payoutRequestsList, 
    payoutRequestsStatus, 
    payoutRequestsError, 
    payoutRequestsTotalCount, 
    payoutRequestsCurrentPage,
    payoutActionStatus,
    payoutActionError
  } = useAppSelector((state: RootState) => state.paymentsDashboard);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // Add more filters for date range, payment method etc.
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequestDetail | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState<string>('');


  const LIMIT = 10;

  const loadPayoutRequests = useCallback(() => {
    const filters: PayoutRequestFilters = {}; // Use PayoutRequestFilters type
    if (statusFilter) filters.status = statusFilter;
    // Add other filters (dates, payment_method_code) here

    dispatch(fetchPayoutRequestsThunk({ 
      page: payoutRequestsCurrentPage, 
      limit: LIMIT, 
      searchQuery: searchTerm, 
      filters 
    }));
  }, [dispatch, payoutRequestsCurrentPage, searchTerm, statusFilter]);

  useEffect(() => {
    loadPayoutRequests();
  }, [loadPayoutRequests]);

  // Effect to handle successful actions (approve/reject)
  useEffect(() => {
    if (payoutActionStatus === 'succeeded') {
      alert('تم الإجراء بنجاح!');
      setIsApproveModalOpen(false);
      setIsRejectModalOpen(false);
      setSelectedPayout(null);
      setAdminNotes('');
      setApprovedAmount('');
      dispatch(clearPayoutActionStatus()); // Clear status to prevent re-triggering
      loadPayoutRequests(); // Refresh the list
    } else if (payoutActionStatus === 'failed') {
      alert(`فشل الإجراء: ${payoutActionError || 'خطأ غير معروف'}`);
      dispatch(clearPayoutActionStatus());
    }
  }, [payoutActionStatus, payoutActionError, dispatch, loadPayoutRequests]);


  const handlePageChange = (newPage: number) => {
    dispatch(setPayoutRequestsCurrentPage(newPage));
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(setPayoutRequestsCurrentPage(1)); // Reset to first page on new search
    loadPayoutRequests(); // Called by useEffect due to page change or directly
  };
  
  const openApproveModal = (payout: PayoutRequestDetail) => {
    setSelectedPayout(payout);
    setApprovedAmount(payout.amount_requested.toString()); // Pre-fill with requested amount
    setAdminNotes('');
    setIsApproveModalOpen(true);
  };

  const openRejectModal = (payout: PayoutRequestDetail) => {
    setSelectedPayout(payout);
    setAdminNotes('');
    setIsRejectModalOpen(true);
  };

  const openDetailsModal = (payout: PayoutRequestDetail) => {
    setSelectedPayout(payout);
    setIsDetailsModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedPayout || !currentAdmin?.user_id) {
      alert('البيانات المطلوبة للموافقة غير كاملة.');
      return;
    }
    const numericAmount = parseFloat(approvedAmount);
    if (isNaN(numericAmount) || numericAmount <=0) {
        alert('الرجاء إدخال مبلغ صحيح للموافقة.');
        return;
    }

    dispatch(approvePayoutRequestThunk({
      payoutRequestId: selectedPayout.id,
      amountApproved: numericAmount,
      adminNotes: adminNotes || undefined,
      // adminId: currentAdmin.user_id, // adminId is now sourced from the thunk
    }));
  };

  const handleReject = async () => {
    if (!selectedPayout || !adminNotes.trim() || !currentAdmin?.user_id) {
      alert('الرجاء إدخال سبب الرفض.');
      return;
    }
    dispatch(rejectPayoutRequestThunk({
      payoutRequestId: selectedPayout.id,
      adminNotes: adminNotes,
      // adminId: currentAdmin.user_id, // adminId is now sourced from the thunk
    }));
  };
  
  // Temporary: get currentAdmin from store (if needed for display, usually thunks handle adminId)
  const { currentAdmin } = useAppSelector((state: RootState) => state.auth);


  if (payoutRequestsStatus === 'loading' && !payoutRequestsList.length) {
    return <div className="p-4 text-center">جاري تحميل طلبات السحب...</div>;
  }

  if (payoutRequestsStatus === 'failed' && !payoutRequestsList.length) {
    return <div className="p-4 text-center text-red-500">فشل تحميل طلبات السحب: {payoutRequestsError}</div>;
  }
  
  const totalPages = Math.ceil(payoutRequestsTotalCount / LIMIT);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="bg-white shadow rounded-lg p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">إدارة طلبات السحب</h2>
        
        {/* Search and Filters Bar */}
        <form onSubmit={handleSearch} className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="searchPayouts" className="block text-sm font-medium text-gray-700 mb-1">
              بحث (المعرف, اسم المستخدم, بريد, هاتف, رقم مرجعي)
            </label>
            <input
              type="text"
              id="searchPayouts"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="أدخل كلمة البحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              فلترة بالحالة
            </label>
            <select
              id="statusFilter"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                dispatch(setPayoutRequestsCurrentPage(1)); // Reset page on filter change
                // loadPayoutRequests(); // will be called by useEffect on statusFilter change if added to dependency array or call directly
              }}
            >
              <option value="">الكل</option>
              <option value="PENDING_APPROVAL">بانتظار الموافقة</option>
              <option value="APPROVED">موافق عليه</option>
              <option value="REJECTED">مرفوض</option>
              <option value="PROCESSING">قيد التنفيذ</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="FAILED">فشل</option>
            </select>
          </div>
          {/* Add more filters for date range, payment method type etc. here */}
          <div className="md:col-span-3 flex justify-start">
             <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm"
              >
              بحث وتطبيق الفلاتر
            </button>
          </div>
        </form>

        {/* Payouts Table */}
        {payoutRequestsStatus === 'loading' && <div className="text-center py-4">تحديث القائمة...</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['المعرف', 'المستخدم', 'المبلغ', 'العملة', 'وسيلة الدفع', 'الحالة', 'تاريخ الطلب', 'الإجراءات'].map(header => (
                  <th key={header} scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payoutRequestsList.length > 0 ? payoutRequestsList.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono" title={payout.id}>
                    {payout.id.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <div>{payout.user_name || 'غير متوفر'}</div>
                    <div className="text-xs text-gray-500">{payout.user_email || payout.user_phone || ''}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{payout.amount_requested}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{payout.currency}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div>{payout.payment_method_name || 'غير محدد'}</div>
                    <div className="text-xs text-gray-400">{payout.payment_method_type || ''}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payout.status === 'COMPLETED' || payout.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      payout.status === 'PENDING_APPROVAL' || payout.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                      payout.status === 'REJECTED' || payout.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {translatePayoutStatus(payout.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payout.requested_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-1 space-x-reverse">
                    {payout.status === 'PENDING_APPROVAL' && (
                      <>
                        <button onClick={() => openApproveModal(payout)} className="text-green-600 hover:text-green-900 p-1" title="موافقة">
                          <CheckCircleIcon />
                        </button>
                        <button onClick={() => openRejectModal(payout)} className="text-red-600 hover:text-red-900 p-1" title="رفض">
                          <XCircleIcon />
                        </button>
                      </>
                    )}
                     <button onClick={() => openDetailsModal(payout)} className="text-indigo-600 hover:text-indigo-900 p-1" title="عرض التفاصيل">
                        <EyeIcon />
                      </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                    لا توجد طلبات سحب تطابق معايير البحث الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="py-3 flex items-center justify-between border-t border-gray-200 mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(payoutRequestsCurrentPage - 1)}
                disabled={payoutRequestsCurrentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => handlePageChange(payoutRequestsCurrentPage + 1)}
                disabled={payoutRequestsCurrentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  عرض <span className="font-medium">{(payoutRequestsCurrentPage - 1) * LIMIT + 1}</span> إلى <span className="font-medium">{Math.min(payoutRequestsCurrentPage * LIMIT, payoutRequestsTotalCount)}</span> من <span className="font-medium">{payoutRequestsTotalCount}</span> نتائج
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(payoutRequestsCurrentPage - 1)}
                    disabled={payoutRequestsCurrentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">السابق</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                  </button>
                   <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    صفحة {payoutRequestsCurrentPage} من {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(payoutRequestsCurrentPage + 1)}
                    disabled={payoutRequestsCurrentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">التالي</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {isApproveModalOpen && selectedPayout && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4" dir="rtl">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">موافقة على طلب السحب</h3>
            <p className="text-sm text-gray-600">
              هل أنت متأكد من موافقتك على طلب السحب للمستخدم <span className="font-medium">{selectedPayout.user_name}</span> بمبلغ <span className="font-medium">{selectedPayout.amount_requested} {selectedPayout.currency}</span>؟
            </p>
            <div>
              <label htmlFor="approvedAmount" className="block text-sm font-medium text-gray-700">المبلغ الموافق عليه:</label>
              <input
                type="number"
                id="approvedAmount"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div>
              <label htmlFor="adminNotesApprove" className="block text-sm font-medium text-gray-700">ملاحظات (اختياري):</label>
              <textarea
                id="adminNotesApprove"
                rows={3}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm resize-none"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="أدخل ملاحظاتك هنا..."
              />
            </div>
            {payoutActionStatus === 'loading' && <div className="text-sm text-blue-500">جاري المعالجة...</div>}
            <div className="flex justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                disabled={payoutActionStatus === 'loading'}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={payoutActionStatus === 'loading'}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {payoutActionStatus === 'loading' ? 'جاري الموافقة...' : 'موافقة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRejectModalOpen && selectedPayout && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4" dir="rtl">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">رفض طلب السحب</h3>
            <p className="text-sm text-gray-600">
              سيتم رفض طلب السحب للمستخدم <span className="font-medium">{selectedPayout.user_name}</span> بمبلغ <span className="font-medium">{selectedPayout.amount_requested} {selectedPayout.currency}</span>.
            </p>
            <div>
              <label htmlFor="adminNotesReject" className="block text-sm font-medium text-gray-700">سبب الرفض (إلزامي):</label>
              <textarea
                id="adminNotesReject"
                rows={3}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm resize-none"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="أدخل سبب رفض الطلب هنا..."
                required
              />
            </div>
            {payoutActionStatus === 'loading' && <div className="text-sm text-blue-500">جاري المعالجة...</div>}
            <div className="flex justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={payoutActionStatus === 'loading'}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={payoutActionStatus === 'loading' || !adminNotes.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {payoutActionStatus === 'loading' ? 'جاري الرفض...' : 'رفض الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedPayout && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4" dir="rtl">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900">تفاصيل طلب السحب</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">معلومات أساسية</h4>
                <table className="min-w-full text-sm mt-2">
                  <tbody>
                    <tr>
                      <td className="py-1 text-gray-500">معرف الطلب:</td>
                      <td className="py-1 text-gray-900 font-mono">{selectedPayout.id}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-500">الحالة:</td>
                      <td className="py-1">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedPayout.status === 'COMPLETED' || selectedPayout.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          selectedPayout.status === 'PENDING_APPROVAL' || selectedPayout.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                          selectedPayout.status === 'REJECTED' || selectedPayout.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {translatePayoutStatus(selectedPayout.status)}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-500">تاريخ الطلب:</td>
                      <td className="py-1 text-gray-900">{new Date(selectedPayout.requested_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                    {selectedPayout.processed_at && (
                      <tr>
                        <td className="py-1 text-gray-500">تاريخ المعالجة:</td>
                        <td className="py-1 text-gray-900">{new Date(selectedPayout.processed_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">معلومات المستخدم</h4>
                <table className="min-w-full text-sm mt-2">
                  <tbody>
                    <tr>
                      <td className="py-1 text-gray-500">اسم المستخدم:</td>
                      <td className="py-1 text-gray-900">{selectedPayout.user_name || 'غير متوفر'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-500">البريد الإلكتروني:</td>
                      <td className="py-1 text-gray-900">{selectedPayout.user_email || 'غير متوفر'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-500">رقم الهاتف:</td>
                      <td className="py-1 text-gray-900">{selectedPayout.user_phone || 'غير متوفر'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-500">معرف المستخدم:</td>
                      <td className="py-1 text-gray-900 font-mono">{selectedPayout.user_id}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-500">تفاصيل المبلغ والدفع</h4>
              <table className="min-w-full text-sm mt-2">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-500">المبلغ المطلوب:</td>
                    <td className="py-1 text-gray-900 font-medium">{selectedPayout.amount_requested} {selectedPayout.currency}</td>
                  </tr>
                  {selectedPayout.amount_approved && (
                    <tr>
                      <td className="py-1 text-gray-500">المبلغ الموافق عليه:</td>
                      <td className="py-1 text-gray-900 font-medium">{selectedPayout.amount_approved} {selectedPayout.currency}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1 text-gray-500">طريقة الدفع:</td>
                    <td className="py-1 text-gray-900">{selectedPayout.payment_method_name || 'غير محدد'} {selectedPayout.payment_method_type ? `(${selectedPayout.payment_method_type})` : ''}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-gray-500">تفاصيل حساب الدفع:</td>
                    <td className="py-1 text-gray-900">
                      {selectedPayout.payout_target_details ? (
                        <div>
                          {Object.entries(selectedPayout.payout_target_details).map(([key, value]) => (
                            <div key={key}><span className="text-gray-500">{key}:</span> {String(value)}</div>
                          ))}
                        </div>
                      ) : 'غير متوفر'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {(selectedPayout.user_notes || selectedPayout.admin_notes) && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500">ملاحظات</h4>
                {selectedPayout.user_notes && (
                  <div className="bg-gray-50 p-3 rounded mt-2">
                    <h5 className="text-xs font-medium text-gray-500">ملاحظات المستخدم:</h5>
                    <p className="text-sm text-gray-900 mt-1">{selectedPayout.user_notes}</p>
                  </div>
                )}
                {selectedPayout.admin_notes && (
                  <div className="bg-blue-50 p-3 rounded mt-2">
                    <h5 className="text-xs font-medium text-blue-500">ملاحظات الإدارة:</h5>
                    <p className="text-sm text-gray-900 mt-1">{selectedPayout.admin_notes}</p>
                  </div>
                )}
              </div>
            )}
            
            {selectedPayout.wallet_transaction_id && (
              <div className="bg-green-50 p-3 rounded mt-4">
                <h4 className="text-sm font-medium text-green-500">معلومات المعاملة</h4>
                <p className="text-sm text-gray-800 mt-1">معرف المعاملة: <span className="font-mono">{selectedPayout.wallet_transaction_id}</span></p>
                {selectedPayout.transaction_reference && (
                  <p className="text-sm text-gray-800 mt-1">المرجع: {selectedPayout.transaction_reference}</p>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t border-gray-200 mt-4">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                إغلاق
              </button>
              {selectedPayout.status === 'PENDING_APPROVAL' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      openApproveModal(selectedPayout);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    موافقة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      openRejectModal(selectedPayout);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    رفض
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PayoutRequestsTable;
