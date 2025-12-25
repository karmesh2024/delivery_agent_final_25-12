import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { agentId, imageUrl } = await request.json();

  if (!agentId || !imageUrl) {
    return NextResponse.json(
      { error: 'agentId and imageUrl are required.' },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Supabase configuration is missing.' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Update delivery_boys table
    const { error: deliveryBoysError } = await supabase
      .from('delivery_boys')
      .update({ profile_image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', agentId);

    if (deliveryBoysError) {
      console.error('Error updating delivery_boys profile_image_url:', deliveryBoysError);
      // يمكنك اختيار عدم إرجاع الخطأ مباشرة إذا كان تحديث الجدول الآخر أكثر أهمية
      // أو إذا كنت تريد محاولة تحديث الجدول الآخر حتى لو فشل هذا
    }

    // Update new_profiles_delivery table
    // تأكد من أن اسم العمود profile_image_url صحيح لهذا الجدول
    const { error: newProfilesError } = await supabase
      .from('new_profiles_delivery')
      .update({ profile_image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', agentId); // نفترض أن id هنا هو user_id أو agentId

    if (newProfilesError) {
      console.error('Error updating new_profiles_delivery profile_image_url:', newProfilesError);
      // إذا فشل هذا أيضًا، فربما يكون من المناسب إرجاع خطأ عام
      if (deliveryBoysError) { // إذا فشل الأول أيضًا
        return NextResponse.json(
          { error: 'Failed to update profile image in both tables.', details: {deliveryBoysError, newProfilesError} },
          { status: 500 }
        );
      }
      // إذا فشل هذا فقط
      return NextResponse.json(
        { error: 'Failed to update profile image in new_profiles_delivery.', details: newProfilesError },
        { status: 500 }
      );
    }
    
    if (deliveryBoysError && !newProfilesError){ // إذا فشل الأول ونجح الثاني
        return NextResponse.json(
            { error: 'Failed to update profile image in delivery_boys but succeeded in new_profiles_delivery.', details: deliveryBoysError },
            { status: 500 } // أو 207 Multi-Status إذا أردت
        );
    }


    return NextResponse.json({ success: true, message: 'Profile image URL updated successfully.' });

  } catch (error) {
    console.error('Unexpected error updating profile image URL:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.', details: error },
      { status: 500 }
    );
  }
} 