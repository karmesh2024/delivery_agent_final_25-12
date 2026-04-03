import { redirect } from 'next/navigation';

/** إعادة توجيه إلى المصدر الموحد إدارة الفئات والمنتجات */
export default async function WasteBasketConfigRedirect({
  params,
}: {
  params: Promise<{ subcategoryId: string }>;
}) {
  const { subcategoryId } = await params;
  redirect(`/product-categories/basket-config/${subcategoryId}`);
}
