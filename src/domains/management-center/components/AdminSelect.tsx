import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';

interface Admin {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AdminSelectProps {
  admins: Admin[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const AdminSelect: React.FC<AdminSelectProps> = ({
  admins,
  value,
  onChange,
  placeholder = "اختر مسؤولاً",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mouseup', handleClickOutside);
    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
    };
  }, []);

  const selectedAdmin = admins.find((admin) => admin.id === value);

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (admin.role && admin.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOptionClick = (adminId: string) => {
    onChange(adminId);
    setIsOpen(false);
    setSearchQuery(""); // Clear search on selection
  };

  return (
    <div ref={selectRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedAdmin ? selectedAdmin.name : placeholder}
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
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-[9999999] mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg max-h-60 overflow-y-auto overflow-x-hidden"
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            width: selectRef.current?.clientWidth,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-1">
            <Input
              placeholder="بحث بالاسم، البريد الإلكتروني أو الدور..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2 text-black"
            />
          </div>
          <ul
            className="py-1"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {filteredAdmins.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">
                لا يوجد مسؤولون مطابقون
              </li>
            ) : (
              filteredAdmins.map((admin) => (
                <li
                  key={admin.id}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${admin.id === value ? 'bg-gray-50 font-medium' : ''} text-black`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleOptionClick(admin.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col">
                    <span>{admin.name}</span>
                    <span className="text-xs text-gray-500">البريد الإلكتروني: {admin.email}</span>
                    {admin.role && <span className="text-xs text-gray-500">الدور: {admin.role}</span>}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
