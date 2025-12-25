import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeFormatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0.00 ج.م'
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return '0.00 ج.م'
  }
  
  return `${numAmount.toFixed(2)} ج.م`
}

export function generateSlug(name: string): string {
  if (!name) return ''
  // Normalize, remove diacritics, keep letters/numbers from any language, collapse hyphens
  return name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^-\p{L}\p{N}]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}