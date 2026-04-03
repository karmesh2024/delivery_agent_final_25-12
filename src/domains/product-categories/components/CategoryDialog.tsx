"use client";

import React from "react";
import { CustomDialog } from "@/shared/ui/custom-dialog";
import { CategoryForm } from "@/domains/product-categories/components/CategoryForm";

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: string;
  title?: string;
  description?: React.ReactNode;
}

/**
 * Dialog مخصص لإضافة/تعديل الفئات (بديل لـ UniversalDialog العام).
 * الهدف: تجنب حقول "المخزن" الافتراضية في UniversalDialog العام عند استخدامه للفئات.
 */
export function CategoryDialog({
  isOpen,
  onClose,
  categoryId,
  title,
  description,
}: CategoryDialogProps) {
  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title ?? (categoryId ? "تعديل فئة" : "إضافة فئة جديدة")}
      description={description ?? "أدخل معلومات الفئة في النموذج أدناه."}
    >
      <CategoryForm categoryId={categoryId} isOpen={isOpen} onClose={onClose} />
    </CustomDialog>
  );
}

