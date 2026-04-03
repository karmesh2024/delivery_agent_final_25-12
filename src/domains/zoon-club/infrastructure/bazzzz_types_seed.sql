-- ═══════════════════════════════════════════════════════════════
-- Behavioral Intelligence Engine - Bazzzz Initial Data Seed (V2.0)
-- Version: 2.0 | Updated with Interaction vs Comment Logic
-- ═══════════════════════════════════════════════════════════════

-- ضمان وجود القيد الفريد لعملية الـ Upsert
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zoon_bazzzz_types_name_en_key') THEN
        ALTER TABLE zoon_bazzzz_types ADD CONSTRAINT zoon_bazzzz_types_name_en_key UNIQUE (name_en);
    END IF;
END $$;

INSERT INTO zoon_bazzzz_types (name_en, name_ar, icon, points_given, is_primary, allows_comment, psychological_impact)
VALUES
    -- الفئة 1: التفاعلات السريعة (Primary - تنقل المنشور لأعلى)
    ('Quick', 'سريع (Like)', '👍', 1, true, false, '{"openness": 0, "conscientiousness": 0, "extraversion": 1, "agreeableness": 2, "neuroticism": 0}'),
    ('Hot', 'نار (Hot)', '🔥', 5, true, false, '{"openness": 2, "conscientiousness": 0, "extraversion": 5, "agreeableness": 1, "neuroticism": -1}'),
    ('Diamond', 'ألماس (Diamond)', '💎', 15, true, false, '{"openness": 6, "conscientiousness": 7, "extraversion": 2, "agreeableness": 3, "neuroticism": -3}'),

    -- الفئة 2: تفاعلات التعليقات (Secondary - تظهر في قائمة "أضف تعليق")
    ('Love', 'حب', '❤️', 3, false, true, '{"openness": 0, "conscientiousness": 0, "extraversion": 3, "agreeableness": 5, "neuroticism": -2}'),
    ('Electric', 'صاعقة', '⚡', 5, false, true, '{"openness": 3, "conscientiousness": 0, "extraversion": 6, "agreeableness": 2, "neuroticism": -2}'),
    ('Rocket', 'صاروخ', '🚀', 8, false, true, '{"openness": 5, "conscientiousness": 4, "extraversion": 3, "agreeableness": 1, "neuroticism": -3}'),
    ('Mind Blown', 'مذهل', '🤯', 5, false, true, '{"openness": 8, "conscientiousness": 2, "extraversion": 0, "agreeableness": 1, "neuroticism": 0}'),
    ('Idea', 'فكرة', '💡', 10, false, true, '{"openness": 10, "conscientiousness": 5, "extraversion": 1, "agreeableness": 2, "neuroticism": -2}'),
    ('Target', 'هدف', '🎯', 7, false, true, '{"openness": 2, "conscientiousness": 8, "extraversion": 0, "agreeableness": 1, "neuroticism": -2}'),
    ('Helping Hand', 'مساعدة', '🤝', 5, false, true, '{"openness": 1, "conscientiousness": 3, "extraversion": 4, "agreeableness": 8, "neuroticism": -2}'),
    ('Thanks', 'شكراً', '🙏', 3, false, true, '{"openness": 0, "conscientiousness": 2, "extraversion": 2, "agreeableness": 6, "neuroticism": -1}'),
    ('Strength', 'قوة', '💪', 6, false, true, '{"openness": 1, "conscientiousness": 4, "extraversion": 5, "agreeableness": 5, "neuroticism": -4}'),
    ('LOL', 'ضحك', '😂', 2, false, true, '{"openness": 2, "conscientiousness": 0, "extraversion": 6, "agreeableness": 4, "neuroticism": -3}'),
    ('Celebration', 'احتفال', '🎉', 7, false, true, '{"openness": 2, "conscientiousness": 3, "extraversion": 8, "agreeableness": 6, "neuroticism": -4}'),
    ('Crown', 'تاج', '👑', 15, false, true, '{"openness": 5, "conscientiousness": 8, "extraversion": 6, "agreeableness": 3, "neuroticism": -5}'),
    ('Trophy', 'كأس', '🏆', 12, false, true, '{"openness": 3, "conscientiousness": 9, "extraversion": 4, "agreeableness": 2, "neuroticism": -4}'),
    ('Thinking', 'تفكير', '🤔', 4, false, true, '{"openness": 6, "conscientiousness": 5, "extraversion": -2, "agreeableness": 1, "neuroticism": 1}'),
    ('Book', 'كتاب', '📚', 6, false, true, '{"openness": 7, "conscientiousness": 6, "extraversion": -1, "agreeableness": 2, "neuroticism": 0}'),
    ('Sad', 'حزين', '😢', 2, false, true, '{"openness": 2, "conscientiousness": 0, "extraversion": 1, "agreeableness": 7, "neuroticism": 2}'),
    ('Angry', 'غاضب', '😡', 1, false, true, '{"openness": 0, "conscientiousness": 1, "extraversion": 2, "agreeableness": -5, "neuroticism": 5}')

ON CONFLICT (name_en) DO UPDATE 
SET psychological_impact = EXCLUDED.psychological_impact,
    points_given = EXCLUDED.points_given,
    icon = EXCLUDED.icon,
    name_ar = EXCLUDED.name_ar,
    is_primary = EXCLUDED.is_primary,
    allows_comment = EXCLUDED.allows_comment;

COMMENT ON TABLE zoon_bazzzz_types IS 'أنواع تفاعلات Bazzzz مع أوزانها النفسية وتصنيفها (أساسي للتفاعل vs ثانوي للتعليق)';
