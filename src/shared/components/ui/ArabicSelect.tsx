'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface ArabicSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ArabicSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = 'اختر...', 
  className = '' 
}: ArabicSelectProps) {
  return (
    <Select 
      dir="rtl"
      value={value} 
      onValueChange={onChange}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent 
        position="popper"
        sideOffset={5}
        className="z-[9999999]"
        style={{ direction: 'rtl' }}
      >
        {options.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
        {options.length === 0 && (
          <div className="px-3 py-2 text-sm text-gray-500 text-center">
            لا توجد خيارات متاحة
          </div>
        )}
      </SelectContent>
    </Select>
  );
} 