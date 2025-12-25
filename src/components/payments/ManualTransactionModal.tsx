import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { createManualTransactionAndUpdateDetails } from '@/domains/payments/store/paymentsDashboardSlice';
import { WalletWithUserDetails, TransactionDetail } from '@/domains/payments/types/paymentTypes';
import { toast } from '@/shared/ui/toast';

interface ManualTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletWithUserDetails | null; // Pass the whole wallet object to get currency and ID
}

const ManualTransactionModal: React.FC<ManualTransactionModalProps> = ({ isOpen, onClose, wallet }) => {
  const dispatch = useAppDispatch();
  const { currentAdmin } = useAppSelector((state: RootState) => state.auth); // Get currentAdmin from auth state
  const { selectedWalletTransactionsCurrentPage } = useAppSelector((state: RootState) => state.paymentsDashboard);

  const [transactionType, setTransactionType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTransactionType('DEPOSIT');
      setAmount('');
      setDescription('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, wallet]);

  if (!isOpen || !wallet) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!currentAdmin || !currentAdmin.id) {
      setError('لا يمكن إتمام العملية. بيانات المسؤول غير متوفرة.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('الرجاء إدخال مبلغ صحيح وأكبر من الصفر.');
      return;
    }
    if (!description.trim()) {
      setError('الرجاء إدخال وصف للمعاملة.');
      return;
    }

    setIsSubmitting(true);
    try {
      // const adminId = currentAdmin.id; // adminId is now sourced from the thunk itself
      
      const resultAction = await dispatch(createManualTransactionAndUpdateDetails({
        walletId: wallet.id,
        type: transactionType,
        amount: numericAmount,
        description,
        currency: wallet.currency,
        // adminId, // Removed: adminId is obtained from Redux state within the thunk
        currentTransactionsPage: selectedWalletTransactionsCurrentPage,
        transactionsLimit: 10, // Using the standard limit from paymentsService constants
      }));

      if (createManualTransactionAndUpdateDetails.fulfilled.match(resultAction)) {
        toast({ type: 'success', title: 'تم بنجاح', description: 'تمت المعاملة اليدوية بنجاح!' });
        onClose(); 
      } else {
        const errorMessage = resultAction.payload as string || 'فشل في تنفيذ المعاملة اليدوية.';
        setError(errorMessage);
        toast({ type: 'error', title: 'فشل', description: `فشل: ${errorMessage}` });
      }
    } catch (e: unknown) {
      let catchError = 'حدث خطأ غير متوقع.';
      if (e instanceof Error) {
        catchError = e.message;
      }
      setError(catchError);
      toast({ type: 'error', title: 'خطأ', description: `خطأ: ${catchError}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4" dir="rtl">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">
            إجراء معاملة يدوية للمحفظة: <span className="font-mono text-sm">{wallet.id.substring(0,15)}...</span>
          </h3>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="manualTxType" className="block mb-1 text-sm font-medium text-gray-700">نوع العملية:</label>
            <select 
              id="manualTxType" 
              value={transactionType} 
              onChange={(e) => setTransactionType(e.target.value as 'DEPOSIT' | 'WITHDRAWAL')}
              disabled={isSubmitting || !currentAdmin?.id} // Disable if no adminId
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm disabled:opacity-50"
            >
              <option value="DEPOSIT">إيداع (+)</option>
              <option value="WITHDRAWAL">سحب (-)</option>
            </select>
          </div>

          <div>
            <label htmlFor="manualTxAmount" className="block mb-1 text-sm font-medium text-gray-700">المبلغ ({wallet.currency}):</label>
            <input 
              type="number" 
              id="manualTxAmount" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="أدخل المبلغ"
              disabled={isSubmitting || !currentAdmin?.id} // Disable if no adminId
              min="0.01" 
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label htmlFor="manualTxDescription" className="block mb-1 text-sm font-medium text-gray-700">الوصف/السبب:</label>
            <textarea 
              id="manualTxDescription" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows={3}
              placeholder="مثال: تسوية رصيد، إيداع طارئ..."
              disabled={isSubmitting || !currentAdmin?.id} // Disable if no adminId
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm disabled:opacity-50 resize-none"
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded-md">{error}</div>}

          <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 disabled:opacity-50"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !currentAdmin?.id} // Disable submit if no adminId
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50"
            >
              {isSubmitting ? 'جاري التنفيذ...' : 'تنفيذ المعاملة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualTransactionModal; 