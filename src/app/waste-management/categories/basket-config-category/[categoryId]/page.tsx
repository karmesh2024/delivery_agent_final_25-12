import { redirect } from 'next/navigation';

/** إعادة توجيه إلى المصدر الموحد إدارة الفئات والمنتجات */
export default async function WasteBasketConfigCategoryRedirect({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  redirect(`/product-categories/basket-config-category/${categoryId}`);
}
