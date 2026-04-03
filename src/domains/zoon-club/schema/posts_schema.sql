-- 1. جدول المنشورات (Zoon Posts)
CREATE TABLE zoon_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id         UUID REFERENCES zoon_rooms(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin or User
  content         TEXT,
  media_urls      JSONB DEFAULT '[]', -- Array of image/video URLs
  is_approved     BOOLEAN DEFAULT TRUE,
  likes_count     INTEGER DEFAULT 0,
  comments_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. فهرس للغرف لتسريع البحث
CREATE INDEX idx_zoon_posts_room_id ON zoon_posts(room_id);
