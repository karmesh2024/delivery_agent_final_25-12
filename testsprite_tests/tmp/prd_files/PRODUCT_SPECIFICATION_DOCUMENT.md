# Karmesh Delivery Agent Dashboard — Product Specification Document

## 1. Product Overview

**Product Name:** Karmesh Delivery Agent Dashboard  
**Version:** 1.0  
**Platform:** Web Application (Next.js 15 App Router)  
**Language Direction:** RTL (Arabic UI) with LTR code  
**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix UI (shadcn/ui), Redux Toolkit, Supabase (PostgreSQL), Prisma ORM, React Hook Form + Zod  
**Deployment:** Vercel  
**Target Users:** Company administrators, warehouse managers, delivery agents supervisors, and operations managers  
**Purpose:** A comprehensive operations management dashboard for a waste-recycling and delivery company ("Karmesh"). It manages delivery agents, orders, waste materials catalog, pricing, warehouses, customers, financial/points systems, supplier management, industrial partnerships, and includes an embedded AI assistant (Zoon OS).

---

## 2. Authentication & Authorization

### 2.1 Login Page (`/login`)
- **Purpose:** Authenticate administrators to access the dashboard.
- **Features:**
  - Email + Password login form.
  - Email confirmation detection — if the email is not confirmed, the system displays a warning and a "Resend Confirmation Link" button.
  - "Forgot Password" link redirecting to `/forgot-password`.
  - "Register" link redirecting to `/register`.
  - Loading state spinner during authentication.
  - Auto-redirect to `/` (dashboard) on successful login.
  - Auto-redirect to `/login` if unauthenticated user tries to access protected pages.
- **Expected Behavior:**
  - Valid credentials → redirect to dashboard.
  - Invalid credentials → display error alert.
  - Unconfirmed email → display confirmation prompt with resend option.

### 2.2 Registration Page (`/register`)
- **Purpose:** Allow new admin users to create accounts.
- **Features:**
  - Registration form with validation (Zod schema).
  - Email confirmation flow after registration.

### 2.3 Forgot Password (`/forgot-password`)
- **Purpose:** Allow users to reset their password via email.

### 2.4 Reset Password (`/reset-password`)
- **Purpose:** Set a new password after email verification.

### 2.5 Middleware Protection
- **Protected API Routes:** `/api/admin/*`, `/api/warehouse/*`, `/api/payment/*`, `/api/zoon/*`
- **Protected Page Routes:** `/admin/*`, `/warehouse/*`, `/payment/*`
- **Security Features:**
  - Rate limiting (auth: 5 req/min, sensitive: 10 req/min, general: 100 req/min).
  - Suspicious User-Agent detection (bots, crawlers, scrapers — production only).
  - Blocked IP list (configurable).
  - Suspicious path detection (`.env`, `.git`, `../`, etc.).
  - JWT token validation via Supabase Auth.
  - Audit logging for unauthorized access attempts.

---

## 3. Main Dashboard (`/` — Home Page)

### 3.1 Key Metrics Cards
- **Delivery Agents:** Total count with online agents highlight.
- **Avg. Delivery Time:** Average delivery time in minutes.
- **Pending Orders:** Number of orders awaiting processing.
- **Delivered Today:** Number of successfully delivered orders today.

### 3.2 Zoon OS Discovery Feed
- **Purpose:** Proactive AI intelligence feed embedded on the dashboard.
- **Features:** Displays AI-generated insights, alerts, and recommendations from Zoon OS.

### 3.3 Delivery Agents Section
- **Agent Status Filter:** Filter agents by status: All, Online, Busy, Offline.
- **Agent Grid View:** Visual grid displaying agent cards with status indicators.
- **Agent Detail:** Clicking an agent opens a detail card with full agent information.

### 3.4 Interactive Map
- **Dual Map Mode:**
  - "Agent Locations" — Shows positions of delivery agents on a Leaflet map.
  - "Delivery Locations" — Shows delivery order locations on the map.
- **Toggle Button:** Switch between agent and delivery location map views.
- **Click Interactions:** Click on agent markers or delivery location markers to view details.

### 3.5 Recent Orders Section
- **Order Filter Tabs:** All Orders, Pending, In Progress, Delivered, Canceled (with counts).
- **Order Cards:** Display order ID, date, customer name, address, item count, total amount, and status badge.
- **Order Detail:** Clicking an order card opens a detail view.

