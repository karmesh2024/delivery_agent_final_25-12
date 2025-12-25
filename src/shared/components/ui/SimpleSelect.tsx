'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Option {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SimpleSelect({ options, value, onChange, placeholder = 'اختر...', className = '' }: SimpleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  
  // سجلات للتشخيص
  useEffect(() => {
    console.log('[SimpleSelect] Rendering with options:', options.length);
    console.log('[SimpleSelect] Current value:', value);
  }, [options, value]);
  
  // إنشاء حاوية البوابة لاستخدامها في وضع الحوارات
  /* // MODIFIED - Commented out portalContainer related useEffect
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // إنشاء العنصر إذا لم يكن موجودًا
      let container = document.getElementById('select-portal-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'select-portal-container';
        container.style.position = 'fixed';
        container.style.zIndex = '9999999'; // Keep z-index high
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        document.body.appendChild(container);
      }
      setPortalContainer(container);
    }
    
    // التنظيف عند فك المكون
    return () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };
  }, []);
  */ // MODIFIED
  
  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    // استخدام mouseup بدلاً من mousedown لمنع إغلاق القائمة أثناء التمرير
    document.addEventListener('mouseup', handleClickOutside);
    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
    };
  }, []);
  
  // تعيين الموضع عند فتح القائمة
  /* // MODIFIED - Commented out position calculation for portal
  useEffect(() => {
    if (isOpen && selectRef.current && portalContainer) {
      const rect = selectRef.current.getBoundingClientRect();
      const menuId = `select-menu-${Math.random().toString(36).substr(2, 9)}`;
      
      const menuDiv = document.createElement('div');
      menuDiv.id = menuId;
      menuDiv.style.position = 'absolute';
      menuDiv.style.width = `${rect.width}px`;
      menuDiv.style.left = `${rect.left}px`;
      menuDiv.style.top = `${rect.bottom + window.scrollY}px`;
      
      portalContainer.appendChild(menuDiv);
      
      return () => {
        const menu = document.getElementById(menuId);
        if (menu) {
          portalContainer.removeChild(menu);
        }
      };
    }
  }, [isOpen, portalContainer]);
  */ // MODIFIED
  
  // الحصول على العنصر المختار
  const selectedOption = options.find(option => option.value === value);
  
  // معالج للنقر على خيار
  const handleOptionClick = (optionValue: string) => {
    console.log('[SimpleSelect] Option selected:', optionValue);
    onChange(optionValue);
    setIsOpen(false);
  };
  
  // Toggle dropdown visibility
  const toggleDropdown = () => {
    console.log('[SimpleSelect] Toggle dropdown, current state:', !isOpen);
    console.log('[SimpleSelect] Available options:', options);
    setIsOpen(!isOpen);
  };
  
  return (
    <div 
      ref={selectRef}
      className={`relative w-full ${className}`}
    >
      {/* زر فتح القائمة */}
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        onClick={toggleDropdown}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="opacity-50"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {/* قائمة الخيارات */}
      {/* // MODIFIED - Removed createPortal and portalContainer check */}
      {isOpen && ( 
        (<div 
          className="absolute bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto overflow-x-hidden mt-1" // MODIFIED - Added mt-1 for basic spacing, kept other styles
          style={{ 
            maxHeight: '200px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            width: selectRef.current?.clientWidth, // Keep width relative to select button
            // left: selectRef.current?.getBoundingClientRect().left, // Position will be relative to parent
            // top: selectRef.current?.getBoundingClientRect().bottom, // Position will be relative to parent
            zIndex: 9999 // MODIFIED - Still high, but portal z-index was higher
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ul 
            className="py-1"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {options.map((option) => (
              <li 
                key={option.value}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${option.value === value ? 'bg-gray-50 font-medium' : ''} text-black`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleOptionClick(option.value);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {option.label}
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">
                لا توجد خيارات متاحة
              </li>
            )}
          </ul>
        </div>)
      // MODIFIED - Removed portalContainer as target for createPortal
      )}
    </div>
  );
} 