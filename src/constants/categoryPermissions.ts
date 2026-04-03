/**
 * رموز الصلاحيات الخاصة بتحرير الفئات والمنتجات (مخلفات).
 * من يملك أي صلاحية من هذه يمكنه الإضافة/التعديل/الحذف في:
 * - إدارة الفئات والمنتجات (/product-categories)
 * - إدارة المخلفات > الفئات والمنتجات (/waste-management/categories)
 *
 * منح الصلاحيات يتم من الإدارة العامة (الأدوار والصلاحيات).
 * - organization_structure:manage → التعديل من إدارة التنظيم والتسلسل (مصدر موصى به)
 * - waste_categories:edit → التعديل من وحدة إدارة المخلفات
 * - product_categories:edit → التعديل من إدارة الفئات والمنتجات
 */
export const CATEGORY_EDIT_PERMISSION_CODES = [
  'organization_structure:manage',
  'waste_categories:edit',
  'product_categories:edit',
] as const;

export type CategoryEditPermissionCode = (typeof CATEGORY_EDIT_PERMISSION_CODES)[number];
