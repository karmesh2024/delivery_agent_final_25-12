# 🎯 نادي زوون ZONE - الوثائق التقنية الكاملة والنهائية
## البنية التحتية للداشبورد + نظام Dynamic Profiling المتكامل

---

**المشروع:** نادي زوون ZONE (داخل منظومة كارمش)  
**النسخة:** 2.0 - Ultimate Complete Edition  
**التاريخ:** يناير 2026  
**الحالة:** ✅ جاهز للتنفيذ الفوري  

---

# 📑 فهرس المحتويات الشامل

## القسم الأول: نظرة عامة والفكرة
1. [نظرة عامة على المشروع](#section-1)
2. [الفكرة والسيناريو الكامل](#section-2)
3. [نظام Dynamic Profiling - الفلسفة](#section-3)

## القسم الثاني: البنية التقنية
4. [البنية التقنية والـ Stack](#section-4)
5. [قاعدة البيانات الموسعة](#section-5)
6. [نظام الأسئلة الديناميكية](#section-6)

## القسم الثالث: APIs والخوارزميات
7. [واجهات برمجة التطبيقات الكاملة](#section-7)
8. [خوارزميات المطابقة والتحليل](#section-8)
9. [نظام بناء الملف النفسي](#section-9)

## القسم الرابع: التطبيق والتنفيذ
10. [واجهات المستخدم للداشبورد](#section-10)
11. [الأمان والصلاحيات](#section-11)
12. [خطة التطوير المحدثة](#section-12)
13. [أمثلة كود تفصيلية](#section-13)

---

<a name="section-1"></a>
# 1️⃣ نظرة عامة على المشروع

## 🎯 ما هو نادي زوون ZONE؟

**نادي زوون ZONE** هو منصة مجتمعية رقمية ذكية داخل تطبيق كارمش تجمع بين:

### الابتكار الأساسي: وجهان متكاملان

#### الوجه الأول: **الغرف (Rooms)** 📝
محتوى عام مفيد في 8 مواضيع متخصصة:

- 🏡 **بيوتنا** - المنزل والديكور
- 🌳 **حينا محرم بك** - البيئة والحي
- 🍳 **مطبخنا** - الطبخ والوصفات
- 💪 **صحتنا** - الصحة واللياقة
- 👶 **أطفالنا** - تربية الأطفال
- 📚 **ثقافتنا** - التعليم والمعرفة
- ⚽ **رياضتنا** - الرياضة
- 💼 **نجاحاتنا** - العمل والنجاح

#### الوجه الثاني: **الدوائر (Circles)** 💬
تواصل عميق وعلاقات هادفة بين الأعضاء

### الابتكار الجديد: نظام Dynamic Profiling 🧠

```
┌─────────────────────────────────────────────────────┐
│  "كل تفاعل = معلومة عن شخصية المستخدم"           │
│                                                     │
│  ✓ أسئلة ذكية في اللحظة المناسبة                 │
│  ✓ بناء تدريجي لملف نفسي عميق                    │
│  ✓ مطابقة تتحسن مع كل تفاعل                       │
│  ✓ تخصيص كامل لتجربة كل مستخدم                   │
└─────────────────────────────────────────────────────┘
```

---

<a name="section-2"></a>
# 2️⃣ الفكرة والسيناريو الكامل

## 📖 القصة الكاملة

### المشهد 1: تطبيق كارمش (الأساس الموجود)

```
كارمش = تطبيق بيع المخلفات + نادي رقمي بيئي

الخدمات:
├─ بيع المخلفات القابلة لإعادة التدوير
├─ نظام النقاط (كل كيلو = نقاط)
├─ المكافآت (تحويل النقاط لجوائز)
└─ راديو كارمش (محتوى صوتي بيئي)

الجمهور: 500-1000 مستخدم في محرم بك، الإسكندرية
```

### المشهد 2: نادي زوون ZONE - الحل الذكي

```
المشكلة: لا يوجد تواصل حقيقي بين المستخدمين

الحل: نادي زوون ZONE
├─ 8 غرف متخصصة (محتوى عام)
├─ 8 دوائر (تواصل عميق)
└─ نظام Dynamic Profiling (ذكاء اصطناعي)
```

---

<a name="section-3"></a>
# 3️⃣ نظام Dynamic Profiling - الفلسفة

## 🧠 الفكرة الثورية

### بدلاً من الاستبيان التقليدي الممل:

```
❌ النظام القديم:
┌──────────────────────────────┐
│ استبيان طويل عند التسجيل    │
│ 50 سؤال دفعة واحدة          │
│ معدل الإكمال: 20%           │
│ معلومات سطحية               │
└──────────────────────────────┘

✅ نظام Dynamic Profiling:
┌──────────────────────────────┐
│ أسئلة ذكية وقت الحاجة      │
│ 1-3 أسئلة في كل نقطة تفاعل │
│ معدل الإكمال: 85%+          │
│ ملف نفسي عميق ودقيق         │
└──────────────────────────────┘
```

## 🎯 نقاط التفاعل (Interaction Points)

### 1. عند دخول الغرفة (Entry Point)
```
سؤال واحد سريع:
"ما الذي يجلبك لهذه الغرفة؟"

→ حسب الإجابة:
  - حب اطلاع → دخول مباشر
  - مهتم مهنياً → 2-3 أسئلة إضافية
```

### 2. أثناء التصفح (Engagement Points)
```
- بعد أول بوست → سؤال عن الموضوع المفضل
- بعد 10 تفاعلات → ترتيب الاهتمامات
- بعد انضمام لدائرة → أسئلة المطابقة
```

### 3. عند الخروج (Exit Point)
```
شاشة شكر + أسئلة اختيارية:
- تقييم التجربة (⭐⭐⭐⭐⭐)
- هل ستعود؟
- اقتراحات للتحسين
```

---

<a name="section-4"></a>
# 4️⃣ البنية التقنية والـ Stack

## 🏗️ Stack التقني الكامل

### Frontend Stack:
```yaml
Framework: React.js 18+ + TypeScript
UI Library: Ant Design 5 / Material-UI v5
State Management: Redux Toolkit / Zustand
Charts & Visualization: Recharts / ApexCharts
Forms & Validation: React Hook Form + Yup
Styling: Tailwind CSS 3
HTTP Client: Axios
WebSockets: Socket.io-client
```

### Backend Stack:
```yaml
Runtime: Node.js 18+ LTS
Framework: Express.js 4.18+
Language: TypeScript 5+
Database: PostgreSQL 15+
ORM: Prisma 5+
Cache: Redis 7+
Authentication: JWT (jsonwebtoken)
File Storage: AWS S3 / Cloudinary
Real-time: Socket.io
Validation: Joi / Zod
Email: Nodemailer
```

### AI & Machine Learning:
```yaml
ML Library: TensorFlow.js / Brain.js
Matching Algorithm: Custom (Weighted Similarity)
Sentiment Analysis: Natural (NLP)
Recommendations: Collaborative Filtering
```

### DevOps & Infrastructure:
```yaml
Containerization: Docker + Docker Compose
CI/CD: GitHub Actions
Hosting: AWS / DigitalOcean / Vercel
Process Manager: PM2
Reverse Proxy: Nginx
SSL: Let's Encrypt
```

### Monitoring & Analytics:
```yaml
Error Tracking: Sentry
User Analytics: LogRocket / Mixpanel
Performance: New Relic
Uptime: UptimeRobot
Logs: Winston + Morgan
```

## 📐 معمارية النظام المحدثة

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Dashboard  │  │   Mobile    │  │   Landing   │   │
│  │   (React)   │  │  (Native)   │  │    Page     │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
└─────────┼─────────────────┼─────────────────┼──────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                         │
│         (Express.js + JWT + Rate Limiting)              │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Business Logic Layer                  │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Users   │  │  Content │  │ Circles  │            │
│  │ Service  │  │ Service  │  │ Service  │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │                    │
│  ┌────┴──────┐ ┌───┴──────┐ ┌───┴──────────┐         │
│  │ Dynamic   │ │ Matching │ │  Analytics   │         │
│  │ Profiling │ │ Engine   │ │  Service     │         │
│  │ Service   │ │          │ │              │         │
│  └───────────┘ └──────────┘ └──────────────┘         │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │    AWS S3   │ │
│  │ (Main + ML)  │  │   (Cache)    │  │   (Files)   │ │
│  └──────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

<a name="section-5"></a>
# 5️⃣ قاعدة البيانات الموسعة

## 📊 الجداول الجديدة لـ Dynamic Profiling

### جداول نظام الأسئلة

#### `questions` - بنك الأسئلة
```sql
CREATE TABLE questions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id           UUID REFERENCES rooms(id),  -- NULL = سؤال عام
  category          VARCHAR(50) NOT NULL,       -- 'entry', 'exit', 'engagement'
  trigger_type      VARCHAR(50) NOT NULL,       -- 'first_visit', 'casual_intent', etc.
  question_text_ar  TEXT NOT NULL,
  question_text_en  TEXT,
  question_type     VARCHAR(20) NOT NULL,       -- 'single_choice', 'multiple_choice', 'rating', 'text', 'ranking'
  options           JSONB,                      -- Array of options
  importance        VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  is_skippable      BOOLEAN DEFAULT TRUE,
  points_reward     INTEGER DEFAULT 1,
  display_order     INTEGER,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- مثال على options JSONB:
{
  "type": "single_choice",
  "options": [
    { "id": "opt1", "text_ar": "لدي أطفال", "text_en": "I have children", "value": "has_children" },
    { "id": "opt2", "text_ar": "أخطط للإنجاب", "text_en": "Planning", "value": "planning" },
    { "id": "opt3", "text_ar": "لا", "text_en": "No", "value": "no_children" }
  ]
}
```

#### `question_conditions` - شروط عرض الأسئلة
```sql
CREATE TABLE question_conditions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id         UUID REFERENCES questions(id) ON DELETE CASCADE,
  condition_type      VARCHAR(50) NOT NULL,  -- 'min_visits', 'entry_intent', 'previous_answer', etc.
  condition_value     JSONB NOT NULL,
  logic_operator      VARCHAR(10) DEFAULT 'AND',  -- 'AND', 'OR'
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- مثال على condition_value:
{
  "min_visits": 1,
  "max_visits": 3,
  "entry_intent": ["professional", "interested"],
  "has_not_answered": ["q_children_age"]
}
```

#### `question_responses` - إجابات المستخدمين
```sql
CREATE TABLE question_responses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  question_id       UUID REFERENCES questions(id) ON DELETE CASCADE,
  room_id           UUID REFERENCES rooms(id) ON DELETE SET NULL,
  session_id        VARCHAR(100),  -- لربط الأسئلة في نفس الجلسة
  response_value    JSONB NOT NULL,  -- الإجابة
  response_text     TEXT,  -- للأسئلة النصية
  points_earned     INTEGER DEFAULT 0,
  time_to_answer    INTEGER,  -- بالثواني
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- مثال على response_value:
{
  "selected_option": "has_children",
  "selected_options": ["opt1", "opt3"],  -- للاختيارات المتعددة
  "rating": 5,
  "ranking": ["item1", "item2", "item3"]
}

CREATE INDEX idx_question_responses_user ON question_responses(user_id);
CREATE INDEX idx_question_responses_question ON question_responses(question_id);
```

### جداول الملف النفسي

#### `user_psychological_profile` - الملف النفسي
```sql
CREATE TABLE user_psychological_profile (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- البيانات الديموغرافية
  has_children            BOOLEAN,
  children_count          INTEGER,
  children_ages           INTEGER[],
  marital_status          VARCHAR(20),  -- 'single', 'married', 'divorced'
  profession              VARCHAR(100),
  profession_category     VARCHAR(50),
  education_level         VARCHAR(50),
  
  -- الأبعاد النفسية الخمسة (Big Five)
  openness_score          INTEGER DEFAULT 50,      -- 0-100
  conscientiousness_score INTEGER DEFAULT 50,
  extraversion_score      INTEGER DEFAULT 50,
  agreeableness_score     INTEGER DEFAULT 50,
  neuroticism_score       INTEGER DEFAULT 50,
  
  -- معلومات إضافية
  profile_completion_pct  INTEGER DEFAULT 0,
  last_profiling_update   TIMESTAMP,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `user_room_behavior` - سلوك المستخدم في كل غرفة
```sql
CREATE TABLE user_room_behavior (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  room_id               UUID REFERENCES rooms(id) ON DELETE CASCADE,
  
  -- نية الدخول والاهتمام
  entry_intent          VARCHAR(50),  -- 'casual', 'interested', 'professional', 'personal'
  interest_level        VARCHAR(20) DEFAULT 'unknown',  -- 'low', 'medium', 'high'
  
  -- إحصائيات الزيارة
  visit_count           INTEGER DEFAULT 1,
  total_time_spent      INTEGER DEFAULT 0,  -- بالثواني
  avg_time_per_visit    INTEGER DEFAULT 0,
  last_visit_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- إحصائيات التفاعل
  posts_viewed          INTEGER DEFAULT 0,
  posts_engaged         INTEGER DEFAULT 0,  -- تفاعل (bazzzz أو comment)
  posts_created         INTEGER DEFAULT 0,
  comments_count        INTEGER DEFAULT 0,
  bazzzs_given          INTEGER DEFAULT 0,
  
  -- التقييم والرضا
  satisfaction_rating   DECIMAL(3,2),  -- 0.00 - 5.00
  will_return           BOOLEAN,
  return_likelihood     INTEGER,  -- 0-100
  
  -- أولويات الموضوعات (مرتبة)
  topic_priorities      JSONB,  -- ["topic1", "topic2", ...]
  favorite_topics       TEXT[],
  
  -- ملاحظات
  feedback_text         TEXT,
  
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, room_id)
);

CREATE INDEX idx_user_room_behavior_user ON user_room_behavior(user_id);
CREATE INDEX idx_user_room_behavior_room ON user_room_behavior(room_id);
```

#### `inferred_interests` - الاهتمامات المستنتجة
```sql
CREATE TABLE inferred_interests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  interest_topic    VARCHAR(100) NOT NULL,
  interest_category VARCHAR(50),  -- 'professional', 'personal', 'hobby', etc.
  confidence_score  INTEGER NOT NULL,  -- 0-100
  evidence_sources  JSONB NOT NULL,  -- مصادر الاستنتاج
  last_updated      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, interest_topic)
);

-- مثال على evidence_sources:
{
  "sources": [
    { "type": "professional_declaration", "weight": 40, "date": "2026-01-29" },
    { "type": "browsing_behavior", "weight": 30, "date": "2026-01-29" },
    { "type": "post_engagement", "weight": 20, "date": "2026-01-28" },
    { "type": "question_response", "weight": 10, "date": "2026-01-27" }
  ],
  "total_confidence": 95
}
```

### جداول نظام المطابقة المحدث

#### `matching_weights` - أوزان المطابقة
```sql
CREATE TABLE matching_weights (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id             UUID REFERENCES circles(id) ON DELETE CASCADE,
  
  -- أوزان المطابقة
  room_questions_weight DECIMAL(3,2) DEFAULT 0.40,  -- 40%
  personality_weight    DECIMAL(3,2) DEFAULT 0.60,  -- 60%
  
  -- أوزان الأبعاد النفسية
  openness_weight       DECIMAL(3,2) DEFAULT 0.20,
  conscientiousness_wt  DECIMAL(3,2) DEFAULT 0.20,
  extraversion_weight   DECIMAL(3,2) DEFAULT 0.20,
  agreeableness_weight  DECIMAL(3,2) DEFAULT 0.20,
  neuroticism_weight    DECIMAL(3,2) DEFAULT 0.20,
  
  -- عتبات المطابقة
  min_compatibility_pct INTEGER DEFAULT 70,  -- حد أدنى للعرض
  excellent_threshold   INTEGER DEFAULT 90,  -- ممتاز
  good_threshold        INTEGER DEFAULT 80,  -- جيد
  
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📝 Prisma Schema الموسع الكامل

```prisma
// schema.prisma - Complete Edition

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USERS & PROFILES
// ============================================

enum UserRole {
  USER
  MODERATOR
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
  DELETED
}

model User {
  id        String     @id @default(uuid())
  phone     String     @unique
  name      String
  email     String?    @unique
  avatar    String?
  location  String?
  points    Int        @default(0)
  role      UserRole   @default(USER)
  status    UserStatus @default(ACTIVE)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  // Relations
  profile                  UserProfile?
  psychologicalProfile     UserPsychologicalProfile?
  posts                    Post[]
  questionResponses        QuestionResponse[]
  roomBehaviors            UserRoomBehavior[]
  inferredInterests        InferredInterest[]
  circleMembers            CircleMember[]
  pointsLogs               PointsLog[]

  @@map("users")
}

model UserProfile {
  id            String   @id @default(uuid())
  userId        String   @unique
  bio           String?
  interests     String[]
  selectedRooms String[]
  badges        String[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

// ============================================
// DYNAMIC PROFILING SYSTEM
// ============================================

enum QuestionCategory {
  ENTRY
  EXIT
  ENGAGEMENT
  FOLLOW_UP
}

enum QuestionType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  RATING
  TEXT
  RANKING
}

enum TriggerType {
  FIRST_VISIT
  ENTRY_INTENT_CASUAL
  ENTRY_INTENT_PROFESSIONAL
  AFTER_FIRST_POST
  AFTER_ENGAGEMENT
  TIME_BASED
  EXIT
}

model Question {
  id              String           @id @default(uuid())
  roomId          String?
  category        QuestionCategory
  triggerType     TriggerType
  questionTextAr  String
  questionTextEn  String?
  questionType    QuestionType
  options         Json?            // Options configuration
  importance      String           @default("medium")
  isSkippable     Boolean          @default(true)
  pointsReward    Int              @default(1)
  displayOrder    Int?
  isActive        Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  room       Room?               @relation(fields: [roomId], references: [id], onDelete: SetNull)
  conditions QuestionCondition[]
  responses  QuestionResponse[]

  @@map("questions")
}

model QuestionCondition {
  id              String   @id @default(uuid())
  questionId      String
  conditionType   String // 'min_visits', 'entry_intent', etc.
  conditionValue  Json
  logicOperator   String   @default("AND")
  createdAt       DateTime @default(now())

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@map("question_conditions")
}

model QuestionResponse {
  id            String   @id @default(uuid())
  userId        String
  questionId    String
  roomId        String?
  sessionId     String?
  responseValue Json
  responseText  String?
  pointsEarned  Int      @default(0)
  timeToAnswer  Int? // seconds
  createdAt     DateTime @default(now())

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  question Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)
  room     Room?     @relation(fields: [roomId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([questionId])
  @@map("question_responses")
}

// ============================================
// PSYCHOLOGICAL PROFILING
// ============================================

model UserPsychologicalProfile {
  id                      String   @id @default(uuid())
  userId                  String   @unique
  
  // Demographics
  hasChildren             Boolean?
  childrenCount           Int?
  childrenAges            Int[]
  maritalStatus           String?
  profession              String?
  professionCategory      String?
  educationLevel          String?
  
  // Big Five Personality Dimensions (0-100)
  opennessScore           Int      @default(50)
  conscientiousnessScore  Int      @default(50)
  extraversionScore       Int      @default(50)
  agreeablenessScore      Int      @default(50)
  neuroticismScore        Int      @default(50)
  
  // Metadata
  profileCompletionPct    Int      @default(0)
  lastProfilingUpdate     DateTime?
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_psychological_profiles")
}

model UserRoomBehavior {
  id                  String   @id @default(uuid())
  userId              String
  roomId              String
  
  // Entry & Interest
  entryIntent         String? // 'casual', 'interested', 'professional'
  interestLevel       String   @default("unknown")
  
  // Visit Statistics
  visitCount          Int      @default(1)
  totalTimeSpent      Int      @default(0) // seconds
  avgTimePerVisit     Int      @default(0)
  lastVisitAt         DateTime @default(now())
  
  // Engagement Statistics
  postsViewed         Int      @default(0)
  postsEngaged        Int      @default(0)
  postsCreated        Int      @default(0)
  commentsCount       Int      @default(0)
  bazzzzsGiven        Int      @default(0)
  
  // Satisfaction
  satisfactionRating  Decimal? @db.Decimal(3, 2)
  willReturn          Boolean?
  returnLikelihood    Int?
  
  // Topic Priorities
  topicPriorities     Json?
  favoriteTopics      String[]
  
  feedbackText        String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@unique([userId, roomId])
  @@index([userId])
  @@index([roomId])
  @@map("user_room_behaviors")
}

model InferredInterest {
  id               String   @id @default(uuid())
  userId           String
  interestTopic    String
  interestCategory String?
  confidenceScore  Int // 0-100
  evidenceSources  Json
  lastUpdated      DateTime @default(now())
  createdAt        DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, interestTopic])
  @@map("inferred_interests")
}

// ============================================
// ROOMS & CONTENT (Existing + Updates)
// ============================================

model Room {
  id          String   @id @default(uuid())
  name        String   @unique
  nameAr      String   @unique
  icon        String
  description String?
  color       String
  order       Int
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts             Post[]
  circles           Circle[]
  questions         Question[]
  questionResponses QuestionResponse[]
  userBehaviors     UserRoomBehavior[]

  @@map("rooms")
}

enum PostStatus {
  PENDING
  APPROVED
  REJECTED
}

model Post {
  id             String     @id @default(uuid())
  userId         String
  roomId         String
  content        String
  mediaUrls      String[]
  status         PostStatus @default(PENDING)
  viewsCount     Int        @default(0)
  bazzzCount     Int        @default(0)
  commentsCount  Int        @default(0)
  isFeatured     Boolean    @default(false)
  isSponsored    Boolean    @default(false)
  rejectionNote  String?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId, status, createdAt])
  @@index([userId])
  @@map("posts")
}

// ============================================
// CIRCLES & MATCHING (Updated)
// ============================================

model Circle {
  id          String   @id @default(uuid())
  roomId      String
  name        String
  description String?
  questions   Json // Matching questions
  memberCount Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  room             Room              @relation(fields: [roomId], references: [id], onDelete: Cascade)
  members          CircleMember[]
  matchingWeights  MatchingWeight?

  @@map("circles")
}

model CircleMember {
  id            String   @id @default(uuid())
  circleId      String
  userId        String
  answers       Json // Matching answers
  compatibility Float? // Average compatibility
  joinedAt      DateTime @default(now())
  isActive      Boolean  @default(true)

  circle Circle @relation(fields: [circleId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([circleId, userId])
  @@index([circleId])
  @@index([userId])
  @@map("circle_members")
}

model MatchingWeight {
  id                     String   @id @default(uuid())
  circleId               String   @unique
  
  // Main weights
  roomQuestionsWeight    Decimal  @default(0.40) @db.Decimal(3, 2)
  personalityWeight      Decimal  @default(0.60) @db.Decimal(3, 2)
  
  // Personality dimension weights
  opennessWeight         Decimal  @default(0.20) @db.Decimal(3, 2)
  conscientiousnessWeight Decimal @default(0.20) @db.Decimal(3, 2)
  extraversionWeight     Decimal  @default(0.20) @db.Decimal(3, 2)
  agreeablenessWeight    Decimal  @default(0.20) @db.Decimal(3, 2)
  neuroticismWeight      Decimal  @default(0.20) @db.Decimal(3, 2)
  
  // Thresholds
  minCompatibilityPct    Int      @default(70)
  excellentThreshold     Int      @default(90)
  goodThreshold          Int      @default(80)
  
  isActive               Boolean  @default(true)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  circle Circle @relation(fields: [circleId], references: [id], onDelete: Cascade)

  @@map("matching_weights")
}

// ============================================
// GAMIFICATION (Updated)
// ============================================

enum PointsActionType {
  POST_CREATED
  POST_APPROVED
  POST_FEATURED
  BAZZZZ_GIVEN
  BAZZZZ_RECEIVED
  COMMENT_POSTED
  CIRCLE_JOINED
  QUESTION_ANSWERED
  PROFILE_COMPLETED
  DAILY_LOGIN
  REFERRAL
}

model PointsLog {
  id            String            @id @default(uuid())
  userId        String
  actionType    PointsActionType
  points        Int
  referenceId   String?
  referenceType String?
  description   String?
  createdAt     DateTime          @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("points_logs")
}

// ... (Rest of the models remain the same)
```

---

<a name="section-6"></a>
# 6️⃣ نظام الأسئلة الديناميكية - التفصيل التقني

## 🎯 خوارزمية اختيار السؤال المناسب

### Algorithm: Question Selection Engine

```typescript
// services/questionSelection.service.ts

interface QuestionSelectionContext {
  userId: string;
  roomId: string | null;
  trigger: 'entry' | 'exit' | 'engagement';
  userBehavior?: UserRoomBehavior;
  previousAnswers?: QuestionResponse[];
}

interface SelectedQuestion {
  question: Question;
  priority: number;
  reason: string;
}

export class QuestionSelectionService {
  
  /**
   * اختيار الأسئلة المناسبة بناءً على السياق
   */
  async selectQuestions(
    context: QuestionSelectionContext,
    maxQuestions: number = 3
  ): Promise<SelectedQuestion[]> {
    
    // 1. جلب كل الأسئلة المحتملة
    const candidateQuestions = await this.getCandidateQuestions(context);
    
    // 2. فلترة الأسئلة حسب الشروط
    const eligibleQuestions = await this.filterByConditions(
      candidateQuestions,
      context
    );
    
    // 3. حساب أولوية كل سؤال
    const prioritizedQuestions = await this.prioritizeQuestions(
      eligibleQuestions,
      context
    );
    
    // 4. اختيار أفضل الأسئلة
    return prioritizedQuestions.slice(0, maxQuestions);
  }
  
  /**
   * جلب الأسئلة المرشحة
   */
  private async getCandidateQuestions(
    context: QuestionSelectionContext
  ): Promise<Question[]> {
    
    const { trigger, roomId } = context;
    
    // حسب نوع المحفز
    const categoryMap = {
      entry: 'ENTRY',
      exit: 'EXIT',
      engagement: 'ENGAGEMENT'
    };
    
    return await prisma.question.findMany({
      where: {
        category: categoryMap[trigger],
        roomId: roomId || null,
        isActive: true
      },
      include: {
        conditions: true
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });
  }
  
  /**
   * فلترة الأسئلة حسب الشروط
   */
  private async filterByConditions(
    questions: Question[],
    context: QuestionSelectionContext
  ): Promise<Question[]> {
    
    const eligibleQuestions: Question[] = [];
    
    for (const question of questions) {
      const isEligible = await this.checkQuestionEligibility(
        question,
        context
      );
      
      if (isEligible) {
        eligibleQuestions.push(question);
      }
    }
    
    return eligibleQuestions;
  }
  
  /**
   * فحص أهلية سؤال معين
   */
  private async checkQuestionEligibility(
    question: Question,
    context: QuestionSelectionContext
  ): Promise<boolean> {
    
    // إذا لم يكن هناك شروط، السؤال مؤهل
    if (!question.conditions || question.conditions.length === 0) {
      return true;
    }
    
    // فحص كل شرط
    for (const condition of question.conditions) {
      const conditionMet = await this.evaluateCondition(
        condition,
        context
      );
      
      // إذا AND logic وشرط غير محقق
      if (condition.logicOperator === 'AND' && !conditionMet) {
        return false;
      }
      
      // إذا OR logic وشرط محقق
      if (condition.logicOperator === 'OR' && conditionMet) {
        return true;
      }
    }
    
    return true;
  }
  
  /**
   * تقييم شرط واحد
   */
  private async evaluateCondition(
    condition: QuestionCondition,
    context: QuestionSelectionContext
  ): Promise<boolean> {
    
    const { conditionType, conditionValue } = condition;
    const value = conditionValue as any;
    
    switch (conditionType) {
      case 'min_visits':
        const visitCount = context.userBehavior?.visitCount || 0;
        return visitCount >= (value.min_visits || 0);
      
      case 'max_visits':
        const visits = context.userBehavior?.visitCount || 0;
        return visits <= (value.max_visits || 999);
      
      case 'entry_intent':
        const intent = context.userBehavior?.entryIntent;
        return value.entry_intent.includes(intent);
      
      case 'has_not_answered':
        const answeredQuestions = context.previousAnswers?.map(
          a => a.questionId
        ) || [];
        const requiredQuestions = value.has_not_answered || [];
        return !requiredQuestions.some(
          q => answeredQuestions.includes(q)
        );
      
      case 'behavior_trigger':
        return await this.evaluateBehaviorTrigger(
          value,
          context
        );
      
      default:
        return true;
    }
  }
  
  /**
   * تقييم محفز السلوك
   */
  private async evaluateBehaviorTrigger(
    trigger: any,
    context: QuestionSelectionContext
  ): Promise<boolean> {
    
    const behavior = context.userBehavior;
    if (!behavior) return false;
    
    switch (trigger.type) {
      case 'high_engagement':
        return behavior.postsEngaged >= (trigger.threshold || 5);
      
      case 'low_engagement':
        return behavior.postsEngaged < (trigger.threshold || 2);
      
      case 'specific_topic_interest':
        const topics = behavior.favoriteTopics || [];
        return topics.includes(trigger.topic);
      
      default:
        return false;
    }
  }
  
  /**
   * ترتيب الأسئلة حسب الأولوية
   */
  private async prioritizeQuestions(
    questions: Question[],
    context: QuestionSelectionContext
  ): Promise<SelectedQuestion[]> {
    
    const prioritized: SelectedQuestion[] = [];
    
    for (const question of questions) {
      const priority = this.calculateQuestionPriority(
        question,
        context
      );
      
      prioritized.push({
        question,
        priority,
        reason: this.getSelectionReason(question, context)
      });
    }
    
    // ترتيب تنازلي حسب الأولوية
    return prioritized.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * حساب أولوية السؤال
   */
  private calculateQuestionPriority(
    question: Question,
    context: QuestionSelectionContext
  ): number {
    
    let priority = 0;
    
    // الأهمية الأساسية
    const importanceScores = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    };
    priority += importanceScores[question.importance] || 50;
    
    // أسئلة الغرفة أولوية أعلى
    if (question.roomId === context.roomId) {
      priority += 20;
    }
    
    // الأسئلة غير القابلة للتخطي أولوية أعلى
    if (!question.isSkippable) {
      priority += 15;
    }
    
    // ترتيب العرض
    if (question.displayOrder) {
      priority += (100 - question.displayOrder);
    }
    
    return priority;
  }
  
  /**
   * سبب اختيار السؤال
   */
  private getSelectionReason(
    question: Question,
    context: QuestionSelectionContext
  ): string {
    
    const reasons: string[] = [];
    
    if (question.roomId === context.roomId) {
      reasons.push('specific to this room');
    }
    
    if (question.importance === 'critical') {
      reasons.push('critical for profiling');
    }
    
    if (!question.isSkippable) {
      reasons.push('required question');
    }
    
    return reasons.join(', ') || 'general profiling';
  }
}
```

---

<a name="section-7"></a>
# 7️⃣ واجهات برمجة التطبيقات الكاملة

## 🔌 Dynamic Profiling APIs

### GET /api/questions/next
```typescript
/**
 * جلب السؤال/الأسئلة التالية للمستخدم
 */

// Request
GET /api/questions/next?
  trigger=entry&
  roomId=room-123&
  maxQuestions=3

Headers:
  Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "q-456",
        "questionText": "ما الذي يجلبك لغرفة أطفالنا؟",
        "questionType": "single_choice",
        "options": [
          {
            "id": "opt1",
            "text": "لدي أطفال وأبحث عن نصائح",
            "value": "has_children"
          },
          {
            "id": "opt2",
            "text": "زوجتي حامل",
            "value": "expecting"
          },
          {
            "id": "opt3",
            "text": "مهتم مهنياً",
            "value": "professional"
          },
          {
            "id": "opt4",
            "text": "حب اطلاع",
            "value": "casual"
          }
        ],
        "isSkippable": true,
        "pointsReward": 2,
        "priority": 95,
        "reason": "specific to this room, critical for profiling"
      }
    ],
    "sessionId": "session-789",
    "totalQuestions": 1,
    "canSkipAll": true
  }
}
```

### POST /api/questions/respond
```typescript
/**
 * تسجيل إجابة على سؤال
 */

// Request
POST /api/questions/respond

Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "questionId": "q-456",
  "sessionId": "session-789",
  "roomId": "room-123",
  "response": {
    "selectedOption": "professional"
  },
  "timeToAnswer": 5
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "response": {
      "id": "response-321",
      "questionId": "q-456",
      "pointsEarned": 2
    },
    "nextQuestions": [
      {
        "id": "q-789",
        "questionText": "ما مجال عملك؟",
        "questionType": "single_choice",
        "options": [...]
      }
    ],
    "profileUpdated": true,
    "newProfileCompletion": 35
  }
}
```

### GET /api/users/:userId/profile/psychological
```typescript
/**
 * جلب الملف النفسي للمستخدم
 */

// Request
GET /api/users/user-123/profile/psychological

Headers:
  Authorization: Bearer <token>

// Response (200 OK)
{
  "success": true,
  "data": {
    "userId": "user-123",
    "demographics": {
      "hasChildren": false,
      "profession": "fitness_trainer",
      "professionCategory": "health_fitness",
      "maritalStatus": "single"
    },
    "personalityDimensions": {
      "openness": 75,
      "conscientiousness": 85,
      "extraversion": 80,
      "agreeableness": 90,
      "neuroticism": 45
    },
    "roomBehaviors": [
      {
        "roomId": "children",
        "roomName": "أطفالنا",
        "visitCount": 3,
        "entryIntent": "professional",
        "avgTimeSpent": 12,
        "interestLevel": "high",
        "topicPriorities": [
          "children_sports",
          "child_nutrition"
        ]
      }
    ],
    "inferredInterests": [
      {
        "topic": "children_fitness",
        "confidence": 95,
        "sources": ["professional_declaration", "browsing_behavior"]
      },
      {
        "topic": "parenting",
        "confidence": 70,
        "sources": ["room_visits", "planning_children"]
      }
    ],
    "profileCompletion": 85,
    "lastUpdated": "2026-01-29T14:30:00Z"
  }
}
```

### POST /api/profiling/update-behavior
```typescript
/**
 * تحديث سلوك المستخدم في غرفة
 */

// Request
POST /api/profiling/update-behavior

Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "roomId": "room-123",
  "behaviorUpdate": {
    "timeSpent": 480, // seconds
    "postsViewed": 12,
    "postsEngaged": 3,
    "action": "view" // or "engage", "create"
  }
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "behavior": {
      "roomId": "room-123",
      "visitCount": 3,
      "totalTimeSpent": 1920,
      "avgTimePerVisit": 640,
      "postsViewed": 45,
      "postsEngaged": 8
    },
    "profileUpdated": true,
    "newInterests": [
      {
        "topic": "child_nutrition",
        "confidence": 65
      }
    ]
  }
}
```

---

<a name="section-8"></a>
# 8️⃣ خوارزميات المطابقة والتحليل

## 🧮 Hybrid Matching Algorithm (40% Room + 60% Personality)

```typescript
// services/matching.service.ts

interface MatchingConfig {
  roomQuestionsWeight: number; // 0.40 (40%)
  personalityWeight: number;    // 0.60 (60%)
  minCompatibility: number;      // 70%
}

interface MatchingScore {
  userId: string;
  name: string;
  avatar: string | null;
  totalCompatibility: number;
  roomCompatibility: number;
  personalityCompatibility: number;
  breakdown: {
    roomQuestions: { score: number; weight: number };
    personality: {
      score: number;
      weight: number;
      dimensions: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
      };
    };
  };
  sharedInterests: string[];
  bio: string | null;
}

export class HybridMatchingService {
  
  /**
   * إيجاد المطابقات لمستخدم في دائرة
   */
  async findMatches(
    circleId: string,
    userId: string,
    limit: number = 10
  ): Promise<MatchingScore[]> {
    
    // 1. جلب إعدادات المطابقة للدائرة
    const config = await this.getMatchingConfig(circleId);
    
    // 2. جلب بيانات المستخدم
    const userMember = await this.getUserMemberData(circleId, userId);
    const userProfile = await this.getUserPsychProfile(userId);
    
    // 3. جلب كل الأعضاء الآخرين
    const otherMembers = await this.getOtherMembers(circleId, userId);
    
    // 4. حساب المطابقة لكل عضو
    const matches: MatchingScore[] = [];
    
    for (const member of otherMembers) {
      const memberProfile = await this.getUserPsychProfile(member.userId);
      
      const score = await this.calculateHybridMatch(
        userMember,
        userProfile,
        member,
        memberProfile,
        config
      );
      
      // فقط إذا التوافق >= الحد الأدنى
      if (score.totalCompatibility >= config.minCompatibility) {
        matches.push(score);
      }
    }
    
    // 5. ترتيب وإرجاع أفضل المطابقات
    return matches
      .sort((a, b) => b.totalCompatibility - a.totalCompatibility)
      .slice(0, limit);
  }
  
  /**
   * حساب المطابقة الهجينة
   */
  private async calculateHybridMatch(
    user1Member: CircleMember,
    user1Profile: UserPsychologicalProfile,
    user2Member: CircleMember,
    user2Profile: UserPsychologicalProfile,
    config: MatchingConfig
  ): Promise<MatchingScore> {
    
    // 1. حساب توافق أسئلة الغرفة (40%)
    const roomScore = this.calculateRoomQuestionsCompatibility(
      user1Member.answers,
      user2Member.answers
    );
    
    // 2. حساب توافق الشخصية (60%)
    const personalityScore = this.calculatePersonalityCompatibility(
      user1Profile,
      user2Profile
    );
    
    // 3. حساب التوافق الإجمالي
    const totalCompatibility = 
      (roomScore * config.roomQuestionsWeight) +
      (personalityScore.overall * config.personalityWeight);
    
    // 4. جلب الاهتمامات المشتركة
    const sharedInterests = await this.getSharedInterests(
      user1Member.userId,
      user2Member.userId
    );
    
    // 5. بناء النتيجة
    return {
      userId: user2Member.userId,
      name: user2Member.user.name,
      avatar: user2Member.user.avatar,
      totalCompatibility: Math.round(totalCompatibility),
      roomCompatibility: Math.round(roomScore),
      personalityCompatibility: Math.round(personalityScore.overall),
      breakdown: {
        roomQuestions: {
          score: Math.round(roomScore),
          weight: config.roomQuestionsWeight
        },
        personality: {
          score: Math.round(personalityScore.overall),
          weight: config.personalityWeight,
          dimensions: personalityScore.dimensions
        }
      },
      sharedInterests,
      bio: user2Member.user.profile?.bio || null
    };
  }
  
  /**
   * حساب توافق أسئلة الغرفة
   */
  private calculateRoomQuestionsCompatibility(
    answers1: any,
    answers2: any
  ): number {
    
    const questions = Object.keys(answers1);
    let totalScore = 0;
    let questionCount = questions.length;
    
    for (const questionId of questions) {
      const answer1 = answers1[questionId];
      const answer2 = answers2[questionId];
      
      if (!answer2) continue;
      
      const score = this.compareAnswers(answer1, answer2);
      totalScore += score;
    }
    
    return questionCount > 0
      ? (totalScore / questionCount) * 100
      : 0;
  }
  
  /**
   * مقارنة إجابتين
   */
  private compareAnswers(answer1: any, answer2: any): number {
    
    // إذا كانت مصفوفات (اختيارات متعددة)
    if (Array.isArray(answer1) && Array.isArray(answer2)) {
      const intersection = answer1.filter(a => answer2.includes(a));
      const union = [...new Set([...answer1, ...answer2])];
      return intersection.length / union.length;
    }
    
    // إذا كانت نصوص (اختيار واحد)
    if (typeof answer1 === 'string' && typeof answer2 === 'string') {
      return answer1 === answer2 ? 1 : 0;
    }
    
    // إذا كانت أرقام (تقييمات)
    if (typeof answer1 === 'number' && typeof answer2 === 'number') {
      const diff = Math.abs(answer1 - answer2);
      const maxDiff = 5; // assuming 1-5 scale
      return 1 - (diff / maxDiff);
    }
    
    return 0;
  }
  
  /**
   * حساب توافق الشخصية (Big Five)
   */
  private calculatePersonalityCompatibility(
    profile1: UserPsychologicalProfile,
    profile2: UserPsychologicalProfile
  ): {
    overall: number;
    dimensions: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
  } {
    
    // حساب التوافق لكل بُعد (كلما كان الفرق أقل، كلما كان التوافق أعلى)
    const openness = this.calculateDimensionCompatibility(
      profile1.opennessScore,
      profile2.opennessScore
    );
    
    const conscientiousness = this.calculateDimensionCompatibility(
      profile1.conscientiousnessScore,
      profile2.conscientiousnessScore
    );
    
    const extraversion = this.calculateDimensionCompatibility(
      profile1.extraversionScore,
      profile2.extraversionScore
    );
    
    const agreeableness = this.calculateDimensionCompatibility(
      profile1.agreeablenessScore,
      profile2.agreeablenessScore
    );
    
    const neuroticism = this.calculateDimensionCompatibility(
      profile1.neuroticismScore,
      profile2.neuroticismScore
    );
    
    // المتوسط الموزون (يمكن تخصيص الأوزان)
    const weights = {
      openness: 0.20,
      conscientiousness: 0.20,
      extraversion: 0.20,
      agreeableness: 0.20,
      neuroticism: 0.20
    };
    
    const overall = 
      (openness * weights.openness) +
      (conscientiousness * weights.conscientiousness) +
      (extraversion * weights.extraversion) +
      (agreeableness * weights.agreeableness) +
      (neuroticism * weights.neuroticism);
    
    return {
      overall,
      dimensions: {
        openness,
        conscientiousness,
        extraversion,
        agreeableness,
        neuroticism
      }
    };
  }
  
  /**
   * حساب توافق بُعد واحد
   */
  private calculateDimensionCompatibility(
    score1: number,
    score2: number
  ): number {
    
    // الفرق بين الدرجتين
    const difference = Math.abs(score1 - score2);
    
    // أقصى فرق ممكن = 100
    const maxDifference = 100;
    
    // التوافق = 100 - نسبة الفرق
    const compatibility = 100 - ((difference / maxDifference) * 100);
    
    return Math.max(0, compatibility);
  }
  
  /**
   * جلب الاهتمامات المشتركة
   */
  private async getSharedInterests(
    user1Id: string,
    user2Id: string
  ): Promise<string[]> {
    
    const user1Interests = await prisma.inferredInterest.findMany({
      where: { userId: user1Id, confidenceScore: { gte: 70 } },
      select: { interestTopic: true }
    });
    
    const user2Interests = await prisma.inferredInterest.findMany({
      where: { userId: user2Id, confidenceScore: { gte: 70 } },
      select: { interestTopic: true }
    });
    
    const topics1 = user1Interests.map(i => i.interestTopic);
    const topics2 = user2Interests.map(i => i.interestTopic);
    
    return topics1.filter(t => topics2.includes(t));
  }
}
```

---

<a name="section-9"></a>
# 9️⃣ نظام بناء الملف النفسي

## 🧠 Psychological Profile Builder

```typescript
// services/profileBuilder.service.ts

export class ProfileBuilderService {
  
  /**
   * تحديث الملف النفسي بناءً على إجابة
   */
  async updateProfileFromResponse(
    userId: string,
    questionResponse: QuestionResponse
  ): Promise<void> {
    
    const profile = await this.getOrCreateProfile(userId);
    
    // تحديث حسب نوع السؤال
    const question = await prisma.question.findUnique({
      where: { id: questionResponse.questionId }
    });
    
    if (!question) return;
    
    // استنتاج البيانات من الإجابة
    await this.inferFromResponse(
      profile,
      question,
      questionResponse.responseValue
    );
    
    // تحديث نسبة اكتمال الملف
    await this.updateCompletionPercentage(userId);
  }
  
  /**
   * تحديث الملف من السلوك
   */
  async updateProfileFromBehavior(
    userId: string,
    roomId: string,
    behavior: Partial<UserRoomBehavior>
  ): Promise<void> {
    
    const profile = await this.getOrCreateProfile(userId);
    
    // تحديث درجات الأبعاد النفسية بناءً على السلوك
    
    // 1. Openness (الانفتاح)
    if (behavior.entryIntent === 'casual') {
      await this.incrementDimension(userId, 'openness', 2);
    }
    
    // 2. Conscientiousness (الضمير)
    if (behavior.avgTimePerVisit && behavior.avgTimePerVisit > 300) { // 5+ minutes
      await this.incrementDimension(userId, 'conscientiousness', 1);
    }
    
    // 3. Extraversion (الانبساط)
    if (behavior.commentsCount && behavior.commentsCount > 5) {
      await this.incrementDimension(userId, 'extraversion', 3);
    }
    
    // 4. Agreeableness (الطيبة)
    // يحتاج تحليل محتوى التعليقات (sentiment analysis)
    
    // 5. Neuroticism (العصابية)
    // يحتاج تحليل نمط السلوك عبر الزمن
  }
  
  /**
   * استنتاج المعلومات من الإجابة
   */
  private async inferFromResponse(
    profile: UserPsychologicalProfile,
    question: Question,
    responseValue: any
  ): Promise<void> {
    
    // استنتاجات ديموغرافية
    if (question.questionTextAr.includes('أطفال') ||
        question.questionTextAr.includes('طفل')) {
      
      if (responseValue.selectedOption === 'has_children') {
        await prisma.userPsychologicalProfile.update({
          where: { userId: profile.userId },
          data: { hasChildren: true }
        });
      } else if (responseValue.selectedOption === 'planning') {
        await prisma.userPsychologicalProfile.update({
          where: { userId: profile.userId },
          data: { hasChildren: false }
        });
      }
    }
    
    // استنتاج المهنة
    if (question.questionTextAr.includes('مجال عملك') ||
        question.questionTextAr.includes('تخصصك')) {
      
      const profession = responseValue.selectedOption ||
                         responseValue.text;
      
      await prisma.userPsychologicalProfile.update({
        where: { userId: profile.userId },
        data: {
          profession,
          professionCategory: this.categorizeProfession(profession)
        }
      });
      
      // إضافة اهتمام مستنتج
      await this.addInferredInterest(
        profile.userId,
        profession,
        'professional',
        80,
        ['professional_declaration']
      );
    }
  }
  
  /**
   * زيادة درجة بُعد نفسي
   */
  private async incrementDimension(
    userId: string,
    dimension: string,
    points: number
  ): Promise<void> {
    
    const profile = await prisma.userPsychologicalProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) return;
    
    const dimensionMap = {
      openness: 'opennessScore',
      conscientiousness: 'conscientiousnessScore',
      extraversion: 'extraversionScore',
      agreeableness: 'agreeablenessScore',
      neuroticism: 'neuroticismScore'
    };
    
    const field = dimensionMap[dimension];
    if (!field) return;
    
    const currentScore = profile[field] || 50;
    const newScore = Math.min(100, currentScore + points);
    
    await prisma.userPsychologicalProfile.update({
      where: { userId },
      data: { [field]: newScore }
    });
  }
  
  /**
   * إضافة اهتمام مستنتج
   */
  private async addInferredInterest(
    userId: string,
    topic: string,
    category: string,
    confidence: number,
    sources: string[]
  ): Promise<void> {
    
    await prisma.inferredInterest.upsert({
      where: {
        userId_interestTopic: {
          userId,
          interestTopic: topic
        }
      },
      update: {
        confidenceScore: confidence,
        evidenceSources: {
          sources: sources.map(s => ({
            type: s,
            weight: 100 / sources.length,
            date: new Date().toISOString()
          }))
        },
        lastUpdated: new Date()
      },
      create: {
        userId,
        interestTopic: topic,
        interestCategory: category,
        confidenceScore: confidence,
        evidenceSources: {
          sources: sources.map(s => ({
            type: s,
            weight: 100 / sources.length,
            date: new Date().toISOString()
          }))
        }
      }
    });
  }
  
  /**
   * تحديث نسبة اكتمال الملف
   */
  private async updateCompletionPercentage(
    userId: string
  ): Promise<void> {
    
    const profile = await prisma.userPsychologicalProfile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            questionResponses: true,
            roomBehaviors: true,
            inferredInterests: true
          }
        }
      }
    });
    
    if (!profile) return;
    
    let completionScore = 0;
    
    // الديموغرافيا (20%)
    if (profile.hasChildren !== null) completionScore += 5;
    if (profile.maritalStatus) completionScore += 5;
    if (profile.profession) completionScore += 5;
    if (profile.educationLevel) completionScore += 5;
    
    // الإجابات (30%)
    const answersCount = profile.user.questionResponses.length;
    completionScore += Math.min(30, answersCount * 2);
    
    // السلوك في الغرف (20%)
    const roomsVisited = profile.user.roomBehaviors.length;
    completionScore += Math.min(20, roomsVisited * 2.5);
    
    // الاهتمامات المستنتجة (15%)
    const interestsCount = profile.user.inferredInterests.filter(
      i => i.confidenceScore >= 70
    ).length;
    completionScore += Math.min(15, interestsCount * 3);
    
    // الأبعاد النفسية (15%)
    const dimensionsSet = [
      profile.opennessScore,
      profile.conscientiousnessScore,
      profile.extraversionScore,
      profile.agreeablenessScore,
      profile.neuroticismScore
    ].filter(score => score !== 50).length;
    
    completionScore += Math.min(15, dimensionsSet * 3);
    
    await prisma.userPsychologicalProfile.update({
      where: { userId },
      data: {
        profileCompletionPct: Math.min(100, Math.round(completionScore)),
        lastProfilingUpdate: new Date()
      }
    });
  }
}
```

---

## ⏱️ لقد وصلنا لحد الطول، سأكمل في ملف ثانٍ...

**هل تريد:**
1. ✅ حفظ هذا الجزء الآن
2. ✅ إنشاء الجزء الثاني (واجهات المستخدم + خطة التطوير + أمثلة كود)
3. ✅ دمج كل شيء في ملف PDF نهائي شامل

**أخبرني وأكمل! 🚀**
