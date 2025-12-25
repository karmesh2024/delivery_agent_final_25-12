'use client';

import React from 'react';
import { FiX } from 'react-icons/fi';

// أنماط CSS المضمنة للمكون
const dialogStyles = {
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000, // زيادة z-index لضمان ظهوره فوق العناصر الأخرى
    padding: '1rem'
  },
  content: {
    position: 'relative' as const,
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: '50rem', // يمكن تعديل العرض الأقصى حسب الحاجة
    maxHeight: '90vh', // السماح بارتفاع أكبر
    display: 'flex',    // استخدام flex لتنظيم المحتوى
    flexDirection: 'column' as const, // ترتيب المحتوى عموديًا
    padding: '0', // إزالة الحشو الافتراضي للسماح بالتحكم الكامل من المحتوى
    zIndex: 1001
  },
  header: {
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e5e7eb' // إضافة فاصل سفلي للرأس
  },
  title: {
    fontSize: '1.125rem', // حجم خط أكبر قليلاً للعنوان
    fontWeight: '600',
    color: '#1f2937' // لون أغمق للعنوان
  },
  description: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.25rem'
  },
  body: {
    padding: '1.5rem', // حشو للمحتوى الرئيسي
    overflowY: 'auto' as const, // إضافة تمرير للمحتوى إذا تجاوز الارتفاع
    flexGrow: 1 // السماح للمحتوى بالتمدد
  },
  footer: {
    padding: '1rem 1.5rem',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    borderTop: '1px solid #e5e7eb' // إضافة فاصل علوي للتذييل
  },
  closeButton: {
    position: 'absolute' as const,
    top: '0.75rem',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
    color: '#6b7280',
    display: 'flex', // Ensure icon aligns
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonHover: { // حالة hover للزر (تحتاج إلى تطبيقها بـ onMouseEnter/Leave أو CSS classes)
     backgroundColor: '#f3f4f6' // خلفية خفيفة عند المرور
  }
};

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string; // إضافة خاصية لتحديد العرض الأقصى
}

export function OrderDetailsDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = '3xl' // قيمة افتراضية للعرض الأقصى (يمكن استخدام قيم tailwind)
}: OrderDetailsDialogProps) {
  if (!isOpen) return null;

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // تحديد العرض الأقصى بناءً على الخاصية
  const getMaxWidthStyle = () => {
      const sizes = {
          "sm": "24rem", "md": "28rem", "lg": "32rem", "xl": "36rem",
          "2xl": "42rem", "3xl": "48rem", "4xl": "56rem", "5xl": "64rem",
          "6xl": "72rem", "7xl": "80rem",
      };
      // تحويل قيم tailwind إلى قيم فعلية أو استخدام القيمة الممررة مباشرة
      return sizes[maxWidth as keyof typeof sizes] || maxWidth;
  };

  const contentStyle = {
    ...dialogStyles.content,
    maxWidth: getMaxWidthStyle()
  };

  return (
    <div style={dialogStyles.backdrop} onClick={onClose} id="order-details-dialog-backdrop">
      <div style={contentStyle} onClick={handleContentClick} id="order-details-dialog-content">
        {/* Header Section */}
        <div style={dialogStyles.header}>
           <h2 style={dialogStyles.title}>{title}</h2>
           {description && <p style={dialogStyles.description}>{description}</p>}
           {/* Close Button */}
            <button 
              style={dialogStyles.closeButton} 
              onClick={onClose} 
              aria-label="إغلاق"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = dialogStyles.closeButtonHover.backgroundColor)} 
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <FiX size={18} />
            </button>
        </div>
        
        {/* Body Section */}
        <div style={dialogStyles.body}>
          {children}
        </div>

        {/* Footer Section (Optional) */}
        {footer && <div style={dialogStyles.footer}>{footer}</div>}
      </div>
    </div>
  );
}

export default OrderDetailsDialog; 