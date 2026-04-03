import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { advancedPsychologicalEngine } from './zoonAdvancedPsychologicalEngine.service';

/**
 * 🧠 ZOON CONTENT ORCHESTRATOR SERVICE
 * المسؤول عن دورة حياة المحتوى الآلي من جلب الأخبار وحتى الجدولة والنشر.
 */

export interface GenerationJob {
  id: string;
  circle_id: string;
  status: 'running' | 'completed' | 'failed';
  posts_generated?: number;
  error_message?: string;
  created_at: string;
}

export interface ContentSettings {
  circle_id: string;
  room_policy: string;
  active_goal: string;
  publish_mode: 'manual' | 'auto_fallback' | 'auto';
  fallback_hours: number;
  active_preset_name: string;
  presets: Record<string, Record<string, number>>;
  search_keywords?: string[];
  content_style?: string;
}

class ZoonContentOrchestrator {
  private supabase = createClientComponentClient();

  /**
   * 🏗️ عملية التأسيس أو التوليد الدوري لغرفة معينة
   */
  async runGenerationForCircle(circleId: string, selectedNews?: any) {
    let jobId: string | null = null;
    
    try {
      // 1. إنشاء مهمة جديدة في القاعدة لتتبع التنفيذ
      const { data: job, error: jobErr } = await this.supabase
        .from('content_generation_jobs')
        .insert({ circle_id: circleId, status: 'running' })
        .select()
        .single();
      
      if (jobErr) throw jobErr;
      jobId = job.id;

      // 2. جلب إعدادات الغرفة وسياساتها
      const { data: settings, error: settingsErr } = await this.supabase
        .from('circle_content_settings')
        .select('*')
        .eq('circle_id', circleId)
        .single();

      if (settingsErr) throw new Error('Settings not found for this circle');

      // 3. استخدام الخبر المحدد من الأدمن أو جلب أخبار افتراضية
      const newsItem = selectedNews || (await this.fetchLocalNews())[0] || null;
      
      // 4. تحديد أنواع المحتوى المطلوب توليدها بناءً على الـ Preset
      const contentMix = settings.presets?.[settings.active_preset_name] || { تحفيزي: 100 };
      const postsToGenerate = this.calculatePostTypes(contentMix, 3);

      // 5. التوليد عبر Gemini لكل منشور
      let generatedCount = 0;
      for (const postType of postsToGenerate) {
        const result = await this.generatePostViaGemini(settings, postType, newsItem);
        
        // 6. الحفظ في الطابور للحصول على موافقة الأدمن
        await this.saveToQueue(circleId, result, settings);
        generatedCount++;
      }

      // 7. تحديث المهمة بالنجاح
      await this.supabase
        .from('content_generation_jobs')
        .update({ status: 'completed', posts_generated: generatedCount, news_fetched_at: new Date() })
        .eq('id', jobId);

      return { success: true, postsGenerated: generatedCount };

    } catch (error: any) {
      console.error('❌ Generation Job Failed:', error);
      if (jobId) {
        await this.supabase
          .from('content_generation_jobs')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', jobId);
      }
      throw error;
    }
  }

  /**
   * 📰 جلب الأخبار الافتراضية (بديل عند عدم اختيار خبر)
   */
  private async fetchLocalNews() {
    return [
      {
        title: "تطورات حي محرم بك",
        description: "أحدث أخبار ومستجدات منطقة محرم بك في الإسكندرية.",
        url: "https://example.com/news/1"
      }
    ];
  }

  /**
   * 📊 حساب أنواع المنشورات بناءً على النسب المئوية
   */
  private calculatePostTypes(mix: Record<string, number>, count: number): string[] {
    const types: string[] = [];
    const entries = Object.entries(mix);
    
    entries.sort((a, b) => b[1] - a[1]);
    for (let i = 0; i < count; i++) {
      types.push(entries[i % entries.length][0]);
    }
    return types;
  }

  /**
   * 🤖 بناء الـ Hierarchical Prompt واستدعاء Gemini
   */
  private async generatePostViaGemini(settings: ContentSettings, type: string, news: any) {
    const contentStyle = settings.content_style || 'motivational';
    
    const styleGuides: Record<string, string> = {
      motivational: 'تحفيزي وملهم، يحرك المشاعر ويدفع للعمل الإيجابي',
      informative: 'إخباري وتوعوي، يقدم معلومات مفيدة وموثوقة',
      story: 'قصصي وإنساني، يحكي قصصاً من الواقع',
      question: 'تفاعلي بالأسئلة، يفتح نقاشاً مجتمعياً',
      mix: 'خليط ذكي بين الأساليب المختلفة'
    };

    const prompt = `
      أنت "مايسترو المحتوى" لنادي زوون في منطقة محرم بك بالإسكندرية.
      
      [LAYER 1: SYSTEM IDENTITY]
      الهوية: دافئ، سكندري أصيل، مجتمعي، فخور بالتراث.
      
      [LAYER 2: ROOM POLICY]
      سياسة الغرفة: ${settings.room_policy || 'غرفة مجتمعية عامة'}
      
      [LAYER 3: WEEKLY GOAL]
      هدف الأسبوع: ${settings.active_goal || 'تعزيز التفاعل المجتمعي'}
      
      [LAYER 4: CONTENT TYPE]
      نوع المنشور: ${type}
      أسلوب الكتابة: ${styleGuides[contentStyle] || styleGuides.motivational}
      
      [CONTEXT: NEWS]
      الخبر المتاح: ${news ? news.title : 'لا يوجد خبر، ركز على هدف الأسبوع'}
      التفاصيل: ${news ? (news.description || news.reason || '') : ''}
      الزاوية المقترحة: ${news?.suggested_angle || ''}

      المطلوب:
      - اكتب منشوراً جذاباً (100-150 كلمة).
      - لهجة سكندرية طبيعية.
      - استخدم 2-3 Emojis فقط.
      - انهِ بسؤال مفتوح يحفز التعليق.
      
      أجب بـ JSON فقط:
      {
        "content": "نص المنشور",
        "post_type": "${type}",
        "target_goal": "${settings.active_goal || ''}",
        "psychological_analysis": {
          "sentiment": "positive",
          "triggers": ["belonging"],
          "emotions": ["فخر"]
        },
        "image_prompt": "English description for AI image"
      }
    `;

    const response = await advancedPsychologicalEngine.generateTextWithGemini(prompt);
    
    // تنظيف الـ JSON
    const cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleanResponse);
  }

  /**
   * 💾 حفظ المنشور المولد في الطابور للموافقة
   */
  private async saveToQueue(circleId: string, result: any, settings: ContentSettings) {
    const scheduledFor = settings.publish_mode === 'auto_fallback' 
      ? new Date(Date.now() + settings.fallback_hours * 60 * 60 * 1000)
      : null;

    return await this.supabase
      .from('zoon_posts_queue')
      .insert({
        circle_id: circleId,
        content: result.content,
        post_type: result.post_type,
        target_goal: result.target_goal,
        psychological_analysis: result.psychological_analysis,
        generation_prompt: result.image_prompt,
        scheduled_for: scheduledFor,
        status: 'draft'
      });
  }
}

export const zoonContentOrchestrator = new ZoonContentOrchestrator();
