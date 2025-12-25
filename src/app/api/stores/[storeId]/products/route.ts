import { NextResponse } from 'next/server';
import { addProduct } from '@/domains/products/services/productService';

// دالة مساعدة لتحويل BigInt إلى string
const serializeBigInt = (value: any): any => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(serializeBigInt);
  }
  if (typeof value === 'object') {
    const serialized: any = {};
    for (const [key, val] of Object.entries(value)) {
      serialized[key] = serializeBigInt(val);
    }
    return serialized;
  }
  return value;
};

export async function POST(req: Request) {
  try {
    const productData = await req.json();
    console.log('[Product API] Received product data:', productData);
    const newProduct = await addProduct(productData); // حفظ المنتج في قاعدة البيانات
    console.log('[Product API] Product created, response:', newProduct);
    
    // تحويل BigInt إلى string قبل إرجاع JSON
    const serializedProduct = serializeBigInt(newProduct);
    
    return NextResponse.json(serializedProduct, { status: 201 });
  } catch (error) {
    console.error('API Error creating product:', error);
    return NextResponse.json({ message: 'Failed to create product', error: (error as Error).message }, { status: 500 });
  }
} 