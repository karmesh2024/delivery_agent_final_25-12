# Delivery Agent Dashboard

## Project Overview

A comprehensive management system built with Next.js 15 and TypeScript, designed to manage all aspects of delivery operations and associated services. The system includes an advanced administrative dashboard, waste management system, exchange market, points system, radio, and supplier/warehouse management.

## Tech Stack

### Frontend
- **Next.js 15.5.7** - React framework with App Router
- **React 18.3.1** - React library
- **TypeScript** - Strong typing
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components built on Radix UI
- **Redux Toolkit** - State management
- **React Hook Form** - Form management

### Backend & Database
- **Prisma ORM** - Database management
- **Supabase** - PostgreSQL database with Auth and Realtime services
- **Zod** - Data validation

### Mapping & Charts
- **Leaflet & React-Leaflet** - Maps
- **Chart.js & Recharts** - Charts
- **React-Leaflet-Draw** - Drawing on maps

### Additional Libraries
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **QRCode** - QR code generation
- **Axios** - HTTP requests
- **React Hot Toast** - Notifications
- **Next Themes** - Dark mode
- **React DnD** - Drag and drop

## Key Features

### 1. Agent Management System
- Agent registration and activation
- Order and trip tracking
- Location and map management
- Approval system

### 2. Order Management
- Create and manage orders
- Real-time order tracking
- Advanced notification system
- Reports and analytics

### 3. Waste Exchange Market
- Professional waste exchange
- Category and classification management
- Dynamic pricing system
- Waste tracking and pricing

### 4. Scope Zone Club & Points System
- Multi-level membership system
- Comprehensive points system
- Point conversion between different types
- Rewards and loyalty system

### 5. Radio System
- Live content streaming
- Listener tracking
- Real-time system
- Cron Jobs for automatic streaming

### 6. Supplier & Warehouse Management
- Industrial supplier management
- Warehouse management
- Link warehouses to online stores
- Inventory tracking

### 7. Financial Management
- Payment management
- Financial reports
- Wallet system
- Cash points tracking

### 8. Permissions System
- Multi-level permission system
- Approval system
- Role management (Admin, Agent, Customer)
- Activity logs

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin dashboard
│   ├── agents/             # Agent management
│   ├── orders/             # Order management
│   ├── waste-management/   # Waste management
│   ├── club-zone/          # Scope Zone Club
│   └── ...                 # Other pages
├── components/             # Reusable components
├── domains/                # Business domain
├── infrastructure/         # Infrastructure
├── services/              # External services
├── store/                 # Redux Store
├── types/                 # TypeScript Types
└── utils/                 # Utility functions

docs/                      # Arabic documentation
prisma/                    # Database schema
public/                    # Static files
supabase/                  # Supabase settings
```

## Available Commands

```bash
# Run development environment
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint

# Apply migrations
npm run migrate

# Generate Prisma Client
npm run postinstall
```

## Environment Setup

### Required .env variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
DATABASE_URL=
```

### Installation Steps

1. Clone the project
```bash
git clone <repository-url>
cd delivery_agent_final_25-12
```

2. Install dependencies
```bash
npm install
```

3. Setup database
```bash
npx prisma generate
npx prisma db push
```

4. Run the project
```bash
npm run dev
```

## Recent Features

### V1.5
- Real-time analytics for live streaming
- Improved expected time system
- Real-time location fixes

### V1.3
- Simplified club points system
- Permission system improvements
- Enhanced waste management

### Recent Fixes
- Fixed location issue in radio_listeners
- Updated streaming link in mobile
- Fixed TIMED_OUT error in Real-time

## Documentation

The project includes comprehensive Arabic documentation in the `docs/` folder, including:

- Mobile app implementation guide
- Dashboard implementation guide
- Club and Radio points guide
- Professional waste exchange documentation
- Migration execution steps
- Vercel deployment guide

## Future Roadmap

- Additional dashboard improvements
- More analytics and reports
- Enhanced notification system
- Multi-language support

## License

This project is privately owned.

## Support

For any inquiries or issues, please refer to the documentation folder or contact the development team.
