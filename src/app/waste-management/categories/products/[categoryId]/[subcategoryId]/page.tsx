import { redirect } from 'next/navigation';

/** إعادة توجيه إلى المصدر الموحد إدارة الفئات والمنتجات */
export default async function WasteProductsRedirect({
  params,
}: {
  params: Promise<{ categoryId: string; subcategoryId: string }>;
}) {
  const { categoryId, subcategoryId } = await params;
  redirect(`/product-categories/products/${categoryId}/${subcategoryId}`);
}
