'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { FiPlus, FiUserPlus } from 'react-icons/fi';
import { PermissionsUserDialog } from '@/app/permissions/components/PermissionsUserDialog';
import CreateAdminForm from './CreateAdminForm';

interface AdminDialogButtonProps {
  onSuccess?: () => void;
  buttonText?: string;
  icon?: React.ReactNode;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export function AdminDialogButton({
  onSuccess,
  buttonText = 'إضافة مسؤول جديد',
  icon = <FiUserPlus className="mr-1" />,
  buttonVariant = 'default'
}: AdminDialogButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleClose = () => {
    setIsOpen(false);
  };
  
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    setIsOpen(false);
  };
  
  return (
    <>
      <Button 
        variant={buttonVariant}
        onClick={() => setIsOpen(true)}
        className="flex items-center"
      >
        {icon}
        {buttonText}
      </Button>
      
      {isOpen && (
        <PermissionsUserDialog
          isOpen={isOpen}
          onClose={handleClose}
          title="إضافة مسؤول جديد"
          maxWidth="32rem"
        >
          <CreateAdminForm 
            onClose={handleClose} 
            onSuccess={handleSuccess}
            inDialog={true}
          />
        </PermissionsUserDialog>
      )}
    </>
  );
} 