### 3.6 Unregistered Customers Section
- **Purpose:** Highlight customers who have transacted with approved agents but don't have registered accounts.
- **Navigation:** "View All" and "Manage Unregistered Customers" buttons navigate to `/unregistered-customers`.

### 3.7 Product Types Management Card
- **Purpose:** Quick access to manage product types and dynamic attributes.
- **Navigation:** Links to `/settings/product-types`.

---

## 4. Agent Management

### 4.1 Agents Page (`/agents`)
- **Purpose:** Full management of delivery agents (delivery boys).
- **Features:**
  - List all registered delivery agents.
  - View agent details (name, phone, status, location, performance).
  - Filter and search agents.

### 4.2 Approved Agents (`/approved-agents`)
- **Purpose:** Manage approved/verified agents.
- **Features:**
  - View approved agents list with cards.
  - Agent approval workflow.
  - Delete/remove approved agents.
  - Agent performance tracking.

---

## 5. Order Management

### 5.1 Orders Page (`/orders`)
- **Purpose:** Comprehensive order management.
- **Features:**
  - List all delivery orders with filtering by status.
  - Order details with items, amounts, and delivery info.
  - Status tracking (Pending → In Progress → Delivered / Canceled).

### 5.2 Order Tracking (`/order-tracking`)
- **Purpose:** Real-time tracking of delivery orders.

---

## 6. Waste Management (`/waste-management`)

### 6.1 Purpose
Manage the waste materials catalog — categories, subcategories, and products for recycling.

### 6.2 Features
- **Waste Categories Management:** Create, edit, delete waste material categories.
- **Subcategories Management:** Manage subcategories within each waste category.
- **Products Management:** Add/edit waste products with properties (weight, pricing mode, points, images).
- **Pricing Modes:** Support for weight-based and piece-based pricing.
- **Catalog Sync:** Initial catalog synchronization tool.
- **Industrial Partners Integration:** Connect waste products to industrial partners for purchase.

---

## 7. Product Catalog Management

### 7.1 Product Categories (`/product-categories`)
- **Purpose:** Manage hierarchical product categories.
- **Features:**
  - CRUD operations on main categories.
  - CRUD operations on subcategories.
  - Category-product associations.
  - Drag-and-drop ordering.

### 7.2 Products Page
- **Purpose:** Manage individual products.
- **Features:**
  - Product listing with search and filter.
  - Product creation/editing with dynamic attributes.
  - Product type assignment.
  - Image management.

### 7.3 Product Requests (`/product-categories` related)
- **Purpose:** Handle requests for new products from agents or customers.

---

## 8. Pricing & Exchange

### 8.1 Pricing Management
- **Purpose:** Set and manage prices for waste materials.
- **Features:**
  - Price calculator per product.
  - Weight-based vs piece-based pricing configuration.
  - Price approval workflow.
  - Operational product edit dialog.

### 8.2 Exchange Dashboard
- **Purpose:** Dynamic market-style pricing for waste materials.
- **Features:**
  - **Live Price Table:** Real-time price display for all waste materials.
  - **Price Ticker:** Animated scrolling ticker showing current waste material prices (stock-exchange style).
  - **Price Sparklines:** Mini charts showing price history trends.
  - **Quick Bid Dialog:** Allow quick price bids/adjustments.
  - **Receiving Verification Dialog:** Verify received material quantities and quality.
  - **Price Approval Details Dialog:** Review and approve price changes.

---

## 9. Warehouse Management (`/warehouse-management`)

### 9.1 Purpose
Manage physical warehouse inventory and operations.

### 9.2 Features
- Warehouse listing and details.
- Inventory tracking per warehouse.
- Stock levels management.
- Material receiving and verification.
- Warehouse-to-agent assignments.

---

## 10. Financial Management (`/financial-management`)

### 10.1 Purpose
Manage the rewards points system and financial tracking.

### 10.2 Features
- **Points System:** Karmesh rewards points management (non-monetary).
  - Points earning rules.
  - Points redemption for rewards/discounts.
  - Points transaction history (activity log).
- **Financial Dashboard:** Overview of financial metrics.
- **Withdrawal Limits:** Configure point withdrawal/redemption limits.
- **Profitability Analysis:** Track profitability metrics.

---

## 11. Payments (`/payments`)

### 11.1 Purpose
Manage payment operations and payment tracking.

### 11.2 Features
- Payment records listing.
- Payment status tracking.
- Payment method management.
- Integration with the financial management system.

---

## 12. Customer Management (`/customers`)

### 12.1 Purpose
Manage registered customer accounts.

