'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export function CustomDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  footer
}: CustomDialogProps) {

  // منع تمرير الجسم وإخفاء الـ sidebars عند فتح الـ dialog
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // إضافة class للـ body لإخفاء الـ sidebars عبر CSS
      document.body.classList.add('dialog-open');
      
      // إخفاء جميع الـ sidebars مباشرة
      const hideSidebars = () => {
        // البحث عن جميع العناصر التي قد تكون sidebars
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach((div) => {
          const element = div as HTMLElement;
          const classes = element.className || '';
          const text = element.textContent || '';
          
          // التحقق من أن العنصر هو sidebar
          const isSidebar = (
            (classes.includes('flex') && classes.includes('flex-col') && classes.includes('h-screen')) ||
            (classes.includes('bg-black') && text.includes('DeliveryApp')) ||
            (text.includes('DeliveryApp') && text.includes('MAIN MENU')) ||
            (text.includes('Toggle Sidebar') && classes.includes('bg-black'))
          );
          
          if (isSidebar && !element.dataset.dialogHidden) {
            element.dataset.dialogHidden = 'true';
            element.style.display = 'none';
          }
        });
      };
      
      // تنفيذ فوراً وبعد تأخير صغير للتأكد
      hideSidebars();
      const timeoutId = setTimeout(hideSidebars, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.body.style.overflow = '';
        document.body.classList.remove('dialog-open');
        
        // إعادة عرض جميع الـ sidebars
        const hiddenElements = document.querySelectorAll('[data-dialog-hidden="true"]');
        hiddenElements.forEach((el) => {
          const element = el as HTMLElement;
          element.style.display = '';
          delete element.dataset.dialogHidden;
        });
      };
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('dialog-open');
      
      // إعادة عرض جميع الـ sidebars
      const hiddenElements = document.querySelectorAll('[data-dialog-hidden="true"]');
      hiddenElements.forEach((el) => {
        const element = el as HTMLElement;
        element.style.display = '';
        delete element.dataset.dialogHidden;
      });
    }
  }, [isOpen]);

  // إغلاق النافذة عند الضغط على مفتاح Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // منع انتشار الأحداث من النافذة إلى الخلفية
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) {
    return null;
  }

  const dialogContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      data-state={isOpen ? 'open' : 'closed'}
      style={{ 
        zIndex: 999999,
        isolation: 'isolate',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'auto'
      }}
    >
      {/* طبقة خلفية سوداء شفافة */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        style={{ 
          zIndex: 999999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'auto'
        }}
      />

      {/* محتوى النافذة */}
      <div
        className={cn(
          "relative bg-white rounded-lg shadow-2xl w-full max-w-4xl",
          "max-h-[90vh] min-h-[300px] flex flex-col overflow-hidden",
          className
        )}
        onClick={handleContentClick}
        onKeyDown={(e) => e.stopPropagation()}
        style={{ 
          zIndex: 1000000, 
          isolation: 'isolate',
          position: 'relative',
          pointerEvents: 'auto'
        }}
      >
        {/* رأس النافذة الثابت */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-200">
          {/* زر الإغلاق */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-4 top-4 p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
            aria-label="إغلاق"
          >
            <FiX size={20} />
          </button>

          {/* عنوان ووصف النافذة */}
          <div className="pr-10">
            <h2 className="text-xl font-bold mb-1 text-gray-800">
              {title}
            </h2>
            {description && (
              <div className="text-sm text-gray-500">
                {description}
              </div>
            )}
          </div>
        </div>

        {/* محتوى النافذة الديناميكي - قابل للتمرير */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6 py-4">
          {children}
        </div>

        {/* تذييل النافذة الثابت */}
        {footer && (
          <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // استخدام Portal لعرض الـ dialog مباشرة في document.body
  // هذا يضمن أن الـ dialog يظهر فوق جميع العناصر بما فيها الـ Sidebar
  if (typeof document !== 'undefined' && isOpen) {
    return createPortal(dialogContent, document.body);
  }

  return null;
}

// مكون التذييل لأزرار النافذة
export function DialogFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:rtl:space-x-reverse gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}