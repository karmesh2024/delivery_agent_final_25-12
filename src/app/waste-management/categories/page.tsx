import { redirect } from 'next/navigation';

/**
 * إدارة الفئات والمنتجات مصدر واحد من /product-categories.
 * إعادة توجيه تلقائي من مسار المخلفات للمحافظة على الروابط القديمة.
 */
export default function WasteCategoriesRedirect() {
  redirect('/product-categories');
}
