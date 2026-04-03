export interface RouterResult {
  toolsToInclude: string[]; // أسماء الأدوات التي سيتم إرسالها للنموذج
  isSmallChat: boolean;     // هل هذه المحادثة عبارة عن سلام أو شكر لا يحتاج أدوات؟
}

/**
 * الكلمات المفتاحية للمحادثات العادية (Small Talk)
 */
const SMALL_TALK_KEYWORDS = [
  'اهلا', 'أهلا', 'مرحبا', 'السلام عليكم', 'شكر', 'شكرا', 'كيفك', 'عامل ايه', 'تمام', 'الحمدلله', 'صباح الخير', 'مساء الخير', 'هلا'
];


/**
 * دالة تطبيع النصوص العربية لضمان دقة البحث في الكلمات المفتاحية
 */
function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F]/g, '') // إزالة التشكيل
    .replace(/[أإآ]/g, 'ا')          // توحيد الألف
    .replace(/ة/g, 'ه')              // توحيد التاء المربوطة
    .replace(/ى/g, 'ي');             // توحيد الياء
}

/**
 * خريطة الكلمات المفتاحية لمحرّك البحث والمهارات السيادية (Zoon v2.1)
 * ملاحظة: تم استخدام underscore في أسماء الأدوات لضمان توافقها مع AI SDK
 */
const TOOLS_KEYWORDS_MAP: Record<string, string[]> = {
  'searchNews':    ['اخبار', 'خبر', 'عاجل'],
  'alexDialect':   ['اسكندريه', 'اسكندراني', 'بحري', 'محرم بك', 'لهجه'],
  'telegram':      ['تليجرام', 'ارسل', 'ابعث', 'رساله', 'المندوب', 'تلجرام'],
  'publishToRoom': ['الغرفه', 'غرفه', 'الاداره', 'انشر', 'تعميم', 'بلغ'],
  'getAgentSummary': ['ملخص', 'مبيعات', 'الطلبات', 'فلوس', 'تقرير', 'اليوم', 'الاوردرات', 'احصائيات'],
  'saveMemory':    ['تذكر', 'احفظ', 'معلومه', 'اسمي', 'انا', 'مهمه', 'ذكرني'],
  'financialManager': ['ارباح', 'ماليه', 'مالي', 'ربح', 'صافي', 'مستحقات', 'تصفيه', 'حساب', 'عموله'],
  
  // ✨ محركات البحث السيادية (Zoon Search v2.1) - تم توحيد الأسماء بـ underscore
  'web_search':     ['ابحث', 'بحث', 'جوجل', 'انترنت', 'معلومات', 'سعر', 'اسعار', 'ماهو', 'من هو'],
  'deep_research':  ['بحث عميق', 'دراسه', 'تقرير مفصل', 'تحليل', 'تعمق', 'ابحث بعمق'],
  'image_search':   ['صور', 'صوره', 'خلفيه', 'خلفيات'],
  'web_fetch':      ['رابط', 'موقع', 'لينك', 'صفحه', 'اقرا', 'محتوي'],
  'image_ocr':      ['حلل الصوره', 'ocr', 'قراءه الصوره', 'ماذا في الصوره', 'استخرج من الصوره', 'تحليل صوره']
};

/**
 * 🧭 الموجه الذكي (Auto Router)
 */
export function autoRouteRequest(
  recentMessage: string, 
  dynamicToolNames: string[]
): RouterResult {
  const msg = normalizeArabic(recentMessage);
  const wordsCount = msg.split(' ').length;
  const MAX_GLOBAL_TOOLS = 6; // زيادة العدد قليلاً للسماح بأدوات البحث

  // 1. اكتشاف طلبات معرفة القدرات
  if (msg.includes('الادوات المتاحه') || msg.includes('ماذا تستطيع') || msg.includes('قدراتك')) {
    return { 
      toolsToInclude: [...Object.keys(TOOLS_KEYWORDS_MAP), ...dynamicToolNames].slice(0, 10), 
      isSmallChat: false 
    };
  }

  // 2. اكتشاف المحادثات العابرة (التحية)
  const isGreeting = wordsCount <= 4 && SMALL_TALK_KEYWORDS.some(k => msg.includes(normalizeArabic(k)));
  if (isGreeting) {
    return { toolsToInclude: [], isSmallChat: true };
  }

  // 🧭 الموجه الذكي المحدث (Zoon v2.5)
  // 3. مطابقة الكلمات المفتاحية الأساسية
  const selectedTools = new Set<string>();
  
  // 🅰️ أولوية قصوى: إدراج كافة الأدوات الديناميكية (المهارات التي أنشأها المستخدم)
  // نحن ندرجها دائماً لأن المستخدم يتوقع توفر مهاراته الخاصة في كل محادثة
  dynamicToolNames.forEach(name => selectedTools.add(name));

  // 🅱️ إضافة الأدوات العالمية بناءً على الكلمات المفتاحية
  for (const [toolName, keywords] of Object.entries(TOOLS_KEYWORDS_MAP)) {
    if (keywords.some(k => msg.includes(normalizeArabic(k)))) {
      selectedTools.add(toolName);
    }
  }

  // 4. حالة الطوارئ (إذا لم نجد أي تطابق، نضمن وجود الأدوات الأساسية)
  if (selectedTools.size <= dynamicToolNames.length) {
    const ESSENTIAL_TOOLS = ['saveMemory', 'web_search', 'image_search'];
    ESSENTIAL_TOOLS.forEach(t => selectedTools.add(t));
  }

  const MAX_ALLOWED = 15; // رفع الحد للسماح بكافة المهارات
  const finalList = Array.from(selectedTools).slice(0, MAX_ALLOWED);
  return { toolsToInclude: finalList, isSmallChat: false };
}
