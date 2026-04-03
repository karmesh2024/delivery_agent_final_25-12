import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi';

interface DropdownOption {
  id: string;
  name: string;
  description?: string;
  sector_name?: string;
  classification_name?: string;
}

interface EnhancedDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  searchPlaceholder?: string;
  showUniqueOnly?: boolean;
}

export const EnhancedDropdown: React.FC<EnhancedDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "اختر...",
  label,
  required = false,
  className = "",
  searchPlaceholder = "ابحث...",
  showUniqueOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<DropdownOption[]>([]);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  // فلترة التكرارات إذا كان مطلوباً
  const uniqueOptions = React.useMemo(() => {
    if (!showUniqueOnly) return options;
    
    const seen = new Set();
    return options.filter(option => {
      const key = option.name.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [options, showUniqueOnly]);

  // فلترة الخيارات بناءً على البحث
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(uniqueOptions);
    } else {
      const filtered = uniqueOptions.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.sector_name && option.sector_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (option.classification_name && option.classification_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, uniqueOptions]);

  // حساب موضع القائمة المنسدلة للعرض في Portal (لتجنب القص داخل النوافذ المنبثقة)
  useLayoutEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    } else {
      setPosition(null);
    }
  }, [isOpen]);

  // إغلاق الـ dropdown عند النقر خارجه (يشمل المحتوى المعروض عبر Portal)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTrigger = dropdownRef.current?.contains(target);
      const insidePortal = portalRef.current?.contains(target);
      if (!insideTrigger && !insidePortal) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // التركيز على حقل البحث عند فتح الـ dropdown
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleOptionClick = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleOptionClickWithEvent = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    handleOptionClick(optionId);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  const selectedOption = uniqueOptions.find(option => String(option.id) === String(value));

  return (
    <div 
      className={`relative ${className}`} 
      ref={dropdownRef} 
      style={{ 
        zIndex: 10000, 
        position: 'relative',
        isolation: 'isolate'
      }}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* زر الـ dropdown */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          !selectedOption ? 'text-gray-500' : 'text-gray-900'
        }`}
        style={{ 
          zIndex: 10001,
          isolation: 'isolate'
        }}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <div>
              <div className="font-medium">{selectedOption.name}</div>
              {(selectedOption.sector_name || selectedOption.classification_name) && (
                <div className="text-xs text-gray-500">
                  {selectedOption.sector_name || selectedOption.classification_name}
                </div>
              )}
            </div>
          ) : (
            placeholder
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedOption && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                e.nativeEvent.stopImmediatePropagation();
                handleClear();
              }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              style={{ 
                zIndex: 10004,
                isolation: 'isolate'
              }}
            >
              <FiX className="w-4 h-4" />
            </div>
          )}
          <FiChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            style={{ 
              zIndex: 10004,
              isolation: 'isolate'
            }}
          />
        </div>
      </button>

      {/* قائمة الخيارات — تُعرض عبر Portal لتجنب القص داخل النوافذ المنبثقة */}
      {isOpen && position && typeof document !== 'undefined' && createPortal(
        <div
          ref={portalRef}
          className="bg-white border border-gray-300 rounded-md shadow-lg"
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 99999,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          }}
          onClick={handleDropdownClick}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            e.preventDefault();
            e.nativeEvent.stopImmediatePropagation();
          }}
        >
          {/* حقل البحث */}
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onFocus={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              />
            </div>
          </div>

          {/* قائمة الخيارات المفلترة */}
          <div
            className="overflow-y-auto max-h-[250px]"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              e.nativeEvent.stopImmediatePropagation();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              e.preventDefault();
              e.nativeEvent.stopImmediatePropagation();
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-gray-500 text-center text-sm">
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد خيارات متاحة'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={(e) => handleOptionClickWithEvent(e, option.id)}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  className={`p-1.5 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors min-h-[2rem] flex items-center ${
                    value === option.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-xs">{option.name}</div>
                    </div>
                    {value === option.id && (
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0 ml-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
