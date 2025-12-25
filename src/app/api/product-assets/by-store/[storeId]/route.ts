import { NextResponse } from 'next/server';
import { fetchProductsByStoreId, addProduct, updateProduct, deleteProduct } from '@/domains/products/services/productService';

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

export async function GET(request: Request, { params }: { params: { storeId: string } }) {
  try {
    const { storeId } = await params;
    const products = await fetchProductsByStoreId(storeId);
    
    // تحويل BigInt إلى string قبل إرجاع JSON
    const serializedProducts = products.map(serializeBigInt);
    
    return NextResponse.json(serializedProducts);
  } catch (error) {
    console.error('API Error fetching products:', error);
    return NextResponse.json({ message: 'Failed to fetch products', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const productData = await request.json();
    const newProduct = await addProduct(productData);
    
    // تحويل BigInt إلى string قبل إرجاع JSON
    const serializedProduct = serializeBigInt(newProduct);
    
    return NextResponse.json(serializedProduct, { status: 201 });
  } catch (error) {
    console.error('API Error adding product:', error);
    return NextResponse.json({ message: 'Failed to add product', error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const productData = await request.json();
    const updatedProduct = await updateProduct(productData);
    
    // تحويل BigInt إلى string قبل إرجاع JSON
    const serializedProduct = serializeBigInt(updatedProduct);
    
    return NextResponse.json(serializedProduct);
  } catch (error) {
    console.error('API Error updating product:', error);
    return NextResponse.json({ message: 'Failed to update product', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    if (!productId) {
      return NextResponse.json({ message: 'Product ID is required' }, { status: 400 });
    }
    await deleteProduct(productId);
    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('API Error deleting product:', error);
    return NextResponse.json({ message: 'Failed to delete product', error: (error as Error).message }, { status: 500 });
  }
} 