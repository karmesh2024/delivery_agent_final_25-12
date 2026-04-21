// src/domains/zoon-os/routing/intent-guard.ts
// الطبقة الأولى: حارس النوايا السريع (Fast Intent Guard)
// مهمته: تصفية الأدوات المتاحة بناءً على إشارات لغوية قوية لمنع تشتت الموديل.

import { ToolDefinition } from '../tools/tool-registry';

/**
 * تطبيق نظام الحماية والفلترة السريعة
 */
export function applyFastGuards(
  message: string,
  availableTools: Record<string, any>,
  toolDefs: ToolDefinition[]
): Record<string, any> {
  
  const msg = message.toLowerCase();
  const result = { ...availableTools };
  
  // 1. اكتشاف طلبات الصور الصريحة (إشارة قوية جداً)
  const isImageRequest = /صور|صوره|صورة|أرني|ارني|وريني|هات صور|جيب صور|image|photo|picture|show me|display/i.test(msg);
  
  if (isImageRequest) {
    // إذا طلب صور، ابحث عن الأدوات التي طلبت حجبها (block_when)
    const imageTool = toolDefs.find(t => t.name === 'google_image_search' || t.name === 'image_search');
    
    if (imageTool?.block_when) {
      for (const blockedName of imageTool.block_when) {
        if (result[blockedName]) {
          delete result[blockedName];
          console.log(`[IntentGuard] Blocked tool ${blockedName} because image request was detected.`);
        }
      }
    }
  }

  // 2. اكتشاف طلبات الذاكرة (من هو / بناتي / عائلتي)
  const isIdentityRequest = /مين|من هو|بناتي|أهلي|عائلتي|ولادي|identity|who|family/.test(msg);
  if (isIdentityRequest) {
      // هنا يمكننا إضافة فلاتر إضافية مستقبلاً
  }

  return result;
}
