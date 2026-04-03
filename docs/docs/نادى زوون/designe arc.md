
🏗️ البنية التحتية الكاملة لنادي زوون ZONE
Next.js + Supabase + DDD + Redux
📑 جدول المحتويات
نظرة عامة على Architecture
هيكل المشروع - DDD Structure
Schema قاعدة البيانات Supabase
Redux State Management
Domain Models & Entities
API Routes & Services
Components Architecture
Security & RLS Policies
خطة التنفيذ للمبرمجين
سيناريو العرض للنادي
<a name="architecture-overview"></a>

1️⃣ نظرة عامة على Architecture
🎯 المبادئ الأساسية
typescript
/**
 * ZONE Community Architecture
 * 
 * Stack:
 * - Frontend: Next.js 14 (App Router)
 * - Backend: Supabase (PostgreSQL + Auth + Storage + Realtime)
 * - State Management: Redux Toolkit
 * - Architecture: Domain-Driven Design (DDD)
 * - Styling: Tailwind CSS
 * - Mobile: React Native (Phase 2)
 */

// Core Principles:
// 1. Domain-Driven Design (DDD)
// 2. Separation of Concerns
// 3. Clean Architecture
// 4. Type Safety (TypeScript)
// 5. Real-time First
```

## 📊 System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Next.js UI  │  │   Redux      │  │   Hooks      │     │
│  │  Components  │←→│   Store      │←→│   & Utils    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Use Cases   │  │   Services   │  │     DTOs     │     │
│  │  (Actions)   │←→│  (Business)  │←→│  (Transfer)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Entities   │  │  Aggregates  │  │  Value       │     │
│  │   (Models)   │←→│   (Roots)    │←→│  Objects     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Supabase    │  │   Storage    │  │   Realtime   │     │
│  │  PostgreSQL  │←→│   (Files)    │←→│   (Sockets)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

<a name="project-structure"></a>
# 2️⃣ هيكل المشروع - DDD Structure

## 📁 Folder Structure الكامل
```
zone-community/
├── src/
│   ├── app/                          # Next.js 14 App Router
│   │   ├── (auth)/                   # Auth routes group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (main)/                   # Main app routes
│   │   │   ├── rooms/                # الغرف
│   │   │   │   ├── [roomId]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── circles/              # الدوائر
│   │   │   │   ├── [circleId]/
│   │   │   │   │   ├── members/
│   │   │   │   │   ├── chat/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── profile/
│   │   │   ├── leaderboard/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── api/                      # API Routes
│   │   │   ├── rooms/
│   │   │   ├── circles/
│   │   │   ├── posts/
│   │   │   ├── buzz/
│   │   │   └── chat/
│   │   │
│   │   └── layout.tsx
│   │
│   ├── domain/                       # DOMAIN LAYER (DDD)
│   │   ├── entities/                 # Core Business Entities
│   │   │   ├── User/
│   │   │   │   ├── User.entity.ts
│   │   │   │   ├── User.types.ts
│   │   │   │   └── User.validator.ts
│   │   │   │
│   │   │   ├── Room/
│   │   │   │   ├── Room.entity.ts
│   │   │   │   ├── Room.types.ts
│   │   │   │   └── Room.validator.ts
│   │   │   │
│   │   │   ├── Circle/
│   │   │   │   ├── Circle.entity.ts
│   │   │   │   ├── Circle.types.ts
│   │   │   │   └── Circle.validator.ts
│   │   │   │
│   │   │   ├── Post/
│   │   │   │   ├── Post.entity.ts
│   │   │   │   ├── Post.types.ts
│   │   │   │   └── Post.validator.ts
│   │   │   │
│   │   │   └── Buzz/
│   │   │       ├── Buzz.entity.ts
│   │   │       └── Buzz.types.ts
│   │   │
│   │   ├── aggregates/               # Aggregate Roots
│   │   │   ├── RoomAggregate/
│   │   │   │   └── RoomAggregate.ts
│   │   │   └── CircleAggregate/
│   │   │       └── CircleAggregate.ts
│   │   │
│   │   ├── value-objects/            # Value Objects
│   │   │   ├── BuzzLevel.ts
│   │   │   ├── MatchingScore.ts
│   │   │   └── Points.ts
│   │   │
│   │   └── repositories/             # Repository Interfaces
│   │       ├── IUserRepository.ts
│   │       ├── IRoomRepository.ts
│   │       ├── ICircleRepository.ts
│   │       └── IPostRepository.ts
│   │
│   ├── application/                  # APPLICATION LAYER
│   │   ├── use-cases/                # Business Logic Use Cases
│   │   │   ├── rooms/
│   │   │   │   ├── CreatePost.usecase.ts
│   │   │   │   ├── GiveBuzz.usecase.ts
│   │   │   │   └── GetRoomFeed.usecase.ts
│   │   │   │
│   │   │   ├── circles/
│   │   │   │   ├── JoinCircle.usecase.ts
│   │   │   │   ├── MatchMembers.usecase.ts
│   │   │   │   └── StartChat.usecase.ts
│   │   │   │
│   │   │   └── leaderboard/
│   │   │       └── CalculatePoints.usecase.ts
│   │   │
│   │   ├── services/                 # Application Services
│   │   │   ├── MatchingService.ts
│   │   │   ├── PointsService.ts
│   │   │   ├── NotificationService.ts
│   │   │   └── ModerationService.ts
│   │   │
│   │   └── dtos/                     # Data Transfer Objects
│   │       ├── CreatePostDto.ts
│   │       ├── JoinCircleDto.ts
│   │       └── GiveBuzzDto.ts
│   │
│   ├── infrastructure/               # INFRASTRUCTURE LAYER
│   │   ├── database/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts
│   │   │   │   ├── migrations/
│   │   │   │   └── seed/
│   │   │   │
│   │   │   └── repositories/         # Repository Implementations
│   │   │       ├── UserRepository.ts
│   │   │       ├── RoomRepository.ts
│   │   │       ├── CircleRepository.ts
│   │   │       └── PostRepository.ts
│   │   │
│   │   ├── storage/
│   │   │   └── SupabaseStorageService.ts
│   │   │
│   │   ├── realtime/
│   │   │   ├── ChatRealtimeService.ts
│   │   │   └── NotificationRealtimeService.ts
│   │   │
│   │   └── external/
│   │       └── ImageCompressionService.ts
│   │
│   ├── presentation/                 # PRESENTATION LAYER
│   │   ├── components/
│   │   │   ├── features/             # Feature Components
│   │   │   │   ├── rooms/
│   │   │   │   │   ├── RoomFeed/
│   │   │   │   │   ├── PostCard/
│   │   │   │   │   ├── BuzzButton/
│   │   │   │   │   └── CreatePostModal/
│   │   │   │   │
│   │   │   │   ├── circles/
│   │   │   │   │   ├── CircleMembersList/
│   │   │   │   │   ├── MatchingQuestions/
│   │   │   │   │   ├── ChatWindow/
│   │   │   │   │   └── GroupCard/
│   │   │   │   │
│   │   │   │   └── leaderboard/
│   │   │   │       └── LeaderboardTable/
│   │   │   │
│   │   │   ├── shared/               # Shared Components
│   │   │   │   ├── Button/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Avatar/
│   │   │   │   └── Badge/
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── Header/
│   │   │       ├── Sidebar/
│   │   │       └── BottomNav/
│   │   │
│   │   └── hooks/                    # Custom Hooks
│   │       ├── useAuth.ts
│   │       ├── useRealtime.ts
│   │       ├── useInfiniteScroll.ts
│   │       └── useMatchingScore.ts
│   │
│   ├── store/                        # REDUX STORE
│   │   ├── index.ts
│   │   ├── hooks.ts
│   │   │
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── roomsSlice.ts
│   │   │   ├── circlesSlice.ts
│   │   │   ├── postsSlice.ts
│   │   │   └── uiSlice.ts
│   │   │
│   │   └── middleware/
│   │       └── realtimeMiddleware.ts
│   │
│   ├── lib/                          # Utilities & Helpers
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── validators/
│   │   └── types/
│   │
│   └── config/                       # Configuration
│       ├── supabase.config.ts
│       └── app.config.ts
│
├── supabase/                         # Supabase Config
│   ├── migrations/
│   ├── functions/                    # Edge Functions
│   └── config.toml
│
├── public/
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
<a name="database-schema"></a>

3️⃣ Schema قاعدة البيانات Supabase
📊 Complete Database Schema
sql
-- ============================================
-- ZONE COMMUNITY DATABASE SCHEMA
-- Supabase PostgreSQL
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  phone VARCHAR(20),
  
  -- Location
  neighborhood VARCHAR(100) DEFAULT 'Moharram Bek',
  building_number VARCHAR(50),
  
  -- Points & Gamification
  total_points INTEGER DEFAULT 0,
  monthly_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges JSONB DEFAULT '[]'::jsonb,
  
  -- Preferences
  preferred_rooms TEXT[] DEFAULT ARRAY[]::TEXT[],
  notification_settings JSONB DEFAULT '{
    "buzz": true,
    "comments": true,
    "circles": true,
    "chat": true
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_moderator BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT full_name_length CHECK (char_length(full_name) >= 2)
);

-- ============================================
-- 2. ROOMS (الغرف)
-- ============================================

CREATE TYPE room_type AS ENUM (
  'homes',           -- 🏡 بيوتنا
  'neighborhood',    -- 🌳 حينا محرم بك
  'kitchen',         -- 🍳 مطبخنا
  'health',          -- 💪 صحتنا
  'children',        -- 👶 أطفالنا
  'culture',         -- 📚 ثقافتنا
  'sports',          -- ⚽ رياضتنا
  'success'          -- 💼 نجاحاتنا
);

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Room Info
  type room_type UNIQUE NOT NULL,
  name_ar VARCHAR(50) NOT NULL,
  name_en VARCHAR(50) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(20) NOT NULL,
  
  -- Stats
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  total_buzz INTEGER DEFAULT 0,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  allow_images BOOLEAN DEFAULT true,
  allow_videos BOOLEAN DEFAULT true,
  max_post_length INTEGER DEFAULT 2000,
  
  -- Moderators
  moderators UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room Members (many-to-many)
