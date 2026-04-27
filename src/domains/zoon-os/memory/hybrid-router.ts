const KEYWORD_MAP: Record<string, { wing: string; room: string }> = {
  'أرباح': { wing: 'ADMIN', room: 'FINANCE' },
  'صرف': { wing: 'ADMIN', room: 'FINANCE' },
  'تكلفة': { wing: 'ADMIN', room: 'FINANCE' },
  'راتب': { wing: 'ADMIN', room: 'FINANCE' },
  'مخزن': { wing: 'WAREHOUSE', room: 'INVENTORY' },
  'منتج': { wing: 'WAREHOUSE', room: 'INVENTORY' },
  'مورد': { wing: 'WAREHOUSE', room: 'SUPPLIERS' },
  'قرار': { wing: 'ADMIN', room: 'STRATEGY' },
  'اجتماع': { wing: 'ADMIN', room: 'STRATEGY' },
  'أحب': { wing: 'USER', room: 'PREFERENCES' },
  'أفضل': { wing: 'USER', room: 'PREFERENCES' },
};

export async function getTargetContext(query: string): Promise<{ wing: string; room: string }> {
  for (const [key, mapping] of Object.entries(KEYWORD_MAP)) {
    if (query.includes(key)) return mapping;
  }
  // افتراضي في حال عدم وجود كلمات مفتاحية
  return { wing: 'GENERAL', room: 'HISTORY' };
}