### 12.2 Features
- Customer listing with search and filter.
- Customer profile details.
- Customer order history.
- Customer points balance.

### 12.3 Unregistered Customers (`/unregistered-customers`)
- List customers without accounts who interacted with agents.
- Tools to convert to registered customers.

---

## 13. Store Management (`/store-management`)

### 13.1 Purpose
Manage partner stores in the Karmesh ecosystem.

### 13.2 Features
- Store listing and details.
- Store product catalog management.
- Store points rules configuration.
- Store order management.

### 13.3 Store Orders
- Order processing for store-based transactions.
- Order status tracking.

---

## 14. Trip Management (`/trips`)

### 14.1 Purpose
Manage delivery trips and routes.

### 14.2 Features
- Trip creation and assignment to agents.
- Trip status tracking (active, completed, canceled).
- Trip route visualization.
- Trip performance metrics (delivery time, distance).

---

## 15. Supplier Management (`/supplier-management`)

### 15.1 Purpose
Manage suppliers who provide materials or services to Karmesh.

### 15.2 Features
- Supplier listing and profiles.
- Supplier order management.
- Purchase tracking.
- Supplier performance evaluation.

---

## 16. Purchasing (`/purchasing` related)

### 16.1 Purpose
Manage purchasing operations for waste materials from approved agents and suppliers.

### 16.2 Features
- Purchase order creation.
- Purchase receiving and verification.
- Purchase history and reporting.

---

## 17. Industrial Partners (`/industrial-partners`)

### 17.1 Purpose
Manage industrial partners who buy processed waste materials.

### 17.2 Features
- Partner listing and profiles.
- Partner order management.
- Material delivery to partners.
- Partnership contract tracking.

---

## 18. Mapping & Geolocation (`/map`, `/map-view`)

### 18.1 Purpose
Interactive map features for the dashboard using Leaflet.

### 18.2 Features
- **Unified Map Component:** Displays agents and delivery locations.
- **Agent Location Tracking:** Real-time agent positions.
- **Delivery Location Display:** Order delivery destinations.
- **Zone Drawing:** Draw geographical zones/regions on the map (using Leaflet Draw).
- **Click Interactions:** Click markers for details.

---

## 19. Analytics (`/analytics`)

### 19.1 Purpose
Business analytics and reporting dashboard.

### 19.2 Features
- **Charts & Graphs:** Visual analytics using Chart.js and Recharts.
- **Performance Metrics:** Agent performance, delivery times, order completion rates.
- **Trend Analysis:** Historical data trends.
- **Exportable Reports:** Generate PDF/DOCX/Excel reports.

---

## 20. Administration

### 20.1 Admin Management (`/admins`)
- **Purpose:** Manage dashboard administrators.
- **Features:**
  - Admin listing.
  - Admin role assignment.
  - Admin CRUD operations.

### 20.2 Permissions & Roles (`/permissions`)
- **Purpose:** Role-based access control.
- **Features:**
  - Permissions management (granular permissions per feature).
  - Role creation and assignment.
  - Permission-based UI rendering.

### 20.3 HR Management
- **Purpose:** Human resources management for company staff.
- **Features:**
  - Employee records.
  - HR workflows.

---

## 21. Messaging & Communication (`/messages`)

### 21.1 Purpose
Internal messaging system for communication between admins, agents, and support.

### 21.2 Features
- Message listing and threads.
- Send/receive messages.
- Message categorization.
- Notification integration.

---

## 22. Support System (`/support`)

### 22.1 Purpose
Customer and agent support ticket management.

### 22.2 Features
- Support ticket listing.
- Ticket creation and assignment.
- Ticket status tracking (open, in progress, resolved, closed).
- Support FAQ/knowledge base.

---

## 23. Settings (`/settings`)

### 23.1 Purpose
Application-wide settings management.

### 23.2 Features
- **Product Types:** Manage product type definitions with dynamic attributes.
- **Geographical Settings:** Countries, provinces, cities, regions management.
- **Application Preferences:** Theme, notification, and display settings.
- **Target Audiences:** Define and manage target audience segments.

---

## 24. Zoon OS — AI Assistant System

### 24.1 Purpose
An embedded sovereign AI operating system (Zoon OS) that provides intelligent assistance to dashboard operators.

### 24.2 Architecture
- **Routing Layer:** Intent guard for routing user queries to appropriate handlers.
- **Memory System:** Episodic memory with auto-save for context persistence across sessions.
- **Tool Registry:** Registered tools for the AI to execute actions.
- **Skills System:** Modular AI skills for different operational domains.
- **Execution Engine:** Processes AI tool calls and function executions.

