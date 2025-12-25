'use client';

import React from 'react';
import { FiX } from 'react-icons/fi';
import { Button } from '@/shared/components/ui/button';
import { PermissionGuard } from '@/components/PermissionGuard';

interface PermissionsUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

// تم تغيير اسم المكون هنا
export function PermissionsUserDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = '26rem' // قيمة maxWidth الافتراضية بقيت كما في UniversalDialog الأصلي
}: PermissionsUserDialogProps) {
  // استخدام مرجع للمحتوى
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // منع التمرير على الخلفية عندما تكون النافذة مفتوحة
  React.useEffect(() => {
    if (isOpen) {
      // تم تفعيل التمرير داخل المحتوى فقط
      document.body.style.overflow = 'hidden';
      
      // إضافة select-portal-container للحوار إذا لم يكن موجودًا
      let portalContainer = document.getElementById('select-portal-container');
      if (!portalContainer) {
        portalContainer = document.createElement('div');
        portalContainer.id = 'select-portal-container';
        portalContainer.style.position = 'fixed';
        portalContainer.style.zIndex = '9999999';
        portalContainer.style.top = '0';
        portalContainer.style.left = '0';
        portalContainer.style.width = '100%';
        document.body.appendChild(portalContainer);
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // منع انتشار الأحداث من النافذة للخلفية
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem'
      }}
      onClick={onClose}
      className="permissions-user-dialog-backdrop"
    >
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: maxWidth,
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '14px',
          zIndex: 1000000
        }}
        onClick={handleContentClick}
        className="permissions-user-dialog-content"
      >
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
          aria-label="إغلاق"
        >
          <FiX size={16} />
        </button>

        {/* العنوان والوصف */}
        <div style={{ marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '2px' }}>
            {title}
          </h2>
          {description && (
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {description}
            </p>
          )}
        </div>

        {/* المحتوى */}
        <div style={{ marginTop: '6px', position: 'relative' }}>
          {children}
        </div>

        {/* القدم إذا كان موجودًا */}
        {footer && (
          <div className="flex justify-end gap-1 mt-3 pt-2 border-t">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// يمكن الإبقاء على مكونات القدم أو إزالتها إذا لم تكن مستخدمة هنا
// حالياً، سنبقي عليها لضمان التوافق الكامل

// مكون القدم للأزرار
export function PermissionsDialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end gap-1 mt-3 pt-2 border-t">
      {children}
    </div>
  );
}

// أزرار قياسية مشتركة للنوافذ - جعل الأزرار أصغر
export function PermissionsDialogCloseButton({ onClick, disabled = false }: { onClick: () => void, disabled?: boolean }) {
  return (
    <Button variant="outline" onClick={onClick} disabled={disabled} size="sm" className="px-2 h-7 text-xs">
      إلغاء
    </Button>
  );
}

export function PermissionsDialogConfirmButton({ onClick, disabled = false, loading = false, text = 'موافق' }: 
  { onClick: () => void, disabled?: boolean, loading?: boolean, text?: string }) {
  return (
    <Button onClick={onClick} disabled={disabled || loading} size="sm" className="px-2 h-7 text-xs">
      {loading ? 'جاري...' : text}
    </Button>
  );
}

export function PermissionsDialogDeleteButton({ onClick, disabled = false, loading = false }: 
  { onClick: () => void, disabled?: boolean, loading?: boolean }) {
  return (
    <Button variant="destructive" onClick={onClick} disabled={disabled || loading} size="sm" className="px-2 h-7 text-xs">
      {loading ? 'جاري...' : 'حذف'}
    </Button>
  );
} 