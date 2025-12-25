'use client';

import React, { useEffect } from 'react';
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

  // منع تمرير الجسم عندما تكون النافذة مفتوحة
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
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

  if (!isOpen) {
    return null;
  }

  // منع انتشار الأحداث من النافذة إلى الخلفية
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      data-state={isOpen ? 'open' : 'closed'}
    >
      {/* طبقة خلفية سوداء شفافة */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* محتوى النافذة */}
      <div
        className={cn(
          "relative bg-white rounded-lg shadow-2xl w-full max-w-4xl z-[10000]",
          "max-h-[90vh] min-h-[300px] flex flex-col overflow-hidden",
          className
        )}
        onClick={handleContentClick}
        onKeyDown={(e) => e.stopPropagation()}
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 py-4">
          <div className="min-h-0">
            {children}
          </div>
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