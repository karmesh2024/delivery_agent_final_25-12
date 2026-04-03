-- 1. جدول الدوائر (Zoon Circles)
CREATE TABLE IF NOT EXISTS zoon_circles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT CHECK (type IN ('PERSONAL', 'BUSINESS', 'FRIENDS', 'INTEREST', 'FAMILY')),
  color           TEXT DEFAULT '#3b82f6',
  icon            TEXT DEFAULT '⭕',
  description     TEXT,
  is_public       BOOLEAN DEFAULT FALSE,
  position_x      FLOAT DEFAULT 0, -- لمواقع الدوائر في المساحة اللانهائية
  position_y      FLOAT DEFAULT 0,
  scale           FLOAT DEFAULT 1.0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول أعضاء الدوائر (Zoon Circle Members)
CREATE TABLE IF NOT EXISTS zoon_circle_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id       UUID REFERENCES zoon_circles(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- العضو إذا كان مسجلاً
  phone_number    TEXT, -- في حال كان المدعو غير مسجل بعد
  name            TEXT,
  avatar_url      TEXT,
  compatibility   INTEGER DEFAULT 0, -- نسبة التوافق %
  role            TEXT DEFAULT 'MEMBER',
  joined_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(circle_id, user_id),
  UNIQUE(circle_id, phone_number)
);

-- 3. جدول موارد الدائرة (Zoon Circle Resources)
CREATE TABLE IF NOT EXISTS zoon_circle_resources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id       UUID REFERENCES zoon_circles(id) ON DELETE CASCADE,
  type            TEXT CHECK (type IN ('BOOK', 'AI_ASSISTANT', 'GIFT', 'AUDIO', 'DOCUMENT')),
  name            TEXT,
  data            JSONB DEFAULT '{}', -- روابط، أهداف، أو بيانات المورد
  added_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول العلاقات بين الدوائر (Zoon Circle Connections)
CREATE TABLE IF NOT EXISTS zoon_circle_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_circle_id  UUID REFERENCES zoon_circles(id) ON DELETE CASCADE,
  to_circle_id    UUID REFERENCES zoon_circles(id) ON DELETE CASCADE,
  connection_type TEXT CHECK (connection_type IN ('FAMILY', 'WORK', 'SOCIAL', 'INTEREST')),
  color           TEXT,
  strength        FLOAT DEFAULT 1.0, -- قوة العلاقة
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. جدول استجابات البروفايل (Profile Responses)
CREATE TABLE IF NOT EXISTS zoon_profiling_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id     UUID REFERENCES zoon_questions(id) ON DELETE CASCADE,
  response_data   JSONB,
  points_earned   INTEGER DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. فهارس للسرعة
CREATE INDEX IF NOT EXISTS idx_circles_owner_id ON zoon_circles(owner_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_circle_id ON zoon_circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_connections_from ON zoon_circle_connections(from_circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_connections_to ON zoon_circle_connections(to_circle_id);
