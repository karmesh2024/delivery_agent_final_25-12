import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { 
  updateWalletStatusAndRefreshList, 
  clearSelectedWallet 
} from '@/domains/payments/store/paymentsDashboardSlice';
import { WalletWithUserDetails } from '@/domains/payments/types/paymentTypes';
import { translateWalletType, translateWalletStatus } from '@/services/paymentsService';
import { toast } from '@/shared/ui/toast';

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentListParams: { 
    page: number; 
    limit: number; 
    filters?: { wallet_type?: string; status?: string; };
    searchQuery?: string;
  };
}

const WalletDetailsModal: React.FC<WalletDetailsModalProps> = ({ isOpen, onClose, currentListParams }) => {
  const dispatch = useAppDispatch();
  const { 
    selectedWalletDetails: wallet, 
    selectedWalletStatus: status, 
    selectedWalletError: error,
  } = useAppSelector((state: RootState) => state.paymentsDashboard);

  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (wallet && status === 'succeeded') {
      setNewStatus(wallet.status);
    } else if (!wallet) {
      setNewStatus('');
    }
  }, [wallet, status]);

  if (!isOpen) {
    return null;
  }

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setNewStatus(event.target.value);
  };

  const handleSubmit = async () => {
    if (wallet && newStatus && newStatus !== wallet.status) {
      setIsUpdating(true);
      try {
        const resultAction = await dispatch(updateWalletStatusAndRefreshList({ 
          walletId: wallet.id, 
          newStatus,
          listParams: currentListParams
        }));

        if (updateWalletStatusAndRefreshList.fulfilled.match(resultAction)) {
          toast({ type: 'success', title: 'تم بنجاح', description: 'تم تحديث حالة المحفظة بنجاح!' });
        } else {
          const errorMessage = (resultAction.payload as string) || error || 'خطأ غير معروف أثناء التحديث';
          toast({ type: 'error', title: 'خطأ', description: `فشل تحديث حالة المحفظة: ${errorMessage}` });
        }
      } catch (e) {
        toast({ type: 'error', title: 'خطأ', description: 'حدث خطأ غير متوقع أثناء محاولة تحديث الحالة.' });
      } finally {
        setIsUpdating(false);
      }
    } else if (wallet && newStatus === wallet.status) {
      onClose();
    }
  };
  
  const handleClose = () => {
    onClose();
  }

  const isSaveDisabled = isUpdating || (wallet && newStatus === wallet.status) || status === 'loading';
  const saveButtonText = isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات';

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4" dir="rtl">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">
            {status === 'loading' && !isUpdating ? 'تحميل تفاصيل المحفظة...' : wallet ? `تفاصيل المحفظة: ${wallet.id}` : 'تفاصيل المحفظة'}
          </h3>
          <button 
            onClick={handleClose} 
            disabled={isUpdating}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {(status === 'loading' && !isUpdating) && <div className="text-center py-4">جارٍ تحميل التفاصيل...</div>}
        {status === 'failed' && error && <div className="text-red-500 text-center py-4">خطأ: {error}</div>}
        
        {wallet && (status === 'succeeded' || isUpdating) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>معرف المحفظة:</strong> {wallet.id}</div>
              <div><strong>معرف المستخدم:</strong> {wallet.user_id}</div>
              <div><strong>اسم المستخدم:</strong> {wallet.user_details?.full_name || 'غير متوفر'}</div>
              <div><strong>البريد الإلكتروني:</strong> {wallet.user_details?.email || 'غير متوفر'}</div>
              <div><strong>رقم الهاتف:</strong> {wallet.user_details?.phone_number || 'غير متوفر'}</div>
              <div><strong>الرصيد:</strong> {wallet.balance.toLocaleString('ar-EG', { style: 'currency', currency: wallet.currency })}</div>
              <div><strong>العملة:</strong> {wallet.currency}</div>
              <div><strong>نوع المحفظة:</strong> {translateWalletType(wallet.wallet_type)}</div>
              <div><strong>الحالة الحالية:</strong> {translateWalletStatus(wallet.status)}</div>
              <div><strong>تاريخ الإنشاء:</strong> {new Date(wallet.created_at).toLocaleDateString('ar-EG')}</div>
              <div><strong>آخر تحديث:</strong> {new Date(wallet.updated_at).toLocaleDateString('ar-EG')}</div>
            </div>

            <hr className="my-4" />

            <div>
              <label htmlFor="walletStatus" className="block mb-2 text-sm font-medium text-gray-900">
                تغيير حالة المحفظة:
              </label>
              <select 
                id="walletStatus"
                value={newStatus}
                onChange={handleStatusChange}
                disabled={isUpdating}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50"
              >
                <option value="ACTIVE">نشط (ACTIVE)</option>
                <option value="INACTIVE">غير نشط (INACTIVE)</option>
                <option value="PENDING_VERIFICATION">بانتظار التحقق (PENDING_VERIFICATION)</option>
                <option value="VERIFIED">تم التحقق (VERIFIED)</option>
                <option value="REJECTED">مرفوض (REJECTED)</option>
                <option value="FROZEN">مجمد (FROZEN)</option>
                <option value="SUSPENDED">معلق (SUSPENDED)</option>
                <option value="CLOSED">مغلق (CLOSED)</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-4">
              <button 
                type="button" 
                onClick={handleClose}
                disabled={isUpdating}
                className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={isSaveDisabled}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50"
              >
                {saveButtonText}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WalletDetailsModal; 