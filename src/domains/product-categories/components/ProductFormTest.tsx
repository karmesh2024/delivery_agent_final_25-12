'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { UniversalDialog } from '@/shared/ui/universal-dialog';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';

export function ProductFormTest() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <div className="p-4">
      <Button onClick={handleOpen}>فتح نافذة اختبار</Button>

      {isOpen && (
        <UniversalDialog
          isOpen={isOpen}
          onClose={handleClose}
          title="اختبار النافذة المنبثقة"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test">حقل اختبار</Label>
              <Input id="test" name="test" />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button onClick={handleClose} variant="outline">إلغاء</Button>
              <Button onClick={handleClose}>موافق</Button>
            </div>
          </div>
        </UniversalDialog>
      )}
    </div>
  );
} 