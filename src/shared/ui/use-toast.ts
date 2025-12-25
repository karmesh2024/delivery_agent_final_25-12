"use client";

import { useState, useEffect } from "react";

interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      title: props.title,
      description: props.description,
      variant: props.variant || "default",
      duration: props.duration || 5000,
    };

    setToasts((currentToasts) => [...currentToasts, newToast]);

    return {
      id,
      dismiss: () => dismissToast(id),
    };
  };

  const dismissToast = (id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((currentToasts) => currentToasts.slice(1));
      }, toasts[0].duration);

      return () => clearTimeout(timer);
    }
  }, [toasts]);

  return {
    toast,
    toasts,
    dismissToast,
  };
}

// Simple implementation that can be used later to create a full toast component
export const toast = (props: ToastProps) => {
  // Display toast through a global event
  const event = new CustomEvent("toast", { detail: props });
  window.dispatchEvent(event);
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    dismiss: () => {},
  };
}; 