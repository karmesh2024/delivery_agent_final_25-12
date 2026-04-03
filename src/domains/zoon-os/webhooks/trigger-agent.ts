export async function triggerZoonAgent(
  userId: string, 
  prompt: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${appUrl}/api/zoon`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // 'x-internal-key': process.env.INTERNAL_API_KEY! // يُفضل إضافة حماية لاحقاً
      },
      body: JSON.stringify({
        userId,
        messages: [{ role: 'user', content: prompt }],
        isBackground: true  // علامة: لا يحتاج stream للواجهة
      })
    });
    
    if (!response.ok) {
      console.error('[triggerZoonAgent] ❌ فشل الاتصال بوكيل Zoon:', await response.text());
    } else {
      console.info('[triggerZoonAgent] ✅ تم استدعاء وكيل Zoon بنجاح في الخلفية');
    }
  } catch (error) {
    console.error('[triggerZoonAgent] ❌ حدث خطأ أثناء استدعاء وكيل Zoon:', error);
  }
}