CREATE TABLE public.room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT false,
  
  UNIQUE(room_id, user_id)
);

-- ============================================
-- 3. POSTS (البوستات)
-- ============================================

CREATE TYPE post_type AS ENUM ('text', 'image', 'video', 'poll');
CREATE TYPE post_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  type post_type NOT NULL DEFAULT 'text',
  title VARCHAR(200),
  content TEXT NOT NULL,
  media_url TEXT,
  media_thumbnail_url TEXT,
  
  -- Moderation
  status post_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Engagement
  buzz_count INTEGER DEFAULT 0,
  quick_buzz_count INTEGER DEFAULT 0,
  hot_buzz_count INTEGER DEFAULT 0,
  diamond_buzz_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Gamification
  points_earned INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT content_not_empty CHECK (char_length(trim(content)) > 0)
);

CREATE INDEX idx_posts_room_status ON posts(room_id, status);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- ============================================
-- 4. BUZZ SYSTEM (نظام BAZZZZ)
-- ============================================

CREATE TYPE buzz_level AS ENUM ('quick', 'hot', 'diamond');

CREATE TABLE public.buzzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Buzz Details
  level buzz_level NOT NULL,
  points INTEGER NOT NULL, -- 1, 3, or 5
  comment TEXT, -- Required for diamond buzz
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(post_id, user_id),
  CONSTRAINT diamond_requires_comment CHECK (
    level != 'diamond' OR (comment IS NOT NULL AND char_length(comment) >= 10)
  )
);

CREATE INDEX idx_buzzes_post ON buzzes(post_id);
CREATE INDEX idx_buzzes_user ON buzzes(user_id);

-- ============================================
-- 5. COMMENTS (التعليقات)
-- ============================================

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For replies
  
  -- Content
  content TEXT NOT NULL,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT comment_length CHECK (char_length(trim(content)) >= 1)
);

CREATE INDEX idx_comments_post ON comments(post_id, created_at DESC);
CREATE INDEX idx_comments_user ON comments(user_id);

-- ============================================
-- 6. CIRCLES (الدوائر)
-- ============================================

CREATE TABLE public.circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  
  -- Circle Info
  name VARCHAR(100),
  description TEXT,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 1000,
  requires_matching BOOLEAN DEFAULT true,
  
  -- Stats
  member_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(room_id) -- One circle per room
);

-- Circle Members
CREATE TABLE public.circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Matching Data (JSON for flexibility)
  matching_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Preferences
  preferred_communication TEXT[], -- ['1-1', 'small-group', 'large-group']
  available_hours_per_month INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(circle_id, user_id)
);

CREATE INDEX idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX idx_circle_members_user ON circle_members(user_id);

-- Matching Scores (calculated)
CREATE TABLE public.matching_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Score
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(circle_id, user1_id, user2_id),
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

CREATE INDEX idx_matching_scores_user1 ON matching_scores(user1_id, score DESC);
CREATE INDEX idx_matching_scores_user2 ON matching_scores(user2_id, score DESC);

-- ============================================
-- 7. CHAT SYSTEM (المحادثات)
-- ============================================

CREATE TYPE chat_type AS ENUM ('direct', 'group');

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type
  type chat_type NOT NULL,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  
  -- Group Details (if type = 'group')
  name VARCHAR(100),
  description TEXT,
  
  -- Metadata
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Participants
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  is_admin BOOLEAN DEFAULT false,
  last_read_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  media_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT message_not_empty CHECK (
    char_length(trim(content)) > 0 OR media_url IS NOT NULL
  )
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- ============================================
-- 8. LEADERBOARD & GAMIFICATION
-- ============================================

-- Weekly Leaderboard
CREATE TABLE public.leaderboard_weekly (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Period
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  
  -- Scores
  buzz_points INTEGER DEFAULT 0,
  quality_points INTEGER DEFAULT 0,
  engagement_points INTEGER DEFAULT 0,
  consistency_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  
  -- Rank
  rank INTEGER,
  
  -- Stats
  posts_count INTEGER DEFAULT 0,
  buzzes_received INTEGER DEFAULT 0,
  comments_made INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(room_id, user_id, week_start)
);

CREATE INDEX idx_leaderboard_week ON leaderboard_weekly(week_start, week_end);
CREATE INDEX idx_leaderboard_room_rank ON leaderboard_weekly(room_id, rank);

-- ============================================
-- 9. NOTIFICATIONS
-- ============================================

CREATE TYPE notification_type AS ENUM (
  'buzz',
  'comment',
  'reply',
  'circle_match',
  'new_message',
  'post_approved',
  'post_rejected',
  'achievement'
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relations
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Details
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  action_url TEXT,
  
  -- Related Entities
  related_user_id UUID REFERENCES users(id),
  related_post_id UUID REFERENCES posts(id),
  related_conversation_id UUID REFERENCES conversations(id),
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================
-- 10. MODERATION & REPORTS
-- ============================================

CREATE TYPE report_type AS ENUM ('spam', 'inappropriate', 'misleading', 'harassment', 'other');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'action_taken', 'dismissed');

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reporter
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Reported Content
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id),
  
  -- Report Details
  type report_type NOT NULL,
  description TEXT,
  
  -- Review
  status report_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status, created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Update post buzz counts
CREATE OR REPLACE FUNCTION update_post_buzz_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET
      buzz_count = buzz_count + 1,
      quick_buzz_count = CASE WHEN NEW.level = 'quick' THEN quick_buzz_count + 1 ELSE quick_buzz_count END,
      hot_buzz_count = CASE WHEN NEW.level = 'hot' THEN hot_buzz_count + 1 ELSE hot_buzz_count END,
Continue

10:18 PM
  diamond_buzz_count = CASE WHEN NEW.level = 'diamond' THEN diamond_buzz_count + 1 ELSE diamond_buzz_count END
WHERE id = NEW.post_id;
ELSIF TG_OP = 'DELETE' THEN
UPDATE posts SET
buzz_count = buzz_count - 1,
quick_buzz_count = CASE WHEN OLD.level = 'quick' THEN quick_buzz_count - 1 ELSE quick_buzz_count END,
hot_buzz_count = CASE WHEN OLD.level = 'hot' THEN hot_buzz_count - 1 ELSE hot_buzz_count END,
diamond_buzz_count = CASE WHEN OLD.level = 'diamond' THEN diamond_buzz_count - 1 ELSE diamond_buzz_count END
WHERE id = OLD.post_id;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buzz_counts_trigger
AFTER INSERT OR DELETE ON buzzes
FOR EACH ROW EXECUTE FUNCTION update_post_buzz_counts();

-- Function: Update room member count
CREATE OR REPLACE FUNCTION update_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
IF TG_OP = 'INSERT' THEN
UPDATE rooms SET member_count = member_count + 1 WHERE id = NEW.room_id;
ELSIF TG_OP = 'DELETE' THEN
UPDATE rooms SET member_count = member_count - 1 WHERE id = OLD.room_id;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER room_member_count_trigger
AFTER INSERT OR DELETE ON room_members
FOR EACH ROW EXECUTE FUNCTION update_room_member_count();

-- ============================================
-- INITIAL DATA SEEDING
-- ============================================

