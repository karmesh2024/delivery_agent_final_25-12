'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, Home } from 'lucide-react';

/**
 * صفحة عدم التصريح للمستخدمين غير المصرح لهم للوصول لصفحة ما
 */
export default function UnauthorizedPage() {
  const router = useRouter();
  
  /**
   * العودة للصفحة السابقة
   */
  const handleGoBack = () => {
    router.back();
  };
  
  /**
   * الذهاب للصفحة الرئيسية
   */
  const handleGoHome = () => {
    router.push('/');
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">غير مصرح بالوصول</h1>
        
        <p className="text-gray-600 mb-6">
          عذراً، لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة.
          يرجى التواصل مع مسؤول النظام إذا كنت تعتقد أنه يجب أن يكون لديك وصول.
        </p>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 rtl:space-x-reverse justify-center">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <ArrowRight className="w-4 h-4 ml-2 rtl:rotate-180" />
            العودة للصفحة السابقة
          </button>
          
          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <Home className="w-4 h-4 ml-2" />
            الذهاب للصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}