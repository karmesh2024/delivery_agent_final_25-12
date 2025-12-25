"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// نموذج البيانات للإشعار
export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

// سياق إدارة Toast
interface ToastContextType {
  toast: (props: ToastProps) => void;
  removeToast: (id: string) => void;
  toasts: ToastProps[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// مقدم سياق Toast
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 10);
    setToasts(prevToasts => [...prevToasts, { ...props, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast, toasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook لاستخدام Toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// وظيفة لإظهار Toast (للاستخدام المباشر)
// تم إزالة استخدام useContext لتجنب الخطأ
let toastHandler: ((props: ToastProps) => void) | null = null;

// تسجيل معالج Toast داخليًا
export function registerToastHandler(handler: ((props: ToastProps) => void) | null) {
  toastHandler = handler;
}

// وظيفة مساعدة للاستخدام المباشر
export function toast(props: ToastProps) {
  if (toastHandler) {
    toastHandler(props);
  } else {
    console.warn('Toast provider not initialized, notification not shown:', props);
  }
}

// مكون حاوية الإشعارات
function ToastContainer() {
  const context = useContext(ToastContext);
  const { toasts, removeToast } = context || { toasts: [], removeToast: () => {} };

  // تسجيل معالج Toast عند تحميل المكون
  useEffect(() => {
    if (context) {
      // Register a handler that uses the toast function from context
      registerToastHandler((props: ToastProps) => {
        context.toast(props);
      });
    }
    
    // Cleanup when unmounting
    return () => {
      // Reset the toast handler
      toastHandler = null;
    };
  }, [context]);

  return (
    <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={() => toast.id && removeToast(toast.id)} />
      ))}
    </div>
  );
}

// مكون الإشعار الفردي
function Toast({ id, title, description, type = 'info', duration = 5000, onClose }: ToastProps & { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'p-4 rounded-lg shadow-lg max-w-md animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3 relative rtl:text-right',
        {
          'bg-green-50 border-green-200 border text-green-800': type === 'success',
          'bg-red-50 border-red-200 border text-red-800': type === 'error',
          'bg-amber-50 border-amber-200 border text-amber-800': type === 'warning',
          'bg-blue-50 border-blue-200 border text-blue-800': type === 'info',
        }
      )}
    >
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      <button
        onClick={onClose}
        className={cn(
          'p-1 rounded-full hover:bg-black/10 transition-colors',
          {
            'hover:bg-green-200/50': type === 'success',
            'hover:bg-red-200/50': type === 'error',
            'hover:bg-amber-200/50': type === 'warning',
            'hover:bg-blue-200/50': type === 'info',
          }
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default useToast; 