-- Insert default rooms
INSERT INTO rooms (type, name_ar, name_en, icon, color) VALUES
('homes', 'بيوتنا', 'Our Homes', '🏡', '
#10B981'),
('neighborhood', 'حينا محرم بك', 'Our Neighborhood', '🌳', '
#059669'),
('kitchen', 'مطبخنا', 'Our Kitchen', '🍳', '
#F59E0B'),
('health', 'صحتنا', 'Our Health', '💪', '
#EF4444'),
('children', 'أطفالنا', 'Our Children', '👶', '
#8B5CF6'),
('culture', 'ثقافتنا', 'Our Culture', '📚', '
#3B82F6'),
('sports', 'رياضتنا', 'Our Sports', '⚽', '
#14B8A6'),
('success', 'نجاحاتنا', 'Our Success', '💼', '
#6366F1');

-- Create circles for each room
INSERT INTO circles (room_id)
SELECT id FROM rooms;


---

<a name="redux-structure"></a>
# 4️⃣ Redux State Management

## 🔄 Redux Store Structure
```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Slices
import authReducer from './slices/authSlice';
import roomsReducer from './slices/roomsSlice';
import circlesReducer from './slices/circlesSlice';
import postsReducer from './slices/postsSlice';
import chatReducer from './slices/chatSlice';
import uiReducer from './slices/uiSlice';

// Middleware
import { realtimeMiddleware } from './middleware/realtimeMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rooms: roomsReducer,
    circles: circlesReducer,
    posts: postsReducer,
    chat: chatReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['realtime/messageReceived'],
      },
    }).concat(realtimeMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```
```typescript
// src/store/slices/roomsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Room, Post, BuzzLevel } from '@/domain/entities';
import { RoomRepository } from '@/infrastructure/database/repositories';

interface RoomsState {
  rooms: Room[];
  currentRoom: Room | null;
  currentRoomPosts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

const initialState: RoomsState = {
  rooms: [],
  currentRoom: null,
  currentRoomPosts: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 0,
};

// Async Thunks
export const fetchRooms = createAsyncThunk(
  'rooms/fetchRooms',
  async () => {
    const repository = new RoomRepository();
    return await repository.findAll();
  }
);

export const fetchRoomPosts = createAsyncThunk(
  'rooms/fetchRoomPosts',
  async ({ roomId, page = 0 }: { roomId: string; page?: number }) => {
    const repository = new RoomRepository();
    const limit = 20;
    const offset = page * limit;
    return await repository.findPostsByRoom(roomId, limit, offset);
  }
);

export const giveBuzz = createAsyncThunk(
  'rooms/giveBuzz',
  async ({ 
    postId, 
    level, 
    comment 
  }: { 
    postId: string; 
    level: BuzzLevel; 
    comment?: string;
  }) => {
    const repository = new RoomRepository();
    return await repository.createBuzz({ postId, level, comment });
  }
);

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setCurrentRoom: (state, action: PayloadAction<Room>) => {
      state.currentRoom = action.payload;
      state.currentRoomPosts = [];
      state.page = 0;
      state.hasMore = true;
    },
    clearCurrentRoom: (state) => {
      state.currentRoom = null;
      state.currentRoomPosts = [];
    },
    addPostToFeed: (state, action: PayloadAction<Post>) => {
      state.currentRoomPosts.unshift(action.payload);
    },
    updatePostBuzz: (state, action: PayloadAction<{ postId: string; buzzData: any }>) => {
      const post = state.currentRoomPosts.find(p => p.id === action.payload.postId);
      if (post) {
        post.buzzCount = action.payload.buzzData.buzzCount;
        // Update other buzz counts...
      }
    },
  },
  extraReducers: (builder) => {
    // fetchRooms
    builder.addCase(fetchRooms.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchRooms.fulfilled, (state, action) => {
      state.loading = false;
      state.rooms = action.payload;
    });
    builder.addCase(fetchRooms.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch rooms';
    });

    // fetchRoomPosts
    builder.addCase(fetchRoomPosts.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchRoomPosts.fulfilled, (state, action) => {
      state.loading = false;
      if (action.meta.arg.page === 0) {
        state.currentRoomPosts = action.payload;
      } else {
        state.currentRoomPosts.push(...action.payload);
      }
      state.hasMore = action.payload.length === 20;
      state.page = action.meta.arg.page || 0;
    });

    // giveBuzz
    builder.addCase(giveBuzz.fulfilled, (state, action) => {
      // Update post buzz count optimistically
      const post = state.currentRoomPosts.find(p => p.id === action.meta.arg.postId);
      if (post) {
        post.buzzCount += action.payload.points;
      }
    });
  },
});

export const { 
  setCurrentRoom, 
  clearCurrentRoom, 
  addPostToFeed,
  updatePostBuzz 
} = roomsSlice.actions;

export default roomsSlice.reducer;
```

سأكمل باقي التفاصيل التقنية في الرد التالي...
استمر

10:19 PM
typescript
// src/store/slices/circlesSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Circle, CircleMember, MatchingScore } from '@/domain/entities';
import { CircleRepository } from '@/infrastructure/database/repositories';
import { MatchingService } from '@/application/services';

interface CirclesState {
  circles: Circle[];
  currentCircle: Circle | null;
  myCircles: Circle[];
  circleMembers: CircleMember[];
  matchedMembers: Array<{
    member: CircleMember;
    score: number;
  }>;
  loading: boolean;
  matchingLoading: boolean;
  error: string | null;
}

const initialState: CirclesState = {
  circles: [],
  currentCircle: null,
  myCircles: [],
  circleMembers: [],
  matchedMembers: [],
  loading: false,
  matchingLoading: false,
  error: null,
};

// Async Thunks
export const joinCircle = createAsyncThunk(
  'circles/joinCircle',
  async ({ 
    circleId, 
    answers 
  }: { 
    circleId: string; 
    answers: Record<string, any>;
  }) => {
    const repository = new CircleRepository();
    return await repository.joinCircle(circleId, answers);
  }
);

export const fetchMatchedMembers = createAsyncThunk(
  'circles/fetchMatchedMembers',
  async ({ circleId, userId }: { circleId: string; userId: string }) => {
    const matchingService = new MatchingService();
    return await matchingService.findMatches(circleId, userId);
  }
);

export const startConversation = createAsyncThunk(
  'circles/startConversation',
  async ({ 
    circleId, 
    targetUserId 
  }: { 
    circleId: string; 
    targetUserId: string;
  }) => {
    const repository = new CircleRepository();
    return await repository.createConversation(circleId, targetUserId);
  }
);

const circlesSlice = createSlice({
  name: 'circles',
  initialState,
  reducers: {
    setCurrentCircle: (state, action: PayloadAction<Circle>) => {
      state.currentCircle = action.payload;
    },
    clearCurrentCircle: (state) => {
      state.currentCircle = null;
      state.matchedMembers = [];
    },
  },
  extraReducers: (builder) => {
    // joinCircle
    builder.addCase(joinCircle.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(joinCircle.fulfilled, (state, action) => {
      state.loading = false;
      state.myCircles.push(action.payload.circle);
    });
    builder.addCase(joinCircle.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to join circle';
    });

    // fetchMatchedMembers
    builder.addCase(fetchMatchedMembers.pending, (state) => {
      state.matchingLoading = true;
    });
    builder.addCase(fetchMatchedMembers.fulfilled, (state, action) => {
      state.matchingLoading = false;
      state.matchedMembers = action.payload;
    });
    builder.addCase(fetchMatchedMembers.rejected, (state, action) => {
      state.matchingLoading = false;
      state.error = action.error.message || 'Failed to find matches';
    });
  },
});

export const { setCurrentCircle, clearCurrentCircle } = circlesSlice.actions;
export default circlesSlice.reducer;
typescript
// src/store/slices/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from '@/domain/entities';
import { ChatRepository } from '@/infrastructure/database/repositories';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  sending: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async () => {
    const repository = new ChatRepository();
    return await repository.findUserConversations();
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: string) => {
    const repository = new ChatRepository();
    return await repository.findMessagesByConversation(conversationId);
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ 
    conversationId, 
    content, 
    mediaUrl 
  }: { 
    conversationId: string; 
    content: string;
    mediaUrl?: string;
  }) => {
    const repository = new ChatRepository();
    return await repository.createMessage({ conversationId, content, mediaUrl });
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<Conversation>) => {
      state.currentConversation = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const conversation = state.conversations.find(c => c.id === action.payload);
      if (conversation) {
        conversation.unreadCount = 0;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      state.messages = action.payload;
    });
    builder.addCase(sendMessage.pending, (state) => {
      state.sending = true;
    });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.sending = false;
      state.messages.push(action.payload);
    });
  },
});

export const { setCurrentConversation, addMessage, markAsRead } = chatSlice.actions;
export default chatSlice.reducer;
<a name="domain-models"></a>

5️⃣ Domain Models & Entities (DDD)
typescript
// src/domain/entities/User/User.entity.ts
import { Entity } from '../base/Entity';
import { UserId } from '../value-objects/UserId';
import { Points } from '../value-objects/Points';

export interface UserProps {
  id: UserId;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  totalPoints: Points;
  monthlyPoints: Points;
  level: number;
  badges: string[];
  preferredRooms: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity<UserProps> {
  get id(): UserId {
    return this.props.id;
  }

  get username(): string {
    return this.props.username;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get totalPoints(): number {
    return this.props.totalPoints.value;
  }

  get level(): number {
    return this.props.level;
  }

  // Domain Logic
  addPoints(points: number, reason: string): void {
    this.props.totalPoints = this.props.totalPoints.add(points);
    this.props.monthlyPoints = this.props.monthlyPoints.add(points);
    
    // Check for level up
    const newLevel = this.calculateLevel(this.props.totalPoints.value);
    if (newLevel > this.props.level) {
      this.props.level = newLevel;
      // Domain event: UserLeveledUp
    }
  }

  canGiveBuzz(postAuthorId: string): boolean {
    // Business rules
    return this.props.id.value !== postAuthorId && this.props.isActive;
  }

  hasBadge(badgeId: string): boolean {
    return this.props.badges.includes(badgeId);
  }

  private calculateLevel(totalPoints: number): number {
    // Level formula: sqrt(points / 100)
    return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
  }

  static create(props: Omit<UserProps, 'id'>): User {
    const id = UserId.create();
    return new User({ ...props, id });
  }
}
typescript
// src/domain/entities/Post/Post.entity.ts
import { Entity } from '../base/Entity';
import { PostId } from '../value-objects/PostId';
import { UserId } from '../value-objects/UserId';

export type PostType = 'text' | 'image' | 'video' | 'poll';
export type PostStatus = 'pending' | 'approved' | 'rejected';

export interface PostProps {
  id: PostId;
  roomId: string;
  authorId: UserId;
  type: PostType;
  title?: string;
  content: string;
  mediaUrl?: string;
  status: PostStatus;
  buzzCount: number;
  quickBuzzCount: number;
  hotBuzzCount: number;
  diamondBuzzCount: number;
  commentCount: number;
  pointsEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Post extends Entity<PostProps> {
  get id(): PostId {
    return this.props.id;
  }

  get content(): string {
    return this.props.content;
  }

  get status(): PostStatus {
    return this.props.status;
  }

  get totalBuzzPoints(): number {
    return (
      this.props.quickBuzzCount * 1 +
      this.props.hotBuzzCount * 3 +
      this.props.diamondBuzzCount * 5
    );
  }

  // Domain Logic
  approve(reviewerId: string): void {
    if (this.props.status !== 'pending') {
      throw new Error('Post can only be approved from pending status');
    }
    this.props.status = 'approved';
    // Domain event: PostApproved
  }

  reject(reviewerId: string, reason: string): void {
    if (this.props.status !== 'pending') {
      throw new Error('Post can only be rejected from pending status');
    }
    this.props.status = 'rejected';
    // Domain event: PostRejected
  }

  incrementBuzzCount(level: 'quick' | 'hot' | 'diamond'): void {
    this.props.buzzCount += 1;
    
    switch (level) {
      case 'quick':
        this.props.quickBuzzCount += 1;
        this.props.pointsEarned += 1;
        break;
      case 'hot':
        this.props.hotBuzzCount += 1;
        this.props.pointsEarned += 3;
        break;
      case 'diamond':
        this.props.diamondBuzzCount += 1;
        this.props.pointsEarned += 5;
        break;
    }
  }

  canBeEditedBy(userId: string): boolean {
    return this.props.authorId.value === userId && this.props.status === 'pending';
  }

  static create(props: Omit<PostProps, 'id' | 'status' | 'buzzCount' | 'commentCount' | 'pointsEarned' | 'createdAt' | 'updatedAt'>): Post {
    const id = PostId.create();
    return new Post({
      ...props,
      id,
      status: 'pending',
      buzzCount: 0,
      quickBuzzCount: 0,
      hotBuzzCount: 0,
      diamondBuzzCount: 0,
      commentCount: 0,
      pointsEarned: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
typescript
// src/domain/entities/Buzz/Buzz.entity.ts
import { Entity } from '../base/Entity';
import { BuzzLevel } from '../value-objects/BuzzLevel';

export interface BuzzProps {
  id: string;
  postId: string;
  userId: string;
  level: BuzzLevel;
  points: number;
  comment?: string;
  createdAt: Date;
}

export class Buzz extends Entity<BuzzProps> {
  get level(): BuzzLevel {
    return this.props.level;
  }

  get points(): number {
    return this.props.points;
  }

  static create(props: {
    postId: string;
    userId: string;
    level: 'quick' | 'hot' | 'diamond';
    comment?: string;
  }): Buzz {
    const buzzLevel = BuzzLevel.fromString(props.level);
    
    // Validate diamond buzz requires comment
    if (buzzLevel.isDiamond() && !props.comment) {
      throw new Error('Diamond buzz requires a comment');
    }

    if (buzzLevel.isDiamond() && props.comment && props.comment.length < 10) {
      throw new Error('Diamond buzz comment must be at least 10 characters');
    }

    return new Buzz({
      id: crypto.randomUUID(),
      postId: props.postId,
      userId: props.userId,
      level: buzzLevel,
      points: buzzLevel.points,
      comment: props.comment,
      createdAt: new Date(),
    });
  }
}
typescript
// src/domain/value-objects/BuzzLevel.ts
export class BuzzLevel {
  private constructor(
    private readonly _value: 'quick' | 'hot' | 'diamond',
    public readonly points: number
  ) {}

  get value(): string {
    return this._value;
  }

  isQuick(): boolean {
    return this._value === 'quick';
  }

  isHot(): boolean {
    return this._value === 'hot';
  }

  isDiamond(): boolean {
    return this._value === 'diamond';
  }

  static quick(): BuzzLevel {
    return new BuzzLevel('quick', 1);
  }

  static hot(): BuzzLevel {
    return new BuzzLevel('hot', 3);
  }

  static diamond(): BuzzLevel {
    return new BuzzLevel('diamond', 5);
  }

  static fromString(level: string): BuzzLevel {
    switch (level) {
      case 'quick':
        return BuzzLevel.quick();
      case 'hot':
        return BuzzLevel.hot();
      case 'diamond':
        return BuzzLevel.diamond();
      default:
        throw new Error(`Invalid buzz level: ${level}`);
    }
  }
}
typescript
// src/domain/value-objects/MatchingScore.ts
export class MatchingScore {
  private constructor(private readonly _value: number) {
    if (_value < 0 || _value > 100) {
      throw new Error('Matching score must be between 0 and 100');
    }
  }

  get value(): number {
    return this._value;
  }

  isHighMatch(): boolean {
    return this._value >= 80;
  }

  isMediumMatch(): boolean {
    return this._value >= 60 && this._value < 80;
  }

  isLowMatch(): boolean {
    return this._value < 60;
  }

  getLabel(): string {
    if (this.isHighMatch()) return 'توافق عالي';
    if (this.isMediumMatch()) return 'توافق متوسط';
    return 'توافق منخفض';
  }

  static create(value: number): MatchingScore {
    return new MatchingScore(Math.round(value));
  }

  static calculate(
    user1Answers: Record<string, any>,
    user2Answers: Record<string, any>
  ): MatchingScore {
    // Simple matching algorithm
    const questions = Object.keys(user1Answers);
    let matches = 0;

    questions.forEach(question => {
      const answer1 = user1Answers[question];
      const answer2 = user2Answers[question];

      if (Array.isArray(answer1) && Array.isArray(answer2)) {
        // Array comparison (interests)
        const intersection = answer1.filter(a => answer2.includes(a));
        const union = [...new Set([...answer1, ...answer2])];
        matches += (intersection.length / union.length) * 100;
      } else if (answer1 === answer2) {
        // Direct match
        matches += 100;
      }
    });

    const score = matches / questions.length;
    return MatchingScore.create(score);
  }
}
<a name="api-routes"></a>

6️⃣ API Routes & Services
typescript
// src/app/api/rooms/[roomId]/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/database/supabase/server';
import { GetRoomFeedUseCase } from '@/application/use-cases/rooms/GetRoomFeed.usecase';

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Execute use case
    const useCase = new GetRoomFeedUseCase();
    const posts = await useCase.execute({
      roomId: params.roomId,
      userId: user.id,
      page,
      limit,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching room posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, content, mediaUrl } = body;

    // Validate
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Execute use case
    const useCase = new CreatePostUseCase();
    const post = await useCase.execute({
      roomId: params.roomId,
      authorId: user.id,
      type,
      title,
      content,
      mediaUrl,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
typescript
// src/app/api/posts/[postId]/buzz/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/database/supabase/server';
import { GiveBuzzUseCase } from '@/application/use-cases/rooms/GiveBuzz.usecase';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { level, comment } = body;

    // Validate
    if (!['quick', 'hot', 'diamond'].includes(level)) {
      return NextResponse.json(
        { error: 'Invalid buzz level' },
        { status: 400 }
      );
    }

    if (level === 'diamond' && (!comment || comment.length < 10)) {
      return NextResponse.json(
        { error: 'Diamond buzz requires a comment of at least 10 characters' },
        { status: 400 }
      );
    }

    // Execute use case
    const useCase = new GiveBuzzUseCase();
    const buzz = await useCase.execute({
      postId: params.postId,
      userId: user.id,
      level,
      comment,
    });

    return NextResponse.json({ buzz }, { status: 201 });
  } catch (error) {
    console.error('Error giving buzz:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove buzz
    const { error } = await supabase
      .from('buzzes')
      .delete()
      .match({ post_id: params.postId, user_id: user.id });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing buzz:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
typescript
// src/application/use-cases/rooms/GiveBuzz.usecase.ts
import { Buzz } from '@/domain/entities/Buzz/Buzz.entity';
import { BuzzRepository } from '@/infrastructure/database/repositories/BuzzRepository';
import { PostRepository } from '@/infrastructure/database/repositories/PostRepository';
import { UserRepository } from '@/infrastructure/database/repositories/UserRepository';
import { PointsService } from '@/application/services/PointsService';

interface GiveBuzzRequest {
  postId: string;
  userId: string;
  level: 'quick' | 'hot' | 'diamond';
  comment?: string;
}

export class GiveBuzzUseCase {
  constructor(
    private buzzRepository = new BuzzRepository(),
    private postRepository = new PostRepository(),
    private userRepository = new UserRepository(),
    private pointsService = new PointsService()
  ) {}

  async execute(request: GiveBuzzRequest): Promise<Buzz> {
    // 1. Validate user exists and is active
    const user = await this.userRepository.findById(request.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // 2. Validate post exists and is approved
    const post = await this.postRepository.findById(request.postId);
    if (!post) {
      throw new Error('Post not found');
    }
    if (post.status !== 'approved') {
      throw new Error('Post is not approved');
    }

    // 3. Check if user already buzzed this post
    const existingBuzz = await this.buzzRepository.findByPostAndUser(
      request.postId,
      request.userId
    );
    if (existingBuzz) {
      throw new Error('You already buzzed this post');
    }

    // 4. Validate business rules
    if (!user.canGiveBuzz(post.authorId.value)) {
      throw new Error('Cannot buzz your own post');
    }

    // 5. Create buzz entity (domain validation happens here)
    const buzz = Buzz.create({
      postId: request.postId,
      userId: request.userId,
      level: request.level,
      comment: request.comment,
    });

    // 6. Save buzz
    const savedBuzz = await this.buzzRepository.save(buzz);

    // 7. Update post buzz count
    post.incrementBuzzCount(request.level);
    await this.postRepository.update(post);

    // 8. Award points to post author
    const postAuthor = await this.userRepository.findById(post.authorId.value);
    if (postAuthor) {
      await this.pointsService.awardBuzzPoints(
        postAuthor,
        buzz.points,
        `Received ${request.level} buzz`
      );
    }

    // 9. Send notification
    // await this.notificationService.notifyBuzzReceived(...)

    return savedBuzz;
  }
}
typescript
// src/application/use-cases/circles/JoinCircle.usecase.ts
import { CircleRepository } from '@/infrastructure/database/repositories/CircleRepository';
import { UserRepository } from '@/infrastructure/database/repositories/UserRepository';
import { MatchingService } from '@/application/services/MatchingService';

interface JoinCircleRequest {
  circleId: string;
  userId: string;
  answers: Record<string, any>;
}

export class JoinCircleUseCase {
  constructor(
    private circleRepository = new CircleRepository(),
    private userRepository = new UserRepository(),
    private matchingService = new MatchingService()
  ) {}

  async execute(request: JoinCircleRequest) {
    // 1. Validate circle exists
    const circle = await this.circleRepository.findById(request.circleId);
    if (!circle || !circle.isActive) {
      throw new Error('Circle not found or inactive');
    }

    // 2. Validate user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Check if already member
    const isMember = await this.circleRepository.isMember(
      request.circleId,
      request.userId
    );
    if (isMember) {
      throw new Error('Already a member of this circle');
    }

    // 4. Validate answers
    if (!request.answers || Object.keys(request.answers).length === 0) {
      throw new Error('Matching answers are required');
    }

    // 5. Join circle
    const membership = await this.circleRepository.addMember(
      request.circleId,
      request.userId,
      request.answers
    );

    // 6. Calculate matching scores with other members (async)
    this.matchingService.calculateMatchesForNewMember(
      request.circleId,
      request.userId
    ).catch(error => {
      console.error('Error calculating matches:', error);
    });

    // 7. Send welcome notification
    // await this.notificationService.notifyCircleJoined(...)

    return {
      membership,
      circle,
    };
  }
}
typescript
// src/application/services/MatchingService.ts
import { MatchingScore } from '@/domain/value-objects/MatchingScore';
import { CircleRepository } from '@/infrastructure/database/repositories/CircleRepository';

export class MatchingService {
  constructor(
    private circleRepository = new CircleRepository()
  ) {}

  async findMatches(circleId: string, userId: string, limit: number = 10) {
    // 1. Get user's answers
    const userMembership = await this.circleRepository.getMembership(
      circleId,
      userId
    );
    if (!userMembership) {
      throw new Error('User is not a member of this circle');
    }

    // 2. Get all other members
    const otherMembers = await this.circleRepository.getOtherMembers(
      circleId,
      userId
    );

    // 3. Calculate matching scores
    const matches = otherMembers.map(member => {
      const score = MatchingScore.calculate(
        userMembership.matchingAnswers,
        member.matchingAnswers
      );

      return {
        member,
        score: score.value,
        label: score.getLabel(),
      };
    });

    // 4. Sort by score and limit
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, limit);
  }

  async calculateMatchesForNewMember(circleId: string, userId: string) {
    // This runs asynchronously to calculate and cache matching scores
    const userMembership = await this.circleRepository.getMembership(
      circleId,
      userId
    );

    const otherMembers = await this.circleRepository.getOtherMembers(
      circleId,
      userId
    );

    // Calculate and save scores
    const scores = otherMembers.map(member => {
      const score = MatchingScore.calculate(
        userMembership.matchingAnswers,
        member.matchingAnswers
      );

      return {
        circleId,
        user1Id: userId,
        user2Id: member.userId,
        score: score.value,
      };
    });

    // Batch insert matching scores
    await this.circleRepository.saveMatchingScores(scores);
  }
}
سأكمل في الرد التالي مع Security, Components, وخطة التنفيذ...

استمر

10:21 PM
typescript
// src/application/services/PointsService.ts
import { User } from '@/domain/entities/User/User.entity';
import { UserRepository } from '@/infrastructure/database/repositories/UserRepository';
import { NotificationService } from './NotificationService';

export class PointsService {
  constructor(
    private userRepository = new UserRepository(),
    private notificationService = new NotificationService()
  ) {}

  async awardBuzzPoints(user: User, points: number, reason: string) {
    const previousLevel = user.level;
    
    // Domain logic handles level calculation
    user.addPoints(points, reason);
    
    // Save to database
    await this.userRepository.update(user);

    // Check if leveled up
    if (user.level > previousLevel) {
      await this.notificationService.notifyLevelUp(
        user.id.value,
        user.level
      );
    }
  }

  async calculateLeaderboard(roomId: string, weekStart: Date, weekEnd: Date) {
    // Complex calculation logic
    const rankings = await this.userRepository.calculateWeeklyRankings(
      roomId,
      weekStart,
      weekEnd
    );

    // Award bonus points to top 10
    for (let i = 0; i < Math.min(10, rankings.length); i++) {
      const bonusPoints = this.getBonusPointsForRank(i + 1);
      const user = await this.userRepository.findById(rankings[i].userId);
      
      if (user) {
        await this.awardBuzzPoints(
          user,
          bonusPoints,
          `Weekly leaderboard rank #${i + 1}`
        );
      }
    }

    return rankings;
  }

  private getBonusPointsForRank(rank: number): number {
    const bonusMap: Record<number, number> = {
      1: 500,
      2: 300,
      3: 200,
      4: 150,
      5: 150,
      6: 100,
      7: 100,
      8: 100,
      9: 50,
      10: 50,
    };
    return bonusMap[rank] || 0;
  }
}
typescript
// src/application/services/ModerationService.ts
import { Post } from '@/domain/entities/Post/Post.entity';
import { PostRepository } from '@/infrastructure/database/repositories/PostRepository';
import { NotificationService } from './NotificationService';

export class ModerationService {
  constructor(
    private postRepository = new PostRepository(),
    private notificationService = new NotificationService()
  ) {}

  async approvePost(postId: string, reviewerId: string): Promise<Post> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Domain logic
    post.approve(reviewerId);

    // Save
    await this.postRepository.update(post);

    // Notify author
    await this.notificationService.notifyPostApproved(
      post.authorId.value,
      postId
    );

    return post;
  }

  async rejectPost(
    postId: string,
    reviewerId: string,
    reason: string
  ): Promise<Post> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // Domain logic
    post.reject(reviewerId, reason);

    // Save
    await this.postRepository.update(post);

    // Notify author
    await this.notificationService.notifyPostRejected(
      post.authorId.value,
      postId,
      reason
    );

    return post;
  }

  async getPendingPosts(limit: number = 50): Promise<Post[]> {
    return await this.postRepository.findPendingPosts(limit);
  }
}
<a name="security"></a>

7️⃣ Security & RLS Policies
sql
-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE buzzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can read all active users
CREATE POLICY "Users can view active users"
  ON users FOR SELECT
  USING (is_active = true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- ROOMS POLICIES
-- ============================================

-- Anyone can view active rooms
CREATE POLICY "Anyone can view active rooms"
  ON rooms FOR SELECT
  USING (is_active = true);

-- Only moderators can update rooms
CREATE POLICY "Moderators can update rooms"
  ON rooms FOR UPDATE
  USING (
    auth.uid() = ANY(moderators) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_moderator = true
    )
  );

-- ============================================
-- POSTS POLICIES
-- ============================================

-- Users can view approved posts
CREATE POLICY "Users can view approved posts"
  ON posts FOR SELECT
  USING (
    status = 'approved' OR
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_moderator = true
    )
  );

-- Users can create posts
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true)
  );

-- Users can update their own pending posts
CREATE POLICY "Users can update own pending posts"
  ON posts FOR UPDATE
  USING (
    author_id = auth.uid() AND
    status = 'pending'
  )
  WITH CHECK (
    author_id = auth.uid() AND
    status = 'pending'
  );

-- Users can delete their own pending posts
CREATE POLICY "Users can delete own pending posts"
  ON posts FOR DELETE
  USING (author_id = auth.uid() AND status = 'pending');

-- Moderators can update any post
CREATE POLICY "Moderators can update posts"
  ON posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_moderator = true
    )
  );

-- ============================================
-- BUZZES POLICIES
-- ============================================

-- Users can view all buzzes
CREATE POLICY "Users can view buzzes"
  ON buzzes FOR SELECT
  USING (true);

-- Users can create buzz
CREATE POLICY "Users can create buzz"
  ON buzzes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    -- Cannot buzz own post
    NOT EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_id
      AND posts.author_id = auth.uid()
    )
  );

-- Users can delete their own buzz
CREATE POLICY "Users can delete own buzz"
  ON buzzes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- COMMENTS POLICIES
-- ============================================

-- Users can view non-deleted comments
CREATE POLICY "Users can view comments"
  ON comments FOR SELECT
  USING (deleted_at IS NULL);

-- Users can create comments
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can soft delete own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (deleted_at IS NOT NULL);

-- ============================================
-- CIRCLES POLICIES
-- ============================================

-- Anyone can view active circles
CREATE POLICY "Users can view active circles"
  ON circles FOR SELECT
  USING (is_active = true);

-- ============================================
-- CIRCLE MEMBERS POLICIES
-- ============================================

-- Members can view other members in same circle
CREATE POLICY "Circle members can view other members"
  ON circle_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_members.circle_id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
    )
  );

-- Users can join circles
CREATE POLICY "Users can join circles"
  ON circle_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own membership
CREATE POLICY "Users can update own circle membership"
  ON circle_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

-- Users can view conversations they're part of
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.left_at IS NULL
    )
  );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can view messages in their conversations
