-- ═══════════════════════════════════════════════════════════════
-- Behavioral Intelligence Engine V2.2.3 - Production Schema (MASTER FIX)
-- ═══════════════════════════════════════════════════════════════

-- 1. الأساسيات
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. جداول القوالب
CREATE TABLE IF NOT EXISTS content_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name JSONB NOT NULL,
    icon VARCHAR(10),
    intellectual_pct INTEGER NOT NULL DEFAULT 33,
    social_pct INTEGER NOT NULL DEFAULT 33,
    values_pct INTEGER NOT NULL DEFAULT 34,
    description JSONB,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. تحديث جدول المنشورات (الإصلاح الحرج)
DO $$ 
BEGIN 
    -- إضافة الأعمدة النفسية
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zoon_posts' AND column_name='intellectual_pct') THEN
        ALTER TABLE zoon_posts ADD COLUMN intellectual_pct INTEGER DEFAULT 33;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zoon_posts' AND column_name='social_pct') THEN
        ALTER TABLE zoon_posts ADD COLUMN social_pct INTEGER DEFAULT 33;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zoon_posts' AND column_name='values_pct') THEN
        ALTER TABLE zoon_posts ADD COLUMN values_pct INTEGER DEFAULT 34;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zoon_posts' AND column_name='ranking_score') THEN
        ALTER TABLE zoon_posts ADD COLUMN ranking_score INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zoon_posts' AND column_name='template_id') THEN
        ALTER TABLE zoon_posts ADD COLUMN template_id UUID REFERENCES content_templates(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zoon_posts' AND column_name='classification_source') THEN
        ALTER TABLE zoon_posts ADD COLUMN classification_source VARCHAR(50) DEFAULT 'system_neutral';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zoon_posts' AND column_name='confidence_level') THEN
        ALTER TABLE zoon_posts ADD COLUMN confidence_level VARCHAR(20) DEFAULT 'low';
    END IF;
END $$;

-- 4. تحديث جدول التفاعلات (Bazzzz Types)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zoon_bazzzz_types' AND column_name='psychological_impact') THEN
        ALTER TABLE zoon_bazzzz_types ADD COLUMN psychological_impact JSONB DEFAULT '{"openness": 0, "conscientiousness": 0, "extraversion": 0, "agreeableness": 0, "neuroticism": 0}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zoon_bazzzz_types' AND column_name='is_primary') THEN
        ALTER TABLE zoon_bazzzz_types ADD COLUMN is_primary BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zoon_bazzzz_types' AND column_name='allows_comment') THEN
        ALTER TABLE zoon_bazzzz_types ADD COLUMN allows_comment BOOLEAN DEFAULT true;
    END IF;
    -- ضمان وجود القيد الفريد للاسم
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zoon_bazzzz_types_name_en_key') THEN
        ALTER TABLE zoon_bazzzz_types ADD CONSTRAINT zoon_bazzzz_types_name_en_key UNIQUE (name_en);
    END IF;
END $$;

-- 5. تحديث جدول التعليقات ليربط مع Bazzzz
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zoon_post_comments' AND column_name='bazzzz_type_id') THEN
        ALTER TABLE zoon_post_comments ADD COLUMN bazzzz_type_id UUID REFERENCES zoon_bazzzz_types(id);
    END IF;
END $$;

-- 6. جدول الملفات النفسية
CREATE TABLE IF NOT EXISTS user_psychological_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    openness DECIMAL(5,2) DEFAULT 50.00,
    conscientiousness DECIMAL(5,2) DEFAULT 50.00,
    extraversion DECIMAL(5,2) DEFAULT 50.00,
    agreeableness DECIMAL(5,2) DEFAULT 50.00,
    neuroticism DECIMAL(5,2) DEFAULT 50.00,
    total_interactions INTEGER DEFAULT 0,
    profile_completeness DECIMAL(3,2) DEFAULT 0.00,
    opted_out BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. تريجر تحديث الترتيب (Ranking System)
CREATE OR REPLACE FUNCTION update_post_ranking_score()
RETURNS TRIGGER AS $$
DECLARE
    v_post_id UUID;
BEGIN
    v_post_id := COALESCE(NEW.post_id, OLD.post_id);
    UPDATE zoon_posts SET ranking_score = (
        SELECT COALESCE(SUM(bt.points_given), 0)
        FROM zoon_post_interactions pi
        JOIN zoon_bazzzz_types bt ON pi.bazzzz_type_id = bt.id
        WHERE pi.post_id = v_post_id
    ) + (
        SELECT COALESCE(SUM(bt.points_given), 0)
        FROM zoon_post_comments pc
        JOIN zoon_bazzzz_types bt ON pc.bazzzz_type_id = bt.id
        WHERE pc.post_id = v_post_id
    )
    WHERE id = v_post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rank_interactions ON zoon_post_interactions;
CREATE TRIGGER trg_rank_interactions AFTER INSERT OR UPDATE OR DELETE ON zoon_post_interactions FOR EACH ROW EXECUTE FUNCTION update_post_ranking_score();

DROP TRIGGER IF EXISTS trg_rank_comments ON zoon_post_comments;
CREATE TRIGGER trg_rank_comments AFTER INSERT OR UPDATE OR DELETE ON zoon_post_comments FOR EACH ROW EXECUTE FUNCTION update_post_ranking_score();
