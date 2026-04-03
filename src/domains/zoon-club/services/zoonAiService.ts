import { supabase } from '@/lib/supabase';
import { zoonCirclesService } from './zoonCirclesService';

export interface AiSettings {
    assistant_name: string;
    personality_type: 'LOGICAL' | 'EMPATHETIC' | 'CREATIVE' | 'BALANCED';
    custom_instructions?: string;
}

export const zoonAiService = {
    /**
     * جلب إعدادات المساعد
     */
    getSettings: async (circleId: string): Promise<AiSettings> => {
        const { data, error } = await supabase!
            .from('zoon_circle_ai_settings')
            .select('*')
            .eq('circle_id', circleId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        // Default settings if not exists
        return data || {
            assistant_name: 'Zoon AI',
            personality_type: 'BALANCED'
        };
    },

    /**
     * تحديث الإعدادات
     */
    updateSettings: async (circleId: string, settings: Partial<AiSettings>) => {
        const { error } = await supabase!
            .from('zoon_circle_ai_settings')
            .upsert({ circle_id: circleId, ...settings });
        if (error) throw error;
    },

    /**
     * المحرك الرئيسي: سؤال المساعد الذكي
     */
    askAssistant: async (circleId: string, question: string) => {
        // 1. جلب سياق الدائرة (Context) الحقيقي
        const [members, settings, status] = await Promise.all([
            zoonCirclesService.getCircleMembers(circleId),
            zoonAiService.getSettings(circleId),
            zoonCirclesService.getCircleResourcesStatus(circleId)
        ]);

        const dataContext = {
            count: members.length,
            harmony: status.harmonyScore,
            archetypes: members.map(m => m.archetype).filter(Boolean),
            personality: settings.personality_type,
            instructions: settings.custom_instructions
        };

        // 3. توليد رد ذكي بناءً على البيانات الحقيقية
        return zoonAiService.generateSmartResponse(question, dataContext);
    },

    generateSmartResponse: (text: string, ctx: any) => {
        const q = text.toLowerCase();
        
        // الرد على سؤال العدد
        if (q.includes('كم') || q.includes('عدد') || q.includes('أعضاء') || q.includes('اعضاء')) {
            return `تضم هذه الدائرة حالياً ${ctx.count} أعضاء نشطين. مستوى التناغم بينهم يصل إلى ${ctx.harmony}%، وهو ما يعكس ترابطاً قوياً جداً.`;
        }

        // الرد على سؤال التحليل
        if (q.includes('تحليل') || q.includes('من هم') || q.includes('أنماط')) {
            const uniqueTypes = [...new Set(ctx.archetypes)];
            return `بناءً على تحليلي النفسي للأعضاء، لدينا مزيج من الأنماط: (${uniqueTypes.join('، ')}). هذا التنوع هو سر وصولنا لنسبة ${ctx.harmony}% في التناغم.`;
        }

        // الرد على سؤال التطوير
        if (q.includes('كيف') || q.includes('تطور') || q.includes('تحسين')) {
            if (ctx.harmony >= 90) return "الدائرة في قمة نضجها! أنصح بالبدء بمشاريع مشتركة معقدة أو فتح 'دائرة Copy' لتوريث الخبرات لآخرين.";
            return `لرفع التناغم من ${ctx.harmony}%، نحتاج لجلسات تقارب تركز على نمط '${ctx.archetypes[0] || 'المستكشف'}' الموجود لدينا بكثرة.`;
        }

        if (q.includes('شكرا') || q.includes('شكر')) {
            return "العفو! أنا هنا دائماً لخدمة وعي الدائرة. هل هناك شيء آخر تود معرفته؟";
        }

        return `بصفتي مساعدك بذكاء ${ctx.personality}، أرى أن دائرتنا (التي يبلغ تعدادها ${ctx.count} أعضاء) تسير في الطريق الصحيح. سؤالي لك: ما هو هدفك القادم معنا؟`;
    }
};