CREATE POLICY "Users can view conversation messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.left_at IS NULL
    )
  );

-- Users can send messages to their conversations
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
      AND conversation_participants.left_at IS NULL
    )
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Bucket for user avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can view avatars
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Bucket for post media
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true);

-- Authenticated users can upload post media
CREATE POLICY "Users can upload post media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'posts' AND
    auth.role() = 'authenticated'
  );

-- Anyone can view post media
CREATE POLICY "Anyone can view post media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posts');
<a name="components"></a>

8️⃣ Components Architecture
typescript
// src/presentation/components/features/rooms/PostCard/PostCard.tsx
'use client';

import { useState } from 'react';
import { Post } from '@/domain/entities/Post/Post.entity';
import { BuzzButton } from '../BuzzButton';
import { Avatar } from '@/presentation/components/shared/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PostCardProps {
  post: Post;
  onBuzz?: (level: 'quick' | 'hot' | 'diamond', comment?: string) => void;
  onComment?: () => void;
  onShare?: () => void;
}

export function PostCard({ post, onBuzz, onComment, onShare }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar
          src={post.author.avatarUrl}
          alt={post.author.fullName}
          size="md"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {post.author.fullName}
          </h3>
          <p className="text-sm text-gray-500">
            {formatDistanceToNow(post.createdAt, { 
              addSuffix: true, 
              locale: ar 
            })}
          </p>
        </div>
        {post.status === 'pending' && (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
            قيد المراجعة
          </span>
        )}
      </div>

      {/* Content */}
      {post.title && (
        <h2 className="text-lg font-bold mb-2">{post.title}</h2>
      )}
      <p className="text-gray-800 mb-3 whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Media */}
      {post.mediaUrl && (
        <div className="mb-3 rounded-lg overflow-hidden">
          {post.type === 'image' ? (
            <img
              src={post.mediaUrl}
              alt={post.title || 'Post image'}
              className="w-full h-auto"
            />
          ) : post.type === 'video' ? (
            <video
              src={post.mediaUrl}
              controls
              className="w-full h-auto"
            />
          ) : null}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3 pb-3 border-b">
        <span className="flex items-center gap-1">
          <span className="font-semibold">{post.buzzCount}</span>
          BAZZZZ
        </span>
        <span className="flex items-center gap-1">
          <span className="font-semibold">{post.commentCount}</span>
          تعليق
        </span>
        <span className="flex items-center gap-1">
          ⚡ {post.quickBuzzCount} •
          🔥 {post.hotBuzzCount} •
          💎 {post.diamondBuzzCount}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <BuzzButton
          postId={post.id.value}
          currentBuzz={post.userBuzz}
          onBuzz={onBuzz}
        />
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
        >
          💬 تعليق
        </button>
        <button
          onClick={onShare}
          className="flex-1 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
        >
          ↗️ مشاركة
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t">
          {/* Comments implementation */}
        </div>
      )}
    </div>
  );
}
typescript
// src/presentation/components/features/rooms/BuzzButton/BuzzButton.tsx
'use client';

