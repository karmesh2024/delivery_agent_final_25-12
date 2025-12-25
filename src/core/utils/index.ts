import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * دالة مساعدة لدمج أصناف Tailwind CSS
 * تستخدم مكتبتي clsx و tailwind-merge لإنشاء سلسلة أصناف مع تجنب تعارضات الأنماط
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}