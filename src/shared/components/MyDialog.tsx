"use client";

import React, { useId } from 'react';
import {
  Dialog as RadixDialog,
  DialogPortal as RadixDialogPortal,
  DialogOverlay as RadixDialogOverlay,
  DialogContent as RadixDialogContent,
  DialogTitle as RadixDialogTitle,
  DialogDescription as RadixDialogDescription,
  DialogTrigger as RadixDialogTrigger,
  DialogClose as RadixDialogClose,
  DialogHeader as RadixDialogHeader,
  DialogFooter as RadixDialogFooter
} from "@/shared/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from "@/lib/utils";

// النوع للمكون الجديد
interface MyDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  showTitle?: boolean; // إذا كنت تريد التحكم في إظهار العنوان
  overlayClassName?: string; // Optional class for overlay
}

// مكون الحوار الرئيسي
export function MyDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "3xl",
  className = "",
  showTitle = true,
  overlayClassName = ""
}: MyDialogProps) {
  console.log("MyDialog rendering with open:", open);
  
  const uniqueId = useId();
  const titleId = `dialog-title-${uniqueId}`;
  const descriptionId = description ? `dialog-description-${uniqueId}` : undefined;
   
  const getMaxWidthClass = () => {
    const sizes = {
      "sm": "max-w-sm", "md": "max-w-md", "lg": "max-w-lg", "xl": "max-w-xl",
      "2xl": "max-w-2xl", "3xl": "max-w-3xl", "4xl": "max-w-4xl", "5xl": "max-w-5xl",
      "6xl": "max-w-6xl", "7xl": "max-w-7xl",
    };
    return sizes[maxWidth as keyof typeof sizes] || sizes["3xl"];
  };

  // Define Title component, wrap with VisuallyHidden if showTitle is false
  const RenderedTitle = !showTitle ? (
    <VisuallyHidden asChild>
      <RadixDialogTitle id={titleId}>{title}</RadixDialogTitle>
    </VisuallyHidden>
  ) : (
    <RadixDialogTitle id={titleId}>{title}</RadixDialogTitle>
  );

  // Define Description component conditionally, wrap with VisuallyHidden if showTitle is false
  const RenderedDescription = description ? (
    !showTitle ? (
      <VisuallyHidden asChild>
        <RadixDialogDescription id={descriptionId}>{description}</RadixDialogDescription>
      </VisuallyHidden>
    ) : (
      <RadixDialogDescription id={descriptionId}>{description}</RadixDialogDescription>
    )
  ) : null;

  return (
    <RadixDialog open={open} onOpenChange={onOpenChange}>
      <RadixDialogPortal>
        <RadixDialogOverlay className={cn(overlayClassName)} />
        <RadixDialogContent 
          className={cn(getMaxWidthClass(), className)}
          aria-labelledby={titleId} 
          // Explicitly pass undefined if descriptionId doesn't exist
          aria-describedby={descriptionId ? descriptionId : undefined}
        >
          {/* Always render Title and Description components */} 
          {RenderedTitle}
          {RenderedDescription}
          
          {/* Main content */}
          <div className="py-4">
            {children}
          </div>
        </RadixDialogContent>
      </RadixDialogPortal>
    </RadixDialog>
  );
}

// مكونات إضافية للاستخدام المباشر
export const MyDialogTrigger = RadixDialogTrigger;
export const MyDialogClose = RadixDialogClose;
export const MyDialogFooter = RadixDialogFooter;

// لتسهيل استخدام الحوار الكامل مع كل مكوناته
export const MyDialogRoot = MyDialog;

// إضافة تصدير افتراضي
export default MyDialog;