import { useState } from 'react';
import { Modal } from '@/presentation/components/shared/Modal';

interface BuzzButtonProps {
  postId: string;
  currentBuzz?: 'quick' | 'hot' | 'diamond' | null;
  onBuzz: (level: 'quick' | 'hot' | 'diamond', comment?: string) => void;
}

export function BuzzButton({ postId, currentBuzz, onBuzz }: BuzzButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'quick' | 'hot' | 'diamond' | null>(null);
  const [comment, setComment] = useState('');
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 500); // Long press = 500ms
    setPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
      
      // Quick tap = Quick Buzz
      if (!showModal) {
        onBuzz('quick');
      }
    }
  };

  const handleBuzzSelect = (level: 'quick' | 'hot' | 'diamond') => {
    setSelectedLevel(level);
    
    if (level === 'diamond') {
      // Show comment input for diamond
      return;
    }
    
    // Submit immediately for quick/hot
    onBuzz(level);
    setShowModal(false);
  };

  const handleDiamondSubmit = () => {
    if (comment.length >= 10) {
      onBuzz('diamond', comment);
      setShowModal(false);
      setComment('');
      setSelectedLevel(null);
    }
  };

  return (
    <>
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        className={`
          flex-1 py-2 px-4 rounded-lg font-semibold transition-all
          ${currentBuzz 
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }
        `}
      >
        {currentBuzz ? (
          <>
            {currentBuzz === 'quick' && '⚡'}
            {currentBuzz === 'hot' && '🔥'}
            {currentBuzz === 'diamond' && '💎'}
            {' BAZZZZ'}
          </>
        ) : (
          '🔥 BAZZZZ'
        )}
      </button>

      {/* Buzz Level Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedLevel(null);
          setComment('');
        }}
        title="اختر مستوى BAZZZZ"
      >
        {!selectedLevel ? (
          <div className="space-y-3">
            <button
              onClick={() => handleBuzzSelect('quick')}
              className="w-full p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border-2 border-yellow-300 text-right transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚡</span>
                <div>
                  <h3 className="font-bold text-lg">Quick Buzz</h3>
                  <p className="text-sm text-gray-600">أعجبني - 1 نقطة</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleBuzzSelect('hot')}
              className="w-full p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border-2 border-orange-300 text-right transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔥</span>
                <div>
                  <h3 className="font-bold text-lg">Hot Buzz</h3>
                  <p className="text-sm text-gray-600">محتوى ممتاز - 3 نقاط</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleBuzzSelect('diamond')}
              className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-300 text-right transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">💎</span>
                <div>
                  <h3 className="font-bold text-lg">Diamond Buzz</h3>
                  <p className="text-sm text-gray-600">استثنائي + تعليق - 5 نقاط</p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-3">
                💎 Diamond Buzz يتطلب تعليق (10+ كلمات) يوضح لماذا المحتوى استثنائي
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="اكتب تعليقك هنا..."
                className="w-full p-3 border rounded-lg resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length} / 500 حرف
                {comment.length < 10 && ` (يجب 10+ كلمات)`}
              </p>
            </div>
            <button
              onClick={handleDiamondSubmit}
              disabled={comment.length < 10}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              إرسال Diamond Buzz 💎
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
typescript
// src/presentation/components/features/circles/MatchingQuestions/MatchingQuestions.tsx
'use client';

import { useState } from 'react';

interface Question {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'range';
  options?: string[];
  min?: number;
  max?: number;
}

interface MatchingQuestionsProps {
  circleId: string;
  roomType: string;
  onSubmit: (answers: Record<string, any>) => void;
}

// Questions for each room type
const ROOM_QUESTIONS: Record<string, Question[]> = {
  children: [
    {
      id: 'ages',
      text: 'أعمار أطفالك؟',
      type: 'multiple',
      options: ['0-2 سنة', '3-5 سنوات', '6-10 سنوات', '11+ سنة'],
    },
    {
      id: 'main_challenge',
      text: 'ما أكبر تحدي تواجهه؟',
      type: 'single',
      options: [
        'النوم والروتين',
        'الأكل والتغذية',
        'التعليم والتطوير',
        'السلوك والانضباط',
      ],
    },
    {
      id: 'communication_style',
      text: 'كيف تفضل التواصل؟',
      type: 'single',
      options: [
        'محادثات صغيرة (2-3 أشخاص)',
        'مجموعات كبيرة',
        'لقاءات حقيقية',
        'أونلاين فقط',
      ],
    },
  ],
  homes: [
    {
      id: 'interests',
      text: 'ما يهمك في البيت؟',
      type: 'multiple',
      options: ['تنظيم وترتيب', 'ديكور', 'صيانة', 'أفكار DIY'],
    },
    {
      id: 'skill_level',
      text: 'مستوى خبرتك؟',
      type: 'single',
      options: ['مبتدئ', 'متوسط', 'متقدم', 'خبير'],
    },
    {
      id: 'budget',
      text: 'ميزانيتك الشهرية للبيت؟',
      type: 'single',
      options: ['أقل من 500 ج', '500-1000 ج', '1000-2000 ج', 'أكثر من 2000 ج'],
    },
  ],
  neighborhood: [
    {
      id: 'interests',
      text: 'ما يهمك في الحي؟',
      type: 'multiple',
      options: ['تحسين البيئة', 'تنظيم فعاليات', 'حل مشاكل', 'مبادرات خضراء'],
    },
    {
      id: 'participation_type',
      text: 'كيف تفضل المشاركة؟',
      type: 'single',
      options: ['تطوع ميداني', 'تخطيط وتنظيم', 'تمويل ودعم', 'نشر وعي'],
    },
    {
      id: 'available_hours',
      text: 'كم ساعة تقدر تعطي شهرياً؟',
      type: 'single',
      options: ['2-5 ساعات', '5-10 ساعات', '10-20 ساعة', 'أكثر من 20 ساعة'],
    },
  ],
  // Add more room types...
};

export function MatchingQuestions({
  circleId,
  roomType,
  onSubmit,
}: MatchingQuestionsProps) {
  const questions = ROOM_QUESTIONS[roomType] || [];
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onSubmit(answers);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const canProceed = answers[currentQuestion.id] !== undefined;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            سؤال {currentStep + 1} من {questions.length}
          </span>
          <span className="text-sm font-semibold text-blue-600">
            {Math.round(((currentStep + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-bold mb-6">{currentQuestion.text}</h2>

        {currentQuestion.type === 'single' && (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => (
              <button
                key={option}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                className={`
                  w-full p-4 text-right rounded-lg border-2 transition-all
                  ${
                    answers[currentQuestion.id] === option
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.type === 'multiple' && (
          <div className="space-y-3">
            {currentQuestion.options?.map((option) => {
              const currentAnswers = answers[currentQuestion.id] || [];
              const isSelected = currentAnswers.includes(option);

              return (
                <button
                  key={option}
                  onClick={() => {
                    const newAnswers = isSelected
                      ? currentAnswers.filter((a: string) => a !== option)
                      : [...currentAnswers, option];
                    handleAnswer(currentQuestion.id, newAnswers);
                  }}
                  className={`
                    w-full p-4 text-right rounded-lg border-2 transition-all
                    ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }
                  `}
                >
Continue

10:30 PM
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {isSelected && <span className="text-blue-600">✓</span>}
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>

  {/* Navigation */}
  <div className="flex gap-4">
    {currentStep > 0 && (
      <button
        onClick={handleBack}
        className="flex-1 py-3 px-6 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
      >
        رجوع
      </button>
    )}
    <button
      onClick={handleNext}
      disabled={!canProceed}
      className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
    >
      {isLastQuestion ? 'انضم الآن' : 'التالي'}
    </button>
  </div>
</div>
);
}


