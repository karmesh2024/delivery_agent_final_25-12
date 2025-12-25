'use client';

import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

// استبدال Select من radix-ui بعنصر select أساسي
function SimpleSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = 'اختر...' 
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full" dir="rtl">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-md border border-gray-300 py-2 px-3 text-sm appearance-none bg-transparent"
        style={{ 
          direction: 'rtl',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'left 0.5rem center',
          backgroundSize: '1rem',
          paddingLeft: '2rem'
        }}
      >
        <option value="" disabled hidden>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// نستخدم CSS مضمن لمنع شريط التمرير
const userDialogStyles = {
  backdrop: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '1rem'
  },
  content: {
    position: 'relative' as const,
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: '26rem',
   // overflow: 'hidden',
    padding: '14px',
    zIndex: 51
  },
  innerContent: {
    maxHeight: '75vh',
  },
  closeButton: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  titleContainer: {
    marginBottom: '12px'
  },
  title: {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '2px'
  },
  description: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  contentContainer: {
    marginTop: '6px'
  },
  footerContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.25rem',
    marginTop: '0.75rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid #e5e7eb'
  }
};

// إعادة تنفيذ كاملة للنافذة بدون أي أفلوس
function UserDialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!isOpen) return null;

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div style={userDialogStyles.backdrop} onClick={onClose} id="user-dialog-backdrop">
      <div style={userDialogStyles.content} onClick={handleContentClick} id="user-dialog-content">
        <button style={userDialogStyles.closeButton} onClick={onClose} aria-label="إغلاق">
          <FiX size={16} />
        </button>

        <div style={userDialogStyles.titleContainer}>
          <h2 style={userDialogStyles.title}>{title}</h2>
          {description && <p style={userDialogStyles.description}>{description}</p>}
        </div>

        <div style={userDialogStyles.contentContainer}>
          <div style={userDialogStyles.innerContent}>
            {children}
          </div>
        </div>

        {footer && <div style={userDialogStyles.footerContainer}>{footer}</div>}
      </div>
    </div>
  );
}

interface UserData {
  email: string;
  username: string;
  fullName: string;
  password: string;
  role: string;
}

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: UserData) => void;
}

const roleOptions = [
  { value: 'manager', label: 'مدير' },
  { value: 'supervisor', label: 'مشرف' },
  { value: 'support', label: 'دعم' }
];

export default function AddUserDialog({ isOpen, onClose, onSubmit }: AddUserDialogProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      email,
      username,
      fullName,
      password,
      role
    });
    onClose();
  };

  return (
    <UserDialog
      isOpen={isOpen}
      onClose={onClose}
      title="إضافة مسؤول جديد"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            البريد الإلكتروني <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md h-9 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            اسم المستخدم <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md h-9 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            الاسم الكامل <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md h-9 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            كلمة المرور <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md h-9 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            تأكيد كلمة المرور <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md h-9 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            الصلاحية <span className="text-red-500">*</span>
          </label>
          <SimpleSelect
            options={roleOptions}
            value={role}
            onChange={setRole}
            placeholder="اختر الصلاحية"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            حفظ
          </button>
        </div>
      </form>
    </UserDialog>
  );
} 