### 24.3 Features
- **Discovery Feed:** Proactive intelligence feed on the main dashboard showing insights and recommendations.
- **Conversational AI:** Chat interface for natural language queries about business operations.
- **Episodic Memory:** Remembers past interactions and learns user patterns.
- **Tool Execution:** Can query databases, generate reports, and perform actions on behalf of the user.
- **Multi-Model Fallback:** Pre-flight model verification with automatic fallback between AI models (Google Gemini, OpenAI).
- **Webhooks:** Integration with external services via webhook handlers.

### 24.4 API Endpoint
- `POST /api/zoon` — Main AI interaction endpoint (protected, requires authentication).
- `GET /api/zoon/discovery/pulse` — Cron-based discovery pulse for proactive insights (protected by CRON_SECRET).

---

## 25. Club Zone & Zoon Club

### 25.1 Club Zone
- **Purpose:** Loyalty/membership club features for customers.
- **Features:**
  - Club membership management.
  - Exclusive offers and rewards.
  - Club tier system.

### 25.2 Zoon Club
- **Purpose:** AI-powered club features combining Zoon OS intelligence with club management.
- **Features:**
  - Smart recommendations for club members.
  - Personalized engagement strategies.

---

## 26. Notifications System

### 26.1 Purpose
Push and in-app notification management.

### 26.2 Features
- Notification creation and delivery.
- Notification templates.
- Targeted notifications (by role, region, or individual).

---

## 27. API Architecture

### 27.1 Internal APIs (`/api/*`)
All backend logic is implemented as Next.js API routes:

| Route Group | Purpose |
|---|---|
| `/api/admin/*` | Admin operations, catalog sync |
| `/api/agents/*` | Agent management |
| `/api/ai/*` | AI service endpoints |
| `/api/brands/*` | Brand management |
| `/api/catalog/*` | Product catalog |
| `/api/cities/*` | City management |
| `/api/countries/*` | Country management |
| `/api/cron/*` | Scheduled jobs |
| `/api/delivery-boys/*` | Delivery agent operations |
| `/api/exchange/*` | Price exchange operations |
| `/api/hr/*` | HR operations |
| `/api/integrations/*` | External integrations |
| `/api/internal/*` | Internal system operations |
| `/api/main-categories/*` | Main category CRUD |
| `/api/notifications/*` | Notification delivery |
| `/api/orders/*` | Order management |
| `/api/permissions/*` | RBAC operations |
| `/api/pricing/*` | Pricing calculations |
| `/api/products/*` | Product CRUD |
| `/api/provinces/*` | Province management |
| `/api/purchasing/*` | Purchase operations |
| `/api/radio/*` | Radio/playlist engine |
| `/api/regions/*` | Region management |
| `/api/roles/*` | Role management |
| `/api/settings/*` | Settings management |
| `/api/stores/*` | Store management |
| `/api/subcategories/*` | Subcategory CRUD |
| `/api/target-audiences/*` | Audience management |
| `/api/visual-ads/*` | Visual advertisements |
| `/api/warehouse/*` | Warehouse operations |
| `/api/webhooks/*` | Webhook handlers |
| `/api/zoon/*` | AI assistant operations |

### 27.2 Database
- **Primary:** Supabase (PostgreSQL) with Row Level Security (RLS).
- **ORM:** Prisma for structured queries.
- **Client:** Supabase JavaScript Client for real-time and auth operations.

---

## 28. UI/UX Specifications

### 28.1 Design System
- **Component Library:** shadcn/ui (Radix UI primitives + Tailwind CSS).
- **Icons:** React Icons (Feather Icons set), Lucide React, Heroicons, Radix Icons.
- **Charts:** Chart.js, Recharts (for analytics).
- **Maps:** Leaflet with React-Leaflet and Leaflet Draw.
- **Animations:** Framer Motion for micro-animations.
- **Toast Notifications:** Sonner + React Hot Toast.
- **Theming:** Dark/Light mode via next-themes.

### 28.2 Layout
- **Dashboard Layout:** Sidebar navigation + top header + main content area.
- **Responsive:** Mobile-first responsive design.
- **RTL Support:** Full right-to-left layout for Arabic content.

### 28.3 Forms
- **Validation:** React Hook Form + Zod schemas.
- **Input Components:** shadcn/ui form components.
- **Date Pickers:** React DatePicker + React Day Picker.

