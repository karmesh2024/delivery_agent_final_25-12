import React from 'react';
import { CustomDialog, DialogFooter } from '@/shared/ui/custom-dialog';

interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; // محتوى النموذج (الحقول)
  footer: React.ReactNode; // الأزرار السفلية
  maxWidth?: string; // Allow overriding default width
  description?: string; // وصف اختياري للنافذة
}

export const FormDialog: React.FC<FormDialogProps> = ({ 
  isOpen, 
  onClose,
  title, 
  children, 
  footer, 
  maxWidth = '14rem', // تحديث العرض ليتطابق مع UniversalDialog
  description
}) => {
  // تنسيق المحتوى في حاوية مع هوامش أصغر تناسب الحجم الجديد
  const wrappedContent = (
    <div className="space-y-2 py-1"> {/* تقليل التباعد بين العناصر */}
      {children}
    </div>
  );

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      className={`sm:max-w-[${maxWidth}]`}
      footer={
        <DialogFooter>
          {footer}
        </DialogFooter>
      }
    >
      {wrappedContent}
    </CustomDialog>
  );
}; 