سأكمل في الرد القادم مع خطة التنفيذ وسيناريو العرض للنادي...
استمر

10:31 PM
typescript
// src/presentation/components/features/circles/CircleMembersList/CircleMembersList.tsx
'use client';

import { useState } from 'react';
import { CircleMember } from '@/domain/entities/Circle/Circle.entity';
import { Avatar } from '@/presentation/components/shared/Avatar';

interface CircleMembersListProps {
  members: Array<{
    member: CircleMember;
    score: number;
    label: string;
  }>;
  onStartChat: (memberId: string) => void;
}

export function CircleMembersList({ members, onStartChat }: CircleMembersListProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold mb-4">
        أعضاء متوافقون معك ({members.length})
      </h2>

      {members.map(({ member, score, label }) => (
        <div
          key={member.id}
          className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar
              src={member.user.avatarUrl}
              alt={member.user.fullName}
              size="lg"
            />

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">{member.user.fullName}</h3>
                <span
                  className={`
                    px-2 py-1 text-xs rounded-full font-semibold
                    ${score >= 80 ? 'bg-green-100 text-green-800' : ''}
                    ${score >= 60 && score < 80 ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${score < 60 ? 'bg-gray-100 text-gray-800' : ''}
                  `}
                >
                  {label} ({score}%)
                </span>
              </div>

              {member.user.bio && (
                <p className="text-sm text-gray-600 mb-3">{member.user.bio}</p>
              )}

              {/* Interests */}
              <div className="flex flex-wrap gap-2 mb-3">
                {member.interests.slice(0, 3).map((interest) => (
                  <span
                    key={interest}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                  >
                    {interest}
                  </span>
                ))}
                {member.interests.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{member.interests.length - 3} أخرى
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onStartChat(member.userId)}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  💬 ابدأ محادثة
                </button>
                <button
                  onClick={() => setSelectedMember(
                    selectedMember === member.id ? null : member.id
                  )}
                  className="py-2 px-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {selectedMember === member.id ? 'إخفاء' : 'عرض'} التفاصيل
                </button>
              </div>

              {/* Expanded Details */}
              {selectedMember === member.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">الاهتمامات المشتركة:</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.interests.map((interest) => (
                        <span
                          key={interest}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                        >
                          ✓ {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {member.availableHoursPerMonth && (
                    <div>
                      <h4 className="font-semibold mb-1">الوقت المتاح:</h4>
                      <p className="text-gray-600">
                        {member.availableHoursPerMonth} ساعة شهرياً
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-1">عضو منذ:</h4>
                    <p className="text-gray-600">
                      {new Date(member.joinedAt).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {members.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            لا توجد مطابقات بعد. سنجد لك أعضاء متوافقين قريباً!
          </p>
        </div>
      )}
    </div>
  );
}
typescript
// src/presentation/components/features/leaderboard/LeaderboardTable/LeaderboardTable.tsx
'use client';

import { Avatar } from '@/presentation/components/shared/Avatar';

interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
    level: number;
  };
  totalPoints: number;
  buzzPoints: number;
  qualityPoints: number;
  engagementPoints: number;
  postsCount: number;
  buzzesReceived: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  roomName?: string;
}

export function LeaderboardTable({
  entries,
  currentUserId,
  roomName,
}: LeaderboardTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          🏆 لوحة المتصدرين
        </h2>
        {roomName && (
          <p className="text-blue-100">غرفة {roomName} - هذا الأسبوع</p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                الترتيب
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                العضو
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                البوستات
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                BAZZZZ
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                النقاط
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((entry) => {
              const isCurrentUser = entry.user.id === currentUserId;
              const rankClass =
                entry.rank === 1
                  ? 'bg-yellow-50'
                  : entry.rank === 2
                  ? 'bg-gray-50'
                  : entry.rank === 3
                  ? 'bg-orange-50'
                  : isCurrentUser
                  ? 'bg-blue-50'
                  : '';

              return (
                <tr
                  key={entry.user.id}
                  className={`${rankClass} hover:bg-opacity-80 transition-colors`}
                >
                  {/* Rank */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`
                          text-2xl font-bold
                          ${entry.rank === 1 ? 'text-yellow-500' : ''}
                          ${entry.rank === 2 ? 'text-gray-400' : ''}
                          ${entry.rank === 3 ? 'text-orange-400' : ''}
                          ${entry.rank > 3 ? 'text-gray-600' : ''}
                        `}
                      >
                        {entry.rank === 1 ? '🥇' : ''}
                        {entry.rank === 2 ? '🥈' : ''}
                        {entry.rank === 3 ? '🥉' : ''}
                        {entry.rank > 3 ? `#${entry.rank}` : ''}
                      </span>
                    </div>
                  </td>

                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={entry.user.avatarUrl}
                        alt={entry.user.fullName}
                        size="md"
                      />
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {entry.user.fullName}
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded">
                              أنت
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{entry.user.username} • المستوى {entry.user.level}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Posts */}
                  <td className="px-6 py-4 text-center">
                    <div className="font-semibold text-gray-900">
                      {entry.postsCount}
                    </div>
                  </td>

                  {/* Buzzes */}
                  <td className="px-6 py-4 text-center">
                    <div className="font-semibold text-orange-600">
                      {entry.buzzesReceived}
                    </div>
                  </td>

                  {/* Points */}
                  <td className="px-6 py-4 text-center">
                    <div className="font-bold text-lg text-blue-600">
                      {entry.totalPoints.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      BAZZZZ: {entry.buzzPoints} | جودة: {entry.qualityPoints}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 text-sm text-gray-600">
        <p>
          💡 <strong>نصيحة:</strong> انشر محتوى مفيد بانتظام، تفاعل مع الآخرين،
          واحصل على Diamond Buzz لزيادة نقاطك!
        </p>
      </div>
    </div>
  );
}
<a name="implementation-plan"></a>

9️⃣ خطة التنفيذ للمبرمجين
📋 Phase-by-Phase Implementation Plan
Phase 0: Setup (أسبوع واحد)
markdown
## Week 1: Project Setup & Infrastructure

### Day 1-2: Initial Setup
- [ ] Create Next.js 14 project with TypeScript
- [ ] Setup Supabase project
- [ ] Configure environment variables
- [ ] Setup Tailwind CSS
- [ ] Create folder structure (DDD)
- [ ] Setup ESLint & Prettier
- [ ] Initialize Git repository

### Day 3-4: Database Schema
- [ ] Run database migrations (all tables)
- [ ] Setup RLS policies
- [ ] Create storage buckets
- [ ] Seed initial data (8 rooms + circles)
- [ ] Test database connections

### Day 5-6: Redux Setup
- [ ] Configure Redux Toolkit
- [ ] Create initial slices (auth, rooms, circles, posts, chat, ui)
- [ ] Setup typed hooks
- [ ] Create middleware (realtime)

### Day 7: Domain Layer Foundation
- [ ] Create base Entity class
- [ ] Create value objects (BuzzLevel, Points, MatchingScore)
- [ ] Create core entities (User, Post, Room, Circle)
- [ ] Write basic entity tests

**Deliverable:** ✅ Fully configured project ready for development
Phase 1: Authentication & Basic UI (أسبوعان)
markdown
## Week 2-3: Authentication & Core UI

### Authentication (Week 2, Days 1-3)
- [ ] Implement Supabase Auth
- [ ] Create login/register pages
- [ ] Implement phone number authentication
- [ ] Create user profile setup flow
- [ ] Implement auth middleware
- [ ] Create protected routes
- [ ] Handle session management

### Core UI Components (Week 2, Days 4-7)
- [ ] Create shared components:
  - [ ] Button
  - [ ] Input
  - [ ] Modal
  - [ ] Avatar
  - [ ] Badge
  - [ ] Card
- [ ] Create layout components:
  - [ ] Header/Navigation
  - [ ] Sidebar (desktop)
  - [ ] Bottom Navigation (mobile)
  - [ ] Footer
- [ ] Implement responsive design
- [ ] Add loading states & skeletons

### Week 3: User Profile & Onboarding
- [ ] Create profile page
- [ ] Implement profile editing
- [ ] Create onboarding flow:
  - [ ] Welcome screen
  - [ ] Select 3 favorite rooms
  - [ ] Profile completion
  - [ ] Tutorial/walkthrough
- [ ] Implement avatar upload
- [ ] Create user settings page

**Deliverable:** ✅ Users can register, login, and complete profile
Phase 2: الغرف - Rooms Feature (3 أسابيع)
markdown
## Week 4-6: Rooms - Core Content Feature

### Week 4: Room Infrastructure
- [ ] Create Room repository
- [ ] Implement GetRoomFeed use case
- [ ] Create RoomFeed component (vertical scroll)
- [ ] Implement infinite scroll
- [ ] Create room switching UI
- [ ] Add room member count display
- [ ] Create empty states

### Week 5: Post Creation & Display
- [ ] Create CreatePost use case
- [ ] Build post creation modal:
  - [ ] Text input with character limit
  - [ ] Image upload with preview
  - [ ] Video upload with compression
  - [ ] Room selection
- [ ] Implement PostCard component
- [ ] Add post media display (images/videos)
- [ ] Create post actions bar
- [ ] Implement moderation queue (admin view)

### Week 6: BAZZZZ System
- [ ] Create Buzz entity & value object
- [ ] Implement GiveBuzz use case
- [ ] Build BuzzButton component:
  - [ ] Quick tap = Quick Buzz
  - [ ] Long press = Level selection modal
  - [ ] Diamond Buzz with comment input
- [ ] Add buzz counts display
- [ ] Implement buzz removal
- [ ] Add daily buzz limits
- [ ] Create anti-spam detection
- [ ] Show user's buzz on posts

**Deliverable:** ✅ Fully functional rooms with posts and BAZZZZ system
Phase 3: Comments & Chat (أسبوعان)
markdown
## Week 7-8: Social Interactions

### Week 7: Comments System
- [ ] Create Comment repository
- [ ] Implement comment creation
- [ ] Build comment component with:
  - [ ] Nested replies
  - [ ] Like functionality
  - [ ] Edit/Delete (own comments)
  - [ ] Timestamp display
- [ ] Add comment count to posts
- [ ] Implement comment notifications
- [ ] Add moderation for comments

### Week 8: General Room Chat
- [ ] Setup Supabase Realtime
- [ ] Create Chat repository
- [ ] Build ChatWindow component:
  - [ ] Message list with auto-scroll
  - [ ] Message input with emoji
  - [ ] Typing indicators
  - [ ] Online status
  - [ ] Message timestamps
- [ ] Implement chat notifications
- [ ] Add chat moderation
- [ ] Create chat message reactions

**Deliverable:** ✅ Complete social interaction features
Phase 4: الدوائر - Circles Feature (3 أسابيع)
markdown
## Week 9-11: Circles - Deep Connections

### Week 9: Circle Infrastructure
- [ ] Create Circle repository
- [ ] Implement JoinCircle use case
- [ ] Build MatchingQuestions component:
  - [ ] Dynamic questions per room type
  - [ ] Progress indicator
  - [ ] Answer validation
  - [ ] Beautiful UI
- [ ] Create circle membership flow
- [ ] Add "Join Circle" CTA in rooms

### Week 10: Matching System
- [ ] Implement MatchingService
- [ ] Create matching algorithm
- [ ] Build MatchingScore calculation
- [ ] Implement FindMatches use case
- [ ] Create CircleMembersList component:
  - [ ] Display matching score
  - [ ] Show shared interests
  - [ ] Member profiles
  - [ ] Filter/sort options
- [ ] Add matching score caching

### Week 11: Circle Chat & Groups
- [ ] Implement 1-on-1 conversations
- [ ] Create StartConversation use case
- [ ] Build private chat UI
- [ ] Implement small groups (3-5 members):
  - [ ] Group creation
  - [ ] Member management
  - [ ] Group chat
  - [ ] Group settings
- [ ] Add conversation list
- [ ] Implement read receipts
- [ ] Add message search

**Deliverable:** ✅ Complete circles feature with matching and chat
Phase 5: Gamification & Leaderboard (أسبوعان)
markdown
## Week 12-13: Points, Levels & Competition

### Week 12: Points System
- [ ] Implement PointsService
- [ ] Create point calculation logic:
  - [ ] BAZZZZ received points
  - [ ] Quality points (moderation)
  - [ ] Engagement points
  - [ ] Consistency points
- [ ] Implement level system
- [ ] Create badges system
- [ ] Add achievement notifications
- [ ] Create user stats page

### Week 13: Leaderboard
- [ ] Implement CalculateLeaderboard use case
- [ ] Create LeaderboardTable component
- [ ] Build weekly rankings
- [ ] Add monthly all-stars
- [ ] Create category-specific rankings:
  - [ ] Most Buzzed
  - [ ] Most Engaging
  - [ ] Rising Star
  - [ ] Consistency King
- [ ] Implement leaderboard caching
- [ ] Add prize distribution logic
- [ ] Create winner announcement system

**Deliverable:** ✅ Complete gamification system
Phase 6: Moderation & Admin (أسبوع)
markdown
## Week 14: Content Moderation

### Admin Dashboard
- [ ] Create admin-only routes
- [ ] Build moderation queue:
  - [ ] Pending posts list
  - [ ] Quick approve/reject
  - [ ] Bulk actions
  - [ ] Rejection reasons
- [ ] Implement ModerationService
- [ ] Create reports system:
  - [ ] Report button on posts/comments
  - [ ] Report review interface
  - [ ] Action logging
- [ ] Add user management:
  - [ ] User search
  - [ ] Ban/unban users
  - [ ] View user history
- [ ] Create analytics dashboard:
  - [ ] Daily active users
  - [ ] Posts per room
  - [ ] Engagement metrics
  - [ ] Growth charts

**Deliverable:** ✅ Complete admin tools
Phase 7: Notifications & Polish (أسبوع)
markdown
## Week 15: Notifications & Final Polish

### Notifications
- [ ] Implement NotificationService
- [ ] Create notification types:
  - [ ] Buzz received
  - [ ] Comment on post
  - [ ] Reply to comment
  - [ ] Circle match found
  - [ ] New message
  - [ ] Post approved/rejected
  - [ ] Achievement unlocked
- [ ] Build notification center UI
- [ ] Add push notifications (web)
- [ ] Implement email notifications
- [ ] Create notification settings

### Final Polish
- [ ] Performance optimization:
  - [ ] Image lazy loading
  - [ ] Code splitting
  - [ ] Bundle optimization
- [ ] Accessibility improvements
- [ ] Mobile responsiveness check
- [ ] Add error boundaries
- [ ] Implement offline support (PWA)
- [ ] Add loading states everywhere
- [ ] Bug fixes & testing
- [ ] Documentation

**Deliverable:** ✅ Production-ready application
Phase 8: Testing & Deployment (أسبوع)
markdown
## Week 16: Testing & Launch

### Testing
- [ ] Unit tests for domain entities
- [ ] Integration tests for use cases
- [ ] E2E tests for critical flows:
  - [ ] Registration & login
  - [ ] Post creation & BAZZZZ
  - [ ] Circle joining & matching
  - [ ] Chat functionality
- [ ] Performance testing
- [ ] Security audit
- [ ] Browser compatibility testing

### Deployment
- [ ] Setup production Supabase project
- [ ] Configure production environment
- [ ] Setup CI/CD pipeline
- [ ] Deploy to Vercel/production
- [ ] Configure custom domain
- [ ] Setup monitoring (Sentry)
- [ ] Setup analytics (PostHog/Mixpanel)
- [ ] Create backup strategy
- [ ] Write deployment documentation

### Soft Launch
- [ ] Deploy to production
- [ ] Invite 50-100 beta users
- [ ] Monitor for issues
- [ ] Collect feedback
- [ ] Quick iterations
- [ ] Prepare for full launch

**Deliverable:** ✅ Live production application
```

---

## 📊 Development Timeline Summary
```
Total Development Time: 16 weeks (4 months)

Phase 0: Setup                    [1 week]   ▓
Phase 1: Auth & UI                [2 weeks]  ▓▓
Phase 2: Rooms Feature            [3 weeks]  ▓▓▓
Phase 3: Comments & Chat          [2 weeks]  ▓▓
Phase 4: Circles Feature          [3 weeks]  ▓▓▓
Phase 5: Gamification             [2 weeks]  ▓▓
Phase 6: Moderation               [1 week]   ▓
Phase 7: Notifications & Polish   [1 week]   ▓
Phase 8: Testing & Deployment     [1 week]   ▓
                                  ═══════════
                                  16 weeks total
```

---

<a name="pitch-scenario"></a>
# 🔟 سيناريو العرض للنادي

## 🎯 Pitch Deck للنادي - نادي زوون ZONE

### **Slide 1: الغلاف**
```
┌─────────────────────────────────────────┐
│                                         │
│         🎯 نادي زوون ZONE              │
│                                         │
│   منصة مجتمعية رقمية تفاعلية          │
│     لأعضاء نادي [اسم النادي]          │
│                                         │
│         محرم بك، الإسكندرية            │
│           يناير 2026                   │
│                                         │
└─────────────────────────────────────────┘
```

---

### **Slide 2: المشكلة**
```
❌ التحديات الحالية:

1️⃣ للنادي:
   • صعوبة جذب أعضاء جدد
   • قلة التفاعل مع الأعضاء الحاليين
   • التسويق التقليدي مكلف وغير فعال
   • لا توجد قناة رقمية حديثة

2️⃣ للأعضاء:
   • عدم معرفة ما يحدث في النادي
   • صعوبة التواصل مع أعضاء آخرين
   • قلة المحتوى المفيد المحلي
   
3️⃣ للحي (محرم بك):
   • ضعف الترابط المجتمعي
   • لا توجد منصة محلية للتواصل
   • المعلومات المفيدة متناثرة
```

---

### **Slide 3: الحل - نادي زوون ZONE**
```
✅ منصة واحدة، وجهان متكاملان:

┌──────────────────────────────────────┐
│  📱 الغرف (المحتوى العام)          │
│  ════════════════════════            │
│  • 8 غرف متخصصة                     │
│  • محتوى مفيد يومياً                │
│  • نظام BAZZZZ للتفاعل             │
│  • مسابقات شهرية                   │
│                                      │
│  💬 الدوائر (العلاقات العميقة)     │
│  ═══════════════════════════════     │
│  • مطابقة ذكية بين الأعضاء         │
│  • محادثات خاصة 1:1                │
│  • مجموعات صغيرة متخصصة            │
│  • بناء صداقات حقيقية              │
└──────────────────────────────────────┘
```

---

### **Slide 4: كيف تعمل؟**
```
🔄 رحلة العضو:

1️⃣ التحميل والتسجيل (دقيقة واحدة)
   └─ رقم الهاتف + كود

2️⃣ التصفح في الغرف
   └─ محتوى مفيد مثل TikTok/Reels
   
3️⃣ التفاعل بـ BAZZZZ
   └─ ⚡ سريع | 🔥 ممتاز | 💎 استثنائي

4️⃣ كسب النقاط
   └─ نشر محتوى + التفاعل

5️⃣ الانضمام للدوائر
   └─ 3 أسئلة → مطابقة ذكية
   
6️⃣ بناء علاقات
   └─ محادثات + مجموعات + لقاءات

7️⃣ عضوية نادي مجانية!
   └─ للأعضاء الأكثر نشاطاً
```

---

### **Slide 5: الغرف الثمانية**
```
🏠 الغرف المتخصصة:

🏡 بيوتنا        → ديكور، تنظيم، أفكار منزلية
🌳 حينا محرم بك   → البيئة، مبادرات، فعاليات
🍳 مطبخنا        → وصفات، نصائح طبخ
💪 صحتنا         → تمارين، تغذية، تحديات
👶 أطفالنا       → تربية، أنشطة، نصائح
📚 ثقافتنا       → كتب، تعلم، معلومات
⚽ رياضتنا       → إنجازات، فعاليات رياضية
💼 نجاحاتنا      → قصص نجاح، نصائح مهنية

كل غرفة = محتوى عام + دائرة خاصة
```

---

### **Slide 6: القيمة للنادي**
```
💎 كيف يستفيد النادي؟

1️⃣ قناة تسويق رقمية حديثة
   • وصول مباشر لـ 5,000+ شخص بمحرم بك
   • تكلفة أقل من التسويق التقليدي
   • قياس دقيق للنتائج

2️⃣ زيادة العضويات
   • الأعضاء النشطون = عضوية نادي مجانية
   • المتميزون يحصلون على خصومات
   • هدف: 200+ عضو جديد في 6 أشهر

3️⃣ تفاعل مستمر
   • محتوى يومي عن النادي
   • فعاليات وتحديات رياضية
   • ترويج للخدمات

4️⃣ بناء مجتمع قوي
   • أعضاء مخلصون ومتفاعلون
   • سفراء للنادي في الحي
   • سمعة أقوى

5️⃣ دخل إضافي
   • عمولة على العضويات (20%)
   • رعايات محتملة
   • شراكات استراتيجية
Slide 7: الأرقام المتوقعة
📊 التوقعات الواقعية (6 أشهر):

┌─────────────────────────────────────┐
│  المستخدمون                        │
│  ════════════                       │
│  الشهر 1:  1,500 مستخدم            │
│  الشهر 3:  2,800 مستخدم            │
│  الشهر 6:  5,000 مستخدم            │
│                                     │
│  أعضاء ناد