### 28.4 Tables
- **Data Tables:** TanStack Table (React Table v8) with sorting, filtering, pagination.
- **Export:** Excel (xlsx), PDF (jsPDF + jspdf-autotable), Word (docx) export capabilities.

---

## 29. Security Specifications

### 29.1 Authentication
- Supabase Auth (email/password).
- JWT token validation.
- Session management via cookies.

### 29.2 Authorization
- Role-based access control (RBAC) with granular permissions.
- Middleware-level route protection.
- Row Level Security (RLS) on Supabase tables.

### 29.3 Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 29.4 Rate Limiting
- Auth routes: 5 requests/minute.
- Sensitive routes: 10 requests/minute.
- General routes: 100 requests/minute.

### 29.5 Audit Logging
- All unauthorized access attempts are logged.
- Sensitive operations are tracked via audit logger.
- Security events are recorded with severity levels.

### 29.6 Input Validation
- All forms validated with Zod schemas.
- Server-side validation for all API endpoints.
- XSS and SQL injection protection via input sanitization.

---

## 30. Performance Specifications

### 30.1 Rendering
- Server Components by default (Next.js App Router).
- `'use client'` only when interactivity is required.
- Dynamic imports for heavy components.

### 30.2 Data Fetching
- Redux Toolkit with Async Thunks for state management.
- Memoized selectors with `createSelector`.
- Optimistic UI updates where applicable.

### 30.3 Image Optimization
- Next.js Image component for automatic optimization.
- WebP/AVIF format conversion.

### 30.4 Bundle Optimization
- Tree shaking via specific imports.
- Route-based code splitting (automatic with Next.js).
- Dynamic imports for heavy libraries (charts, maps, PDF generators).

---

## 31. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page Load Time | < 3 seconds |
| Lighthouse Performance Score | > 90 |
| Uptime | 99.9% |
| Supported Browsers | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Mobile Responsive | Yes (all breakpoints) |
| Accessibility | WCAG 2.1 AA compliance target |
| Localization | Arabic (primary), English (code/technical terms) |

---

## 32. Testing Scope for TestSprite

### 32.1 Critical User Flows to Test
1. **Authentication Flow:** Login → Dashboard → Logout.
2. **Agent Management Flow:** View agents → Filter by status → View agent details.
3. **Order Management Flow:** View orders → Filter by status → View order details.
4. **Waste Catalog Flow:** Navigate to waste management → Browse categories → View products.
5. **Pricing Flow:** Navigate to exchange → View live prices → View price ticker.
6. **Settings Flow:** Navigate to settings → Manage product types.
7. **Navigation Flow:** Test all sidebar navigation links to ensure routing works correctly.
8. **Map Interaction Flow:** View map → Toggle between agent/delivery views → Click markers.
9. **Responsive Layout:** Verify dashboard layout at different screen sizes.
10. **Error Handling:** Invalid login credentials → Proper error messages displayed.

### 32.2 Pages to Test
| Page | URL | Auth Required |
|---|---|---|
| Login | `/login` | No |
| Register | `/register` | No |
| Forgot Password | `/forgot-password` | No |
| Dashboard (Home) | `/` | Yes |
| Agents | `/agents` | Yes |
| Approved Agents | `/approved-agents` | Yes |
| Orders | `/orders` | Yes |
| Waste Management | `/waste-management` | Yes |
| Product Categories | `/product-categories` | Yes |
| Financial Management | `/financial-management` | Yes |
| Payments | `/payments` | Yes |
| Customers | `/customers` | Yes |
| Warehouse Management | `/warehouse-management` | Yes |
| Trips | `/trips` | Yes |
| Settings | `/settings` | Yes |
| Analytics | `/analytics` | Yes |
| Admins | `/admins` | Yes |
| Permissions | `/permissions` | Yes |
| Messages | `/messages` | Yes |
| Support | `/support` | Yes |
| Supplier Management | `/supplier-management` | Yes |
| Industrial Partners | `/industrial-partners` | Yes |
| Map View | `/map-view` | Yes |
| Store Management | `/store-management` | Yes |
| Club Zone | `/club-zone` | Yes |

### 32.3 API Endpoints to Test
- `POST /api/zoon` — AI assistant (requires auth).
- `GET /api/agents/*` — Agent operations.
- `GET /api/orders/*` — Order operations.
- `GET /api/products/*` — Product operations.
- `GET /api/pricing/*` — Pricing operations.
- All CRUD endpoints for categories, subcategories, products.

---

*Document generated for TestSprite automated testing platform.*  
*Last updated: April 2026*
