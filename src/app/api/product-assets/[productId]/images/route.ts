import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// استخدم مفتاح دور الخدمة لعمليات الخادم لضمان الأذونات الكافية
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

// تأكد من وجود بيانات الاعتماد
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase credentials (URL or Service Role Key)');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false, // لا نحتاج إلى استمرارية الجلسة في API route
  },
});

export async function POST(req: Request, { params }: { params: { productId: string } }) {
  console.log('Received request for image upload:', req.url);
  // تأكد من انتظار params إذا كان يتم التعامل معه بشكل غير متزامن
  const { productId } = await params; // Correctly await params

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const alt_text_ar = formData.get('alt_text_ar') as string || null;
    const alt_text_en = formData.get('alt_text_en') as string || null;
    const is_primary = formData.get('is_primary') === 'true';
    const sort_order = parseInt(formData.get('sort_order') as string) || 0;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is missing' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${productId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images') // استخدام اسم الباكت الذي أنشأته
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    // حفظ بيانات الصورة في قاعدة البيانات
    const { data: imageData, error: dbError } = await supabase
      .from('store_product_images')
      .insert({
        product_id: productId,
        image_url: imageUrl,
        alt_text_ar: alt_text_ar,
        alt_text_en: alt_text_en,
        is_primary: is_primary,
        sort_order: sort_order,
      })
      .select();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Product image uploaded and saved successfully',
      imageUrl: imageUrl,
      imageData: imageData[0],
    }, { status: 200 });

  } catch (error) {
    console.error('General error during image upload:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 